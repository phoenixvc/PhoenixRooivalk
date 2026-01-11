#!/usr/bin/env python3
"""
Threat classification taxonomy for multi-class threat assessment.

Extends binary drone/not-drone classification to a hierarchical
threat taxonomy with severity levels and response recommendations.

Taxonomy Hierarchy:
    CRITICAL    - Immediate response required
    HIGH        - Priority response
    MEDIUM      - Monitor closely
    LOW         - Awareness only
    INFORMATIONAL - No action required
"""

import logging
from dataclasses import dataclass, field
from enum import Enum, IntEnum
from typing import Any, Optional

from interfaces import Detection

logger = logging.getLogger("drone_detector.threat")


class ThreatLevel(IntEnum):
    """Threat severity levels."""

    INFORMATIONAL = 0  # Birds, debris, etc.
    LOW = 1  # Recreational drones at distance
    MEDIUM = 2  # Consumer drones, close proximity
    HIGH = 3  # Modified or unidentified drones
    CRITICAL = 4  # Coordinated attacks, swarms


class ThreatCategory(Enum):
    """High-level threat categories."""

    DRONE = "drone"
    MANNED_AIRCRAFT = "manned_aircraft"
    BIRD = "bird"
    RECREATIONAL = "recreational"
    DEBRIS = "debris"
    ATMOSPHERIC = "atmospheric"
    UNKNOWN = "unknown"


class DroneType(Enum):
    """Specific drone types."""

    MULTIROTOR = "multirotor"  # Most common consumer/commercial
    FIXED_WING = "fixed_wing"  # Long-range reconnaissance
    VTOL = "vtol"  # Hybrid capabilities
    HELICOPTER = "helicopter"  # Single/coaxial rotor
    FPV_RACING = "fpv_racing"  # High-speed, small
    UNKNOWN = "unknown"


class DroneIntent(Enum):
    """Assessed drone intent."""

    RECREATIONAL = "recreational"  # Hobbyist, tourism
    COMMERCIAL = "commercial"  # Delivery, inspection
    SURVEILLANCE = "surveillance"  # ISR operations
    ATTACK = "attack"  # Weaponized or payload
    UNKNOWN = "unknown"


@dataclass
class ThreatAssessment:
    """Complete threat assessment for a detection."""

    # Primary classification
    category: ThreatCategory
    threat_level: ThreatLevel
    confidence: float  # 0-1

    # Drone-specific (if applicable)
    drone_type: Optional[DroneType] = None
    drone_intent: Optional[DroneIntent] = None
    is_swarm_member: bool = False
    swarm_id: Optional[int] = None

    # Risk factors
    distance_m: Optional[float] = None
    velocity_ms: Optional[float] = None
    heading_toward_asset: bool = False
    in_restricted_airspace: bool = False
    payload_detected: bool = False

    # Response recommendation
    recommended_action: str = ""
    escalation_required: bool = False

    # Supporting evidence
    classification_reasons: list[str] = field(default_factory=list)
    raw_class_scores: dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "category": self.category.value,
            "threat_level": self.threat_level.name,
            "threat_level_value": int(self.threat_level),
            "confidence": self.confidence,
            "drone_type": self.drone_type.value if self.drone_type else None,
            "drone_intent": self.drone_intent.value if self.drone_intent else None,
            "is_swarm_member": self.is_swarm_member,
            "swarm_id": self.swarm_id,
            "distance_m": self.distance_m,
            "velocity_ms": self.velocity_ms,
            "heading_toward_asset": self.heading_toward_asset,
            "in_restricted_airspace": self.in_restricted_airspace,
            "payload_detected": self.payload_detected,
            "recommended_action": self.recommended_action,
            "escalation_required": self.escalation_required,
            "classification_reasons": self.classification_reasons,
        }


# =============================================================================
# Class Mappings
# =============================================================================


# Standard 10-class model mapping
STANDARD_CLASS_MAPPING = {
    0: ("drone", ThreatCategory.DRONE, ThreatLevel.MEDIUM),
    1: ("bird_small", ThreatCategory.BIRD, ThreatLevel.INFORMATIONAL),
    2: ("bird_large", ThreatCategory.BIRD, ThreatLevel.LOW),
    3: ("aircraft", ThreatCategory.MANNED_AIRCRAFT, ThreatLevel.INFORMATIONAL),
    4: ("recreational", ThreatCategory.RECREATIONAL, ThreatLevel.INFORMATIONAL),
    5: ("sports", ThreatCategory.RECREATIONAL, ThreatLevel.INFORMATIONAL),
    6: ("debris", ThreatCategory.DEBRIS, ThreatLevel.INFORMATIONAL),
    7: ("insect", ThreatCategory.DEBRIS, ThreatLevel.INFORMATIONAL),
    8: ("atmospheric", ThreatCategory.ATMOSPHERIC, ThreatLevel.INFORMATIONAL),
    9: ("background", ThreatCategory.UNKNOWN, ThreatLevel.INFORMATIONAL),
}


# Full 27-class model mapping
FULL_CLASS_MAPPING = {
    # Drones (0-4) - Alert classes
    0: ("drone_multirotor", ThreatCategory.DRONE, ThreatLevel.MEDIUM, DroneType.MULTIROTOR),
    1: ("drone_fixedwing", ThreatCategory.DRONE, ThreatLevel.MEDIUM, DroneType.FIXED_WING),
    2: ("drone_vtol", ThreatCategory.DRONE, ThreatLevel.MEDIUM, DroneType.VTOL),
    3: ("drone_helicopter", ThreatCategory.DRONE, ThreatLevel.MEDIUM, DroneType.HELICOPTER),
    4: ("drone_unknown", ThreatCategory.DRONE, ThreatLevel.HIGH, DroneType.UNKNOWN),
    # Birds (5-9)
    5: ("bird_tiny", ThreatCategory.BIRD, ThreatLevel.INFORMATIONAL, None),
    6: ("bird_small", ThreatCategory.BIRD, ThreatLevel.INFORMATIONAL, None),
    7: ("bird_medium", ThreatCategory.BIRD, ThreatLevel.INFORMATIONAL, None),
    8: ("bird_large", ThreatCategory.BIRD, ThreatLevel.LOW, None),
    9: ("bird_raptor", ThreatCategory.BIRD, ThreatLevel.LOW, None),
    # Aircraft (10-13) - Critical non-alert
    10: ("aircraft_fixed", ThreatCategory.MANNED_AIRCRAFT, ThreatLevel.INFORMATIONAL, None),
    11: ("aircraft_helicopter", ThreatCategory.MANNED_AIRCRAFT, ThreatLevel.INFORMATIONAL, None),
    12: ("aircraft_glider", ThreatCategory.MANNED_AIRCRAFT, ThreatLevel.INFORMATIONAL, None),
    13: ("aircraft_ultralight", ThreatCategory.MANNED_AIRCRAFT, ThreatLevel.INFORMATIONAL, None),
    # Recreational (14-18)
    14: ("balloon", ThreatCategory.RECREATIONAL, ThreatLevel.INFORMATIONAL, None),
    15: ("kite", ThreatCategory.RECREATIONAL, ThreatLevel.INFORMATIONAL, None),
    16: ("rc_plane", ThreatCategory.RECREATIONAL, ThreatLevel.LOW, None),
    17: ("rc_helicopter", ThreatCategory.RECREATIONAL, ThreatLevel.LOW, None),
    18: ("paraglider", ThreatCategory.RECREATIONAL, ThreatLevel.INFORMATIONAL, None),
    # Sports (19-20)
    19: ("ball", ThreatCategory.RECREATIONAL, ThreatLevel.INFORMATIONAL, None),
    20: ("frisbee", ThreatCategory.RECREATIONAL, ThreatLevel.INFORMATIONAL, None),
    # Debris (21-23)
    21: ("plastic_bag", ThreatCategory.DEBRIS, ThreatLevel.INFORMATIONAL, None),
    22: ("paper", ThreatCategory.DEBRIS, ThreatLevel.INFORMATIONAL, None),
    23: ("leaf_cluster", ThreatCategory.DEBRIS, ThreatLevel.INFORMATIONAL, None),
    # Atmospheric (24-26)
    24: ("cloud_edge", ThreatCategory.ATMOSPHERIC, ThreatLevel.INFORMATIONAL, None),
    25: ("lens_flare", ThreatCategory.ATMOSPHERIC, ThreatLevel.INFORMATIONAL, None),
    26: ("bird_flock", ThreatCategory.BIRD, ThreatLevel.LOW, None),
}


# Swarm detection thresholds
SWARM_MIN_DRONES = 3
SWARM_MAX_SEPARATION_M = 50.0
SWARM_CORRELATION_WINDOW_S = 2.0


# =============================================================================
# Threat Classifier
# =============================================================================


class ThreatClassifier:
    """
    Classifies detections into threat categories with severity levels.

    Considers:
    - Raw model classification
    - Distance to protected asset
    - Velocity and heading
    - Swarm behavior patterns
    - Airspace restrictions
    """

    def __init__(
        self,
        class_mapping: dict = None,
        asset_position: Optional[tuple[float, float, float]] = None,
        restricted_zones: Optional[list[tuple[float, float, float, float]]] = None,
    ):
        """
        Initialize threat classifier.

        Args:
            class_mapping: Class ID to threat mapping
            asset_position: Protected asset location (x, y, z meters)
            restricted_zones: List of (x1, y1, x2, y2) restricted areas
        """
        self._class_mapping = class_mapping or STANDARD_CLASS_MAPPING
        self._asset_position = asset_position or (0.0, 0.0, 0.0)
        self._restricted_zones = restricted_zones or []

        # Swarm tracking
        self._active_drones: dict[int, Detection] = {}
        self._swarm_groups: dict[int, list[int]] = {}  # swarm_id → track_ids
        self._next_swarm_id = 1

    def classify(
        self,
        detection: Detection,
        position_3d: Optional[tuple[float, float, float]] = None,
        velocity_3d: Optional[tuple[float, float, float]] = None,
        track_id: Optional[int] = None,
    ) -> ThreatAssessment:
        """
        Classify a detection into threat taxonomy.

        Args:
            detection: Raw detection from model
            position_3d: 3D position in meters (if available)
            velocity_3d: 3D velocity in m/s (if available)
            track_id: Track ID for swarm correlation

        Returns:
            Complete threat assessment
        """
        # Get base classification from model output
        class_id = detection.class_id
        mapping = self._class_mapping.get(class_id)

        if mapping is None:
            return ThreatAssessment(
                category=ThreatCategory.UNKNOWN,
                threat_level=ThreatLevel.MEDIUM,
                confidence=detection.confidence,
                classification_reasons=["Unknown class ID"],
            )

        # Parse mapping (handles both 3-tuple and 4-tuple formats)
        class_name = mapping[0]
        category = mapping[1]
        base_threat_level = mapping[2]
        drone_type = mapping[3] if len(mapping) > 3 else None

        # Calculate modifiers
        reasons = [f"Base classification: {class_name}"]
        threat_level = base_threat_level
        distance_m = None
        velocity_ms = None
        heading_toward = False
        in_restricted = False

        # Distance modifier
        if position_3d:
            distance_m = self._calculate_distance(position_3d)
            if distance_m < 20:
                threat_level = max(threat_level, ThreatLevel.HIGH)
                reasons.append(f"Close proximity: {distance_m:.1f}m")
            elif distance_m < 50:
                threat_level = max(threat_level, ThreatLevel.MEDIUM)
                reasons.append(f"Medium proximity: {distance_m:.1f}m")

        # Velocity modifier
        if velocity_3d:
            velocity_ms = (velocity_3d[0] ** 2 + velocity_3d[1] ** 2 + velocity_3d[2] ** 2) ** 0.5
            if velocity_ms > 20:
                threat_level = max(threat_level, ThreatLevel.HIGH)
                reasons.append(f"High velocity: {velocity_ms:.1f}m/s")

            # Check if heading toward asset
            if position_3d:
                heading_toward = self._check_heading_toward(position_3d, velocity_3d)
                if heading_toward:
                    threat_level = max(threat_level, ThreatLevel.HIGH)
                    reasons.append("Heading toward protected asset")

        # Restricted airspace check
        if position_3d:
            in_restricted = self._check_restricted(position_3d)
            if in_restricted:
                threat_level = max(threat_level, ThreatLevel.HIGH)
                reasons.append("In restricted airspace")

        # Swarm detection
        is_swarm = False
        swarm_id = None
        if category == ThreatCategory.DRONE and track_id is not None:
            is_swarm, swarm_id = self._check_swarm(track_id, detection, position_3d)
            if is_swarm:
                threat_level = ThreatLevel.CRITICAL
                reasons.append(f"Swarm member (group {swarm_id})")

        # Payload detection (based on size anomaly)
        payload_detected = self._check_payload(detection)
        if payload_detected:
            threat_level = ThreatLevel.CRITICAL
            reasons.append("Possible payload detected")

        # Determine intent
        drone_intent = None
        if category == ThreatCategory.DRONE:
            drone_intent = self._assess_intent(
                threat_level, is_swarm, heading_toward, payload_detected
            )

        # Generate recommendation
        action, escalate = self._get_recommendation(threat_level, category)

        return ThreatAssessment(
            category=category,
            threat_level=threat_level,
            confidence=detection.confidence,
            drone_type=drone_type,
            drone_intent=drone_intent,
            is_swarm_member=is_swarm,
            swarm_id=swarm_id,
            distance_m=distance_m,
            velocity_ms=velocity_ms,
            heading_toward_asset=heading_toward,
            in_restricted_airspace=in_restricted,
            payload_detected=payload_detected,
            recommended_action=action,
            escalation_required=escalate,
            classification_reasons=reasons,
            raw_class_scores={class_name: detection.confidence},
        )

    def _calculate_distance(self, position: tuple[float, float, float]) -> float:
        """Calculate distance from position to protected asset."""
        dx = position[0] - self._asset_position[0]
        dy = position[1] - self._asset_position[1]
        dz = position[2] - self._asset_position[2]
        return (dx**2 + dy**2 + dz**2) ** 0.5

    def _check_heading_toward(
        self,
        position: tuple[float, float, float],
        velocity: tuple[float, float, float],
    ) -> bool:
        """Check if object is heading toward protected asset."""
        # Vector from position to asset
        to_asset = (
            self._asset_position[0] - position[0],
            self._asset_position[1] - position[1],
            self._asset_position[2] - position[2],
        )

        # Dot product with velocity
        dot = velocity[0] * to_asset[0] + velocity[1] * to_asset[1] + velocity[2] * to_asset[2]

        # Heading toward if dot product is positive
        return dot > 0

    def _check_restricted(self, position: tuple[float, float, float]) -> bool:
        """Check if position is in restricted airspace."""
        for x1, y1, x2, y2 in self._restricted_zones:
            if x1 <= position[0] <= x2 and y1 <= position[1] <= y2:
                return True
        return False

    def _check_swarm(
        self,
        track_id: int,
        detection: Detection,
        position: Optional[tuple[float, float, float]],
    ) -> tuple[bool, Optional[int]]:
        """Check if this drone is part of a swarm."""
        # Update active drones
        self._active_drones[track_id] = detection

        # Count nearby drones
        if position is None:
            return False, None

        nearby = []
        for tid, det in self._active_drones.items():
            if tid == track_id:
                continue
            # Would need 3D positions of other drones
            # For now, use simple heuristic based on bounding box proximity
            # in image space as approximation
            distance_px = (
                (detection.bbox.center[0] - det.bbox.center[0]) ** 2
                + (detection.bbox.center[1] - det.bbox.center[1]) ** 2
            ) ** 0.5
            if distance_px < 200:  # Within 200 pixels
                nearby.append(tid)

        if len(nearby) >= SWARM_MIN_DRONES - 1:
            # Check existing swarms
            for swarm_id, members in self._swarm_groups.items():
                if track_id in members or any(t in members for t in nearby):
                    # Add to existing swarm
                    if track_id not in members:
                        members.append(track_id)
                    return True, swarm_id

            # Create new swarm
            swarm_id = self._next_swarm_id
            self._next_swarm_id += 1
            self._swarm_groups[swarm_id] = [track_id] + nearby
            return True, swarm_id

        return False, None

    def _check_payload(self, detection: Detection) -> bool:
        """Check if drone appears to be carrying a payload."""
        # Heuristic: unusual aspect ratio or size anomaly
        bbox = detection.bbox
        aspect = bbox.width / max(bbox.height, 1)

        # Very wide or very tall suggests payload
        if aspect < 0.5 or aspect > 2.0:
            return True

        # Large area relative to typical drone
        area = bbox.area
        if area > 50000:  # Arbitrary threshold
            return True

        return False

    def _assess_intent(
        self,
        threat_level: ThreatLevel,
        is_swarm: bool,
        heading_toward: bool,
        payload_detected: bool,
    ) -> DroneIntent:
        """Assess likely drone intent."""
        if is_swarm or payload_detected:
            return DroneIntent.ATTACK

        if threat_level == ThreatLevel.CRITICAL:
            return DroneIntent.ATTACK

        if heading_toward and threat_level >= ThreatLevel.HIGH:
            return DroneIntent.SURVEILLANCE

        if threat_level <= ThreatLevel.LOW:
            return DroneIntent.RECREATIONAL

        return DroneIntent.UNKNOWN

    def _get_recommendation(
        self,
        threat_level: ThreatLevel,
        category: ThreatCategory,
    ) -> tuple[str, bool]:
        """Get response recommendation based on threat assessment."""
        if category == ThreatCategory.MANNED_AIRCRAFT:
            return "DO NOT ENGAGE - Manned aircraft", True

        if threat_level == ThreatLevel.CRITICAL:
            return "IMMEDIATE RESPONSE - Engage countermeasures", True

        if threat_level == ThreatLevel.HIGH:
            return "PRIORITY RESPONSE - Prepare countermeasures", True

        if threat_level == ThreatLevel.MEDIUM:
            return "MONITOR - Track and assess", False

        if threat_level == ThreatLevel.LOW:
            return "AWARENESS - Log and monitor", False

        return "NO ACTION REQUIRED", False

    def set_asset_position(self, position: tuple[float, float, float]) -> None:
        """Update protected asset position."""
        self._asset_position = position

    def set_restricted_zones(self, zones: list[tuple[float, float, float, float]]) -> None:
        """Update restricted zones."""
        self._restricted_zones = zones

    def clear_swarm_state(self) -> None:
        """Clear swarm tracking state."""
        self._active_drones.clear()
        self._swarm_groups.clear()


# =============================================================================
# Factory Function
# =============================================================================


def create_threat_classifier(
    model_type: str = "standard",
    **kwargs,
) -> ThreatClassifier:
    """
    Create a threat classifier for the given model type.

    Args:
        model_type: "binary", "standard" (10-class), or "full" (27-class)
        **kwargs: Additional configuration

    Returns:
        Configured ThreatClassifier
    """
    if model_type == "binary":
        mapping = {
            0: ("drone", ThreatCategory.DRONE, ThreatLevel.MEDIUM),
            1: ("not_drone", ThreatCategory.UNKNOWN, ThreatLevel.INFORMATIONAL),
        }
    elif model_type == "full":
        mapping = FULL_CLASS_MAPPING
    else:
        mapping = STANDARD_CLASS_MAPPING

    return ThreatClassifier(class_mapping=mapping, **kwargs)
