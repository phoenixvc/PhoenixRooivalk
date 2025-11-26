/**
 * AI Search Bar Component
 *
 * A compact search bar for AI-powered documentation search.
 * Can be embedded in the sidebar or navbar.
 */

import React, { useState, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./AISearchBar.css";

interface AISearchBarProps {
  /** Callback when user submits a question */
  onAsk?: (question: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Size variant */
  size?: "small" | "medium";
  /** Show in sidebar or navbar mode */
  variant?: "sidebar" | "navbar";
}

export function AISearchBar({
  onAsk,
  placeholder = "Ask AI about docs...",
  size = "medium",
  variant = "sidebar",
}: AISearchBarProps): React.ReactElement | null {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim() && onAsk) {
        onAsk(query.trim());
        setQuery("");
      }
    },
    [query, onAsk]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
    }
  };

  // Only show for authenticated users
  if (!user) {
    return null;
  }

  return (
    <form
      className={`ai-search-bar ai-search-bar--${size} ai-search-bar--${variant} ${isFocused ? "ai-search-bar--focused" : ""}`}
      onSubmit={handleSubmit}
    >
      <div className="ai-search-bar__icon">🤖</div>
      <input
        ref={inputRef}
        type="text"
        className="ai-search-bar__input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        aria-label="Ask AI about documentation"
      />
      {query && (
        <button
          type="submit"
          className="ai-search-bar__submit"
          aria-label="Ask question"
        >
          ➤
        </button>
      )}
      <div className="ai-search-bar__shortcut">
        <kbd>⌘</kbd>
        <kbd>K</kbd>
      </div>
    </form>
  );
}

export default AISearchBar;
