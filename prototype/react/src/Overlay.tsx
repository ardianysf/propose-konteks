import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./Button";
import { cx } from "./cx";

/* Overlay grammar (DESIGN.md › Overlays), one rule for every screen:
   Drawer = look at or review an object without leaving the page; stackable.
   Modal  = fill in a form or a step and submit it; a multi-step form stays in one modal.
   Dialog = confirm one consequence (approve with cost, revoke, delete).
   Escape and the close button close the top layer only; focus is trapped in the top layer
   and returns to whatever opened it. A stacked layer's scrim is transparent, so the page never darkens twice. */

type Layer = { el: HTMLElement; close: () => void };
const stack: Layer[] = [];

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';

function onKey(e: KeyboardEvent) {
  const top = stack[stack.length - 1];
  if (!top || e.defaultPrevented) return;
  if (e.key === "Escape") { e.preventDefault(); top.close(); return; }
  if (e.key !== "Tab") return;
  const f = [...top.el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(x => x.offsetParent !== null);
  if (!f.length) { e.preventDefault(); top.el.focus(); return; }
  const first = f[0], last = f[f.length - 1], a = document.activeElement;
  if (e.shiftKey && (a === first || a === top.el)) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
}

/** Keeps a short exit animation: the element stays mounted for `ms` after `open` turns false. */
function usePresence(open: boolean, ms = 150) {
  const [mounted, setMounted] = React.useState(open);
  React.useEffect(() => {
    if (open) { setMounted(true); return; }
    const t = setTimeout(() => setMounted(false), ms);
    return () => clearTimeout(t);
  }, [open, ms]);
  return { mounted: open || mounted, leaving: !open && mounted };
}

/** Registers an open layer: Escape and Tab go to the top layer only; focus returns to the opener on close. */
function useLayer(open: boolean, ref: React.RefObject<HTMLElement>, onClose: () => void) {
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  const [depth, setDepth] = React.useState(0);
  React.useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const opener = document.activeElement as HTMLElement | null;
    const layer: Layer = { el: ref.current, close: () => closeRef.current() };
    setDepth(stack.length);
    stack.push(layer);
    if (stack.length === 1) document.addEventListener("keydown", onKey);
    /* A child with autoFocus has already taken focus; otherwise focus [data-autofocus] or the layer itself. */
    if (!ref.current.contains(document.activeElement)) {
      (ref.current.querySelector<HTMLElement>("[data-autofocus]") ?? ref.current).focus({ preventScroll: true });
    }
    return () => {
      const i = stack.indexOf(layer);
      if (i >= 0) stack.splice(i, 1);
      if (!stack.length) document.removeEventListener("keydown", onKey);
      /* After React's commit: React restores focus to the element focused before the commit, which is this layer. */
      setTimeout(() => { if (opener?.isConnected) opener.focus({ preventScroll: true }); });
    };
  }, [open, ref]);
  return depth;
}

function Scrim({ stacked, leaving, onClick }: { stacked: boolean; leaving: boolean; onClick: () => void }) {
  return (
    <div
      aria-hidden
      onClick={onClick}
      className={cx(
        "fixed inset-0 z-[70]",
        stacked ? "bg-transparent" : "bg-[color:var(--scrim)]",
        leaving ? "pointer-events-none animate-[kx-fade-out_.15s_ease-in_forwards]" : "animate-[kx-fade_.2s]",
      )}
    />
  );
}

interface LayerBase {
  open: boolean;
  onClose: () => void;
  /** Same words as the button that opened it. */
  title: string;
  /** One line under the title, e.g. "Step 1 of 2 · Choose a provider". */
  sub?: React.ReactNode;
  /** Buttons for the footer; the primary goes last (right). */
  footer?: React.ReactNode;
  /** 760px instead of 560px, for content that needs room (diffs, maps). */
  wide?: boolean;
  children?: React.ReactNode;
}

const closeBtn = (onClose: () => void) => (
  <Button variant="ghost" size="sm" iconOnly aria-label="Close" onClick={onClose}>
    <X strokeWidth={1.75} />
  </Button>
);

/** Drawer: review or inspect without leaving the page. Opens from the right; can stack. */
export function Drawer({ open, onClose, title, sub, footer, wide, children }: LayerBase) {
  const ref = React.useRef<HTMLElement>(null);
  const { mounted, leaving } = usePresence(open);
  const depth = useLayer(open, ref, onClose);
  if (!mounted) return null;
  return createPortal(
    <>
      <Scrim stacked={depth > 0} leaving={leaving} onClick={onClose} />
      <aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cx(
          "fixed inset-y-0 right-0 z-[71] grid grid-rows-[auto_1fr_auto] border-l border-app-border bg-app-card shadow-lg outline-none",
          wide ? "w-[min(760px,100vw)]" : "w-[min(560px,100vw)]",
          leaving ? "pointer-events-none animate-[kx-drawer-out_.15s_ease-in_forwards]" : "animate-[kx-drawer-in_.28s_cubic-bezier(.16,1,.3,1)]",
        )}
      >
        <header className="flex min-h-[52px] items-center gap-2 border-b border-app-border px-4 py-3">
          <div className="grid min-w-0 flex-1 gap-0.5">
            <h2 className="text-base font-semibold text-app-text">{title}</h2>
            {sub && <p className="text-xs text-app-text-tertiary">{sub}</p>}
          </div>
          {closeBtn(onClose)}
        </header>
        <div className="grid content-start gap-4 overflow-auto p-4 text-sm text-app-text">{children}</div>
        {footer ? (
          <footer className="flex items-center justify-end gap-2 border-t border-app-border bg-[color:var(--sunken)] px-4 py-3">{footer}</footer>
        ) : <div />}
      </aside>
    </>,
    document.body,
  );
}

/** Modal: one form or one step to submit. Keep a multi-step flow in the same modal and swap `sub`, body and footer. */
export function Modal({ open, onClose, title, sub, footer, wide, children }: LayerBase) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { mounted, leaving } = usePresence(open, 120);
  const depth = useLayer(open, ref, onClose);
  if (!mounted) return null;
  return createPortal(
    <>
      <Scrim stacked={depth > 0} leaving={leaving} onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cx(
          "fixed left-1/2 top-[6vh] z-[71] grid max-h-[88vh] -translate-x-1/2 grid-rows-[auto_minmax(0,1fr)_auto] rounded-lg border border-app-border bg-app-card shadow-lg outline-none",
          wide ? "w-[min(760px,calc(100vw-32px))]" : "w-[min(560px,calc(100vw-32px))]",
          leaving ? "pointer-events-none animate-[kx-pop-out_.12s_ease-in_forwards]" : "animate-[kx-pop-in_.22s_cubic-bezier(.16,1,.3,1)]",
        )}
      >
        <header className="flex min-h-[52px] items-center justify-between gap-3 border-b border-app-border px-5 pb-3 pt-4">
          <div className="grid min-w-0 gap-0.5">
            <h2 className="text-md font-semibold text-app-text">{title}</h2>
            {sub && <p className="text-sm text-app-text-secondary">{sub}</p>}
          </div>
          {closeBtn(onClose)}
        </header>
        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-4 overflow-auto px-5 pb-5 pt-4 text-sm text-app-text">{children}</div>
        {footer ? (
          <footer className="flex justify-end gap-2 rounded-b-lg border-t border-app-border bg-[color:var(--sunken)] px-5 py-3">{footer}</footer>
        ) : <div />}
      </div>
    </>,
    document.body,
  );
}

export interface DialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  /** Name the action: "Approve", "Revoke token". Never "OK". */
  confirmLabel: React.ReactNode;
  /** The amount the action spends, shown inside the button. */
  cost?: React.ReactNode;
  danger?: boolean;
  /** Keeps the confirm button off until a condition holds (e.g. the typed name matches). */
  confirmDisabled?: boolean;
}

/** Dialog: confirm one consequence. Only for actions that cost money or cannot be undone. */
export function Dialog({ open, onCancel, onConfirm, title, children, confirmLabel, cost, danger, confirmDisabled }: DialogProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { mounted, leaving } = usePresence(open, 120);
  const depth = useLayer(open, ref, onCancel);
  if (!mounted) return null;
  return createPortal(
    <>
      <Scrim stacked={depth > 0} leaving={leaving} onClick={onCancel} />
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cx(
          "fixed left-1/2 top-[18vh] z-[71] w-[min(440px,calc(100vw-32px))] -translate-x-1/2 rounded-lg border border-app-border bg-app-card shadow-lg outline-none",
          leaving ? "pointer-events-none animate-[kx-pop-out_.12s_ease-in_forwards]" : "animate-[kx-pop-in_.22s_cubic-bezier(.16,1,.3,1)]",
        )}
      >
        <div className="grid gap-2.5 p-5">
          <h2 className="text-md font-semibold text-app-text">{title}</h2>
          <div className="text-sm text-app-text-secondary">{children}</div>
        </div>
        <footer className="flex justify-end gap-2 rounded-b-lg border-t border-app-border bg-[color:var(--sunken)] px-5 py-3">
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} cost={cost} onClick={onConfirm} disabled={confirmDisabled} data-autofocus>
            {confirmLabel}
          </Button>
        </footer>
      </div>
    </>,
    document.body,
  );
}
