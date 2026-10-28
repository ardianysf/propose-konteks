import * as React from "react";
import { Box, MessageSquare, Sparkles } from "lucide-react";
import { Avatar } from "./Avatar";
import { Reactions, Reaction } from "./Reactions";
import { Button } from "./Button";
import { cx, ring } from "./cx";

/* Activities: a feed of what people did, newest first on an avatar rail. Every entry is a person; Konteks only
   answers when a person calls it, so its answer is an AgentReply inside that person's card, never an entry. */

export function ActivityFeed({ children }: { children: React.ReactNode }) {
  return (
    <ol role="feed" aria-label="Activities" className="relative m-0 list-none p-0 before:absolute before:bottom-3 before:left-[15.5px] before:top-3 before:w-px before:bg-app-border-strong max-[560px]:before:hidden">
      {children}
    </ol>
  );
}

/** Sticky day heading inside the feed: "Today · 27 Oct 2026". */
export function ActivityDay({ day, date }: { day: string; date: string }) {
  return (
    <li className="sticky top-0 z-[2] bg-gradient-to-b from-app-bg from-70% to-transparent pb-3 pl-11 pt-7 first:pt-4 max-[560px]:pb-2.5 max-[560px]:pl-0 max-[560px]:pt-6 max-[560px]:first:pt-3">
      <h2 className="flex items-baseline gap-2 text-sm font-semibold">{day}<span className="text-xs font-normal text-app-text-tertiary">{date}</span></h2>
    </li>
  );
}

export interface ActivityCardProps {
  actor: { name: string; initials: string };
  /** What they did, ending before the initiative: "started", "approved TKT-2's delivery in". */
  verb: string;
  initiative: { title: string; onOpen: () => void; href?: string };
  /** "19.26"; the full date belongs in `timeTitle`. */
  time: string;
  timeTitle?: string;
  system: string;
  /** Not shown: the verb and the agent's reply already say where the work stands. Kept so callers need not change. */
  stage?: string;
  updates: number;
  /** The person's own content, e.g. their request as a quote. */
  children?: React.ReactNode;
  /** Konteks's answer to this person. */
  reply?: React.ReactNode;
  /** A running delivery: the node pulses and the card shows Live. */
  live?: boolean;
  reactions: Reaction[];
  onReactions: (r: Reaction[]) => void;
  /** Older API: called when Comment is pressed. Prefer `comments` + `onAddComment`, which give the card its own thread. */
  onComment?: () => void;
  /** Comments on this card. They belong to the card, as in the live app: they do not appear on the initiative,
      and @konteks here calls nobody. Folded behind a count until opened. */
  comments?: ActivityComment[];
  /** Posts a comment on this card. With it, Comment opens a box in the band at the foot of the card. */
  onAddComment?: (text: string) => void;
  /** The viewer's next step, if any (one primary button). */
  action?: React.ReactNode;
}

export interface ActivityComment { id: string; name: string; initials: string; text: string; time: string; you?: boolean }

export function ActivityCard({ actor, verb, initiative, time, timeTitle, system, updates, children, reply, live, reactions, onReactions, onComment, comments = [], onAddComment, action }: ActivityCardProps) {
  const [showComments, setShowComments] = React.useState(false);
  const [writing, setWriting] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const noteId = React.useId();
  const commentBtn = React.useRef<HTMLButtonElement>(null);
  const close = () => { setWriting(false); setDraft(""); commentBtn.current?.focus(); };
  const post = () => { const t = draft.trim(); if (!t) return; onAddComment?.(t); setShowComments(true); close(); };
  const band = (showComments && comments.length > 0) || writing;
  return (
    <li className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-3 pb-4 max-[560px]:grid-cols-1 max-[560px]:pb-3">
      {/* On phones the rail goes and the avatar moves into the card header, so the card gets the full width. */}
      <span className="relative z-[1] pt-3 max-[560px]:hidden">
        <Avatar name={actor.name} initials={actor.initials} size={32} className={cx("shadow-[0_0_0_4px_rgb(var(--color-app-bg))]", live && "animate-[kx-node-pulse_2.4s_cubic-bezier(.16,1,.3,1)_infinite]")} />
      </span>
      <article aria-label={`${actor.name} ${verb} ${initiative.title}`}
        className={cx("grid min-w-0 gap-3 rounded-lg border bg-app-card px-5 py-4 transition-[border-color,box-shadow] duration-150 hover:border-app-border-strong hover:shadow-sm max-[560px]:px-4 max-[560px]:py-3.5", live ? "border-[color:var(--accent-tint)]" : "border-app-border")}>
        <header className="flex items-start gap-2.5">
          <Avatar name={actor.name} initials={actor.initials} size={24} className="hidden shrink-0 max-[560px]:inline-grid" />
          <div className="grid min-w-0 flex-1 gap-0.5">
            <p className="m-0 min-w-0 text-sm text-app-text-secondary">
              <b className="font-semibold text-app-text">{actor.name}</b> {verb}{" "}
              <a href={initiative.href ?? "#"} onClick={e => { e.preventDefault(); initiative.onOpen(); }} className={cx("font-semibold text-app-text no-underline hover:underline hover:underline-offset-[3px]", ring)}>{initiative.title}</a>
            </p>
            {/* One quiet line instead of a row of tags: the System and how much has happened. */}
            <p className="m-0 flex flex-wrap items-center gap-1.5 text-xs text-app-text-tertiary">
              <span className="inline-flex items-center gap-1"><Box aria-hidden strokeWidth={1.75} className="size-3" />{system}</span>
              <span aria-hidden>·</span>
              <a href={initiative.href ?? "#"} onClick={e => { e.preventDefault(); initiative.onOpen(); }} className="text-app-text-tertiary no-underline hover:text-app-text hover:underline">{updates} updates</a>
            </p>
          </div>
          {live && <span className="inline-flex h-5 items-center gap-1.5 rounded-sm bg-app-accent-soft px-2 text-xs font-semibold text-app-accent-text"><span className="size-1.5 rounded-full bg-app-accent-strong" />Live</span>}
          <time title={timeTitle} className="whitespace-nowrap text-xs leading-5 tabular-nums text-app-text-tertiary">{time}</time>
        </header>
        {children}
        {reply}
        <footer className="flex flex-wrap items-center justify-between gap-2">
          <Reactions value={reactions} onChange={onReactions}>
            {(onComment || onAddComment) && <Button ref={commentBtn} variant="ghost" size="sm" aria-expanded={onAddComment ? writing : undefined}
              onClick={() => { onComment?.(); if (onAddComment) writing ? close() : setWriting(true); }}><MessageSquare strokeWidth={1.75} />Comment</Button>}
            {comments.length > 0 && <CommentCount people={comments} count={comments.length} open={showComments} onToggle={() => setShowComments(o => !o)} />}
          </Reactions>
          {action}
        </footer>
        {band && (
          <div className="-mx-5 -mb-4 mt-1 grid gap-4 rounded-b-lg border-t border-app-border bg-[color:var(--sunken)] px-5 pb-5 pt-4 max-[560px]:-mx-4 max-[560px]:-mb-3.5 max-[560px]:px-4 max-[560px]:pb-4 max-[560px]:pt-3.5">
            {showComments && comments.length > 0 && (
              <ol className="m-0 grid list-none gap-3.5 p-0">
                {comments.map(c => (
                  <li key={c.id} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2.5">
                    <Avatar name={c.name} initials={c.initials} size={24} />
                    <div><p className="m-0 flex items-baseline gap-2 text-xs text-app-text-tertiary"><b className="text-sm font-semibold text-app-text">{c.name}</b>{c.time}</p>
                      <p className="m-0 text-sm text-app-text">{c.text}</p></div>
                  </li>
                ))}
              </ol>
            )}
            {writing && (
              <div className="flex items-start gap-3">
                <Avatar name="You" initials="AY" size={28} className="mt-2.5" />
                <div className="grid min-w-0 flex-1 gap-1.5">
                  <div className="flex items-end gap-2 rounded-xl border border-[color:var(--line-input)] bg-app-card p-2 focus-within:border-app-accent-strong focus-within:shadow-[0_0_0_3px_var(--focus)]">
                    <textarea autoFocus rows={1} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add a comment…" aria-label="Comment on this card" aria-describedby={noteId}
                      onKeyDown={e => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } }}
                      className="min-h-6 min-w-0 flex-1 resize-none border-0 bg-transparent px-1.5 py-1 text-sm outline-none max-[860px]:text-base" />
                    <Button variant="ghost" size="sm" onClick={close}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={post}>Comment</Button>
                  </div>
                  <p id={noteId} className="m-0 text-xs text-app-text-tertiary">Stays on this card. To hand work to Konteks, comment on a note in the initiative with @konteks.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </article>
    </li>
  );
}

/** The person's request as the card's body text, two lines at most (the full text lives on the initiative). */
export function ActivityQuote({ children, full }: { children: React.ReactNode; full?: string }) {
  return <p title={full} className="m-0 line-clamp-2 text-sm text-app-text">{children}</p>;
}

export interface AgentReplyProps {
  /** What Konteks did, in its own words: "Wrote the plan", "Delivering TKT-2 of 3 on rf-01". The children add only
      what this line does not already say (a ticket bar, two lines of detail, the quoted figures). */
  did: string;
  time: string;
  children?: React.ReactNode;
}

/** Konteks's answer inside the card of the person who called it: hairline above, the mark, the Agent chip, its own time. */
export function AgentReply({ did, time, children }: AgentReplyProps) {
  return (
    <div className="grid grid-cols-[22px_minmax(0,1fr)] gap-2.5 border-t border-app-border pt-3">
      <Avatar name="Konteks" agent size={22} />
      <div className="grid min-w-0 gap-2">
        <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-app-text-secondary">
          <b className="font-semibold text-app-text">Konteks</b>
          <span className="rounded-sm border border-app-border px-1 text-xs font-medium text-app-text-tertiary">Agent</span>
          <span>{did}</span>
          <time className="ml-auto text-xs tabular-nums text-app-text-tertiary">{time}</time>
        </p>
        {children}
      </div>
    </div>
  );
}

/** Ticket bar for a running delivery: moss merged, moving blue on the one delivering, grey to go. */
export function TicketBar({ done, of, ticket }: { done: number; of: number; ticket: string }) {
  return (
    <div role="img" aria-label={`${done} of ${of} tickets merged, ${ticket} delivering`} className="flex gap-1">
      {Array.from({ length: of }, (_, n) => (
        <span key={n} className={cx("h-1 flex-1 rounded-sm", n < done ? "bg-app-accent-strong" : n === done ? "animate-[kx-run_1.8s_linear_infinite] bg-[linear-gradient(90deg,var(--info)_0_40%,var(--line)_40%)] bg-[length:250%_100%]" : "bg-app-border")} />
      ))}
    </div>
  );
}

/** A comment count that folds comments: up to three faces, then "N comments". Used on notes and on Activities cards. */
export function CommentCount({ people, count, open, onToggle }: { people: Array<{ name: string; initials: string; agent?: boolean }>; count: number; open: boolean; onToggle: () => void }) {
  const faces = people.filter((p, k) => people.findIndex(q => q.initials === p.initials) === k).slice(0, 3);
  const label = `${count} comment${count > 1 ? "s" : ""}`;
  return (
    <button type="button" aria-expanded={open} aria-label={`${label}, ${open ? "hide" : "show"} them`} onClick={onToggle}
      className={cx("inline-flex h-7 items-center gap-1.5 rounded border-0 bg-transparent pl-1.5 pr-2 text-xs hover:bg-[color:var(--hover)] hover:text-app-text", open ? "text-app-text" : "text-app-text-secondary", ring)}>
      <span className="flex">{faces.map((p, k) => <Avatar key={p.initials} name={p.name} initials={p.initials} agent={p.agent} size={20} className={cx("shadow-[0_0_0_2px_var(--surface)]", k > 0 && "-ml-1.5")} />)}</span>
      {label}
    </button>
  );
}

/** Shown above a note's comment box while the text mentions @konteks: the comment hands the work to Konteks,
    which runs and may cost usage (the live app's own words). Note comments only; Activities comments call nobody. */
export const KONTEKS_MENTION = /(^|\s)@konteks\b/i;
export function HandoffNotice() {
  return (
    <p className="m-0 flex items-start gap-2 rounded bg-app-accent-soft px-2.5 py-2 text-xs text-app-text-secondary">
      <Sparkles aria-hidden strokeWidth={1.75} className="mt-px size-3.5 shrink-0 text-app-accent-strong" />
      <span><b className="font-semibold text-app-text">This comment hands the work to Konteks.</b> Usual usage charges apply.</span>
    </p>
  );
}
