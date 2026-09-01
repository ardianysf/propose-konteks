/*
 * V2 icon glyphs — drawn SVGs in the SAME stroke family as the existing
 * shell chrome (16×16 viewBox, 1.4–1.8 currentColor strokes, no emoji).
 * The originals in Sidebar.tsx / AccountMenu.tsx are module-private, so
 * the glyphs are reproduced verbatim here for the V2 sidebar; CollapseIcon
 * is shared via its module export. Logo assets are reused by URL. The V2
 * popovers extend the same family (clock, plus, map, nut, card, plug,
 * keyboard, logout — all 16-viewBox currentColor strokes).
 */

/** Chevron-right — marks controls whose menus open to the right. */
export function ChevronRight() {
  return (
    <svg
      className="kx-v2-chevron"
      data-icon="chevron-right"
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6 3.5 10.5 8 6 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Chevron-down — marks the v2 popover triggers (panels open below/beside). */
export function GridIcon() {
  return (
    <svg
      data-icon="grid"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" />
    </svg>
  )
}

export function ClockIcon() {
  return (
    <svg
      data-icon="clock"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 4.8V8l2.2 1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* Proper sidebar-collapse glyph: a panel with its own divider and a
 * directional chevron — left when the sidebar can collapse, right when
 * the rail can expand. */
export function PanelCollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      data-icon="panel-collapse"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="1.75"
        y="3"
        width="12.5"
        height="10"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <line x1="5.25" y1="3" x2="5.25" y2="13" stroke="currentColor" strokeWidth="1.3" />
      {collapsed ? (
        <path
          d="M9.6 6.2 11.4 8l-1.8 1.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M11.4 6.2 9.6 8l1.8 1.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

export function CheckIcon() {
  return (
    <svg
      data-icon="check"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 8.5 6.2 11.5 13 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChevronDown() {
  return (
    <svg
      className="kx-v2-chevron"
      data-icon="chevron-down"
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3.5 6 8 10.5 12.5 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Chevron-right — doubles as the per-session task-children disclosure
 * glyph (rotated 90° by CSS when open). */
export function TaskChevronIcon() {
  return (
    <svg
      className="kx-v2-chevron"
      data-icon="task-chevron"
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6 3.5 10.5 8 6 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Ticket — the task-session row glyph (same drawing as the task session
 * page banner icon). */
export function TicketIcon() {
  return (
    <svg
      className="kx-v2-chevron"
      data-icon="ticket"
      viewBox="0 0 16 16"
      width="13"
      height="13"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="4" width="12" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 4v8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.6 1.6" strokeLinecap="round" />
    </svg>
  )
}

/** Clock — the Sessions route glyph. */
export function SessionsIcon() {
  return (
    <svg
      data-icon="sessions"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 4.75V8l2.4 1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Magnifier — the search trigger and palette input glyph. */
export function SearchIcon() {
  return (
    <svg
      data-icon="search"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="7" cy="7" r="4.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.6 10.6L14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Plus — the rail-mode New session control and the create-system row. */
export function PlusIcon() {
  return (
    <svg
      data-icon="plus"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 3v10M3 8h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Map/diagram — opens the per-system architecture map modal (as SystemMenu). */
export function SystemMapIcon() {
  return (
    <svg
      data-icon="system-map"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1.75" y="1.75" width="4.5" height="4.5" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9.75" y="1.75" width="4.5" height="4.5" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="5.75" y="9.75" width="4.5" height="4.5" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M6.25 4h3.5M4 6.25 6.5 9.75M12 6.25 9.5 9.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Hex nut — the Settings row glyph (distinct from the sun/monitor pair). */
export function GearIcon() {
  return (
    <svg
      data-icon="settings"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 1.75 13.4 4.9v6.2L8 14.25 2.6 11.1V4.9L8 1.75Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

/** Credit card — the Billing row glyph. */
export function BillingIcon() {
  return (
    <svg
      data-icon="billing"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="1.75"
        y="3.25"
        width="12.5"
        height="9.5"
        rx="1.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M1.75 6.25h12.5M4.5 9.75h3.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Plug — the Integrations row glyph. */
export function IntegrationsIcon() {
  return (
    <svg
      data-icon="integrations"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5.75 1.75v3M10.25 1.75v3M3.5 4.75h9v2.5a4.5 4.5 0 0 1-9 0ZM8 11.75v2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Keyboard — the Keyboard shortcuts row glyph. */
export function KeyboardIcon() {
  return (
    <svg
      data-icon="keyboard"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="1.25"
        y="3.75"
        width="13.5"
        height="8.5"
        rx="1.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4 6.5h.01M6.5 6.5h.01M9.5 6.5h.01M12 6.5h.01M4.75 9.5h6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Door + arrow — the Log out row glyph. */
export function LogoutIcon() {
  return (
    <svg
      data-icon="logout"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6.5 13.5H4A1.5 1.5 0 0 1 2.5 12V4A1.5 1.5 0 0 1 4 2.5h2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10.75 11.25 13.5 8l-2.75-3.25M13.5 8H6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Square + plus — the New session route control's icon. */
export function NewSessionIcon() {
  return (
    <svg
      data-icon="new-session"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="2.25"
        y="2.25"
        width="11.5"
        height="11.5"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 5.5v5M5.5 8h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** 2×2 grid — the active-system glyph (same pattern as the old sidebar). */
export function SystemIcon() {
  return (
    <svg
      data-icon="system"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2.25" y="2.25" width="5" height="5" rx="1.5" fill="currentColor" />
      <rect x="8.75" y="2.25" width="5" height="5" rx="1.5" fill="currentColor" />
      <rect x="2.25" y="8.75" width="5" height="5" rx="1.5" fill="currentColor" />
      <rect x="8.75" y="8.75" width="5" height="5" rx="1.5" fill="currentColor" />
    </svg>
  )
}

/** Pin — outline (unpinned) / filled (pinned) glyph, 14×14 currentColor. */
export function PinIcon({ pinned }: { pinned: boolean }) {
  return (
    <svg
      data-icon="pin"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9.5 2.5 13.5 6.5 12 8l-.75-.75-2.19 2.19.44 2.56-1.5 1.5-2.5-2.5-2.75 2.75-.75-.75L5 11.25 2.5 8.75 4 7.25l2.56.44L8.75 5.5 8 4.75l1.5-2.25Z"
        fill={pinned ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Sliders — the Customize glyph. */
export function SlidersIcon() {
  return (
    <svg
      data-icon="sliders"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2 4.25h6.6M12.4 4.25H14M2 8h1.6M7.4 8H14M2 11.75h8.6M13.4 11.75H14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="10.5" cy="4.25" r="1.9" fill="var(--kx-raised)" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="5.5" cy="8" r="1.9" fill="var(--kx-raised)" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="11.5" cy="11.75" r="1.9" fill="var(--kx-raised)" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

/** 3×3 dots — the component-catalog deep-link glyph. */
export function CatalogIcon() {
  return (
    <svg
      data-icon="catalog"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="3" cy="3" r="1.4" fill="currentColor" />
      <circle cx="8" cy="3" r="1.4" fill="currentColor" />
      <circle cx="13" cy="3" r="1.4" fill="currentColor" />
      <circle cx="3" cy="8" r="1.4" fill="currentColor" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" />
      <circle cx="13" cy="8" r="1.4" fill="currentColor" />
      <circle cx="3" cy="13" r="1.4" fill="currentColor" />
      <circle cx="8" cy="13" r="1.4" fill="currentColor" />
      <circle cx="13" cy="13" r="1.4" fill="currentColor" />
    </svg>
  )
}

/** Sun — the Light theme preference glyph (same family as AccountMenu). */
export function SunIcon() {
  return (
    <svg data-icon="sun" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1.75v1.5M8 12.75v1.5M1.75 8h1.5M12.75 8h1.5M3.6 3.6l1.05 1.05M11.35 11.35l1.05 1.05M3.6 12.4l1.05-1.05M11.35 4.65l1.05-1.05"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Moon — the Dark theme preference glyph. */
export function MoonIcon() {
  return (
    <svg data-icon="moon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M13.5 9.5A5.75 5.75 0 0 1 6.5 2.5a5.75 5.75 0 1 0 7 7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Monitor — the System theme preference glyph. */
export function MonitorIcon() {
  return (
    <svg data-icon="monitor" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <rect
        x="2"
        y="3"
        width="12"
        height="8.5"
        rx="1.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5.75 14h4.5M8 11.5V14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
