/**
 * AI Context Button Component
 *
 * A small button that appears next to sections, allowing users
 * to ask AI questions about specific content.
 */

import React from "react";
import "./AIContextButton.css";

interface AIContextButtonProps {
  /** The section/heading text to ask about */
  sectionTitle: string;
  /** Click handler */
  onClick: (question: string) => void;
  /** Size variant */
  size?: "small" | "medium";
  /** Position relative to content */
  position?: "inline" | "floating";
}

export function AIContextButton({
  sectionTitle,
  onClick,
  size = "small",
  position = "inline",
}: AIContextButtonProps): React.ReactElement {
  const handleClick = () => {
    const question = `Explain the "${sectionTitle}" section in detail`;
    onClick(question);
  };

  return (
    <button
      className={`ai-context-btn ai-context-btn--${size} ai-context-btn--${position}`}
      onClick={handleClick}
      title={`Ask AI about: ${sectionTitle}`}
      aria-label={`Ask AI about ${sectionTitle}`}
    >
      <span className="ai-context-btn__icon">🤖</span>
      <span className="ai-context-btn__label">Ask AI</span>
    </button>
  );
}

export default AIContextButton;
