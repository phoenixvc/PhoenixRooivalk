/**
 * DraftEmailComposer Component
 *
 * A specialized wrapper around SendEmail for use in documentation pages.
 * Allows embedding pre-filled draft emails that users can review and send.
 */

import React, { useState } from "react";
import { SendEmail, SendEmailProps } from "./SendEmail";
import { GitHubIssueOptions } from "../../services/emailService";
import "./DraftEmailComposer.css";

export interface DraftEmailComposerProps {
  /** Recipient email address */
  to: string;
  /** Email subject */
  subject: string;
  /** Email body content (plain text) */
  body: string;
  /** Title shown above the composer */
  title?: string;
  /** Description/context shown before the email preview */
  description?: string;
  /** Whether to start expanded or collapsed */
  defaultExpanded?: boolean;
  /** Allow editing the recipient */
  editableTo?: boolean;
  /** Allow editing the subject */
  editableSubject?: boolean;
  /** Allow editing the body */
  editableBody?: boolean;
  /** Show GitHub log button */
  showGitHubLog?: boolean;
  /** GitHub issue options */
  gitHubOptions?: GitHubIssueOptions;
}

export function DraftEmailComposer({
  to,
  subject,
  body,
  title = "Draft Email",
  description,
  defaultExpanded = false,
  editableTo = false,
  editableSubject = true,
  editableBody = true,
  showGitHubLog = true,
  gitHubOptions,
}: DraftEmailComposerProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isSent, setIsSent] = useState(false);

  const handleSend = (result: { success: boolean }) => {
    if (result.success) {
      setIsSent(true);
    }
  };

  if (isSent) {
    return (
      <div className="draft-email-composer draft-email-composer--sent">
        <div className="draft-email-composer__sent-message">
          <span className="draft-email-composer__sent-icon">✓</span>
          <span>Email sent successfully!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="draft-email-composer">
      <button
        className="draft-email-composer__toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="draft-email-composer__toggle-icon">
          {isExpanded ? "▼" : "▶"}
        </span>
        <span className="draft-email-composer__toggle-title">{title}</span>
        <span className="draft-email-composer__toggle-badge">
          {isExpanded ? "Collapse" : "Expand to send"}
        </span>
      </button>

      {isExpanded && (
        <div className="draft-email-composer__content">
          {description && (
            <p className="draft-email-composer__description">{description}</p>
          )}
          <SendEmail
            draft={{ to, subject, body }}
            editableTo={editableTo}
            editableSubject={editableSubject}
            editableBody={editableBody}
            onSend={handleSend}
            onCancel={() => setIsExpanded(false)}
            hideHeader
            compact
            showGitHubLog={showGitHubLog}
            gitHubOptions={gitHubOptions}
          />
        </div>
      )}
    </div>
  );
}

export default DraftEmailComposer;
