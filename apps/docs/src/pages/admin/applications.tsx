/**
 * Admin Applications Dashboard
 *
 * Admin page for reviewing and managing access applications.
 */

import Layout from "@theme/Layout";
import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAdminApplications,
  getApplicationCounts,
  updateApplicationStatus,
  AccessApplication,
  ApplicationStatus,
} from "../../services/access-applications";

import styles from "./applications.module.css";

interface ApplicationCounts {
  pending: number;
  approved: number;
  rejected: number;
}

export default function ApplicationsAdminPage(): React.ReactElement {
  const { user, loading, userProfile } = useAuth();
  const [applications, setApplications] = useState<AccessApplication[]>([]);
  const [counts, setCounts] = useState<ApplicationCounts>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
    "pending",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] =
    useState<AccessApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if user is admin (based on internal domain)
  const isAdmin = userProfile.isInternalDomain;

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const [appsResult, countsResult] = await Promise.all([
        getAdminApplications({
          status: statusFilter === "all" ? undefined : statusFilter,
        }),
        getApplicationCounts(),
      ]);
      setApplications(appsResult.applications);
      setCounts(countsResult);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchApplications();
    }
  }, [user, isAdmin, fetchApplications]);

  // Handle status update
  const handleStatusUpdate = async (status: ApplicationStatus) => {
    if (!selectedApplication || isUpdating) return;

    setIsUpdating(true);
    try {
      const result = await updateApplicationStatus(
        selectedApplication.id,
        status,
        reviewNotes || undefined,
      );

      if (result.success) {
        // Refresh the list
        await fetchApplications();
        setSelectedApplication(null);
        setReviewNotes("");
      } else {
        alert(result.error || "Failed to update application");
      }
    } catch (error) {
      console.error("Error updating application:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show loading state
  if (loading) {
    return (
      <Layout title="Access Applications">
        <main className={styles.main}>
          <div className={styles.loading}>Loading...</div>
        </main>
      </Layout>
    );
  }

  // Show unauthorized message for non-admins
  if (!user || !isAdmin) {
    return (
      <Layout title="Access Applications">
        <main className={styles.main}>
          <div className={styles.unauthorized}>
            <h1>Access Denied</h1>
            <p>
              You don't have permission to view this page. Only internal team
              members can access the applications dashboard.
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
      title="Access Applications"
      description="Review and manage access applications"
    >
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Access Applications</h1>
          <p>Review and manage team access requests</p>
        </header>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={`${styles.statCard} ${styles.statPending}`}>
            <span className={styles.statValue}>{counts.pending}</span>
            <span className={styles.statLabel}>Pending</span>
          </div>
          <div className={`${styles.statCard} ${styles.statApproved}`}>
            <span className={styles.statValue}>{counts.approved}</span>
            <span className={styles.statLabel}>Approved</span>
          </div>
          <div className={`${styles.statCard} ${styles.statRejected}`}>
            <span className={styles.statValue}>{counts.rejected}</span>
            <span className={styles.statLabel}>Rejected</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className={styles.filters}>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === "pending" ? styles.active : ""}`}
            onClick={() => setStatusFilter("pending")}
          >
            Pending ({counts.pending})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === "approved" ? styles.active : ""}`}
            onClick={() => setStatusFilter("approved")}
          >
            Approved
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === "rejected" ? styles.active : ""}`}
            onClick={() => setStatusFilter("rejected")}
          >
            Rejected
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === "all" ? styles.active : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>
        </div>

        {/* Applications list */}
        <div className={styles.applicationsList}>
          {isLoading ? (
            <div className={styles.loadingList}>Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className={styles.emptyList}>
              <p>No {statusFilter !== "all" ? statusFilter : ""} applications found.</p>
            </div>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                className={`${styles.applicationCard} ${selectedApplication?.id === app.id ? styles.selected : ""}`}
                onClick={() => setSelectedApplication(app)}
                onKeyDown={(e) =>
                  e.key === "Enter" && setSelectedApplication(app)
                }
                role="button"
                tabIndex={0}
              >
                <div className={styles.applicationHeader}>
                  <span className={styles.applicationNumber}>
                    {app.applicationNumber}
                  </span>
                  <span
                    className={`${styles.statusBadge} ${styles[`status${app.status.charAt(0).toUpperCase() + app.status.slice(1)}`]}`}
                  >
                    {app.status}
                  </span>
                </div>
                <div className={styles.applicationBody}>
                  <h3>
                    {app.firstName} {app.lastName}
                  </h3>
                  <p className={styles.applicationEmail}>{app.email}</p>
                  <p className={styles.applicationRole}>
                    Requesting: <strong>{app.requestedRole}</strong>
                  </p>
                  <p className={styles.applicationCompany}>
                    {app.currentRole} at {app.company}
                  </p>
                </div>
                <div className={styles.applicationFooter}>
                  <span className={styles.applicationDate}>
                    {formatDate(app.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail panel */}
        {selectedApplication && (
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <h2>Application Details</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedApplication(null)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className={styles.detailContent}>
              <div className={styles.detailSection}>
                <h4>Applicant</h4>
                <p>
                  <strong>Name:</strong> {selectedApplication.firstName}{" "}
                  {selectedApplication.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {selectedApplication.email}
                </p>
                <p>
                  <strong>Company:</strong> {selectedApplication.company}
                </p>
                <p>
                  <strong>Current Role:</strong> {selectedApplication.currentRole}
                </p>
                {selectedApplication.linkedIn && (
                  <p>
                    <strong>LinkedIn:</strong>{" "}
                    <a
                      href={selectedApplication.linkedIn}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Profile
                    </a>
                  </p>
                )}
              </div>

              <div className={styles.detailSection}>
                <h4>Request</h4>
                <p>
                  <strong>Requested Role:</strong>{" "}
                  {selectedApplication.requestedRole}
                </p>
                <p>
                  <strong>Reason:</strong>
                </p>
                <div className={styles.reasonText}>
                  {selectedApplication.reason}
                </div>
              </div>

              <div className={styles.detailSection}>
                <h4>Status</h4>
                <p>
                  <strong>Current Status:</strong>{" "}
                  <span
                    className={`${styles.statusBadge} ${styles[`status${selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}`]}`}
                  >
                    {selectedApplication.status}
                  </span>
                </p>
                <p>
                  <strong>Submitted:</strong>{" "}
                  {formatDate(selectedApplication.createdAt)}
                </p>
                {selectedApplication.reviewedAt && (
                  <>
                    <p>
                      <strong>Reviewed:</strong>{" "}
                      {formatDate(selectedApplication.reviewedAt)}
                    </p>
                    {selectedApplication.reviewNotes && (
                      <p>
                        <strong>Notes:</strong> {selectedApplication.reviewNotes}
                      </p>
                    )}
                  </>
                )}
              </div>

              {selectedApplication.status === "pending" && (
                <div className={styles.detailActions}>
                  <h4>Review</h4>
                  <textarea
                    className={styles.notesInput}
                    placeholder="Add review notes (optional)..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                  <div className={styles.actionButtons}>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.approveBtn}`}
                      onClick={() => handleStatusUpdate("approved")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.rejectBtn}`}
                      onClick={() => handleStatusUpdate("rejected")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "..." : "Reject"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
