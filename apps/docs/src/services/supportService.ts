/**
 * Support Service
 *
 * Handles contact form submissions and support ticket management
 * via Azure Functions.
 */

import { getFunctionsService, isCloudConfigured } from "./cloud";

/**
 * Contact form data structure
 */
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: "general" | "technical" | "sales" | "partnership" | "feedback";
}

/**
 * Contact form submission response
 */
export interface ContactFormResponse {
  success: boolean;
  ticketNumber: string;
  message: string;
}

/**
 * Latest content timestamps for notifications
 */
export interface ContentTimestamps {
  newsUpdatedAt: number;
  supportUpdatedAt: number;
  docsUpdatedAt: number;
}

/**
 * Support ticket structure
 */
export interface SupportTicket {
  id: string;
  ticketNumber: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  status: "new" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
  adminResponse?: string;
  respondedAt?: string;
}

class SupportService {
  private isInitialized = false;

  /**
   * Initialize the service
   */
  init(): boolean {
    if (this.isInitialized) return true;

    if (!isCloudConfigured() || typeof window === "undefined") {
      console.warn("Support Service: Azure not configured");
      return false;
    }

    this.isInitialized = true;
    return true;
  }

  /**
   * Call an Azure Function
   */
  private async callFunction<T>(
    functionName: string,
    data: Record<string, unknown>,
  ): Promise<T> {
    const functionsService = getFunctionsService();
    return functionsService.call<T>(functionName, data);
  }

  /**
   * Submit a contact form
   */
  async submitContactForm(data: ContactFormData): Promise<ContactFormResponse> {
    if (!this.init()) {
      throw new Error("Support service not initialized");
    }

    return this.callFunction<ContactFormResponse>(
      "submitContactForm",
      data as unknown as Record<string, unknown>,
    );
  }

  /**
   * Get latest content timestamps for notification badges
   */
  async getLatestContentTimestamps(): Promise<ContentTimestamps> {
    if (!this.init()) {
      // Return defaults if not initialized (for SSR)
      return {
        newsUpdatedAt: Date.now(),
        supportUpdatedAt: Date.now(),
        docsUpdatedAt: Date.now(),
      };
    }

    try {
      return await this.callFunction<ContentTimestamps>(
        "getLatestContentTimestamps",
        {},
      );
    } catch (error) {
      console.error("Failed to fetch content timestamps:", error);
      // Return defaults on error
      return {
        newsUpdatedAt: Date.now(),
        supportUpdatedAt: Date.now(),
        docsUpdatedAt: Date.now(),
      };
    }
  }

  /**
   * Get current user's support tickets
   */
  async getUserTickets(): Promise<SupportTicket[]> {
    if (!this.init()) {
      throw new Error("Support service not initialized");
    }

    const result = await this.callFunction<{ tickets: SupportTicket[] }>(
      "getUserTickets",
      {},
    );
    return result.tickets;
  }

  /**
   * Admin: Get all tickets with optional filters
   */
  async getAdminTickets(filters?: {
    status?: string;
    category?: string;
    limit?: number;
  }): Promise<SupportTicket[]> {
    if (!this.init()) {
      throw new Error("Support service not initialized");
    }

    const result = await this.callFunction<{ tickets: SupportTicket[] }>(
      "getAdminTickets",
      filters || {},
    );
    return result.tickets;
  }

  /**
   * Admin: Update ticket status
   */
  async updateTicketStatus(
    ticketId: string,
    status: string,
    response?: string,
  ): Promise<{ success: boolean }> {
    if (!this.init()) {
      throw new Error("Support service not initialized");
    }

    return this.callFunction<{ success: boolean }>("updateTicketStatus", {
      ticketId,
      status,
      response,
    });
  }
}

// Export singleton instance
export const supportService = new SupportService();
