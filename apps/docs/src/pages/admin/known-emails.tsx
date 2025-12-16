/**
 * Admin Known Emails Management
 *
 * Admin page for managing known internal user email mappings.
 */

import Layout from "@theme/Layout";
import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getKnownEmails,
  addKnownEmail,
  updateKnownEmail,
  deleteKnownEmail,
  getProfileKeys,
  getKnownEmailsCount,
  KnownEmail,
  AddKnownEmailData,
} from "../../services/known-emails";

import styles from "./known-emails.module.css";

export default function KnownEmailsAdminPage(): React.ReactElement {
  const { user, loading, userProfile } = useAuth();
  const [emails, setEmails] = useState<KnownEmail[]>([]);
  const [profileKeys, setProfileKeys] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<KnownEmail | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<AddKnownEmailData>({
    email: "",
    profileKey: "",
    displayName: "",
    notes: "",
  });
  const [formError, setFormError] = useState("");

  // Check if user is admin
  const isAdmin = userProfile.isInternalDomain;

  // Fetch emails
  const fetchEmails = useCallback(async () => {
    setIsLoading(true);
    try {
      const [emailsResult, countResult, keysResult] = await Promise.all([
        getKnownEmails({ search: searchQuery || undefined }),
        getKnownEmailsCount(),
        getProfileKeys(),
      ]);
      setEmails(emailsResult.emails);
      setTotalCount(countResult);
      setProfileKeys(keysResult);
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchEmails();
    }
  }, [user, isAdmin, fetchEmails]);

  // Handle search
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (user && isAdmin) {
        fetchEmails();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, user, isAdmin, fetchEmails]);

  // Handle form submit (add)
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const result = await addKnownEmail(formData);
      if (result.success) {
        setShowAddForm(false);
        setFormData({ email: "", profileKey: "", displayName: "", notes: "" });
        await fetchEmails();
      } else {
        setFormError(result.error || "Failed to add email");
      }
    } catch (error) {
      setFormError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update email
  const handleUpdateEmail = async (id: string, data: Partial<KnownEmail>) => {
    setIsSubmitting(true);
    try {
      const result = await updateKnownEmail(id, data);
      if (result.success) {
        await fetchEmails();
        setSelectedEmail(null);
      } else {
        alert(result.error || "Failed to update email");
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete email
  const handleDeleteEmail = async (id: string, hard = false) => {
    if (
      !confirm(
        hard ? "Permanently delete this email?" : "Deactivate this email?",
      )
    ) {
      return;
    }

    try {
      const result = await deleteKnownEmail(id, hard);
      if (result.success) {
        await fetchEmails();
        setSelectedEmail(null);
      } else {
        alert(result.error || "Failed to delete email");
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Show loading state
  if (loading) {
    return (
      <Layout title="Known Emails">
        <main className={styles.main}>
          <div className={styles.loading}>Loading...</div>
        </main>
      </Layout>
    );
  }

  // Show unauthorized message for non-admins
  if (!user || !isAdmin) {
    return (
      <Layout title="Known Emails">
        <main className={styles.main}>
          <div className={styles.unauthorized}>
            <h1>Access Denied</h1>
            <p>
              You don't have permission to view this page. Only internal team
              members can access the known emails management.
            </p>
            <a href="/login" className="button button--primary">
              Sign In
            </a>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout
      title="Known Emails"
      description="Manage known internal user email mappings"
    >
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1>Known Emails</h1>
              <p>
                Manage internal user email mappings for automatic recognition
              </p>
            </div>
            <button
              type="button"
              className={`button button--primary ${styles.addBtn}`}
              onClick={() => setShowAddForm(true)}
            >
              + Add Email
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{totalCount}</span>
            <span className={styles.statLabel}>Active Emails</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{profileKeys.length}</span>
            <span className={styles.statLabel}>Profile Keys</span>
          </div>
        </div>

        {/* Search */}
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by email or display name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Add Form Modal */}
        {showAddForm && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowAddForm(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Add Known Email</h2>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setShowAddForm(false)}
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleAddEmail} className={styles.form}>
                {formError && <div className={styles.error}>{formError}</div>}
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    placeholder="user@example.com"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="displayName">Display Name *</label>
                  <input
                    type="text"
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="profileKey">Profile Key *</label>
                  <select
                    id="profileKey"
                    value={formData.profileKey}
                    onChange={(e) =>
                      setFormData({ ...formData, profileKey: e.target.value })
                    }
                    required
                  >
                    <option value="">Select a profile...</option>
                    {profileKeys.map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="notes">Notes (optional)</label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Additional notes about this user..."
                    rows={3}
                  />
                </div>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button button--primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Adding..." : "Add Email"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Emails list */}
        <div className={styles.emailsList}>
          {isLoading ? (
            <div className={styles.loadingList}>Loading emails...</div>
          ) : emails.length === 0 ? (
            <div className={styles.emptyList}>
              <p>
                {searchQuery
                  ? "No emails found matching your search."
                  : "No known emails configured yet."}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => setShowAddForm(true)}
                >
                  Add Your First Email
                </button>
              )}
            </div>
          ) : (
            emails.map((email) => (
              <div
                key={email.id}
                className={`${styles.emailCard} ${selectedEmail?.id === email.id ? styles.selected : ""} ${!email.isActive ? styles.inactive : ""}`}
                onClick={() => setSelectedEmail(email)}
                onKeyDown={(e) => e.key === "Enter" && setSelectedEmail(email)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.emailHeader}>
                  <span className={styles.emailAddress}>{email.email}</span>
                  <span
                    className={`${styles.statusBadge} ${email.isActive ? styles.active : styles.inactiveBadge}`}
                  >
                    {email.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className={styles.emailBody}>
                  <p className={styles.displayName}>{email.displayName}</p>
                  <p className={styles.profileKey}>
                    Profile: <strong>{email.profileKey}</strong>
                  </p>
                </div>
                <div className={styles.emailFooter}>
                  <span className={styles.emailDate}>
                    Added {formatDate(email.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail panel */}
        {selectedEmail && (
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <h2>Email Details</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedEmail(null)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className={styles.detailContent}>
              <div className={styles.detailSection}>
                <h4>Email Information</h4>
                <p>
                  <strong>Email:</strong> {selectedEmail.email}
                </p>
                <p>
                  <strong>Display Name:</strong> {selectedEmail.displayName}
                </p>
                <p>
                  <strong>Profile Key:</strong> {selectedEmail.profileKey}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`${styles.statusBadge} ${selectedEmail.isActive ? styles.active : styles.inactiveBadge}`}
                  >
                    {selectedEmail.isActive ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>

              {selectedEmail.notes && (
                <div className={styles.detailSection}>
                  <h4>Notes</h4>
                  <div className={styles.notesText}>{selectedEmail.notes}</div>
                </div>
              )}

              <div className={styles.detailSection}>
                <h4>History</h4>
                <p>
                  <strong>Added:</strong> {formatDate(selectedEmail.createdAt)}
                </p>
                <p>
                  <strong>Last Updated:</strong>{" "}
                  {formatDate(selectedEmail.updatedAt)}
                </p>
                {selectedEmail.addedBy && (
                  <p>
                    <strong>Added By:</strong> {selectedEmail.addedBy}
                  </p>
                )}
              </div>

              <div className={styles.detailActions}>
                <h4>Actions</h4>
                <div className={styles.actionButtons}>
                  {selectedEmail.isActive ? (
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.deactivateBtn}`}
                      onClick={() => handleDeleteEmail(selectedEmail.id, false)}
                      disabled={isSubmitting}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.activateBtn}`}
                      onClick={() =>
                        handleUpdateEmail(selectedEmail.id, { isActive: true })
                      }
                      disabled={isSubmitting}
                    >
                      Reactivate
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={() => handleDeleteEmail(selectedEmail.id, true)}
                    disabled={isSubmitting}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className={styles.navigation}>
          <a href="/admin/applications" className="button button--secondary">
            &larr; Back to Applications
          </a>
        </div>
      </main>
    </Layout>
  );
}
