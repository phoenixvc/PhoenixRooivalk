/**
 * Access Applications Service
 *
 * Frontend service for submitting and managing access applications.
 */

import { getAuthService } from "./cloud";

/**
 * Get API base URL from Docusaurus config or fallback to /api
 */
function getApiBase(): string {
  if (typeof window !== "undefined") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docusaurusData = (window as any).__DOCUSAURUS__;
      const functionsBaseUrl =
        docusaurusData?.siteConfig?.customFields?.azureConfig?.functionsBaseUrl;
      if (functionsBaseUrl) {
        return functionsBaseUrl;
      }
    } catch {
      // Ignore
    }
  }
  return "/api";
}

const API_BASE = getApiBase();

/**
 * Application status types
 */
export type ApplicationStatus = "pending" | "approved" | "rejected";

/**
 * Access application data
 */
export interface AccessApplication {
  id: string;
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
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

/**
 * Input data for submitting an application
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
 * Get authorization header with current user's token
 */
async function getAuthHeader(): Promise<Record<string, string>> {
  const auth = getAuthService();
  const token = await auth.getIdToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

/**
 * Submit an access application
 */
export async function submitAccessApplication(
  data: SubmitApplicationData,
): Promise<{ success: boolean; applicationNumber?: string; error?: string }> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/access/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to submit application",
      };
    }

    return {
      success: true,
      applicationNumber: result.applicationNumber,
    };
  } catch (error) {
    console.error("Error submitting application:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}

/**
 * Get user's applications
 */
export async function getUserApplications(): Promise<AccessApplication[]> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/access/applications/user`, {
      headers,
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    return result.applications || [];
  } catch (error) {
    console.error("Error fetching user applications:", error);
    return [];
  }
}

/**
 * Get user's pending application
 */
export async function getPendingApplication(): Promise<AccessApplication | null> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/access/applications/pending`, {
      headers,
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.application || null;
  } catch (error) {
    console.error("Error fetching pending application:", error);
    return null;
  }
}

/**
 * Check if user has approved access for a role
 */
export async function checkApprovedAccess(
  role?: string,
): Promise<boolean> {
  try {
    const headers = await getAuthHeader();
    const url = role
      ? `${API_BASE}/access/check?role=${encodeURIComponent(role)}`
      : `${API_BASE}/access/check`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.hasAccess || false;
  } catch (error) {
    console.error("Error checking access:", error);
    return false;
  }
}

// Admin functions

/**
 * Get all applications (admin)
 */
export async function getAdminApplications(filters?: {
  status?: ApplicationStatus;
  role?: string;
  limit?: number;
}): Promise<{ applications: AccessApplication[]; hasMore: boolean }> {
  try {
    const headers = await getAuthHeader();
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.role) params.set("role", filters.role);
    if (filters?.limit) params.set("limit", filters.limit.toString());

    const url = `${API_BASE}/access/applications/admin${params.toString() ? `?${params}` : ""}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      return { applications: [], hasMore: false };
    }

    const result = await response.json();
    return {
      applications: result.applications || [],
      hasMore: result.hasMore || false,
    };
  } catch (error) {
    console.error("Error fetching admin applications:", error);
    return { applications: [], hasMore: false };
  }
}

/**
 * Get application counts (admin)
 */
export async function getApplicationCounts(): Promise<
  Record<ApplicationStatus, number>
> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/access/applications/counts`, {
      headers,
    });

    if (!response.ok) {
      return { pending: 0, approved: 0, rejected: 0 };
    }

    const result = await response.json();
    return result.counts || { pending: 0, approved: 0, rejected: 0 };
  } catch (error) {
    console.error("Error fetching application counts:", error);
    return { pending: 0, approved: 0, rejected: 0 };
  }
}

/**
 * Update application status (admin)
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  reviewNotes?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/access/applications`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ applicationId, status, reviewNotes }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to update application",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating application:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}
