// Short confirmations that something happened — "Logged Bench Press", "New
// best" — with an optional action, which is what makes Undo possible without a
// confirm-before-every-save dialog. Logging used to give no feedback at all
// beyond a list growing somewhere below the fold.
//
// One polite live region for the whole app, so a screen reader hears each
// toast once without it stealing focus from the form being filled in.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { toastVariants } from "../lib/motionVariants.js";

const ToastContext = createContext(null);
const MAX_VISIBLE = 3;
let nextId = 1;

function Toast({ toast, onDismiss }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.duration);
  const startedAt = useRef(Date.now());

  // The clock stops while the pointer or focus is on the toast. An Undo button
  // that disappears as you reach for it is worse than no Undo.
  useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();
    const id = setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      clearTimeout(id);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, toast.id, onDismiss]);

  return (
    <motion.li
      layout
      className={`toast tone-${toast.tone ?? "success"}`}
      variants={toastVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="toast-text">
        <strong>{toast.title}</strong>
        {toast.body && <span>{toast.body}</span>}
      </span>
      {toast.action && (
        <button
          type="button"
          className="toast-action"
          onClick={() => {
            toast.action.onClick();
            onDismiss(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" className="toast-close" aria-label="Dismiss" onClick={() => onDismiss(toast.id)}>
        ×
      </button>
    </motion.li>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  // A toast with a `key` replaces any other with the same key, so logging set
  // after set keeps one "Logged…" toast on screen rather than a growing stack
  // of them, each with an Undo for a different entry.
  const show = useCallback((toast) => {
    const id = nextId++;
    // Toasts with an action stay longer: reading it and deciding to press it
    // takes more than the two seconds a plain confirmation needs.
    const duration = toast.duration ?? (toast.action ? 6500 : 3200);
    setToasts((list) =>
      [...list.filter((t) => !toast.key || t.key !== toast.key), { ...toast, id, duration }].slice(-MAX_VISIBLE)
    );
    return id;
  }, []);

  // Drops every toast — used when a workout ends, so an Undo for an entry in
  // a workout that no longer exists can't be pressed afterwards.
  const clear = useCallback(() => setToasts([]), []);

  const api = useMemo(() => ({ show, dismiss, clear }), [show, dismiss, clear]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <ol className="toaster" aria-live="polite" aria-label="Notifications">
          <AnimatePresence initial={false}>
            {toasts.map((toast) => (
              <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
          </AnimatePresence>
        </ol>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast needs a ToastProvider above it");
  return api;
}
