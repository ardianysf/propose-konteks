import * as React from "react";
import { createPortal } from "react-dom";
import { Paperclip, Sparkles, Wrench, X } from "lucide-react";
import { Button } from "./Button";
import { cx } from "./cx";

export interface SlashItem {
  kind: "skill" | "tool";
  name: string;
  desc: string;
  icon?: React.ReactNode;
}
export interface ComposerSend { text: string; picks: SlashItem[] }

export interface ComposerProps {
  placeholder: string;
  /** "Post note" for notes, "Send" in an agent session. */
  cta?: string;
  /** Skills and tools offered by the "/" picker. */
  items: SlashItem[];
  onSend: (msg: ComposerSend) => void;
  /** Extra tool buttons before Attach (e.g. Create text attachment, Record voice). Use ghost, sm, iconOnly. */
  tools?: React.ReactNode;
  onAttach?: () => void;
  /** Text and tools on one row (agent session dock); the row grows upward with the message. */
  compact?: boolean;
  /** Content above the text, e.g. attachment chips. */
  above?: React.ReactNode;
  disabled?: boolean;
}

const MAX = 200;

/** Composer: one for notes and the agent session. "/" at the start of a word opens the skills-and-tools picker
    (↑↓ move, ↵ or Tab use, Esc close); picks become chips; ⌘↵ or Ctrl+↵ sends. A press anywhere in the box
    that is not a control puts the caret in the text. */
export function Composer({ placeholder, cta = "Send", items, onSend, tools, onAttach, compact, above, disabled }: ComposerProps) {
  const [text, setText] = React.useState("");
  const [picks, setPicks] = React.useState<SlashItem[]>([]);
  const [slash, setSlash] = React.useState<{ at: number; q: string } | null>(null);
  const [sel, setSel] = React.useState(0);
  const [popPos, setPopPos] = React.useState<React.CSSProperties>({ visibility: "hidden" });
  const box = React.useRef<HTMLDivElement>(null);
  const ta = React.useRef<HTMLTextAreaElement>(null);
  const pop = React.useRef<HTMLDivElement>(null);
  const hintId = React.useId(), listId = React.useId();

  const matches = slash ? items.filter(i => (i.name + " " + i.desc).toLowerCase().includes(slash.q.toLowerCase())) : [];
  const canSend = !disabled && (text.trim().length > 0 || picks.length > 0);

  /* Compact: once the message needs a second line, the tools move under the text so it gets the full width;
     back to one row only when the field is empty again (no flip-flopping while typing). */
  const [multi, setMulti] = React.useState(false);
  React.useLayoutEffect(() => {
    const t = ta.current; if (!t) return;
    t.style.height = "auto";
    if (compact) {
      if (!text) setMulti(false);
      else if (!multi && (t.scrollHeight > 40 || text.includes("\n"))) { setMulti(true); return; }
    }
    t.style.height = Math.min(MAX, t.scrollHeight) + "px";
  }, [text, multi, compact]);

  /* The picker sits above the composer, or below it when there is no room. */
  React.useLayoutEffect(() => {
    if (!slash || !pop.current || !box.current) return;
    const r = box.current.getBoundingClientRect(), h = pop.current.offsetHeight, w = pop.current.offsetWidth;
    setPopPos({ left: Math.max(8, Math.min(r.left, innerWidth - w - 8)), top: r.top - h - 6 > 8 ? r.top - h - 6 : r.bottom + 6 });
  }, [slash, matches.length]);
  React.useEffect(() => { setSel(0); }, [slash?.q]);

  const add = (item: SlashItem) => {
    if (slash) {
      const end = ta.current?.selectionStart ?? text.length;
      setText(text.slice(0, slash.at) + text.slice(end));
    }
    setSlash(null);
    setPicks(p => (p.some(x => x.name === item.name) ? p : [...p, item]));
    requestAnimationFrame(() => ta.current?.focus());
  };

  const send = () => {
    if (!canSend) return;
    onSend({ text: text.trim(), picks });
    setText(""); setPicks([]); setSlash(null);
  };

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value, pos = e.target.selectionStart;
    setText(v);
    const m = v.slice(0, pos).match(/(^|\s)\/([\w-]*)$/);
    setSlash(m ? { at: pos - m[2].length - 1, q: m[2] } : null);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slash && matches.length) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); setSel(s => (s + (e.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length); return;
      }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); add(matches[sel]); return; }
    }
    if (slash && e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setSlash(null); return; }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
  };

  const openPicker = () => {
    const t = ta.current; if (!t) return;
    const p = t.selectionStart, pre = text.slice(0, p), space = pre && !/\s$/.test(pre) ? " " : "";
    const v = pre + space + "/" + text.slice(p);
    setText(v); setSlash({ at: p + space.length, q: "" });
    requestAnimationFrame(() => { t.focus(); t.selectionStart = t.selectionEnd = p + space.length + 1; });
  };

  return (
    <div
      ref={box}
      onMouseDown={e => {
        const t = e.target as HTMLElement;
        if (t === ta.current || t.closest("button,a,input,label")) return;
        e.preventDefault(); ta.current?.focus();
      }}
      className={cx(
        "grid cursor-text gap-1 rounded-lg border border-app-border-input bg-app-card transition-[border-color,box-shadow] duration-150",
        "focus-within:border-app-accent-strong focus-within:shadow-[0_0_0_3px_var(--focus)]",
        compact && !multi ? "grid-cols-[minmax(0,1fr)_auto] items-end gap-x-1.5 py-1.5 pl-2 pr-1.5 max-[560px]:grid-cols-1" : "px-2 pb-1.5 pt-2",
      )}
    >
      {above && <div className={cx("flex flex-wrap gap-1.5", compact && "col-span-full")}>{above}</div>}
      {picks.length > 0 && (
        <div className={cx("flex flex-wrap gap-1.5 px-0.5 pt-0.5", compact && "col-span-full")}>
          {picks.map(p => (
            <span key={p.name} className="inline-flex h-[26px] items-center gap-1.5 rounded bg-app-accent-soft pl-2 pr-1 text-xs text-app-accent-text animate-[kx-pick-in_.18s_cubic-bezier(.16,1,.3,1)]">
              {p.icon ?? (p.kind === "skill" ? <Sparkles aria-hidden className="size-3.5" strokeWidth={1.75} /> : <Wrench aria-hidden className="size-3.5" strokeWidth={1.75} />)}
              <span>{p.kind === "skill" ? "Skill" : "Tool"} · <b className="font-semibold">{p.name}</b></span>
              <button
                type="button"
                aria-label={`Remove ${p.name}`}
                onClick={() => { setPicks(ps => ps.filter(x => x !== p)); ta.current?.focus(); }}
                className="grid size-5 cursor-pointer place-items-center rounded-sm border-0 bg-transparent text-inherit hover:bg-[color:var(--hover)]"
              >
                <X aria-hidden className="size-3.5" strokeWidth={1.75} />
              </button>
            </span>
          ))}
        </div>
      )}
      <textarea
        ref={ta}
        rows={1}
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={placeholder}
        aria-describedby={hintId}
        aria-autocomplete="list"
        aria-expanded={!!slash}
        aria-controls={slash ? listId : undefined}
        onChange={onChange}
        onKeyDown={onKey}
        onBlur={() => setTimeout(() => { if (document.activeElement !== ta.current) setSlash(null); }, 120)}
        className={cx(
          "w-full resize-none border-0 bg-transparent text-sm leading-normal text-app-text outline-none placeholder:text-app-text-tertiary max-[860px]:text-[16px]",
          compact && !multi ? "min-h-[28px] px-1 py-1" : "min-h-[24px] px-1.5 py-1",
        )}
        style={{ maxHeight: MAX }}
      />
      <div className={cx("flex items-center", compact ? "gap-0.5" : "gap-1")}>
        {tools}
        <Button variant="ghost" size="sm" iconOnly aria-label="Attach file" title="Attach file" onClick={onAttach}>
          <Paperclip strokeWidth={1.75} />
        </Button>
        <Button variant="ghost" size="sm" aria-haspopup="listbox" title="Use a skill or tool" onClick={openPicker}>
          <Sparkles strokeWidth={1.75} />Skill
          <span className="ml-0.5 rounded-sm border border-b-2 border-app-border-strong bg-app-card px-1 font-mono text-xs text-app-text-secondary">/</span>
        </Button>
        <span id={hintId} className={cx("text-xs text-app-text-tertiary", compact ? "sr-only" : "ml-auto pr-1.5 max-[860px]:hidden")}>⌘↵ to send</span>
        <Button variant="primary" size="sm" disabled={!canSend} onClick={send} title="⌘↵ to send" className={compact && !multi ? "ml-1 max-[560px]:ml-auto" : compact ? "ml-auto" : undefined}>
          {cta}
        </Button>
      </div>
      {slash && createPortal(
        <div
          ref={pop}
          id={listId}
          role="listbox"
          aria-label="Skills and tools"
          style={{ position: "fixed", ...popPos }}
          className="z-[80] max-h-80 w-[min(360px,calc(100vw-32px))] overflow-auto rounded-lg border border-app-border bg-app-card p-1 shadow-md"
        >
          {matches.length === 0 ? (
            <p className="p-2.5 text-xs text-app-text-tertiary">No skill or tool matches “{slash.q}”.</p>
          ) : (
            <>
              {(["skill", "tool"] as const).map(kind => {
                const g = matches.filter(m => m.kind === kind);
                if (!g.length) return null;
                return (
                  <div key={kind} role="group" aria-label={kind === "skill" ? "Skills" : "Tools"}>
                    <div className="px-2 pb-0.5 pt-1.5 text-xs font-semibold text-app-text-tertiary">{kind === "skill" ? "Skills" : "Tools"}</div>
                    {g.map(m => {
                      const n = matches.indexOf(m);
                      return (
                        <button
                          key={m.name}
                          type="button"
                          role="option"
                          aria-selected={n === sel}
                          onMouseDown={e => e.preventDefault()}
                          onMouseEnter={() => setSel(n)}
                          onClick={() => add(m)}
                          className={cx(
                            "flex w-full cursor-pointer items-start gap-2.5 rounded border-0 bg-transparent p-2 text-left text-app-text",
                            n === sel && "bg-[color:var(--hover)]",
                          )}
                        >
                          <span className="mt-0.5 text-app-text-tertiary [&_svg]:size-3.5">
                            {m.icon ?? (m.kind === "skill" ? <Sparkles strokeWidth={1.75} /> : <Wrench strokeWidth={1.75} />)}
                          </span>
                          <span className="grid min-w-0">
                            <b className="font-mono text-sm font-medium">{m.name}</b>
                            <small className="line-clamp-2 text-xs text-app-text-tertiary">{m.desc}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
              <div className="mt-1 flex items-center gap-1 border-t border-app-border px-2 pb-1 pt-1.5 text-xs text-app-text-tertiary">
                ↑↓ move · ↵ use · esc close
              </div>
            </>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
