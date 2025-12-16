/**
 * Known Emails Service
 *
 * Business logic for managing known internal user email mappings.
 */

import {
  knownEmailsRepository,
  KnownEmail,
  KnownEmailFilters,
} from "../repositories/known-emails.repository";
import {
  PaginatedResult,
  PaginationOptions,
} from "../repositories/base.repository";

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
 * Result of adding a known email
 */
export interface AddKnownEmailResult {
  success: boolean;
  email?: KnownEmail;
  error?: string;
}

/**
 * Available profile keys that can be assigned
 */
export const AVAILABLE_PROFILE_KEYS = [
  "martyn",
  "jurie",
  "pieter",
  "eben",
  "member",
] as const;

export type ProfileKey = (typeof AVAILABLE_PROFILE_KEYS)[number];

/**
 * Known Emails Service
 */
class KnownEmailsService {
  private emailMapCache: Map<string, string> | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate profile key
   */
  private isValidProfileKey(profileKey: string): boolean {
    return AVAILABLE_PROFILE_KEYS.includes(profileKey as ProfileKey);
  }

  /**
   * Validate add email data
   */
  validateAddEmail(data: AddKnownEmailData): string | null {
    if (!data.email?.trim()) {
      return "Email is required";
    }
    if (!this.isValidEmail(data.email.trim())) {
      return "Invalid email format";
    }
    if (!data.profileKey?.trim()) {
      return "Profile key is required";
    }
    if (!this.isValidProfileKey(data.profileKey.trim())) {
      return `Invalid profile key. Must be one of: ${AVAILABLE_PROFILE_KEYS.join(", ")}`;
    }
    if (!data.displayName?.trim()) {
      return "Display name is required";
    }
    return null;
  }

  /**
   * Add a known email
   */
  async addEmail(
    data: AddKnownEmailData,
    addedBy?: string,
  ): Promise<AddKnownEmailResult> {
    const validationError = this.validateAddEmail(data);
    if (validationError) {
      return { success: false, error: validationError };
    }

    try {
      const email = await knownEmailsRepository.addEmail(
        data.email.trim(),
        data.profileKey.trim(),
        data.displayName.trim(),
        addedBy,
        data.notes?.trim(),
      );

      // Invalidate cache
      this.invalidateCache();

      return { success: true, email };
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        return { success: false, error: error.message };
      }
      console.error("Error adding known email:", error);
      return { success: false, error: "Failed to add email" };
    }
  }

  /**
   * Update a known email
   */
  async updateEmail(
    id: string,
    data: UpdateKnownEmailData,
  ): Promise<{ success: boolean; email?: KnownEmail; error?: string }> {
    // Validate profile key if provided
    if (data.profileKey && !this.isValidProfileKey(data.profileKey)) {
      return {
        success: false,
        error: `Invalid profile key. Must be one of: ${AVAILABLE_PROFILE_KEYS.join(", ")}`,
      };
    }

    try {
      const email = await knownEmailsRepository.updateEmail(id, {
        profileKey: data.profileKey?.trim(),
        displayName: data.displayName?.trim(),
        notes: data.notes?.trim(),
        isActive: data.isActive,
      });

      if (!email) {
        return { success: false, error: "Email not found" };
      }

      // Invalidate cache
      this.invalidateCache();

      return { success: true, email };
    } catch (error) {
      console.error("Error updating known email:", error);
      return { success: false, error: "Failed to update email" };
    }
  }

  /**
   * Deactivate (soft delete) a known email
   */
  async deactivateEmail(
    id: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const email = await knownEmailsRepository.deactivateEmail(id);
      if (!email) {
        return { success: false, error: "Email not found" };
      }

      // Invalidate cache
      this.invalidateCache();

      return { success: true };
    } catch (error) {
      console.error("Error deactivating known email:", error);
      return { success: false, error: "Failed to deactivate email" };
    }
  }

  /**
   * Hard delete a known email
   */
  async deleteEmail(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await knownEmailsRepository.delete(id);

      // Invalidate cache
      this.invalidateCache();

      return { success: true };
    } catch (error) {
      console.error("Error deleting known email:", error);
      return { success: false, error: "Failed to delete email" };
    }
  }

  /**
   * Get a known email by ID
   */
  async getEmail(id: string): Promise<KnownEmail | null> {
    return knownEmailsRepository.findById(id);
  }

  /**
   * Get emails with filters
   */
  async getEmails(
    filters?: KnownEmailFilters,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<KnownEmail>> {
    return knownEmailsRepository.findWithFilters(filters, options);
  }

  /**
   * Get profile key for an email (with caching)
   */
  async getProfileKeyForEmail(email: string): Promise<string | null> {
    const map = await this.getEmailMap();
    return map.get(email.toLowerCase().trim()) || null;
  }

  /**
   * Get the email-to-profile-key map (with caching)
   */
  async getEmailMap(): Promise<Map<string, string>> {
    const now = Date.now();

    // Return cached data if still valid
    if (this.emailMapCache && now < this.cacheExpiry) {
      return this.emailMapCache;
    }

    // Fetch fresh data
    this.emailMapCache = await knownEmailsRepository.getAllActiveEmailsMap();
    this.cacheExpiry = now + this.CACHE_TTL_MS;

    return this.emailMapCache;
  }

  /**
   * Invalidate the cache
   */
  invalidateCache(): void {
    this.emailMapCache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Get count of active emails
   */
  async getActiveCount(): Promise<number> {
    return knownEmailsRepository.getActiveCount();
  }

  /**
   * Get available profile keys
   */
  getAvailableProfileKeys(): readonly string[] {
    return AVAILABLE_PROFILE_KEYS;
  }
}

/**
 * Singleton instance
 */
export const knownEmailsService = new KnownEmailsService();
