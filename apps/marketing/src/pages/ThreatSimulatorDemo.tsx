import React, { useEffect, useMemo, useState } from "react";
import { FilterChips } from "../components/FilterChips";
import { InfoPopover } from "../components/InfoPopover";
import { LegalBadge } from "../components/LegalBadge";
import { ROEIndicator } from "../components/ROEIndicator";
import { ThreatSimulator } from "../components/ThreatSimulator";
import { EnergyBudget } from "../components/simulator/EnergyBudget";
import { EnergyManagement } from "../components/simulator/EnergyManagement";
import { MultiSelectDeployment } from "../components/simulator/MultiSelectDeployment";
import {
  FriendlyDeployment,
  RadarSystem,
  RadarTarget,
} from "../components/simulator/RadarSystem";
import {
  DemoCooldownMeter,
  WeaponCooldownMeter,
} from "../components/stats/EnhancedCooldownMeter";
import { SynergySystem } from "../components/weapon/SynergySystem";

const ThreatSimulatorDemo: React.FC = () => {
  const [demoMode, setDemoMode] = useState<"full" | "components" | "systems">(
    "full",
  );
  const [isClient, setIsClient] = useState(false);

  // Client-only rendering flag for Next.js hydration
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Standard Next.js hydration pattern
    setIsClient(true);
  }, []);

  // Demo data for component showcase - use fixed timestamp for demo
  const demoTargets: RadarTarget[] = useMemo(() => {
    const now = 1700000000000; // Fixed timestamp for demo consistency
    return [
      {
        id: "TGT-001",
        type: "hostile",
        position: { x: 150, y: 200 },
        distance: 250,
        bearing: 45,
        speed: 15,
        altitude: 100,
        confidence: 0.85,
        lastUpdate: now,
      },
      {
        id: "TGT-002",
        type: "unknown",
        position: { x: -100, y: 150 },
        distance: 180,
        bearing: 135,
        speed: 8,
        altitude: 50,
        confidence: 0.65,
        lastUpdate: now,
      },
      {
        id: "TGT-003",
        type: "friendly",
        position: { x: 80, y: -120 },
        distance: 144,
        bearing: 315,
        speed: 12,
        altitude: 75,
        confidence: 0.95,
        lastUpdate: now,
      },
    ];
  }, []);

  const demoDeployments: FriendlyDeployment[] = [
    {
      id: "DRONE-001",
      role: "recon",
      position: { x: 50, y: -100 },
      status: "active",
      energy: 80,
      maxEnergy: 100,
    },
    {
      id: "DRONE-002",
      role: "guard",
      position: { x: -80, y: 50 },
      status: "idle",
      energy: 60,
      maxEnergy: 100,
    },
    {
      id: "DRONE-003",
      role: "ecm",
      position: { x: 120, y: 80 },
      status: "returning",
      energy: 40,
      maxEnergy: 100,
    },
  ];

  const demoEffectors = [
    "spotter",
    "smart_slug",
    "laser",
    "gnss_deny",
    "rf_take",
  ];

  const renderFullSimulator = () => (
    <div className="demo-simulator">
      <ThreatSimulator demoMode={true} />
    </div>
  );

  const renderComponentShowcase = () => (
    <div className="component-showcase">
      <div className="showcase-header">
        <h1>Enhanced Threat Simulator Components</h1>
        <p>Individual component demonstrations with real-world data</p>
      </div>

      <div className="showcase-grid">
        {/* Radar System */}
        <div className="showcase-section">
          <h2>Enhanced Radar System</h2>
          <div className="component-demo">
            <RadarSystem
              targets={demoTargets}
              friendlyDeployments={demoDeployments}
              range={500}
              centerPosition={{ x: 200, y: 200 }}
            />
          </div>
        </div>

        {/* Synergy System */}
        <div className="showcase-section">
          <h2>Synergy System</h2>
          <div className="component-demo">
            <SynergySystem
              selectedEffectors={demoEffectors}
              onSynergyUpdate={() => {}}
            />
          </div>
        </div>

        {/* Energy Management */}
        <div className="showcase-section">
          <h2>Energy Management</h2>
          <div className="component-demo">
            <EnergyManagement
              maxEnergy={100}
              selectedEffectors={demoEffectors}
              selectedDrones={["recon", "guard", "ecm"]}
              activePowerUps={["damage-boost"]}
              onEnergyUpdate={() => {}}
            />
          </div>
        </div>

        {/* Multi-Select Deployment */}
        <div className="showcase-section">
          <h2>Multi-Select Deployment</h2>
          <div className="component-demo">
            <MultiSelectDeployment
              availableEnergy={75}
              onSelectionChange={() => {}}
            />
          </div>
        </div>

        {/* Cooldown Meters */}
        <div className="showcase-section">
          <h2>Cooldown Meters</h2>
          <div className="component-demo">
            <div className="cooldown-showcase">
              <div className="cooldown-item">
                <h3>Enhanced Cooldown Meter</h3>
                <DemoCooldownMeter
                  cooldownTime={8}
                  isActive={true}
                  size={60}
                  label="Smart Slug"
                />
              </div>
              <div className="cooldown-item">
                <h3>Weapon Cooldown Meter</h3>
                <WeaponCooldownMeter
                  weaponId="laser"
                  cooldownTime={5}
                  isActive={false}
                  isReady={true}
                  energyCost={12}
                  currentEnergy={85}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ROE Indicators */}
        <div className="showcase-section">
          <h2>ROE Risk Indicators</h2>
          <div className="component-demo">
            <div className="roe-showcase">
              <div className="roe-item">
                <h3>Low Risk</h3>
                <ROEIndicator
                  riskLevel="low"
                  showDetails={true}
                  size="medium"
                />
              </div>
              <div className="roe-item">
                <h3>Medium Risk</h3>
                <ROEIndicator
                  riskLevel="medium"
                  showDetails={true}
                  size="medium"
                />
              </div>
              <div className="roe-item">
                <h3>High Risk</h3>
                <ROEIndicator
                  riskLevel="high"
                  showDetails={true}
                  size="medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="showcase-section">
          <h2>Filter Chips</h2>
          <div className="component-demo">
            <FilterChips
              chips={[
                { id: "hard_kill", label: "Hard Kill", color: "#ef4444" },
                { id: "soft_kill", label: "Soft Kill", color: "#f59e0b" },
                { id: "deception", label: "Deception", color: "#70A1FF" },
                { id: "denial", label: "Denial", color: "#8b5cf6" },
              ]}
              selectedFilters={["hard_kill", "deception"]}
              onFilterChange={() => {}}
            />
          </div>
        </div>

        {/* Info Popover */}
        <div className="showcase-section">
          <h2>Info Popover</h2>
          <div className="component-demo">
            <InfoPopover
              title="Smart Slug"
              brands={["Raytheon", "Lockheed Martin"]}
              sources={["Defense News", "Jane's Defence Weekly"]}
            >
              <button className="demo-info-btn">Smart Slug Details</button>
            </InfoPopover>
          </div>
        </div>

        {/* Legal Badge */}
        <div className="showcase-section">
          <h2>Legal Badge</h2>
          <div className="component-demo">
            <div className="legal-showcase">
              <LegalBadge
                legalFlags={["operational_approval"]}
                onAcknowledge={() => {}}
              />
              <LegalBadge
                legalFlags={["command_approval"]}
                onAcknowledge={() => {}}
              />
            </div>
          </div>
        </div>

        {/* Energy Budget */}
        <div className="showcase-section">
          <h2>Energy Budget</h2>
          <div className="component-demo">
            <EnergyBudget used={75} max={100} showDetails={true} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemsShowcase = () => (
    <div className="systems-showcase">
      <div className="showcase-header">
        <h1>System Integration Showcase</h1>
        <p>Demonstrating how all components work together</p>
      </div>

      <div className="systems-grid">
        <div className="system-demo">
          <h2>Planning Phase</h2>
          <p>
            Select effectors and drones with energy constraints and legal
            compliance
          </p>
          <div className="demo-placeholder">
            <p>Full planning interface with:</p>
            <ul>
              <li>Effector selection with ROE indicators</li>
              <li>Legal compliance badges</li>
              <li>Energy budgeting</li>
              <li>Synergy detection</li>
              <li>Multi-select deployment</li>
            </ul>
          </div>
        </div>

        <div className="system-demo">
          <h2>Active Phase</h2>
          <p>Real-time threat engagement with cooldown management</p>
          <div className="demo-placeholder">
            <p>Active engagement interface with:</p>
            <ul>
              <li>Live radar tracking</li>
              <li>Cooldown meters</li>
              <li>Energy management</li>
              <li>Synergy bonuses</li>
              <li>ROE compliance monitoring</li>
            </ul>
          </div>
        </div>

        <div className="system-demo">
          <h2>Analysis Phase</h2>
          <p>Post-engagement analysis and system optimization</p>
          <div className="demo-placeholder">
            <p>Analysis interface with:</p>
            <ul>
              <li>Performance metrics</li>
              <li>Synergy effectiveness</li>
              <li>Energy efficiency</li>
              <li>ROE compliance reports</li>
              <li>System recommendations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="threat-simulator-demo">
      <div className="demo-controls">
        <h1>Phoenix Rooivalk - Threat Simulator Demo</h1>
        <div className="demo-mode-selector">
          <button
            className={`mode-btn ${demoMode === "full" ? "active" : ""}`}
            onClick={() => setDemoMode("full")}
          >
            Full Simulator
          </button>
          <button
            className={`mode-btn ${demoMode === "components" ? "active" : ""}`}
            onClick={() => setDemoMode("components")}
          >
            Component Showcase
          </button>
          <button
            className={`mode-btn ${demoMode === "systems" ? "active" : ""}`}
            onClick={() => setDemoMode("systems")}
          >
            System Integration
          </button>
        </div>
      </div>

      <div className="demo-content">
        {!isClient ? (
          <div className="loading">Loading demo...</div>
        ) : (
          <>
            {demoMode === "full" && renderFullSimulator()}
            {demoMode === "components" && renderComponentShowcase()}
            {demoMode === "systems" && renderSystemsShowcase()}
          </>
        )}
      </div>
    </div>
  );
};

export default ThreatSimulatorDemo;
