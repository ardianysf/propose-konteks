import * as React from "react";
import { cx, ring } from "./cx";

export type ButtonVariant = "default" | "primary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Square button that holds only an icon. Give it an aria-label. */
  iconOnly?: boolean;
  /** Shows a spinner and blocks clicks; keep the label ("Approving"). */
  loading?: boolean;
  /** An amount the action spends, shown after a divider: Approve · 2.15 SP (UX-003). */
  cost?: React.ReactNode;
}

const base =
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded border font-medium no-underline " +
  "cursor-pointer transition-[background-color,border-color,color,scale] duration-150 active:enabled:scale-[.98] " +
  "disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0 " + ring;

const variants: Record<ButtonVariant, string> = {
  default:
    "border-app-border-strong bg-app-card text-app-text hover:enabled:border-app-text-tertiary " +
    "hover:enabled:bg-[color:var(--sunken)] active:enabled:bg-[color:var(--press)]",
  primary:
    "border-app-accent-solid bg-app-accent-solid text-[color:var(--on-accent)] " +
    "hover:enabled:border-[color:var(--accent-hover)] hover:enabled:bg-[color:var(--accent-hover)]",
  ghost:
    "border-transparent bg-transparent text-app-text-secondary hover:enabled:bg-[color:var(--hover)] hover:enabled:text-app-text",
  danger:
    "border-app-border-strong bg-app-card text-app-danger hover:enabled:border-app-danger hover:enabled:bg-[color:var(--danger-soft)]",
};

const sizes: Record<ButtonSize, [string, string]> = {
  sm: ["h-[26px] px-2 text-xs", "w-[26px] px-0"],
  md: ["h-8 px-3 text-sm", "w-8 px-0"],
  lg: ["h-[38px] px-4 text-base", "w-[38px] px-0"],
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "default", size = "md", iconOnly, loading, cost, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(base, variants[variant], sizes[size][0], iconOnly && sizes[size][1], className)}
      {...rest}
    >
      {loading && <span aria-hidden className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />}
      {children}
      {cost != null && (
        <span className="border-l border-[color:var(--edge-current)] pl-1.5 font-mono text-xs opacity-85">{cost}</span>
      )}
    </button>
  );
});
