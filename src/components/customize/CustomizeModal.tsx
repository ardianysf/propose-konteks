/*
 * CustomizeModal — the fixed 790×580 Customize shell (Task 9 Part A,
 * spec §11, AC34/AC35).
 *
 * Frame-only contract: one modal backdrop + one centered dialog whose
 * size is pinned through the --kx-customize-w/--kx-customize-h tokens
 * (790×580) on every tab — the frame never resizes and never remounts
 * when tabs switch (AC34). The fixed header (title + close) and the
 * role=tablist nav sit outside the sole .kx-customize__content scroll
 * region, so only tab content ever scrolls (AC35). The tab order is
 * exactly Agents, Context, MCP, Connectors, VCS, Skills, Tools (§11);
 * the selected tab comes from overlay.tab, and tab buttons dispatch
 * SET_CUSTOMIZE_TAB in place. Each tab mounts its own content
 * component: AgentsTab, ContextTab, the parameterized
 * IntegrationsTab (MCP / Connectors / VCS), and the preserved
 * SkillsTab / ToolsTab driven by the preservedContent adapter.
 */
import { useId, useRef } from 'react'
import { useMockup } from '../../state/MockupContext'
import { useOverlayLifecycle } from '../shell/OverlayLifecycle'
import { useFocusContainment } from '../shell/useFocusContainment'
import { DEFAULT_CUSTOMIZE_TAB, type CustomizeTab } from '../../state/mockupReducer'
import AgentsTab from './AgentsTab'
import ContextTab from './ContextTab'
import IntegrationsTab from './IntegrationsTab'
import SkillsTab from './SkillsTab'
import ToolsTab from './ToolsTab'

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

/** The seven §11 tabs — order is part of the contract. */
const TABS: ReadonlyArray<{ id: CustomizeTab; label: string }> = [
  { id: 'agents', label: 'Agents' },
  { id: 'context', label: 'Context' },
  { id: 'mcp', label: 'MCP' },
  { id: 'connectors', label: 'Connectors' },
  { id: 'vcs', label: 'VCS' },
  { id: 'skills', label: 'Skills' },
  { id: 'tools', label: 'Tools' },
]

/** Mounts only the selected tab's content component. */
function TabPanelContent({ tab }: { tab: CustomizeTab }) {
  switch (tab) {
    case 'agents':
      return <AgentsTab />
    case 'context':
      return <ContextTab />
    case 'mcp':
      return <IntegrationsTab variant="mcp" />
    case 'connectors':
      return <IntegrationsTab variant="connectors" />
    case 'vcs':
      return <IntegrationsTab variant="vcs" />
    case 'skills':
      return <SkillsTab />
    case 'tools':
      return <ToolsTab />
  }
}

export default function CustomizeModal() {
  const { state, dispatch } = useMockup()
  const { dismissOverlay } = useOverlayLifecycle()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  // The selected tab comes from the overlay payload; the default only
  // guards a defensive render outside the customize overlay.
  const overlay = state.overlay
  const tab: CustomizeTab = overlay.kind === 'customize' ? overlay.tab : DEFAULT_CUSTOMIZE_TAB

  // Shared focus containment owns initial focus, Tab trapping, and the
  // focusin safety net (Task 13); Escape is owned by OverlayLifecycle.
  useFocusContainment(dialogRef)

  const close = () => dismissOverlay()

  const tabButtonId = (id: CustomizeTab) => `kx-customize-tab-${id}`
  const panelId = 'kx-customize-panel'

  return (
    <>
      <div className="kx-modal-backdrop" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid="customize-modal"
        className="kx-modal kx-customize"
      >
        {/* Fixed header — title + dismiss control, outside the scroll region. */}
        <header className="kx-customize__head">
          <h2 id={titleId} className="kx-customize__title">
            Customize
          </h2>
          <button
            type="button"
            className="kx-icon-btn kx-customize__close"
            aria-label="Close"
            onClick={close}
          >
            <CloseIcon />
          </button>
        </header>

        {/* Fixed tab nav — the exact §11 order; switching happens in
            place through SET_CUSTOMIZE_TAB, never by remounting the
            frame (AC34). */}
        <div role="tablist" aria-label="Customize tabs" className="kx-customize__nav">
          {TABS.map((entry) => {
            const selected = entry.id === tab
            return (
              <button
                key={entry.id}
                type="button"
                role="tab"
                id={tabButtonId(entry.id)}
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                className={
                  selected
                    ? 'kx-customize__tab kx-customize__tab--active'
                    : 'kx-customize__tab'
                }
                onClick={() => dispatch({ type: 'SET_CUSTOMIZE_TAB', tab: entry.id })}
              >
                {entry.label}
              </button>
            )
          })}
        </div>

        {/* The sole scrolling region — only this area scrolls (AC35). */}
        <div className="kx-customize__content">
          <div
            role="tabpanel"
            id={panelId}
            aria-labelledby={tabButtonId(tab)}
            className="kx-customize__panel"
          >
            <TabPanelContent tab={tab} />
          </div>
        </div>
      </div>
    </>
  )
}
