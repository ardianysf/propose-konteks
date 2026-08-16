import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import WorkspaceMenu from './WorkspaceMenu'
import { MockupContext, useMockup } from '../../state/MockupContext'
import {
  initialState,
  mockupReducer,
  type MockupOverlay,
  type MockupState,
} from '../../state/mockupReducer'
import { WORKSPACE } from '../../data/mockData'

// ---------------------------------------------------------------------------
// Harness — WorkspaceMenu behind the real reducer, mounted exactly the way
// AppShell mounts it: the overlay slot renders the menu only while
// overlay.kind === 'workspace-menu'. A state bucket captures the committed
// store for dispatch assertions.
// ---------------------------------------------------------------------------

type StateBucket = { current: MockupState | null }

function StateProbe({ bucket }: { bucket: StateBucket }) {
  const { state } = useMockup()
  useEffect(() => {
    bucket.current = state
  })
  return null
}

function renderWorkspaceMenu(overlay: MockupOverlay = { kind: 'none' }) {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, { ...initialState(), overlay })
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <StateProbe bucket={bucket} />
        {state.overlay.kind === 'workspace-menu' && <WorkspaceMenu />}
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

const getMenu = () => screen.getByRole('menu', { name: 'Workspace' })

// jsdom does not load stylesheets, so anchoring rules are verified against
// the shipped CSS directly (tokens.test.ts / SystemMenu.test.tsx convention).
const css = readFileSync(join(process.cwd(), 'src/styles/components.css'), 'utf8')

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

// ---------------------------------------------------------------------------
// WorkspaceMenu contract (Task 4 — spec §6.1/AC7, minimal scope: current
// workspace only, no workspace management)
// ---------------------------------------------------------------------------

describe('WorkspaceMenu', () => {
  it('renders only while the workspace-menu overlay is open — no other overlay kind mounts it', () => {
    const closed = renderWorkspaceMenu()
    expect(closed.container.querySelector('.kx-workspace-menu')).toBeNull()
    closed.unmount()

    const other = renderWorkspaceMenu({ kind: 'system-menu' })
    expect(other.container.querySelector('.kx-workspace-menu')).toBeNull()
    other.unmount()

    renderWorkspaceMenu({ kind: 'workspace-menu' })
    expect(getMenu()).toBeInTheDocument()
  })

  it('is a floating .kx-menu anchored right of the sidebar — no modal backdrop, no heading/header (AC7)', () => {
    renderWorkspaceMenu({ kind: 'workspace-menu' })
    const menu = getMenu()
    expect(menu).toHaveClass('kx-menu', 'kx-workspace-menu')
    expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
    expect(within(menu).queryByRole('heading')).not.toBeInTheDocument()
    expect(menu.querySelectorAll('h1,h2,h3,h4,h5,h6,header')).toHaveLength(0)
    // Anchoring shares the system menu's geometry in components.css,
    // token-aware for both sidebar widths (expanded + rail).
    expect(css).toContain('.kx-workspace-menu')
    expect(css).toMatch(/\.kx-workspace-menu,\s*\n\.kx-system-menu\s*{[^}]*calc\(var\(--kx-sidebar-w\) \+/)
    expect(css).toMatch(/\.kx-app--rail \.kx-workspace-menu,\s*\n\.kx-app--rail \.kx-system-menu\s*{[^}]*calc\(var\(--kx-sidebar-rail\) \+/)
  })

  it('shows the current workspace as the selected illustrative row — Refactory with its plan (AC46)', () => {
    renderWorkspaceMenu({ kind: 'workspace-menu' })
    const menu = getMenu()
    const row = within(menu).getByRole('menuitem', { name: new RegExp(WORKSPACE.name, 'i') })
    expect(row).toHaveAttribute('aria-current', 'true')
    expect(row).toHaveTextContent(WORKSPACE.name)
    expect(row).toHaveTextContent(WORKSPACE.plan)
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(1)
    // Minimal scope — no workspace management affordances anywhere.
    expect(within(menu).queryByRole('menuitem', { name: /create|switch|invite|manage/i })).not.toBeInTheDocument()
    expect(within(menu).queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('keeps the current workspace on click and closes through CLOSE_OVERLAY', () => {
    const { bucket } = renderWorkspaceMenu({ kind: 'workspace-menu' })
    fireEvent.click(within(getMenu()).getByRole('menuitem', { name: /refactory/i }))
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes via the CLOSE_OVERLAY state contract on Escape (AC45)', () => {
    const { bucket } = renderWorkspaceMenu({ kind: 'workspace-menu' })
    fireEvent.keyDown(getMenu(), { key: 'Escape' })
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('uses no emoji anywhere in the menu', () => {
    renderWorkspaceMenu({ kind: 'workspace-menu' })
    expect(getMenu().textContent).not.toMatch(EMOJI)
  })
})
