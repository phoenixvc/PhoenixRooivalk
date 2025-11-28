/**
 * Toast Container Component
 *
 * Renders all active toast notifications.
 * Should be placed at the root of the app.
 */

import React from "react";
import { Toast, ToastProps } from "./Toast";
import "./Toast.css";

interface ToastContainerProps {
  toasts: Omit<ToastProps, "onClose">[];
  onClose: (id: string) => void;
}

export function ToastContainer({
  toasts,
  onClose,
}: ToastContainerProps): React.ReactElement | null {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container" aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}

export default ToastContainer;
