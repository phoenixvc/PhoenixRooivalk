/**
 * Email Components
 */

export { SendEmail } from "./SendEmail";
export type { SendEmailProps } from "./SendEmail";

export { DraftEmailComposer } from "./DraftEmailComposer";
export type { DraftEmailComposerProps } from "./DraftEmailComposer";

// Re-export types from service for convenience
export type { GitHubIssueOptions } from "../../services/emailService";
