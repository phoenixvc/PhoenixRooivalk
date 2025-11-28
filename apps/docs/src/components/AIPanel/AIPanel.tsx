/**
 * AI Panel Component
 *
 * Provides AI-powered features:
 * - Competitor Research
 * - SWOT Analysis
 * - Market Insights
 * - Reading Recommendations
 * - Document Improvements
 * - Content Summary
 */

import React, { useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  aiService,
  AIError,
  KNOWN_COMPETITORS,
  SWOT_TOPICS,
  MARKET_TOPICS,
} from "../../services/aiService";
import "./AIPanel.css";

type AITab =
  | "ask"
  | "competitor"
  | "swot"
  | "market"
  | "recommendations"
  | "improvements"
  | "summary";

interface AITabConfig {
  id: AITab;
  label: string;
  icon: string;
  description: string;
}

const AI_TABS: AITabConfig[] = [
  {
    id: "ask",
    label: "Ask Docs",
    icon: "📖",
    description:
      "Ask questions about the documentation with AI-powered answers",
  },
  {
    id: "competitor",
    label: "Competitor Analysis",
    icon: "🎯",
    description: "Analyze competitors in the defense drone market",
  },
  {
    id: "swot",
    label: "SWOT Analysis",
    icon: "📊",
    description: "Generate strategic SWOT analysis",
  },
  {
    id: "market",
    label: "Market Insights",
    icon: "📈",
    description: "Get market intelligence and trends",
  },
  {
    id: "recommendations",
    label: "Reading Guide",
    icon: "📚",
    description: "AI-powered reading recommendations",
  },
  {
    id: "improvements",
    label: "Suggest Improvements",
    icon: "✏️",
    description: "Submit document improvement suggestions",
  },
  {
    id: "summary",
    label: "Summarize",
    icon: "📝",
    description: "Summarize page content",
  },
];

export function AIPanel(): React.ReactElement | null {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AITab>("ask");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // Form states
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [customCompetitor, setCustomCompetitor] = useState("");
  const [swotTopic, setSwotTopic] = useState("");
  const [swotContext, setSwotContext] = useState("");
  const [marketTopic, setMarketTopic] = useState("");
  const [summaryContent, setSummaryContent] = useState("");

  // Ask Docs states
  const [docQuestion, setDocQuestion] = useState("");
  const [docCategory, setDocCategory] = useState("");

  const handleError = useCallback((err: unknown) => {
    if (err instanceof AIError) {
      setError(err.message);
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("An unexpected error occurred");
    }
  }, []);

  const handleAskDocs = async () => {
    if (!docQuestion.trim()) {
      setError("Please enter a question");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await aiService.askDocumentation(docQuestion, {
        category: docCategory || undefined,
        format: "detailed",
      });

      // Format confidence emoji
      const confidenceEmoji =
        response.confidence === "high"
          ? "🟢"
          : response.confidence === "medium"
            ? "🟡"
            : "🟠";

      // Format sources
      const sourcesFormatted = response.sources
        .map(
          (s, i) =>
            `${i + 1}. **${s.title}** - ${s.section} _(${Math.round(s.relevance * 100)}% relevant)_`,
        )
        .join("\n");

      setResult(
        `## Answer\n\n${response.answer}\n\n---\n\n### Sources ${confidenceEmoji} ${response.confidence} confidence\n\n${sourcesFormatted}`,
      );
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompetitorAnalysis = async () => {
    if (competitors.length === 0) {
      setError("Please select at least one competitor");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await aiService.analyzeCompetitors(competitors);
      setResult(response.analysis);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSWOTAnalysis = async () => {
    if (!swotTopic.trim()) {
      setError("Please enter a topic for SWOT analysis");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await aiService.generateSWOT(swotTopic, swotContext);
      setResult(response.swot);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarketInsights = async () => {
    if (!marketTopic.trim()) {
      setError("Please enter a market topic");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await aiService.getMarketInsights(marketTopic);
      setResult(response.insights);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "";
      const response = await aiService.getReadingRecommendations(currentPath);

      if (response.message) {
        setResult(response.message);
      } else if (response.recommendations.length > 0) {
        const formatted = response.recommendations
          .map(
            (rec, i) =>
              `### ${i + 1}. ${rec.docId}\n**Why:** ${rec.reason}\n**Relevance:** ${Math.round(rec.relevanceScore * 100)}%`,
          )
          .join("\n\n");
        setResult(
          `## Recommended Reading\n\n${formatted}\n\n---\n\n**Learning Path:** ${response.learningPath || "Continue exploring"}`,
        );
      } else {
        setResult(
          "No recommendations available yet. Keep reading to get personalized suggestions!",
        );
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentImprovement = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get current page content
      const docContent =
        document.querySelector("article")?.textContent ||
        document.querySelector("main")?.textContent ||
        "";

      if (docContent.length < 100) {
        setError("Not enough content on this page to analyze");
        setIsLoading(false);
        return;
      }

      const docTitle = document.title || "Untitled";
      const docId =
        typeof window !== "undefined" ? window.location.pathname : "unknown";

      const response = await aiService.suggestDocumentImprovements(
        docId,
        docTitle,
        docContent,
      );

      setResult(
        `## Improvement Suggestions\n\n${response.suggestions}\n\n---\n\n✅ ${response.message}\n\n*Suggestion ID: ${response.suggestionId}*`,
      );
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let content = summaryContent;

      // If no custom content, get current page content
      if (!content.trim()) {
        content =
          document.querySelector("article")?.textContent ||
          document.querySelector("main")?.textContent ||
          "";
      }

      if (content.length < 200) {
        setError("Not enough content to summarize (minimum 200 characters)");
        setIsLoading(false);
        return;
      }

      const response = await aiService.summarizeContent(content);
      setResult(`## Summary\n\n${response.summary}`);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCompetitor = (competitor: string) => {
    setCompetitors((prev) =>
      prev.includes(competitor)
        ? prev.filter((c) => c !== competitor)
        : [...prev, competitor],
    );
  };

  const addCustomCompetitor = () => {
    if (
      customCompetitor.trim() &&
      !competitors.includes(customCompetitor.trim())
    ) {
      setCompetitors((prev) => [...prev, customCompetitor.trim()]);
      setCustomCompetitor("");
    }
  };

  const selectCompetitorPreset = (preset: keyof typeof KNOWN_COMPETITORS) => {
    setCompetitors(KNOWN_COMPETITORS[preset]);
  };

  if (!user) {
    return null; // Only show for authenticated users
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        className="ai-panel-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="AI Assistant"
        aria-label="Toggle AI Panel"
      >
        <span className="ai-panel-toggle-icon">🤖</span>
        <span className="ai-panel-toggle-text">AI</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <h3>AI Assistant</h3>
            <button
              className="ai-panel-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI Panel"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="ai-panel-tabs">
            {AI_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`ai-panel-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setResult(null);
                  setError(null);
                }}
                title={tab.description}
              >
                <span className="ai-tab-icon">{tab.icon}</span>
                <span className="ai-tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="ai-panel-content">
            {/* Ask Docs Tab */}
            {activeTab === "ask" && (
              <div className="ai-tab-content">
                <p className="ai-tab-description">
                  Ask questions about Phoenix Rooivalk documentation. AI will
                  search relevant sources and provide answers with citations.
                </p>

                <div className="ai-category-select">
                  <label htmlFor="doc-category">Filter by category:</label>
                  <select
                    id="doc-category"
                    className="ai-select"
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                  >
                    <option value="">All Documentation</option>
                    <option value="technical">Technical</option>
                    <option value="business">Business</option>
                    <option value="operations">Operations</option>
                    <option value="executive">Executive</option>
                    <option value="legal">Legal</option>
                    <option value="research">Research</option>
                  </select>
                </div>

                <textarea
                  className="ai-textarea"
                  placeholder="e.g., How does the RKV targeting system work?"
                  value={docQuestion}
                  onChange={(e) => setDocQuestion(e.target.value)}
                  rows={3}
                  aria-label="Question about documentation"
                />

                <button
                  className="ai-submit-btn"
                  onClick={handleAskDocs}
                  disabled={isLoading || !docQuestion.trim()}
                >
                  {isLoading ? "Searching..." : "Ask Documentation"}
                </button>
              </div>
            )}

            {/* Competitor Analysis Tab */}
            {activeTab === "competitor" && (
              <div className="ai-tab-content">
                <p className="ai-tab-description">
                  Analyze competitors in the counter-drone defense market.
                </p>

                <div className="ai-presets">
                  <span>Quick select:</span>
                  <button onClick={() => selectCompetitorPreset("kinetic")}>
                    Kinetic
                  </button>
                  <button onClick={() => selectCompetitorPreset("electronic")}>
                    Electronic
                  </button>
                  <button onClick={() => selectCompetitorPreset("laser")}>
                    Laser
                  </button>
                  <button
                    onClick={() => selectCompetitorPreset("comprehensive")}
                  >
                    Major Players
                  </button>
                </div>

                <div className="ai-competitor-list">
                  {[
                    ...new Set([...Object.values(KNOWN_COMPETITORS).flat()]),
                  ].map((comp) => (
                    <label key={comp} className="ai-checkbox">
                      <input
                        type="checkbox"
                        checked={competitors.includes(comp)}
                        onChange={() => toggleCompetitor(comp)}
                      />
                      {comp}
                    </label>
                  ))}
                </div>

                <div className="ai-custom-input">
                  <input
                    type="text"
                    placeholder="Add custom competitor..."
                    value={customCompetitor}
                    onChange={(e) => setCustomCompetitor(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && addCustomCompetitor()
                    }
                  />
                  <button onClick={addCustomCompetitor}>Add</button>
                </div>

                {competitors.length > 0 && (
                  <div className="ai-selected">
                    Selected: {competitors.join(", ")}
                  </div>
                )}

                <button
                  className="ai-submit-btn"
                  onClick={handleCompetitorAnalysis}
                  disabled={isLoading || competitors.length === 0}
                >
                  {isLoading ? "Analyzing..." : "Analyze Competitors"}
                </button>
              </div>
            )}

            {/* SWOT Analysis Tab */}
            {activeTab === "swot" && (
              <div className="ai-tab-content">
                <p className="ai-tab-description">
                  Generate strategic SWOT analysis for any topic.
                </p>

                <div className="ai-presets">
                  <span>Quick topics:</span>
                  {Object.entries(SWOT_TOPICS).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setSwotTopic(value)}
                      className={swotTopic === value ? "active" : ""}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  className="ai-input"
                  placeholder="Enter topic for SWOT analysis..."
                  value={swotTopic}
                  onChange={(e) => setSwotTopic(e.target.value)}
                />

                <textarea
                  className="ai-textarea"
                  placeholder="Additional context (optional)..."
                  value={swotContext}
                  onChange={(e) => setSwotContext(e.target.value)}
                  rows={3}
                />

                <button
                  className="ai-submit-btn"
                  onClick={handleSWOTAnalysis}
                  disabled={isLoading || !swotTopic.trim()}
                >
                  {isLoading ? "Generating..." : "Generate SWOT"}
                </button>
              </div>
            )}

            {/* Market Insights Tab */}
            {activeTab === "market" && (
              <div className="ai-tab-content">
                <p className="ai-tab-description">
                  Get market intelligence and industry insights.
                </p>

                <div className="ai-presets">
                  <span>Topics:</span>
                  {Object.entries(MARKET_TOPICS).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setMarketTopic(value)}
                      className={marketTopic === value ? "active" : ""}
                    >
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (s) => s.toUpperCase())}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  className="ai-input"
                  placeholder="Enter market topic..."
                  value={marketTopic}
                  onChange={(e) => setMarketTopic(e.target.value)}
                />

                <button
                  className="ai-submit-btn"
                  onClick={handleMarketInsights}
                  disabled={isLoading || !marketTopic.trim()}
                >
                  {isLoading ? "Researching..." : "Get Market Insights"}
                </button>
              </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === "recommendations" && (
              <div className="ai-tab-content">
                <p className="ai-tab-description">
                  Get personalized reading recommendations based on your
                  progress.
                </p>

                <button
                  className="ai-submit-btn"
                  onClick={handleRecommendations}
                  disabled={isLoading}
                >
                  {isLoading ? "Analyzing..." : "Get Recommendations"}
                </button>
              </div>
            )}

            {/* Document Improvements Tab */}
            {activeTab === "improvements" && (
              <div className="ai-tab-content">
                <p className="ai-tab-description">
                  AI will analyze this page and suggest improvements. Your
                  suggestions will be submitted for admin review.
                </p>

                <button
                  className="ai-submit-btn"
                  onClick={handleDocumentImprovement}
                  disabled={isLoading}
                >
                  {isLoading ? "Analyzing..." : "Suggest Improvements"}
                </button>
              </div>
            )}

            {/* Summary Tab */}
            {activeTab === "summary" && (
              <div className="ai-tab-content">
                <p className="ai-tab-description">
                  Summarize the current page or paste custom content.
                </p>

                <textarea
                  className="ai-textarea"
                  placeholder="Paste content to summarize (or leave empty to summarize current page)..."
                  value={summaryContent}
                  onChange={(e) => setSummaryContent(e.target.value)}
                  rows={5}
                />

                <button
                  className="ai-submit-btn"
                  onClick={handleSummarize}
                  disabled={isLoading}
                >
                  {isLoading ? "Summarizing..." : "Summarize"}
                </button>
              </div>
            )}

            {/* Error Display */}
            {error && <div className="ai-error">{error}</div>}

            {/* Result Display */}
            {result && (
              <div className="ai-result">
                <div className="ai-result-header">
                  <h4>Result</h4>
                  <button
                    className="ai-copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(result);
                    }}
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
                <div
                  className="ai-result-content"
                  dangerouslySetInnerHTML={{
                    __html: formatMarkdown(result),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Simple markdown formatter
 */
function formatMarkdown(text: string): string {
  return (
    text
      // Headers
      .replace(/^### (.*$)/gm, "<h4>$1</h4>")
      .replace(/^## (.*$)/gm, "<h3>$1</h3>")
      .replace(/^# (.*$)/gm, "<h2>$1</h2>")
      // Bold
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Code blocks
      .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
      // Inline code
      .replace(/`(.*?)`/g, "<code>$1</code>")
      // Lists
      .replace(/^- (.*$)/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
      // Horizontal rule
      .replace(/^---$/gm, "<hr />")
      // Paragraphs
      .replace(/\n\n/g, "</p><p>")
      .replace(/^(.+)$/gm, (match) => {
        if (
          match.startsWith("<") ||
          match.startsWith("</") ||
          match.trim() === ""
        ) {
          return match;
        }
        return match;
      })
  );
}

export default AIPanel;
