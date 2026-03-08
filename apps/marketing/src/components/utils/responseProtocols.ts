// Dynamic Response Protocols - Automated vs Manual Deployment Strategies
// Reusable core logic for Phoenix Rooivalk main application

export interface ResponseProtocol {
  id: string;
  name: string;
  mode: "automated" | "manual" | "hybrid";
  priority: number;
  conditions: ProtocolCondition[];
  actions: ProtocolAction[];
  cooldown: number;
  lastExecuted: number;
  successRate: number;
  executionCount: number;
}

export interface ProtocolCondition {
  type:
    | "threat-count"
    | "threat-type"
    | "zone-threat-level"
    | "resource-level"
    | "time-based";
  operator: "greater-than" | "less-than" | "equals" | "contains";
  value: number | string | string[];
  weight: number;
}

export interface ProtocolAction {
  type:
    | "deploy-drone"
    | "change-formation"
    | "activate-weapon"
    | "evacuate-zone"
    | "request-backup";
  parameters: Record<string, unknown>;
  priority: number;
  delay: number; // milliseconds
}

export interface ThreatResponse {
  threatId: string;
  protocolId: string;
  actionType: string;
  parameters: Record<string, unknown>;
  estimatedSuccess: number;
  executionTime: number;
  reasoning: string;
}

export interface SystemState {
  threatCount: number;
  activeThreats: Array<{
    id: string;
    type: string;
    threatLevel: number;
    position: { x: number; y: number };
  }>;
  availableResources: {
    drones: number;
    energy: number;
    ammunition: number;
  };
  zoneStates: Array<{
    id: string;
    threatLevel: number;
    coverage: number;
    lastUpdate: number;
  }>;
  timeElapsed: number;
}

// Core response protocol engine
export class ResponseProtocolEngine {
  private protocols: Map<string, ResponseProtocol> = new Map();
  private executionHistory: Array<{
    protocolId: string;
    success: boolean;
    timestamp: number;
    reasoning: string;
  }> = [];

  // Initialize default response protocols
  initializeDefaultProtocols(): void {
    this.protocols.clear();

    // Critical threat response
    this.addProtocol({
      id: "critical-threat-response",
      name: "Critical Threat Immediate Response",
      mode: "automated",
      priority: 1,
      conditions: [
        {
          type: "threat-type",
          operator: "contains",
          value: ["kamikaze", "shielded"],
          weight: 1.0,
        },
        {
          type: "threat-count",
          operator: "greater-than",
          value: 3,
          weight: 0.8,
        },
      ],
      actions: [
        {
          type: "deploy-drone",
          parameters: { droneType: "effector", count: 2 },
          priority: 1,
          delay: 0,
        },
        {
          type: "activate-weapon",
          parameters: { weaponType: "electronic", mode: "area-effect" },
          priority: 2,
          delay: 500,
        },
      ],
      cooldown: 2000,
      lastExecuted: 0,
      successRate: 0,
      executionCount: 0,
    });

    // Swarm response protocol
    this.addProtocol({
      id: "swarm-response",
      name: "Swarm Threat Response",
      mode: "automated",
      priority: 2,
      conditions: [
        {
          type: "threat-type",
          operator: "contains",
          value: ["swarm"],
          weight: 1.0,
        },
        {
          type: "threat-count",
          operator: "greater-than",
          value: 5,
          weight: 0.9,
        },
      ],
      actions: [
        {
          type: "deploy-drone",
          parameters: { droneType: "swarm-coordinator", count: 1 },
          priority: 1,
          delay: 0,
        },
        {
          type: "change-formation",
          parameters: { formation: "semicircle", degrees: 180 },
          priority: 2,
          delay: 1000,
        },
      ],
      cooldown: 3000,
      lastExecuted: 0,
      successRate: 0,
      executionCount: 0,
    });

    // Low resource response
    this.addProtocol({
      id: "low-resource-response",
      name: "Low Resource Conservation",
      mode: "automated",
      priority: 3,
      conditions: [
        {
          type: "resource-level",
          operator: "less-than",
          value: 30, // percentage
          weight: 1.0,
        },
      ],
      actions: [
        {
          type: "deploy-drone",
          parameters: { droneType: "surveillance", count: 1 },
          priority: 1,
          delay: 0,
        },
        {
          type: "request-backup",
          parameters: { priority: "medium" },
          priority: 2,
          delay: 2000,
        },
      ],
      cooldown: 5000,
      lastExecuted: 0,
      successRate: 0,
      executionCount: 0,
    });

    // Stealth detection protocol
    this.addProtocol({
      id: "stealth-detection",
      name: "Stealth Threat Detection",
      mode: "hybrid",
      priority: 2,
      conditions: [
        {
          type: "threat-type",
          operator: "contains",
          value: ["stealth"],
          weight: 1.0,
        },
        {
          type: "zone-threat-level",
          operator: "greater-than",
          value: 0.7,
          weight: 0.8,
        },
      ],
      actions: [
        {
          type: "deploy-drone",
          parameters: { droneType: "surveillance", count: 2 },
          priority: 1,
          delay: 0,
        },
        {
          type: "activate-weapon",
          parameters: { weaponType: "laser", mode: "precision" },
          priority: 2,
          delay: 1500,
        },
      ],
      cooldown: 4000,
      lastExecuted: 0,
      successRate: 0,
      executionCount: 0,
    });
  }

  // Add a new response protocol
  addProtocol(protocol: ResponseProtocol): void {
    this.protocols.set(protocol.id, protocol);
  }

  // Evaluate current system state and determine appropriate responses
  evaluateAndRespond(
    systemState: SystemState,
    availableDrones: Array<{
      id: string;
      type: string;
      x: number;
      y: number;
      energy: number;
      isActive: boolean;
    }>,
  ): ThreatResponse[] {
    const responses: ThreatResponse[] = [];
    const currentTime = Date.now();

    // Evaluate each protocol
    this.protocols.forEach((protocol) => {
      // Check cooldown
      if (currentTime - protocol.lastExecuted < protocol.cooldown) {
        return;
      }

      // Check if protocol conditions are met
      const conditionsMet = this.evaluateProtocolConditions(
        protocol,
        systemState,
      );

      if (conditionsMet) {
        // Generate responses based on protocol actions
        const protocolResponses = this.generateProtocolResponses(
          protocol,
          systemState,
          availableDrones,
        );
        responses.push(...protocolResponses);

        // Update protocol execution tracking
        protocol.lastExecuted = currentTime;
        protocol.executionCount++;
      }
    });

    // Sort responses by priority and estimated success
    responses.sort((a, b) => {
      const protocolA = this.protocols.get(a.protocolId);
      const protocolB = this.protocols.get(b.protocolId);
      const priorityA = protocolA?.priority || 0;
      const priorityB = protocolB?.priority || 0;

      if (priorityA !== priorityB) return priorityA - priorityB;
      return b.estimatedSuccess - a.estimatedSuccess;
    });

    return responses;
  }

  // Evaluate if protocol conditions are met
  private evaluateProtocolConditions(
    protocol: ResponseProtocol,
    systemState: SystemState,
  ): boolean {
    let totalWeight = 0;
    let metWeight = 0;

    protocol.conditions.forEach((condition) => {
      totalWeight += condition.weight;

      if (this.evaluateCondition(condition, systemState)) {
        metWeight += condition.weight;
      }
    });

    // Protocol is triggered if met weight is >= 50% of total weight
    return metWeight >= totalWeight * 0.5;
  }

  // Evaluate individual condition
  private evaluateCondition(
    condition: ProtocolCondition,
    systemState: SystemState,
  ): boolean {
    switch (condition.type) {
      case "threat-count":
        return this.compareValues(
          systemState.threatCount,
          condition.value as number,
          condition.operator,
        );

      case "threat-type": {
        const threatTypes = systemState.activeThreats.map((t) => t.type);
        return this.compareThreatTypes(
          threatTypes,
          condition.value as string[],
          condition.operator,
        );
      }

      case "zone-threat-level": {
        const maxZoneThreatLevel = Math.max(
          ...systemState.zoneStates.map((z) => z.threatLevel),
        );
        return this.compareValues(
          maxZoneThreatLevel,
          condition.value as number,
          condition.operator,
        );
      }

      case "resource-level": {
        const avgResourceLevel =
          (systemState.availableResources.drones +
            systemState.availableResources.energy +
            systemState.availableResources.ammunition) /
          3;
        return this.compareValues(
          avgResourceLevel,
          condition.value as number,
          condition.operator,
        );
      }

      case "time-based":
        return this.compareValues(
          systemState.timeElapsed,
          condition.value as number,
          condition.operator,
        );

      default:
        return false;
    }
  }

  // Compare values based on operator
  private compareValues(
    actual: number,
    expected: number,
    operator: string,
  ): boolean {
    switch (operator) {
      case "greater-than":
        return actual > expected;
      case "less-than":
        return actual < expected;
      case "equals":
        return actual === expected;
      default:
        return false;
    }
  }

  // Compare threat types
  private compareThreatTypes(
    actual: string[],
    expected: string[],
    operator: string,
  ): boolean {
    switch (operator) {
      case "contains":
        return expected.some((type) => actual.includes(type));
      case "equals":
        return (
          actual.length === expected.length &&
          expected.every((type) => actual.includes(type))
        );
      default:
        return false;
    }
  }

  // Generate responses based on protocol actions
  private generateProtocolResponses(
    protocol: ResponseProtocol,
    systemState: SystemState,
    availableDrones: Array<{
      id: string;
      type: string;
      x: number;
      y: number;
      energy: number;
      isActive: boolean;
    }>,
  ): ThreatResponse[] {
    const responses: ThreatResponse[] = [];

    protocol.actions.forEach((action) => {
      const response = this.createThreatResponse(
        protocol,
        action,
        systemState,
        availableDrones,
      );
      if (response) {
        responses.push(response);
      }
    });

    return responses;
  }

  // Create individual threat response
  private createThreatResponse(
    protocol: ResponseProtocol,
    action: ProtocolAction,
    systemState: SystemState,
    availableDrones: Array<{
      id: string;
      type: string;
      x: number;
      y: number;
      energy: number;
      isActive: boolean;
    }>,
  ): ThreatResponse | null {
    const reasoning = this.generateActionReasoning(
      protocol,
      action,
      systemState,
    );
    const estimatedSuccess = this.calculateActionSuccess(
      action,
      systemState,
      availableDrones,
    );

    // Skip action if success rate is too low
    if (estimatedSuccess < 0.3) {
      return null;
    }

    return {
      threatId: `protocol-${protocol.id}-${action.type}`,
      protocolId: protocol.id,
      actionType: action.type,
      parameters: action.parameters,
      estimatedSuccess,
      executionTime: Date.now() + action.delay,
      reasoning,
    };
  }

  // Generate action reasoning
  private generateActionReasoning(
    protocol: ResponseProtocol,
    action: ProtocolAction,
    systemState: SystemState,
  ): string {
    const reasoning = [];

    reasoning.push(`Protocol: ${protocol.name}`);
    reasoning.push(`Action: ${action.type}`);

    if (systemState.threatCount > 0) {
      reasoning.push(`${systemState.threatCount} active threats detected`);
    }

    if (action.parameters.droneType) {
      reasoning.push(`Deploy ${action.parameters.droneType} drone`);
    }

    if (action.parameters.weaponType) {
      reasoning.push(`Activate ${action.parameters.weaponType} weapon`);
    }

    return reasoning.join("; ");
  }

  // Calculate action success probability
  private calculateActionSuccess(
    action: ProtocolAction,
    systemState: SystemState,
    availableDrones: Array<{
      id: string;
      type: string;
      x: number;
      y: number;
      energy: number;
      isActive: boolean;
    }>,
  ): number {
    let baseSuccess = 0.8; // Base success rate

    // Adjust based on resource availability
    if (action.type === "deploy-drone") {
      const requiredDroneType = action.parameters.droneType;
      const availableDrone = availableDrones.find(
        (d) => d.type === requiredDroneType && d.energy > 50,
      );

      if (!availableDrone) {
        baseSuccess *= 0.3; // Drone not available
      } else if (availableDrone.energy < 80) {
        baseSuccess *= 0.7; // Low energy
      }
    }

    // Adjust based on threat level
    const maxThreatLevel = Math.max(
      ...systemState.zoneStates.map((z) => z.threatLevel),
    );
    if (maxThreatLevel > 0.8) {
      baseSuccess *= 0.9; // High threat reduces success
    }

    // Adjust based on resource levels
    const avgResources =
      (systemState.availableResources.drones +
        systemState.availableResources.energy +
        systemState.availableResources.ammunition) /
      3;

    if (avgResources < 50) {
      baseSuccess *= 0.8; // Low resources
    }

    return Math.min(baseSuccess, 1);
  }

  // Execute a threat response
  executeResponse(
    response: ThreatResponse,
    success: boolean,
    _executionDetails?: Record<string, unknown>,
  ): void {
    const protocol = this.protocols.get(response.protocolId);
    if (!protocol) return;

    // Record execution in history
    this.executionHistory.push({
      protocolId: response.protocolId,
      success,
      timestamp: Date.now(),
      reasoning: `${response.reasoning} [${success ? "SUCCESS" : "FAILED"}]`,
    });

    // Update protocol success rate
    const protocolExecutions = this.executionHistory.filter(
      (h) => h.protocolId === response.protocolId,
    );
    const successfulExecutions = protocolExecutions.filter(
      (h) => h.success,
    ).length;
    protocol.successRate = successfulExecutions / protocolExecutions.length;
  }

  // Get protocol statistics
  getProtocolStatistics(): Array<{
    id: string;
    name: string;
    executionCount: number;
    successRate: number;
    lastExecuted: number;
  }> {
    return Array.from(this.protocols.values()).map((protocol) => ({
      id: protocol.id,
      name: protocol.name,
      executionCount: protocol.executionCount,
      successRate: protocol.successRate,
      lastExecuted: protocol.lastExecuted,
    }));
  }

  // Get execution history
  getExecutionHistory(): Array<{
    protocolId: string;
    success: boolean;
    timestamp: number;
    reasoning: string;
  }> {
    return [...this.executionHistory];
  }

  // Update protocol mode (automated/manual/hybrid)
  updateProtocolMode(
    protocolId: string,
    mode: "automated" | "manual" | "hybrid",
  ): void {
    const protocol = this.protocols.get(protocolId);
    if (protocol) {
      protocol.mode = mode;
    }
  }

  // Check if protocol is in automated mode
  isAutomated(protocolId: string): boolean {
    const protocol = this.protocols.get(protocolId);
    return protocol?.mode === "automated" || protocol?.mode === "hybrid";
  }
}
