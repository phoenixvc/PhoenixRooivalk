/**
 * Support Service
 *
 * Handles contact form submissions and support ticket management
 * via Azure Functions.
 */

import {
  getFunctionsService,
  isCloudConfigured,
  getCurrentProvider,
  getCloudServices,
} from "./cloud";

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
    return functionsService.call<Record<string, unknown>, T>(
      functionName,
      data,
    );
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
      // Enhanced error logging with diagnostic information
      console.group("❌ Failed to fetch content timestamps");
      console.error("Error:", error);
      console.error(
        "Error type:",
        error instanceof Error ? error.constructor.name : typeof error,
      );
      console.error(
        "Error message:",
        error instanceof Error ? error.message : String(error),
      );

      // Log stack trace if available
      if (error instanceof Error && error.stack) {
        console.error("Stack trace:", error.stack);
      }

      // Log network and configuration status
      const networkStatus = navigator.onLine ? "Online" : "Offline";
      console.error("Network status:", networkStatus);
      console.error("Timestamp:", new Date().toISOString());

      // Log cloud configuration status
      try {
        const configured = isCloudConfigured();
        const provider = getCurrentProvider();
        const services = getCloudServices();

        console.error("Cloud configured:", configured);
        console.error("Cloud provider:", provider);
        console.error(
          "Functions service configured:",
          services.functions.isConfigured(),
        );

        if (!services.functions.isConfigured()) {
          console.error(
            "⚠️  AI Functions not available. Please check:",
            `\n  • Network connection (currently: ${networkStatus})`,
            `\n  • Azure Functions configuration (AZURE_FUNCTIONS_BASE_URL)`,
            `\n  • Cloud provider settings (currently: ${provider})`,
          );
        }
      } catch (configError) {
        console.error("Failed to retrieve cloud configuration:", configError);
      }

      console.groupEnd();

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
