// Modal surfaces: centred dialogs (confirmations, the workout summary) and
// sheets (Naru). One implementation so every modal in the app traps focus,
// closes on Escape, locks the page behind it and hands focus back to whatever
// opened it — the summary and the planner used to do none of that.
//
// Rendered through a portal into <body>. Pages animate with transforms, and a
// transformed ancestor turns `position: fixed` into "fixed to that ancestor",
// which is why the summary used to have to be rendered outside <main> by hand.
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { backdropVariants, dialogVariants, sheetVariants } from "../lib/motionVariants.js";
import { Button, Field } from "./primitives.jsx";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Nested modals (a confirm opened from a sheet) each lock scroll; only the
// last one out should unlock it.
let openCount = 0;

function DialogSurface({ onClose, title, description, children, variant, className, initialFocus, hideClose }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  // Phones get the sheet from the bottom, where a thumb can reach it.
  const compact = useMediaQuery("(max-width: 600px)");
  const edge = variant === "sheet" && compact ? "bottom" : "right";

  useEffect(() => {
    const previous = document.activeElement;
    openCount += 1;
    document.documentElement.classList.add("modal-open");

    // After paint, so the element exists and the entrance has started.
    const frame = requestAnimationFrame(() => {
      const target =
        initialFocus?.current ||
        panelRef.current?.querySelector("[data-autofocus]") ||
        panelRef.current;
      target?.focus({ preventScroll: true });
    });

    return () => {
      cancelAnimationFrame(frame);
      openCount -= 1;
      if (openCount === 0) document.documentElement.classList.remove("modal-open");
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [initialFocus]);

  function onKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const nodes = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
    if (!nodes.length) {
      event.preventDefault();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const sheet = variant === "sheet";

  return (
    <div className={`dialog-root ${sheet ? `sheet-root edge-${edge}` : ""}`} onKeyDown={onKeyDown}>
      <motion.div
        className="dialog-backdrop"
        variants={backdropVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        className={`dialog-panel ${sheet ? "sheet" : ""} ${className ?? ""}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        custom={edge}
        variants={sheet ? sheetVariants : dialogVariants}
        initial="hidden"
        animate="show"
        exit="exit"
      >
        {(title || !hideClose) && (
          <div className="dialog-head">
            <div>
              {title && (
                <h2 id={titleId} className="dialog-title">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="dialog-desc">
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <button type="button" className="icon-button dialog-close" onClick={onClose} aria-label="Close">
                ×
              </button>
            )}
          </div>
        )}
        {children}
      </motion.div>
    </div>
  );
}

export function Dialog({ open, ...props }) {
  return createPortal(<AnimatePresence>{open && <DialogSurface key="dialog" {...props} />}</AnimatePresence>, document.body);
}

// "Are you sure?" with the consequence spelled out. `confirmText` makes the
// user type something (a profile's name) before a destructive action unlocks —
// reserved for the one action that deletes months of history at once.
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone,
  confirmText,
  onConfirm,
  onCancel,
}) {
  const [typed, setTyped] = useState("");
  const cancelRef = useRef(null);
  const locked = Boolean(confirmText) && typed.trim() !== confirmText.trim();

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={body}
      className="confirm-dialog"
      // Destructive confirms open on Cancel, so a reflexive Enter backs out.
      initialFocus={confirmText ? undefined : tone === "danger" ? cancelRef : undefined}
      hideClose
    >
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!locked) onConfirm();
        }}
      >
        {confirmText && (
          <Field label={`Type “${confirmText}” to confirm`}>
            {(props) => (
              <input
                {...props}
                data-autofocus
                value={typed}
                autoComplete="off"
                spellCheck="false"
                onChange={(event) => setTyped(event.target.value)}
              />
            )}
          </Field>
        )}
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onCancel} ref={cancelRef}>
            {cancelLabel}
          </Button>
          <Button type="submit" variant={tone === "danger" ? "danger" : undefined} disabled={locked}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
