/*
 * SettingsModal — the Settings modal (Task 12, spec §14, AC42).
 *
 * A centered raised .kx-modal preserving the existing Settings structure
 * exactly as sourced from mockData.settings.sections: three sections —
 * General, Billing, Team — with Billing exposing exactly Usage, Plans,
 * Providers, Budgets, Top Up, Transactions (AC42). No renames, reorders,
 * removals, or additions versus the data file. Section navigation is a
 * role=tablist with role=tab / role=tabpanel semantics (aria-selected,
 * roving tabindex, arrow-key movement); Billing's sub-sections use the
 * same selected/current tab semantics inside the Billing panel. Content
 * is static illustrative refresh (AC46) — no backend, nothing persists.
 * The dialog carries an accessible name, moves focus in on mount, keeps
 * a header close control, and Escape closes from any focused descendant
 * through a single document listener (AC45).
 */
import {
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { ILLUSTRATIVE_DATA_NOTE, SETTINGS_SECTIONS } from '../../data/mockData'
import { useMockup } from '../../state/MockupContext'
import { DEFAULT_SETTINGS_SECTION, type SettingsSection } from '../../state/mockupReducer'
import { useOverlayLifecycle } from '../shell/OverlayLifecycle'
import { useFocusContainment } from '../shell/useFocusContainment'
import './SettingsModal.css'

/** Close — the header dismiss control. */
function CloseIcon() {
  return (
    <svg
      data-icon="close"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 4l8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** The three §14 sections — id + label come straight from mockData. */
const SECTIONS: ReadonlyArray<{ id: SettingsSection; label: string }> = SETTINGS_SECTIONS.map(
  (section) => ({ id: section.id as SettingsSection, label: section.label }),
)

const BILLING_SECTION = SETTINGS_SECTIONS.find((section) => section.id === 'billing')!
const BILLING_SUBTABS: readonly string[] = BILLING_SECTION.subTabs

const SECTION_PANEL_ID = 'kx-settings-section-panel'
const BILLING_PANEL_ID = 'kx-settings-billing-panel'

const sectionTabId = (id: SettingsSection) => `kx-settings-section-${id}`
const billingTabId = (label: string) =>
  `kx-settings-billing-tab-${label.toLowerCase().replace(/\s+/g, '-')}`

/** Roving-tabindex arrow/Home/End keyboard movement for both tablists. */
function tablistKeyHandler<T extends string>(
  event: ReactKeyboardEvent<HTMLButtonElement>,
  items: readonly T[],
  current: T,
  select: (next: T) => void,
  idFor: (next: T) => string,
) {
  const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End']
  if (!keys.includes(event.key)) return
  event.preventDefault()
  const index = items.indexOf(current)
  let next = -1
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      next = index + 1
      break
    case 'ArrowUp':
    case 'ArrowLeft':
      next = index - 1
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = items.length - 1
      break
  }
  const wrapped = (next + items.length) % items.length
  const target = items[wrapped]
  select(target)
  document.getElementById(idFor(target))?.focus()
}

/** A single illustrative definition row — static, no persistence (AC46). */
function Field({ term, value }: { term: string; value: string }) {
  return (
    <div className="kx-settings__field">
      <dt className="kx-settings__field-term">{term}</dt>
      <dd className="kx-settings__field-value">{value}</dd>
    </div>
  )
}

// Illustrative content for the General and Team sections. Every value is
// a placeholder, not a production fact (spec AC46).
const GENERAL_ROWS: ReadonlyArray<readonly [string, string]> = [
  ['Workspace', 'Refactory'],
  ['Plan', 'Team plan'],
  ['Language', 'English'],
  ['Timezone', 'Asia/Jakarta'],
]

const TEAM_ROWS: ReadonlyArray<readonly [string, string]> = [
  ['Members', '8 seats · 6 active'],
  ['Your role', 'Administrator'],
  ['Domain', 'refactory.dev'],
]

const BILLING_ROWS: Record<string, ReadonlyArray<readonly [string, string]>> = {
  Usage: [
    ['Requests this month', '42,810'],
    ['Storage', '18.2 GB'],
    ['Sessions', '126'],
  ],
  Plans: [
    ['Current plan', 'Team plan'],
    ['Seats', '8'],
    ['Renewal', 'Sep 1, 2026'],
  ],
  Providers: [
    ['Primary', 'OpenAI'],
    ['Secondary', 'Anthropic'],
  ],
  Budgets: [
    ['Monthly limit', '$500'],
    ['Spent', '$212.40'],
  ],
  'Top Up': [
    ['Balance', '$87.60'],
    ['Last top up', 'Aug 12, 2026'],
  ],
  Transactions: [
    ['Latest', 'Aug 16, 2026 — $24.00'],
    ['Count', '9 this month'],
  ],
}

function GeneralPanel() {
  return (
    <>
      <h3 className="kx-settings__panel-title">General</h3>
      <dl className="kx-settings__list">
        {GENERAL_ROWS.map(([term, value]) => (
          <Field key={term} term={term} value={value} />
        ))}
      </dl>
      <p className="kx-settings__note">
        {ILLUSTRATIVE_DATA_NOTE} — nothing here persists in this mockup.
      </p>
    </>
  )
}

function TeamPanel() {
  return (
    <>
      <h3 className="kx-settings__panel-title">Team</h3>
      <dl className="kx-settings__list">
        {TEAM_ROWS.map(([term, value]) => (
          <Field key={term} term={term} value={value} />
        ))}
      </dl>
      <p className="kx-settings__note">
        {ILLUSTRATIVE_DATA_NOTE} — team membership is illustrative only.
      </p>
    </>
  )
}

function BillingPanel({
  subtab,
  onSelect,
  onSubtabKeyDown,
}: {
  subtab: string
  onSelect: (tab: string) => void
  onSubtabKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => void
}) {
  const rows = BILLING_ROWS[subtab] ?? []
  return (
    <>
      {/* Billing sub-sections — the exact six from mockData, same
          selected/current tab semantics as the section nav. */}
      <div role="tablist" aria-label="Billing sections" className="kx-settings__subtabs">
        {BILLING_SUBTABS.map((tab) => {
          const selected = tab === subtab
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              id={billingTabId(tab)}
              aria-selected={selected}
              aria-controls={BILLING_PANEL_ID}
              tabIndex={selected ? 0 : -1}
              className={
                selected
                  ? 'kx-settings__subtab kx-settings__subtab--active'
                  : 'kx-settings__subtab'
              }
              onClick={() => onSelect(tab)}
              onKeyDown={onSubtabKeyDown}
            >
              {tab}
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        id={BILLING_PANEL_ID}
        aria-labelledby={billingTabId(subtab)}
        className="kx-settings__content"
      >
        <h3 className="kx-settings__panel-title">{subtab}</h3>
        <dl className="kx-settings__list">
          {rows.map(([term, value]) => (
            <Field key={term} term={term} value={value} />
          ))}
        </dl>
        <p className="kx-settings__note">
          {ILLUSTRATIVE_DATA_NOTE} — billing figures are placeholders, not production facts.
        </p>
      </div>
    </>
  )
}

export default function SettingsModal() {
  const { state, dispatch } = useMockup()
  const { dismissOverlay } = useOverlayLifecycle()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  // The selected section comes from the overlay payload; the default only
  // guards a defensive render outside the settings overlay.
  const overlay = state.overlay
  const section: SettingsSection =
    overlay.kind === 'settings' ? overlay.section : DEFAULT_SETTINGS_SECTION
  const [subtab, setSubtab] = useState<string>(BILLING_SUBTABS[0])

  // Shared focus containment owns initial focus, Tab trapping, and the
  // focusin safety net (Task 13); Escape is owned by OverlayLifecycle.
  useFocusContainment(dialogRef)

  const close = () => dismissOverlay()

  const sectionKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) =>
    tablistKeyHandler(
      event,
      SECTIONS.map((entry) => entry.id),
      section,
      (id) => dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'settings', section: id } }),
      sectionTabId,
    )

  const subtabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) =>
    tablistKeyHandler(event, BILLING_SUBTABS, subtab, (next) => setSubtab(next), billingTabId)

  return (
    <>
      <div className="kx-modal-backdrop" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid="settings-modal"
        className="kx-modal kx-settings"
      >
        {/* Fixed header — title + dismiss control. */}
        <header className="kx-settings__head">
          <h2 id={titleId} className="kx-settings__title">
            Settings
          </h2>
          <button
            type="button"
            className="kx-icon-btn kx-settings__close"
            aria-label="Close"
            onClick={close}
          >
            <CloseIcon />
          </button>
        </header>

        <div className="kx-settings__body">
          {/* Section nav — General / Billing / Team from mockData, in
              that exact order, with role=tab semantics. */}
          <div role="tablist" aria-label="Settings sections" className="kx-settings__sections">
            {SECTIONS.map((entry) => {
              const selected = entry.id === section
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  id={sectionTabId(entry.id)}
                  aria-selected={selected}
                  aria-controls={SECTION_PANEL_ID}
                  tabIndex={selected ? 0 : -1}
                  className={
                    selected
                      ? 'kx-settings__section kx-settings__section--active'
                      : 'kx-settings__section'
                  }
                  onClick={() =>
                    dispatch({
                      type: 'OPEN_OVERLAY',
                      overlay: { kind: 'settings', section: entry.id },
                    })
                  }
                  onKeyDown={sectionKeyDown}
                >
                  {entry.label}
                </button>
              )
            })}
          </div>

          {/* The sole scroll region — only section content scrolls. */}
          <div
            role="tabpanel"
            id={SECTION_PANEL_ID}
            aria-labelledby={sectionTabId(section)}
            className="kx-settings__panel"
          >
            {section === 'general' ? (
              <GeneralPanel />
            ) : section === 'billing' ? (
              <BillingPanel
                subtab={subtab}
                onSelect={(next) => setSubtab(next)}
                onSubtabKeyDown={subtabKeyDown}
              />
            ) : (
              <TeamPanel />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
