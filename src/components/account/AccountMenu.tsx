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
 * the profile menu's section-label pattern. Theme is a real persisted
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

/** Check — marks the active theme preference row (mirrors ExecutionProfileMenu). */
function CheckIcon() {
  return (
    <svg data-icon="check" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M3 8.5 6.5 12 13 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
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
          divider + section-label pattern as the profile menu (AC24). Theme
          is a real localStorage-backed preference outside MockupState. */}
      <div className="kx-account-menu__theme" role="group" aria-label="Theme">
        <p className="kx-account-menu__section-label" id="kx-account-menu-theme-label">
          Theme
        </p>
        {THEME_PREFERENCES.map((pref) => {
          const active = themePref === pref
          return (
            <button
              key={pref}
              type="button"
              role="menuitemradio"
              aria-checked={active}
              className={
                active
                  ? 'kx-account-menu__item kx-account-menu__theme-item kx-account-menu__theme-item--active'
                  : 'kx-account-menu__item kx-account-menu__theme-item'
              }
              onClick={() => handleTheme(pref)}
            >
              <span className="kx-account-menu__theme-item-label">{THEME_LABELS[pref]}</span>
              {active && (
                <span className="kx-account-menu__theme-check" aria-hidden="true">
                  <CheckIcon />
                </span>
              )}
            </button>
          )
        })}
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
