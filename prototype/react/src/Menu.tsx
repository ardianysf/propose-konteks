import * as React from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx";

export type MenuItem =
  | "divider"
  | { head: React.ReactNode }
  | { label: string; icon?: React.ReactNode; onSelect: () => void; danger?: boolean; kbd?: string; disabled?: boolean };

export interface MenuProps {
  /** The button that opens the menu. It receives aria-haspopup, aria-expanded and the click handler. */
  trigger: React.ReactElement;
  items: MenuItem[];
  /** Accessible name of the menu, e.g. "Account". */
  label: string;
  /** Align the menu's right edge with the trigger instead of its left edge. */
  align?: "start" | "end";
}

/** Menu: pick or navigate. Opens below the trigger, or above it when the trigger sits low;
    ↑↓ move, Home/End jump, Escape closes and returns focus, a click outside closes. Always above drawers and modals. */
export function Menu({ trigger, items, label, align = "start" }: MenuProps) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<React.CSSProperties>({ visibility: "hidden" });
  const trig = React.useRef<HTMLElement | null>(null);
  const menu = React.useRef<HTMLDivElement>(null);
  const id = React.useId();

  const close = React.useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) trig.current?.focus();
  }, []);

  React.useLayoutEffect(() => {
    if (!open || !menu.current || !trig.current) return;
    const r = trig.current.getBoundingClientRect(), m = menu.current, h = m.offsetHeight, w = m.offsetWidth;
    const top = r.bottom + 4 + h > innerHeight ? Math.max(8, r.top - 4 - h) : r.bottom + 4;
    const left = align === "end" ? r.right - w : r.left;
    setPos({ top, left: Math.max(8, Math.min(left, innerWidth - w - 8)) });
  }, [open, align]);
  /* Focus the first item once the menu is placed and visible (a hidden element cannot take focus). */
  React.useEffect(() => {
    if (open && pos.visibility !== "hidden") menu.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus();
  }, [open, pos]);

  React.useEffect(() => {
    if (!open) return;
    const out = (e: MouseEvent) => {
      if (!menu.current?.contains(e.target as Node) && !trig.current?.contains(e.target as Node)) close(false);
    };
    const away = () => close(false);
    document.addEventListener("mousedown", out);
    addEventListener("resize", away);
    return () => { document.removeEventListener("mousedown", out); removeEventListener("resize", away); };
  }, [open, close]);

  const onKey = (e: React.KeyboardEvent) => {
    const btns = [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [])];
    const i = btns.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => { e.preventDefault(); btns[(n + btns.length) % btns.length]?.focus(); };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(btns.length - 1);
    else if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); e.stopPropagation(); close(e.key === "Escape"); }
  };

  const triggerEl = React.cloneElement(trigger, {
    ref: (n: HTMLElement | null) => { trig.current = n; },
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "aria-controls": open ? id : undefined,
    onClick: (e: React.MouseEvent) => { trigger.props.onClick?.(e); setPos({ visibility: "hidden" }); setOpen(o => !o); },
    onKeyDown: (e: React.KeyboardEvent) => {
      trigger.props.onKeyDown?.(e);
      if (e.key === "ArrowDown" && !open) { e.preventDefault(); setOpen(true); }
    },
  });

  return (
    <>
      {triggerEl}
      {open && createPortal(
        <div
          ref={menu}
          id={id}
          role="menu"
          aria-label={label}
          onKeyDown={onKey}
          style={{ position: "fixed", ...pos }}
          className="z-[80] grid min-w-[240px] rounded-lg border border-app-border bg-app-card p-1 shadow-md animate-[kx-list-down_.14s_cubic-bezier(.16,1,.3,1)]"
        >
          {items.map((it, n) => {
            if (it === "divider") return <hr key={n} className="my-1 border-0 border-t border-app-border" />;
            if ("head" in it) return <div key={n} role="presentation" className="flex items-center gap-2.5 p-2">{it.head}</div>;
            return (
              <button
                key={n}
                type="button"
                role="menuitem"
                tabIndex={-1}
                disabled={it.disabled}
                onClick={() => { close(); it.onSelect(); }}
                className={cx(
                  "flex items-center gap-2 rounded-sm border-0 bg-transparent px-2 py-1.5 text-left text-sm outline-none",
                  "cursor-pointer hover:bg-[color:var(--hover)] focus-visible:bg-[color:var(--hover)] disabled:cursor-not-allowed disabled:opacity-50",
                  "[&_svg]:size-3.5 [&_svg]:shrink-0",
                  it.danger ? "text-app-danger [&_svg]:text-app-danger" : "text-app-text [&_svg]:text-app-text-tertiary",
                )}
              >
                {it.icon}
                {it.label}
                {it.kbd && (
                  <span className="ml-auto rounded-sm border border-b-2 border-app-border-strong bg-app-card px-1 font-mono text-xs text-app-text-secondary">
                    {it.kbd}
                  </span>
                )}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
