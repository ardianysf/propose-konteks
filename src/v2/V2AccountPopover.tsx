/*
 * V2AccountPopover — the quiet account panel: Customize, the catalog
 * deep-link, Settings/Billing, Integrations and Keyboard shortcuts, and
 * Log out. Same anchoring/scrim/sheet/Escape/focus system as
 * V2ContextPopover (minimal duplicated scaffolding by design).
 */
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useMockup } from '../state/MockupContext'
import { useOverlayLifecycle } from '../components/shell/OverlayLifecycle'
import { useFocusContainment } from '../components/shell/useFocusContainment'
import {
  applyTheme,
  getStoredPreference,
  subscribeTheme,
  THEME_PREFERENCES,
  type ThemePreference,
} from '../theme'
import {
  BillingIcon,
  GearIcon,
  IntegrationsIcon,
  KeyboardIcon,
  LogoutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from './icons'

interface V2AccountPopoverProps {
  open: boolean
  onClose: () => void
}

const THEME_ICONS: Record<ThemePreference, () => React.JSX.Element> = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
}

export default function V2AccountPopover({ open, onClose }: V2AccountPopoverProps) {
  const { state, dispatch } = useMockup()
  const { beginOverlayChain } = useOverlayLifecycle()
  const rootRef = useRef<HTMLDivElement>(null)

  // Theme preference mirror — subscribed to the real mechanism so the
  // segmented control stays in sync, including the system-scheme flip
  // while in 'system' mode (moved here from the sidebar footer).
  const [themePref, setThemePref] = useState<ThemePreference>(getStoredPreference)
  useEffect(() => subscribeTheme((pref) => setThemePref(pref)), [])

  useFocusContainment(rootRef)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const openOverlayAndClose = (
    event: MouseEvent<HTMLElement>,
    overlay:
      | { kind: 'customize'; tab: 'agents' }
      | { kind: 'settings'; section: 'general' | 'billing' },
  ) => {
    beginOverlayChain(event.currentTarget)
    dispatch({ type: 'OPEN_OVERLAY', overlay })
    onClose()
  }

  return (
    <div
      className={state.sidebarCollapsed ? 'kx-v2-pop kx-v2-pop--rail' : 'kx-v2-pop'}
      data-testid="v2-account-popover"
    >
      <div className="kx-v2-pop__scrim" aria-hidden="true" onClick={onClose} />
      <div
        ref={rootRef}
        tabIndex={-1}
        role="dialog"
        aria-label="Account menu"
        className="kx-v2-pop__panel"
      >
        <span className="kx-v2-pop__handle" aria-hidden="true" />

        {/* Theme — segmented control (Light/Dark/System), the popover's
            only non-row control; kept above the action rows so it reads as
            a display setting, not an account action. */}
        <span className="kx-v2-pop__label">Theme</span>
        <div className="kx-v2-theme kx-v2-theme--menu" role="group" aria-label="Theme">
          {THEME_PREFERENCES.map((pref) => {
            const active = themePref === pref
            const Icon = THEME_ICONS[pref]
            return (
              <button
                key={pref}
                type="button"
                className={
                  active ? 'kx-v2-theme__btn kx-v2-theme__btn--active' : 'kx-v2-theme__btn'
                }
                aria-pressed={active}
                aria-label={
                  pref === 'system' ? 'System theme' : `${pref[0].toUpperCase()}${pref.slice(1)} theme`
                }
                title={pref === 'system' ? 'System' : `${pref[0].toUpperCase()}${pref.slice(1)}`}
                data-testid={`v2-theme-${pref}`}
                onClick={() => applyTheme(pref)}
              >
                <Icon />
              </button>
            )
          })}
        </div>

        <div className="kx-v2-pop__divider" role="presentation" />

        <button
          type="button"
          className="kx-v2-pop__row"
          data-testid="v2-popover-settings"
          onClick={(event) => openOverlayAndClose(event, { kind: 'settings', section: 'general' })}
        >
          <span className="kx-v2-pop__row-icon" aria-hidden="true">
            <GearIcon />
          </span>
          <span className="kx-v2-pop__row-label">Settings</span>
        </button>
        <button
          type="button"
          className="kx-v2-pop__row"
          data-testid="v2-popover-billing"
          onClick={(event) => openOverlayAndClose(event, { kind: 'settings', section: 'billing' })}
        >
          <span className="kx-v2-pop__row-icon" aria-hidden="true">
            <BillingIcon />
          </span>
          <span className="kx-v2-pop__row-label">Billing</span>
        </button>
        <button type="button" className="kx-v2-pop__row" onClick={onClose}>
          <span className="kx-v2-pop__row-icon" aria-hidden="true">
            <IntegrationsIcon />
          </span>
          <span className="kx-v2-pop__row-label">Integrations</span>
        </button>
        <button type="button" className="kx-v2-pop__row" onClick={onClose}>
          <span className="kx-v2-pop__row-icon" aria-hidden="true">
            <KeyboardIcon />
          </span>
          <span className="kx-v2-pop__row-label">Keyboard shortcuts</span>
        </button>

        <div className="kx-v2-pop__divider" role="presentation" />

        <button type="button" className="kx-v2-pop__row" onClick={onClose}>
          <span className="kx-v2-pop__row-icon" aria-hidden="true">
            <LogoutIcon />
          </span>
          <span className="kx-v2-pop__row-label">Log out</span>
        </button>
      </div>
    </div>
  )
}
