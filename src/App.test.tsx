import { fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'
import { AUDIT_HISTORY, PENDING_REVIEWS } from './data/mockData'

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
  // The fixed mobile hamburger precedes the sidebar in DOM order; the
  // shell proper is still exactly one sidebar + one main region.
  expect(container.querySelector('.kx-sidebar')).not.toBeNull()
  expect(container.querySelector('.kx-app__mobile-toggle')).not.toBeNull()
  expect(container.querySelectorAll('.kx-sidebar')).toHaveLength(1)
  expect(container.querySelectorAll('main.kx-main')).toHaveLength(1)
})

it('keeps the sidebar untouched while the route placeholder switches (AC11)', () => {
  const { container } = render(<App />)
  // The only allowed DOM delta is the New session control's
  // aria-current="page" route state — the sidebar never remounts.
  const stripNavState = (html: string) =>
    html.replace(' aria-current="page"', '').replace(' kx-sidebar__new-session--active', '')
  const before = stripNavState(container.querySelector('.kx-sidebar')!.outerHTML)
  fireEvent.click(screen.getByRole('button', { name: /view all/i }))
  expect(screen.getByRole('heading', { name: /session history/i })).toBeInTheDocument()
  expect(container.querySelectorAll('.kx-sidebar')).toHaveLength(1)
  expect(stripNavState(container.querySelector('.kx-sidebar')!.outerHTML)).toBe(before)
  expect(screen.getByTestId('new-session-trigger')).not.toHaveAttribute('aria-current')
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

  /** Exactly one overlay surface: one dialog, one backdrop, no menus.
   *  The repository→create nesting below is the one intentional
   *  exception — two stacked frames with one accessible active dialog. */
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
    expect(screen.getByTestId('repository-trigger')).toHaveTextContent('BSI - HRIS')

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
    // A system-menu Create never touches the committed session context, so
    // the composer's system pill stays on the committed BSI - HRIS scope.
    expect(screen.getByTestId('repository-trigger')).toHaveTextContent('BSI - HRIS')
  })

  it("nests the Create modal above the suspended selector through the selector's Add new system — two stacked frames, one accessible active dialog", () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('repository-trigger'))

    // Seed a live draft selection before nesting, so the return path can
    // prove the draft survives the whole suspended round trip.
    fireEvent.click(within(getRepoDialog()).getByRole('checkbox', { name: 'bsi/hris-frontend-shared' }))
    fireEvent.click(within(getRepoDialog()).getByRole('button', { name: 'Add new system' }))

    // The repository modal does NOT unmount — it stays rendered behind the
    // nested Create modal as a suspended frame: two dialog DOM nodes and
    // two stacked backdrops, with only the Create dialog accessible.
    expect(getCreateDialog()).toHaveClass('kx-modal', 'kx-create-modal', 'kx-create-modal--nested')
    const suspendedRepo = document.querySelector('.kx-repo-modal')!
    expect(suspendedRepo).toHaveAttribute('aria-hidden', 'true')
    expect(suspendedRepo).toHaveClass('kx-repo-modal--suspended')
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(screen.queryByRole('dialog', { name: 'Choose work repositories' })).not.toBeInTheDocument()
    const backdrops = document.querySelectorAll('.kx-modal-backdrop')
    expect(backdrops).toHaveLength(2)
    expect(backdrops[0]).toHaveClass('kx-modal-backdrop--suspended')
    expect(backdrops[1]).toHaveClass('kx-modal-backdrop--nested')

    // Cancel returns directly to the repository modal — the draft survives
    // and nothing commits to the session context.
    fireEvent.click(within(getCreateDialog()).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog', { name: 'Create a new system' })).not.toBeInTheDocument()
    expect(getRepoDialog()).toBeInTheDocument()
    expect(document.querySelectorAll('.kx-modal-backdrop')).toHaveLength(1)
    expect(
      within(getRepoDialog()).getByRole('checkbox', { name: 'bsi/hris-frontend-shared' }),
    ).toBeChecked()
    expect(within(getRepoDialog()).getByText(/1 repository selected/i)).toBeInTheDocument()
    expect(screen.getByTestId('repository-trigger')).toHaveTextContent('Choose system / repositories')

    // Escape from the nested dialog returns the same way — never a
    // full-chain dismissal, never a commit.
    fireEvent.click(within(getRepoDialog()).getByRole('button', { name: 'Add new system' }))
    expect(getCreateDialog()).toBeInTheDocument()
    fireEvent.keyDown(getCreateDialog(), { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Create a new system' })).not.toBeInTheDocument()
    expect(getRepoDialog()).toBeInTheDocument()
    expect(
      within(getRepoDialog()).getByRole('checkbox', { name: 'bsi/hris-frontend-shared' }),
    ).toBeChecked()
    expect(screen.getByTestId('repository-trigger')).toHaveTextContent('Choose system / repositories')

    // Create returns to the repository modal with the new system selected
    // in the draft (empty repository scope) — still no session commit.
    fireEvent.click(within(getRepoDialog()).getByRole('button', { name: 'Add new system' }))
    fireEvent.change(within(getCreateDialog()).getByRole('textbox', { name: /^name/i }), {
      target: { value: 'QA Platform' },
    })
    fireEvent.click(within(getCreateDialog()).getByRole('button', { name: 'Create' }))
    expect(screen.queryByRole('dialog', { name: 'Create a new system' })).not.toBeInTheDocument()
    expect(getRepoDialog()).toBeInTheDocument()
    expect(getRepoDialog().querySelector('.kx-repo-modal__system--active')).toHaveTextContent(
      /QA Platform/i,
    )
    expect(within(getRepoDialog()).getByText(/0 repositories selected/i)).toBeInTheDocument()
    expect(screen.getByTestId('repository-trigger')).toHaveTextContent('Choose system / repositories')

    // Done is the only commit — it closes the chain and updates the pill.
    fireEvent.click(within(getRepoDialog()).getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
    expect(screen.getByTestId('repository-trigger')).toHaveTextContent('QA Platform')
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
// Task 10 — Konteks Learned drawer (integration)
// ---------------------------------------------------------------------------

describe('Task 10 — Konteks Learned drawer', () => {
  const getLearnedDialog = () => screen.getByRole('dialog', { name: 'Konteks Learned' })

  /** Exactly one overlay surface: one dialog, one backdrop, no menus. */
  const expectSingleOverlay = () => {
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(document.querySelectorAll('.kx-modal-backdrop')).toHaveLength(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  }

  it('opens the drawer directly on Pending from the composer "Reviews waiting" trigger — the sidebar stays untouched (AC20/AC39)', () => {
    render(<App />)
    const sidebar = document.querySelector('.kx-sidebar')!
    const sidebarHtml = sidebar.outerHTML
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('reviews-waiting'))

    const drawer = getLearnedDialog()
    expect(drawer).toHaveClass('kx-drawer', 'kx-learned')
    expectSingleOverlay()

    // Pending is the default/primary tab (AC20).
    const tabs = within(drawer).getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Pending', 'Audit History'])
    expect(within(drawer).getByRole('tab', { name: 'Pending' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    // The persistent sidebar keeps its exact DOM — the drawer stacks on
    // top through fixed overlay geometry, it never touches the sidebar.
    expect(document.querySelector('.kx-sidebar')).toBe(sidebar)
    expect(sidebar.outerHTML).toBe(sidebarHtml)

    // Escape closes through the CLOSE_OVERLAY contract (AC45).
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
  })

  it('lists the waiting reviews on Pending, then switches in place to the Audit History timeline and closes from the header control (AC39)', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('reviews-waiting'))
    const drawer = getLearnedDialog()

    for (const review of PENDING_REVIEWS) {
      expect(within(drawer).getByText(review.title)).toBeInTheDocument()
      expect(within(drawer).getByRole('button', { name: `Approve ${review.title}` })).toBeInTheDocument()
    }

    fireEvent.click(within(drawer).getByRole('tab', { name: 'Audit History' }))
    expect(within(drawer).getByRole('tab', { name: 'Audit History' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const timeline = within(drawer).getByRole('list', { name: 'Audit history' })
    expect(within(timeline).getAllByRole('listitem')).toHaveLength(AUDIT_HISTORY.length)

    // The header close control dismisses it (§16).
    fireEvent.click(within(drawer).getByRole('button', { name: 'Close' }))
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
