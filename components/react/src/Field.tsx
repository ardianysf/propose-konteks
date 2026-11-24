import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cx } from "./cx";

/** Label above, hint below, error that says how to fix it (DESIGN.md › Forms). */
export interface FieldProps {
  label: React.ReactNode;
  /** Shown after the label in tertiary ink, e.g. "required" or "optional". */
  note?: React.ReactNode;
  hint?: React.ReactNode;
  /** The problem and the fix, e.g. "Enter a full URL, like https://github.com/owner/skills". */
  error?: React.ReactNode;
  /** One form control. It receives id, aria-describedby and aria-invalid. */
  children: React.ReactElement;
  className?: string;
}

export function Field({ label, note, hint, error, children, className }: FieldProps) {
  const id = React.useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const control = React.cloneElement(children, {
    id: children.props.id ?? id,
    "aria-describedby": cx(children.props["aria-describedby"], errId, hintId) || undefined,
    "aria-invalid": error ? true : children.props["aria-invalid"],
  });
  return (
    <div className={cx("grid min-w-0 content-start gap-1.5", className)}>
      <label htmlFor={children.props.id ?? id} className="flex items-baseline gap-1.5 text-sm font-medium text-app-text">
        {label}
        {note && <span className="text-xs font-normal leading-none text-app-text-tertiary">{note}</span>}
      </label>
      {control}
      {error && (
        <p id={errId} className="flex items-center gap-1.5 text-xs text-app-danger">
          <AlertCircle aria-hidden className="size-3.5 shrink-0" strokeWidth={1.75} />
          {error}
        </p>
      )}
      {hint && <p id={hintId} className="text-xs text-app-text-tertiary">{hint}</p>}
    </div>
  );
}
