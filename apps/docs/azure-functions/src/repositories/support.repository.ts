/**
 * Support Repository
 *
 * Data access layer for support tickets.
 */

import {
  BaseRepository,
  BaseEntity,
  PaginationOptions,
  PaginatedResult,
} from "./base.repository";

/**
 * Support ticket entity
 */
export interface SupportTicket extends BaseEntity {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: "general" | "technical" | "sales" | "partnership" | "feedback";
  userId?: string;
  status: "new" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  ticketNumber: string;
  adminResponse?: string;
  respondedAt?: string;
  respondedBy?: string;
}

/**
 * Support ticket query filters
 */
export interface SupportTicketFilters {
  status?: string;
  category?: string;
  userId?: string;
}

/**
 * Support repository
 */
export class SupportRepository extends BaseRepository<SupportTicket> {
  constructor() {
    super("support_tickets");
  }

  /**
   * Find tickets with filters
   */
  async findWithFilters(
    filters: SupportTicketFilters = {},
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<SupportTicket>> {
    const { limit = 50, offset = 0 } = options;
    const conditions: string[] = [];
    const parameters: Array<{ name: string; value: string }> = [];

    if (filters.status) {
      conditions.push("c.status = @status");
      parameters.push({ name: "@status", value: filters.status });
    }

    if (filters.category) {
      conditions.push("c.category = @category");
      parameters.push({ name: "@category", value: filters.category });
    }

    if (filters.userId) {
      conditions.push("c.userId = @userId");
      parameters.push({ name: "@userId", value: filters.userId });
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
   * Find tickets by user ID
   */
  async findByUserId(
    userId: string,
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<SupportTicket>> {
    return this.findWithFilters({ userId }, options);
  }

  /**
   * Update ticket status
   */
  async updateStatus(
    id: string,
    status: SupportTicket["status"],
    adminResponse?: string,
    respondedBy?: string,
  ): Promise<SupportTicket | null> {
    const ticket = await this.findById(id);
    if (!ticket) return null;

    const updatedTicket: SupportTicket = {
      ...ticket,
      status,
      ...(adminResponse && {
        adminResponse,
        respondedAt: new Date().toISOString(),
        respondedBy,
      }),
    };

    return this.save(updatedTicket);
  }

  /**
   * Generate unique ticket number
   */
  generateTicketNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PHX-${timestamp}-${random}`;
  }
}

/**
 * Singleton instance
 */
export const supportRepository = new SupportRepository();
