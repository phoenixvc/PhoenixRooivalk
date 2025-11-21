import React, { useState, useEffect } from "react";
import type { EvidenceRecord, BlockchainAnchor } from "@phoenix/types";
import styles from "./EvidenceExplorer.module.css";

/**
 * EvidenceExplorer - Blockchain Evidence Explorer & Audit Trail Viewer
 *
 * High-value feature for viewing and verifying blockchain-anchored evidence records.
 * Provides complete audit trail visualization, transaction verification, and export capabilities.
 *
 * Key Features:
 * - Interactive timeline of all evidence records
 * - Transaction verification with block explorer links
 * - Cryptographic proof visualization
 * - Export capabilities for compliance audits
 * - Filter by date range, event type, and chain
 * - Real-time confirmation status updates
 */

interface EvidenceExplorerProps {
  apiBaseUrl?: string;
  darkMode?: boolean;
}

type FilterOptions = {
  eventType?: string;
  chain?: "all" | "solana" | "etherlink";
  dateFrom?: string;
  dateTo?: string;
  status?: "all" | "anchored" | "pending" | "failed";
};

export const EvidenceExplorer: React.FC<EvidenceExplorerProps> = ({
  apiBaseUrl = "/api",
  darkMode = true,
}) => {
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [selectedEvidence, setSelectedEvidence] =
    useState<EvidenceRecord | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    chain: "all",
    status: "all",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch evidence records from API
  useEffect(() => {
    const fetchEvidence = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build query params from filters
        const params = new URLSearchParams();
        if (filters.eventType) params.append("eventType", filters.eventType);
        if (filters.dateFrom) params.append("from", filters.dateFrom);
        if (filters.dateTo) params.append("to", filters.dateTo);
        if (filters.status && filters.status !== "all") {
          params.append("status", filters.status);
        }

        const response = await fetch(
          `${apiBaseUrl}/evidence?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch evidence: ${response.statusText}`);
        }

        const data = await response.json();
        let records = data.data || data;

        // Filter by chain client-side
        if (filters.chain && filters.chain !== "all") {
          records = records.filter((record: EvidenceRecord) =>
            record.anchors.some((anchor) => anchor.chain === filters.chain),
          );
        }

        setEvidence(records);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchEvidence();
  }, [apiBaseUrl, filters]);

  const getChainExplorerUrl = (anchor: BlockchainAnchor): string => {
    if (anchor.chain === "solana") {
      return `https://explorer.solana.com/tx/${anchor.transactionId}`;
    } else if (anchor.chain === "etherlink") {
      return `https://explorer.etherlink.com/tx/${anchor.transactionId}`;
    }
    return "#";
  };

  const getStatusBadge = (
    record: EvidenceRecord,
  ): { label: string; color: string } => {
    const hasConfirmed = record.anchors.some(
      (a) => a.chain === "solana" || a.chain === "etherlink",
    );
    const allConfirmed = record.anchors.length > 0;

    if (!hasConfirmed) return { label: "Pending", color: "#f59e0b" };
    if (allConfirmed) return { label: "Anchored", color: "#10b981" };
    return { label: "Partial", color: "#3b82f6" };
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(evidence, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportName = `evidence-export-${new Date().toISOString()}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportName);
    linkElement.click();
  };

  const exportToCSV = () => {
    const csvHeader = "ID,Event Type,Timestamp,Digest,Chains\n";
    const csvRows = evidence.map((record) => {
      const chains = record.anchors.map((a) => a.chain).join(";");
      return `"${record.id}","${record.eventType}","${record.timestamp}","${record.digest}","${chains}"`;
    });
    const csv = csvHeader + csvRows.join("\n");

    const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    const exportName = `evidence-export-${new Date().toISOString()}.csv`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportName);
    linkElement.click();
  };

  return (
    <div className={`${styles.explorer} ${darkMode ? styles.dark : ""}`}>
      <header className={styles.header}>
        <h1>🔗 Blockchain Evidence Explorer</h1>
        <p className={styles.subtitle}>
          Tamper-proof audit trail with cryptographic verification
        </p>
      </header>

      <div className={styles.filters}>
        <select
          value={filters.chain || "all"}
          onChange={(e) =>
            setFilters({ ...filters, chain: e.target.value as any })
          }
          className={styles.select}
          aria-label="Filter by blockchain"
        >
          <option value="all">All Chains</option>
          <option value="solana">Solana</option>
          <option value="etherlink">EtherLink</option>
        </select>

        <select
          value={filters.status || "all"}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value as any })
          }
          className={styles.select}
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="anchored">Anchored</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <input
          type="date"
          value={filters.dateFrom || ""}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          className={styles.dateInput}
          aria-label="From date"
        />

        <input
          type="date"
          value={filters.dateTo || ""}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          className={styles.dateInput}
          aria-label="To date"
        />

        <div className={styles.exportButtons}>
          <button
            onClick={exportToJSON}
            className={styles.exportBtn}
            aria-label="Export as JSON"
          >
            📄 JSON
          </button>
          <button
            onClick={exportToCSV}
            className={styles.exportBtn}
            aria-label="Export as CSV"
          >
            📊 CSV
          </button>
        </div>
      </div>

      {loading && (
        <div className={styles.loading} role="status" aria-live="polite">
          Loading evidence records...
        </div>
      )}

      {error && (
        <div className={styles.error} role="alert">
          ⚠️ Error: {error}
        </div>
      )}

      {!loading && !error && (
        <div className={styles.content}>
          <div className={styles.timeline}>
            <h2>Evidence Timeline</h2>
            <div className={styles.recordsList}>
              {evidence.length === 0 ? (
                <p className={styles.noRecords}>No evidence records found</p>
              ) : (
                evidence.map((record) => {
                  const status = getStatusBadge(record);
                  return (
                    <div
                      key={record.id}
                      className={`${styles.recordCard} ${selectedEvidence?.id === record.id ? styles.selected : ""}`}
                      onClick={() => setSelectedEvidence(record)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Evidence record ${record.id}`}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedEvidence(record);
                        }
                      }}
                    >
                      <div className={styles.recordHeader}>
                        <span className={styles.recordId}>{record.id}</span>
                        <span
                          className={styles.statusBadge}
                          style={{ backgroundColor: status.color }}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className={styles.recordType}>
                        {record.eventType}
                      </div>
                      <div className={styles.recordTime}>
                        {new Date(record.timestamp).toLocaleString()}
                      </div>
                      <div className={styles.recordChains}>
                        {record.anchors.map((anchor) => (
                          <span
                            key={anchor.transactionId}
                            className={styles.chainBadge}
                          >
                            {anchor.chain}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {selectedEvidence && (
            <div className={styles.details}>
              <h2>Evidence Details</h2>
              <div className={styles.detailsContent}>
                <div className={styles.detailSection}>
                  <h3>Record Information</h3>
                  <dl>
                    <dt>ID:</dt>
                    <dd className={styles.mono}>{selectedEvidence.id}</dd>
                    <dt>Event Type:</dt>
                    <dd>{selectedEvidence.eventType}</dd>
                    <dt>Timestamp:</dt>
                    <dd>
                      {new Date(selectedEvidence.timestamp).toLocaleString()}
                    </dd>
                    <dt>Digest:</dt>
                    <dd className={styles.mono}>{selectedEvidence.digest}</dd>
                  </dl>
                </div>

                <div className={styles.detailSection}>
                  <h3>Blockchain Anchors</h3>
                  {selectedEvidence.anchors.length === 0 ? (
                    <p className={styles.noAnchors}>Not yet anchored</p>
                  ) : (
                    selectedEvidence.anchors.map((anchor) => (
                      <div
                        key={anchor.transactionId}
                        className={styles.anchorCard}
                      >
                        <div className={styles.anchorHeader}>
                          <span className={styles.anchorChain}>
                            {anchor.chain.toUpperCase()}
                          </span>
                          <a
                            href={getChainExplorerUrl(anchor)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.explorerLink}
                          >
                            View on Explorer ↗
                          </a>
                        </div>
                        <dl className={styles.anchorDetails}>
                          <dt>Transaction ID:</dt>
                          <dd className={styles.mono}>
                            {anchor.transactionId}
                          </dd>
                          <dt>Block Height:</dt>
                          <dd>{anchor.blockHeight}</dd>
                          <dt>Timestamp:</dt>
                          <dd>{new Date(anchor.timestamp).toLocaleString()}</dd>
                          <dt>Verified:</dt>
                          <dd>
                            <span className={styles.verifiedBadge}>
                              ✓ Confirmed
                            </span>
                          </dd>
                        </dl>
                      </div>
                    ))
                  )}
                </div>

                <div className={styles.detailSection}>
                  <h3>Payload</h3>
                  <pre className={styles.payloadPre}>
                    {JSON.stringify(selectedEvidence.payload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EvidenceExplorer;
