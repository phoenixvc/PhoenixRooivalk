// Performance Monitoring System - Real-time Metrics and Optimization
// This system will be ported to Rust in the main application

export interface PerformanceMetrics {
  // Frame Rate Metrics
  fps: number;
  frameTime: number;
  frameDrops: number;

  // Memory Metrics
  memoryUsage: number;
  memoryPeak: number;
  garbageCollections: number;

  // Entity Metrics
  activeEntities: number;
  entityUpdates: number;
  collisionChecks: number;

  // System Metrics
  systemUpdateTime: Record<string, number>;
  eventProcessingTime: number;
  renderingTime: number;

  // Custom Metrics
  customMetrics: Record<string, number>;
}

export interface PerformanceThreshold {
  metric: string;
  warning: number;
  critical: number;
  action?: () => void;
}

export interface PerformanceReport {
  timestamp: number;
  duration: number;
  metrics: PerformanceMetrics;
  issues: PerformanceIssue[];
  recommendations: string[];
}

export interface PerformanceIssue {
  type: "warning" | "critical" | "error";
  metric: string;
  value: number;
  threshold: number;
  message: string;
  suggestion: string;
}

// A type for the non-standard performance.memory API
interface PerformanceWithMemory extends Performance {
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

// Performance Monitor Class
export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private history: PerformanceMetrics[] = [];
  private thresholds: PerformanceThreshold[] = [];
  private timers: Map<string, number> = new Map();
  private counters: Map<string, number> = new Map();
  private maxHistorySize: number = 300; // 5 minutes at 60fps

  // Frame tracking
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private frameDropThreshold: number = 16.67; // 60fps threshold

  constructor() {
    this.metrics = this.initializeMetrics();
    this.setupDefaultThresholds();
  }

  // Initialize metrics
  private initializeMetrics(): PerformanceMetrics {
    return {
      fps: 60,
      frameTime: 16.67,
      frameDrops: 0,
      memoryUsage: 0,
      memoryPeak: 0,
      garbageCollections: 0,
      activeEntities: 0,
      entityUpdates: 0,
      collisionChecks: 0,
      systemUpdateTime: {},
      eventProcessingTime: 0,
      renderingTime: 0,
      customMetrics: {},
    };
  }

  // Setup default performance thresholds
  private setupDefaultThresholds(): void {
    this.thresholds = [
      {
        metric: "fps",
        warning: 45,
        critical: 30,
        action: () => this.optimizeFrameRate(),
      },
      {
        metric: "frameTime",
        warning: 25,
        critical: 40,
      },
      {
        metric: "memoryUsage",
        warning: 100 * 1024 * 1024, // 100MB
        critical: 200 * 1024 * 1024, // 200MB
        action: () => this.triggerGarbageCollection(),
      },
      {
        metric: "activeEntities",
        warning: 100,
        critical: 200,
        action: () => this.optimizeEntities(),
      },
      {
        metric: "eventProcessingTime",
        warning: 5,
        critical: 10,
      },
    ];
  }

  // Start timing a specific operation
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  // End timing and record the duration
  endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    // Record system update times
    if (name.startsWith("system:")) {
      this.metrics.systemUpdateTime[name] = duration;
    }

    return duration;
  }

  // Increment a counter
  incrementCounter(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  // Set a custom metric value
  setCustomMetric(name: string, value: number): void {
    this.metrics.customMetrics[name] = value;
  }

  // Get a custom metric value
  getCustomMetric(name: string): number {
    return this.metrics.customMetrics[name] || 0;
  }

  // Update frame rate metrics
  updateFrameMetrics(): void {
    const currentTime = performance.now();

    if (this.lastFrameTime > 0) {
      const frameTime = currentTime - this.lastFrameTime;
      this.metrics.frameTime = frameTime;

      // Calculate FPS
      this.metrics.fps = 1000 / frameTime;

      // Check for frame drops
      if (frameTime > this.frameDropThreshold) {
        this.metrics.frameDrops++;
      }
    }

    this.lastFrameTime = currentTime;
    this.frameCount++;
  }

  // Update memory metrics
  updateMemoryMetrics(): void {
    const performanceWithMemory = performance as PerformanceWithMemory;
    if (performanceWithMemory.memory) {
      this.metrics.memoryUsage = performanceWithMemory.memory.usedJSHeapSize;
      this.metrics.memoryPeak = Math.max(
        this.metrics.memoryPeak,
        performanceWithMemory.memory.usedJSHeapSize,
      );
    }
  }

  // Update entity metrics
  updateEntityMetrics(
    activeEntities: number,
    updates: number,
    collisions: number,
  ): void {
    this.metrics.activeEntities = activeEntities;
    this.metrics.entityUpdates = updates;
    this.metrics.collisionChecks = collisions;
  }

  // Update system metrics
  updateSystemMetrics(systemName: string, updateTime: number): void {
    this.metrics.systemUpdateTime[systemName] = updateTime;
  }

  // Update event processing time
  updateEventProcessingTime(time: number): void {
    this.metrics.eventProcessingTime = time;
  }

  // Update rendering time
  updateRenderingTime(time: number): void {
    this.metrics.renderingTime = time;
  }

  // Add performance threshold
  addThreshold(threshold: PerformanceThreshold): void {
    this.thresholds.push(threshold);
  }

  // Remove performance threshold
  removeThreshold(metric: string): void {
    this.thresholds = this.thresholds.filter((t) => t.metric !== metric);
  }

  // Check all thresholds and generate issues
  checkThresholds(): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    this.thresholds.forEach((threshold) => {
      const value = this.getMetricValue(threshold.metric);

      if (value >= threshold.critical) {
        issues.push({
          type: "critical",
          metric: threshold.metric,
          value,
          threshold: threshold.critical,
          message: `Critical performance issue: ${threshold.metric} is ${value}`,
          suggestion: this.getOptimizationSuggestion(threshold.metric),
        });

        // Execute critical action
        if (threshold.action) {
          threshold.action();
        }
      } else if (value >= threshold.warning) {
        issues.push({
          type: "warning",
          metric: threshold.metric,
          value,
          threshold: threshold.warning,
          message: `Performance warning: ${threshold.metric} is ${value}`,
          suggestion: this.getOptimizationSuggestion(threshold.metric),
        });
      }
    });

    return issues;
  }

  // Get metric value by name
  private getMetricValue(metric: string): number {
    switch (metric) {
      case "fps":
        return this.metrics.fps;
      case "frameTime":
        return this.metrics.frameTime;
      case "memoryUsage":
        return this.metrics.memoryUsage;
      case "activeEntities":
        return this.metrics.activeEntities;
      case "eventProcessingTime":
        return this.metrics.eventProcessingTime;
      default:
        return this.metrics.customMetrics[metric] || 0;
    }
  }

  // Get optimization suggestions
  private getOptimizationSuggestion(metric: string): string {
    const suggestions: Record<string, string> = {
      fps: "Reduce visual effects, lower entity count, or optimize rendering",
      frameTime: "Optimize update loops, reduce computation complexity",
      memoryUsage:
        "Trigger garbage collection, reduce object pooling, clear caches",
      activeEntities:
        "Reduce entity count, implement culling, optimize updates",
      eventProcessingTime: "Reduce event handlers, optimize event filtering",
      renderingTime: "Reduce draw calls, optimize shaders, implement LOD",
    };

    return suggestions[metric] || "Consider performance optimization";
  }

  // Generate performance report
  generateReport(duration: number = 5000): PerformanceReport {
    const issues = this.checkThresholds();
    const recommendations = this.generateRecommendations(issues);

    return {
      timestamp: Date.now(),
      duration,
      metrics: { ...this.metrics },
      issues,
      recommendations,
    };
  }

  // Generate optimization recommendations
  private generateRecommendations(issues: PerformanceIssue[]): string[] {
    const recommendations: string[] = [];

    if (issues.some((i) => i.metric === "fps" && i.type === "critical")) {
      recommendations.push("Implement aggressive LOD system");
      recommendations.push("Reduce particle effects");
      recommendations.push("Optimize collision detection");
    }

    if (
      issues.some((i) => i.metric === "memoryUsage" && i.type === "critical")
    ) {
      recommendations.push("Increase object pool sizes");
      recommendations.push("Implement memory cleanup routines");
      recommendations.push("Reduce texture sizes");
    }

    if (
      issues.some((i) => i.metric === "activeEntities" && i.type === "critical")
    ) {
      recommendations.push("Implement spatial partitioning");
      recommendations.push("Add entity culling");
      recommendations.push("Reduce spawn rates");
    }

    return recommendations;
  }

  // Save current metrics to history
  saveToHistory(): void {
    this.history.push({ ...this.metrics });

    // Maintain history size limit
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  // Get performance history
  getHistory(): PerformanceMetrics[] {
    return [...this.history];
  }

  // Get average metrics over time
  getAverageMetrics(duration: number = 5000): Partial<PerformanceMetrics> {
    const _cutoff = Date.now() - duration;
    const recentMetrics = this.history.filter((_, index) => {
      // This is a simplified approach - in practice, you'd want timestamps
      return index >= this.history.length - Math.min(60, this.history.length);
    });

    if (recentMetrics.length === 0) return {};

    const averages: Partial<PerformanceMetrics> = {};

    // Calculate averages
    averages.fps =
      recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length;
    averages.frameTime =
      recentMetrics.reduce((sum, m) => sum + m.frameTime, 0) /
      recentMetrics.length;
    averages.memoryUsage =
      recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) /
      recentMetrics.length;
    averages.activeEntities =
      recentMetrics.reduce((sum, m) => sum + m.activeEntities, 0) /
      recentMetrics.length;

    return averages;
  }

  // Performance optimization methods
  private optimizeFrameRate(): void {
    // Implementation would reduce visual complexity
  }

  private triggerGarbageCollection(): void {
    // Implementation would force GC if available
  }

  private optimizeEntities(): void {
    // Implementation would reduce entity count or complexity
  }

  // Get current metrics
  getMetrics(): Readonly<PerformanceMetrics> {
    return { ...this.metrics };
  }

  // Reset all metrics
  reset(): void {
    this.metrics = this.initializeMetrics();
    this.history = [];
    this.timers.clear();
    this.counters.clear();
    this.frameCount = 0;
    this.metrics.frameDrops = 0;
  }

  // Set max history size
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;

    // Trim history if necessary
    if (this.history.length > size) {
      this.history = this.history.slice(-size);
    }
  }
}

// Performance Monitor Factory
export const createPerformanceMonitor = (): PerformanceMonitor => {
  return new PerformanceMonitor();
};

// Performance Utilities
export class PerformanceUtils {
  // Measure function execution time
  static measureExecution<T>(fn: () => T, name?: string): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    if (name && process.env.NODE_ENV === "development") {
      console.debug(`[Performance] ${name} took ${end - start} milliseconds`);
    }

    return result;
  }

  // Measure async function execution time
  static async measureAsyncExecution<T>(
    fn: () => Promise<T>,
    name?: string,
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    if (name && process.env.NODE_ENV === "development") {
      console.debug(`[Performance] ${name} took ${end - start} milliseconds`);
    }

    return result;
  }

  // Create a performance timer decorator
  static timer(name: string) {
    return function (
      _target: object,
      _propertyKey: string,
      descriptor: PropertyDescriptor,
    ) {
      const originalMethod = descriptor.value;

      descriptor.value = function (...args: unknown[]) {
        const start = performance.now();
        const result = originalMethod.apply(this, args);
        const end = performance.now();

        if (process.env.NODE_ENV === "development") {
          console.debug(
            `[Performance] ${name} took ${end - start} milliseconds`,
          );
        }

        return result;
      };

      return descriptor;
    };
  }

  // Benchmark multiple functions
  static benchmark(
    functions: Array<{ name: string; fn: () => unknown }>,
    iterations: number = 1000,
  ): Array<{ name: string; averageTime: number; totalTime: number }> {
    const results: Array<{
      name: string;
      averageTime: number;
      totalTime: number;
    }> = [];

    functions.forEach(({ name, fn }) => {
      const times: number[] = [];

      // Warm up
      for (let i = 0; i < 10; i++) {
        fn();
      }

      // Benchmark
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        fn();
        const end = performance.now();
        times.push(end - start);
      }

      const totalTime = times.reduce((sum, time) => sum + time, 0);
      const averageTime = totalTime / iterations;

      results.push({ name, averageTime, totalTime });
    });

    // Sort by average time
    results.sort((a, b) => a.averageTime - b.averageTime);

    return results;
  }
}
