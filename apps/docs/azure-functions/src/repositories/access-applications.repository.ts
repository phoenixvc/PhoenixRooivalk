/**
 * Access Applications Repository
 *
 * Data access layer for team member access applications.
 */

import {
  BaseRepository,
  BaseEntity,
  PaginationOptions,
  PaginatedResult,
} from "./base.repository";

/**
 * Access application status
 */
export type ApplicationStatus = "pending" | "approved" | "rejected";

/**
 * Access application entity
 */
export interface AccessApplication extends BaseEntity {
  userId: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  company: string;
  currentRole: string;
  requestedRole: string;
  reason: string;
  linkedIn?: string;
  status: ApplicationStatus;
  applicationNumber: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

/**
 * Access application query filters
 */
export interface AccessApplicationFilters {
  status?: ApplicationStatus;
  requestedRole?: string;
  userId?: string;
  email?: string;
}

/**
 * Access applications repository
 */
export class AccessApplicationsRepository extends BaseRepository<AccessApplication> {
  constructor() {
    super("access_applications");
  }

  /**
   * Find applications with filters
   */
  async findWithFilters(
    filters: AccessApplicationFilters = {},
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<AccessApplication>> {
    const { limit = 50, offset = 0 } = options;
    const conditions: string[] = [];
    const parameters: Array<{ name: string; value: string }> = [];

    if (filters.status) {
      conditions.push("c.status = @status");
      parameters.push({ name: "@status", value: filters.status });
    }

    if (filters.requestedRole) {
      conditions.push("c.requestedRole = @requestedRole");
      parameters.push({ name: "@requestedRole", value: filters.requestedRole });
    }

    if (filters.userId) {
      conditions.push("c.userId = @userId");
      parameters.push({ name: "@userId", value: filters.userId });
    }

    if (filters.email) {
      conditions.push("c.email = @email");
      parameters.push({ name: "@email", value: filters.email.toLowerCase() });
    }

    let query = "SELECT * FROM c";
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += ` ORDER BY c.createdAt DESC OFFSET ${offset} LIMIT ${limit + 1}`;

    const items = await this.query(query, parameters);
    const hasMore = items.length > limit;

    return {
      items: hasMore ? items.slice(0, limit) : items,
      hasMore,
    };
  }

  /**
   * Find applications by user ID
   */
  async findByUserId(
    userId: string,
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<AccessApplication>> {
    return this.findWithFilters({ userId }, options);
  }

  /**
   * Find pending application for user
   */
  async findPendingByUserId(userId: string): Promise<AccessApplication | null> {
    const query =
      "SELECT * FROM c WHERE c.userId = @userId AND c.status = @status ORDER BY c.createdAt DESC OFFSET 0 LIMIT 1";
    const items = await this.query(query, [
      { name: "@userId", value: userId },
      { name: "@status", value: "pending" },
    ]);
    return items[0] || null;
  }

  /**
   * Find approved application for user and role
   */
  async findApprovedByUserAndRole(
    userId: string,
    requestedRole: string,
  ): Promise<AccessApplication | null> {
    const query =
      "SELECT * FROM c WHERE c.userId = @userId AND c.requestedRole = @role AND c.status = @status ORDER BY c.createdAt DESC OFFSET 0 LIMIT 1";
    const items = await this.query(query, [
      { name: "@userId", value: userId },
      { name: "@role", value: requestedRole },
      { name: "@status", value: "approved" },
    ]);
    return items[0] || null;
  }

  /**
   * Check if user has any approved application
   */
  async hasApprovedApplication(userId: string): Promise<boolean> {
    const query =
      "SELECT VALUE COUNT(1) FROM c WHERE c.userId = @userId AND c.status = @status";
    const container = this.getContainerRef();
    const { resources } = await container.items
      .query<number>({
        query,
        parameters: [
          { name: "@userId", value: userId },
          { name: "@status", value: "approved" },
        ],
      })
      .fetchAll();
    return (resources[0] || 0) > 0;
  }

  /**
   * Update application status
   */
  async updateStatus(
    id: string,
    status: ApplicationStatus,
    reviewedBy?: string,
    reviewNotes?: string,
  ): Promise<AccessApplication | null> {
    const application = await this.findById(id);
    if (!application) return null;

    const updatedApplication: AccessApplication = {
      ...application,
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy,
      reviewNotes,
    };

    return this.save(updatedApplication);
  }

  /**
   * Generate unique application number
   */
  generateApplicationNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `APP-${timestamp}-${random}`;
  }

  /**
   * Get count by status
   */
  async getCountByStatus(): Promise<Record<ApplicationStatus, number>> {
    const query =
      "SELECT c.status, COUNT(1) as count FROM c GROUP BY c.status";
    const container = this.getContainerRef();
    const { resources } = await container.items
      .query<{ status: ApplicationStatus; count: number }>({ query })
      .fetchAll();

    const counts: Record<ApplicationStatus, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    for (const item of resources) {
      if (item.status in counts) {
        counts[item.status] = item.count;
      }
    }

    return counts;
  }
}

/**
 * Singleton instance
 */
export const accessApplicationsRepository = new AccessApplicationsRepository();
