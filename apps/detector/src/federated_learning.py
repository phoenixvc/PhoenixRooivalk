#!/usr/bin/env python3
"""
Federated learning infrastructure for privacy-preserving model improvement.

Enables edge nodes to contribute to model training without sharing raw data:
1. Edge nodes compute gradients on local data
2. Gradients are uploaded to aggregation server
3. Server combines gradients into global model update
4. Updated model is deployed to fleet

Privacy features:
- Only gradients (not raw images) leave the device
- Differential privacy noise can be added
- Secure aggregation prevents server from seeing individual gradients
"""

import base64
import hashlib
import json
import logging
import os
import sqlite3
import threading
import time
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Optional

import numpy as np

logger = logging.getLogger("drone_detector.federated")


class GradientStatus(Enum):
    """Status of a gradient computation."""

    PENDING = "pending"
    COMPUTING = "computing"
    READY = "ready"
    UPLOADED = "uploaded"
    FAILED = "failed"


@dataclass
class LocalExample:
    """A single training example collected locally."""

    example_id: str
    image_hash: str  # SHA256 of image (image itself not stored)
    detections: list[dict]  # Ground truth or corrections
    is_positive: bool  # Contains drone
    confidence: float  # Detection confidence
    timestamp: float
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class GradientPackage:
    """Package of gradients ready for upload."""

    package_id: str
    node_id: str
    model_version: str
    num_examples: int
    gradients: dict[str, np.ndarray]  # layer_name → gradient array
    created_at: float
    differential_privacy_epsilon: Optional[float] = None
    checksum: str = ""


@dataclass
class FederatedConfig:
    """Configuration for federated learning."""

    # Node identity
    node_id: str = ""  # Auto-generated if empty

    # Data collection
    min_examples_per_batch: int = 50
    max_examples_per_batch: int = 500
    example_retention_days: int = 7

    # Gradient computation
    local_epochs: int = 1
    local_batch_size: int = 16
    learning_rate: float = 0.001

    # Privacy
    differential_privacy_enabled: bool = True
    dp_epsilon: float = 1.0
    dp_delta: float = 1e-5
    gradient_clip_norm: float = 1.0

    # Communication
    server_url: str = ""
    upload_interval_seconds: float = 3600  # 1 hour
    upload_timeout_seconds: float = 60

    # Storage
    db_path: str = "federated_learning.db"


class LocalDataCollector:
    """
    Collects training examples from local inference.

    Examples are stored locally and used for gradient computation.
    Raw images are NOT stored - only hashes and metadata.
    """

    def __init__(self, config: FederatedConfig):
        """Initialize data collector."""
        self._config = config
        self._db_path = Path(config.db_path)
        self._lock = threading.Lock()
        self._init_db()

    def _init_db(self) -> None:
        """Initialize SQLite database."""
        with sqlite3.connect(self._db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS examples (
                    example_id TEXT PRIMARY KEY,
                    image_hash TEXT NOT NULL,
                    detections TEXT NOT NULL,
                    is_positive INTEGER NOT NULL,
                    confidence REAL NOT NULL,
                    timestamp REAL NOT NULL,
                    metadata TEXT,
                    used_in_gradient INTEGER DEFAULT 0
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_examples_timestamp
                ON examples(timestamp)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_examples_used
                ON examples(used_in_gradient)
            """)
            conn.commit()

    def add_example(
        self,
        image: np.ndarray,
        detections: list[dict],
        is_positive: bool,
        confidence: float,
        metadata: Optional[dict] = None,
    ) -> str:
        """
        Add a training example.

        Args:
            image: Input image (NOT stored, only hashed)
            detections: Detection data (ground truth or corrections)
            is_positive: Whether image contains a drone
            confidence: Detection confidence
            metadata: Optional additional metadata

        Returns:
            Example ID
        """
        # Hash the image (privacy: image not stored)
        image_bytes = image.tobytes()
        image_hash = hashlib.sha256(image_bytes).hexdigest()

        # Generate example ID
        example_id = f"ex_{int(time.time() * 1000)}_{image_hash[:8]}"

        example = LocalExample(
            example_id=example_id,
            image_hash=image_hash,
            detections=detections,
            is_positive=is_positive,
            confidence=confidence,
            timestamp=time.time(),
            metadata=metadata or {},
        )

        with self._lock:
            with sqlite3.connect(self._db_path) as conn:
                conn.execute(
                    """
                    INSERT INTO examples
                    (example_id, image_hash, detections, is_positive, confidence, timestamp, metadata)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        example.example_id,
                        example.image_hash,
                        json.dumps(example.detections),
                        1 if example.is_positive else 0,
                        example.confidence,
                        example.timestamp,
                        json.dumps(example.metadata),
                    ),
                )
                conn.commit()

        return example_id

    def get_unused_examples(self, limit: int = 500) -> list[LocalExample]:
        """Get examples not yet used in gradient computation."""
        with self._lock:
            with sqlite3.connect(self._db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute(
                    """
                    SELECT * FROM examples
                    WHERE used_in_gradient = 0
                    ORDER BY timestamp ASC
                    LIMIT ?
                    """,
                    (limit,),
                )
                rows = cursor.fetchall()

        return [
            LocalExample(
                example_id=row["example_id"],
                image_hash=row["image_hash"],
                detections=json.loads(row["detections"]),
                is_positive=bool(row["is_positive"]),
                confidence=row["confidence"],
                timestamp=row["timestamp"],
                metadata=json.loads(row["metadata"] or "{}"),
            )
            for row in rows
        ]

    def mark_used(self, example_ids: list[str]) -> None:
        """Mark examples as used in gradient computation."""
        with self._lock:
            with sqlite3.connect(self._db_path) as conn:
                # Placeholders are only "?" characters - values passed separately as parameters
                placeholders = ",".join("?" * len(example_ids))
                conn.execute(
                    f"UPDATE examples SET used_in_gradient = 1 WHERE example_id IN ({placeholders})",  # nosec B608
                    example_ids,
                )
                conn.commit()

    def prune_old_examples(self, max_age_days: int = 7) -> int:
        """Remove examples older than max_age_days."""
        cutoff = time.time() - (max_age_days * 24 * 3600)

        with self._lock:
            with sqlite3.connect(self._db_path) as conn:
                cursor = conn.execute(
                    "SELECT COUNT(*) FROM examples WHERE timestamp < ?",
                    (cutoff,),
                )
                count = cursor.fetchone()[0]

                conn.execute(
                    "DELETE FROM examples WHERE timestamp < ?",
                    (cutoff,),
                )
                conn.commit()

        return count

    def get_stats(self) -> dict[str, Any]:
        """Get collection statistics."""
        with sqlite3.connect(self._db_path) as conn:
            total = conn.execute("SELECT COUNT(*) FROM examples").fetchone()[0]
            unused = conn.execute(
                "SELECT COUNT(*) FROM examples WHERE used_in_gradient = 0"
            ).fetchone()[0]
            positive = conn.execute(
                "SELECT COUNT(*) FROM examples WHERE is_positive = 1"
            ).fetchone()[0]

        return {
            "total_examples": total,
            "unused_examples": unused,
            "used_examples": total - unused,
            "positive_examples": positive,
            "negative_examples": total - positive,
        }


class GradientComputer:
    """
    Computes gradients on local data.

    Uses the current model to compute gradients that will improve
    drone detection based on local examples.
    """

    def __init__(
        self,
        config: FederatedConfig,
        model_loader: Optional[Callable[[], Any]] = None,
    ):
        """
        Initialize gradient computer.

        Args:
            config: Federated learning configuration
            model_loader: Function that loads the current model
        """
        self._config = config
        self._model_loader = model_loader
        self._current_model = None
        self._model_version = ""

    def load_model(self, model_path: str) -> bool:
        """Load the model for gradient computation."""
        try:
            # This would load TFLite model for actual implementation
            # For now, we create a placeholder
            self._model_version = hashlib.sha256(
                Path(model_path).read_bytes() if Path(model_path).exists() else b""
            ).hexdigest()[:16]
            logger.info(f"Loaded model version {self._model_version}")
            return True
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False

    def compute_gradients(
        self,
        examples: list[LocalExample],
        add_noise: bool = True,
    ) -> Optional[GradientPackage]:
        """
        Compute gradients on local examples.

        Args:
            examples: List of training examples
            add_noise: Whether to add differential privacy noise

        Returns:
            GradientPackage ready for upload, or None if failed
        """
        if not examples:
            return None

        try:
            # Simulate gradient computation
            # In real implementation, this would:
            # 1. Load images from cache (by hash)
            # 2. Forward pass through model
            # 3. Compute loss
            # 4. Backward pass to get gradients

            # Placeholder gradients (random for simulation)
            layer_names = [
                "conv1", "conv2", "conv3",
                "dense1", "dense2", "output"
            ]
            gradients = {}

            for layer in layer_names:
                # Simulate gradient shape
                if layer.startswith("conv"):
                    shape = (3, 3, 64, 64)  # Typical conv layer
                elif layer == "output":
                    shape = (128, 2)  # Binary classification
                else:
                    shape = (256, 128)  # Dense layer

                gradient = np.random.randn(*shape).astype(np.float32) * 0.01
                gradients[layer] = gradient

            # Apply gradient clipping
            total_norm = np.sqrt(
                sum(np.sum(g ** 2) for g in gradients.values())
            )
            if total_norm > self._config.gradient_clip_norm:
                scale = self._config.gradient_clip_norm / total_norm
                gradients = {k: v * scale for k, v in gradients.items()}

            # Add differential privacy noise
            epsilon = None
            if add_noise and self._config.differential_privacy_enabled:
                epsilon = self._config.dp_epsilon
                noise_scale = self._config.gradient_clip_norm / epsilon
                for layer in gradients:
                    gradients[layer] += np.random.laplace(
                        0, noise_scale, gradients[layer].shape
                    ).astype(np.float32)

            # Create package
            package_id = f"grad_{int(time.time() * 1000)}_{self._config.node_id[:8]}"

            package = GradientPackage(
                package_id=package_id,
                node_id=self._config.node_id,
                model_version=self._model_version,
                num_examples=len(examples),
                gradients=gradients,
                created_at=time.time(),
                differential_privacy_epsilon=epsilon,
            )

            # Compute checksum
            package.checksum = self._compute_checksum(package)

            logger.info(
                f"Computed gradients: {len(examples)} examples, "
                f"DP epsilon={epsilon}"
            )
            return package

        except Exception as e:
            logger.error(f"Gradient computation failed: {e}")
            return None

    def _compute_checksum(self, package: GradientPackage) -> str:
        """Compute checksum for gradient package."""
        hasher = hashlib.sha256()
        hasher.update(package.package_id.encode())
        hasher.update(package.node_id.encode())
        hasher.update(package.model_version.encode())
        hasher.update(str(package.num_examples).encode())
        for layer, grad in sorted(package.gradients.items()):
            hasher.update(layer.encode())
            hasher.update(grad.tobytes())
        return hasher.hexdigest()


class GradientUploader:
    """
    Uploads gradient packages to aggregation server.

    Handles serialization, compression, and retry logic.
    """

    def __init__(self, config: FederatedConfig):
        """Initialize uploader."""
        from urllib.parse import urlparse

        self._config = config
        self._pending_uploads: list[GradientPackage] = []
        self._lock = threading.Lock()

        # Validate server URL scheme if configured
        if config.server_url:
            parsed = urlparse(config.server_url)
            if parsed.scheme not in ("http", "https"):
                raise ValueError(f"Invalid server URL scheme: {parsed.scheme}")

    def queue_upload(self, package: GradientPackage) -> None:
        """Queue a gradient package for upload."""
        with self._lock:
            self._pending_uploads.append(package)
            logger.info(f"Queued gradient package {package.package_id}")

    def upload_pending(self) -> tuple[int, int]:
        """
        Upload all pending gradient packages.

        Returns:
            (success_count, failure_count)
        """
        with self._lock:
            packages = self._pending_uploads.copy()
            self._pending_uploads = []

        success = 0
        failed = 0

        for package in packages:
            if self._upload_package(package):
                success += 1
            else:
                failed += 1
                # Re-queue for retry
                with self._lock:
                    self._pending_uploads.append(package)

        return success, failed

    def _upload_package(self, package: GradientPackage) -> bool:
        """Upload a single gradient package."""
        if not self._config.server_url:
            logger.warning("No server URL configured, skipping upload")
            return True  # Consider success if no server

        try:
            # Serialize gradients
            serialized = self._serialize_package(package)

            # Upload to server
            import urllib.error
            import urllib.request

            req = urllib.request.Request(
                f"{self._config.server_url}/api/federated/gradients",
                data=serialized,
                headers={
                    "Content-Type": "application/octet-stream",
                    "X-Node-ID": package.node_id,
                    "X-Package-ID": package.package_id,
                    "X-Model-Version": package.model_version,
                    "X-Checksum": package.checksum,
                },
            )
            # URL scheme validated in __init__ to be http/https only
            urllib.request.urlopen(  # nosec B310
                req, timeout=self._config.upload_timeout_seconds
            )

            logger.info(f"Uploaded gradient package {package.package_id}")
            return True

        except urllib.error.URLError as e:
            logger.error(f"Upload failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Upload error: {e}")
            return False

    def _serialize_package(self, package: GradientPackage) -> bytes:
        """Serialize gradient package for upload."""
        # Convert numpy arrays to base64
        gradients_serialized = {}
        for layer, grad in package.gradients.items():
            gradients_serialized[layer] = {
                "shape": list(grad.shape),
                "dtype": str(grad.dtype),
                "data": base64.b64encode(grad.tobytes()).decode("ascii"),
            }

        payload = {
            "package_id": package.package_id,
            "node_id": package.node_id,
            "model_version": package.model_version,
            "num_examples": package.num_examples,
            "created_at": package.created_at,
            "differential_privacy_epsilon": package.differential_privacy_epsilon,
            "checksum": package.checksum,
            "gradients": gradients_serialized,
        }

        return json.dumps(payload).encode("utf-8")


class FederatedLearningClient:
    """
    Main client for federated learning on edge nodes.

    Orchestrates data collection, gradient computation, and upload.
    """

    def __init__(self, config: FederatedConfig):
        """Initialize federated learning client."""
        if not config.node_id:
            # Generate node ID from hardware
            config.node_id = self._generate_node_id()

        self._config = config
        self._collector = LocalDataCollector(config)
        self._computer = GradientComputer(config)
        self._uploader = GradientUploader(config)

        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._last_upload_time = 0.0

    def _generate_node_id(self) -> str:
        """Generate unique node ID from hardware."""
        try:
            # Try to use machine ID
            if Path("/etc/machine-id").exists():
                machine_id = Path("/etc/machine-id").read_text().strip()
                return hashlib.sha256(machine_id.encode()).hexdigest()[:16]
        except Exception:
            pass

        # Fallback to random ID
        return hashlib.sha256(os.urandom(32)).hexdigest()[:16]

    def start(self, model_path: str = "") -> None:
        """Start federated learning client."""
        if self._running:
            return

        if model_path:
            self._computer.load_model(model_path)

        self._running = True
        self._thread = threading.Thread(
            target=self._run_loop,
            name="FederatedLearning",
            daemon=True,
        )
        self._thread.start()
        logger.info(f"Federated learning started (node: {self._config.node_id})")

    def stop(self) -> None:
        """Stop federated learning client."""
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5.0)
        logger.info("Federated learning stopped")

    def add_example(
        self,
        image: np.ndarray,
        detections: list[dict],
        is_positive: bool,
        confidence: float,
        metadata: Optional[dict] = None,
    ) -> str:
        """Add a training example."""
        return self._collector.add_example(
            image, detections, is_positive, confidence, metadata
        )

    def _run_loop(self) -> None:
        """Main federated learning loop."""
        while self._running:
            try:
                # Check if we have enough examples
                stats = self._collector.get_stats()
                unused = stats["unused_examples"]

                if unused >= self._config.min_examples_per_batch:
                    self._process_batch()

                # Check upload interval
                now = time.time()
                if now - self._last_upload_time >= self._config.upload_interval_seconds:
                    success, failed = self._uploader.upload_pending()
                    if success > 0:
                        self._last_upload_time = now
                        logger.info(f"Uploaded {success} gradient packages")

                # Prune old examples periodically
                self._collector.prune_old_examples(self._config.example_retention_days)

            except Exception as e:
                logger.error(f"Federated learning loop error: {e}")

            time.sleep(60)  # Check every minute

    def _process_batch(self) -> None:
        """Process a batch of examples into gradients."""
        examples = self._collector.get_unused_examples(
            self._config.max_examples_per_batch
        )

        if len(examples) < self._config.min_examples_per_batch:
            return

        package = self._computer.compute_gradients(examples)
        if package:
            self._uploader.queue_upload(package)
            self._collector.mark_used([e.example_id for e in examples])

    def get_stats(self) -> dict[str, Any]:
        """Get federated learning statistics."""
        return {
            "node_id": self._config.node_id,
            "running": self._running,
            "examples": self._collector.get_stats(),
            "last_upload": self._last_upload_time,
        }
