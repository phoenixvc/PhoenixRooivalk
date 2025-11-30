/**
 * Firebase Database Service Implementation
 *
 * Implements IDatabaseService using Firebase Firestore SDK.
 */

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  runTransaction as firestoreRunTransaction,
  writeBatch,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  deleteField,
  getCountFromServer,
  Firestore,
  DocumentSnapshot,
  QueryConstraint,
  Transaction,
  WriteBatch,
} from "firebase/firestore";
import { FirebaseApp } from "firebase/app";
import {
  IDatabaseService,
  ITransaction,
  IBatchWriter,
} from "../interfaces/database";
import {
  QueryOptions,
  PaginatedResult,
  UnsubscribeFn,
  FieldOperations,
} from "../interfaces/types";

/**
 * Firebase field operations
 */
const firebaseFieldOperations: FieldOperations = {
  increment: (value: number) => increment(value),
  arrayUnion: (...elements: unknown[]) => arrayUnion(...elements),
  arrayRemove: (...elements: unknown[]) => arrayRemove(...elements),
  serverTimestamp: () => serverTimestamp(),
  delete: () => deleteField(),
};

/**
 * Build Firestore query constraints from QueryOptions
 */
function buildConstraints(options: QueryOptions): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  // Add conditions
  if (options.conditions) {
    for (const condition of options.conditions) {
      constraints.push(
        where(condition.field, condition.operator, condition.value),
      );
    }
  }

  // Add ordering
  if (options.orderBy) {
    for (const order of options.orderBy) {
      constraints.push(orderBy(order.field, order.direction));
    }
  }

  // Add cursor for pagination
  if (options.cursor) {
    constraints.push(startAfter(options.cursor));
  }

  // Add limit
  if (options.limit) {
    constraints.push(limit(options.limit));
  }

  return constraints;
}

/**
 * Firebase Transaction wrapper
 */
class FirebaseTransaction implements ITransaction {
  constructor(
    private db: Firestore,
    private transaction: Transaction,
  ) {}

  async get<T>(collectionName: string, documentId: string): Promise<T | null> {
    const docRef = doc(this.db, collectionName, documentId);
    const docSnap = await this.transaction.get(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as T;
  }

  set<T extends Record<string, unknown>>(
    collectionName: string,
    documentId: string,
    data: T,
    merge = false,
  ): void {
    const docRef = doc(this.db, collectionName, documentId);
    this.transaction.set(docRef, data, { merge });
  }

  update(
    collectionName: string,
    documentId: string,
    updates: Record<string, unknown>,
  ): void {
    const docRef = doc(this.db, collectionName, documentId);
    this.transaction.update(docRef, updates);
  }

  delete(collectionName: string, documentId: string): void {
    const docRef = doc(this.db, collectionName, documentId);
    this.transaction.delete(docRef);
  }
}

/**
 * Firebase Batch Writer wrapper
 */
class FirebaseBatchWriter implements IBatchWriter {
  private batch: WriteBatch;

  constructor(private db: Firestore) {
    this.batch = writeBatch(db);
  }

  set<T extends Record<string, unknown>>(
    collectionName: string,
    documentId: string,
    data: T,
    merge = false,
  ): IBatchWriter {
    const docRef = doc(this.db, collectionName, documentId);
    this.batch.set(docRef, data, { merge });
    return this;
  }

  update(
    collectionName: string,
    documentId: string,
    updates: Record<string, unknown>,
  ): IBatchWriter {
    const docRef = doc(this.db, collectionName, documentId);
    this.batch.update(docRef, updates);
    return this;
  }

  delete(collectionName: string, documentId: string): IBatchWriter {
    const docRef = doc(this.db, collectionName, documentId);
    this.batch.delete(docRef);
    return this;
  }

  async commit(): Promise<void> {
    await this.batch.commit();
  }
}

/**
 * Firebase Database Service
 */
export class FirebaseDatabaseService implements IDatabaseService {
  private db: Firestore | null = null;
  private initialized = false;

  constructor(app: FirebaseApp | null) {
    if (app) {
      this.db = getFirestore(app);
      this.initialized = true;
    }
  }

  isConfigured(): boolean {
    return this.initialized && this.db !== null;
  }

  getFieldOperations(): FieldOperations {
    return firebaseFieldOperations;
  }

  // ============================================================================
  // Document Operations
  // ============================================================================

  async getDocument<T>(
    collectionName: string,
    documentId: string,
  ): Promise<T | null> {
    if (!this.db) return null;

    try {
      const docRef = doc(this.db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() } as T;
    } catch (error) {
      console.error("Error getting document:", error);
      return null;
    }
  }

  async setDocument<T extends Record<string, unknown>>(
    collectionName: string,
    documentId: string,
    data: T,
    merge = false,
  ): Promise<boolean> {
    if (!this.db) return false;

    try {
      const docRef = doc(this.db, collectionName, documentId);
      await setDoc(docRef, data, { merge });
      return true;
    } catch (error) {
      console.error("Error setting document:", error);
      return false;
    }
  }

  async updateDocument(
    collectionName: string,
    documentId: string,
    updates: Record<string, unknown>,
  ): Promise<boolean> {
    if (!this.db) return false;

    try {
      const docRef = doc(this.db, collectionName, documentId);
      await updateDoc(docRef, updates);
      return true;
    } catch (error) {
      console.error("Error updating document:", error);
      return false;
    }
  }

  async deleteDocument(
    collectionName: string,
    documentId: string,
  ): Promise<boolean> {
    if (!this.db) return false;

    try {
      const docRef = doc(this.db, collectionName, documentId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting document:", error);
      return false;
    }
  }

  async addDocument<T extends Record<string, unknown>>(
    collectionName: string,
    data: T,
  ): Promise<string | null> {
    if (!this.db) return null;

    try {
      const collectionRef = collection(this.db, collectionName);
      const docRef = await addDoc(collectionRef, data);
      return docRef.id;
    } catch (error) {
      console.error("Error adding document:", error);
      return null;
    }
  }

  // ============================================================================
  // Query Operations
  // ============================================================================

  async queryDocuments<T>(
    collectionName: string,
    options: QueryOptions = {},
  ): Promise<PaginatedResult<T>> {
    if (!this.db) {
      return { items: [], cursor: null, hasMore: false };
    }

    try {
      const collectionRef = collection(this.db, collectionName);
      const constraints = buildConstraints(options);
      const q = query(collectionRef, ...constraints);
      const snapshot = await getDocs(q);

      const items: T[] = [];
      let lastDoc: DocumentSnapshot | null = null;

      snapshot.docs.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as T);
        lastDoc = docSnap;
      });

      const hasMore = options.limit ? items.length >= options.limit : false;

      return { items, cursor: lastDoc, hasMore };
    } catch (error) {
      console.error("Error querying documents:", error);
      return { items: [], cursor: null, hasMore: false };
    }
  }

  async getAllDocuments<T>(
    collectionName: string,
    maxLimit = 1000,
  ): Promise<T[]> {
    const result = await this.queryDocuments<T>(collectionName, {
      limit: maxLimit,
    });
    return result.items;
  }

  async countDocuments(
    collectionName: string,
    options: QueryOptions = {},
  ): Promise<number> {
    if (!this.db) return 0;

    try {
      const collectionRef = collection(this.db, collectionName);
      const constraints: QueryConstraint[] = [];

      // Only add conditions for count query
      if (options.conditions) {
        for (const condition of options.conditions) {
          constraints.push(
            where(condition.field, condition.operator, condition.value),
          );
        }
      }

      const q =
        constraints.length > 0
          ? query(collectionRef, ...constraints)
          : collectionRef;

      const countSnapshot = await getCountFromServer(q);
      return countSnapshot.data().count;
    } catch (error) {
      console.error("Error counting documents:", error);
      return 0;
    }
  }

  // ============================================================================
  // Real-time Subscriptions
  // ============================================================================

  subscribeToDocument<T>(
    collectionName: string,
    documentId: string,
    onUpdate: (data: T | null) => void,
    onError?: (error: Error) => void,
  ): UnsubscribeFn {
    if (!this.db) {
      onUpdate(null);
      return () => {};
    }

    const docRef = doc(this.db, collectionName, documentId);

    return onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          onUpdate(null);
        } else {
          onUpdate({ id: docSnap.id, ...docSnap.data() } as T);
        }
      },
      (error) => {
        console.error("Document subscription error:", error);
        onError?.(error);
      },
    );
  }

  subscribeToQuery<T>(
    collectionName: string,
    options: QueryOptions,
    onUpdate: (items: T[]) => void,
    onError?: (error: Error) => void,
  ): UnsubscribeFn {
    if (!this.db) {
      onUpdate([]);
      return () => {};
    }

    const collectionRef = collection(this.db, collectionName);
    const constraints = buildConstraints(options);
    const q = query(collectionRef, ...constraints);

    return onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = [];
        snapshot.docs.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as T);
        });
        onUpdate(items);
      },
      (error) => {
        console.error("Query subscription error:", error);
        onError?.(error);
      },
    );
  }

  // ============================================================================
  // Transactions & Batches
  // ============================================================================

  async runTransaction<T>(
    updateFn: (transaction: ITransaction) => Promise<T>,
  ): Promise<T> {
    if (!this.db) {
      throw new Error("Database not configured");
    }

    return firestoreRunTransaction(this.db, async (firestoreTransaction) => {
      const transaction = new FirebaseTransaction(
        this.db!,
        firestoreTransaction,
      );
      return updateFn(transaction);
    });
  }

  createBatch(): IBatchWriter {
    if (!this.db) {
      throw new Error("Database not configured");
    }
    return new FirebaseBatchWriter(this.db);
  }
}
