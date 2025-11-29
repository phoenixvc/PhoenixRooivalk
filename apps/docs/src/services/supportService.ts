/**
 * Support Service
 *
 * Handles contact form submissions and support ticket management.
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

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
  private functions: ReturnType<typeof getFunctions> | null = null;
  private isInitialized = false;

  /**
   * Initialize the service
   */
  init(): boolean {
    if (this.isInitialized) return true;

    if (!app) {
      console.warn("Firebase app not initialized");
      return false;
    }

    this.functions = getFunctions(app);
    this.isInitialized = true;
    return true;
  }

  /**
   * Submit a contact form
   */
  async submitContactForm(data: ContactFormData): Promise<ContactFormResponse> {
    if (!this.init()) {
      throw new Error("Support service not initialized");
    }

    const submitContact = httpsCallable<ContactFormData, ContactFormResponse>(
      this.functions!,
      "submitContactForm",
    );

    const result = await submitContact(data);
    return result.data;
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
      const getTimestamps = httpsCallable<void, ContentTimestamps>(
        this.functions!,
        "getLatestContentTimestamps",
      );

      const result = await getTimestamps();
      return result.data;
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

    const getTickets = httpsCallable<void, { tickets: SupportTicket[] }>(
      this.functions!,
      "getUserTickets",
    );

    const result = await getTickets();
    return result.data.tickets;
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

    const getTickets = httpsCallable<
      typeof filters,
      { tickets: SupportTicket[] }
    >(this.functions!, "getAdminTickets");

    const result = await getTickets(filters);
    return result.data.tickets;
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

    const updateTicket = httpsCallable<
      { ticketId: string; status: string; response?: string },
      { success: boolean }
    >(this.functions!, "updateTicketStatus");

    const result = await updateTicket({ ticketId, status, response });
    return result.data;
  }
}

// Export singleton instance
export const supportService = new SupportService();
