/** Joins class names, skipping falsy values. */
export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

/** Focus ring shared by every interactive element (2px accent-strong, 2px offset). */
export const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent-strong";

/** Exponential ease-out used by every entrance in the system (DESIGN.md › Motion). */
export const EASE = "cubic-bezier(.16,1,.3,1)";
