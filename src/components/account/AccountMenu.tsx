/*
 * AccountMenu — the account floating menu (Task 12, spec §14, AC42).
 *
 * An anchored .kx-menu that opens from the sidebar user row (the user
 * name/avatar trigger), right of the sidebar near its bottom edge. It
 * lists exactly mockData.ACCOUNT_ACTIONS in data order — no renames,
 * reorders, removals, or additions versus the data file (AC42) — with
 * proper menu semantics (role=menu / role=menuitem, roving focus via
 * arrow keys). "Settings" opens the Settings modal on General and
 * "Billing" opens it directly on Billing; the remaining illustrative
 * actions (Integrations, Keyboard shortcuts, Log out) stay represented
 * but simply close the menu without inventing new IA. Escape closes the
 * menu from any focused descendant (AC45).
 *
 * A Theme group (Light / Dark / System — role=menuitemradio, aria-checked)
 * sits in a labelled, divided section before the actions list, mirroring
 * the profile menu's section-label pattern. The section head pairs the
 * label with the active preference name; below it a compact horizontal
 * icon segmented control (sun / moon / monitor, icon-only buttons with
 * accessible names) carries the radios. Theme is a real persisted
 * preference (src/theme.ts, localStorage 'konteks-theme') and lives
 * outside MockupState — no reducer changes.
 */
import { useEffect, useRef, useState } from 'react'
import { ACCOUNT_ACTIONS, type AccountAction } from '../../data/mockData'
import { useMockup } from '../../state/MockupContext'
import { useOverlayLifecycle } from '../shell/OverlayLifecycle'
import {
  applyTheme,
  getStoredPreference,
  THEME_PREFERENCES,
  type ThemePreference,
} from '../../theme'

const THEME_LABELS: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}

/** Sun — the Light theme preference glyph, 16×16 currentColor. */
function SunIcon() {
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

/** Moon — the Dark theme preference glyph, 16×16 currentColor. */
function MoonIcon() {
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

/** Monitor — the System theme preference glyph, 16×16 currentColor. */
function MonitorIcon() {
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

const THEME_ICONS: Record<ThemePreference, () => React.JSX.Element> = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
}

export default function AccountMenu() {
  const { dispatch } = useMockup()
  const { dismissOverlay } = useOverlayLifecycle()
  const menuRef = useRef<HTMLDivElement>(null)
  const [themePref, setThemePref] = useState<ThemePreference>(getStoredPreference)

  // Move focus into the menu on open (§16 keyboard contract) — the first
  // focusable menu item, theme radio or action, matches the roving order.
  useEffect(() => {
    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"], [role="menuitemradio"]')
      ?.focus()
  }, [])

  const handleAction = (action: AccountAction) => {
    if (action.id === 'account-settings') {
      dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'settings', section: 'general' } })
      return
    }
    if (action.id === 'account-billing') {
      dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'settings', section: 'billing' } })
      return
    }
    // Illustrative actions stay represented but safely close — no new IA.
    dismissOverlay()
  }

  const handleTheme = (pref: ThemePreference) => {
    // Theme lives outside MockupState — a real persisted preference, not
    // scenario state — so the menu stays open for instant visual feedback.
    applyTheme(pref)
    setThemePref(pref)
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Account"
      data-testid="account-menu"
      className="kx-menu kx-account-menu"
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          const items = Array.from(
            menuRef.current?.querySelectorAll<HTMLButtonElement>(
              '[role="menuitem"], [role="menuitemradio"]',
            ) ?? [],
          )
          if (items.length === 0) return
          const index = items.indexOf(document.activeElement as HTMLButtonElement)
          const delta = event.key === 'ArrowDown' ? 1 : -1
          const next = items[(index + delta + items.length) % items.length]
          next.focus()
        }
      }}
    >
      {/* Theme preference — grouped section before the actions list, same
          divider + section-label pattern as the profile menu (AC24). The
          head row pairs the section label with the active preference name;
          below it a compact icon segmented control carries the three
          menuitemradio options (sun / moon / monitor, icon-only with the
          accessible name on each button). Theme is a real
          localStorage-backed preference outside MockupState. */}
      <div className="kx-account-menu__theme" role="group" aria-label="Theme">
        <div className="kx-account-menu__theme-head">
          <span className="kx-account-menu__section-label" id="kx-account-menu-theme-label">
            Theme
          </span>
          <span className="kx-account-menu__theme-value">{THEME_LABELS[themePref]}</span>
        </div>
        <div className="kx-account-menu__theme-seg">
          {THEME_PREFERENCES.map((pref) => {
            const active = themePref === pref
            const Icon = THEME_ICONS[pref]
            return (
              <button
                key={pref}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                aria-label={THEME_LABELS[pref]}
                title={THEME_LABELS[pref]}
                className={
                  active
                    ? 'kx-account-menu__theme-seg-btn kx-account-menu__theme-seg-btn--active'
                    : 'kx-account-menu__theme-seg-btn'
                }
                onClick={() => handleTheme(pref)}
              >
                <Icon />
              </button>
            )
          })}
        </div>
      </div>
      {ACCOUNT_ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          role="menuitem"
          className="kx-account-menu__item"
          onClick={() => handleAction(action)}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
