/**
 * Offline/Mock Cloud Services
 *
 * Provides fallback implementations when no cloud provider is available.
 * Uses localStorage for persistence and provides stub implementations
 * for features that require a backend.
 */

import { IAuthService } from "../interfaces/auth";
import {
  IDatabaseService,
  ITransaction,
  IBatchWriter,
} from "../interfaces/database";
import { IAnalyticsService, UserProperties } from "../interfaces/analytics";
import {
  IMessagingService,
  NotificationPermissionStatus,
} from "../interfaces/messaging";
import {
  IAIFunctionsService,
  RAGResponse,
  SearchResultItem,
} from "../interfaces/functions";
import {
  CloudUser,
  OAuthProvider,
  UnsubscribeFn,
  QueryOptions,
  PaginatedResult,
  FieldOperations,
} from "../interfaces/types";

const STORAGE_PREFIX = "phoenix_offline_";

// ============================================================================
// Offline Auth Service
// ============================================================================

export class OfflineAuthService implements IAuthService {
  private currentUser: CloudUser | null = null;
  private callbacks: Set<(user: CloudUser | null) => void> = new Set();

  constructor() {
    // Restore user from localStorage
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem(`${STORAGE_PREFIX}user`);
      if (savedUser) {
        try {
          this.currentUser = JSON.parse(savedUser);
        } catch {
          // Ignore invalid data
        }
      }
    }
  }

  isConfigured(): boolean {
    return true; // Always "configured" as fallback
  }

  getMissingConfig(): string[] {
    return ["Cloud provider not configured - using offline mode"];
  }

  async signInWithProvider(
    _provider: OAuthProvider,
  ): Promise<CloudUser | null> {
    // Create a mock user for offline mode
    const mockUser: CloudUser = {
      uid: `offline_${Date.now()}`,
      email: "offline@local.dev",
      displayName: "Offline User",
      photoURL: null,
      emailVerified: false,
      providerData: [],
    };

    this.currentUser = mockUser;
    this.saveUser();
    this.notifyListeners();

    console.warn(
      "Using offline authentication - data will only be stored locally",
    );
    return mockUser;
  }

  async signInWithGoogle(): Promise<CloudUser | null> {
    return this.signInWithProvider("google");
  }

  async signInWithGithub(): Promise<CloudUser | null> {
    return this.signInWithProvider("github");
  }

  async signInWithMicrosoft(): Promise<CloudUser | null> {
    return this.signInWithProvider("microsoft");
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(`${STORAGE_PREFIX}user`);
    }
    this.notifyListeners();
  }

  getCurrentUser(): CloudUser | null {
    return this.currentUser;
  }

  onAuthStateChanged(
    callback: (user: CloudUser | null) => void,
  ): UnsubscribeFn {
    this.callbacks.add(callback);
    callback(this.currentUser);
    return () => this.callbacks.delete(callback);
  }

  async getIdToken(): Promise<string | null> {
    return this.currentUser ? `offline_token_${this.currentUser.uid}` : null;
  }

  isAdmin(): boolean {
    return false;
  }

  private saveUser(): void {
    if (typeof window !== "undefined" && this.currentUser) {
      localStorage.setItem(
        `${STORAGE_PREFIX}user`,
        JSON.stringify(this.currentUser),
      );
    }
  }

  private notifyListeners(): void {
    this.callbacks.forEach((cb) => cb(this.currentUser));
  }
}

// ============================================================================
// Offline Database Service
// ============================================================================

class OfflineTransaction implements ITransaction {
  constructor(private service: OfflineDatabaseService) {}

  async get<T>(collection: string, docId: string): Promise<T | null> {
    return this.service.getDocument<T>(collection, docId);
  }

  set<T extends Record<string, unknown>>(
    collection: string,
    docId: string,
    data: T,
    merge = false,
  ): void {
    this.service.setDocument(collection, docId, data, merge);
  }

  update(
    collection: string,
    docId: string,
    updates: Record<string, unknown>,
  ): void {
    this.service.updateDocument(collection, docId, updates);
  }

  delete(collection: string, docId: string): void {
    this.service.deleteDocument(collection, docId);
  }
}

class OfflineBatchWriter implements IBatchWriter {
  private ops: Array<() => Promise<void>> = [];

  constructor(private service: OfflineDatabaseService) {}

  set<T extends Record<string, unknown>>(
    collection: string,
    docId: string,
    data: T,
    merge = false,
  ): IBatchWriter {
    this.ops.push(async () => {
      await this.service.setDocument(collection, docId, data, merge);
    });
    return this;
  }

  update(
    collection: string,
    docId: string,
    updates: Record<string, unknown>,
  ): IBatchWriter {
    this.ops.push(async () => {
      await this.service.updateDocument(collection, docId, updates);
    });
    return this;
  }

  delete(collection: string, docId: string): IBatchWriter {
    this.ops.push(async () => {
      await this.service.deleteDocument(collection, docId);
    });
    return this;
  }

  async commit(): Promise<void> {
    for (const op of this.ops) {
      await op();
    }
  }
}

export class OfflineDatabaseService implements IDatabaseService {
  private getStorageKey(collection: string, docId?: string): string {
    return docId
      ? `${STORAGE_PREFIX}db_${collection}_${docId}`
      : `${STORAGE_PREFIX}db_${collection}`;
  }

  isConfigured(): boolean {
    return true;
  }

  getFieldOperations(): FieldOperations {
    return {
      increment: (value: number) => ({ __increment: value }),
      arrayUnion: (...elements: unknown[]) => ({ __arrayUnion: elements }),
      arrayRemove: (...elements: unknown[]) => ({ __arrayRemove: elements }),
      serverTimestamp: () => new Date().toISOString(),
      delete: () => ({ __delete: true }),
    };
  }

  async getDocument<T>(collection: string, docId: string): Promise<T | null> {
    if (typeof window === "undefined") return null;

    const key = this.getStorageKey(collection, docId);
    const data = localStorage.getItem(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async setDocument<T extends Record<string, unknown>>(
    collection: string,
    docId: string,
    data: T,
    merge = false,
  ): Promise<boolean> {
    if (typeof window === "undefined") return false;

    const key = this.getStorageKey(collection, docId);
    let finalData = {
      ...data,
      id: docId,
      _updatedAt: new Date().toISOString(),
    };

    if (merge) {
      const existing = await this.getDocument<T>(collection, docId);
      if (existing) {
        finalData = { ...existing, ...finalData };
      }
    }

    localStorage.setItem(key, JSON.stringify(finalData));
    this.updateIndex(collection, docId);
    return true;
  }

  async updateDocument(
    collection: string,
    docId: string,
    updates: Record<string, unknown>,
  ): Promise<boolean> {
    const existing = await this.getDocument<Record<string, unknown>>(
      collection,
      docId,
    );
    if (!existing) return false;

    return this.setDocument(
      collection,
      docId,
      { ...existing, ...updates },
      false,
    );
  }

  async deleteDocument(collection: string, docId: string): Promise<boolean> {
    if (typeof window === "undefined") return false;

    const key = this.getStorageKey(collection, docId);
    localStorage.removeItem(key);
    this.removeFromIndex(collection, docId);
    return true;
  }

  async addDocument<T extends Record<string, unknown>>(
    collection: string,
    data: T,
  ): Promise<string | null> {
    const docId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const success = await this.setDocument(collection, docId, data);
    return success ? docId : null;
  }

  async queryDocuments<T>(
    collection: string,
    options: QueryOptions = {},
  ): Promise<PaginatedResult<T>> {
    const allDocs = await this.getAllDocuments<T>(collection);
    let filtered = [...allDocs];

    // Apply conditions
    if (options.conditions) {
      for (const cond of options.conditions) {
        filtered = filtered.filter((doc) => {
          const value = this.getNestedValue(doc, cond.field);
          switch (cond.operator) {
            case "==":
              return value === cond.value;
            case "!=":
              return value !== cond.value;
            case "<":
              return (value as number) < (cond.value as number);
            case "<=":
              return (value as number) <= (cond.value as number);
            case ">":
              return (value as number) > (cond.value as number);
            case ">=":
              return (value as number) >= (cond.value as number);
            case "array-contains":
              return Array.isArray(value) && value.includes(cond.value);
            case "in":
              return Array.isArray(cond.value) && cond.value.includes(value);
            default:
              return true;
          }
        });
      }
    }

    // Apply ordering
    if (options.orderBy && options.orderBy.length > 0) {
      filtered.sort((a, b) => {
        for (const order of options.orderBy!) {
          const aVal = this.getNestedValue(a, order.field);
          const bVal = this.getNestedValue(b, order.field);
          const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          if (cmp !== 0) {
            return order.direction === "desc" ? -cmp : cmp;
          }
        }
        return 0;
      });
    }

    // Apply limit
    const limit = options.limit || 100;
    const items = filtered.slice(0, limit);

    return {
      items,
      cursor: null,
      hasMore: filtered.length > limit,
    };
  }

  async getAllDocuments<T>(collection: string): Promise<T[]> {
    if (typeof window === "undefined") return [];

    const index = this.getIndex(collection);
    const docs: T[] = [];

    for (const docId of index) {
      const doc = await this.getDocument<T>(collection, docId);
      if (doc) docs.push(doc);
    }

    return docs;
  }

  async countDocuments(
    collection: string,
    options: QueryOptions = {},
  ): Promise<number> {
    const result = await this.queryDocuments(collection, options);
    return result.items.length;
  }

  subscribeToDocument<T>(
    collection: string,
    docId: string,
    onUpdate: (data: T | null) => void,
  ): UnsubscribeFn {
    // Initial fetch
    this.getDocument<T>(collection, docId).then(onUpdate);

    // No real-time in offline mode
    return () => {};
  }

  subscribeToQuery<T>(
    collection: string,
    options: QueryOptions,
    onUpdate: (items: T[]) => void,
  ): UnsubscribeFn {
    // Initial fetch
    this.queryDocuments<T>(collection, options).then((r) => onUpdate(r.items));

    // No real-time in offline mode
    return () => {};
  }

  async runTransaction<T>(
    updateFn: (transaction: ITransaction) => Promise<T>,
  ): Promise<T> {
    const transaction = new OfflineTransaction(this);
    return updateFn(transaction);
  }

  createBatch(): IBatchWriter {
    return new OfflineBatchWriter(this);
  }

  // Index management for listing documents
  private getIndex(collection: string): string[] {
    if (typeof window === "undefined") return [];
    const key = `${STORAGE_PREFIX}index_${collection}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private updateIndex(collection: string, docId: string): void {
    if (typeof window === "undefined") return;
    const index = this.getIndex(collection);
    if (!index.includes(docId)) {
      index.push(docId);
      localStorage.setItem(
        `${STORAGE_PREFIX}index_${collection}`,
        JSON.stringify(index),
      );
    }
  }

  private removeFromIndex(collection: string, docId: string): void {
    if (typeof window === "undefined") return;
    const index = this.getIndex(collection).filter((id) => id !== docId);
    localStorage.setItem(
      `${STORAGE_PREFIX}index_${collection}`,
      JSON.stringify(index),
    );
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((o, p) => o?.[p], obj);
  }
}

// ============================================================================
// Offline Analytics Service (No-op)
// ============================================================================

export class OfflineAnalyticsService implements IAnalyticsService {
  private sessionId = "offline-session";

  isConfigured(): boolean {
    return true;
  }

  hasConsent(): boolean {
    return true;
  }

  setConsent(_granted: boolean): void {
    // No-op in offline mode
  }

  async init(): Promise<void> {
    // No-op in offline mode
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async trackPageView(_event: any): Promise<void> {
    // No-op in offline mode
  }

  async trackTimeOnPage(_event: any): Promise<void> {
    // No-op in offline mode
  }

  updateScrollDepth(_depth: number): void {
    // No-op in offline mode
  }

  async trackConversion(_event: any): Promise<void> {
    // No-op in offline mode
  }

  async trackTeaserView(_pageUrl: string): Promise<void> {
    // No-op in offline mode
  }

  async trackSignupPromptShown(
    _pageUrl: string,
    _trigger: string,
  ): Promise<void> {
    // No-op in offline mode
  }

  async trackSignupStarted(
    _method: "google" | "github" | "microsoft",
  ): Promise<void> {
    // No-op in offline mode
  }

  async trackSignupCompleted(_userId: string, _method: string): Promise<void> {
    // No-op in offline mode
  }

  async trackEvent(_event: any): Promise<void> {
    // No-op in offline mode
  }

  async setUserProperties(_properties: UserProperties): Promise<void> {
    // No-op in offline mode
  }

  async startSession(): Promise<void> {
    // No-op in offline mode
  }

  async endSession(): Promise<void> {
    // No-op in offline mode
  }

  async updateSessionAuth(
    _userId: string,
    _isAuthenticated: boolean,
  ): Promise<void> {
    // No-op in offline mode
  }
}

// ============================================================================
// Offline Messaging Service (Stub)
// ============================================================================

export class OfflineMessagingService implements IMessagingService {
  isConfigured(): boolean {
    return false; // Push not available offline
  }

  isSupported(): boolean {
    return false;
  }

  getPermissionStatus(): NotificationPermissionStatus {
    return "unsupported";
  }

  async requestPermission(): Promise<NotificationPermissionStatus> {
    console.warn("Push notifications not available in offline mode");
    return "unsupported";
  }

  async getToken(): Promise<string | null> {
    return null;
  }

  async enablePushNotifications(): Promise<any> {
    return {
      success: false,
      token: null,
      permission: "unsupported" as NotificationPermissionStatus,
      error: "Push notifications not available in offline mode",
    };
  }

  async subscribeToTopic(_topic: string, _token?: string): Promise<boolean> {
    return false;
  }

  async unsubscribeFromTopic(
    _topic: string,
    _token?: string,
  ): Promise<boolean> {
    return false;
  }

  onForegroundMessage(
    _callback: (notification: any) => void,
  ): UnsubscribeFn | null {
    return null;
  }

  showLocalNotification(_payload: any): void {
    // No-op in offline mode
  }

  async deleteToken(): Promise<boolean> {
    return false;
  }

  async getSubscription(): Promise<any> {
    return null;
  }
}

// ============================================================================
// Offline AI Functions Service (Stub)
// ============================================================================

export class OfflineAIFunctionsService implements IAIFunctionsService {
  isConfigured(): boolean {
    return false; // AI features not available offline
  }

  async init(): Promise<boolean> {
    return false;
  }

  async call<TInput, TOutput>(
    _name: string,
    _data: TInput,
    _options?: any,
  ): Promise<TOutput> {
    throw new Error(
      "AI Functions not available. AZURE_FUNCTIONS_BASE_URL is not configured. " +
        "Admins: Visit /admin/diagnostics for setup instructions.",
    );
  }

  async callAuthenticated<TInput, TOutput>(
    _name: string,
    _data: TInput,
    _options?: any,
  ): Promise<TOutput> {
    throw new Error(
      "AI Functions not available. AZURE_FUNCTIONS_BASE_URL is not configured. " +
        "Admins: Visit /admin/diagnostics for setup instructions.",
    );
  }

  async analyzeCompetitors(
    _competitors: string[],
    _focusAreas?: string[],
  ): Promise<any> {
    return {
      analysis:
        "Competitor analysis not available. Configure AZURE_FUNCTIONS_BASE_URL to enable AI features.",
    };
  }

  async generateSWOT(_topic: string, _context?: string): Promise<any> {
    return {
      swot: "SWOT analysis not available. Configure AZURE_FUNCTIONS_BASE_URL to enable AI features.",
    };
  }

  async getReadingRecommendations(_currentDocId?: string): Promise<any> {
    return {
      recommendations: [],
      learningPath: "",
      message:
        "Recommendations not available. Configure AZURE_FUNCTIONS_BASE_URL to enable AI features.",
    };
  }

  async suggestDocumentImprovements(
    _docId: string,
    _docTitle: string,
    _docContent: string,
  ): Promise<any> {
    return {
      suggestionId: "",
      suggestions: "",
      message: "Document improvements not available in offline mode",
    };
  }

  async getMarketInsights(_topic: string, _industry?: string): Promise<any> {
    return { insights: "Market insights not available in offline mode" };
  }

  async summarizeContent(_content: string, _maxLength?: number): Promise<any> {
    return { summary: "Content summarization not available in offline mode" };
  }

  async askDocumentation(
    _question: string,
    _options?: {
      category?: string;
      format?: "detailed" | "concise";
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    },
  ): Promise<RAGResponse> {
    return {
      answer:
        "AI features are not available in offline mode. Please configure a cloud provider.",
      sources: [],
      confidence: "low",
    };
  }

  async searchDocumentation(
    _query: string,
    _options?: { category?: string; topK?: number },
  ): Promise<SearchResultItem[]> {
    return [];
  }

  async getSuggestedQuestions(
    _docId?: string,
    _category?: string,
  ): Promise<any> {
    return { suggestions: [], docInfo: null };
  }

  async researchPerson(
    _firstName: string,
    _lastName: string,
    _linkedInUrl: string,
  ): Promise<any> {
    return {
      facts: [],
      summary: "Person research not available in offline mode",
    };
  }

  async getIndexStats(): Promise<any> {
    return {
      totalChunks: 0,
      totalDocuments: 0,
      categories: {},
    };
  }

  async reviewImprovement(
    _suggestionId: string,
    _status: "approved" | "rejected" | "implemented",
    _notes?: string,
  ): Promise<any> {
    return { success: false, status: "offline" };
  }

  async getPendingImprovements(_limit?: number): Promise<any> {
    return { suggestions: [] };
  }
}
