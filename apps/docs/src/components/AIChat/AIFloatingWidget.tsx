/**
 * AI Floating Widget Component
 *
 * The main entry point for the AI assistant, featuring:
 * - Floating toggle button
 * - Chat interface popup
 * - Quick action shortcuts
 */

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { AIChatInterface } from "./AIChatInterface";
import "./AIFloatingWidget.css";

interface AIFloatingWidgetProps {
  /** Initial question to ask when opened */
  initialQuestion?: string;
  /** Page context for better answers */
  pageContext?: {
    title: string;
    path: string;
    section?: string;
  };
}

export function AIFloatingWidget({
  initialQuestion,
  pageContext,
}: AIFloatingWidgetProps): React.ReactElement | null {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState(initialQuestion || "");
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Open with question from external source
  const openWithQuestion = useCallback((q: string) => {
    setQuestion(q);
    setIsOpen(true);
    setShowQuickActions(false);
  }, []);

  // Expose the openWithQuestion method via custom event for loose coupling
  useEffect(() => {
    const handleOpenAI = (e: CustomEvent<{ question: string }>) => {
      openWithQuestion(e.detail.question);
    };

    window.addEventListener("openAIAssistant", handleOpenAI as EventListener);
    return () => {
      window.removeEventListener(
        "openAIAssistant",
        handleOpenAI as EventListener,
      );
    };
  }, [openWithQuestion]);

  const handleClose = () => {
    setIsOpen(false);
    setQuestion("");
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "summarize":
        openWithQuestion("Summarize this page in a few bullet points");
        break;
      case "explain":
        openWithQuestion(`Explain the key concepts on this page`);
        break;
      case "related":
        openWithQuestion("What other documentation should I read after this?");
        break;
      default:
        setIsOpen(true);
    }
    setShowQuickActions(false);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Main Toggle Button */}
      <div
        className="ai-widget"
        onMouseEnter={() => !isOpen && setShowQuickActions(true)}
        onMouseLeave={() => setShowQuickActions(false)}
      >
        {/* Quick Actions Menu */}
        {showQuickActions && !isOpen && (
          <div className="ai-widget__quick-actions">
            <button
              className="ai-widget__quick-action"
              onClick={() => handleQuickAction("summarize")}
              title="Summarize this page"
            >
              <span>📋</span>
              <span>Summarize</span>
            </button>
            <button
              className="ai-widget__quick-action"
              onClick={() => handleQuickAction("explain")}
              title="Explain key concepts"
            >
              <span>💡</span>
              <span>Explain</span>
            </button>
            <button
              className="ai-widget__quick-action"
              onClick={() => handleQuickAction("related")}
              title="Related docs"
            >
              <span>📚</span>
              <span>Related</span>
            </button>
          </div>
        )}

        {/* Toggle Button */}
        <button
          className={`ai-widget__toggle ${isOpen ? "ai-widget__toggle--active" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
          aria-expanded={isOpen}
        >
          <span className="ai-widget__toggle-icon">{isOpen ? "✕" : "🤖"}</span>
          <span className="ai-widget__toggle-label">
            {isOpen ? "Close" : "AI"}
          </span>
          {!isOpen && <span className="ai-widget__toggle-shortcut">⌘K</span>}
        </button>
      </div>

      {/* Chat Interface */}
      {isOpen && (
        <AIChatInterface
          initialQuestion={question}
          pageContext={pageContext}
          mode="floating"
          onClose={handleClose}
        />
      )}
    </>
  );
}

export default AIFloatingWidget;
