/**
 * SendEmail Component
 *
 * A reusable email composer component that can be used standalone
 * or embedded in documentation pages with pre-filled templates.
 */

import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { emailService, EmailDraft } from "../../services/emailService";
import "./SendEmail.css";

export interface SendEmailProps {
  /** Pre-filled email draft */
  draft?: Partial<EmailDraft>;
  /** Email template with variables */
  template?: {
    subject: string;
    body: string;
    variables?: Record<string, string>;
  };
  /** Allow editing of recipient */
  editableTo?: boolean;
  /** Allow editing of subject */
  editableSubject?: boolean;
  /** Allow editing of body */
  editableBody?: boolean;
  /** Show CC/BCC fields */
  showCcBcc?: boolean;
  /** Compact mode for embedding */
  compact?: boolean;
  /** Callback on successful send */
  onSend?: (result: { success: boolean; messageId?: string }) => void;
  /** Callback on cancel */
  onCancel?: () => void;
  /** Custom title */
  title?: string;
  /** Hide the component header */
  hideHeader?: boolean;
}

type SendStatus = "idle" | "sending" | "success" | "error";

export function SendEmail({
  draft: initialDraft,
  template,
  editableTo = true,
  editableSubject = true,
  editableBody = true,
  showCcBcc = false,
  compact = false,
  onSend,
  onCancel,
  title = "Compose Email",
  hideHeader = false,
}: SendEmailProps): React.ReactElement {
  const { user } = useAuth();
  const [showCcBccFields, setShowCcBccFields] = useState(showCcBcc);
  const [status, setStatus] = useState<SendStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Initialize draft from props or template
  const [draft, setDraft] = useState<EmailDraft>(() => {
    const base: EmailDraft = {
      to: initialDraft?.to || "",
      cc: initialDraft?.cc || "",
      bcc: initialDraft?.bcc || "",
      subject: initialDraft?.subject || template?.subject || "",
      body: initialDraft?.body || template?.body || "",
      isHtml: initialDraft?.isHtml || false,
    };

    // Apply template variables if provided
    if (template?.variables) {
      base.subject = emailService.applyVariables(base.subject, template.variables);
      base.body = emailService.applyVariables(base.body, template.variables);
    }

    return base;
  });

  // Update draft when props change
  useEffect(() => {
    if (initialDraft || template) {
      const newDraft: EmailDraft = {
        to: initialDraft?.to || draft.to,
        cc: initialDraft?.cc || draft.cc,
        bcc: initialDraft?.bcc || draft.bcc,
        subject: initialDraft?.subject || template?.subject || draft.subject,
        body: initialDraft?.body || template?.body || draft.body,
        isHtml: initialDraft?.isHtml || false,
      };

      if (template?.variables) {
        newDraft.subject = emailService.applyVariables(newDraft.subject, template.variables);
        newDraft.body = emailService.applyVariables(newDraft.body, template.variables);
      }

      setDraft(newDraft);
    }
  }, [initialDraft?.to, initialDraft?.subject, template?.subject]);

  const handleFieldChange = useCallback(
    (field: keyof EmailDraft) => (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      setDraft((prev) => ({ ...prev, [field]: e.target.value }));
      setStatus("idle");
      setErrorMessage("");
    },
    []
  );

  const validateDraft = useCallback((): string | null => {
    if (!draft.to.trim()) {
      return "Recipient email is required";
    }

    const recipients = emailService.parseEmailAddresses(draft.to);
    if (recipients.length === 0) {
      return "Please enter a valid email address";
    }

    if (!draft.subject.trim()) {
      return "Subject is required";
    }

    if (!draft.body.trim()) {
      return "Email body is required";
    }

    return null;
  }, [draft]);

  const handleSend = useCallback(async () => {
    const validationError = validateDraft();
    if (validationError) {
      setErrorMessage(validationError);
      setStatus("error");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    const result = await emailService.sendEmail(draft);

    if (result.success) {
      setStatus("success");
      onSend?.(result);
    } else {
      setStatus("error");
      setErrorMessage(result.error || "Failed to send email");
    }
  }, [draft, validateDraft, onSend]);

  const handleOpenInClient = useCallback(() => {
    emailService.openInMailClient(draft);
  }, [draft]);

  const handleCopy = useCallback(async () => {
    const success = await emailService.copyToClipboard(draft);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [draft]);

  const isServiceAvailable = emailService.isAvailable();

  return (
    <div className={`send-email ${compact ? "send-email--compact" : ""}`}>
      {!hideHeader && (
        <div className="send-email__header">
          <h3 className="send-email__title">{title}</h3>
          {!isServiceAvailable && (
            <span className="send-email__badge send-email__badge--warning">
              Offline Mode
            </span>
          )}
        </div>
      )}

      {status === "success" ? (
        <div className="send-email__success">
          <div className="send-email__success-icon">✓</div>
          <h4>Email Sent Successfully!</h4>
          <p>Your email has been sent to {draft.to}</p>
          <button
            className="send-email__btn send-email__btn--secondary"
            onClick={() => setStatus("idle")}
          >
            Send Another
          </button>
        </div>
      ) : (
        <div className="send-email__form">
          {/* To Field */}
          <div className="send-email__field">
            <label htmlFor="email-to">To</label>
            <div className="send-email__field-row">
              <input
                id="email-to"
                type="text"
                value={draft.to}
                onChange={handleFieldChange("to")}
                placeholder="recipient@example.com"
                disabled={!editableTo}
                className={!editableTo ? "send-email__input--readonly" : ""}
              />
              {!showCcBccFields && (
                <button
                  type="button"
                  className="send-email__link"
                  onClick={() => setShowCcBccFields(true)}
                >
                  Cc/Bcc
                </button>
              )}
            </div>
          </div>

          {/* CC/BCC Fields */}
          {showCcBccFields && (
            <>
              <div className="send-email__field">
                <label htmlFor="email-cc">Cc</label>
                <input
                  id="email-cc"
                  type="text"
                  value={draft.cc || ""}
                  onChange={handleFieldChange("cc")}
                  placeholder="cc@example.com"
                />
              </div>
              <div className="send-email__field">
                <label htmlFor="email-bcc">Bcc</label>
                <input
                  id="email-bcc"
                  type="text"
                  value={draft.bcc || ""}
                  onChange={handleFieldChange("bcc")}
                  placeholder="bcc@example.com"
                />
              </div>
            </>
          )}

          {/* Subject Field */}
          <div className="send-email__field">
            <label htmlFor="email-subject">Subject</label>
            <input
              id="email-subject"
              type="text"
              value={draft.subject}
              onChange={handleFieldChange("subject")}
              placeholder="Email subject"
              disabled={!editableSubject}
              className={!editableSubject ? "send-email__input--readonly" : ""}
            />
          </div>

          {/* Body Field */}
          <div className="send-email__field send-email__field--body">
            <label htmlFor="email-body">Message</label>
            <textarea
              id="email-body"
              value={draft.body}
              onChange={handleFieldChange("body")}
              placeholder="Write your message..."
              rows={compact ? 8 : 12}
              disabled={!editableBody}
              className={!editableBody ? "send-email__input--readonly" : ""}
            />
          </div>

          {/* Error Message */}
          {status === "error" && errorMessage && (
            <div className="send-email__error">
              <span className="send-email__error-icon">⚠</span>
              {errorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="send-email__actions">
            <div className="send-email__actions-left">
              {onCancel && (
                <button
                  type="button"
                  className="send-email__btn send-email__btn--secondary"
                  onClick={onCancel}
                >
                  Cancel
                </button>
              )}
            </div>
            <div className="send-email__actions-right">
              <button
                type="button"
                className="send-email__btn send-email__btn--icon"
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                {copied ? "✓ Copied" : "📋 Copy"}
              </button>
              <button
                type="button"
                className="send-email__btn send-email__btn--secondary"
                onClick={handleOpenInClient}
                title="Open in default email client"
              >
                📧 Open in Mail
              </button>
              {isServiceAvailable && (
                <button
                  type="button"
                  className="send-email__btn send-email__btn--primary"
                  onClick={handleSend}
                  disabled={status === "sending"}
                >
                  {status === "sending" ? (
                    <>
                      <span className="send-email__spinner" />
                      Sending...
                    </>
                  ) : (
                    "Send Email"
                  )}
                </button>
              )}
            </div>
          </div>

          {/* From info */}
          {user && (
            <div className="send-email__from-info">
              Sending as: {user.displayName || user.email}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SendEmail;
