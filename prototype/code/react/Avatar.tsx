import * as React from "react";
import { Bot } from "lucide-react";
import { cx } from "./cx";

export interface AvatarProps {
  /** Two letters, e.g. "AY". Ignored for the agent. */
  initials?: string;
  /** Full name, used as the tooltip and accessible name. */
  name: string;
  /** Konteks itself: the bot mark on Deep Moss. */
  agent?: boolean;
  size?: 22 | 24 | 26 | 28 | 32;
  /** Accent ring for "your move" (Work In Progress). */
  mine?: boolean;
  className?: string;
}

/** Avatar: initials on Mist Green, or the Konteks mark for the agent. */
export function Avatar({ initials, name, agent, size = 26, mine, className }: AvatarProps) {
  return (
    <span
      title={name}
      role="img"
      aria-label={name}
      style={{ width: size, height: size }}
      className={cx(
        "inline-grid shrink-0 place-items-center rounded-full text-xs font-semibold",
        agent ? "bg-app-accent-solid text-[color:var(--on-accent)] [&_svg]:size-[13px]" : "bg-app-accent-soft text-app-accent-text",
        mine && "shadow-[0_0_0_1px_var(--line-accent)]",
        className,
      )}
    >
      {agent ? <Bot aria-hidden strokeWidth={1.75} /> : initials}
    </span>
  );
}
