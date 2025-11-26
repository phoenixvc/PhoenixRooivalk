---
id: icon-requirements
title: Icon Requirements & Design System
sidebar_label: Icon Requirements
description:
  Comprehensive icon requirements for the Phoenix Rooivalk Threat Simulator UI
  components
difficulty: intermediate
estimated_reading_time: 8
points: 15
tags:
  - counter-uas
---

# Icon Requirements & Design System

This document outlines the complete icon requirements for the Phoenix Rooivalk
Threat Simulator, including design specifications, color palettes, and AI
generation prompts.

## Overview

The icon system supports two main categories:

- **Effector Icons**: Counter-drone weapons and systems
- **Drone Icons**: Deployable UAV types and roles

## Design Principles

### Visual Style

- **Style**: Minimalist, technical, military-inspired
- **Weight**: Medium weight (2-3px stroke width)
- **Style**: Outline-based with optional fills for active states
- **Consistency**: Unified stroke width and corner radius
- **Clarity**: Recognizable at 16px minimum size

### Color System

#### Primary Palette

```css
/* Effector Class Colors */
--hard-kill: #2ed573; /* Green - Kinetic destruction */
--soft-kill: #ffa502; /* Orange - Electronic disruption */
--deception: #70a1ff; /* Blue - Deception/misdirection */
--denial: #eccc68; /* Yellow - Area denial */
--capture: #10b981; /* Emerald - Capture/net systems */
--directed: #f97316; /* Orange - Directed energy */
--ecm: #8b5cf6; /* Purple - Electronic warfare */
--nonkinetic: #84cc16; /* Lime - Non-destructive */
--countermeasure: #6b7280; /* Gray - Defensive measures */
--kinetic: #dc2626; /* Red - Physical projectiles */
```

#### Status Colors

```css
/* Status Indicators */
--success: #10b981; /* Green - Ready/success */
--warning: #f59e0b; /* Amber - Warning/caution */
--danger: #ef4444; /* Red - Error/danger */
--info: #3b82f6; /* Blue - Information */
--muted: #6b7280; /* Gray - Disabled/inactive */
```

## Effector Icons

### Hard Kill Systems

#### 1. HEL (High-Energy Laser)

- **Icon**: `laser`
- **Description**: Concentrated beam weapon
- **Visual**: Diagonal beam with target crosshair
- **Color**: `#2ED573` (hard-kill green)
- **Usage**: Direct energy weapons, precision targeting

#### 2. Smart Slug

- **Icon**: `crosshair`
- **Description**: Precision kinetic projectile
- **Visual**: Crosshair with bullet trajectory
- **Color**: `#dc2626` (kinetic red)
- **Usage**: Precision intercept systems

### Soft Kill Systems

#### 3. HPM (High Power Microwave)

- **Icon**: `wave-burst`
- **Description**: Microwave burst weapon
- **Visual**: Concentric wave rings with burst center
- **Color**: `#FFA502` (soft-kill orange)
- **Usage**: Electronic disruption systems

#### 4. RF Jam

- **Icon**: `antenna-off`
- **Description**: Radio frequency jamming
- **Visual**: Antenna with strike-through or X
- **Color**: `#FFA502` (soft-kill orange)
- **Usage**: Communication disruption

#### 5. RF Takeover

- **Icon**: `antenna-swap`
- **Description**: Command and control takeover
- **Visual**: Two antennas with arrow between
- **Color**: `#8b5cf6` (ECM purple)
- **Usage**: Electronic warfare, C2 takeover

#### 6. GNSS Denial

- **Icon**: `sat-off`
- **Description**: GPS/satellite signal denial
- **Visual**: Satellite with slash or X
- **Color**: `#8b5cf6` (ECM purple)
- **Usage**: Navigation disruption

### Capture Systems

#### 7. Net

- **Icon**: `net`
- **Description**: Physical net capture
- **Visual**: Interlaced net pattern or fishing net
- **Color**: `#10b981` (capture emerald)
- **Usage**: Physical capture systems

### Deception Systems

#### 8. Optical Dazzler

- **Icon**: `sun-low`
- **Description**: Bright light dazzler
- **Visual**: Sun with rays or spotlight
- **Color**: `#f97316` (directed orange)
- **Usage**: Visual disruption, camera blinding

#### 9. Decoy Beacon

- **Icon**: `beacon`
- **Description**: Lure beacon
- **Visual**: Lighthouse beacon or radar sweep
- **Color**: `#70A1FF` (deception blue)
- **Usage**: Target attraction, decoy systems

### Countermeasure Systems

#### 10. AHEAD Airburst

- **Icon**: `burst-round`
- **Description**: Proximity-fused airburst
- **Visual**: Explosion burst or shrapnel pattern
- **Color**: `#ECCC68` (denial yellow)
- **Usage**: Area effect weapons

#### 11. Obscurant

- **Icon**: `cloud-fog`
- **Description**: Smoke/obscurant generator
- **Visual**: Cloud or fog bank
- **Color**: `#6b7280` (countermeasure gray)
- **Usage**: Visual concealment

#### 12. Acoustic

- **Icon**: `speaker-off`
- **Description**: Acoustic disruption
- **Visual**: Speaker with sound waves or mute symbol
- **Color**: `#84cc16` (nonkinetic lime)
- **Usage**: Audio disruption

#### 13. AI Deception

- **Icon**: `shimmer`
- **Description**: AI-powered deception
- **Visual**: Shimmering effect or neural network pattern
- **Color**: `#8b5cf6` (ECM purple)
- **Usage**: Advanced electronic warfare

## Drone Icons

### Core Drone Types

#### 1. Effector (Interceptor)

- **Icon**: `triangle` with `bolt`
- **Description**: Kinetic interceptor drone
- **Visual**: Triangle with lightning bolt
- **Color**: `#dc2626` (kinetic red)
- **Usage**: Primary interceptor role

#### 2. Jammer

- **Icon**: `triangle` with `wave`
- **Description**: Electronic warfare drone
- **Visual**: Triangle with radio waves
- **Color**: `#8b5cf6` (ECM purple)
- **Usage**: RF jamming and disruption

#### 3. Surveillance

- **Icon**: `triangle` with `eye`
- **Description**: Reconnaissance drone
- **Visual**: Triangle with eye symbol
- **Color**: `#3b82f6` (info blue)
- **Usage**: Intelligence gathering

#### 4. Shield

- **Icon**: `triangle` with `shield`
- **Description**: Protective shield drone
- **Visual**: Triangle with shield symbol
- **Color**: `#10b981` (success green)
- **Usage**: Area protection

#### 5. Coordinator

- **Icon**: `triangle` with `network`
- **Description**: Swarm coordination drone
- **Visual**: Triangle with network nodes
- **Color**: `#f59e0b` (warning amber)
- **Usage**: Swarm management

### Extended Drone Types

#### 6. Decoy UAV

- **Icon**: `triangle` with `beacon`
- **Description**: Decoy and lure drone
- **Visual**: Triangle with beacon/flare
- **Color**: `#70A1FF` (deception blue)
- **Usage**: Target attraction

#### 7. Net-Capture UAV

- **Icon**: `triangle` with `net`
- **Description**: Net deployment drone
- **Visual**: Triangle with net pattern
- **Color**: `#10b981` (capture emerald)
- **Usage**: Physical capture

#### 8. EW Relay UAV

- **Icon**: `triangle` with `antenna`
- **Description**: Electronic warfare relay
- **Visual**: Triangle with antenna array
- **Color**: `#8b5cf6` (ECM purple)
- **Usage**: Extended EW range

#### 9. Tethered Overwatch

- **Icon**: `tower` with `eye`
- **Description**: Persistent surveillance mast
- **Visual**: Tower with eye on top
- **Color**: `#3b82f6` (info blue)
- **Usage**: Persistent monitoring

#### 10. Recovery Drone

- **Icon**: `triangle` with `hook`
- **Description**: Drone recovery system
- **Visual**: Triangle with grappling hook
- **Color**: `#6b7280` (countermeasure gray)
- **Usage**: Debris cleanup

#### 11. Micro-Decoy Swarm

- **Icon**: `triangle` with `dots`
- **Description**: Swarm of micro-decoys
- **Visual**: Triangle with multiple dots
- **Color**: `#70A1FF` (deception blue)
- **Usage**: Swarm deception

#### 12. Perimeter Sentry

- **Icon**: `triangle` with `shield-border`
- **Description**: Perimeter patrol drone
- **Visual**: Triangle with border shield
- **Color**: `#10b981` (success green)
- **Usage**: Perimeter defense

#### 13. Spotter UAV

- **Icon**: `triangle` with `crosshair`
- **Description**: Target designation drone
- **Visual**: Triangle with crosshair
- **Color**: `#3b82f6` (info blue)
- **Usage**: Target marking

#### 14. HPM Pod UAV

- **Icon**: `triangle` with `wave-burst`
- **Description**: Mobile HPM platform
- **Visual**: Triangle with wave burst
- **Color**: `#FFA502` (soft-kill orange)
- **Usage**: Mobile electronic attack

#### 15. Shield Wall

- **Icon**: `wall` with `shield`
- **Description**: Directional shield barrier
- **Visual**: Wall section with shield overlay
- **Color**: `#10b981` (success green)
- **Usage**: Area protection

#### 16. LiDAR Mapper

- **Icon**: `triangle` with `laser-scan`
- **Description**: 3D mapping drone
- **Visual**: Triangle with scanning laser lines
- **Color**: `#3b82f6` (info blue)
- **Usage**: 3D scene mapping

#### 17. Optical Mesh Drone

- **Icon**: `triangle` with `optical-link`
- **Description**: Optical communication relay
- **Visual**: Triangle with light beam
- **Color**: `#8b5cf6` (ECM purple)
- **Usage**: Secure communications

## AI Generation Prompts

### Generic Icon Prompt Template

```
Create a minimalist, technical military icon for [SYSTEM_NAME].
Style: Outline-based, 2-3px stroke width, clean geometric shapes.
Size: 24x24px viewport, scalable vector.
Theme: Military/defense technology, professional and recognizable.
Color: [HEX_COLOR] for active state, outline for inactive.
Context: Counter-drone defense system interface.
```

### Specific Effector Prompts

#### Laser Icon

```
Create a minimalist laser weapon icon: diagonal energy beam with target crosshair.
Military style, outline-based, 24x24px. Color #2ED573.
Technical, precise, direct energy weapon aesthetic.
```

#### HPM Burst Icon

```
Create a microwave burst weapon icon: concentric wave rings emanating from center point.
Military style, outline-based, 24x24px. Color #FFA502.
Electronic disruption, wave propagation effect.
```

#### Net Icon

```
Create a capture net icon: interlaced net pattern or fishing net mesh.
Military style, outline-based, 24x24px. Color #10b981.
Physical capture, containment, non-destructive.
```

#### RF Jam Icon

```
Create an RF jamming icon: antenna with strike-through or X mark.
Military style, outline-based, 24x24px. Color #FFA502.
Communication disruption, signal blocking.
```

#### GNSS Denial Icon

```
Create a GPS denial icon: satellite with slash or X mark.
Military style, outline-based, 24x24px. Color #8b5cf6.
Navigation disruption, satellite signal blocking.
```

### Drone Icon Prompts

#### Interceptor Drone

```
Create a kinetic interceptor drone icon: triangle with lightning bolt.
Military style, outline-based, 24x24px. Color #dc2626.
Fast attack, kinetic energy, direct engagement.
```

#### Jammer Drone

```
Create an electronic warfare drone icon: triangle with radio wave pattern.
Military style, outline-based, 24x24px. Color #8b5cf6.
RF disruption, electronic warfare, signal interference.
```

#### Surveillance Drone

```
Create a reconnaissance drone icon: triangle with eye symbol.
Military style, outline-based, 24x24px. Color #3b82f6.
Intelligence gathering, observation, monitoring.
```

#### Shield Drone

```
Create a protective drone icon: triangle with shield symbol.
Military style, outline-based, 24x24px. Color #10b981.
Defense, protection, area coverage.
```

## Implementation Guidelines

### SVG Specifications

- **Format**: SVG with viewBox="0 0 24 24"
- **Stroke Width**: 2px for consistency
- **Fill**: None for outline icons, solid for active states
- **Strokes**: Round line caps and joins
- **Scaling**: Vector-based for crisp rendering at any size

### React Component Structure

```tsx
interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  active?: boolean;
}

const EffectorIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#6b7280",
  className = "",
  active = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill={active ? color : "none"}
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Icon path data */}
    </svg>
  );
};
```

### CSS Integration

```css
.effector-icon {
  transition: all 0.2s ease;
  cursor: pointer;
}

.effector-icon:hover {
  transform: scale(1.1);
  filter: brightness(1.2);
}

.effector-icon--active {
  fill: var(--effector-color);
}

.effector-icon--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

## File Organization

### Directory Structure

```
src/components/icons/
├── effectors/
│   ├── HEL.tsx
│   ├── HPM.tsx
│   ├── RFJam.tsx
│   ├── Net.tsx
│   └── ...
├── drones/
│   ├── Effector.tsx
│   ├── Jammer.tsx
│   ├── Surveillance.tsx
│   └── ...
└── index.ts
```

### Export Pattern

```tsx
// index.ts
export { HEL } from "./effectors/HEL";
export { HPM } from "./effectors/HPM";
export { Effector } from "./drones/Effector";
// ... all other icons
```

## Accessibility

### ARIA Labels

```tsx
<EffectorIcon aria-label="High Energy Laser - Hard Kill System" role="img" />
```

### Screen Reader Support

- Descriptive `aria-label` attributes
- `role="img"` for decorative icons
- `aria-hidden="true"` for purely decorative elements

## Testing Requirements

### Visual Testing

- Icon clarity at 16px, 24px, 32px sizes
- Color contrast compliance (WCAG AA)
- Recognition accuracy in user testing
- Consistency across different screen densities

### Technical Testing

- SVG optimization and file size
- Rendering performance
- Cross-browser compatibility
- Touch target size (44px minimum)

## Future Considerations

### Scalability

- Icon system supports easy addition of new effector/drone types
- Consistent naming conventions for automated generation
- Version control for icon updates and modifications

### Theming

- Dark/light mode support
- High contrast mode compatibility
- Custom color palette support for different deployments

---

_This document serves as the definitive guide for icon design and implementation
in the Phoenix Rooivalk Threat Simulator. All icons should follow these
specifications for consistency and professional appearance._
