import * as React from "react";
import { Clock, CornerDownRight, Loader, Lock, OctagonAlert } from "lucide-react";
import { Avatar } from "./Avatar";
import { FlowTrack, FlowTone } from "./FlowTrack";
import { cx, ring } from "./cx";

/* Work In Progress is a work queue, not a feed: one panel of rows answering "whose move, how long, how far along".
   Whose move is a filter over one list ordered by most recent movement, never a grouping. */

export interface QueueFilterProps<K extends string> {
  options: Array<{ key: K; label: string; count: number }>;
  value: K;
  onChange: (key: K) => void;
  /** Right-hand note, e.g. "Most recent movement first". Hidden below 720px. */
  note?: React.ReactNode;
}

/** Whose-move filter: a segmented control with counts above the queue. */
export function QueueFilter<K extends string>({ options, value, onChange, note }: QueueFilterProps<K>) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div role="group" aria-label="Whose move" className="flex max-w-full overflow-x-auto rounded border border-app-border-strong bg-app-card p-0.5 [scrollbar-width:none]">
        {options.map(o => (
          <button key={o.key} type="button" aria-pressed={value === o.key} onClick={() => onChange(o.key)}
            className={cx("inline-flex h-7 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-sm border-0 px-2.5 text-sm transition-colors duration-150", ring,
              value === o.key ? "bg-[color:var(--nav-on)] font-medium text-app-text" : "bg-transparent text-app-text-secondary hover:bg-[color:var(--hover)]")}>
            {o.label}
            <span className="rounded-sm border border-app-border bg-[color:var(--sunken)] px-1 text-xs tabular-nums text-app-text-tertiary">{o.count}</span>
          </button>
        ))}
      </div>
      {note && <span className="text-xs text-app-text-tertiary max-[720px]:hidden">{note}</span>}
    </div>
  );
}

export function Queue({ children, label = "Work In Progress" }: { children: React.ReactNode; label?: string }) {
  return <ul aria-label={label} className="m-0 list-none overflow-hidden rounded-lg border border-app-border bg-app-card p-0">{children}</ul>;
}

export type QueueTone = "decision" | "blocked" | "waiting" | "running";

export interface QueueRowProps {
  /** Who moves next. `you` adds the accent; `agent` shows the Konteks mark. */
  mover: { name: string; initials?: string; label: string; you?: boolean; agent?: boolean };
  /** "7h 11m", "1d 3h": turns amber after a day and red after three. */
  wait: string;
  title: string;
  /** Opens the initiative; the whole row is clickable, links and buttons inside keep their job. */
  onOpen: () => void;
  href?: string;
  system: string;
  /** New updates since you last looked. */
  fresh?: number;
  cause: string;
  tone: QueueTone;
  /** Second thing that also needs the mover, e.g. a question from the agent. */
  more?: { label: string; onClick: () => void };
  flow: { current: number; delivery?: { done: number; of: number; ticket: string } };
  /** The one action the viewer may take; pass `gate` instead when they may not (e.g. approve). */
  action?: React.ReactNode;
  gate?: string;
}

const causeIcon = { decision: CornerDownRight, blocked: OctagonAlert, waiting: Clock, running: Loader };
const causeTone = { decision: "text-app-accent-text", blocked: "text-app-danger", waiting: "text-app-text-secondary", running: "text-app-text-secondary" };
const days = (w: string) => +(w.match(/(\d+)d/)?.[1] ?? 0);

/** One queue row: whose move and how long (184px), then title · System · N new, the toned cause and the flow track,
    then the one action. The accent marks your rows only. */
export function QueueRow({ mover, wait, title, onOpen, href = "#", system, fresh, cause, tone, more, flow, action, gate }: QueueRowProps) {
  const Icon = causeIcon[tone], d = days(wait);
  return (
    <li onClick={e => { if (!(e.target as HTMLElement).closest("a,button")) onOpen(); }}
      className="grid cursor-pointer grid-cols-[184px_minmax(0,1fr)_auto] gap-5 border-t border-app-border px-[18px] py-4 transition-colors duration-150 first:border-t-0 hover:bg-[color:var(--hover)] max-[720px]:grid-cols-1 max-[720px]:gap-2.5 max-[720px]:p-3.5">
      <div className="grid content-start gap-1.5 max-[720px]:flex max-[720px]:items-center max-[720px]:justify-between">
        <span className="flex min-w-0 items-center gap-2">
          <Avatar name={mover.name} initials={mover.initials} agent={mover.agent} mine={mover.you} />
          <b className={cx("truncate text-sm font-semibold", mover.you ? "text-app-accent-text" : "text-app-text-secondary")}>{mover.label}</b>
        </span>
        <span className="pl-[34px] text-xs tabular-nums text-app-text-tertiary max-[720px]:pl-0">
          {tone === "running" ? "for" : "waiting"}{" "}
          <b className={cx("font-semibold", d >= 3 ? "text-app-danger" : d >= 1 ? "text-[color:var(--warn)]" : "text-app-text")}>{wait}</b>
        </span>
      </div>
      <div className="grid min-w-0 gap-2 [container-type:inline-size]">
        <p className="m-0 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <a href={href} onClick={e => { e.preventDefault(); onOpen(); }} className={cx("text-base font-semibold text-app-text no-underline hover:underline hover:underline-offset-[3px]", ring)}>{title}</a>
          <span className="rounded-sm border border-app-border-strong px-1.5 text-xs text-app-text-secondary">{system}</span>
          {!!fresh && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--info)]"><span className="size-1.5 rounded-full bg-current" />{fresh} new</span>}
        </p>
        <p className={cx("m-0 flex items-start gap-1.5 text-sm", causeTone[tone])}>
          <Icon aria-hidden strokeWidth={1.75} className="mt-[3px] size-3.5 shrink-0" />
          <span>{cause}{more && <> · <button type="button" onClick={more.onClick} className={cx("cursor-pointer border-0 bg-transparent p-0 text-inherit underline underline-offset-[3px]", ring)}>{more.label}</button></>}</span>
        </p>
        <FlowTrack current={flow.current} delivery={flow.delivery} tone={tone as FlowTone} />
      </div>
      <div className="flex items-start justify-end max-[720px]:justify-start">
        {gate ? <span className="inline-flex items-center gap-1.5 text-xs text-app-text-secondary"><Lock aria-hidden strokeWidth={1.75} className="size-3.5" />{gate}</span> : action}
      </div>
    </li>
  );
}
