/*
 * V2AccountPopover — the quiet account panel: Customize, the catalog
 * deep-link, Settings/Billing, Integrations and Keyboard shortcuts, and
 * Log out. Same anchoring/scrim/sheet/Escape/focus system as
 * V2ContextPopover (minimal duplicated scaffolding by design).
 */
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useMockup } from '../state/MockupContext'
import { usePrototypeLocale } from '../i18n/prototypeLocale'
import type { OpenOverlayPayload } from '../state/mockupReducer'
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
  const { t } = usePrototypeLocale()
  const { beginOverlayChain } = useOverlayLifecycle()
  const rootRef = useRef<HTMLDivElement>(null)
  const [shortcuts, setShortcuts] = useState(false)
  const go = (route: 'profile' | 'settings-page' | 'work-locally' | 'support') => { dispatch({ type: 'NAVIGATE_PRODUCT', route }); onClose() }

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
    overlay: OpenOverlayPayload,
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
        aria-label={t('accountMenu')}
        className="kx-v2-pop__panel"
      >
        <span className="kx-v2-pop__handle" aria-hidden="true" />
        <button type="button" className="kx-v2-pop__row" onClick={() => go('profile')}><span className="kx-v2-pop__row-label">Profile</span></button>
        <button type="button" className="kx-v2-pop__row" onClick={() => go('work-locally')}><span className="kx-v2-pop__row-label">Work Locally</span></button>
        <button type="button" className="kx-v2-pop__row" onClick={() => go('support')}><span className="kx-v2-pop__row-label">Support</span></button>

        {/* Theme — segmented control (Light/Dark/System), the popover's
            only non-row control; kept above the action rows so it reads as
            a display setting, not an account action. */}
        <span className="kx-v2-pop__label">{t('theme')}</span>
        <div className="kx-v2-theme kx-v2-theme--menu" role="group" aria-label={t('theme')}>
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
          onClick={() => { dispatch({ type: 'NAVIGATE_PRODUCT', route: 'settings-page', settingsSection: 'general' }); onClose() }}
        >
          <span className="kx-v2-pop__row-icon" aria-hidden="true">
            <GearIcon />
          </span>
          <span className="kx-v2-pop__row-label">{t('settings')}</span>
        </button>
        <button
          type="button"
          className="kx-v2-pop__row"
          data-testid="v2-popover-billing"
          onClick={() => { dispatch({ type: 'NAVIGATE_PRODUCT', route: 'settings-page', settingsSection: 'usage' }); onClose() }}
        >
          <span className="kx-v2-pop__row-icon" aria-hidden="true">
            <BillingIcon />
          </span>
          <span className="kx-v2-pop__row-label">{t('billing')}</span>
        </button>
        <button type="button" className="kx-v2-pop__row" onClick={(event) => openOverlayAndClose(event, { kind: 'customize', destination: { section: 'connections', subtab: 'mcp' } })}>
          <span className="kx-v2-pop__row-icon" aria-hidden="true">
            <IntegrationsIcon />
          </span>
          <span className="kx-v2-pop__row-label">{t('integrations')}</span>
        </button>
        <button type="button" className="kx-v2-pop__row" aria-expanded={shortcuts} onClick={() => setShortcuts(!shortcuts)}>
          <span className="kx-v2-pop__row-icon" aria-hidden="true">
            <KeyboardIcon />
          </span>
          <span className="kx-v2-pop__row-label">{t('shortcuts')}</span>
        </button>
        {shortcuts && <div className="kx-product-reference-note"><p>⌘K / Ctrl+K — Search</p><p>Escape — Close dialog or menu</p><p>Tab / Shift+Tab — Move focus</p></div>}

        <div className="kx-v2-pop__divider" role="presentation" />

        <button type="button" className="kx-v2-pop__row" onClick={() => { dispatch({ type: 'PRODUCT', action: { kind: 'session', signedOut: true } }); onClose() }}>
          <span className="kx-v2-pop__row-icon" aria-hidden="true">
            <LogoutIcon />
          </span>
          <span className="kx-v2-pop__row-label">{t('logout')}</span>
        </button>
      </div>
    </div>
  )
}
