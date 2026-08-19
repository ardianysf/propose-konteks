/*
 * CollapseIcon — the shared double-chevron glyph for the sidebar
 * minimize/maximize control (AC12). Rendered inside the shell sidebar's
 * brand row (top-right while expanded; inside the rail logo maximize
 * affordance while collapsed); the direction points where the sidebar
 * will move on the next toggle.
 */

/** Double chevron pointing the direction the sidebar will move (AC12). */
export default function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      data-icon={collapsed ? 'expand-sidebar' : 'collapse-sidebar'}
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={
          collapsed
            ? 'M7 3.5 11.5 8 7 12.5M3.5 3.5 8 8l-4.5 4.5'
            : 'M9 3.5 4.5 8 9 12.5M12.5 3.5 8 8l4.5 4.5'
        }
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
