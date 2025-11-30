/**
 * Toast Context
 *
 * Provides a global toast notification system.
 * Use the useToast hook to show notifications from any component.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { ToastContainer } from "../components/Toast/ToastContainer";
import type { ToastType } from "../components/Toast/Toast";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  /** Show a toast notification */
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  /** Show a success toast */
  success: (message: string, duration?: number) => void;
  /** Show an error toast */
  error: (message: string, duration?: number) => void;
  /** Show a warning toast */
  warning: (message: string, duration?: number) => void;
  /** Show an info toast */
  info: (message: string, duration?: number) => void;
  /** Remove a specific toast */
  removeToast: (id: string) => void;
  /** Remove all toasts */
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastIdCounter = 0;

function generateToastId(): string {
  return `toast-${Date.now()}-${++toastIdCounter}`;
}

interface ToastProviderProps {
  children: React.ReactNode;
  /** Maximum number of toasts to show at once */
  maxToasts?: number;
}

export function ToastProvider({
  children,
  maxToasts = 5,
}: ToastProviderProps): React.ReactElement {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration?: number) => {
      const id = generateToastId();
      const newToast: ToastItem = { id, message, type, duration };

      setToasts((prev) => {
        // Remove oldest toasts if we exceed maxToasts
        const updated = [...prev, newToast];
        if (updated.length > maxToasts) {
          return updated.slice(-maxToasts);
        }
        return updated;
      });

      return id;
    },
    [maxToasts],
  );

  const success = useCallback(
    (message: string, duration?: number) =>
      showToast(message, "success", duration),
    [showToast],
  );

  const error = useCallback(
    (message: string, duration?: number) =>
      showToast(message, "error", duration ?? 7000),
    [showToast],
  );

  const warning = useCallback(
    (message: string, duration?: number) =>
      showToast(message, "warning", duration ?? 6000),
    [showToast],
  );

  const info = useCallback(
    (message: string, duration?: number) =>
      showToast(message, "info", duration),
    [showToast],
  );

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      success,
      error,
      warning,
      info,
      removeToast,
      clearAll,
    }),
    [showToast, success, error, warning, info, removeToast, clearAll],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Hook to access toast notifications
 *
 * @example
 * const toast = useToast();
 * toast.success("Changes saved!");
 * toast.error("Failed to save");
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
