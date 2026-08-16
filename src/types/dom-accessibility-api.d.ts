/*
 * Ambient types for dom-accessibility-api 0.5.x.
 *
 * The published package ships declaration files in dist/ but its package.json
 * "exports" map only declares "import"/"require" entry points (no "." root and
 * no "types" condition), so bundler-mode resolution cannot locate the .d.ts.
 * This shim pins the two symbols the a11y contracts actually use.
 */
declare module 'dom-accessibility-api' {
  export function computeAccessibleName(root: Element, options?: unknown): string
  export function computeAccessibleDescription(root: Element, options?: unknown): string
}
