import * as React from "react";
import { cx } from "./cx";

const control =
  "w-full min-w-0 rounded border border-app-border-input bg-app-card text-sm text-app-text " +
  "placeholder:text-app-text-tertiary transition-[border-color,box-shadow] duration-150 hover:border-app-text-secondary " +
  "focus:border-app-accent-strong focus:shadow-[0_0_0_3px_var(--focus)] focus:outline-none " +
  "aria-[invalid=true]:border-app-danger aria-[invalid=true]:focus:shadow-[0_0_0_3px_var(--edge-danger)] " +
  "disabled:cursor-not-allowed disabled:bg-[color:var(--sunken)] disabled:text-app-text-tertiary " +
  /* 16px on phones so iOS does not zoom into the field. */
  "max-[860px]:text-[16px]";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cx(control, "h-[34px] px-2.5", className)} {...rest} />;
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Grow with the content instead of scrolling (UX-015). */
  autosize?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, autosize, onInput, ...rest },
  ref,
) {
  const inner = React.useRef<HTMLTextAreaElement | null>(null);
  React.useImperativeHandle(ref, () => inner.current as HTMLTextAreaElement);
  const fit = React.useCallback(() => {
    const t = inner.current;
    if (!t || !autosize) return;
    t.style.height = "auto";
    t.style.height = t.scrollHeight + 2 + "px";
  }, [autosize]);
  React.useLayoutEffect(fit, [fit, rest.value]);
  return (
    <textarea
      ref={inner}
      onInput={e => { fit(); onInput?.(e); }}
      className={cx(control, "min-h-[88px] px-2.5 py-2 leading-normal", autosize ? "resize-none overflow-hidden" : "resize-y", className)}
      {...rest}
    />
  );
});
