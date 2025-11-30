import * as React from "react";
import { useState } from "react";

interface FeedbackData {
  helpful: boolean | null;
  comment?: string;
  docId: string;
  timestamp: string;
}

const FEEDBACK_STORAGE_KEY = "phoenix-docs-feedback";

export function useFeedback(docId: string) {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (stored) {
      const allFeedback = JSON.parse(stored);
      if (allFeedback[docId]) {
        setFeedback(allFeedback[docId]);
        setSubmitted(true);
      }
    }
  }, [docId]);

  const submitFeedback = (helpful: boolean, comment?: string) => {
    const newFeedback: FeedbackData = {
      helpful,
      comment,
      docId,
      timestamp: new Date().toISOString(),
    };

    const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    const allFeedback = stored ? JSON.parse(stored) : {};
    allFeedback[docId] = newFeedback;

    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(allFeedback));
    setFeedback(newFeedback);
    setSubmitted(true);

    // Could send to analytics here
    console.log("Feedback submitted:", newFeedback);
  };

  return { feedback, submitted, submitFeedback };
}

interface FeedbackWidgetProps {
  docId: string;
}

export default function FeedbackWidget({
  docId,
}: FeedbackWidgetProps): React.ReactElement {
  const { submitted, submitFeedback } = useFeedback(docId);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [selectedRating, setSelectedRating] = useState<boolean | null>(null);

  const handleRating = (helpful: boolean) => {
    setSelectedRating(helpful);
    if (!helpful) {
      setShowComment(true);
    } else {
      submitFeedback(helpful);
    }
  };

  const handleSubmitWithComment = () => {
    if (selectedRating !== null) {
      submitFeedback(selectedRating, comment);
      setShowComment(false);
    }
  };

  if (submitted) {
    return (
      <div className="feedback-widget feedback-widget--submitted">
        <div className="feedback-thanks">
          <span className="feedback-thanks-icon">✓</span>
          <span className="feedback-thanks-text">
            Thanks for your feedback!
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-widget">
      <div className="feedback-question">
        <span className="feedback-question-text">Was this page helpful?</span>
        <div className="feedback-buttons">
          <button
            className={`feedback-btn feedback-btn--yes ${selectedRating === true ? "feedback-btn--selected" : ""}`}
            onClick={() => handleRating(true)}
            aria-label="Yes, this page was helpful"
          >
            <span className="feedback-btn-icon">👍</span>
            <span className="feedback-btn-label">Yes</span>
          </button>
          <button
            className={`feedback-btn feedback-btn--no ${selectedRating === false ? "feedback-btn--selected" : ""}`}
            onClick={() => handleRating(false)}
            aria-label="No, this page was not helpful"
          >
            <span className="feedback-btn-icon">👎</span>
            <span className="feedback-btn-label">No</span>
          </button>
        </div>
      </div>

      {showComment && (
        <div className="feedback-comment">
          <label
            htmlFor="feedback-comment-input"
            className="feedback-comment-label"
          >
            How can we improve this page?
          </label>
          <textarea
            id="feedback-comment-input"
            className="feedback-comment-input"
            placeholder="Your feedback helps us improve..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <button
            className="feedback-submit-btn"
            onClick={handleSubmitWithComment}
          >
            Submit Feedback
          </button>
        </div>
      )}
    </div>
  );
}
