/**
 * Email Service (Client-side)
 *
 * Provides email sending capabilities via Azure Functions.
 * Supports draft emails, templates, and direct sending.
 */

import {
  getFunctionsService,
  isCloudConfigured,
} from "./cloud";

/**
 * Email draft structure for composing emails
 */
export interface EmailDraft {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  /** Whether body is HTML or plain text */
  isHtml?: boolean;
  /** Optional template variables for dynamic content */
  variables?: Record<string, string>;
}

/**
 * Email send result
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Pre-defined email template
 */
export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  variables: string[];
}

class EmailService {
  private isInitialized = false;

  /**
   * Initialize the service
   */
  init(): boolean {
    if (this.isInitialized) return true;

    if (!isCloudConfigured() || typeof window === "undefined") {
      return false;
    }

    this.isInitialized = true;
    return true;
  }

  /**
   * Check if email service is available
   */
  isAvailable(): boolean {
    return this.init();
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
   * Send an email
   */
  async sendEmail(draft: EmailDraft): Promise<EmailSendResult> {
    if (!this.init()) {
      return {
        success: false,
        error: "Email service not configured. Please contact an administrator.",
      };
    }

    try {
      const result = await this.callFunction<EmailSendResult>("sendEmail", {
        to: draft.to,
        cc: draft.cc,
        bcc: draft.bcc,
        subject: draft.subject,
        body: draft.body,
        isHtml: draft.isHtml ?? false,
        variables: draft.variables,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Open email in default mail client (fallback method)
   */
  openInMailClient(draft: EmailDraft): void {
    const { to, cc, bcc, subject, body } = draft;

    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (body) params.set("body", body);
    if (cc) params.set("cc", cc);
    if (bcc) params.set("bcc", bcc);

    const mailtoUrl = `mailto:${encodeURIComponent(to)}?${params.toString()}`;
    window.open(mailtoUrl, "_blank");
  }

  /**
   * Copy email content to clipboard
   */
  async copyToClipboard(draft: EmailDraft): Promise<boolean> {
    const content = `To: ${draft.to}
${draft.cc ? `Cc: ${draft.cc}\n` : ""}${draft.bcc ? `Bcc: ${draft.bcc}\n` : ""}Subject: ${draft.subject}

${draft.body}`;

    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Replace template variables in email content
   */
  applyVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, value);
    }
    return result;
  }

  /**
   * Validate email address format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Parse multiple email addresses from a string
   */
  parseEmailAddresses(input: string): string[] {
    return input
      .split(/[,;]/)
      .map((e) => e.trim())
      .filter((e) => this.isValidEmail(e));
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export types
export type { EmailDraft, EmailSendResult, EmailTemplate };
