/**
 * Support Service
 *
 * Business logic for support ticket operations.
 */

import {
  supportRepository,
  SupportTicket,
  SupportTicketFilters,
  PaginatedResult,
} from "../repositories";
import { upsertDocument } from "../lib/cosmos";

/**
 * Contact form data
 */
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: "general" | "technical" | "sales" | "partnership" | "feedback";
}

/**
 * Support service class
 */
export class SupportService {
  /**
   * Determine priority based on category
   */
  private determinePriority(
    category: ContactFormData["category"],
  ): SupportTicket["priority"] {
    switch (category) {
      case "technical":
        return "high";
      case "sales":
      case "partnership":
        return "medium";
      default:
        return "low";
    }
  }

  /**
   * Sanitize input (basic XSS prevention)
   */
  private sanitize(str: string): string {
    return str
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .trim();
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate contact form data
   */
  validateContactForm(data: Partial<ContactFormData>): string | null {
    if (!data.name || !data.email || !data.subject || !data.message) {
      return "Name, email, subject, and message are required";
    }

    if (!this.isValidEmail(data.email)) {
      return "Invalid email format";
    }

    return null;
  }

  /**
   * Submit contact form
   */
  async submitContactForm(
    data: ContactFormData,
    userId?: string,
  ): Promise<{ ticketNumber: string }> {
    // Validate category
    const validCategories = [
      "general",
      "technical",
      "sales",
      "partnership",
      "feedback",
    ];
    const category = validCategories.includes(data.category)
      ? data.category
      : "general";

    const ticketNumber = supportRepository.generateTicketNumber();
    const now = new Date().toISOString();
    const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const ticket: SupportTicket = {
      id: ticketId,
      name: this.sanitize(data.name),
      email: data.email.toLowerCase().trim(),
      subject: this.sanitize(data.subject),
      message: this.sanitize(data.message),
      category,
      userId,
      status: "new",
      priority: this.determinePriority(category),
      ticketNumber,
      createdAt: now,
      updatedAt: now,
    };

    await supportRepository.save(ticket);

    // Update latest support timestamp
    await upsertDocument("metadata", {
      id: "latest_updates",
      supportUpdatedAt: now,
    });

    return { ticketNumber };
  }

  /**
   * Get tickets for a user
   */
  async getUserTickets(
    userId: string,
    limit: number = 50,
  ): Promise<PaginatedResult<SupportTicket>> {
    return supportRepository.findByUserId(userId, { limit });
  }

  /**
   * Get all tickets (admin)
   */
  async getAdminTickets(
    filters: SupportTicketFilters = {},
    limit: number = 100,
  ): Promise<PaginatedResult<SupportTicket>> {
    return supportRepository.findWithFilters(filters, { limit });
  }

  /**
   * Update ticket status (admin)
   */
  async updateTicketStatus(
    ticketId: string,
    status: SupportTicket["status"],
    adminResponse?: string,
    respondedBy?: string,
  ): Promise<SupportTicket | null> {
    const validStatuses: SupportTicket["status"][] = [
      "new",
      "in_progress",
      "resolved",
      "closed",
    ];

    if (!validStatuses.includes(status)) {
      throw new Error("Invalid status");
    }

    return supportRepository.updateStatus(
      ticketId,
      status,
      adminResponse,
      respondedBy,
    );
  }

  /**
   * Get latest content timestamps
   */
  async getLatestTimestamps(): Promise<{
    newsUpdatedAt: number;
    supportUpdatedAt: number;
    docsUpdatedAt: number;
  }> {
    // This would typically fetch from a metadata collection
    // For now, return current time as fallback
    const now = Date.now();
    return {
      newsUpdatedAt: now,
      supportUpdatedAt: now,
      docsUpdatedAt: now,
    };
  }
}

/**
 * Singleton instance
 */
export const supportService = new SupportService();
