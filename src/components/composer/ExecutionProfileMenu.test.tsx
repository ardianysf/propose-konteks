import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { getAggregatedCss } from '../../test/cssAggregate'
import Composer from './Composer'
import { OverlayLifecycleProvider } from '../shell/OverlayLifecycle'
import { MockupContext, useMockup } from '../../state/MockupContext'
import {
  initialState,
  mockupReducer,
  type MockupOverlay,
  type MockupState,
} from '../../state/mockupReducer'
import { EXECUTION_PROFILES, WORKSPACE_SETTINGS } from '../../data/mockData'

// ---------------------------------------------------------------------------
// Harness — the Composer under the real reducer via the mockup context,
// exactly as NewSessionPage mounts it. The anchored menu is expected to
// mount from the Composer while overlay.kind === 'execution-profile-menu'
// (Task 6), so tests open it through the real trigger. A state bucket
// captures the committed store for dispatch assertions.
// ---------------------------------------------------------------------------

type StateBucket = { current: MockupState | null }

function StateProbe({ bucket }: { bucket: StateBucket }) {
  const { state } = useMockup()
  useEffect(() => {
    bucket.current = state
  })
  return null
}

function renderComposer(overlay: MockupOverlay = { kind: 'none' }) {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, { ...initialState(), overlay })
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <StateProbe bucket={bucket} />
        <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
          <Composer />
        </OverlayLifecycleProvider>
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

const getTrigger = () => screen.getByRole('button', { name: /execution profile/i })

const openMenu = () => {
  fireEvent.click(getTrigger())
  return screen.getByTestId('execution-profile-menu')
}

const getSidecar = () => screen.getByTestId('execution-profile-sidecar')

// jsdom does not load stylesheets, so anchoring/divider styling is
// verified against the shipped CSS directly (tokens.test.ts convention).
// Style-contract source: aggregated stylesheets (spec addendum §8).
const css = getAggregatedCss()

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

// ---------------------------------------------------------------------------
// Anchoring + flat list structure (Task 6, spec §7.3 — AC22)
// ---------------------------------------------------------------------------

describe('ExecutionProfileMenu — anchoring (AC22)', () => {
  it('renders only while the execution-profile-menu overlay is open, anchored adjacent to the profile control', () => {
    renderComposer()
    expect(screen.queryByTestId('execution-profile-menu')).toBeNull()
    const trigger = getTrigger()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    const menu = screen.getByTestId('execution-profile-menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    // Adjacent: the menu cluster lives in the control's anchor wrapper —
    // a sibling of the trigger, not a page-level overlay slot.
    const anchor = trigger.closest('.kx-composer__profile-anchor')
    expect(anchor).not.toBeNull()
    expect(menu.closest('.kx-composer__profile-anchor')).toBe(anchor)
  })

  it('is a floating .kx-menu with no backdrop and no header — anchored styling ships in CSS (AC22)', () => {
    renderComposer()
    const menu = openMenu()
    expect(menu).toHaveClass('kx-menu', 'kx-profile-menu')
    expect(menu).toHaveAttribute('role', 'menu')
    expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
    expect(within(menu).queryByRole('heading')).not.toBeInTheDocument()
    expect(menu.querySelectorAll('h1,h2,h3,h4,h5,h6,header')).toHaveLength(0)

    // Anchored cluster + wrapper ship in components.css (jsdom convention).
    expect(css).toContain('.kx-composer__profile-anchor')
    expect(css).toContain('.kx-profile-menu-cluster')
  })

  it('keeps the sidecar inside the anchored cluster, beside the flat menu (AC23 geometry)', () => {
    renderComposer()
    openMenu()
    const cluster = getSidecar().closest('.kx-profile-menu-cluster')
    expect(cluster).not.toBeNull()
    expect(screen.getByTestId('execution-profile-menu').closest('.kx-profile-menu-cluster')).toBe(
      cluster,
    )
  })
})

describe('ExecutionProfileMenu — trigger presentation', () => {
  it('trigger shows only the active profile name + chevron; its accessible name stays Execution Profile + current profile', () => {
    renderComposer()
    const trigger = getTrigger()

    expect(trigger).toHaveAccessibleName('Execution Profile · Default')
    expect(trigger).toHaveTextContent('Default')
    expect(trigger.textContent).not.toMatch(/execution profile/i)

    // No gauge icon, no caption/copy markup — one aria-hidden chevron.
    expect(trigger.querySelector('svg[data-icon="gauge"]')).toBeNull()
    expect(trigger.querySelector('.kx-composer__profile-icon')).toBeNull()
    expect(trigger.querySelector('.kx-composer__profile-caption')).toBeNull()
    const chevron = trigger.querySelector('svg[data-icon="chevron-down"]')
    expect(chevron).not.toBeNull()
    expect(chevron).toHaveAttribute('aria-hidden', 'true')
    expect(trigger.querySelectorAll('svg')).toHaveLength(1)

    // Selecting another profile keeps the contract: visible name swaps,
    // accessible name follows.
    const menu = openMenu()
    fireEvent.click(within(menu).getByRole('menuitem', { name: /core banking/i }))
    expect(trigger).toHaveTextContent('Core Banking')
    expect(trigger).toHaveAccessibleName('Execution Profile · Core Banking')
  })
})

describe('ExecutionProfileMenu — flat profile list (AC22)', () => {
  it('lists every profile flat with a single check + aria-current on the active one', () => {
    renderComposer()
    const menu = openMenu()

    for (const profile of EXECUTION_PROFILES) {
      expect(
        within(menu).getByRole('menuitem', { name: new RegExp(profile.name, 'i') }),
      ).toBeInTheDocument()
    }

    const active = within(menu).getByRole('menuitem', { name: /^default/i })
    expect(active).toHaveAttribute('aria-current', 'true')

    const checks = menu.querySelectorAll('svg[data-icon="check"]')
    expect(checks).toHaveLength(1)
    expect(checks[0]).toHaveAttribute('aria-hidden', 'true')
    expect(checks[0].closest('.kx-profile-menu__item')).toBe(active)

    const other = within(menu).getByRole('menuitem', { name: /commerce platform/i })
    expect(other.getAttribute('aria-current')).toBeNull()
    expect(other.querySelector('svg[data-icon="check"]')).toBeNull()
  })

  it('selecting a profile commits SET_ACTIVE_PROFILE and closes the menu; the trigger reflects it', () => {
    const { bucket } = renderComposer()
    const trigger = getTrigger()
    const menu = openMenu()

    fireEvent.click(within(menu).getByRole('menuitem', { name: /commerce platform/i }))
    expect(bucket.current?.activeProfileId).toBe('profile-commerce-platform')
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByTestId('execution-profile-menu')).toBeNull()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveTextContent('Commerce Platform')
  })

  it('Manage / Customize Profile opens Customize on the Agents tab; no modal UI mounts yet (AC22, Task 9)', () => {
    const { bucket } = renderComposer()
    const menu = openMenu()

    fireEvent.click(within(menu).getByRole('menuitem', { name: /manage \/ customize profile/i }))
    expect(bucket.current?.overlay).toEqual({ kind: 'customize', tab: 'agents' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByTestId('execution-profile-menu')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Hover sidecar (Task 6, spec §7.3 — AC23)
// ---------------------------------------------------------------------------

describe('ExecutionProfileMenu — hover sidecar (AC23)', () => {
  it('reveals planner model, executor model, authorization, and readiness for the hovered profile', () => {
    renderComposer()
    const menu = openMenu()
    const sidecar = getSidecar()

    // Steady state: the sidecar shows the active profile.
    expect(sidecar).toHaveTextContent('Default')
    expect(sidecar).toHaveTextContent('GPT-4o mini')
    expect(sidecar).toHaveTextContent('Workspace default access')
    expect(sidecar).toHaveTextContent('Ready')

    // Hover swaps the sidecar to that profile's facts.
    fireEvent.mouseEnter(within(menu).getByRole('menuitem', { name: /commerce platform/i }))
    expect(sidecar).toHaveTextContent('Commerce Platform')
    expect(sidecar).toHaveTextContent('Planner model')
    expect(sidecar).toHaveTextContent('Claude Sonnet 4.5')
    expect(sidecar).toHaveTextContent('Executor model')
    expect(sidecar).toHaveTextContent('Claude Haiku 4.5')
    expect(sidecar).toHaveTextContent('Authorization')
    expect(sidecar).toHaveTextContent('Commerce GitHub organization')
    expect(sidecar).toHaveTextContent('Readiness')
    expect(sidecar).toHaveTextContent('Ready')
    expect(sidecar).not.toHaveTextContent('GPT-4o mini')

    fireEvent.mouseEnter(within(menu).getByRole('menuitem', { name: /core banking/i }))
    expect(sidecar).toHaveTextContent('Core Banking')
    expect(sidecar).toHaveTextContent('Requires BSI private network')
    expect(sidecar).toHaveTextContent('Needs setup')
  })

  it('reveals the same sidecar on keyboard focus — not hover-only (AC23/AC45)', () => {
    renderComposer()
    const menu = openMenu()
    const sidecar = getSidecar()

    fireEvent.focus(within(menu).getByRole('menuitem', { name: /refactory admin/i }))
    expect(sidecar).toHaveTextContent('Refactory Admin')
    expect(sidecar).toHaveTextContent('Admin allowlist')
    expect(sidecar).toHaveTextContent('Needs setup')
  })
})

// ---------------------------------------------------------------------------
// Workspace settings section (Task 6, spec §7.3 — AC24)
// ---------------------------------------------------------------------------

describe('ExecutionProfileMenu — Workspace settings (AC24)', () => {
  it('renders Assistant and Search outside the profile list under a visually separated Workspace settings divider + label', () => {
    renderComposer()
    const menu = openMenu()

    const label = within(menu).getByText('Workspace settings')
    expect(label).toHaveClass('kx-profile-menu__section-label')

    const workspace = label.closest('.kx-profile-menu__workspace') as HTMLElement
    expect(workspace).not.toBeNull()

    const list = menu.querySelector('.kx-profile-menu__list') as HTMLElement
    expect(list).not.toBeNull()

    for (const setting of WORKSPACE_SETTINGS) {
      const row = within(workspace).getByText(setting.name, { exact: true })
      // Workspace-level entries live outside the flat profile list (AC24).
      expect(row.closest('.kx-profile-menu__list')).toBeNull()
      expect(row.closest('.kx-profile-menu__workspace')).toBe(workspace)
    }

    // Profiles stay inside the list — the sections do not mix.
    expect(within(list).getAllByRole('menuitem')).toHaveLength(EXECUTION_PROFILES.length)

    // Visual separation ships in CSS: divider + label class (AC24).
    expect(css).toMatch(/\.kx-profile-menu__workspace\s*\{[^}]*border-top/)
    expect(css).toContain('.kx-profile-menu__section-label')
  })
})

// ---------------------------------------------------------------------------
// Keyboard dismissal + accessibility hygiene (AC45 support)
// ---------------------------------------------------------------------------

describe('ExecutionProfileMenu — Escape + accessibility', () => {
  it('Escape dispatches CLOSE_OVERLAY through the shared OverlayLifecycle listener', () => {
    const { bucket } = renderComposer()
    openMenu()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByTestId('execution-profile-menu')).toBeNull()
  })

  it('exposes menu semantics — labeled menu, menuitem rows, live sidecar', () => {
    renderComposer()
    const menu = openMenu()

    expect(menu).toHaveAttribute('aria-label', 'Execution Profile')
    // Five profile rows plus Manage — workspace entries stay presentational.
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(EXECUTION_PROFILES.length + 1)
    expect(getSidecar()).toHaveAttribute('aria-live', 'polite')
  })

  it('uses no emoji and no imagery anywhere in the menu or sidecar', () => {
    renderComposer()
    openMenu()
    const cluster = getSidecar().closest('.kx-profile-menu-cluster')!
    expect(cluster.textContent).not.toMatch(EMOJI)
    expect(cluster.querySelectorAll('img')).toHaveLength(0)
    expect(cluster.querySelectorAll('svg:not([aria-hidden="true"])')).toHaveLength(0)
  })
})
