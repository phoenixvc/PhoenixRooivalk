> **⚠️ DEPRECATED**: This document contains references to Netlify deployment.
> The project now deploys exclusively to Azure Static Web Apps.
> See `.github/workflows/deploy-marketing-azure.yml` for current deployment configuration.

# Phoenix Rooivalk Interactive Demo Walkthrough

## 🎯 Overview

This walkthrough guides you through the Phoenix Rooivalk Interactive Defense
System Demonstration, showcasing the WASM-powered threat simulator with
counter-drone defense capabilities.

**Demo URL**: https://phoenixrooivalk.netlify.app/interactive-demo

---

## 🚀 Getting Started

### Step 1: Navigate to the Demo Page

1. Open your browser and go to
   https://phoenixrooivalk.netlify.app/interactive-demo
2. You'll see the Phoenix Rooivalk branding with a loading indicator
3. Wait for the WASM runtime to initialize (typically 2-5 seconds)

**Expected**: You'll see "⚡ Loading Threat Simulator..." followed by the full
simulator interface.

---

## 🎮 Interface Overview

### Main Components

1. **Radar Display** (Center)
   - Cyan circles represent detection zones
   - Cyan dot in center = Your mothership (defended asset)
   - Red dots = Hostile threats
   - Yellow dots = Unknown/unidentified objects
   - Green dots = Friendly units (if deployed)

2. **Status Panel** (Top Left)
   - Score tracker
   - Current wave number
   - Threats neutralized count
   - Active threats count
   - Auto-target status
   - Resource indicators (Energy, Cooling, Mothership health)

3. **Control Bar** (Bottom)
   - START/PAUSE button
   - RESET button
   - Weapon selection grid (13 different effectors)
   - Utility buttons (LOG, ENERGY, DRONES, STATS, RESEARCH, STORE, HELP)

4. **FPS Counter** (Top Right)
   - Real-time performance indicator
   - Shows "PAUSED" or "ACTIVE" game state
   - Current weapon display

---

## 📖 Step-by-Step Tutorial

### Part 1: Starting Your First Mission

1. **Read the Disclaimer**
   - Click **"START MISSION"** button in the center welcome screen
   - The disclaimer explains this is a demonstration simulation

2. **Initial Game State**
   - Game starts paused by default
   - Status shows: Score: 000000, Wave: 01
   - All resources at 100%

3. **Start the Action**
   - Click **"▶ START"** button (bottom left)
   - Watch as hostile threats (red dots) begin spawning
   - They'll move toward your mothership (center cyan dot)

### Part 2: Understanding Weapons

Press **"❓ HELP"** to see all controls, or follow these weapon descriptions:

#### Kinetic Effectors (Keys 1-4)

- **1 - Kinetic**: Physical projectiles, high damage, energy-efficient
- **2 - EW (Electronic Warfare)**: Jams drone communications
- **3 - Laser**: Precise beam weapon, instant hit
- **4 - Net**: Captures drones physically

#### Advanced Effectors (Keys 5-9, 0)

- **5 - HPM (High Power Microwave)**: Area-effect electronics disruption
- **6 - RF-Take (RF Takeover)**: Hijacks drone control
- **7 - GNSS**: GPS denial weapon
- **8 - Dazzle**: Optical disruptor for visual sensors
- **9 - Acoustic**: Sound-based countermeasure
- **0 - Decoy**: Creates false targets

#### Special Weapons (C, S, A)

- **C - Chaff**: Radar countermeasure
- **S - Smart**: AI-guided munition
- **A - AI-Decept**: Advanced deception system

### Part 3: Basic Combat

1. **Select a Weapon**
   - Click a weapon button or press its number key
   - Current weapon shows in the top-right corner
   - Start with **"1 - Kinetic"** for beginners

2. **Target Threats**
   - Click on any red dot (hostile threat) on the radar
   - Your weapon will engage the target
   - Watch the threat disappear and your score increase

3. **Manage Resources**
   - Click **"⚡ ENERGY"** to view detailed energy management
   - Energy depletes when firing weapons
   - Energy regenerates over time
   - Click **"COOLING"** if systems overheat

4. **Survive the Wave**
   - Neutralize all threats in Wave 1
   - Wave completion awards bonus resources
   - Next wave begins automatically with more threats

### Part 4: Advanced Features

#### Auto-Targeting (X key)

1. Press **X** or click the auto-target toggle
2. Status panel shows "Auto-Target: ON"
3. System automatically engages nearest threats
4. Useful for managing swarm attacks

#### Drone Deployment (🚁 DRONES button)

1. Click **"🚁 DRONES"** button (bottom center)
2. Deploy support drones to assist in defense
3. Each drone type has unique capabilities
4. Drones consume energy to deploy

#### Research & Upgrades (🔬 RESEARCH button)

1. Click **"🔬 RESEARCH"** button
2. Spend earned resources on upgrades
3. Improve weapon damage, range, and efficiency
4. Unlock synergies between weapon systems

#### Token Store (🪙 STORE button)

1. Earn tokens by neutralizing threats
2. Click **"🪙 STORE"** to browse upgrades
3. Purchase power-ups and special abilities
4. Strategic spending improves survival chances

### Part 5: Advanced Combat Strategies

#### Threat Type Identification

- **Commercial Drones** (basic): Standard threats, low health
- **Military Drones**: Armored, require multiple hits
- **Swarm Drones**: Fast, coordinated attacks
- **Stealth Drones**: Hard to detect, appear closer
- **Kamikaze Drones**: Fast, high damage if they reach center

#### Weapon Selection Strategy

1. **Early Game**: Use Kinetic (1) - energy efficient
2. **Swarms**: Switch to HPM (5) or Dazzle (8) for area effect
3. **Stealth**: Use Laser (3) for precision
4. **Boss Waves**: Combine multiple weapon types

#### Resource Management

1. Monitor energy levels (top-left panel)
2. Don't spam weapons - wait for energy recharge
3. Use energy-efficient weapons (Kinetic) as primary
4. Save high-energy weapons (Laser, HPM) for critical moments

#### Formation Defense

1. Deploy drones in strategic positions
2. Create defensive perimeters with overlapping coverage
3. Use decoys (0) to distract incoming threats
4. Maintain multiple defensive layers

---

## 🎯 Challenge Modes

### Survival Challenge

- Goal: Survive as many waves as possible
- Difficulty increases progressively
- Track your high score

### Efficiency Challenge

- Goal: Neutralize threats with minimal energy use
- Perfect for testing weapon strategies
- Aim for high score-to-energy ratio

### Speed Run

- Goal: Complete waves as quickly as possible
- Use auto-targeting for maximum speed
- Balance speed with accuracy

---

## ⌨️ Keyboard Controls Reference

### Essential Controls

- **SPACE**: Pause/Resume game
- **R**: Reset/Restart game
- **H**: Toggle help overlay
- **X**: Toggle auto-targeting

### Weapon Selection

- **1-9, 0**: Select numbered weapons
- **C**: Chaff
- **S**: Smart weapon
- **A**: AI Deception

### Panels & Info

- **E**: Toggle energy management panel
- **D**: Toggle drone deployment panel
- **S**: Toggle detailed statistics
- **L**: Toggle event log
- **T**: Toggle token store
- **F**: Toggle research panel
- **G**: Toggle synergy indicator

---

## 🐛 Troubleshooting

### Simulator Won't Load

- **Check browser**: Use latest Chrome, Firefox, or Edge
- **Clear cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- **Check console**: Open DevTools to see error messages
- **Verify WebAssembly support**: Most modern browsers support WASM

### Controls Not Responding

- **Click inside simulator area**: Ensure focus is on the game
- **Check pause state**: Press SPACE to unpause
- **Reload page**: Use the RESET button or refresh browser

### Low Performance / Stuttering

- **Close other tabs**: Free up browser resources
- **Reduce graphics quality**: (if option available in settings)
- **Check FPS counter**: Should be at 60 FPS
- **Try different browser**: Chrome/Edge typically perform best

### Black Screen

- **Wait for loading**: WASM initialization takes a few seconds
- **Check network**: Ensure stable internet connection
- **Try incognito**: Test in private/incognito mode
- **Check errors**: Look for error messages on screen

---

## 🎓 Learning Objectives

By completing this demo, you'll understand:

1. **Counter-UAS Concepts**: How modern drone defense systems work
2. **Multi-Layered Defense**: Different weapon types for different threats
3. **Resource Management**: Balancing offense and energy conservation
4. **Strategic Thinking**: Prioritizing targets and weapon selection
5. **System Integration**: How multiple defense systems work together

---

## 📊 Performance Tips

### For Best Experience

- **Use Chrome or Edge**: Best WASM performance
- **Enable Hardware Acceleration**: Check browser settings
- **Close Resource-Heavy Tabs**: Free up RAM
- **Full-Screen Mode**: Click simulator, then F11 for immersive experience

### Expected Performance

- **60 FPS**: Smooth gameplay on modern hardware
- **30-60 FPS**: Acceptable on older devices
- **Below 30 FPS**: May need to reduce browser load

---

## 🌟 Achievement Ideas

Track your progress with these unofficial achievements:

- **First Blood**: Neutralize your first threat
- **Wave Master**: Complete 5 waves without taking damage
- **Resource Manager**: Complete a wave using only Kinetic weapons
- **Ace Defender**: Achieve 95%+ accuracy for a full wave
- **Swarm Buster**: Neutralize 10+ threats in 5 seconds
- **Energy Efficient**: Complete a wave with 80%+ energy remaining
- **Multi-Tool**: Use all 13 weapons in a single wave
- **Perfect Defense**: Complete 10 waves without mothership damage

---

## 🔗 Next Steps

After mastering the demo:

1. **Explore Documentation**: Learn about real-world counter-UAS systems
2. **Read Technical Details**: Understand the underlying technology
3. **Visit Other Pages**:
   - `/capabilities` - Full system capabilities
   - `/technical` - Technical specifications
   - `/methods` - Counter-drone methodologies
4. **Contact Us**: Interested in deployment? Visit `/contact`

---

## 📝 Demo Feedback

Encountered issues or have suggestions?

- Open an issue on GitHub
- Use the contact form on the website
- Report bugs with browser/OS information

---

## 🎬 Video Walkthrough

**Coming Soon**: A video tutorial demonstrating all features and strategies!

---

**Last Updated**: 2024-11-16  
**Version**: 1.0  
**Compatible Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
