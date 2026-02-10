# Audio PWM Servo Build Guide

Complete hardware build instructions for controlling 2 hobby servos
using a laptop's audio output — no microcontroller needed.

**Two paths covered:**
- **Path A**: Wired via headphone jack (~5ms latency)
- **Path B**: Wireless via Bluetooth speaker board (~100-200ms latency)

Share this with whoever is building the hardware side.

---

## How It Works (The Big Picture)

Normal servo control:
```
Microcontroller --> PWM signal (50Hz, 1000-2000μs pulse) --> Servo
```

What we do instead:
```
Laptop --> Audio output (50Hz square wave) --> Transistor circuit --> Servo
```

The software generates a precise 50Hz waveform through the audio output.
Left channel controls yaw servo, right channel controls pitch servo.
A simple transistor circuit converts the audio voltage into the 0-5V
digital pulses that servos expect.

---

## What You Need

### Electronic Components (salvage from ANY junk electronics)

| Qty | Component | Where To Find It | Acceptable Range |
|-----|-----------|-------------------|------------------|
| 2 | NPN transistor | Amplifier boards, radios, BT speakers, TV remotes, charger boards | BC547, BC548, 2N2222, S8050, C1815 — any small-signal NPN works |
| 2 | 10kΩ resistor | Any PCB | 4.7kΩ to 47kΩ all work. Just limits base current. |
| 2 | 4.7kΩ resistor | Any PCB | 1kΩ to 10kΩ all work. Pull-up to 5V. |
| - | Wire | Headphone cables, USB cables, any stranded wire | Short runs, doesn't need to be thick |
| - | Solder + iron | - | Hot glue + wire wrapping works for testing |

### Identifying NPN Transistors On Salvaged Boards

Look for small black plastic components with 3 legs in a half-circle
shape (TO-92 package). They're typically marked with a code:

```
Common NPN markings:
  BC547, BC548, BC549 (European, very common)
  2N2222, 2N3904 (American, very common)
  S8050, S9013, S9014 (Chinese, found in cheap electronics)
  C1815 (Japanese, found in old radios/TVs)
```

If you can't read the marking, test it:
- Set multimeter to diode mode
- Base-to-Emitter: should read ~0.6V one way, OL the other
- Base-to-Collector: should read ~0.6V one way, OL the other
- Collector-to-Emitter: should read OL both ways

### Identifying Resistors

**Through-hole (with color bands):**
```
10kΩ = Brown Black Orange Gold
4.7kΩ = Yellow Violet Red Gold
```

**SMD (surface mount, tiny rectangles):**
```
10kΩ = marked "103" or "1002"
4.7kΩ = marked "472" or "4701"
```

SMD resistors work fine — just harder to solder wires to.
Use a blob of solder to tack a wire onto each end.

### Power

| What | Source |
|------|--------|
| Servo power (5V) | RC battery + BEC, USB charger (cut cable), 4xAA batteries |
| Laptop | Own battery/charger |
| BT speaker (Path B) | Its own internal battery |

**IMPORTANT: Do NOT power servos from the headphone jack.
The audio output provides signal only, not power.**

---

## Path A: Wired (Headphone Jack)

### Advantages
- Simple: just a 3.5mm cable + 2 transistors + 4 resistors
- Low latency: ~5ms
- Reliable: no Bluetooth pairing issues

### Disadvantages
- Wired to laptop (limited range)
- Uses your headphone jack (no other audio while running)

### What You Need (Additional)
- 3.5mm audio cable (or cut an old pair of headphones)
- The 3.5mm plug has 3 or 4 contacts:

```
3.5mm TRS plug (stereo):
  Tip    = Left channel  (yaw servo)
  Ring   = Right channel (pitch servo)
  Sleeve = Ground        (shared)

    ┌─────┐
    │ TIP │ RING │ SLEEVE │
    └─────┘      │        │
      Left     Right    Ground
```

### Wiring Diagram

```
                            +5V (from servo battery/BEC)
                             │
                            4.7kΩ
                             │
3.5mm Tip ──── 10kΩ ──── B ─┤           ┌──── Yaw Servo Signal (orange/white wire)
(Left ch)                   NPN          │
                          E ─┤           │
                             │           │
                            GND ─────────┘ (shared)
                             │
                             └──── Servo GND (brown/black wire)
                                   Servo +5V (red wire) ──── +5V battery


                            +5V
                             │
                            4.7kΩ
                             │
3.5mm Ring ─── 10kΩ ──── B ─┤           ┌──── Pitch Servo Signal
(Right ch)                  NPN          │
                          E ─┤           │
                             │           │
                            GND ─────────┘
                             │
                             └──── Servo GND
                                   Servo +5V ──── +5V battery


3.5mm Sleeve ──── GND (connect to circuit GND)
```

### Step-by-Step Build

1. **Cut the audio cable**
   - Cut one end off a 3.5mm audio cable (or old headphones)
   - You'll see 2-3 inner wires + a ground (usually bare copper or green)
   - Left = usually white or red
   - Right = usually red or blue
   - Ground = bare copper, green, or black
   - Use a multimeter on continuity to verify which wire is which

2. **Build Channel 1 (Yaw — Left)**
   - Solder 10kΩ resistor to Left audio wire
   - Solder other end of 10kΩ to the BASE pin of transistor #1
   - Connect EMITTER pin to ground
   - Solder 4.7kΩ resistor between COLLECTOR pin and +5V
   - Run a wire from COLLECTOR to the yaw servo signal wire

3. **Build Channel 2 (Pitch — Right)**
   - Same circuit, using the Right audio wire
   - Connect to pitch servo signal wire

4. **Connect grounds**
   - Audio cable ground, transistor emitters, servo grounds,
     and battery negative all connect together

5. **Connect servo power**
   - Servo red wires go to +5V battery/BEC
   - NOT to the audio cable

### NPN Transistor Pinout Reference

```
Most common TO-92 pinout (flat side facing you):

        ┌───┐
        │   │
      E │ B │ C
        │   │
        └───┘

  BC547/BC548: E-B-C (left to right, flat side facing you)
  2N2222:      E-B-C (same)
  S8050:       E-B-C (same)

  VERIFY with datasheet if uncertain. Wrong pinout won't damage
  anything but it won't work.
```

---

## Path B: Wireless (Bluetooth Speaker)

### Advantages
- Wireless: no cable to the laptop
- Range: 5-10 meters typical Bluetooth range
- Self-powered: BT speaker has its own battery

### Disadvantages
- Higher latency: ~100-200ms (SBC codec)
- Must pair and stay connected
- Audio compression may slightly affect signal quality
- More complex disassembly

### What You Need (Additional)
- A Bluetooth speaker (any cheap one works)
- The speaker must be stereo (2 speaker cones) for 2 servo channels
  - If mono (1 speaker), you only get 1 servo channel

### Disassembly Guide

1. **Open the speaker**
   - Remove screws (check behind rubber feet and labels)
   - Pry apart carefully (usually clips + screws)

2. **Identify the speaker wires**
   - Find the wires going from the PCB to the speaker cone(s)
   - Stereo: 4 wires (2 per speaker) — SPK1+/SPK1- and SPK2+/SPK2-
   - Mono: 2 wires — SPK+/SPK-
   - These are usually red(+) and black(-), or marked on the PCB

3. **Desolder the speaker wires**
   - Remove the wires from the speaker cones
   - You want the PCB end, not the speaker end
   - The PCB pads are now your audio output

4. **Identify which channel is which**
   - Pair the speaker with your phone
   - Play a "left channel only" test tone (search YouTube)
   - Measure which pair of pads has signal with a multimeter (AC mode)
   - Label: L=yaw, R=pitch

### Wiring Diagram

```
BT Speaker PCB
  ┌─────────────────────┐
  │                     │
  │  SPK1+ ─────────────┼──── 10kΩ ──── B ─┐
  │  SPK1- ──── GND     │                  NPN    +5V ── 4.7kΩ ── C ── Yaw Servo Signal
  │                     │                E ─┘
  │  SPK2+ ─────────────┼──── 10kΩ ──── B ─┐                       │
  │  SPK2- ──── GND     │                  NPN    +5V ── 4.7kΩ ── C ── Pitch Servo Signal
  │                     │                E ─┘
  │                     │                  │
  │  Battery ── charges │                 GND (shared with servo GND + battery -)
  │  via USB            │
  └─────────────────────┘
```

### Step-by-Step Build

1. **Disassemble speaker** (as above)

2. **Salvage components** from the speaker PCB edges if needed
   - Look for transistors near the amplifier IC
   - Look for resistors anywhere on the board
   - You can also salvage from modem boards

3. **Build the transistor circuit** (same as Path A)
   - SPK1+ (left) → 10kΩ → NPN #1 base → same circuit
   - SPK2+ (right) → 10kΩ → NPN #2 base → same circuit

4. **Connect grounds**
   - SPK1-/SPK2- (speaker ground) to circuit ground
   - Servo ground to circuit ground
   - Battery negative to circuit ground

5. **Power servos** from separate battery/BEC (not from speaker battery)

6. **Reassemble speaker** (optional — can leave PCB exposed for testing)

### Bluetooth Pairing

1. Turn on the BT speaker
2. On your laptop: pair with the speaker as an audio device
3. Set the speaker as the audio output device
4. Run: `python test_audio_pwm.py --list-devices`
5. Find the BT speaker device number
6. Test: `python test_audio_pwm.py --sweep --device <number>`

---

## Testing (No Circuit Needed)

Before building any circuit, verify the software works:

### Step 1: Install dependency
```bash
pip install sounddevice
```

### Step 2: List audio devices
```bash
cd apps/detector/src
python test_audio_pwm.py --list-devices
```

### Step 3: Test with headphones
```bash
# TURN VOLUME TO 20% FIRST
python test_audio_pwm.py --sweep
```

You'll hear a low 50Hz buzz that changes slightly as the servo
position sweeps. Left ear = yaw, right ear = pitch.

### Step 4: Test with multimeter (optional but recommended)
- Set multimeter to AC voltage mode
- Touch probes to headphone jack tip + sleeve
- Run sweep test
- You should see voltage changing as position sweeps (~0.3-1.0V AC)

### Step 5: Test interactive control
```bash
python test_audio_pwm.py
```
Use WASD keys to move servo positions.

### Step 6: Test with webcam tracking
```bash
pip install opencv-python
python test_audio_pwm.py --track
```
Move an object in front of the camera. The audio output will track it.

---

## After Building: Full System Config

Once the circuit is built and servos are moving:

Edit `config.yaml`:
```yaml
turret_control:
  # For headphone jack:
  transport_type: audio_pwm
  audio_device: null  # or specific device number

  # PID tuning (adjust these while testing)
  yaw_kp: 0.8
  yaw_ki: 0.05
  yaw_kd: 0.15
  pitch_kp: 0.6
  pitch_ki: 0.03
  pitch_kd: 0.10
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| No sound at all | Wrong audio device selected | Run `--list-devices`, try different device numbers |
| Servo jitters wildly | Audio volume too high | Turn volume down to 30-50% |
| Servo doesn't move | Audio volume too low | Turn volume up. Transistor needs enough signal to switch |
| Servo stuck at one end | Wrong transistor pinout | Check E-B-C pin order for your specific transistor |
| One channel works, other doesn't | Wiring error on one channel | Check connections with multimeter continuity mode |
| BT speaker cuts out | Speaker sleep/power saving | Some speakers sleep after silence. The 50Hz signal should prevent this |
| Servo moves opposite direction | Left/right channels swapped | Swap yaw_kp to negative, or swap audio wires |

### Finding The Sweet Spot (Volume Calibration)

The transistor needs enough audio voltage to fully turn on (~0.6V base-emitter).
Too low = servo doesn't respond. Too high = audio distortion.

1. Start with volume at 30%
2. Run sweep test
3. Increase volume until servos move smoothly
4. If servos jitter at high volume, back off slightly

Optimal is usually 40-70% volume depending on the audio output.

---

## Parts Summary

**Minimum for 2 servos (both paths):**

| Part | Qty | Size | Found In |
|------|-----|------|----------|
| NPN transistor (any small-signal) | 2 | TO-92 (3 pins) | Amplifier boards, radios, speakers, chargers |
| Resistor ~10kΩ | 2 | Through-hole or SMD | Any PCB |
| Resistor ~4.7kΩ | 2 | Through-hole or SMD | Any PCB |
| Wire | ~30cm | Any gauge | Headphone cables, USB cables |
| 5V power source | 1 | - | RC battery+BEC, USB charger, 4xAA |

**Path A additional:** 3.5mm audio cable or old headphones
**Path B additional:** Bluetooth speaker (stereo)
