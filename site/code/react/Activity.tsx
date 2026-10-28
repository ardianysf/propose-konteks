import * as React from "react";
import { Box, MessageSquare } from "lucide-react";
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
  onComment?: () => void;
  /** The viewer's next step, if any (one primary button). */
  action?: React.ReactNode;
}

export function ActivityCard({ actor, verb, initiative, time, timeTitle, system, updates, children, reply, live, reactions, onReactions, onComment, action }: ActivityCardProps) {
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
            {onComment && <Button variant="ghost" size="sm" onClick={onComment}><MessageSquare strokeWidth={1.75} />Comment</Button>}
          </Reactions>
          {action}
        </footer>
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
