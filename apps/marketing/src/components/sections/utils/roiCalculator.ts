export interface ROIInputs {
  threatFrequency: number;
  averageResponseTime: number;
  deploymentCost: number;
  personnelCost: number;
}

export type SensitivityLevel = "conservative" | "median" | "aggressive";

export interface ROIResult {
  prevented: number;
  savings: number;
  roi: number;
  successRate: number;
}

export interface ROICalculation {
  phoenix: ROIResult;
  traditional: ROIResult;
}

/**
 * Calculates the return on investment (ROI) for the Phoenix Rooivalk system
 * compared to traditional systems.
 *
 * @param inputs - The user-provided inputs for the ROI calculation.
 * @param sensitivity - The sensitivity level for the calculation.
 * @returns An object containing the ROI calculation results for both Phoenix
 * Rooivalk and traditional systems.
 */
export const calculateROI = (
  inputs: ROIInputs,
  sensitivity: SensitivityLevel,
): ROICalculation => {
  const {
    threatFrequency,
    averageResponseTime,
    deploymentCost,
    personnelCost,
  } = inputs;

  // Calculate annual threat events
  const annualThreats = threatFrequency * 12;

  // Apply sensitivity multipliers
  const getSensitivityMultipliers = (sensitivity: string) => {
    switch (sensitivity) {
      case "conservative":
        return { phoenix: 0.7, traditional: 0.9, incidentCost: 300000 };
      case "median":
        return { phoenix: 0.85, traditional: 0.75, incidentCost: 500000 };
      case "aggressive":
        return { phoenix: 0.95, traditional: 0.6, incidentCost: 750000 };
      default:
        return { phoenix: 0.7, traditional: 0.9, incidentCost: 300000 };
    }
  };

  const multiplier = getSensitivityMultipliers(sensitivity);

  // Calculate success rates based on response time and sensitivity
  const phoenixSuccessRate =
    (averageResponseTime <= 120 ? 0.95 : 0.85) * multiplier.phoenix;
  const traditionalSuccessRate =
    (averageResponseTime <= 3000 ? 0.65 : 0.45) * multiplier.traditional;

  // Calculate prevented incidents
  const phoenixPrevented = annualThreats * phoenixSuccessRate;
  const traditionalPrevented = annualThreats * traditionalSuccessRate;

  // Estimate cost per incident (varies by sensitivity)
  const avgIncidentCost = multiplier.incidentCost;

  // Calculate savings
  const phoenixSavings = phoenixPrevented * avgIncidentCost;
  const traditionalSavings = traditionalPrevented * avgIncidentCost;

  // Calculate ROI
  const phoenixROI =
    ((phoenixSavings - deploymentCost - personnelCost) /
      (deploymentCost + personnelCost)) *
    100;
  const traditionalROI =
    ((traditionalSavings - deploymentCost * 2 - personnelCost) /
      (deploymentCost * 2 + personnelCost)) *
    100;

  return {
    phoenix: {
      prevented: phoenixPrevented,
      savings: phoenixSavings,
      roi: phoenixROI,
      successRate: phoenixSuccessRate,
    },
    traditional: {
      prevented: traditionalPrevented,
      savings: traditionalSavings,
      roi: traditionalROI,
      successRate: traditionalSuccessRate,
    },
  };
};
