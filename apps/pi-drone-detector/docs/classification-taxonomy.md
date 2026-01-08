# Comprehensive Airborne Object Classification Taxonomy

## Design Philosophy

For production drone detection, we need to:

1. **Detect drones** with high confidence (minimize false negatives)
2. **Reject non-drones** accurately (minimize false positives)
3. **Identify what we rejected** for debugging and improvement

---

## Complete Taxonomy (27 Classes)

### Target Classes - DRONES (Classes 0-4)

What we want to detect and alert on.

| ID  | Class              | Examples             | Characteristics         |
| --- | ------------------ | -------------------- | ----------------------- |
| 0   | `drone_multirotor` | DJI Mavic, Phantom   | 4-8 arms, rotors, hover |
| 1   | `drone_fixedwing`  | senseFly eBee, Disco | Wing shape, gliding     |
| 2   | `drone_vtol`       | Wingcopter, Trinity  | Hybrid hover/flight     |
| 3   | `drone_racing`     | TinyWhoop, FPV quads | Small, fast, agile      |
| 4   | `drone_toy`        | Holy Stone, Syma     | Small, colorful         |

### Birds (Classes 5-9)

Highest confusion risk - similar size, flight patterns.

| ID  | Class         | Examples             | Size     | Flight Pattern |
| --- | ------------- | -------------------- | -------- | -------------- |
| 5   | `bird_tiny`   | Hummingbird, sparrow | <15cm    | Darting, hover |
| 6   | `bird_small`  | Pigeon, crow, magpie | 15-40cm  | Flapping       |
| 7   | `bird_medium` | Seagull, duck, owl   | 40-80cm  | Soaring        |
| 8   | `bird_large`  | Eagle, hawk, vulture | >80cm    | Circling       |
| 9   | `bird_flock`  | Murmurations, geese  | Multiple | Group movement |

### Manned Aircraft (Classes 10-13)

CRITICAL: Must never be misidentified as target.

| ID  | Class              | Examples           | Features          |
| --- | ------------------ | ------------------ | ----------------- |
| 10  | `aircraft_fixed`   | Cessna, 747, jets  | Wings, tail, fast |
| 11  | `aircraft_rotary`  | News/military heli | Main+tail rotor   |
| 12  | `aircraft_glider`  | Hang/paraglider    | No engine, slow   |
| 13  | `aircraft_balloon` | Hot air, blimp     | Large, slow       |

### Recreational Objects (Classes 14-18)

Common in parks, beaches, events.

| ID  | Class             | Examples            | Characteristics          |
| --- | ----------------- | ------------------- | ------------------------ |
| 14  | `kite`            | Diamond, stunt kite | Tethered, wind-dependent |
| 15  | `balloon_party`   | Helium balloons     | Small, drifting          |
| 16  | `balloon_weather` | Radiosonde          | High altitude, payload   |
| 17  | `lantern`         | Sky lantern         | Glowing, night-time      |
| 18  | `rc_plane`        | RC aircraft/heli    | Different profile        |

### Sports/Thrown Objects (Classes 19-20)

Brief airtime, predictable trajectory.

| ID  | Class        | Examples                 | Characteristics      |
| --- | ------------ | ------------------------ | -------------------- |
| 19  | `ball`       | Soccer, basketball, golf | Spherical, parabolic |
| 20  | `projectile` | Frisbee, arrow, javelin  | Fast, spinning       |

### Debris/Environmental (Classes 21-23)

Common false positives in outdoor environments.

| ID  | Class            | Examples                 | Characteristics        |
| --- | ---------------- | ------------------------ | ---------------------- |
| 21  | `debris_light`   | Plastic bag, paper, leaf | Irregular, wind-driven |
| 22  | `debris_organic` | Seeds, feathers, pollen  | Small, drifting        |
| 23  | `insect`         | Fly, bee, dragonfly      | Close-up looks large   |

### Atmospheric/Artifacts (Classes 24-26)

Camera and environmental artifacts.

| ID  | Class        | Examples               | Characteristics     |
| --- | ------------ | ---------------------- | ------------------- |
| 24  | `weather`    | Rain, snow, hail, dust | Many small, uniform |
| 25  | `artifact`   | Lens flare, web        | Static, optical     |
| 26  | `background` | Sky, clouds, sun       | No distinct object  |

---

## Practical Groupings

### For MVP (1 week, ~$15 training)

Group into 10 classes:

```yaml
nc: 10
names:
  0: drone # All drone types (0-4)
  1: bird_small # Tiny + small birds (5-6)
  2: bird_large # Medium + large + flock (7-9)
  3: aircraft # All manned (10-13)
  4: recreational # Kites, balloons, RC (14-18)
  5: sports # Balls, frisbees (19-20)
  6: debris # Light + organic debris (21-22)
  7: insect # Insects (23)
  8: atmospheric # Weather + artifacts (24-25)
  9: background # Nothing (26)
```

### For Production (2-3 weeks, ~$30-50 training)

Use all 27 classes for maximum granularity.

### For Research/Military (ongoing, $100+)

Add sub-classes for specific drone models, bird species, etc.

---

## Data Sources by Class

| Class       | Primary Sources                   | Est. Images |
| ----------- | --------------------------------- | ----------- |
| drone\_\*   | Drone-vs-Bird, Anti-UAV, Roboflow | 10,000+     |
| bird\_\*    | CUB-200, iNaturalist, eBird       | 100,000+    |
| aircraft    | OpenImages, Flickr, PlaneSpotters | 50,000+     |
| kite        | OpenImages, Flickr, custom        | 5,000+      |
| balloon\_\* | OpenImages, Flickr, custom        | 10,000+     |
| lantern     | Flickr, YouTube frames            | 2,000+      |
| rc_plane    | YouTube frames, RC forums         | 3,000+      |
| ball        | COCO, OpenImages                  | 50,000+     |
| projectile  | COCO, OpenImages, sports          | 10,000+     |
| debris\_\*  | Custom collection required        | 1,000+      |
| insect      | iNaturalist, custom               | 20,000+     |
| weather     | Custom, weather datasets          | 5,000+      |
| artifact    | Custom, lens flare datasets       | 2,000+      |
| background  | Any sky images, ImageNet          | 100,000+    |

---

## Training Strategy

### Phase 1: Binary Classifier (Week 1)

- DRONE vs NOT_DRONE
- Fast to train, high accuracy
- Use as primary filter

### Phase 2: Multi-class Refinement (Week 2)

- Train full 10-class model
- Use binary model predictions as input feature
- Ensemble for best accuracy

### Phase 3: Hierarchical Classifier (Week 3+)

```text
Input Image
    │
    ▼
[Binary: Is it flying?]
    │
    ├── NO → background
    │
    └── YES → [Is it a drone?]
              │
              ├── HIGH (>0.8) → ALERT + drone subtype
              │
              └── LOW (<0.8) → [What is it?]
                              │
                              └── Multi-class: bird/aircraft/debris/etc.
```

---

## Edge Cases to Consider

### High-Risk False Positives

1. **Hummingbirds** - Can hover like drones
2. **RC helicopters** - Similar shape to some drones
3. **Kites with tails** - Can look like fixed-wing drones
4. **Distant balloons** - Can appear drone-sized

### High-Risk False Negatives

1. **Camouflaged drones** - Military, painted to match sky
2. **Very small drones** - Racing/toy drones at distance
3. **Drones carrying payloads** - Shape changes significantly
4. **Drones in swarms** - Might detect as bird flock

### Environmental Challenges

1. **Dawn/dusk** - Silhouettes only, hard to distinguish
2. **Against sun** - Lens flare, silhouettes
3. **Rain/snow** - Many false detections
4. **Night** - Need IR camera, different signatures
5. **Fog/haze** - Reduced visibility, blurred edges

---

## Recommended Model Architecture

### For Raspberry Pi (Speed Priority)

```text
YOLOv5n/YOLOv8n
├── Input: 320x320
├── Binary head: drone confidence
├── Multi-class head: 10 classes
└── Output: Combined score + class

Export: TFLite INT8 quantized
FPS: 8-15 on Pi 4, 15-25 on Pi 5
```

### For Edge Device with Coral (Accuracy Priority)

```
YOLOv5s/YOLOv8s
├── Input: 416x416
├── Binary head: drone confidence
├── Multi-class head: 27 classes
├── Tracking: DeepSORT for trajectory
└── Output: Score + class + track ID

Export: TFLite INT8 for Edge TPU
FPS: 30-60 with Coral USB
```

---

## Evaluation Metrics

### Primary Metrics

- **Drone Detection Rate (Recall)**: >95% (can't miss drones)
- **False Positive Rate**: <5% (alerts must be meaningful)
- **Latency**: <100ms detection to alert

### Secondary Metrics

- **mAP@0.5**: Overall detection quality
- **Per-class accuracy**: Identify weak points
- **Confusion matrix**: Understand misclassifications

### Critical Scenarios to Test

1. Drone at max range (50m)
2. Drone against cloudy sky
3. Drone near birds
4. Multiple drones (swarm)
5. Fast-moving drone
6. Stationary hovering drone
7. Drone at dawn/dusk
