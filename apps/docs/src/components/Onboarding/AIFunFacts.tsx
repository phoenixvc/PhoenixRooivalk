/**
 * AI Fun Facts Component
 *
 * Displays AI-generated fun facts about the user based on their profile.
 * Shows loading state while researching, allows edit/delete of individual facts.
 */

import React, { useState, useEffect, useCallback } from "react";
import { aiService, AIError, FunFactsResult } from "../../services/aiService";
import { UserProfileDetails } from "./ProfileCompletion";
import "./AIFunFacts.css";

interface FunFact {
  id: string;
  fact: string;
  category: "professional" | "education" | "achievement" | "interest" | "other";
  isEditing?: boolean;
}

interface AIFunFactsProps {
  userProfile: UserProfileDetails;
  onComplete: (facts: FunFact[]) => void;
  onSkip: () => void;
}

const CATEGORY_ICONS: Record<FunFact["category"], string> = {
  professional: "💼",
  education: "🎓",
  achievement: "🏆",
  interest: "💡",
  other: "✨",
};

const CATEGORY_LABELS: Record<FunFact["category"], string> = {
  professional: "Professional",
  education: "Education",
  achievement: "Achievement",
  interest: "Interest",
  other: "Fun Fact",
};

// Loading messages to cycle through
const LOADING_MESSAGES = [
  "Researching your background...",
  "Finding interesting facts...",
  "Analyzing your professional journey...",
  "Discovering achievements...",
  "Almost there...",
];

export function AIFunFacts({
  userProfile,
  onComplete,
  onSkip,
}: AIFunFactsProps): React.ReactElement {
  const [facts, setFacts] = useState<FunFact[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Cycle through loading messages
  useEffect(() => {
    if (!isLoading) return;

    let messageIndex = 0;
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[messageIndex]);
    }, 2500);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Fetch fun facts from AI
  useEffect(() => {
    let isMounted = true;

    async function fetchFunFacts() {
      try {
        setIsLoading(true);
        setError(null);

        const result: FunFactsResult = await aiService.researchPerson(
          userProfile.firstName,
          userProfile.lastName,
          userProfile.linkedIn,
        );

        if (isMounted) {
          setFacts(
            result.facts.map((f) => ({
              ...f,
              isEditing: false,
            })),
          );
          setSummary(result.summary);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage =
            err instanceof AIError
              ? err.message
              : err instanceof Error
                ? err.message
                : "Failed to research your profile. Please try again.";
          setError(errorMessage);

          // Provide fallback facts if AI fails
          setFacts([
            {
              id: "fallback-1",
              fact: `${userProfile.firstName} is joining the Phoenix Rooivalk documentation team.`,
              category: "professional",
            },
            {
              id: "fallback-2",
              fact: "Ready to explore counter-drone technology documentation.",
              category: "interest",
            },
          ]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchFunFacts();

    return () => {
      isMounted = false;
    };
  }, [userProfile]);

  const handleEdit = useCallback((fact: FunFact) => {
    setEditingId(fact.id);
    setEditText(fact.fact);
  }, []);

  const handleSaveEdit = useCallback((id: string) => {
    if (!editText.trim()) return;

    setFacts((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, fact: editText.trim(), isEditing: false } : f,
      ),
    );
    setEditingId(null);
    setEditText("");
  }, [editText]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText("");
  }, []);

  const handleDelete = useCallback((id: string) => {
    setFacts((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleComplete = useCallback(() => {
    onComplete(facts);
  }, [facts, onComplete]);

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit(id);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fun-facts">
        <div className="fun-facts-header">
          <span className="fun-facts-icon">🔍</span>
          <h2 className="fun-facts-title">Learning About You</h2>
          <p className="fun-facts-subtitle">{loadingMessage}</p>
        </div>

        <div className="fun-facts-loading">
          <div className="fun-facts-loader">
            <div className="fun-facts-loader-spinner" />
          </div>

          {/* Skeleton placeholders */}
          <div className="fun-facts-skeleton">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="fun-facts-skeleton-item">
                <div className="fun-facts-skeleton-icon" />
                <div className="fun-facts-skeleton-content">
                  <div className="fun-facts-skeleton-line fun-facts-skeleton-line--short" />
                  <div className="fun-facts-skeleton-line" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="fun-facts-skip"
          onClick={onSkip}
        >
          Skip this step
        </button>
      </div>
    );
  }

  return (
    <div className="fun-facts">
      <div className="fun-facts-header">
        <span className="fun-facts-icon">✨</span>
        <h2 className="fun-facts-title">
          Fun Facts About You, {userProfile.firstName}!
        </h2>
        <p className="fun-facts-subtitle">
          {summary ||
            "Here's what we discovered about you. Feel free to edit or remove any facts."}
        </p>
      </div>

      {error && (
        <div className="fun-facts-error">
          <span className="fun-facts-error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="fun-facts-list">
        {facts.length === 0 ? (
          <div className="fun-facts-empty">
            <span className="fun-facts-empty-icon">🤷</span>
            <p>No facts to display. You can continue without them.</p>
          </div>
        ) : (
          facts.map((fact) => (
            <div
              key={fact.id}
              className={`fun-facts-item ${editingId === fact.id ? "editing" : ""}`}
            >
              <div className="fun-facts-item-icon">
                {CATEGORY_ICONS[fact.category]}
              </div>

              <div className="fun-facts-item-content">
                <span className="fun-facts-item-category">
                  {CATEGORY_LABELS[fact.category]}
                </span>

                {editingId === fact.id ? (
                  <div className="fun-facts-item-edit">
                    <textarea
                      className="fun-facts-item-textarea"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, fact.id)}
                      autoFocus
                      rows={2}
                    />
                    <div className="fun-facts-item-edit-actions">
                      <button
                        type="button"
                        className="fun-facts-item-save"
                        onClick={() => handleSaveEdit(fact.id)}
                        disabled={!editText.trim()}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="fun-facts-item-cancel"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="fun-facts-item-text">{fact.fact}</p>
                )}
              </div>

              {editingId !== fact.id && (
                <div className="fun-facts-item-actions">
                  <button
                    type="button"
                    className="fun-facts-item-action fun-facts-item-action--edit"
                    onClick={() => handleEdit(fact)}
                    aria-label="Edit fact"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="fun-facts-item-action fun-facts-item-action--delete"
                    onClick={() => handleDelete(fact.id)}
                    aria-label="Delete fact"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="fun-facts-footer">
        <button
          type="button"
          className="fun-facts-skip"
          onClick={onSkip}
        >
          Skip
        </button>
        <button
          type="button"
          className="fun-facts-continue"
          onClick={handleComplete}
        >
          {facts.length > 0 ? "Looks Good!" : "Continue"}
        </button>
      </div>

      <p className="fun-facts-note">
        These facts help personalize your experience. They're stored privately.
      </p>
    </div>
  );
}

export default AIFunFacts;
