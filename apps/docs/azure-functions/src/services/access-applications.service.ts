/**
 * Access Applications Service
 *
 * Business logic for team member access applications.
 */

import {
  accessApplicationsRepository,
  AccessApplication,
  ApplicationStatus,
  AccessApplicationFilters,
} from "../repositories/access-applications.repository";
import { PaginatedResult, PaginationOptions } from "../repositories/base.repository";
import { sendEmail } from "../lib/email";

/**
 * Input data for submitting an access application
 */
export interface SubmitApplicationData {
  firstName: string;
  lastName: string;
  company: string;
  currentRole: string;
  requestedRole: string;
  reason: string;
  linkedIn?: string;
}

/**
 * Result of submitting an application
 */
export interface SubmitApplicationResult {
  success: boolean;
  applicationNumber: string;
  application: AccessApplication;
}

/**
 * Access Applications Service
 */
class AccessApplicationsService {
  /**
   * Validate application data
   */
  validateApplication(data: SubmitApplicationData): string | null {
    if (!data.firstName?.trim()) {
      return "First name is required";
    }
    if (!data.lastName?.trim()) {
      return "Last name is required";
    }
    if (!data.company?.trim()) {
      return "Company/organization is required";
    }
    if (!data.currentRole?.trim()) {
      return "Current role is required";
    }
    if (!data.requestedRole?.trim()) {
      return "Requested role is required";
    }
    if (!data.reason?.trim()) {
      return "Reason for access is required";
    }
    if (data.reason.trim().length < 50) {
      return "Reason must be at least 50 characters";
    }
    if (data.linkedIn && !this.isValidUrl(data.linkedIn)) {
      return "Invalid LinkedIn URL";
    }
    return null;
  }

  /**
   * Check if URL is valid
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Submit a new access application
   */
  async submitApplication(
    data: SubmitApplicationData,
    userId: string,
    email: string,
    displayName: string,
  ): Promise<SubmitApplicationResult> {
    // Check if user already has a pending application
    const existingPending =
      await accessApplicationsRepository.findPendingByUserId(userId);
    if (existingPending) {
      // Update existing application instead of creating a new one
      const updated = await accessApplicationsRepository.save({
        ...existingPending,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        company: data.company.trim(),
        currentRole: data.currentRole.trim(),
        requestedRole: data.requestedRole.trim(),
        reason: data.reason.trim(),
        linkedIn: data.linkedIn?.trim(),
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        applicationNumber: updated.applicationNumber,
        application: updated,
      };
    }

    // Create new application
    const applicationNumber =
      accessApplicationsRepository.generateApplicationNumber();

    const application: Omit<AccessApplication, "id" | "createdAt" | "updatedAt"> = {
      userId,
      email: email.toLowerCase(),
      displayName,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      company: data.company.trim(),
      currentRole: data.currentRole.trim(),
      requestedRole: data.requestedRole.trim(),
      reason: data.reason.trim(),
      linkedIn: data.linkedIn?.trim(),
      status: "pending",
      applicationNumber,
    };

    const saved = await accessApplicationsRepository.save({
      id: crypto.randomUUID(),
      ...application,
    } as AccessApplication);

    // Send notification email to admins
    await this.notifyAdminsOfNewApplication(saved);

    return {
      success: true,
      applicationNumber,
      application: saved,
    };
  }

  /**
   * Get application by ID
   */
  async getApplication(id: string): Promise<AccessApplication | null> {
    return accessApplicationsRepository.findById(id);
  }

  /**
   * Get user's applications
   */
  async getUserApplications(
    userId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<AccessApplication>> {
    return accessApplicationsRepository.findByUserId(userId, options);
  }

  /**
   * Get user's pending application
   */
  async getPendingApplication(userId: string): Promise<AccessApplication | null> {
    return accessApplicationsRepository.findPendingByUserId(userId);
  }

  /**
   * Check if user has approved access for a role
   */
  async hasApprovedAccess(userId: string, role?: string): Promise<boolean> {
    if (role) {
      const application =
        await accessApplicationsRepository.findApprovedByUserAndRole(
          userId,
          role,
        );
      return !!application;
    }
    return accessApplicationsRepository.hasApprovedApplication(userId);
  }

  /**
   * Get applications with filters (admin)
   */
  async getApplications(
    filters?: AccessApplicationFilters,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<AccessApplication>> {
    return accessApplicationsRepository.findWithFilters(filters, options);
  }

  /**
   * Get application counts by status (admin)
   */
  async getApplicationCounts(): Promise<Record<ApplicationStatus, number>> {
    return accessApplicationsRepository.getCountByStatus();
  }

  /**
   * Update application status (admin)
   */
  async updateApplicationStatus(
    id: string,
    status: ApplicationStatus,
    reviewedBy?: string,
    reviewNotes?: string,
  ): Promise<AccessApplication | null> {
    const application = await accessApplicationsRepository.updateStatus(
      id,
      status,
      reviewedBy,
      reviewNotes,
    );

    if (application) {
      // Notify the applicant of the status change
      await this.notifyApplicantOfStatusChange(application);
    }

    return application;
  }

  /**
   * Notify admins of a new application
   */
  private async notifyAdminsOfNewApplication(
    application: AccessApplication,
  ): Promise<void> {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!adminEmail) return;

    try {
      await sendEmail({
        to: adminEmail,
        subject: `New Access Application: ${application.applicationNumber}`,
        html: `
          <h2>New Access Application</h2>
          <p>A new access application has been submitted.</p>
          <ul>
            <li><strong>Application #:</strong> ${application.applicationNumber}</li>
            <li><strong>Name:</strong> ${application.firstName} ${application.lastName}</li>
            <li><strong>Email:</strong> ${application.email}</li>
            <li><strong>Company:</strong> ${application.company}</li>
            <li><strong>Current Role:</strong> ${application.currentRole}</li>
            <li><strong>Requested Role:</strong> ${application.requestedRole}</li>
            <li><strong>Reason:</strong> ${application.reason}</li>
            ${application.linkedIn ? `<li><strong>LinkedIn:</strong> <a href="${application.linkedIn}">${application.linkedIn}</a></li>` : ""}
          </ul>
          <p><a href="${process.env.DOCS_BASE_URL}/admin/applications">Review Applications</a></p>
        `,
      });
    } catch (error) {
      console.error("Failed to send admin notification:", error);
      // Don't throw - notification failure shouldn't break the application
    }
  }

  /**
   * Notify applicant of status change
   */
  private async notifyApplicantOfStatusChange(
    application: AccessApplication,
  ): Promise<void> {
    try {
      const statusMessages: Record<ApplicationStatus, string> = {
        pending: "Your application is being reviewed.",
        approved:
          "Congratulations! Your application has been approved. You now have access to the requested documentation.",
        rejected:
          "We're sorry, but your application has been declined at this time.",
      };

      await sendEmail({
        to: application.email,
        subject: `Phoenix Rooivalk Access Application - ${application.status.charAt(0).toUpperCase() + application.status.slice(1)}`,
        html: `
          <h2>Application Status Update</h2>
          <p>Hello ${application.firstName},</p>
          <p>${statusMessages[application.status]}</p>
          <p><strong>Application #:</strong> ${application.applicationNumber}</p>
          <p><strong>Requested Role:</strong> ${application.requestedRole}</p>
          ${application.reviewNotes ? `<p><strong>Notes:</strong> ${application.reviewNotes}</p>` : ""}
          <p><a href="${process.env.DOCS_BASE_URL}/docs">Go to Documentation</a></p>
        `,
      });
    } catch (error) {
      console.error("Failed to send applicant notification:", error);
    }
  }
}

/**
 * Singleton instance
 */
export const accessApplicationsService = new AccessApplicationsService();
