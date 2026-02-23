"use client";
import dynamic from "next/dynamic";
import React from "react";
import { Footer } from "../../components/Footer";
import { Navigation } from "../../components/Navigation";
import styles from "./technical.module.css";

const InteractiveMesh = dynamic(
  () =>
    import("../../components/ui/InteractiveMesh").then(
      (mod) => mod.InteractiveMesh,
    ),
  { ssr: false },
);

/** Technical specifications marketing page — AI + blockchain capabilities. */
export function TechnicalPage(): React.ReactElement {
  return (
    <main className={styles.main}>
      <InteractiveMesh
        gridSize={50}
        color="rgba(234, 124, 28, 0.1)"
        bendStrength={20}
        bendRadius={100}
      />

      {/* Navigation */}
      <Navigation />

      {/* Header */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.headerSection}>
            <h1 className={styles.title}>
              AI + Blockchain Technical Specifications
            </h1>
            <p className={styles.subtitle}>
              Revolutionary AI-blockchain counter-drone system with 99.7%
              accuracy, 99.3% data integrity, and autonomous swarm coordination
              capabilities.
            </p>
          </div>
        </div>
      </section>

      {/* AI + Blockchain Capabilities */}
      <section className={`${styles.section} ${styles.sectionGradient}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>AI + Blockchain Capabilities</h2>
          <div className={`${styles.grid} ${styles.gridSpaced}`}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>AI Performance</h3>
              <ul className={styles.cardList}>
                <li>
                  • 99.7% threat detection accuracy vs 60-70% industry standard
                </li>
                <li>
                  • &lt; 200ms response time vs 1-3 seconds traditional systems
                </li>
                <li>
                  • Multi-modal sensor fusion (RF, visual, acoustic, radar)
                </li>
                <li>• Federated learning with blockchain consensus</li>
                <li>• Explainable AI with transparent decision-making</li>
                <li>• Continuous learning and adaptation</li>
              </ul>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Blockchain Security</h3>
              <ul className={styles.cardList}>
                <li>• 99.3% data integrity protection vs 85% traditional</li>
                <li>• &lt; 2ms authentication latency vs 50-100ms standard</li>
                <li>• Tamper-proof audit trails for military accountability</li>
                <li>• Cryptographic identity management</li>
                <li>• Byzantine fault tolerance (33% malicious nodes)</li>
                <li>• Quantum-resistant cryptography</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* System Architecture */}
      <section className={`${styles.section} ${styles.sectionGradient2}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>System Architecture</h2>
          <div className={styles.grid4Cols}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Detection Module</h3>
              <ul className={styles.cardList}>
                <li>• RF Scanning: Communication signal identification</li>
                <li>• Radar Systems: 3D movement tracking</li>
                <li>• Optical Cameras: AI-powered object recognition</li>
                <li>• Acoustic Sensors: Sound signature detection</li>
                <li>• Infrared Sensors: Night/low-visibility operation</li>
                <li>• EM Detection: Encrypted signal identification</li>
              </ul>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>AI Identification Module</h3>
              <ul className={styles.cardList}>
                <li>
                  • 99.7% AI Classification: Friendly/neutral/hostile
                  distinction
                </li>
                <li>• Multi-Modal AI: RF, visual, acoustic, radar fusion</li>
                <li>
                  • Explainable AI: Transparent decision-making with audit
                  trails
                </li>
                <li>• Federated Learning: Distributed AI model training</li>
                <li>
                  • Behavioral Analysis: AI-powered malicious intent detection
                </li>
                <li>• Continuous Learning: AI adapts to new threat patterns</li>
              </ul>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Neutralization Module</h3>
              <ul className={styles.cardList}>
                <li>• RF Jamming: Communication disruption</li>
                <li>• GPS Spoofing: Navigation system confusion</li>
                <li>• Net Entanglement: Non-destructive capture</li>
                <li>• Kinetic Interceptors: Physical neutralization</li>
                <li>• Directed Energy: Low-energy laser systems</li>
                <li>• Autonomous Interceptors: Fiber-optic drone counter</li>
              </ul>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Blockchain C2 System</h3>
              <ul className={styles.cardList}>
                <li>• 99.3% Data Integrity: Tamper-proof audit trails</li>
                <li>• &lt; 2ms Authentication: Blockchain-verified commands</li>
                <li>• Decentralized Control: No single points of failure</li>
                <li>• Multi-Site Coordination: Blockchain consensus</li>
                <li>• Immutable Logging: Complete forensic capabilities</li>
                <li>• Quantum-Resistant: Future-proof security</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Options */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Deployment Configurations</h2>
          <div className={styles.grid3Cols}>
            {[
              {
                title: "Fixed Installation",
                description:
                  "Permanent perimeter protection for critical infrastructure",
                features: [
                  "24/7 autonomous operation",
                  "Multi-sensor tower arrays",
                  "Underground cable management",
                  "Weather-resistant housing",
                  "Integration with facility security",
                ],
              },
              {
                title: "Portable Systems",
                description: "Rapid deployment for events and temporary sites",
                features: [
                  "Setup in under 30 minutes",
                  "Trailer-mounted configuration",
                  "Battery/generator powered",
                  "Satellite communication",
                  "Remote operation capability",
                ],
              },
              {
                title: "Vehicle-Mounted",
                description:
                  "Mobile protection for convoys and tactical operations",
                features: [
                  "Real-time convoy protection",
                  "On-the-move detection",
                  "Integrated vehicle systems",
                  "Tactical communication",
                  "Ruggedized for field use",
                ],
              },
            ].map((config) => (
              <div key={config.title} className={styles.card}>
                <h3 className={styles.cardTitle}>{config.title}</h3>
                <p className={`${styles.subtitle} ${styles.configDescription}`}>
                  {config.description}
                </p>
                <ul className={styles.cardList}>
                  {config.features.map((feature) => (
                    <li key={feature} className={styles.cardListItem}>
                      <span className={styles.cardListBullet}>•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Map Simulator */}
      <section className={`${styles.section} ${styles.sectionGradient2}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>
            Detection Coverage Visualization
          </h2>
          <div className={styles.coverageMapContainer}>
            <div className={styles.coverageMap}>
              {/* Simulated satellite view */}
              <div className={styles.terrainLayer}>
                <div className={styles.terrainBase}></div>
                {/* Simulated terrain features */}
                <div className={styles.terrainFeature1}></div>
                <div className={styles.terrainFeature2}></div>
                <div className={styles.terrainFeature3}></div>
              </div>

              {/* Detection zones */}
              <div className={styles.detectionZones}>
                {/* 5km detection radius */}
                <div className={styles.detectionOuter}>
                  <div className={styles.detectionOuterLabel}>
                    5km Detection
                  </div>
                </div>
                {/* 2km neutralization radius */}
                <div className={styles.neutralizationZone}>
                  <div className={styles.neutralizationLabel}>
                    2km Neutralization
                  </div>
                </div>

                {/* System location */}
                <div className={styles.systemCenter}>
                  <span className={styles.systemIcon}>🛡️</span>
                </div>

                {/* Animated threat paths */}
                <div className={`${styles.threat} ${styles.threat1}`}>
                  <div className={styles.threatLabel}>Threat</div>
                </div>
                <div className={styles.unknown}>
                  <div className={styles.unknownLabel}>Unknown</div>
                </div>
              </div>

              {/* Coverage stats */}
              <div className={styles.coverageStats}>
                <div className={styles.coverageStatsTitle}>
                  Coverage Analysis
                </div>
                <div className={styles.coverageStatsItem}>
                  Area Protected: 78.5 km²
                </div>
                <div className={styles.coverageStatsItemActive}>
                  Active Sensors: 5/5
                </div>
                <div className={styles.coverageStatsItemTracking}>
                  Threats Tracked: 2
                </div>
              </div>
            </div>
            <div className={styles.coverageCaption}>
              <p className={styles.coverageCaptionText}>
                Interactive coverage map showing 5km detection radius and 2km
                neutralization zone
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Power and Portability */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>
            Power & Environmental Specifications
          </h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Power Requirements</h3>
              <ul className={styles.specsList}>
                <li>
                  <strong>Primary:</strong> 220V AC mains power
                </li>
                <li>
                  <strong>Backup:</strong> Battery systems (8-hour operation)
                </li>
                <li>
                  <strong>Alternative:</strong> Solar panel integration
                </li>
                <li>
                  <strong>Generator:</strong> Diesel/petrol compatibility
                </li>
                <li>
                  <strong>Consumption:</strong> 2-5kW depending on configuration
                </li>
              </ul>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Environmental Specifications</h3>
              <ul className={styles.specsList}>
                <li>
                  <strong>Operating Temperature:</strong> -20°C to +60°C
                </li>
                <li>
                  <strong>Humidity:</strong> 5% to 95% non-condensing
                </li>
                <li>
                  <strong>Weather Resistance:</strong> IP65 rated enclosures
                </li>
                <li>
                  <strong>Wind Resistance:</strong> Up to 120 km/h sustained
                </li>
                <li>
                  <strong>Altitude:</strong> Sea level to 3,000m operation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}

export default TechnicalPage;
