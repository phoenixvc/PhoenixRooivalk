/**
 * AI Chat Interface Component
 *
 * A conversational chat UI for the documentation AI assistant.
 * Features:
 * - Chat-style message history
 * - Conversation memory for follow-up questions
 * - Typing indicators
 * - Source citations inline
 * - Quick suggested questions
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { aiService, AIError, RAGResponse } from "../../services/aiService";
import "./AIChatInterface.css";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: RAGResponse["sources"];
  confidence?: RAGResponse["confidence"];
  isLoading?: boolean;
}

interface AIChatInterfaceProps {
  /** Initial question to ask (optional) */
  initialQuestion?: string;
  /** Category filter for the documentation */
  category?: string;
  /** Whether to show inline (embedded) or floating mode */
  mode?: "inline" | "floating";
  /** Close handler for floating mode */
  onClose?: () => void;
  /** Page context for better answers */
  pageContext?: {
    title: string;
    path: string;
    section?: string;
  };
}

const SUGGESTED_QUESTIONS = [
  "What is Phoenix Rooivalk?",
  "How does the RKV targeting work?",
  "What are the deployment requirements?",
  "Explain the blockchain integration",
];

export function AIChatInterface({
  initialQuestion,
  category,
  mode = "floating",
  onClose,
  pageContext,
}: AIChatInterfaceProps): React.ReactElement {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState(initialQuestion || "");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Send initial question if provided
  useEffect(() => {
    if (initialQuestion && messages.length === 0) {
      // Using a ref to avoid including handleSendMessage in dependencies
      // which would cause infinite loops
      const sendInitialQuestion = async () => {
        await handleSendMessage(initialQuestion);
      };
      sendInitialQuestion();
    }
  }, [initialQuestion, messages.length, handleSendMessage]);

  const generateMessageId = () =>
    `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  const handleSendMessage = useCallback(
    async (questionText?: string) => {
      const question = questionText || inputValue.trim();
      if (!question || isLoading) return;

      setInputValue("");
      setIsLoading(true);

      // Add user message
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: "user",
        content: question,
        timestamp: new Date(),
      };

      // Add placeholder for assistant response
      const assistantPlaceholder: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages((prev: ChatMessage[]) => [
        ...prev,
        userMessage,
        assistantPlaceholder,
      ]);

      try {
        // Build conversation history for context
        const history = messages.map((msg: ChatMessage) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

        const response = await aiService.askDocumentation(question, {
          category: category || undefined,
          format: "detailed",
          history,
        });

        // Update the placeholder with actual response
        setMessages((prev: ChatMessage[]) =>
          prev.map((msg: ChatMessage) =>
            msg.id === assistantPlaceholder.id
              ? {
                  ...msg,
                  content: response.answer,
                  sources: response.sources,
                  confidence: response.confidence,
                  isLoading: false,
                }
              : msg,
          ),
        );
      } catch (err) {
        const errorMessage =
          err instanceof AIError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to get response. Please try again.";

        setMessages((prev: ChatMessage[]) =>
          prev.map((msg: ChatMessage) =>
            msg.id === assistantPlaceholder.id
              ? {
                  ...msg,
                  content: `⚠️ ${errorMessage}`,
                  isLoading: false,
                }
              : msg,
          ),
        );
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [inputValue, isLoading, messages, category],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const clearConversation = () => {
    setMessages([]);
    setInputValue("");
    inputRef.current?.focus();
  };

  const getConfidenceEmoji = (confidence?: string) => {
    switch (confidence) {
      case "high":
        return "🟢";
      case "medium":
        return "🟡";
      case "low":
        return "🟠";
      default:
        return "";
    }
  };

  if (!user) {
    return (
      <div className={`ai-chat ai-chat--${mode}`}>
        <div className="ai-chat__auth-required">
          <span className="ai-chat__auth-icon">🔒</span>
          <p>Sign in to use the AI assistant</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`ai-chat ai-chat--${mode}`}>
      {/* Header */}
      <div className="ai-chat__header">
        <div className="ai-chat__header-left">
          <span className="ai-chat__header-icon">🤖</span>
          <div className="ai-chat__header-text">
            <h3 className="ai-chat__title">Phoenix AI Assistant</h3>
            <span className="ai-chat__subtitle">
              {pageContext
                ? `Helping with: ${pageContext.title}`
                : "Ask anything about the documentation"}
            </span>
          </div>
        </div>
        <div className="ai-chat__header-actions">
          {messages.length > 0 && (
            <button
              className="ai-chat__clear-btn"
              onClick={clearConversation}
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              🗑️
            </button>
          )}
          {mode === "floating" && onClose && (
            <button
              className="ai-chat__close-btn"
              onClick={onClose}
              aria-label="Close chat"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="ai-chat__messages">
        {messages.length === 0 ? (
          <div className="ai-chat__welcome">
            <div className="ai-chat__welcome-icon">💬</div>
            <h4>How can I help you today?</h4>
            <p>
              Ask me anything about Phoenix Rooivalk documentation. I'll search
              through our docs and provide answers with sources.
            </p>

            {/* Suggested Questions */}
            <div className="ai-chat__suggestions">
              <span className="ai-chat__suggestions-label">Try asking:</span>
              <div className="ai-chat__suggestions-list">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    className="ai-chat__suggestion-btn"
                    onClick={() => handleSuggestedQuestion(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`ai-chat__message ai-chat__message--${message.role}`}
              >
                <div className="ai-chat__message-avatar">
                  {message.role === "user" ? "👤" : "🤖"}
                </div>
                <div className="ai-chat__message-content">
                  {message.isLoading ? (
                    <div className="ai-chat__typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    <>
                      <div
                        className="ai-chat__message-text"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(message.content),
                        }}
                      />

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="ai-chat__sources">
                          <span className="ai-chat__sources-label">
                            {getConfidenceEmoji(message.confidence)} Sources:
                          </span>
                          <ul className="ai-chat__sources-list">
                            {message.sources.map((source, idx) => (
                              <li key={idx} className="ai-chat__source">
                                <a
                                  href={source.docId}
                                  className="ai-chat__source-link"
                                >
                                  {source.title}
                                </a>
                                <span className="ai-chat__source-section">
                                  {source.section}
                                </span>
                                <span className="ai-chat__source-relevance">
                                  {Math.round(source.relevance * 100)}%
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}

                  <span className="ai-chat__message-time">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="ai-chat__input-area">
        <div className="ai-chat__input-container">
          <textarea
            ref={inputRef}
            className="ai-chat__input"
            placeholder="Ask a question about the documentation..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
            aria-label="Type your question"
          />
          <button
            className="ai-chat__send-btn"
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputValue.trim()}
            aria-label="Send message"
          >
            {isLoading ? (
              <span className="ai-chat__send-loading">⏳</span>
            ) : (
              <span className="ai-chat__send-icon">➤</span>
            )}
          </button>
        </div>
        <p className="ai-chat__input-hint">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

/**
 * Sanitize HTML to prevent XSS attacks
 * Only allows safe tags: strong, em, code, pre, ul, li, br
 */
function sanitizeHtml(html: string): string {
  // First, escape any HTML entities
  const escaped = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Then apply markdown formatting (which introduces our safe HTML)
  return formatMarkdown(escaped);
}

/**
 * Format message content with basic markdown
 * Note: This function expects escaped HTML input
 */
function formatMarkdown(text: string): string {
  return (
    text
      // Code blocks
      .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
      // Inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      // Lists
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
      // Line breaks
      .replace(/\n/g, "<br>")
  );
}

/**
 * Format timestamp for display
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default AIChatInterface;
