import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { getAggregatedCss } from '../../test/cssAggregate'
import RepositorySelectorModal from './RepositorySelectorModal'
import CreateSystemModal from './CreateSystemModal'
import { OverlayLifecycleProvider } from '../shell/OverlayLifecycle'
import { MockupContext, useMockup } from '../../state/MockupContext'
import {
  initialState,
  mockupReducer,
  type MockupOverlay,
  type MockupState,
} from '../../state/mockupReducer'
import { SYSTEMS } from '../../data/mockData'

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
// Style-contract source: aggregated stylesheets (spec addendum §8).
const css = getAggregatedCss()

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

    const other = renderRepositorySelectorModal({ kind: 'create-system-modal', source: 'system-menu' })
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
    expect(bucket.current?.overlay).toEqual({ kind: 'create-system-modal', source: 'repository-modal' })
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

    // Every system still renders its own head with its repository count,
    // but only the active group expands its repo rows — every inactive
    // system stays collapsed to its selector row (AC25 new contract).
    for (const system of SYSTEMS) {
      const group = within(dialog)
        .getByRole('button', { name: new RegExp(system.name, 'i') })
        .closest('.kx-repo-modal__system') as HTMLElement | null
      expect(group).not.toBeNull()
      const count = system.repoIds.length
      expect(group).toHaveTextContent(
        `${count} ${count === 1 ? 'repository' : 'repositories'}`,
      )
      if (system.id === ACTIVE_SYSTEM.id) {
        expect(within(group!).getAllByRole('checkbox')).toHaveLength(count)
      } else {
        expect(within(group!).queryByRole('checkbox')).not.toBeInTheDocument()
      }
    }
  })

  it('exposes checkboxes only within the active system — every other system renders zero checkboxes', () => {
    renderRepositorySelectorModal({ kind: 'repository-modal' })
    const dialog = getDialog()
    const boxes = within(dialog).getAllByRole('checkbox')
    expect(boxes).toHaveLength(ACTIVE_SYSTEM.repoIds.length)

    // Every rendered checkbox belongs to the active system and is enabled.
    for (const box of boxes) {
      const repoId = box.getAttribute('aria-label') ?? ''
      expect(ACTIVE_SYSTEM.repoIds).toContain(repoId)
      expect(box).toBeEnabled()
    }

    // Inactive systems collapse to their selector rows: their repositories
    // are absent from the accessibility tree entirely — no disabled rows.
    for (const system of SYSTEMS) {
      if (system.id === ACTIVE_SYSTEM.id) continue
      const group = within(dialog)
        .getByRole('button', { name: new RegExp(system.name, 'i') })
        .closest('.kx-repo-modal__system') as HTMLElement
      expect(group.querySelectorAll('.kx-repo-modal__repo')).toHaveLength(0)
      for (const repoId of system.repoIds) {
        expect(within(dialog).queryByRole('checkbox', { name: repoId })).not.toBeInTheDocument()
      }
    }
  })

  it('checks active-system repositories through the draft (TOGGLE_SESSION_DRAFT_REPO)', () => {
    const { bucket } = renderRepositorySelectorModal({ kind: 'repository-modal' })
    const shared = screen.getByRole('checkbox', { name: 'bsi/hris-frontend-shared' })
    expect(shared).not.toBeChecked()

    fireEvent.click(shared)
    expect(bucket.current?.sessionContextDraft).toEqual({
      systemId: 'bsi-hris',
      repoIds: ['bsi/hris-frontend-shared'],
    })
    expect(shared).toBeChecked()

    fireEvent.click(shared)
    expect(bucket.current?.sessionContextDraft).toEqual({ systemId: 'bsi-hris', repoIds: [] })
    expect(shared).not.toBeChecked()
  })
})

// ---------------------------------------------------------------------------
// Switching the active system (AC26)
// ---------------------------------------------------------------------------

describe('RepositorySelectorModal — switching systems (AC26)', () => {
  it('switches the draft system, moves the active group, and clears the draft selection', () => {
    const { bucket } = renderRepositorySelectorModal({ kind: 'repository-modal' })
    fireEvent.click(screen.getByRole('checkbox', { name: 'bsi/hris-frontend-shared' }))
    expect(bucket.current?.sessionContextDraft?.repoIds).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: /BSI Canteen/i }))
    expect(bucket.current?.sessionContextDraft).toEqual({ systemId: 'bsi-canteen', repoIds: [] })

    // The active group moves: BSI Canteen expands its enabled checkboxes
    // while the previous system's rows leave the tree entirely (AC26).
    expect(screen.getByRole('checkbox', { name: 'bsi/canteen-backend' })).toBeEnabled()
    expect(
      screen.queryByRole('checkbox', { name: 'bsi/hris-frontend-shared' }),
    ).not.toBeInTheDocument()

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

    // The surviving system is not the active one, so its matching repos
    // stay collapsed away until its head is selected…
    expect(
      screen.queryByRole('checkbox', { name: 'bsi/canteen-backend' }),
    ).not.toBeInTheDocument()
    // …and selecting it reveals the query-filtered repo rows.
    fireEvent.click(screen.getByRole('button', { name: /BSI Canteen/i }))
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
// Suspended — nested Create System keeps this modal mounted behind the
// nested dialog (repository-sourced flow)
// ---------------------------------------------------------------------------

describe('RepositorySelectorModal — suspended under the nested Create System modal', () => {
  /** Mirrors the AppShell nesting: the selector stays mounted (suspended)
   *  while the repository-sourced create-system overlay is active, exactly
   *  as the real shell mounts it. */
  function renderNestedStack(initial?: Partial<MockupState>) {
    const bucket: StateBucket = { current: null }

    function Harness() {
      const [state, dispatch] = useReducer(mockupReducer, {
        ...initialState(),
        ...initial,
        overlay: { kind: 'create-system-modal', source: 'repository-modal' },
      })
      const suspended =
        state.overlay.kind === 'create-system-modal' && state.overlay.source === 'repository-modal'
      return (
        <MockupContext.Provider value={{ state, dispatch }}>
          <StateProbe bucket={bucket} />
          <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
            {(state.overlay.kind === 'repository-modal' || suspended) && (
              <RepositorySelectorModal suspended={suspended} />
            )}
            {state.overlay.kind === 'create-system-modal' && <CreateSystemModal />}
          </OverlayLifecycleProvider>
        </MockupContext.Provider>
      )
    }

    return { ...render(<Harness />), bucket }
  }

  const getRepoDialogElement = () => document.querySelector('.kx-repo-modal') as HTMLElement
  const getCreateDialog = () => screen.getByRole('dialog', { name: 'Create a new system' })

  it('stays visually mounted but suspended — aria-hidden, pointer-inert classes, below the nested dialog in DOM order', () => {
    renderNestedStack()

    // The suspended dialog is out of the accessibility tree: only the
    // nested create dialog is an accessible dialog.
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(
      screen.queryByRole('dialog', { name: 'Choose work repositories' }),
    ).not.toBeInTheDocument()

    const repoDialog = getRepoDialogElement()
    expect(repoDialog).toHaveAttribute('aria-hidden', 'true')
    expect(repoDialog).toHaveClass('kx-repo-modal--suspended')

    // Two stacked backdrops — suspended repository first, nested create on
    // top in document order.
    const backdrops = document.querySelectorAll('.kx-modal-backdrop')
    expect(backdrops).toHaveLength(2)
    expect(backdrops[0]).toHaveClass('kx-modal-backdrop--suspended')
    expect(backdrops[1]).toHaveClass('kx-modal-backdrop--nested')
    expect(follows(repoDialog, getCreateDialog())).toBe(true)

    // Pointer inertness + dimming ship in components.css — the grouped
    // selector was split so the suspended dialog also gets the dim/blur
    // treatment the backdrop alone can't provide.
    expect(css).toMatch(/\.kx-modal-backdrop--suspended\s*\{[^}]*pointer-events:\s*none/s)
    expect(css).toMatch(/\.kx-repo-modal--suspended\s*\{[^}]*pointer-events:\s*none[^}]*filter:\s*blur/s)
  })

  it('stands down from focus containment while suspended — the nested dialog owns focus', () => {
    renderNestedStack()
    expect(getCreateDialog()).toHaveFocus()
    expect(getRepoDialogElement()).not.toHaveFocus()
  })

  it('keeps its reducer-backed search and draft state across the suspension', () => {
    const { bucket } = renderNestedStack({
      search: { systems: '', repositories: 'canteen', components: '', sessions: '' },
      sessionContextDraft: { systemId: 'bsi-canteen', repoIds: ['bsi/canteen-backend'] },
    })

    // The suspended frame still renders the reducer-backed values: the
    // search input keeps its query and the draft selection survives. The
    // dialog is aria-hidden, so role queries cannot see it — read the
    // rendered input nodes directly instead.
    const repoDialog = getRepoDialogElement()
    const search = repoDialog.querySelector('.kx-repo-modal__search') as HTMLInputElement
    expect(search.value).toBe('canteen')
    const canteenCheck = repoDialog.querySelector(
      'input[aria-label="bsi/canteen-backend"]',
    ) as HTMLInputElement
    expect(canteenCheck.checked).toBe(true)

    // Canceling the nested create returns here without losing them.
    fireEvent.click(within(getCreateDialog()).getByRole('button', { name: 'Cancel' }))
    expect(bucket.current?.overlay).toEqual({ kind: 'repository-modal' })
    expect(
      (getRepoDialogElement().querySelector('.kx-repo-modal__search') as HTMLInputElement).value,
    ).toBe('canteen')
    // Re-exposed to the accessibility tree, the same draft is queryable again.
    expect(screen.getByRole('checkbox', { name: 'bsi/canteen-backend' })).toBeChecked()
    expect(bucket.current?.sessionContextDraft).toEqual({
      systemId: 'bsi-canteen',
      repoIds: ['bsi/canteen-backend'],
    })
    // Nothing committed while the create was nested above.
    expect(bucket.current?.sessionContext).toBeNull()
  })

  it('reactivates when the nested create closes — the repository dialog is exposed again and focus containment restores focus to it', () => {
    const { bucket } = renderNestedStack()

    fireEvent.click(within(getCreateDialog()).getByRole('button', { name: 'Cancel' }))
    expect(bucket.current?.overlay).toEqual({ kind: 'repository-modal' })

    const repoDialog = getRepoDialogElement()
    expect(repoDialog).not.toHaveAttribute('aria-hidden')
    expect(repoDialog).not.toHaveClass('kx-repo-modal--suspended')
    expect(screen.getByRole('dialog', { name: 'Choose work repositories' })).toBeInTheDocument()
    expect(repoDialog).toHaveFocus()
    expect(document.querySelectorAll('.kx-modal-backdrop')).toHaveLength(1)
  })

  it('a successful nested create returns here with the new system selected in the draft and no repositories checked', () => {
    const { bucket } = renderNestedStack()

    fireEvent.change(
      within(getCreateDialog()).getByRole('textbox', { name: /^name/i }),
      { target: { value: 'QA Platform' } },
    )
    fireEvent.click(within(getCreateDialog()).getByRole('button', { name: 'Create' }))

    expect(bucket.current?.overlay).toEqual({ kind: 'repository-modal' })
    const created = bucket.current!.systems[bucket.current!.systems.length - 1]
    expect(created.name).toBe('QA Platform')
    expect(bucket.current?.sessionContextDraft).toEqual({ systemId: created.id, repoIds: [] })

    // The reactivated selector shows the new system as the active group…
    const repoDialog = getRepoDialogElement()
    const activeHead = repoDialog.querySelector('.kx-repo-modal__system-head[aria-current="true"]')
    expect(activeHead).not.toBeNull()
    expect(activeHead!).toHaveTextContent(/QA Platform/i)
    // …with an empty repository scope: the new system's active group has
    // no repo rows, and — collapsed-system contract — it is the only group
    // that could render any, so the tree holds zero checkboxes.
    const activeGroup = repoDialog.querySelector('.kx-repo-modal__system--active') as HTMLElement
    expect(activeGroup.querySelectorAll('.kx-repo-modal__repo')).toHaveLength(0)
    expect(within(repoDialog).queryByRole('checkbox')).not.toBeInTheDocument()
    // The status reports the empty scope and nothing has committed yet.
    expect(within(repoDialog).getByText(/0 repositories selected/i)).toBeInTheDocument()
    expect(bucket.current?.sessionContext).toBeNull()

    // Done is the only commit — it lands the draft as the session
    // context, clears the draft, and closes the whole chain.
    fireEvent.click(within(repoDialog).getByRole('button', { name: 'Done' }))
    expect(bucket.current?.sessionContext).toEqual({ systemId: created.id, repoIds: [] })
    expect(bucket.current?.sessionContextDraft).toBeNull()
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
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
