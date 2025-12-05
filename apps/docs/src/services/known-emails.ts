/**
 * Known Emails Service
 *
 * Frontend service for managing known internal user email mappings.
 */

import { getAuthService } from "./cloud";

const API_BASE = process.env.AZURE_FUNCTIONS_BASE_URL || "/api";

/**
 * Known email data
 */
export interface KnownEmail {
  id: string;
  email: string;
  profileKey: string;
  displayName: string;
  addedBy?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input data for adding a known email
 */
export interface AddKnownEmailData {
  email: string;
  profileKey: string;
  displayName: string;
  notes?: string;
}

/**
 * Input data for updating a known email
 */
export interface UpdateKnownEmailData {
  profileKey?: string;
  displayName?: string;
  notes?: string;
  isActive?: boolean;
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
 * Get all known emails (admin)
 */
export async function getKnownEmails(filters?: {
  search?: string;
  profileKey?: string;
  isActive?: boolean;
  limit?: number;
}): Promise<{ emails: KnownEmail[]; hasMore: boolean }> {
  try {
    const headers = await getAuthHeader();
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.profileKey) params.set("profileKey", filters.profileKey);
    if (filters?.isActive !== undefined)
      params.set("isActive", filters.isActive.toString());
    if (filters?.limit) params.set("limit", filters.limit.toString());

    const url = `${API_BASE}/known-emails${params.toString() ? `?${params}` : ""}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      return { emails: [], hasMore: false };
    }

    const result = await response.json();
    return {
      emails: result.emails || [],
      hasMore: result.hasMore || false,
    };
  } catch (error) {
    console.error("Error fetching known emails:", error);
    return { emails: [], hasMore: false };
  }
}

/**
 * Get a single known email by ID (admin)
 */
export async function getKnownEmail(id: string): Promise<KnownEmail | null> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/known-emails/${id}`, { headers });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.email || null;
  } catch (error) {
    console.error("Error fetching known email:", error);
    return null;
  }
}

/**
 * Add a known email (admin)
 */
export async function addKnownEmail(
  data: AddKnownEmailData,
): Promise<{ success: boolean; email?: KnownEmail; error?: string }> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/known-emails`, {
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
        error: result.error || "Failed to add email",
      };
    }

    return {
      success: true,
      email: result.email,
    };
  } catch (error) {
    console.error("Error adding known email:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}

/**
 * Update a known email (admin)
 */
export async function updateKnownEmail(
  id: string,
  data: UpdateKnownEmailData,
): Promise<{ success: boolean; email?: KnownEmail; error?: string }> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/known-emails/${id}`, {
      method: "PUT",
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
        error: result.error || "Failed to update email",
      };
    }

    return {
      success: true,
      email: result.email,
    };
  } catch (error) {
    console.error("Error updating known email:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}

/**
 * Delete a known email (admin)
 */
export async function deleteKnownEmail(
  id: string,
  hardDelete = false,
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAuthHeader();
    const url = hardDelete
      ? `${API_BASE}/known-emails/${id}?hard=true`
      : `${API_BASE}/known-emails/${id}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to delete email",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting known email:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}

/**
 * Check if an email is a known internal email
 */
export async function checkKnownEmail(
  email: string,
): Promise<{ isKnown: boolean; profileKey: string | null }> {
  if (!email) {
    return { isKnown: false, profileKey: null };
  }

  try {
    const headers = await getAuthHeader();
    const url = `${API_BASE}/known-emails/check?email=${encodeURIComponent(email)}`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      return { isKnown: false, profileKey: null };
    }

    const result = await response.json();
    return {
      isKnown: result.isKnown || false,
      profileKey: result.profileKey || null,
    };
  } catch (error) {
    console.error("Error checking known email:", error);
    return { isKnown: false, profileKey: null };
  }
}

/**
 * Get available profile keys (admin)
 */
export async function getProfileKeys(): Promise<string[]> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/known-emails/profile-keys`, {
      headers,
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    return result.profileKeys || [];
  } catch (error) {
    console.error("Error fetching profile keys:", error);
    return [];
  }
}

/**
 * Get count of known emails (admin)
 */
export async function getKnownEmailsCount(): Promise<number> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/known-emails/count`, { headers });

    if (!response.ok) {
      return 0;
    }

    const result = await response.json();
    return result.count || 0;
  } catch (error) {
    console.error("Error fetching known emails count:", error);
    return 0;
  }
}
