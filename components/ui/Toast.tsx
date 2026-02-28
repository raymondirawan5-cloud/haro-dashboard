"use client";

import * as React from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const showToast = React.useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div ref={containerRef} className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [isExiting, setIsExiting] = React.useState(false);

  const handleDismiss = React.useCallback(() => {
    setIsExiting(true);
    setTimeout(onDismiss, 200);
  }, [onDismiss]);

  const icon = toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "◆";

  return (
    <div className={`toast toast-${toast.type} ${isExiting ? "toast-exit" : ""}`} role="alert">
      <span style={{ fontSize: 14, opacity: 0.9 }}>{icon}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={handleDismiss}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
          padding: "2px 6px",
          borderRadius: "4px",
          fontSize: 14,
          lineHeight: 1,
        }}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
