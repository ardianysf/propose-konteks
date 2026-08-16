import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import RepositorySelectorModal from './RepositorySelectorModal'
import { OverlayLifecycleProvider } from '../shell/OverlayLifecycle'
import { MockupContext, useMockup } from '../../state/MockupContext'
import {
  initialState,
  mockupReducer,
  type MockupOverlay,
  type MockupState,
} from '../../state/mockupReducer'
import { REPOSITORIES, SYSTEMS } from '../../data/mockData'

// ---------------------------------------------------------------------------
// Harness — the modal behind the real reducer via the mockup context,
// mounted exactly the way AppShell will mount it (integration is a later
// Task 7 part): the overlay slot renders the modal only while
// overlay.kind === 'repository-modal'. A state bucket captures the
// committed store for dispatch assertions.
// ---------------------------------------------------------------------------

type StateBucket = { current: MockupState | null }

function StateProbe({ bucket }: { bucket: StateBucket }) {
  const { state } = useMockup()
  useEffect(() => {
    bucket.current = state
  })
  return null
}

function renderRepositorySelectorModal(
  overlay: MockupOverlay = { kind: 'none' },
  initial?: Partial<MockupState>,
) {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, { ...initialState(), ...initial, overlay })
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <StateProbe bucket={bucket} />
        <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
          {state.overlay.kind === 'repository-modal' && <RepositorySelectorModal />}
        </OverlayLifecycleProvider>
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

const getDialog = () => screen.getByRole('dialog', { name: 'Choose work repositories' })
const getSearch = () =>
  screen.getByRole('searchbox', { name: 'Search systems or repositories' })

/** True when `later` comes after `earlier` in document order. */
const follows = (earlier: Element, later: Element) =>
  (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

// jsdom does not load stylesheets, so frame/scroll/footer rules are
// verified against the shipped CSS directly (tokens.test.ts convention).
const css = readFileSync(join(process.cwd(), 'src/styles/components.css'), 'utf8')

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

const ACTIVE_SYSTEM = SYSTEMS.find((system) => system.id === 'bsi-hris')!

// ---------------------------------------------------------------------------
// Frame + mount gating (spec §8.1, §16)
// ---------------------------------------------------------------------------

describe('RepositorySelectorModal — frame', () => {
  it('renders only while the repository-modal overlay is open — no other overlay kind mounts it', () => {
    const closed = renderRepositorySelectorModal()
    expect(closed.container.querySelector('.kx-repo-modal')).toBeNull()
    closed.unmount()

    const other = renderRepositorySelectorModal({ kind: 'create-system-modal' })
    expect(other.container.querySelector('.kx-repo-modal')).toBeNull()
    other.unmount()

    renderRepositorySelectorModal({ kind: 'repository-modal' })
    expect(getDialog()).toBeInTheDocument()
  })

  it('is a centered modal dialog over the shared backdrop — role=dialog, aria-modal, labelled by its title', () => {
    renderRepositorySelectorModal({ kind: 'repository-modal' })
    const dialog = getDialog()
    expect(dialog).toHaveClass('kx-modal', 'kx-repo-modal')
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    const title = within(dialog).getByRole('heading', { name: 'Choose work repositories' })
    expect(title.tagName).toBe('H2')

    // Exactly one backdrop, mounted before the dialog in document order.
    const backdrop = document.querySelector('.kx-modal-backdrop')
    expect(backdrop).not.toBeNull()
    expect(follows(backdrop!, dialog)).toBe(true)

    // Header dismiss control.
    expect(within(dialog).getAllByRole('button', { name: 'Close' })).toHaveLength(1)

    // Frame + backdrop geometry ship in components.css.
    expect(css).toContain('.kx-repo-modal')
    expect(css).toContain('.kx-modal-backdrop')
  })

  it('moves focus to the dialog on mount', () => {
    renderRepositorySelectorModal({ kind: 'repository-modal' })
    expect(getDialog()).toHaveFocus()
  })

  it('Escape dispatches CLOSE_OVERLAY and unmounts the dialog', () => {
    const { bucket } = renderRepositorySelectorModal({ kind: 'repository-modal' })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes from the header dismiss control too', () => {
    const { bucket } = renderRepositorySelectorModal({ kind: 'repository-modal' })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Add new system — top of the system list (AC27)
// ---------------------------------------------------------------------------

describe('RepositorySelectorModal — Add new system (AC27)', () => {
  it('sits at the top of the system list, above every group, and dispatches the exact create-system overlay', () => {
    const { bucket } = renderRepositorySelectorModal({ kind: 'repository-modal' })
    const addSystem = screen.getByRole('button', { name: 'Add new system' })
    const groups = getDialog().querySelector('.kx-repo-modal__groups')
    expect(groups).not.toBeNull()
    expect(groups!.querySelectorAll('.kx-repo-modal__system')).toHaveLength(SYSTEMS.length)

    // Above the first system group in DOM order — not inside the list.
    expect(follows(addSystem, groups!.firstElementChild!)).toBe(true)
    expect(addSystem.closest('.kx-repo-modal__groups')).toBeNull()

    fireEvent.click(addSystem)
    expect(bucket.current?.overlay).toEqual({ kind: 'create-system-modal' })
  })

  it('stays mounted while the search filters every group away', () => {
    renderRepositorySelectorModal({ kind: 'repository-modal' })
    fireEvent.change(getSearch(), { target: { value: 'zzz-no-match' } })
    expect(screen.getByRole('button', { name: 'Add new system' })).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// One active system grouping (AC25)
// ---------------------------------------------------------------------------

describe('RepositorySelectorModal — one active system (AC25)', () => {
  it('groups repositories under every system with exactly one active group', () => {
    renderRepositorySelectorModal({ kind: 'repository-modal' })
    const dialog = getDialog()
    const heads = dialog.querySelectorAll('.kx-repo-modal__system-head')
    expect(heads).toHaveLength(SYSTEMS.length)

    const activeHeads = Array.from(heads).filter(
      (head) => head.getAttribute('aria-current') === 'true',
    )
    expect(activeHeads).toHaveLength(1)
    expect(activeHeads[0]).toHaveTextContent(/BSI - HRIS/i)
    expect(activeHeads[0].closest('.kx-repo-modal__system')).toHaveClass(
      'kx-repo-modal__system--active',
    )

    // Every system renders its own repository count and repo rows.
    for (const system of SYSTEMS) {
      const group = within(dialog)
        .getByRole('button', { name: new RegExp(system.name, 'i') })
        .closest('.kx-repo-modal__system') as HTMLElement | null
      expect(group).not.toBeNull()
      const count = system.repoIds.length
      expect(group).toHaveTextContent(
        `${count} ${count === 1 ? 'repository' : 'repositories'}`,
      )
      expect(within(group!).getAllByRole('checkbox')).toHaveLength(count)
    }
  })

  it('enables checkboxes only within the active system — every other system renders its repositories disabled', () => {
    renderRepositorySelectorModal({ kind: 'repository-modal' })
    const boxes = within(getDialog()).getAllByRole('checkbox')
    expect(boxes).toHaveLength(REPOSITORIES.length)

    for (const box of boxes) {
      const repoId = box.getAttribute('aria-label') ?? ''
      if (ACTIVE_SYSTEM.repoIds.includes(repoId)) expect(box).toBeEnabled()
      else expect(box).toBeDisabled()
    }
    expect(boxes.filter((box) => !box.hasAttribute('disabled'))).toHaveLength(
      ACTIVE_SYSTEM.repoIds.length,
    )
  })

  it('checks active-system repositories through the store (TOGGLE_REPO)', () => {
    const { bucket } = renderRepositorySelectorModal({ kind: 'repository-modal' })
    const shared = screen.getByRole('checkbox', { name: 'bsi/hris-frontend-shared' })
    expect(shared).not.toBeChecked()

    fireEvent.click(shared)
    expect(bucket.current?.selectedRepoIds).toEqual(['bsi/hris-frontend-shared'])
    expect(shared).toBeChecked()

    fireEvent.click(shared)
    expect(bucket.current?.selectedRepoIds).toEqual([])
    expect(shared).not.toBeChecked()
  })
})

// ---------------------------------------------------------------------------
// Switching the active system (AC26)
// ---------------------------------------------------------------------------

describe('RepositorySelectorModal — switching systems (AC26)', () => {
  it('dispatches SET_ACTIVE_SYSTEM, moves the active group and enabled checkboxes, and clears the selection', () => {
    const { bucket } = renderRepositorySelectorModal({ kind: 'repository-modal' })
    fireEvent.click(screen.getByRole('checkbox', { name: 'bsi/hris-frontend-shared' }))
    expect(bucket.current?.selectedRepoIds).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: /BSI Canteen/i }))
    expect(bucket.current?.activeSystemId).toBe('bsi-canteen')
    expect(bucket.current?.selectedRepoIds).toEqual([]) // AC26 via the real reducer

    expect(screen.getByRole('checkbox', { name: 'bsi/canteen-backend' })).toBeEnabled()
    expect(screen.getByRole('checkbox', { name: 'bsi/hris-frontend-shared' })).toBeDisabled()

    const activeHeads = getDialog().querySelectorAll(
      '.kx-repo-modal__system-head[aria-current="true"]',
    )
    expect(activeHeads).toHaveLength(1)
    expect(activeHeads[0]).toHaveTextContent(/BSI Canteen/i)
  })
})

// ---------------------------------------------------------------------------
// Search — one input, system + repository names (AC27)
// ---------------------------------------------------------------------------

describe('RepositorySelectorModal — search (AC27)', () => {
  it('exposes exactly one search input, wired to the repositories search slot', () => {
    const { bucket } = renderRepositorySelectorModal({ kind: 'repository-modal' })
    const searches = within(getDialog()).getAllByRole('searchbox')
    expect(searches).toHaveLength(1)

    fireEvent.change(searches[0], { target: { value: 'canteen' } })
    expect(bucket.current?.search.repositories).toBe('canteen')
  })

  it('filters by system name, retaining only the matching system group', () => {
    renderRepositorySelectorModal({ kind: 'repository-modal' })
    fireEvent.change(getSearch(), { target: { value: 'canteen' } })
    expect(getDialog().querySelectorAll('.kx-repo-modal__system')).toHaveLength(1)
    expect(screen.getByRole('button', { name: /BSI Canteen/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /BSI - HRIS/i })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'bsi/canteen-backend' })).toBeInTheDocument()
  })

  it('filters by repository name, retaining the owning system group and narrowing its repositories', () => {
    renderRepositorySelectorModal({ kind: 'repository-modal' })
    fireEvent.change(getSearch(), { target: { value: 'shared' } })
    // The owning system group survives…
    expect(screen.getByRole('button', { name: /BSI - HRIS/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /BSI Canteen/i })).not.toBeInTheDocument()
    // …and narrows to the matching repository inside it.
    expect(screen.getByRole('checkbox', { name: 'bsi/hris-frontend-shared' })).toBeInTheDocument()
    expect(
      screen.queryByRole('checkbox', { name: 'bsi/hris-frontend-promotion' }),
    ).not.toBeInTheDocument()
  })

  it('shows a designed empty state when the search matches nothing (AC43)', () => {
    renderRepositorySelectorModal({ kind: 'repository-modal' })
    fireEvent.change(getSearch(), { target: { value: 'zzz-no-match' } })
    expect(getDialog().querySelectorAll('.kx-repo-modal__system')).toHaveLength(0)
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(
      screen.getByText(/no systems or repositories match your search/i),
    ).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Add repository manually — only inside the expanded active group (AC28)
// ---------------------------------------------------------------------------

describe('RepositorySelectorModal — Add repository manually (AC28)', () => {
  it('appears exactly once, inside the active system group only, and dispatches the exact manual-repo overlay', () => {
    const { bucket } = renderRepositorySelectorModal({ kind: 'repository-modal' })
    const dialog = getDialog()
    const addRepo = within(dialog).getByRole('button', { name: /add repository manually/i })
    expect(
      within(dialog).getAllByRole('button', { name: /add repository manually/i }),
    ).toHaveLength(1)

    const activeGroup = dialog.querySelector('.kx-repo-modal__system--active')
    expect(activeGroup).not.toBeNull()
    expect(addRepo.closest('.kx-repo-modal__system')).toBe(activeGroup)
    expect(addRepo.closest('.kx-repo-modal__repos')).not.toBeNull()

    fireEvent.click(addRepo)
    expect(bucket.current?.overlay).toEqual({ kind: 'manual-repo-modal' })
  })

  it('moves with the active group — never rendered inside a non-active system', () => {
    renderRepositorySelectorModal({ kind: 'repository-modal' })
    fireEvent.click(screen.getByRole('button', { name: /BSI Canteen/i }))

    const activeGroup = getDialog().querySelector('.kx-repo-modal__system--active') as HTMLElement | null
    expect(activeGroup).not.toBeNull()
    const addRepo = within(activeGroup!).getByRole('button', {
      name: /add repository manually/i,
    })
    expect(addRepo.closest('.kx-repo-modal__system')).toBe(activeGroup)
    expect(getDialog().querySelectorAll('.kx-repo-modal__add-repo')).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Footer — a single row of status/actions (AC28)
// ---------------------------------------------------------------------------

describe('RepositorySelectorModal — footer (AC28)', () => {
  it('is a single row: status left (active system + selection count), Cancel and Done right', () => {
    const { bucket } = renderRepositorySelectorModal({ kind: 'repository-modal' })
    const dialog = getDialog()
    const footers = dialog.querySelectorAll(':scope > .kx-repo-modal__footer')
    expect(footers).toHaveLength(1)
    const footer = footers[0] as HTMLElement

    const status = footer.querySelector('.kx-repo-modal__status')
    expect(status).not.toBeNull()
    expect(within(footer).getByText('BSI - HRIS')).toBeInTheDocument()
    expect(within(footer).getByText(/0 repositories selected/i)).toBeInTheDocument()

    const cancel = within(footer).getByRole('button', { name: 'Cancel' })
    const done = within(footer).getByRole('button', { name: 'Done' })
    expect(follows(status!, cancel)).toBe(true)
    expect(follows(cancel, done)).toBe(true)

    // The selection count follows the store.
    fireEvent.click(screen.getByRole('checkbox', { name: 'bsi/hris-frontend-shared' }))
    expect(within(footer).getByText(/1 repository selected/i)).toBeInTheDocument()

    // Single-row layout ships in components.css.
    expect(css).toMatch(/\.kx-repo-modal__footer\s*\{[^}]*display:\s*flex/)

    fireEvent.click(cancel)
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Done closes the modal the same way Cancel does', () => {
    const { bucket } = renderRepositorySelectorModal({ kind: 'repository-modal' })
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Demo variants — designed loading/empty states (AC43)
// ---------------------------------------------------------------------------

describe('RepositorySelectorModal — demo variants (AC43)', () => {
  it('?mock=loading renders the designed loading state instead of the system groups, keeping the frame chrome', () => {
    renderRepositorySelectorModal({ kind: 'repository-modal' }, { demoVariant: 'loading' })
    const dialog = getDialog()

    const loading = within(dialog).getByRole('status')
    expect(loading).toHaveAccessibleName(/loading/i)
    expect(dialog.querySelectorAll('.kx-repo-modal__skeleton').length).toBeGreaterThanOrEqual(3)
    expect(dialog.querySelectorAll('.kx-repo-modal__system')).toHaveLength(0)
    expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument()

    // Chrome persists — toolbar, search, and footer stay mounted.
    expect(screen.getByRole('button', { name: 'Add new system' })).toBeInTheDocument()
    expect(getSearch()).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Done' })).toBeInTheDocument()
  })

  it('?mock=empty renders the designed empty state — no groups, create affordance persists', () => {
    renderRepositorySelectorModal({ kind: 'repository-modal' }, initialState('?mock=empty'))
    const dialog = getDialog()

    expect(within(dialog).getByText(/no systems yet/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/create a system/i)).toBeInTheDocument()
    expect(dialog.querySelectorAll('.kx-repo-modal__system')).toHaveLength(0)
    expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add new system' })).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Hygiene — semantic labels, no emoji (§16)
// ---------------------------------------------------------------------------

describe('RepositorySelectorModal — hygiene', () => {
  it('labels every control semantically and uses no emoji anywhere in the dialog', () => {
    renderRepositorySelectorModal({ kind: 'repository-modal' })
    const dialog = getDialog()
    expect(dialog.textContent).not.toMatch(EMOJI)

    for (const button of within(dialog).getAllByRole('button')) {
      expect(button).toHaveAccessibleName()
    }
    for (const box of within(dialog).getAllByRole('checkbox')) {
      expect(box).toHaveAccessibleName()
    }
    expect(getSearch()).toHaveAccessibleName()
    expect(dialog).toHaveAccessibleName()
  })
})
