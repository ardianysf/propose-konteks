import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { cx, ring } from "./cx";

export interface ComboOption {
  value: string;
  label: string;
  /** Right-aligned detail in tertiary ink: a host, a price, "3 open". */
  hint?: string;
  /** Options with the same group are listed under that heading, in order of first appearance. */
  group?: string;
}

export interface ComboboxProps {
  options: ComboOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Leading icon inside the trigger (e.g. the System icon in a filter). */
  icon?: React.ReactNode;
  id?: string;
  disabled?: boolean;
  /** "full" fills the field (forms); "auto" sizes to the label (a filter in a toolbar). */
  width?: "full" | "auto";
  "aria-label"?: string;
  "aria-describedby"?: string;
  className?: string;
}

/** Combobox: a long list you can search (System, VCS connection, model). The list is portalled to <body>
    with fixed coordinates, so a modal's scroll body never clips it; it opens below the trigger, or above
    when there is no room. It is at least as wide as the trigger and wide enough for the longest option (to 320px). */
export function Combobox({
  options, value, onChange, placeholder = "Choose…", searchPlaceholder = "Search", icon, id, disabled, width = "full", className, ...aria
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [active, setActive] = React.useState(0);
  const [pos, setPos] = React.useState<React.CSSProperties & { up?: boolean }>({ visibility: "hidden" });
  const trig = React.useRef<HTMLButtonElement>(null);
  const pop = React.useRef<HTMLDivElement>(null);
  const search = React.useRef<HTMLInputElement>(null);
  const listId = React.useId();

  const shown = options.filter(o => (o.label + " " + (o.hint ?? "")).toLowerCase().includes(q.trim().toLowerCase()));
  const groups: Array<[string | undefined, ComboOption[]]> = [];
  shown.forEach(o => { const g = groups.find(x => x[0] === o.group); g ? g[1].push(o) : groups.push([o.group, [o]]); });
  const flat = groups.flatMap(g => g[1]);
  const current = options.find(o => o.value === value);

  const place = React.useCallback(() => {
    const t = trig.current, p = pop.current; if (!t || !p) return;
    const r = t.getBoundingClientRect(), gap = 4;
    const below = innerHeight - r.bottom - gap - 8, above = r.top - gap - 8;
    const want = Math.min(p.scrollHeight, 320), up = below < Math.min(want, 220) && above > below;
    const room = Math.max(160, Math.min(320, up ? above : below));
    const minWidth = Math.max(r.width, 220), maxWidth = Math.min(320, innerWidth - 16);
    const w = Math.min(Math.max(p.offsetWidth, minWidth), maxWidth);
    setPos({
      minWidth, maxWidth, maxHeight: room, up,
      left: Math.max(8, Math.min(r.left, innerWidth - w - 8)),
      top: up ? undefined : r.bottom + gap,
      bottom: up ? innerHeight - r.top + gap : undefined,
    });
  }, []);

  const close = React.useCallback((refocus = true) => { setOpen(false); setQ(""); if (refocus) trig.current?.focus(); }, []);

  React.useLayoutEffect(() => { if (open) place(); }, [open, q, place]);
  React.useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, flat.findIndex(o => o.value === value)));
    const out = (e: MouseEvent) => { if (!pop.current?.contains(e.target as Node) && !trig.current?.contains(e.target as Node)) close(false); };
    document.addEventListener("mousedown", out);
    addEventListener("resize", place);
    document.addEventListener("scroll", place, true);
    return () => { document.removeEventListener("mousedown", out); removeEventListener("resize", place); document.removeEventListener("scroll", place, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  React.useEffect(() => { setActive(0); }, [q]);
  /* Focus the search once the list is placed and visible (a hidden element cannot take focus). */
  React.useEffect(() => { if (open && pos.visibility !== "hidden") search.current?.focus({ preventScroll: true }); }, [open, pos.visibility]);
  React.useEffect(() => {
    pop.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const pick = (o: ComboOption) => { onChange(o.value); close(); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (flat[active]) pick(flat[active]); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === "Tab") close(false);
  };

  const { up, ...style } = pos;
  let i = -1;
  return (
    <>
      <button
        ref={trig}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        {...aria}
        onClick={() => { setPos({ visibility: "hidden" }); setOpen(o => !o); }}
        onKeyDown={e => { if ((e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") && !open) { e.preventDefault(); setOpen(true); } }}
        className={cx(
          "inline-flex h-8 min-w-0 max-w-full items-center justify-between gap-1.5 rounded border border-app-border-strong bg-app-card px-3 text-sm text-app-text",
          "cursor-pointer transition-colors duration-150 hover:enabled:border-app-text-tertiary hover:enabled:bg-[color:var(--sunken)]",
          "disabled:cursor-not-allowed disabled:bg-[color:var(--sunken)] disabled:text-app-text-secondary [&_svg]:size-3.5 [&_svg]:shrink-0",
          width === "full" ? "w-full" : "w-auto", ring, className,
        )}
      >
        {icon}
        <span className={cx("min-w-0 flex-1 truncate text-left", !current && "text-app-text-tertiary")}>{current ? current.label : placeholder}</span>
        <ChevronDown aria-hidden strokeWidth={1.75} className="text-app-text-tertiary" />
      </button>
      {open && createPortal(
        <div
          ref={pop}
          style={{ position: "fixed", ...style }}
          className={cx(
            "z-[85] grid w-max grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border border-app-border bg-app-card shadow-md",
            up ? "animate-[kx-list-up_.14s_cubic-bezier(.16,1,.3,1)]" : "animate-[kx-list-down_.14s_cubic-bezier(.16,1,.3,1)]",
          )}
        >
          <div className="flex items-center gap-2 border-b border-app-border px-2.5">
            <Search aria-hidden strokeWidth={1.75} className="size-3.5 shrink-0 text-app-text-tertiary" />
            <input
              ref={search}
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={flat[active] ? `${listId}-${active}` : undefined}
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={onKey}
              className="h-9 min-w-0 flex-1 border-0 bg-transparent text-sm text-app-text outline-none placeholder:text-app-text-tertiary max-[860px]:text-[16px]"
            />
          </div>
          <div id={listId} role="listbox" className="grid content-start overflow-auto p-1">
            {flat.length === 0 && <p className="px-2 py-2.5 text-xs text-app-text-tertiary">Nothing matches “{q}”.</p>}
            {groups.map(([g, os]) => (
              <div key={g ?? "_"} role={g ? "group" : undefined} aria-label={g} className="grid">
                {g && <div className="px-2 pb-0.5 pt-2 text-xs font-semibold text-app-text-tertiary">{g}</div>}
                {os.map(o => {
                  i += 1; const n = i, sel = o.value === value;
                  return (
                    <div
                      key={o.value}
                      id={`${listId}-${n}`}
                      data-i={n}
                      role="option"
                      aria-selected={sel}
                      onMouseDown={e => e.preventDefault()}
                      onMouseEnter={() => setActive(n)}
                      onClick={() => pick(o)}
                      className={cx(
                        "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-app-text",
                        n === active && "bg-[color:var(--hover)]",
                      )}
                    >
                      <Check aria-hidden strokeWidth={1.75} className={cx("size-[15px] shrink-0 text-app-accent-strong", !sel && "invisible")} />
                      <span className="min-w-0">{o.label}</span>
                      {o.hint && <small className="ml-auto pl-3 text-xs text-app-text-tertiary">{o.hint}</small>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
