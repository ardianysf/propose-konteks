import { fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'

const getMenu = () => screen.getByRole('menu', { name: 'Systems' })
const getWorkspaceMenu = () => screen.getByRole('menu', { name: 'Workspace' })

it('renders the shell — sidebar navigation with the Konteks logo and the main route placeholder', () => {
  render(<App />)
  expect(screen.getByRole('navigation', { name: 'Sidebar' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Konteks' })).toHaveAttribute(
    'src',
    '/assets/konteks/logo-text-main.png',
  )
  expect(screen.getByRole('heading', { name: /new session/i })).toBeInTheDocument()
})

it('frames the AppShell — one .kx-app grid with a single sidebar and one main region', () => {
  const { container } = render(<App />)
  const app = container.querySelector('.kx-app')
  expect(app).not.toBeNull()
  expect(app).not.toHaveClass('kx-app--rail')
  expect(app!.children[0]).toHaveClass('kx-sidebar')
  expect(app!.children[1]).toHaveClass('kx-main')
  expect(container.querySelectorAll('.kx-sidebar')).toHaveLength(1)
  expect(container.querySelectorAll('main.kx-main')).toHaveLength(1)
})

it('keeps the sidebar untouched while the route placeholder switches (AC11)', () => {
  const { container } = render(<App />)
  const before = container.querySelector('.kx-sidebar')!.outerHTML
  fireEvent.click(screen.getByRole('button', { name: /view all/i }))
  expect(screen.getByRole('heading', { name: /session history/i })).toBeInTheDocument()
  expect(container.querySelectorAll('.kx-sidebar')).toHaveLength(1)
  expect(container.querySelector('.kx-sidebar')!.outerHTML).toBe(before)
})

it('mounts the system menu overlay slot only after the system control opens it', () => {
  render(<App />)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /open system menu/i }))
  const menu = getMenu()
  expect(menu).toHaveClass('kx-menu', 'kx-system-menu')
  // Floating menu: anchored inside the shell grid, right of the sidebar —
  // never inside the sidebar, never behind a modal backdrop.
  expect(menu.closest('.kx-sidebar')).toBeNull()
  expect(menu.closest('.kx-app')).not.toBeNull()
  expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
})

it('switching systems from the floating menu updates the sidebar control and closes the menu', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /open system menu/i }))
  fireEvent.click(within(getMenu()).getByRole('menuitem', { name: /kookree/i }))
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /kookree.*open system menu/i })).toBeInTheDocument()
})

it('mounts the workspace menu overlay slot only after the workspace control opens it (AC7)', () => {
  render(<App />)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /refactory workspace/i }))
  const menu = getWorkspaceMenu()
  expect(menu).toHaveClass('kx-menu', 'kx-workspace-menu')
  // Floating menu: anchored inside the shell grid, right of the sidebar —
  // never inside the sidebar, never behind a modal backdrop.
  expect(menu.closest('.kx-sidebar')).toBeNull()
  expect(menu.closest('.kx-app')).not.toBeNull()
  expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
  // The current workspace renders as the selected illustrative row, and
  // the sidebar keeps exactly one persistent boxed container (AC6).
  expect(within(menu).getByRole('menuitem', { name: /refactory/i })).toHaveAttribute(
    'aria-current',
    'true',
  )
  expect(document.querySelectorAll('.kx-sidebar-box')).toHaveLength(1)
  // Escape closes through the CLOSE_OVERLAY contract (AC45).
  fireEvent.keyDown(menu, { key: 'Escape' })
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

it('renders exactly one overlay at a time — workspace and system menus are mutually exclusive', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /refactory workspace/i }))
  expect(getWorkspaceMenu()).toBeInTheDocument()
  expect(screen.queryByRole('menu', { name: 'Systems' })).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /open system menu/i }))
  expect(getMenu()).toBeInTheDocument()
  expect(screen.queryByRole('menu', { name: 'Workspace' })).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /refactory workspace/i }))
  expect(getWorkspaceMenu()).toBeInTheDocument()
  expect(screen.queryByRole('menu', { name: 'Systems' })).not.toBeInTheDocument()
})

// ---------------------------------------------------------------------------
// Task 7 — repo selector, manual repo form, Create System (integration)
// ---------------------------------------------------------------------------

describe('Task 7 modal overlays', () => {
  const getRepoDialog = () => screen.getByRole('dialog', { name: 'Choose work repositories' })
  const getCreateDialog = () => screen.getByRole('dialog', { name: 'Create a new system' })
  const getManualDialog = () => screen.getByRole('dialog', { name: 'Add repository manually' })

  /** Exactly one overlay surface: one dialog, one backdrop, no menus. */
  const expectSingleOverlay = () => {
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(document.querySelectorAll('.kx-modal-backdrop')).toHaveLength(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  }

  it('opens the repository selector modal from the setup trigger — exactly one overlay (AC25)', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('repository-trigger'))
    expect(getRepoDialog()).toHaveClass('kx-modal', 'kx-repo-modal')
    expectSingleOverlay()

    // Escape closes through the CLOSE_OVERLAY contract (AC45).
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
  })

  it('opens the Create System modal from the SystemMenu Create new system footer — exactly one overlay (AC33)', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /open system menu/i }))
    fireEvent.click(within(getMenu()).getByRole('menuitem', { name: /create new system/i }))
    // The anchored menu unmounts — the modal replaces it as the one overlay.
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(getCreateDialog()).toHaveClass('kx-modal', 'kx-create-modal')
    expectSingleOverlay()
  })

  it('creates a system end-to-end — it becomes active, the repo selection clears, and every overlay closes (AC33)', () => {
    render(<App />)

    // Preselect one repository in the default system through the real UI.
    fireEvent.click(screen.getByTestId('repository-trigger'))
    fireEvent.click(within(getRepoDialog()).getByRole('checkbox', { name: 'bsi/hris-frontend-shared' }))
    fireEvent.click(within(getRepoDialog()).getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('repository-trigger')).toHaveTextContent(/1 of 3 repositories/i)

    // SystemMenu → Create new system → Create modal → create.
    fireEvent.click(screen.getByRole('button', { name: /open system menu/i }))
    fireEvent.click(within(getMenu()).getByRole('menuitem', { name: /create new system/i }))
    fireEvent.change(within(getCreateDialog()).getByRole('textbox', { name: /^name/i }), {
      target: { value: 'QA Platform' },
    })
    fireEvent.click(within(getCreateDialog()).getByRole('button', { name: 'Create' }))

    // All overlays close; the new system is active with an empty repo scope.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
    expect(screen.getByRole('button', { name: /qa platform.*open system menu/i })).toBeInTheDocument()
    expect(screen.getByTestId('repository-trigger')).toHaveTextContent(
      /qa platform.*select repositories/i,
    )
  })

  it("swaps the selector for the Create modal through the selector's Add new system — exactly one overlay", () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('repository-trigger'))
    fireEvent.click(within(getRepoDialog()).getByRole('button', { name: 'Add new system' }))
    expect(screen.queryByRole('dialog', { name: 'Choose work repositories' })).not.toBeInTheDocument()
    expect(getCreateDialog()).toBeInTheDocument()
    expectSingleOverlay()
  })

  it("swaps the selector for the manual repo form through the selector's Add repository manually — exactly one overlay (AC28)", () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('repository-trigger'))
    fireEvent.click(within(getRepoDialog()).getByRole('button', { name: /add repository manually/i }))
    expect(screen.queryByRole('dialog', { name: 'Choose work repositories' })).not.toBeInTheDocument()
    expect(getManualDialog()).toHaveClass('kx-modal', 'kx-manual-modal')
    expectSingleOverlay()

    // Escape closes through the CLOSE_OVERLAY contract (AC45).
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Task 9 — Customize shell (integration, Part A)
// ---------------------------------------------------------------------------

describe('Task 9 — Customize shell', () => {
  const getCustomizeDialog = () => screen.getByRole('dialog', { name: 'Customize' })

  /** Exactly one overlay surface: one dialog, one backdrop, no menus. */
  const expectSingleOverlay = () => {
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(document.querySelectorAll('.kx-modal-backdrop')).toHaveLength(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  }

  it('opens Customize on the Agents tab in one click from the sidebar sliders icon — exactly one overlay (AC9)', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Customize' }))

    const dialog = getCustomizeDialog()
    expect(dialog).toHaveClass('kx-modal', 'kx-customize')
    expectSingleOverlay()
    expect(within(dialog).getByRole('tab', { name: 'Agents' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    // Escape closes through the CLOSE_OVERLAY contract (AC45).
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
  })

  it('opens Customize on the Agents tab from the Execution Profile Manage trigger — the menu swaps for the modal (AC22)', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('execution-profile-trigger'))
    fireEvent.click(
      within(screen.getByRole('menu', { name: 'Execution Profile' })).getByRole('menuitem', {
        name: /manage \/ customize profile/i,
      }),
    )

    // The anchored menu unmounts — the modal replaces it as the one overlay.
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    const dialog = getCustomizeDialog()
    expectSingleOverlay()
    expect(within(dialog).getByRole('tab', { name: 'Agents' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    // The header close control dismisses it (§16).
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
  })
})
