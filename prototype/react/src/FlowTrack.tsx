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
  /** Only the current step keeps its name. "auto" (default) does this when the track's container is under 600px:
      put the track inside an element with `[container-type:inline-size]` (QueueRow does). */
  compact?: boolean | "auto";
}

const ringTone: Record<FlowTone, string> = {
  decision: "border-app-accent-strong shadow-[0_0_0_3px_var(--accent-soft)]",
  blocked: "border-app-danger shadow-[0_0_0_3px_var(--danger-soft)]",
  waiting: "border-app-text-tertiary shadow-[0_0_0_3px_var(--sunken)]",
  running: "border-[color:var(--info)] shadow-[0_0_0_3px_var(--info-soft)] animate-[kx-flow-run_2.4s_cubic-bezier(.16,1,.3,1)_infinite]",
};

/** Flow track (signature): where an initiative stands on the governed flow. Done steps are filled moss dots,
    the current step is a ring in the row's tone and named in 600, upcoming steps are hollow. Five fixed slots of up to
    140px, so a step reads as a column down the queue. The step is read from the stage and the cause the row shows. */
export function FlowTrack({ current, tone = "decision", delivery, compact = "auto" }: FlowTrackProps) {
  const hide = compact === true ? "hidden" : compact === "auto" ? "[@container(max-width:600px)]:hidden" : "";
  return (
    <ol aria-label={`Flow: ${FLOW[current]} of ${FLOW.join(", ")}`}
      className={cx("m-0 mt-0.5 list-none p-0 text-xs text-app-text-tertiary",
        compact === true ? "flex flex-wrap items-center gap-y-1" : "grid grid-cols-[repeat(5,minmax(0,140px))]",
        compact === "auto" && "[@container(max-width:600px)]:flex [@container(max-width:600px)]:flex-wrap [@container(max-width:600px)]:items-center [@container(max-width:600px)]:gap-y-1")}>
      {FLOW.map((step, k) => {
        const done = k < current, cur = k === current, last = k === FLOW.length - 1;
        return (
          <li key={step} aria-current={cur ? "step" : undefined} className={cx("flex min-w-0 items-center gap-1.5", done && "text-app-text-secondary", cur && "font-semibold text-app-text")}>
            <i className={cx("block shrink-0 rounded-full",
              cur ? cx("size-[11px] border-2 bg-app-card", ringTone[tone]) : done ? "size-[9px] border-[1.5px] border-app-accent-strong bg-app-accent-strong" : "size-[9px] border-[1.5px] border-app-border-strong bg-app-card")} />
            <span className={cx("truncate", !cur && hide)}>{step}</span>
            {cur && delivery && (
              <span role="img" title={`${delivery.done} of ${delivery.of} tickets merged, ${delivery.ticket} delivering`}
                aria-label={`${delivery.done} of ${delivery.of} tickets merged, ${delivery.ticket} delivering`} className="ml-0.5 flex shrink-0 gap-0.5">
                {Array.from({ length: delivery.of }, (_, n) => (
                  <b key={n} className={cx("block h-[5px] w-3 rounded-sm", n < delivery.done ? "bg-app-accent-strong" : n === delivery.done ? "bg-[color:var(--info)]" : "bg-app-border-strong")} />
                ))}
              </span>
            )}
            {!last && <span aria-hidden className={cx("ml-1 mr-1.5 h-px min-w-2 flex-1", done ? "bg-app-accent-strong" : "bg-app-border-strong",
              compact === true ? "w-4 flex-none" : compact === "auto" ? "[@container(max-width:600px)]:w-4 [@container(max-width:600px)]:flex-none" : "")} />}
          </li>
        );
      })}
    </ol>
  );
}
