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

| ID  | Class              | Examples                                           | Visual Characteristics                                |
| --- | ------------------ | -------------------------------------------------- | ----------------------------------------------------- |
| 0   | `drone_multirotor` | DJI Mavic, Phantom, Inspire; custom quads/hex/octo | Symmetric, 4-8 arms, visible rotors, hover capability |
| 1   | `drone_fixedwing`  | senseFly eBee, Parrot Disco, military UAVs         | Wing shape, no hover, gliding motion                  |
| 2   | `drone_vtol`       | Wingcopter, Quantum Trinity                        | Hybrid - transitions between hover and flight         |
| 3   | `drone_racing`     | TinyWhoop, 5" FPV quads                            | Small, fast, aggressive maneuvering                   |
| 4   | `drone_toy`        | Holy Stone, Syma, cheap Amazon drones              | Small, often colorful, less stable flight             |

### Birds (Classes 5-9)

Highest confusion risk - similar size, flight patterns.

| ID  | Class         | Examples                             | Size     | Flight Pattern                    |
| --- | ------------- | ------------------------------------ | -------- | --------------------------------- |
| 5   | `bird_tiny`   | Hummingbird, sparrow, finch          | <15cm    | Darting, hovering (hummingbirds!) |
| 6   | `bird_small`  | Pigeon, starling, crow, magpie       | 15-40cm  | Flapping, direct flight           |
| 7   | `bird_medium` | Seagull, duck, owl, heron            | 40-80cm  | Soaring, gliding                  |
| 8   | `bird_large`  | Eagle, hawk, vulture, pelican, goose | >80cm    | Soaring, circling, slow wingbeats |
| 9   | `bird_flock`  | Murmurations, geese formations       | Multiple | Coordinated group movement        |

### Manned Aircraft (Classes 10-13)

CRITICAL: Must never be misidentified as target.

| ID  | Class              | Examples                           | Distinguishing Features           |
| --- | ------------------ | ---------------------------------- | --------------------------------- |
| 10  | `aircraft_fixed`   | Cessna, 747, fighter jets          | Wings, tail, contrails, very fast |
| 11  | `aircraft_rotary`  | News helicopter, military chopper  | Main rotor, tail rotor, loud      |
| 12  | `aircraft_glider`  | Hang glider, paraglider, sailplane | No engine, person visible, slow   |
| 13  | `aircraft_balloon` | Hot air balloon, blimp, aerostat   | Large, slow, round/elongated      |

### Recreational Objects (Classes 14-18)

Common in parks, beaches, events.

| ID  | Class             | Examples                             | Characteristics                          |
| --- | ----------------- | ------------------------------------ | ---------------------------------------- |
| 14  | `kite`            | Diamond kite, stunt kite, power kite | Tethered, wind-dependent, string visible |
| 15  | `balloon_party`   | Helium balloons, balloon animals     | Small, drifting, shiny/matte             |
| 16  | `balloon_weather` | Radiosonde, research balloons        | White/silver, high altitude, payload     |
| 17  | `lantern`         | Sky lantern, Chinese lantern         | Glowing, drifting, night-time            |
| 18  | `rc_plane`        | RC aircraft, RC helicopter           | Similar to drones but different profile  |

### Sports/Thrown Objects (Classes 19-20)

Brief airtime, predictable trajectory.

| ID  | Class        | Examples                                     | Characteristics                      |
| --- | ------------ | -------------------------------------------- | ------------------------------------ |
| 19  | `ball`       | Soccer, basketball, football, golf, baseball | Spherical/oval, parabolic trajectory |
| 20  | `projectile` | Frisbee, arrow, javelin, clay pigeon         | Fast, spinning, short flight time    |

### Debris/Environmental (Classes 21-23)

Common false positives in outdoor environments.

| ID  | Class            | Examples                                   | Characteristics                         |
| --- | ---------------- | ------------------------------------------ | --------------------------------------- |
| 21  | `debris_light`   | Plastic bag, paper, wrapper, leaf          | Irregular motion, wind-driven           |
| 22  | `debris_organic` | Seeds (maple, dandelion), feathers, pollen | Small, drifting, seasonal               |
| 23  | `insect`         | Fly, bee, dragonfly, butterfly, moth       | Very small, close to camera looks large |

### Atmospheric/Artifacts (Classes 24-26)

Camera and environmental artifacts.

| ID  | Class        | Examples                               | Characteristics                       |
| --- | ------------ | -------------------------------------- | ------------------------------------- |
| 24  | `weather`    | Rain, snow, hail, dust                 | Many small objects, uniform direction |
| 25  | `artifact`   | Lens flare, reflection, spider web     | Static position, optical patterns     |
| 26  | `background` | Sky, clouds, sun, moon, stars, nothing | No distinct object                    |

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

| Class        | Primary Sources                            | Est. Available Images   |
| ------------ | ------------------------------------------ | ----------------------- |
| drone\_\*    | Drone-vs-Bird, Anti-UAV, Roboflow, MAV-VID | 10,000+                 |
| bird\_\*     | Drone-vs-Bird, CUB-200, iNaturalist, eBird | 100,000+                |
| aircraft\_\* | OpenImages, Flickr, PlaneSpotters          | 50,000+                 |
| kite         | OpenImages, Flickr, custom                 | 5,000+                  |
| balloon\_\*  | OpenImages, Flickr, custom                 | 10,000+                 |
| lantern      | Flickr, YouTube frames, custom             | 2,000+                  |
| rc_plane     | YouTube frames, RC forums, custom          | 3,000+                  |
| ball         | COCO, OpenImages                           | 50,000+                 |
| projectile   | COCO, OpenImages, sports datasets          | 10,000+                 |
| debris\_\*   | Custom collection required                 | 1,000+ (need to create) |
| insect       | iNaturalist, custom close-range shots      | 20,000+                 |
| weather      | Custom, weather datasets                   | 5,000+                  |
| artifact     | Custom, lens flare datasets                | 2,000+                  |
| background   | Any sky images, ImageNet sky               | 100,000+                |

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

```
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

```
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
