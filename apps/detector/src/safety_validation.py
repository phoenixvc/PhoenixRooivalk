#!/usr/bin/env python3
"""
Safety validation for detector configuration.

Ensures safety-critical parameters are within acceptable bounds before
the system starts. Prevents dangerous configurations from being deployed.
"""

import logging
from dataclasses import dataclass
from enum import Enum
from typing import Any

logger = logging.getLogger("drone_detector.safety")


class ValidationSeverity(Enum):
    """Severity of validation result."""

    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class ValidationResult:
    """Result of a single validation check."""

    name: str
    passed: bool
    severity: ValidationSeverity
    message: str
    value: Any = None
    expected: Any = None

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "name": self.name,
            "passed": self.passed,
            "severity": self.severity.value,
            "message": self.message,
            "value": self.value,
            "expected": self.expected,
        }


class SafetyValidationError(Exception):
    """Raised when safety validation fails with critical errors."""

    def __init__(self, results: list[ValidationResult]):
        self.results = results
        failed = [r for r in results if not r.passed]
        message = f"Safety validation failed with {len(failed)} error(s):\n"
        for r in failed:
            message += f"  - [{r.severity.value.upper()}] {r.name}: {r.message}\n"
        super().__init__(message)


# =============================================================================
# Safety Limits (Hardcoded, Non-Configurable)
# =============================================================================


class SafetyLimits:
    """
    Immutable safety limits.

    These values are hardcoded and cannot be changed via configuration.
    They represent the absolute bounds for safe operation.
    """

    # Fire net confidence must be at least this high
    FIRE_NET_MIN_CONFIDENCE_FLOOR = 0.70

    # Fire net must require at least this many tracked frames
    FIRE_NET_MIN_TRACK_FRAMES_FLOOR = 5

    # Fire net cooldown must be at least this long (seconds)
    FIRE_NET_COOLDOWN_FLOOR = 5.0

    # Minimum safe distance for fire net (meters)
    FIRE_NET_MIN_DISTANCE_FLOOR = 2.0

    # Maximum targeting distance (meters) - beyond this is unreliable
    FIRE_NET_MAX_DISTANCE_CEILING = 200.0

    # Maximum target velocity for engagement (m/s)
    FIRE_NET_MAX_VELOCITY_CEILING = 50.0

    # Detection confidence floor (below this is too noisy)
    DETECTION_CONFIDENCE_FLOOR = 0.20

    # Maximum frame processing time before warning (ms)
    MAX_FRAME_PROCESSING_WARNING_MS = 500

    # Maximum tracks before performance impact
    MAX_TRACKS_WARNING = 100


# =============================================================================
# Validators
# =============================================================================


def validate_fire_net_settings(settings) -> list[ValidationResult]:
    """
    Validate fire net safety settings.

    Args:
        settings: TargetingSettings instance

    Returns:
        List of validation results
    """
    results = []

    # Arm requirement must be enabled
    if hasattr(settings, "fire_net_arm_required"):
        results.append(
            ValidationResult(
                name="fire_net_arm_required",
                passed=settings.fire_net_arm_required is True,
                severity=ValidationSeverity.CRITICAL,
                message=(
                    "Fire net arm requirement must be enabled"
                    if not settings.fire_net_arm_required
                    else "Arm requirement is enabled"
                ),
                value=settings.fire_net_arm_required,
                expected=True,
            )
        )

    # Minimum confidence check
    if hasattr(settings, "fire_net_min_confidence"):
        conf = settings.fire_net_min_confidence
        floor = SafetyLimits.FIRE_NET_MIN_CONFIDENCE_FLOOR
        passed = conf >= floor
        results.append(
            ValidationResult(
                name="fire_net_min_confidence",
                passed=passed,
                severity=ValidationSeverity.CRITICAL if not passed else ValidationSeverity.INFO,
                message=(
                    f"Fire net min confidence ({conf:.2f}) is below safety floor ({floor:.2f})"
                    if not passed
                    else f"Fire net min confidence ({conf:.2f}) is acceptable"
                ),
                value=conf,
                expected=f">= {floor}",
            )
        )

    # Minimum track frames check
    if hasattr(settings, "fire_net_min_track_frames"):
        frames = settings.fire_net_min_track_frames
        floor = SafetyLimits.FIRE_NET_MIN_TRACK_FRAMES_FLOOR
        passed = frames >= floor
        results.append(
            ValidationResult(
                name="fire_net_min_track_frames",
                passed=passed,
                severity=ValidationSeverity.CRITICAL if not passed else ValidationSeverity.INFO,
                message=(
                    f"Fire net min track frames ({frames}) is below safety floor ({floor})"
                    if not passed
                    else f"Fire net min track frames ({frames}) is acceptable"
                ),
                value=frames,
                expected=f">= {floor}",
            )
        )

    # Cooldown check
    if hasattr(settings, "fire_net_cooldown_seconds"):
        cooldown = settings.fire_net_cooldown_seconds
        floor = SafetyLimits.FIRE_NET_COOLDOWN_FLOOR
        passed = cooldown >= floor
        results.append(
            ValidationResult(
                name="fire_net_cooldown_seconds",
                passed=passed,
                severity=ValidationSeverity.ERROR if not passed else ValidationSeverity.INFO,
                message=(
                    f"Fire net cooldown ({cooldown:.1f}s) is below safety floor ({floor:.1f}s)"
                    if not passed
                    else f"Fire net cooldown ({cooldown:.1f}s) is acceptable"
                ),
                value=cooldown,
                expected=f">= {floor}",
            )
        )

    # Minimum distance check
    if hasattr(settings, "fire_net_min_distance_m"):
        min_dist = settings.fire_net_min_distance_m
        floor = SafetyLimits.FIRE_NET_MIN_DISTANCE_FLOOR
        passed = min_dist >= floor
        results.append(
            ValidationResult(
                name="fire_net_min_distance_m",
                passed=passed,
                severity=ValidationSeverity.CRITICAL if not passed else ValidationSeverity.INFO,
                message=(
                    f"Fire net min distance ({min_dist:.1f}m) is below safety floor ({floor:.1f}m)"
                    if not passed
                    else f"Fire net min distance ({min_dist:.1f}m) is acceptable"
                ),
                value=min_dist,
                expected=f">= {floor}",
            )
        )

    # Maximum distance check
    if hasattr(settings, "fire_net_max_distance_m"):
        max_dist = settings.fire_net_max_distance_m
        ceiling = SafetyLimits.FIRE_NET_MAX_DISTANCE_CEILING
        passed = max_dist <= ceiling
        results.append(
            ValidationResult(
                name="fire_net_max_distance_m",
                passed=passed,
                severity=ValidationSeverity.WARNING if not passed else ValidationSeverity.INFO,
                message=(
                    f"Fire net max distance ({max_dist:.1f}m) exceeds safety ceiling ({ceiling:.1f}m)"
                    if not passed
                    else f"Fire net max distance ({max_dist:.1f}m) is acceptable"
                ),
                value=max_dist,
                expected=f"<= {ceiling}",
            )
        )

    # Distance envelope consistency
    if hasattr(settings, "fire_net_min_distance_m") and hasattr(
        settings, "fire_net_max_distance_m"
    ):
        min_d = settings.fire_net_min_distance_m
        max_d = settings.fire_net_max_distance_m
        passed = min_d < max_d
        results.append(
            ValidationResult(
                name="fire_net_distance_envelope",
                passed=passed,
                severity=ValidationSeverity.CRITICAL if not passed else ValidationSeverity.INFO,
                message=(
                    f"Fire net min distance ({min_d:.1f}m) must be less than max ({max_d:.1f}m)"
                    if not passed
                    else "Fire net distance envelope is valid"
                ),
                value=f"{min_d} - {max_d}",
                expected="min < max",
            )
        )

    # Velocity threshold check
    if hasattr(settings, "fire_net_velocity_threshold_ms"):
        vel = settings.fire_net_velocity_threshold_ms
        ceiling = SafetyLimits.FIRE_NET_MAX_VELOCITY_CEILING
        passed = vel <= ceiling
        results.append(
            ValidationResult(
                name="fire_net_velocity_threshold_ms",
                passed=passed,
                severity=ValidationSeverity.WARNING if not passed else ValidationSeverity.INFO,
                message=(
                    f"Fire net velocity threshold ({vel:.1f}m/s) exceeds ceiling ({ceiling:.1f}m/s)"
                    if not passed
                    else f"Fire net velocity threshold ({vel:.1f}m/s) is acceptable"
                ),
                value=vel,
                expected=f"<= {ceiling}",
            )
        )

    return results


def validate_inference_settings(settings) -> list[ValidationResult]:
    """
    Validate inference settings.

    Args:
        settings: InferenceSettings instance

    Returns:
        List of validation results
    """
    results = []

    # Confidence threshold check
    if hasattr(settings, "confidence_threshold"):
        conf = settings.confidence_threshold
        floor = SafetyLimits.DETECTION_CONFIDENCE_FLOOR
        passed = conf >= floor
        results.append(
            ValidationResult(
                name="confidence_threshold",
                passed=passed,
                severity=ValidationSeverity.WARNING if not passed else ValidationSeverity.INFO,
                message=(
                    f"Confidence threshold ({conf:.2f}) is below floor ({floor:.2f}) - high noise expected"
                    if not passed
                    else f"Confidence threshold ({conf:.2f}) is acceptable"
                ),
                value=conf,
                expected=f">= {floor}",
            )
        )

    # NMS threshold check (should not be too low or too high)
    if hasattr(settings, "nms_threshold"):
        nms = settings.nms_threshold
        passed = 0.3 <= nms <= 0.7
        results.append(
            ValidationResult(
                name="nms_threshold",
                passed=passed,
                severity=ValidationSeverity.WARNING if not passed else ValidationSeverity.INFO,
                message=(
                    f"NMS threshold ({nms:.2f}) is outside recommended range (0.3-0.7)"
                    if not passed
                    else f"NMS threshold ({nms:.2f}) is acceptable"
                ),
                value=nms,
                expected="0.3 - 0.7",
            )
        )

    return results


def validate_tracker_settings(settings) -> list[ValidationResult]:
    """
    Validate tracker settings.

    Args:
        settings: TrackerSettings instance

    Returns:
        List of validation results
    """
    results = []

    # Max disappeared frames
    if hasattr(settings, "max_disappeared"):
        frames = settings.max_disappeared
        passed = 5 <= frames <= 300
        results.append(
            ValidationResult(
                name="tracker_max_disappeared",
                passed=passed,
                severity=ValidationSeverity.WARNING if not passed else ValidationSeverity.INFO,
                message=(
                    f"Max disappeared ({frames}) is outside recommended range (5-300)"
                    if not passed
                    else f"Max disappeared ({frames}) is acceptable"
                ),
                value=frames,
                expected="5 - 300",
            )
        )

    # Max distance for centroid matching
    if hasattr(settings, "max_distance"):
        dist = settings.max_distance
        passed = 20 <= dist <= 500
        results.append(
            ValidationResult(
                name="tracker_max_distance",
                passed=passed,
                severity=ValidationSeverity.WARNING if not passed else ValidationSeverity.INFO,
                message=(
                    f"Max distance ({dist:.1f}px) is outside recommended range (20-500)"
                    if not passed
                    else f"Max distance ({dist:.1f}px) is acceptable"
                ),
                value=dist,
                expected="20 - 500",
            )
        )

    return results


def validate_capture_settings(settings) -> list[ValidationResult]:
    """
    Validate capture settings.

    Args:
        settings: CaptureSettings instance

    Returns:
        List of validation results
    """
    results = []

    # Resolution check
    if hasattr(settings, "width") and hasattr(settings, "height"):
        width = settings.width
        height = settings.height
        passed = 160 <= width <= 4096 and 120 <= height <= 3072
        results.append(
            ValidationResult(
                name="capture_resolution",
                passed=passed,
                severity=ValidationSeverity.WARNING if not passed else ValidationSeverity.INFO,
                message=(
                    f"Resolution ({width}x{height}) is outside supported range"
                    if not passed
                    else f"Resolution ({width}x{height}) is acceptable"
                ),
                value=f"{width}x{height}",
                expected="160-4096 x 120-3072",
            )
        )

    # FPS check
    if hasattr(settings, "fps"):
        fps = settings.fps
        passed = 1 <= fps <= 120
        results.append(
            ValidationResult(
                name="capture_fps",
                passed=passed,
                severity=ValidationSeverity.WARNING if not passed else ValidationSeverity.INFO,
                message=(
                    f"FPS ({fps}) is outside supported range (1-120)"
                    if not passed
                    else f"FPS ({fps}) is acceptable"
                ),
                value=fps,
                expected="1 - 120",
            )
        )

    return results


# =============================================================================
# Main Validation Function
# =============================================================================


def validate_settings(settings) -> list[ValidationResult]:
    """
    Validate all settings for safety.

    Args:
        settings: Root Settings instance

    Returns:
        List of all validation results

    Raises:
        SafetyValidationError: If any CRITICAL validation fails
    """
    results = []

    # Validate each settings section
    if hasattr(settings, "targeting"):
        results.extend(validate_fire_net_settings(settings.targeting))

    if hasattr(settings, "inference"):
        results.extend(validate_inference_settings(settings.inference))

    if hasattr(settings, "tracker"):
        results.extend(validate_tracker_settings(settings.tracker))

    if hasattr(settings, "capture"):
        results.extend(validate_capture_settings(settings.capture))

    # Log results
    for result in results:
        if result.passed:
            logger.debug(f"[{result.severity.value}] {result.name}: {result.message}")
        else:
            if result.severity == ValidationSeverity.CRITICAL:
                logger.critical(f"SAFETY CRITICAL: {result.name}: {result.message}")
            elif result.severity == ValidationSeverity.ERROR:
                logger.error(f"SAFETY ERROR: {result.name}: {result.message}")
            elif result.severity == ValidationSeverity.WARNING:
                logger.warning(f"SAFETY WARNING: {result.name}: {result.message}")

    # Check for critical failures
    critical_failures = [
        r
        for r in results
        if not r.passed and r.severity == ValidationSeverity.CRITICAL
    ]

    if critical_failures:
        raise SafetyValidationError(critical_failures)

    return results


def validate_settings_dict(settings_dict: dict) -> list[ValidationResult]:
    """
    Validate settings from a dictionary.

    Useful when pydantic Settings is not available.

    Args:
        settings_dict: Dictionary of settings

    Returns:
        List of validation results

    Raises:
        SafetyValidationError: If any CRITICAL validation fails
    """
    # Create simple namespace for attribute access
    class SettingsProxy:
        def __init__(self, d: dict):
            for k, v in d.items():
                if isinstance(v, dict):
                    setattr(self, k, SettingsProxy(v))
                else:
                    setattr(self, k, v)

    settings = SettingsProxy(settings_dict)
    return validate_settings(settings)


# =============================================================================
# Startup Validation
# =============================================================================


def run_startup_validation(settings, strict: bool = True) -> bool:
    """
    Run validation at startup.

    Args:
        settings: Settings to validate
        strict: If True, exit on any failure. If False, continue with warnings.

    Returns:
        True if validation passed, False otherwise

    Raises:
        SystemExit: If strict mode and validation fails
    """
    logger.info("Running safety validation...")

    try:
        results = validate_settings(settings)

        # Count by severity
        warnings = sum(
            1 for r in results if not r.passed and r.severity == ValidationSeverity.WARNING
        )
        errors = sum(
            1 for r in results if not r.passed and r.severity == ValidationSeverity.ERROR
        )

        if warnings > 0:
            logger.warning(f"Safety validation completed with {warnings} warning(s)")
        if errors > 0:
            logger.error(f"Safety validation completed with {errors} error(s)")

        if errors > 0 and strict:
            logger.critical("Exiting due to safety validation errors (strict mode)")
            raise SystemExit(1)

        if warnings == 0 and errors == 0:
            logger.info("Safety validation passed")

        return True

    except SafetyValidationError as e:
        logger.critical(str(e))
        if strict:
            raise SystemExit(1) from e
        return False


# =============================================================================
# Validation Summary
# =============================================================================


def get_validation_summary(results: list[ValidationResult]) -> dict:
    """
    Get summary of validation results.

    Args:
        results: List of validation results

    Returns:
        Summary dictionary
    """
    return {
        "total_checks": len(results),
        "passed": sum(1 for r in results if r.passed),
        "failed": sum(1 for r in results if not r.passed),
        "by_severity": {
            "info": sum(1 for r in results if r.severity == ValidationSeverity.INFO),
            "warning": sum(
                1
                for r in results
                if r.severity == ValidationSeverity.WARNING and not r.passed
            ),
            "error": sum(
                1
                for r in results
                if r.severity == ValidationSeverity.ERROR and not r.passed
            ),
            "critical": sum(
                1
                for r in results
                if r.severity == ValidationSeverity.CRITICAL and not r.passed
            ),
        },
        "results": [r.to_dict() for r in results],
    }
