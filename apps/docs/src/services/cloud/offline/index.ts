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
import { IAnalyticsService } from "../interfaces/analytics";
import { IMessagingService } from "../interfaces/messaging";
import { IAIFunctionsService } from "../interfaces/functions";
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
              return value < cond.value;
            case "<=":
              return value <= cond.value;
            case ">":
              return value > cond.value;
            case ">=":
              return value >= cond.value;
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
  isConfigured(): boolean {
    return true;
  }

  async initialize(): Promise<boolean> {
    return true;
  }

  logEvent(_name: string, _params?: Record<string, unknown>): void {
    // No-op in offline mode
  }

  logPageView(_path: string, _title?: string): void {
    // No-op in offline mode
  }

  setUserId(_userId: string | null): void {
    // No-op in offline mode
  }

  setUserProperties(_properties: Record<string, unknown>): void {
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

  async isSupported(): Promise<boolean> {
    return false;
  }

  async requestPermission(): Promise<boolean> {
    console.warn("Push notifications not available in offline mode");
    return false;
  }

  async getToken(): Promise<string | null> {
    return null;
  }

  onMessage(_callback: (payload: any) => void): UnsubscribeFn {
    return () => {};
  }

  onTokenRefresh(_callback: (token: string) => void): UnsubscribeFn {
    return () => {};
  }
}

// ============================================================================
// Offline AI Functions Service (Stub)
// ============================================================================

export class OfflineAIFunctionsService implements IAIFunctionsService {
  isConfigured(): boolean {
    return false; // AI features not available offline
  }

  async askDocumentation(_question: string): Promise<{
    answer: string;
    sources: Array<{ title: string; url: string; relevance: number }>;
    confidence: number;
  }> {
    return {
      answer:
        "AI features are not available in offline mode. Please configure a cloud provider.",
      sources: [],
      confidence: 0,
    };
  }

  async searchDocumentation(_query: string): Promise<
    Array<{
      id: string;
      title: string;
      content: string;
      url: string;
      score: number;
    }>
  > {
    return [];
  }

  async generateSWOTAnalysis(): Promise<{
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  }> {
    return {
      strengths: ["Offline mode available"],
      weaknesses: ["AI features require cloud connection"],
      opportunities: ["Configure Azure or Firebase for full features"],
      threats: [],
    };
  }
}
