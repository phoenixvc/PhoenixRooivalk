---
id: net-specifications
title: Capture Net Specifications
sidebar_label: Net Specifications
---

## Overview

This document details the specifications for drone capture nets used in the
Phoenix Rooivalk counter-UAS system. Nets provide a non-destructive defeat
mechanism that preserves evidence, enables forensic analysis, and minimizes
collateral damage.

:::info Why Nets?

- **Evidence Preservation**: Captured drones can be analyzed for origin/intent
- **No RF Interference**: Unlike jamming, nets don't affect local communications
- **Legal Advantage**: Evidence for prosecution and attribution
- **Reduced Collateral Damage**: No debris field from destruction
- **Reusable System**: Nets and launchers can be reloaded

:::

---

## Net Types & Categories

### By Deployment Method

| Type                         | Range   | Use Case                 | Complexity |
| ---------------------------- | ------- | ------------------------ | ---------- |
| **Air-to-Air (Interceptor)** | 500m+   | Active pursuit/intercept | High       |
| **Ground-Launched**          | 30-100m | Point defense            | Medium     |
| **Handheld Net Gun**         | 15-30m  | Close-range personnel    | Low        |
| **Fixed Turret**             | 50-150m | Perimeter defense        | Medium     |

### By Net Material

| Material              | Weight | Strength  | Cost | UV Resistance |
| --------------------- | ------ | --------- | ---- | ------------- |
| **Kevlar**            | Medium | Very High | High | Excellent     |
| **Dyneema (UHMWPE)**  | Light  | Very High | High | Good          |
| **Nylon (Polyamide)** | Medium | Medium    | Low  | Fair          |
| **HDPE**              | Light  | Medium    | Low  | Good          |
| **Spectra**           | Light  | Very High | High | Excellent     |

---

## Technical Specifications

### Air-to-Air Interceptor Net (Primary)

For use with RKV-M interceptor drone:

| Parameter             | Specification         | Notes                            |
| --------------------- | --------------------- | -------------------------------- |
| **Deployed Size**     | 3m × 3m (9 m²)        | Covers Group 1-2 UAS             |
| **Stowed Size**       | 150mm × 80mm cylinder | Fits net launcher pod            |
| **Material**          | Kevlar/Dyneema blend  | High strength, low weight        |
| **Mesh Size**         | 50mm × 50mm           | Captures rotors, prevents escape |
| **Breaking Strength** | 450 kg per strand     | Handles high-speed impact        |
| **Weight**            | 180g (net only)       | Includes weighted corners        |
| **Corner Weights**    | 4 × 25g tungsten      | Rapid deployment, stable flight  |
| **Deployment Speed**  | 15 m/s expansion      | Full size in 0.2 seconds         |
| **Operating Temp**    | -40°C to +85°C        | All-weather capable              |

### Large Format Net (Defense Mode)

For larger Group 2-3 fixed-wing targets:

| Parameter             | Specification          | Notes                          |
| --------------------- | ---------------------- | ------------------------------ |
| **Deployed Size**     | 6m × 6m (36 m²)        | Matches UAVOS standard         |
| **Stowed Size**       | 200mm × 120mm cylinder | Larger launcher required       |
| **Material**          | Reinforced Kevlar      | Higher impact tolerance        |
| **Mesh Size**         | 75mm × 75mm            | Allows airflow, captures wings |
| **Breaking Strength** | 800 kg per strand      | Fixed-wing impact speeds       |
| **Weight**            | 450g                   | Includes deployment mechanism  |
| **Target Speed**      | Up to 150 km/h         | Relative closure rate          |

### Ground-Launched Net

For SkySnare™ consumer product:

| Parameter             | Specification              | Notes                       |
| --------------------- | -------------------------- | --------------------------- |
| **Deployed Size**     | 2m × 2m (4 m²)             | Consumer drone sizes        |
| **Launch Range**      | 15-30m effective           | Compressed air propulsion   |
| **Material**          | HDPE/Nylon blend           | Cost-effective, reusable    |
| **Mesh Size**         | 40mm × 40mm                | Small drone capture         |
| **Breaking Strength** | 150 kg per strand          | Consumer drone weights      |
| **Weight**            | 85g                        | Lightweight for portability |
| **Reloads**           | User-replaceable cartridge | 30 second reload time       |

---

## Net Design Considerations

### Mesh Geometry

```
Standard Square Mesh (Recommended)
┌───┬───┬───┬───┐
│   │   │   │   │
├───┼───┼───┼───┤
│   │   │   │   │  50mm spacing
├───┼───┼───┼───┤
│   │   │   │   │
├───┼───┼───┼───┤
│   │   │   │   │
└───┴───┴───┴───┘

Diamond Mesh (Alternative)
    ╱╲    ╱╲    ╱╲
   ╱  ╲  ╱  ╲  ╱  ╲
  ╱    ╲╱    ╲╱    ╲   Better drape
  ╲    ╱╲    ╱╲    ╱   around target
   ╲  ╱  ╲  ╱  ╲  ╱
    ╲╱    ╲╱    ╲╱
```

### Key Design Factors

| Factor                 | Consideration                        |
| ---------------------- | ------------------------------------ |
| **Mesh Size**          | Must be smaller than rotor diameter  |
| **Strand Diameter**    | Balance strength vs. weight vs. drag |
| **Edge Reinforcement** | Prevent tearing at corners           |
| **Weighted Corners**   | Ensure proper deployment and wrap    |
| **Visibility**         | High-vis colors for recovery         |
| **Anti-Tangle**        | Fold pattern for reliable deployment |

---

## Commercial Net Systems (Reference)

### Fortem DroneHunter F700

| Attribute        | Details                                    |
| ---------------- | ------------------------------------------ |
| **Manufacturer** | Fortem Technologies (USA)                  |
| **Type**         | Autonomous interceptor drone               |
| **Success Rate** | 85% mid-air capture                        |
| **Net Capacity** | 4 net heads per mission                    |
| **Net Variants** | Attack mode (small) / Defense mode (large) |
| **Reusability**  | Fully reusable system                      |
| **Guidance**     | Radar-guided, autonomous                   |

[Fortem Technologies](https://fortemtech.com/products/dronehunter-f700/)

---

### UAVOS Drone-Capture Net System

| Attribute        | Details               |
| ---------------- | --------------------- |
| **Manufacturer** | UAVOS (USA/Latvia)    |
| **Net Size**     | 6,000 × 6,000 mm      |
| **Deployment**   | Shot from UAV carrier |
| **Purpose**      | Capture and retrieval |
| **Target**       | Small drones          |

[UAVOS](https://www.uavos.com/products/uas-payloads/interception-system-for-uav/)

---

### Theiss UAV Solutions - EXCIPIO

| Attribute        | Details                                        |
| ---------------- | ---------------------------------------------- |
| **Manufacturer** | Theiss UAV Solutions (USA)                     |
| **Type**         | Non-electronic, non-destructive                |
| **Patent**       | Patent pending                                 |
| **Options**      | Release with drag chute OR tethered relocation |
| **Target**       | Surgical removal of threats                    |

[Theiss UAV Solutions](https://www.unmannedairspace.info/c-uas-search/theiss-uav-solutions/)

---

### LAMAT Interceptor

| Attribute        | Details                                |
| ---------------- | -------------------------------------- |
| **Manufacturer** | LAMAT (startup)                        |
| **Innovation**   | Detachable rotors attached to net      |
| **Net Material** | Kevlar                                 |
| **Mechanism**    | Blocks rotors, disrupts glider control |
| **Recovery**     | Parachute descent with sound signal    |
| **Advantage**    | High power-to-weight ratio             |

---

## Handheld Net Gun Systems

For personnel deployment in close-range scenarios:

| System             | Range | Net Size    | Propulsion       | Price Range |
| ------------------ | ----- | ----------- | ---------------- | ----------- |
| **SkyWall Patrol** | 100m  | 2m × 2m     | Compressed air   | $15,000+    |
| **DroneDefender**  | 50m   | 1.5m × 1.5m | CO2 cartridge    | $8,000+     |
| **NetGun X1**      | 30m   | 2m × 2m     | Compressed air   | $3,000+     |
| **Bazooka-style**  | 25m   | Variable    | Spring/pneumatic | $500-2,000  |

**Considerations:**

- Most net guns claim 30m effective range
- Not classified as firearms (legal for civilian use)
- Minimal training required
- Portable and lightweight

[Net Gun Overview](https://www.unmannedsystemstechnology.com/expo/drone-capture-nets/)

---

## DIY Net Construction Guide

### Materials Needed

| Component             | Specification                  | Quantity | Est. Cost   |
| --------------------- | ------------------------------ | -------- | ----------- |
| **Netting Material**  | HDPE or Nylon, 3mm cord        | 15m²     | $30-50      |
| **Edge Rope**         | 5mm braided nylon              | 15m      | $15-25      |
| **Corner Weights**    | Steel or tungsten, 20-30g each | 4        | $10-20      |
| **Swivels**           | Stainless steel, ball-bearing  | 4        | $8-15       |
| **Attachment Points** | D-rings, stainless             | 8        | $10-15      |
| **Thread**            | Heavy-duty polyester           | 1 spool  | $5-10       |
| **Total**             |                                |          | **$80-135** |

### Construction Steps

#### Step 1: Cut the Net

```
Cut netting to size + 150mm margin on all edges

        ┌─────────────────────────────┐
        │                             │
        │   ┌───────────────────┐     │
        │   │                   │     │
150mm → │   │   FINAL NET       │     │ ← 150mm
margin  │   │   (3m × 3m)       │     │   margin
        │   │                   │     │
        │   └───────────────────┘     │
        │                             │
        └─────────────────────────────┘
                    ↑
              150mm margin
```

#### Step 2: Edge Reinforcement

1. Fold edge margin over rope
2. Sew with heavy-duty thread (double stitch)
3. Use bar tacks at stress points
4. Reinforce corners with additional passes

#### Step 3: Corner Weights

```
Corner Detail:
        ╲
         ╲
    D-ring ●──┐
           │  │
    Swivel ○  │
           │  │
    Weight ■──┘
          30g
```

1. Attach D-ring to corner through reinforced edge
2. Connect ball-bearing swivel (prevents tangling)
3. Attach weighted pouch below swivel
4. Ensure weights can rotate freely

#### Step 4: Folding Pattern

For reliable deployment:

```
1. Lay flat     2. Accordion fold    3. Roll from corners
┌─────────┐     ├─────────┤          ●────────●
│         │     ├─────────┤           ╲      ╱
│         │  →  ├─────────┤     →      ╲    ╱
│         │     ├─────────┤             ╲  ╱
└─────────┘     ├─────────┤              ●
```

### Testing Protocol

| Test           | Method                      | Pass Criteria      |
| -------------- | --------------------------- | ------------------ |
| **Deployment** | Manual throw from 3m height | Full open in <0.5s |
| **Strength**   | Hang 50kg weight for 1 hour | No strand breakage |
| **Wrap**       | Deploy onto test frame      | >80% coverage      |
| **Recovery**   | 10 deployment cycles        | No tangling        |

---

## Purchasing Options

### Ready-Made Nets

#### Professional/Military Grade

| Supplier      | Product          | Size    | Price Range | Notes            |
| ------------- | ---------------- | ------- | ----------- | ---------------- |
| **Fortem**    | DroneHunter Nets | Various | Contact     | Military spec    |
| **UAVOS**     | Capture System   | 6m × 6m | $5,000+     | Complete system  |
| **OpenWorks** | SkyWall Nets     | 2m × 2m | $200-500 ea | Replacement nets |
| **Theiss**    | EXCIPIO Nets     | Various | Contact     | Custom solutions |

#### Consumer/Hobbyist

| Supplier           | Product        | Size     | Price   | Notes                 |
| ------------------ | -------------- | -------- | ------- | --------------------- |
| **Amazon**         | Cargo nets     | Various  | $20-100 | Requires modification |
| **Nets Inc.**      | Custom netting | Custom   | $50-200 | Made to spec          |
| **Alibaba**        | Drone nets     | 2-5m     | $30-150 | Quality varies        |
| **Fishing supply** | Cast nets      | 3-4m dia | $50-150 | Adapt for drones      |

### Net Material Suppliers

| Material          | Supplier           | Min Order | Price/m²  |
| ----------------- | ------------------ | --------- | --------- |
| **Kevlar cord**   | DuPont dealers     | 100m      | $2-5/m    |
| **Dyneema**       | DSM distributors   | 100m      | $3-8/m    |
| **UHMWPE net**    | Industrial supply  | 10m²      | $15-30/m² |
| **HDPE netting**  | Agriculture supply | 25m²      | $5-10/m²  |
| **Nylon netting** | Fabric stores      | 5m²       | $8-15/m²  |

### Weighted Corner Options

| Type               | Weight | Supplier       | Price    |
| ------------------ | ------ | -------------- | -------- |
| **Tungsten beads** | 20-50g | Fishing supply | $5-15 ea |
| **Lead weights**   | 20-50g | Hardware store | $2-5 ea  |
| **Steel balls**    | 30-60g | McMaster-Carr  | $3-8 ea  |
| **Brass weights**  | 25-40g | Craft supply   | $4-10 ea |

---

## Integration with RKV-M

### Net Launcher Pod

| Parameter            | Specification           |
| -------------------- | ----------------------- |
| **Pod Dimensions**   | 180mm × 100mm × 100mm   |
| **Weight (loaded)**  | 350g                    |
| **Nets per Pod**     | 1                       |
| **Pods per RKV-M**   | 4                       |
| **Launch Mechanism** | Compressed gas + spring |
| **Launch Velocity**  | 25 m/s                  |
| **Effective Range**  | 10-30m from target      |
| **Reload Time**      | 45 seconds (ground)     |

### Engagement Sequence

```
1. Target Acquired
   RKV-M approaches target from above/behind

2. Intercept Position
   Close to 15-25m range
   Match target velocity vector

3. Net Launch
   Lead target by calculated offset
   Launch net toward predicted position

4. Net Deployment
   Net expands in 0.2 seconds
   Weighted corners create spread pattern

5. Capture
   Net wraps around target rotors
   Rotor entanglement stops motors

6. Descent
   Target descends under net weight
   Optional: Tether for controlled descent
```

---

## Maintenance & Storage

### Net Care

| Task              | Frequency                 | Procedure                 |
| ----------------- | ------------------------- | ------------------------- |
| **Inspection**    | Before each use           | Check for tears, fraying  |
| **Cleaning**      | After each capture        | Rinse, dry completely     |
| **Refolding**     | After each use            | Follow folding pattern    |
| **UV Protection** | Monthly                   | Apply UV protectant spray |
| **Replacement**   | 50 deployments or 2 years | Full net replacement      |

### Storage Conditions

| Parameter       | Requirement             |
| --------------- | ----------------------- |
| **Temperature** | 5-35°C                  |
| **Humidity**    | <70% RH                 |
| **Light**       | Dark (UV protection)    |
| **Container**   | Breathable bag or case  |
| **Position**    | Flat or properly folded |

---

## Compliance & Safety

### Regulatory Considerations

| Jurisdiction | Consideration                            |
| ------------ | ---------------------------------------- |
| **USA**      | Net guns not classified as firearms      |
| **EU**       | Varies by country                        |
| **UK**       | Generally permitted for property defense |
| **Canada**   | Check provincial regulations             |

### Safety Guidelines

1. **Never deploy** toward people or animals
2. **Test deployment** in safe area first
3. **Inspect** weighted corners before use
4. **Train** all operators on proper technique
5. **Consider** net recovery procedures
6. **Document** all captures for evidence

---

## Related Documents

- [RKV-M Specifications](./rkv-m-specifications)
- [Operations Manual](../../operations/operations-manual)

---

_This document provides specifications for drone capture nets used in the
Phoenix Rooivalk system. © 2025 Phoenix Rooivalk. All rights reserved._
