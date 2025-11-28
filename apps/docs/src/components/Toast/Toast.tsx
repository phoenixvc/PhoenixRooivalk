/**
 * Toast Notification Component
 *
 * Displays temporary notification messages to users for feedback on actions.
 * Supports success, error, warning, and info variants.
 */

import React, { useEffect, useState } from "react";
import "./Toast.css";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

export function Toast({
  id,
  message,
  type,
  duration = 5000,
  onClose,
}: ToastProps): React.ReactElement {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(id), 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <div
      className={`toast toast--${type} ${isExiting ? "toast--exiting" : ""}`}
      role="alert"
      aria-live="polite"
    >
      <span className="toast__icon" aria-hidden="true">
        {ICONS[type]}
      </span>
      <span className="toast__message">{message}</span>
      <button
        className="toast__close"
        onClick={handleClose}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

export default Toast;
