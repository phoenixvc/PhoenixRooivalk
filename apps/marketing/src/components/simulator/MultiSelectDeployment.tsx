import React, { useEffect, useState } from "react";
import effectorDatabase from "../../data/effectorDatabase.json";
import { InfoPopover } from "../InfoPopover";
import { EnergyManagement } from "./EnergyManagement";

export interface DeploymentOption {
  id: string;
  name: string;
  role: string;
  energy: number;
  speed: string;
  endurance: string;
  selected: boolean;
  disabled: boolean;
  maxCount: number;
  currentCount: number;
}

export interface MultiSelectDeploymentProps {
  availableEnergy: number;
  onSelectionChange: (selected: string[], usedEnergy: number) => void;
}

export const MultiSelectDeployment: React.FC<MultiSelectDeploymentProps> = ({
  availableEnergy,
  onSelectionChange,
}) => {
  const [deploymentOptions, setDeploymentOptions] = useState<
    DeploymentOption[]
  >([]);
  const [selectedDeployments, setSelectedDeployments] = useState<string[]>([]);
  const [usedEnergy, setUsedEnergy] = useState(0);

  const getMaxCountForRole = (role: string): number => {
    // Define max counts based on role and operational constraints
    const roleLimits = {
      guard: 3,
      recon: 4,
      ecm: 2,
      support: 2,
      deception: 3,
      capture: 2,
      sensor: 1,
      logistics: 2,
      directed: 1,
    };
    return roleLimits[role as keyof typeof roleLimits] || 2;
  };

  // Initialize deployment options from database
  useEffect(() => {
    const options = effectorDatabase.deployments.map((deployment) => ({
      id: deployment.id,
      name: deployment.name,
      role: deployment.role,
      energy: deployment.energy || 0,
      speed: deployment.speed || "unknown",
      endurance: deployment.endurance || "unknown",
      selected: false,
      disabled: false,
      maxCount: getMaxCountForRole(deployment.role),
      currentCount: 0,
    }));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial data loading from static database
    setDeploymentOptions(options);
  }, []);

  // Update disabled state based on energy constraints
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Computing derived state from availableEnergy
    setDeploymentOptions((prev) =>
      prev.map((option) => ({
        ...option,
        disabled: option.energy > availableEnergy,
      })),
    );
  }, [availableEnergy]);

  const handleSelectionChange = (optionId: string, selected: boolean) => {
    const option = deploymentOptions.find((opt) => opt.id === optionId);
    if (!option || option.disabled) return;

    let newCurrentCount = option.currentCount;
    if (selected) {
      if (newCurrentCount >= option.maxCount) return;
      newCurrentCount += 1;
    } else {
      if (newCurrentCount <= 0) return;
      newCurrentCount -= 1;
    }

    setDeploymentOptions((prev) =>
      prev.map((opt) =>
        opt.id === optionId
          ? {
              ...opt,
              currentCount: newCurrentCount,
              selected: newCurrentCount > 0,
            }
          : opt,
      ),
    );

    // Update selected deployments list
    const newSelected = deploymentOptions
      .map((opt) =>
        opt.id === optionId ? { ...opt, currentCount: newCurrentCount } : opt,
      )
      .filter((opt) => opt.currentCount > 0)
      .flatMap((opt) => Array(opt.currentCount).fill(opt.id));

    setSelectedDeployments(newSelected);
    onSelectionChange(newSelected, usedEnergy);
  };

  const calculateUsedEnergy = React.useCallback(() => {
    return deploymentOptions.reduce((total, option) => {
      return total + option.energy * option.currentCount;
    }, 0);
  }, [deploymentOptions]);

  useEffect(() => {
    const total = calculateUsedEnergy();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Computing derived state from deploymentOptions
    setUsedEnergy(total);
  }, [calculateUsedEnergy]);

  const getRoleColor = (role: string): string => {
    const roleColors = {
      guard: "rgb(var(--sim-friendly, 74, 222, 128))",
      recon: "rgb(var(--color-blue-deep, 59, 130, 246))",
      ecm: "rgb(var(--color-purple, 139, 92, 246))",
      support: "rgb(var(--sensor-amber, 245, 158, 11))",
      deception: "rgb(var(--color-blue-accent, 112, 161, 255))",
      capture: "rgb(var(--sim-friendly, 74, 222, 128))",
      sensor: "rgb(var(--color-blue-deep, 59, 130, 246))",
      logistics: "rgb(var(--color-gray-500, 100, 116, 139))",
      directed: "rgb(var(--sim-gold, 255, 209, 102))",
    };
    return (
      roleColors[role as keyof typeof roleColors] ||
      "rgb(var(--color-gray-500, 100, 116, 139))"
    );
  };

  return (
    <div className="multi-select-deployment">
      <div className="deployment-header">
        <h3 className="deployment-title">DEPLOYMENT SELECTION</h3>
        <div className="deployment-summary">
          <span className="deployment-count">
            {selectedDeployments.length} Selected
          </span>
          <span className="deployment-energy">
            {usedEnergy}/{availableEnergy} Energy
          </span>
        </div>
      </div>

      <div className="deployment-options">
        {deploymentOptions.map((option) => {
          const droneData = effectorDatabase.deployments.find(
            (d) => d.id === option.id,
          );
          const canSelect =
            !option.disabled && option.currentCount < option.maxCount;
          const canDeselect = option.currentCount > 0;

          return (
            <div
              key={option.id}
              className={`deployment-option ${option.disabled ? "disabled" : ""}`}
            >
              <div className="deployment-option-header">
                <div className="deployment-checkbox-container">
                  <input
                    type="checkbox"
                    id={`deploy-${option.id}`}
                    checked={option.selected}
                    onChange={(e) =>
                      handleSelectionChange(option.id, e.target.checked)
                    }
                    disabled={option.disabled}
                    className="deployment-checkbox"
                  />
                  <label
                    htmlFor={`deploy-${option.id}`}
                    className="deployment-label"
                  >
                    <div className="deployment-name">{option.name}</div>
                    <div
                      className="deployment-role"
                      style={{ color: getRoleColor(option.role) }}
                    >
                      {option.role.toUpperCase()}
                    </div>
                  </label>
                </div>

                <div className="deployment-count-controls">
                  <button
                    onClick={() => handleSelectionChange(option.id, false)}
                    disabled={!canDeselect}
                    className="deployment-count-btn"
                    aria-label="Decrease count"
                  >
                    −
                  </button>
                  <span className="deployment-count-display">
                    {option.currentCount}/{option.maxCount}
                  </span>
                  <button
                    onClick={() => handleSelectionChange(option.id, true)}
                    disabled={!canSelect}
                    className="deployment-count-btn"
                    aria-label="Increase count"
                  >
                    +
                  </button>
                </div>

                {droneData && (
                  <div className="deployment-info">
                    <InfoPopover
                      title={droneData.name}
                      brands={droneData.brands}
                      sources={droneData.sources}
                    >
                      <button
                        className="deployment-info-btn"
                        aria-label="View details"
                      >
                        ℹ️
                      </button>
                    </InfoPopover>
                  </div>
                )}
              </div>

              <div className="deployment-specs">
                <div className="deployment-spec">
                  <span className="spec-label">Energy:</span>
                  <span className="spec-value">{option.energy}</span>
                </div>
                <div className="deployment-spec">
                  <span className="spec-label">Speed:</span>
                  <span className="spec-value">{option.speed}</span>
                </div>
                <div className="deployment-spec">
                  <span className="spec-label">Endurance:</span>
                  <span className="spec-value">{option.endurance}</span>
                </div>
              </div>

              {option.disabled && (
                <div className="deployment-disabled-reason">
                  Insufficient energy for deployment
                </div>
              )}
            </div>
          );
        })}
      </div>

      <EnergyManagement
        maxEnergy={availableEnergy}
        selectedEffectors={[]}
        selectedDrones={selectedDeployments}
        activePowerUps={[]}
        onEnergyUpdate={() => {}}
      />
    </div>
  );
};
