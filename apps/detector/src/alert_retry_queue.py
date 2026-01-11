#!/usr/bin/env python3
"""
Alert retry queue with persistent storage.

Provides reliable alert delivery with automatic retries and exponential backoff.
Failed alerts are stored in SQLite and retried asynchronously.
"""

import json
import logging
import sqlite3
import threading
import time
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from queue import Queue
from typing import Any, Callable, Optional

logger = logging.getLogger("drone_detector.alert_retry")


class AlertStatus(Enum):
    """Alert delivery status."""

    PENDING = "pending"
    IN_FLIGHT = "in_flight"
    DELIVERED = "delivered"
    FAILED = "failed"
    DEAD_LETTER = "dead_letter"  # Max retries exceeded


@dataclass
class QueuedAlert:
    """Alert queued for delivery."""

    id: int
    payload: dict
    created_at: float
    retry_count: int
    next_retry_at: float
    status: AlertStatus
    last_error: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "payload": self.payload,
            "created_at": self.created_at,
            "retry_count": self.retry_count,
            "next_retry_at": self.next_retry_at,
            "status": self.status.value,
            "last_error": self.last_error,
        }


class AlertRetryQueue:
    """
    Persistent alert retry queue with SQLite backing.

    Features:
    - Immediate delivery attempt (fire-and-forget for fast path)
    - Failed alerts stored to SQLite for retry
    - Exponential backoff between retries
    - Dead letter queue for alerts exceeding max retries
    - Background thread for async retries
    - Bounded queue size to prevent memory exhaustion
    """

    # Default configuration
    DEFAULT_MAX_RETRIES = 5
    DEFAULT_BASE_DELAY_SECONDS = 2.0
    DEFAULT_MAX_DELAY_SECONDS = 300.0  # 5 minutes max
    DEFAULT_MAX_QUEUE_SIZE = 1000
    DEFAULT_RETRY_INTERVAL_SECONDS = 5.0

    def __init__(
        self,
        db_path: str = "alert_queue.db",
        send_func: Optional[Callable[[dict], bool]] = None,
        max_retries: int = DEFAULT_MAX_RETRIES,
        base_delay_seconds: float = DEFAULT_BASE_DELAY_SECONDS,
        max_delay_seconds: float = DEFAULT_MAX_DELAY_SECONDS,
        max_queue_size: int = DEFAULT_MAX_QUEUE_SIZE,
        retry_interval_seconds: float = DEFAULT_RETRY_INTERVAL_SECONDS,
    ):
        """
        Initialize alert retry queue.

        Args:
            db_path: Path to SQLite database file
            send_func: Function to send alerts (returns True on success)
            max_retries: Maximum retry attempts before dead letter
            base_delay_seconds: Base delay for exponential backoff
            max_delay_seconds: Maximum delay between retries
            max_queue_size: Maximum alerts to queue (oldest dropped when full)
            retry_interval_seconds: How often to check for retries
        """
        self._db_path = Path(db_path)
        self._send_func = send_func
        self._max_retries = max_retries
        self._base_delay = base_delay_seconds
        self._max_delay = max_delay_seconds
        self._max_queue_size = max_queue_size
        self._retry_interval = retry_interval_seconds

        # Stats
        self._alerts_queued = 0
        self._alerts_delivered = 0
        self._alerts_failed = 0
        self._alerts_dead_lettered = 0

        # Threading
        self._running = False
        self._retry_thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()

        # In-memory queue for fast path
        self._immediate_queue: Queue[dict] = Queue(maxsize=100)

        # Initialize database
        self._init_db()

    def _init_db(self) -> None:
        """Initialize SQLite database schema."""
        with sqlite3.connect(self._db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS alert_queue (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    payload TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    retry_count INTEGER DEFAULT 0,
                    next_retry_at REAL NOT NULL,
                    status TEXT DEFAULT 'pending',
                    last_error TEXT
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_status_retry
                ON alert_queue(status, next_retry_at)
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS dead_letter_queue (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    original_id INTEGER,
                    payload TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    failed_at REAL NOT NULL,
                    retry_count INTEGER,
                    last_error TEXT
                )
            """)
            conn.commit()

    def set_send_func(self, send_func: Callable[[dict], bool]) -> None:
        """Set the function used to send alerts."""
        self._send_func = send_func

    def start(self) -> None:
        """Start background retry thread."""
        if self._running:
            return

        self._running = True
        self._retry_thread = threading.Thread(
            target=self._retry_loop,
            name="AlertRetryThread",
            daemon=True,
        )
        self._retry_thread.start()
        logger.info("Alert retry queue started")

    def stop(self) -> None:
        """Stop background retry thread."""
        self._running = False
        if self._retry_thread and self._retry_thread.is_alive():
            self._retry_thread.join(timeout=5.0)
        logger.info("Alert retry queue stopped")

    def enqueue(self, payload: dict, try_immediate: bool = True) -> bool:
        """
        Enqueue an alert for delivery.

        Args:
            payload: Alert data to send
            try_immediate: Try immediate delivery first (default True)

        Returns:
            True if alert was delivered immediately or queued successfully
        """
        # Try immediate delivery first (fast path)
        if try_immediate and self._send_func:
            try:
                if self._send_func(payload):
                    self._alerts_delivered += 1
                    return True
            except Exception as e:
                logger.debug(f"Immediate delivery failed: {e}")

        # Queue for retry
        return self._persist_alert(payload)

    def _persist_alert(self, payload: dict, error: Optional[str] = None) -> bool:
        """Persist alert to SQLite queue."""
        now = time.time()

        with self._lock:
            try:
                with sqlite3.connect(self._db_path) as conn:
                    # Check queue size
                    cursor = conn.execute(
                        "SELECT COUNT(*) FROM alert_queue WHERE status = 'pending'"
                    )
                    count = cursor.fetchone()[0]

                    if count >= self._max_queue_size:
                        # Drop oldest alerts
                        conn.execute("""
                            DELETE FROM alert_queue
                            WHERE id IN (
                                SELECT id FROM alert_queue
                                WHERE status = 'pending'
                                ORDER BY created_at ASC
                                LIMIT 10
                            )
                        """)
                        logger.warning(
                            f"Alert queue full ({self._max_queue_size}), "
                            "dropped 10 oldest alerts"
                        )

                    # Insert new alert
                    conn.execute(
                        """
                        INSERT INTO alert_queue
                        (payload, created_at, retry_count, next_retry_at, status, last_error)
                        VALUES (?, ?, 0, ?, 'pending', ?)
                        """,
                        (json.dumps(payload), now, now + self._base_delay, error),
                    )
                    conn.commit()

                self._alerts_queued += 1
                return True

            except sqlite3.Error as e:
                logger.error(f"Failed to queue alert: {e}")
                return False

    def _retry_loop(self) -> None:
        """Background thread for processing retries."""
        while self._running:
            try:
                self._process_pending_alerts()
            except Exception as e:
                logger.error(f"Error in retry loop: {e}")

            # Sleep in small intervals to allow quick shutdown
            for _ in range(int(self._retry_interval)):
                if not self._running:
                    break
                time.sleep(1.0)

    def _process_pending_alerts(self) -> None:
        """Process alerts ready for retry."""
        if not self._send_func:
            return

        now = time.time()

        with sqlite3.connect(self._db_path) as conn:
            conn.row_factory = sqlite3.Row

            # Get alerts ready for retry
            cursor = conn.execute(
                """
                SELECT id, payload, created_at, retry_count, next_retry_at, last_error
                FROM alert_queue
                WHERE status = 'pending' AND next_retry_at <= ?
                ORDER BY created_at ASC
                LIMIT 10
                """,
                (now,),
            )
            alerts = cursor.fetchall()

        for row in alerts:
            alert = QueuedAlert(
                id=row["id"],
                payload=json.loads(row["payload"]),
                created_at=row["created_at"],
                retry_count=row["retry_count"],
                next_retry_at=row["next_retry_at"],
                status=AlertStatus.PENDING,
                last_error=row["last_error"],
            )

            self._process_single_alert(alert)

    def _process_single_alert(self, alert: QueuedAlert) -> None:
        """Process a single alert."""
        try:
            if self._send_func(alert.payload):
                # Success - remove from queue
                self._mark_delivered(alert.id)
                self._alerts_delivered += 1
                logger.debug(f"Alert {alert.id} delivered after {alert.retry_count} retries")
            else:
                self._handle_failure(alert, "Send function returned False")
        except Exception as e:
            self._handle_failure(alert, str(e))

    def _mark_delivered(self, alert_id: int) -> None:
        """Mark alert as delivered and remove from queue."""
        with sqlite3.connect(self._db_path) as conn:
            conn.execute("DELETE FROM alert_queue WHERE id = ?", (alert_id,))
            conn.commit()

    def _handle_failure(self, alert: QueuedAlert, error: str) -> None:
        """Handle failed delivery attempt."""
        new_retry_count = alert.retry_count + 1

        if new_retry_count >= self._max_retries:
            # Move to dead letter queue
            self._dead_letter(alert, error)
            self._alerts_dead_lettered += 1
            logger.warning(
                f"Alert {alert.id} moved to dead letter queue "
                f"after {new_retry_count} attempts: {error}"
            )
        else:
            # Schedule retry with exponential backoff
            delay = min(
                self._base_delay * (2 ** new_retry_count),
                self._max_delay,
            )
            next_retry = time.time() + delay

            with sqlite3.connect(self._db_path) as conn:
                conn.execute(
                    """
                    UPDATE alert_queue
                    SET retry_count = ?, next_retry_at = ?, last_error = ?
                    WHERE id = ?
                    """,
                    (new_retry_count, next_retry, error, alert.id),
                )
                conn.commit()

            logger.debug(
                f"Alert {alert.id} retry {new_retry_count}/{self._max_retries} "
                f"scheduled in {delay:.1f}s"
            )

    def _dead_letter(self, alert: QueuedAlert, error: str) -> None:
        """Move alert to dead letter queue."""
        now = time.time()

        with sqlite3.connect(self._db_path) as conn:
            conn.execute(
                """
                INSERT INTO dead_letter_queue
                (original_id, payload, created_at, failed_at, retry_count, last_error)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    alert.id,
                    json.dumps(alert.payload),
                    alert.created_at,
                    now,
                    alert.retry_count,
                    error,
                ),
            )
            conn.execute("DELETE FROM alert_queue WHERE id = ?", (alert.id,))
            conn.commit()

        self._alerts_failed += 1

    def get_queue_stats(self) -> dict[str, Any]:
        """Get queue statistics."""
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.execute(
                "SELECT COUNT(*) FROM alert_queue WHERE status = 'pending'"
            )
            pending = cursor.fetchone()[0]

            cursor = conn.execute("SELECT COUNT(*) FROM dead_letter_queue")
            dead_lettered = cursor.fetchone()[0]

        return {
            "pending": pending,
            "dead_lettered": dead_lettered,
            "total_queued": self._alerts_queued,
            "total_delivered": self._alerts_delivered,
            "total_failed": self._alerts_failed,
            "running": self._running,
        }

    def get_pending_alerts(self, limit: int = 100) -> list[QueuedAlert]:
        """Get pending alerts."""
        with sqlite3.connect(self._db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                """
                SELECT id, payload, created_at, retry_count, next_retry_at, status, last_error
                FROM alert_queue
                WHERE status = 'pending'
                ORDER BY created_at ASC
                LIMIT ?
                """,
                (limit,),
            )
            rows = cursor.fetchall()

        return [
            QueuedAlert(
                id=row["id"],
                payload=json.loads(row["payload"]),
                created_at=row["created_at"],
                retry_count=row["retry_count"],
                next_retry_at=row["next_retry_at"],
                status=AlertStatus(row["status"]),
                last_error=row["last_error"],
            )
            for row in rows
        ]

    def get_dead_letters(self, limit: int = 100) -> list[dict]:
        """Get dead letter queue entries."""
        with sqlite3.connect(self._db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                """
                SELECT * FROM dead_letter_queue
                ORDER BY failed_at DESC
                LIMIT ?
                """,
                (limit,),
            )
            rows = cursor.fetchall()

        return [dict(row) for row in rows]

    def retry_dead_letter(self, dead_letter_id: int) -> bool:
        """Retry a dead letter alert."""
        with sqlite3.connect(self._db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT payload FROM dead_letter_queue WHERE id = ?",
                (dead_letter_id,),
            )
            row = cursor.fetchone()

            if not row:
                return False

            payload = json.loads(row["payload"])

            # Delete from dead letter queue
            conn.execute(
                "DELETE FROM dead_letter_queue WHERE id = ?",
                (dead_letter_id,),
            )
            conn.commit()

        # Re-enqueue
        return self._persist_alert(payload)

    def clear_queue(self) -> int:
        """Clear all pending alerts. Returns count of cleared alerts."""
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM alert_queue")
            count = cursor.fetchone()[0]
            conn.execute("DELETE FROM alert_queue")
            conn.commit()

        return count

    def clear_dead_letters(self) -> int:
        """Clear dead letter queue. Returns count of cleared alerts."""
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM dead_letter_queue")
            count = cursor.fetchone()[0]
            conn.execute("DELETE FROM dead_letter_queue")
            conn.commit()

        return count


class RetryingWebhookHandler:
    """
    Webhook alert handler with retry queue integration.

    Drop-in replacement for WebhookAlertHandler with reliable delivery.
    """

    def __init__(
        self,
        webhook_url: str,
        timeout_seconds: float = 5.0,
        cooldown_seconds: float = 1.0,
        max_retries: int = 5,
        db_path: str = "alert_queue.db",
    ):
        """
        Initialize retrying webhook handler.

        Args:
            webhook_url: URL to send alerts to
            timeout_seconds: HTTP request timeout
            cooldown_seconds: Minimum time between alerts
            max_retries: Maximum retry attempts
            db_path: Path to SQLite database for retry queue
        """
        from urllib.parse import urlparse

        parsed = urlparse(webhook_url)
        if parsed.scheme not in ("http", "https"):
            raise ValueError(f"Invalid URL scheme: {parsed.scheme}")

        self._webhook_url = webhook_url
        self._timeout = timeout_seconds
        self._cooldown = cooldown_seconds
        self._last_alert_time = 0.0

        # Initialize retry queue
        self._queue = AlertRetryQueue(
            db_path=db_path,
            send_func=self._do_send,
            max_retries=max_retries,
        )
        self._queue.start()

    def _do_send(self, payload: dict) -> bool:
        """Actually send the webhook request."""
        import urllib.error
        import urllib.request

        try:
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                self._webhook_url,
                data=data,
                headers={"Content-Type": "application/json"},
            )
            # URL scheme validated in __init__ to be http/https only
            # nosemgrep: python.lang.security.audit.dynamic-urllib-use-detected
            urllib.request.urlopen(req, timeout=self._timeout)  # nosec B310
            return True
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            raise RuntimeError(f"Webhook failed: {e}") from e

    def send_alert(self, detection, frame_data) -> bool:
        """
        Send alert with retry support.

        Args:
            detection: Detection object
            frame_data: Frame data object

        Returns:
            True if alert was sent or queued successfully
        """
        # Cooldown check
        now = time.time()
        if now - self._last_alert_time < self._cooldown:
            return False

        self._last_alert_time = now

        # Build payload
        payload = {
            "event": "drone_detected",
            "timestamp": datetime.now().isoformat(),
            "frame_number": frame_data.frame_number,
            "detection": detection.to_dict(),
            "source_id": frame_data.source_id,
        }

        # Enqueue with immediate delivery attempt
        return self._queue.enqueue(payload, try_immediate=True)

    def flush(self) -> None:
        """Flush is a no-op for retry queue (handled by background thread)."""
        pass

    def stop(self) -> None:
        """Stop the retry queue."""
        self._queue.stop()

    @property
    def handler_info(self) -> dict[str, Any]:
        """Get handler information."""
        stats = self._queue.get_queue_stats()
        return {
            "type": "retrying_webhook",
            "url": self._webhook_url,
            "timeout": self._timeout,
            "cooldown": self._cooldown,
            **stats,
        }
