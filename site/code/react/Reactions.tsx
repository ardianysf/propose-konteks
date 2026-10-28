import * as React from "react";
import { createPortal } from "react-dom";
import { SmilePlus } from "lucide-react";
import { cx, ring } from "./cx";

export interface Reaction { emoji: string; count: number; mine?: boolean }

export const REACTIONS: Array<[string, string]> = [
  ["👍", "Thumbs up"], ["🎉", "Celebrate"], ["👀", "Looking"], ["✅", "Done"], ["🚀", "Ship it"], ["❤️", "Love"],
];

export interface ReactionsProps {
  value: Reaction[];
  onChange: (next: Reaction[]) => void;
  /** Emoji offered by the picker; defaults to REACTIONS. */
  choices?: Array<[string, string]>;
  /** Extra controls after the add button, e.g. a Comment button. */
  children?: React.ReactNode;
}

/** Reactions: chips you toggle, and a horizontal picker (one row, above the button, below when there is no room).
    ←/→ move, Home/End jump, Enter picks, Escape or a click outside closes and returns focus. Picking an emoji
    that is already there adds you to it instead of making a duplicate. */
export function Reactions({ value, onChange, choices = REACTIONS, children }: ReactionsProps) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<React.CSSProperties>({ visibility: "hidden" });
  const add = React.useRef<HTMLButtonElement>(null);
  const bar = React.useRef<HTMLDivElement>(null);

  const toggle = (emoji: string, force?: boolean) => {
    const hit = value.find(r => r.emoji === emoji);
    if (!hit) return onChange([...value, { emoji, count: 1, mine: true }]);
    const on = force ?? !hit.mine;
    if (on === !!hit.mine) return;
    onChange(value.map(r => (r === hit ? { ...r, mine: on, count: r.count + (on ? 1 : -1) } : r)).filter(r => r.count > 0));
  };
  const close = (refocus = true) => { setOpen(false); if (refocus) add.current?.focus(); };

  React.useLayoutEffect(() => {
    if (!open || !bar.current || !add.current) return;
    const r = add.current.getBoundingClientRect(), h = bar.current.offsetHeight, w = bar.current.offsetWidth;
    setPos({ top: r.top - h - 6 > 8 ? r.top - h - 6 : r.bottom + 6, left: Math.max(8, Math.min(r.left - 4, innerWidth - w - 8)) });
  }, [open]);
  React.useEffect(() => {
    if (open && pos.visibility !== "hidden") bar.current?.querySelector<HTMLElement>("button")?.focus();
  }, [open, pos]);
  React.useEffect(() => {
    if (!open) return;
    const out = (e: MouseEvent) => { if (!bar.current?.contains(e.target as Node) && !add.current?.contains(e.target as Node)) close(false); };
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, [open]);

  const onKey = (e: React.KeyboardEvent) => {
    const btns = [...(bar.current?.querySelectorAll<HTMLElement>("button") ?? [])];
    const i = btns.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => { e.preventDefault(); btns[(n + btns.length) % btns.length]?.focus(); };
    if (e.key === "ArrowRight") go(i + 1);
    else if (e.key === "ArrowLeft") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(btns.length - 1);
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === "Tab") close(false);
  };

  const chip = "inline-flex h-6 cursor-pointer items-center gap-1 rounded border px-2 text-xs transition-colors duration-150 " + ring;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {value.map(r => (
        <button key={r.emoji} type="button" aria-pressed={!!r.mine} onClick={() => toggle(r.emoji)}
          className={cx(chip, r.mine ? "border-app-accent-strong bg-app-accent-soft text-app-accent-text" : "border-app-border bg-app-card text-app-text")}>
          {r.emoji} <span>{r.count}</span>
        </button>
      ))}
      <button ref={add} type="button" aria-label="Add a reaction" aria-haspopup="true" aria-expanded={open}
        onClick={() => (open ? close(false) : (setPos({ visibility: "hidden" }), setOpen(true)))}
        className={cx(chip, "w-6 justify-center px-0 text-app-text-tertiary [&_svg]:size-3.5 [&_svg]:shrink-0",
          open ? "border-app-border-strong bg-[color:var(--press)] text-app-text" : "border-app-border bg-app-card")}>
        <SmilePlus aria-hidden strokeWidth={1.75} />
      </button>
      {children}
      {open && createPortal(
        <div ref={bar} role="toolbar" aria-label="Add a reaction" onKeyDown={onKey} style={{ position: "fixed", ...pos }}
          className="z-[90] flex gap-0.5 rounded-lg border border-app-border bg-app-card p-1 shadow-md animate-[kx-list-up_.14s_cubic-bezier(.16,1,.3,1)]">
          {choices.map(([e, name]) => (
            <button key={e} type="button" aria-label={name} title={name} onClick={() => { toggle(e, true); close(); }}
              className={cx("grid size-8 cursor-pointer place-items-center rounded border-0 bg-transparent text-md leading-none transition-[background-color,translate] duration-100 hover:-translate-y-0.5 hover:bg-[color:var(--hover)] focus-visible:-translate-y-0.5 focus-visible:bg-[color:var(--hover)] motion-reduce:hover:translate-y-0", ring)}>
              {e}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
