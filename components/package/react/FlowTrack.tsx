import * as React from "react";
import { cx } from "./cx";

export const FLOW = ["Plan", "Breakdown", "Estimate", "Delivery", "Receipt"] as const;
export type FlowTone = "decision" | "blocked" | "waiting" | "running";

export interface FlowTrackProps {
  /** Index of the current step in FLOW (0 = Plan … 4 = Receipt). */
  current: number;
  /** Colours the current step: moss for a decision, red for blocked, ink-3 for waiting, pulsing blue for a delivery. */
  tone?: FlowTone;
  /** Tickets of a running delivery; draws the segmented bar after the Delivery step. */
  delivery?: { done: number; of: number; ticket: string };
  /** Kept for compatibility; the track is always packed now (fixed-pitch dots, no lines). */
  compact?: boolean | "auto";
}

const ringTone: Record<FlowTone, string> = {
  decision: "border-app-accent-strong shadow-[0_0_0_3px_var(--accent-soft)]",
  blocked: "border-app-danger shadow-[0_0_0_3px_var(--danger-soft)]",
  waiting: "border-app-text-tertiary shadow-[0_0_0_3px_var(--sunken)]",
  running: "border-[color:var(--info)] shadow-[0_0_0_3px_var(--info-soft)] animate-[kx-flow-run_2.4s_cubic-bezier(.16,1,.3,1)_infinite]",
};

/** Flow track (signature): where an initiative stands on the governed flow. Five dots at a fixed pitch and no
    connector lines (a queue of eight would draw 32): done steps are filled moss, the current step is a ring in the
    row's tone, upcoming steps are hollow. The current step is named once, after the dots, so dots and names both line
    up as columns down the queue; the other names are on hover and for screen readers. A delivery adds its ticket bar. */
export function FlowTrack({ current, tone = "decision", delivery }: FlowTrackProps) {
  return (
    <div className="mt-1.5 flex items-center gap-2.5 text-xs text-app-text-tertiary">
      <ol aria-label={`Flow: ${FLOW[current]} of ${FLOW.join(", ")}`} className="m-0 flex list-none items-center gap-1.5 p-0">
        {FLOW.map((step, k) => {
          const done = k < current, cur = k === current;
          return (
            <li key={step} title={step} aria-current={cur ? "step" : undefined} className="grid h-3.5 w-[11px] place-items-center">
              <i className={cx("block rounded-full",
                cur ? cx("size-[11px] border-2 bg-app-card", ringTone[tone]) : done ? "size-2 border-[1.5px] border-app-accent-strong bg-app-accent-strong" : "size-2 border-[1.5px] border-app-border-strong bg-app-card")} />
              <span className="sr-only">{step}</span>
            </li>
          );
        })}
      </ol>
      <span className="font-semibold text-app-text">{FLOW[current]}</span>
      {delivery && (
        <span role="img" title={`${delivery.done} of ${delivery.of} tickets merged, ${delivery.ticket} delivering`}
          aria-label={`${delivery.done} of ${delivery.of} tickets merged, ${delivery.ticket} delivering`} className="flex shrink-0 gap-0.5">
          {Array.from({ length: delivery.of }, (_, n) => (
            <b key={n} className={cx("block h-[5px] w-2 rounded-sm", n < delivery.done ? "bg-app-accent-strong" : n === delivery.done ? "bg-[color:var(--info)]" : "bg-app-border-strong")} />
          ))}
        </span>
      )}
    </div>
  );
}
