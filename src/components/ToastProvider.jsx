"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext) || {
    success: () => {},
    error: () => {},
    info: () => {},
    warn: () => {},
  };
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(1);

  const remove = useCallback((id) => {
    setToasts((arr) => arr.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((payload) => {
    const id = idRef.current++;
    const t = { id, timeout: 3000, type: "info", message: "", ...payload };
    setToasts((arr) => [...arr, t]);
    if (t.timeout > 0) {
      setTimeout(() => remove(id), t.timeout);
    }
  }, [remove]);

  const api = useMemo(() => ({
    success: (message) => push({ type: "success", message }),
    error: (message) => push({ type: "error", message, timeout: 4000 }),
    info: (message) => push({ type: "info", message }),
    warn: (message) => push({ type: "warn", message, timeout: 4000 }),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-ctr">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <div className="toast-icon" aria-hidden>
              {t.type === "success" ? "✓" : t.type === "error" ? "✕" : t.type === "warn" ? "⚠" : "ℹ"}
            </div>
            <div className="toast-msg">{t.message}</div>
            <button className="toast-close" onClick={() => remove(t.id)} aria-label="Cerrar">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
