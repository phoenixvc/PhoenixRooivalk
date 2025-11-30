/**
 * Configuration Service
 *
 * Business logic for dynamic configuration management.
 * Includes caching, validation, and AI-assisted optimization.
 */

import {
  configurationRepository,
  ConfigItem,
  ConfigType,
  CategoryConfig,
  RoleConfig,
  InterestConfig,
  PromptConfig,
  TopicConfig,
  DomainConfig,
} from "../repositories/configuration.repository";
import { generateCompletion } from "../lib/openai";

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Configuration optimization suggestion
 */
export interface ConfigOptimization {
  type: ConfigType;
  configId?: string;
  action: "add" | "update" | "remove" | "merge";
  suggestion: string;
  reason: string;
  confidence: number;
  basedOn: {
    usageData: boolean;
    contentAnalysis: boolean;
    userFeedback: boolean;
  };
}

/**
 * Configuration service class
 */
export class ConfigurationService {
  private cache = new Map<string, CacheEntry<ConfigItem[]>>();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached or fetch configuration
   */
  private async getCached(type: ConfigType): Promise<ConfigItem[]> {
    const cacheKey = `config:${type}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const items = await configurationRepository.getActive(type);
    this.cache.set(cacheKey, {
      data: items,
      expiresAt: Date.now() + this.cacheTTL,
    });

    return items;
  }

  /**
   * Invalidate cache for type
   */
  private invalidateCache(type: ConfigType): void {
    this.cache.delete(`config:${type}`);
  }

  /**
   * Get all active categories
   */
  async getCategories(): Promise<CategoryConfig[]> {
    return this.getCached("category") as Promise<CategoryConfig[]>;
  }

  /**
   * Get all active roles
   */
  async getRoles(): Promise<RoleConfig[]> {
    return this.getCached("role") as Promise<RoleConfig[]>;
  }

  /**
   * Get all active interests
   */
  async getInterests(): Promise<InterestConfig[]> {
    return this.getCached("interest") as Promise<InterestConfig[]>;
  }

  /**
   * Get all active prompts
   */
  async getPrompts(): Promise<PromptConfig[]> {
    return this.getCached("prompt") as Promise<PromptConfig[]>;
  }

  /**
   * Get prompt by ID
   */
  async getPrompt(promptId: string): Promise<PromptConfig | null> {
    const prompts = await this.getPrompts();
    return prompts.find((p) => p.id === promptId) || null;
  }

  /**
   * Get all active topics
   */
  async getTopics(): Promise<TopicConfig[]> {
    return this.getCached("topic") as Promise<TopicConfig[]>;
  }

  /**
   * Get all trusted domains
   */
  async getDomains(): Promise<DomainConfig[]> {
    return this.getCached("domain") as Promise<DomainConfig[]>;
  }

  /**
   * Get category IDs for validation
   */
  async getCategoryIds(): Promise<string[]> {
    const categories = await this.getCategories();
    return categories.map((c) => c.name);
  }

  /**
   * Get role names for validation
   */
  async getRoleNames(): Promise<string[]> {
    const roles = await this.getRoles();
    return roles.map((r) => r.name);
  }

  /**
   * Get interest names for validation
   */
  async getInterestNames(): Promise<string[]> {
    const interests = await this.getInterests();
    return interests.map((i) => i.name);
  }

  /**
   * Format categories for prompts
   */
  async getCategoriesForPrompt(): Promise<string> {
    const categories = await this.getCategories();
    return categories.map((c) => `- ${c.name}: ${c.description}`).join("\n");
  }

  /**
   * Format roles for prompts
   */
  async getRolesForPrompt(): Promise<string> {
    const roles = await this.getRoles();
    return roles.map((r) => `- ${r.name}`).join("\n");
  }

  /**
   * Format interests for prompts
   */
  async getInterestsForPrompt(): Promise<string> {
    const interests = await this.getInterests();
    return interests.map((i) => i.name).join(", ");
  }

  /**
   * Create configuration item
   */
  async createConfig(
    item: Omit<ConfigItem, "id" | "version" | "createdAt" | "updatedAt">,
    userId?: string,
  ): Promise<ConfigItem> {
    const result = await configurationRepository.create(item, userId);
    this.invalidateCache(item.type);
    return result;
  }

  /**
   * Update configuration item
   */
  async updateConfig(
    id: string,
    updates: Partial<ConfigItem>,
    userId?: string,
    reason?: string,
  ): Promise<ConfigItem | null> {
    const existing = await configurationRepository.findById(id);
    if (!existing) return null;

    const result = await configurationRepository.update(id, updates, userId, reason);
    if (result) {
      this.invalidateCache(existing.type);
    }
    return result;
  }

  /**
   * Deactivate configuration item
   */
  async deactivateConfig(id: string, userId?: string): Promise<void> {
    const existing = await configurationRepository.findById(id);
    if (existing) {
      await configurationRepository.deactivate(id, userId);
      this.invalidateCache(existing.type);
    }
  }

  /**
   * Get configuration history
   */
  async getConfigHistory(configId: string) {
    return configurationRepository.getHistory(configId);
  }

  /**
   * Revert configuration to version
   */
  async revertConfig(
    configId: string,
    version: number,
    userId?: string,
  ): Promise<ConfigItem | null> {
    const existing = await configurationRepository.findById(configId);
    if (!existing) return null;

    const result = await configurationRepository.revert(configId, version, userId);
    if (result) {
      this.invalidateCache(existing.type);
    }
    return result;
  }

  /**
   * Import configuration
   */
  async importConfig(
    items: Array<Omit<ConfigItem, "id" | "version" | "createdAt" | "updatedAt">>,
    userId?: string,
  ) {
    const result = await configurationRepository.importConfig(items, userId);

    // Invalidate all caches
    const types = new Set(items.map((i) => i.type));
    types.forEach((type) => this.invalidateCache(type));

    return result;
  }

  /**
   * Export configuration
   */
  async exportConfig(type?: ConfigType) {
    return configurationRepository.exportConfig(type);
  }

  /**
   * Search configuration
   */
  async searchConfig(query: string, type?: ConfigType) {
    return configurationRepository.search(query, type);
  }

  /**
   * Log prompt usage for analytics
   */
  async logPromptUsage(
    promptId: string,
    latencyMs: number,
    success: boolean,
  ): Promise<void> {
    const prompt = await configurationRepository.findById(promptId);
    if (!prompt || prompt.type !== "prompt") return;

    const metadata = prompt.metadata as PromptConfig["metadata"];
    const usageCount = (metadata.usageCount || 0) + 1;
    const avgLatencyMs =
      ((metadata.avgLatencyMs || 0) * (usageCount - 1) + latencyMs) / usageCount;
    const successRate =
      ((metadata.successRate || 1) * (usageCount - 1) + (success ? 1 : 0)) / usageCount;

    await configurationRepository.update(
      promptId,
      {
        metadata: {
          ...metadata,
          usageCount,
          avgLatencyMs,
          successRate,
          lastUsedAt: new Date().toISOString(),
        },
      },
      "system",
    );
  }

  /**
   * Analyze and suggest configuration optimizations
   */
  async analyzeOptimizations(): Promise<ConfigOptimization[]> {
    const optimizations: ConfigOptimization[] = [];

    // Get current configuration
    const [categories, prompts] = await Promise.all([
      this.getCategories(),
      this.getPrompts(),
    ]);

    // Analyze prompts for low success rates
    for (const prompt of prompts) {
      const meta = prompt.metadata;
      if (meta.usageCount && meta.usageCount > 10 && meta.successRate && meta.successRate < 0.8) {
        optimizations.push({
          type: "prompt",
          configId: prompt.id,
          action: "update",
          suggestion: `Prompt "${prompt.name}" has ${Math.round((1 - meta.successRate) * 100)}% failure rate`,
          reason: `Based on ${meta.usageCount} uses, this prompt may need refinement`,
          confidence: 0.8,
          basedOn: { usageData: true, contentAnalysis: false, userFeedback: false },
        });
      }

      // High latency prompts
      if (meta.avgLatencyMs && meta.avgLatencyMs > 5000) {
        optimizations.push({
          type: "prompt",
          configId: prompt.id,
          action: "update",
          suggestion: `Prompt "${prompt.name}" has high latency (${Math.round(meta.avgLatencyMs / 1000)}s avg)`,
          reason: "Consider reducing maxTokens or simplifying the prompt",
          confidence: 0.7,
          basedOn: { usageData: true, contentAnalysis: false, userFeedback: false },
        });
      }
    }

    // Use AI to suggest category improvements
    try {
      const categoryAnalysis = await this.analyzeCategories(categories);
      optimizations.push(...categoryAnalysis);
    } catch (error) {
      console.warn("AI category analysis failed, skipping:", error);
    }

    return optimizations;
  }

  /**
   * AI-powered category analysis
   */
  private async analyzeCategories(
    categories: CategoryConfig[],
  ): Promise<ConfigOptimization[]> {
    const categoryList = categories.map((c) => c.name).join(", ");

    const prompt = `Analyze these news categories for a counter-drone defense technology company:

Categories: ${categoryList}

Suggest improvements:
1. Are any categories redundant or could be merged?
2. Are there obvious missing categories for this industry?
3. Are the category names clear and descriptive?

Respond with JSON array:
[{"action": "add|merge|update", "category": "name", "suggestion": "brief suggestion", "confidence": 0.0-1.0}]`;

    const result = await generateCompletion(
      "You are a configuration optimization assistant.",
      prompt,
      { temperature: 0.3, maxTokens: 500 },
    );

    try {
      const suggestions = JSON.parse(result);
      return suggestions.map((s: { action: string; category: string; suggestion: string; confidence: number }) => ({
        type: "category" as ConfigType,
        action: s.action,
        suggestion: s.suggestion,
        reason: `AI analysis of category "${s.category}"`,
        confidence: s.confidence,
        basedOn: { usageData: false, contentAnalysis: true, userFeedback: false },
      }));
    } catch (error) {
      console.warn("Failed to parse AI category suggestions:", error);
      return [];
    }
  }

  /**
   * Seed initial configuration from static defaults
   */
  async seedDefaults(userId?: string): Promise<{ seeded: number; skipped: number }> {
    const defaults = this.getDefaultConfiguration();
    const result = await this.importConfig(defaults, userId);
    return { seeded: result.imported, skipped: result.skipped };
  }

  /**
   * Get default configuration items
   */
  private getDefaultConfiguration(): Array<
    Omit<ConfigItem, "id" | "version" | "createdAt" | "updatedAt">
  > {
    return [
      // Categories
      { type: "category", name: "counter-uas", description: "Counter-drone technology", metadata: { icon: "shield", color: "#dc2626" }, isActive: true, order: 1 },
      { type: "category", name: "defense-tech", description: "Defense technology news", metadata: { icon: "chip", color: "#2563eb" }, isActive: true, order: 2 },
      { type: "category", name: "drone-industry", description: "Drone manufacturing and operations", metadata: { icon: "plane", color: "#7c3aed" }, isActive: true, order: 3 },
      { type: "category", name: "regulatory", description: "Laws and regulations", metadata: { icon: "document", color: "#059669" }, isActive: true, order: 4 },
      { type: "category", name: "market-analysis", description: "Market research", metadata: { icon: "chart", color: "#d97706" }, isActive: true, order: 5 },

      // Roles
      { type: "role", name: "Technical - Software/AI", description: "Software and AI engineers", metadata: { department: "engineering" }, isActive: true, order: 1 },
      { type: "role", name: "Technical - Mechanical", description: "Mechanical engineers", metadata: { department: "engineering" }, isActive: true, order: 2 },
      { type: "role", name: "Business", description: "Business development", metadata: { department: "business" }, isActive: true, order: 3 },
      { type: "role", name: "Executive", description: "C-suite executives", metadata: { level: "executive" }, isActive: true, order: 4 },

      // Interests
      { type: "interest", name: "counter-uas", description: "Counter-UAS technology", metadata: { category: "technology" }, isActive: true, order: 1 },
      { type: "interest", name: "ai", description: "Artificial intelligence", metadata: { category: "technology" }, isActive: true, order: 2 },
      { type: "interest", name: "hardware", description: "Hardware systems", metadata: { category: "technology" }, isActive: true, order: 3 },
      { type: "interest", name: "compliance", description: "Regulatory compliance", metadata: { category: "legal" }, isActive: true, order: 4 },
    ];
  }
}

/**
 * Singleton instance
 */
export const configurationService = new ConfigurationService();
