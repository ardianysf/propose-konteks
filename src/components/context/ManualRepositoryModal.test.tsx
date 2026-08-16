import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { vi } from 'vitest'
import ManualRepositoryModal from './ManualRepositoryModal'
import { OverlayLifecycleProvider } from '../shell/OverlayLifecycle'
import { MockupContext, useMockup } from '../../state/MockupContext'
import {
  initialState,
  mockupReducer,
  type MockupOverlay,
  type MockupState,
} from '../../state/mockupReducer'
import {
  DEFAULT_ACTIVE_SYSTEM_ID,
  EXECUTION_PROFILES,
  REPOSITORIES,
  VCS_CONNECTORS,
} from '../../data/mockData'

// ---------------------------------------------------------------------------
// Harness — the modal behind the real reducer via the mockup context,
// mounted exactly the way AppShell will mount it (integration is the
// later Task 7 part): the overlay slot renders the modal only while
// overlay.kind === 'manual-repo-modal'. A state bucket captures the
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

function renderManualRepositoryModal(
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
          {state.overlay.kind === 'manual-repo-modal' && <ManualRepositoryModal />}
        </OverlayLifecycleProvider>
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

const getDialog = () => screen.getByRole('dialog', { name: 'Add repository manually' })
const getSearch = () => screen.getByRole('searchbox', { name: 'Search repositories' })
const getConnect = () => within(getDialog()).getByRole('button', { name: 'Connect' })
const getConnector = () => screen.getByRole('combobox', { name: 'VCS Connector' })
const getExecution = () => screen.getByRole('combobox', { name: 'Execution' })
const getUrlInput = () => screen.getByRole('textbox', { name: 'Repository URL' })

/** A picker result row — accessible names start with the repository id. */
const resultButton = (repoId: string) =>
  within(getDialog()).getByRole('button', { name: new RegExp(`^${repoId}`) })

/** A selected-repository chip label. */
const chipName = (repoId: string) =>
  screen.getByText(repoId, { selector: '.kx-manual-modal__chip-name' })

const removeChipButton = (repoId: string) =>
  within(getDialog()).getByRole('button', { name: `Remove ${repoId}` })

/** Connector + Execution filled — everything except the repository itself. */
function fillRequiredSelects() {
  fireEvent.change(getConnector(), { target: { value: VCS_CONNECTORS[0].id } })
  fireEvent.change(getExecution(), { target: { value: EXECUTION_PROFILES[0].id } })
}

/** True when `later` comes after `earlier` in document order. */
const follows = (earlier: Element, later: Element) =>
  (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

// jsdom does not load stylesheets, so frame/footer rules are verified
// against the shipped CSS directly (tokens.test.ts convention).
const css = readFileSync(join(process.cwd(), 'src/styles/components.css'), 'utf8')

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

const ACTIVE_SYSTEM_REPOS = REPOSITORIES.filter(
  (repo) => repo.systemId === DEFAULT_ACTIVE_SYSTEM_ID,
)

// ---------------------------------------------------------------------------
// Frame + mount gating (spec §8.2, §16)
// ---------------------------------------------------------------------------

describe('ManualRepositoryModal — frame', () => {
  it('renders only while the manual-repo-modal overlay is open — no other overlay kind mounts it', () => {
    const closed = renderManualRepositoryModal()
    expect(closed.container.querySelector('.kx-manual-modal')).toBeNull()
    closed.unmount()

    const other = renderManualRepositoryModal({ kind: 'repository-modal' })
    expect(other.container.querySelector('.kx-manual-modal')).toBeNull()
    other.unmount()

    renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    expect(getDialog()).toBeInTheDocument()
  })

  it('is a centered modal dialog over the shared backdrop — role=dialog, aria-modal, labelled by its title', () => {
    renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    const dialog = getDialog()
    expect(dialog).toHaveClass('kx-modal', 'kx-manual-modal')
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    const title = within(dialog).getByRole('heading', { name: 'Add repository manually' })
    expect(title.tagName).toBe('H2')

    // Exactly one backdrop, mounted before the dialog in document order.
    const backdrop = document.querySelector('.kx-modal-backdrop')
    expect(backdrop).not.toBeNull()
    expect(follows(backdrop!, dialog)).toBe(true)

    // Header dismiss control.
    expect(within(dialog).getAllByRole('button', { name: 'Close' })).toHaveLength(1)

    // Frame + backdrop geometry ship in components.css.
    expect(css).toContain('.kx-manual-modal')
    expect(css).toContain('.kx-modal-backdrop')
  })

  it('moves focus to the dialog on mount', () => {
    renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    expect(getDialog()).toHaveFocus()
  })

  it('Escape dispatches CLOSE_OVERLAY and unmounts the dialog', () => {
    const { bucket } = renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes from the header dismiss control too', () => {
    const { bucket } = renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Cancel closes the modal', () => {
    const { bucket } = renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    fireEvent.click(within(getDialog()).getByRole('button', { name: 'Cancel' }))
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// VCS Connector — required labeled select (AC29)
// ---------------------------------------------------------------------------

describe('ManualRepositoryModal — VCS Connector (AC29)', () => {
  it('renders a required, labeled select with a placeholder and every connector', () => {
    renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    const connector = getConnector()
    expect(connector).toBeRequired()
    expect(connector).toHaveValue('')

    const options = within(connector).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual([
      'Select a VCS connector',
      ...VCS_CONNECTORS.map((each) => each.name),
    ])
  })
})

// ---------------------------------------------------------------------------
// Repository picker — searchable, active-system scoped, paginated (AC29)
// ---------------------------------------------------------------------------

describe('ManualRepositoryModal — repository picker (AC29)', () => {
  it('renders one searchbox over the active system with a result count and its repositories as result rows', () => {
    renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    const dialog = getDialog()
    expect(within(dialog).getAllByRole('searchbox')).toHaveLength(1)

    // Result count + page indicator ship with the picker footer.
    expect(within(dialog).getByText(`${ACTIVE_SYSTEM_REPOS.length} results`)).toBeInTheDocument()
    expect(within(dialog).getByText('Page 1 of 2')).toBeInTheDocument()

    // Page 1 shows the first two active-system repositories…
    expect(resultButton(ACTIVE_SYSTEM_REPOS[0].id)).toBeInTheDocument()
    expect(resultButton(ACTIVE_SYSTEM_REPOS[1].id)).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: new RegExp(`^${ACTIVE_SYSTEM_REPOS[2].id}`) })).not.toBeInTheDocument()
  })

  it('paginates with Previous/Next — disabled at the edges — while the count stays the total', () => {
    renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    const previous = () => within(getDialog()).getByRole('button', { name: 'Previous' })
    const next = () => within(getDialog()).getByRole('button', { name: 'Next' })

    expect(previous()).toBeDisabled()
    expect(next()).toBeEnabled()

    fireEvent.click(next())
    expect(within(getDialog()).getByText('Page 2 of 2')).toBeInTheDocument()
    expect(resultButton(ACTIVE_SYSTEM_REPOS[2].id)).toBeInTheDocument()
    expect(within(getDialog()).queryByRole('button', { name: new RegExp(`^${ACTIVE_SYSTEM_REPOS[0].id}`) })).not.toBeInTheDocument()
    expect(previous()).toBeEnabled()
    expect(next()).toBeDisabled()

    fireEvent.click(previous())
    expect(within(getDialog()).getByText('Page 1 of 2')).toBeInTheDocument()
    expect(previous()).toBeDisabled()
    expect(within(getDialog()).getByText(`${ACTIVE_SYSTEM_REPOS.length} results`)).toBeInTheDocument()
  })

  it('narrows by search to a single page and shows a designed empty state when nothing matches (AC43)', () => {
    renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    fireEvent.change(getSearch(), { target: { value: 'shared' } })

    expect(within(getDialog()).getByText('1 result')).toBeInTheDocument()
    expect(within(getDialog()).getByText('Page 1 of 1')).toBeInTheDocument()
    expect(resultButton(ACTIVE_SYSTEM_REPOS[0].id)).toBeInTheDocument()
    expect(within(getDialog()).getByRole('button', { name: 'Next' })).toBeDisabled()

    fireEvent.change(getSearch(), { target: { value: 'zzz-no-match' } })
    expect(within(getDialog()).queryByRole('button', { name: /^bsi\// })).not.toBeInTheDocument()
    expect(within(getDialog()).getByText(/no matching repositories/i)).toBeInTheDocument()
    expect(within(getDialog()).getByText(/enter the url manually/i)).toBeInTheDocument()
  })

  it('searches only the active system — other systems’ repositories are never offered', () => {
    renderManualRepositoryModal({ kind: 'manual-repo-modal' }, { activeSystemId: 'bsi-canteen' })
    const dialog = getDialog()
    expect(within(dialog).getByText('2 results')).toBeInTheDocument()

    fireEvent.change(getSearch(), { target: { value: 'bsi/' } })
    expect(within(dialog).getByText('2 results')).toBeInTheDocument()
    expect(resultButton('bsi/canteen-backend')).toBeInTheDocument()
    expect(resultButton('bsi/canteen-cms')).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: /^bsi\/hris/ })).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Enter URL manually — the http(s) escape hatch (AC29)
// ---------------------------------------------------------------------------

describe('ManualRepositoryModal — Enter URL manually (AC29)', () => {
  it('swaps the picker for a URL input and back', () => {
    renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    fireEvent.click(within(getDialog()).getByRole('button', { name: 'Enter URL manually' }))

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(getUrlInput()).toBeInTheDocument()

    fireEvent.click(within(getDialog()).getByRole('button', { name: 'Search repositories instead' }))
    expect(getSearch()).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Repository URL' })).not.toBeInTheDocument()
  })

  it('adds only full http(s) URLs as chips — Add URL stays disabled otherwise (AC43)', () => {
    renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    fireEvent.click(within(getDialog()).getByRole('button', { name: 'Enter URL manually' }))
    const add = within(getDialog()).getByRole('button', { name: 'Add URL' })
    expect(add).toBeDisabled() // empty

    fireEvent.change(getUrlInput(), { target: { value: 'ftp://example.com/org/repo' } })
    expect(add).toBeDisabled() // wrong scheme
    expect(within(getDialog()).getByRole('alert')).toHaveTextContent(/http\(s\)/i)

    fireEvent.change(getUrlInput(), { target: { value: 'github.com/org/repo' } })
    expect(add).toBeDisabled() // no scheme

    fireEvent.change(getUrlInput(), { target: { value: 'https://github.com/org/repo' } })
    expect(add).toBeEnabled()
    fireEvent.click(add)

    expect(chipName('https://github.com/org/repo')).toBeInTheDocument()
    expect(getUrlInput()).toHaveValue('') // ready for the next URL
  })
})

// ---------------------------------------------------------------------------
// Selected repositories — removable chips + queue another (AC29)
// ---------------------------------------------------------------------------

describe('ManualRepositoryModal — selected chips (AC29)', () => {
  it('renders picker selections as removable chips and disables the picked result row', () => {
    renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    const shared = resultButton(ACTIVE_SYSTEM_REPOS[0].id)

    fireEvent.click(shared)
    expect(chipName(ACTIVE_SYSTEM_REPOS[0].id)).toBeInTheDocument()
    expect(within(getDialog()).getByRole('button', { name: `Remove ${ACTIVE_SYSTEM_REPOS[0].id}` })).toBeInTheDocument()
    expect(shared).toBeDisabled()

    fireEvent.click(removeChipButton(ACTIVE_SYSTEM_REPOS[0].id))
    expect(document.querySelector('.kx-manual-modal__chip-name')).toBeNull()
    expect(shared).toBeEnabled()
  })

  it('flags store-selected repositories without blocking them, and “Add another repository” queues the next selection', () => {
    renderManualRepositoryModal(
      { kind: 'manual-repo-modal' },
      { selectedRepoIds: [ACTIVE_SYSTEM_REPOS[0].id] },
    )
    // Already committed to the store — surfaced as a flag, still pickable.
    expect(resultButton(ACTIVE_SYSTEM_REPOS[0].id)).toHaveTextContent(/selected/i)
    expect(resultButton(ACTIVE_SYSTEM_REPOS[0].id)).toBeEnabled()

    fireEvent.change(getSearch(), { target: { value: 'shared' } })
    fireEvent.click(resultButton(ACTIVE_SYSTEM_REPOS[0].id))

    // Queue another: the picker resets and takes focus for the next pick.
    fireEvent.click(within(getDialog()).getByRole('button', { name: 'Add another repository' }))
    expect(getSearch()).toHaveFocus()
    expect(getSearch()).toHaveValue('')
    fireEvent.click(resultButton(ACTIVE_SYSTEM_REPOS[1].id))
    expect(chipName(ACTIVE_SYSTEM_REPOS[1].id)).toBeInTheDocument()

    // In URL mode the same action focuses the URL input.
    fireEvent.click(within(getDialog()).getByRole('button', { name: 'Enter URL manually' }))
    fireEvent.change(getUrlInput(), { target: { value: 'https://gitlab.com/org/tooling' } })
    fireEvent.click(within(getDialog()).getByRole('button', { name: 'Add URL' }))
    fireEvent.click(within(getDialog()).getByRole('button', { name: 'Add another repository' }))
    expect(getUrlInput()).toHaveFocus()
  })
})

// ---------------------------------------------------------------------------
// Execution + Require private network (AC29)
// ---------------------------------------------------------------------------

describe('ManualRepositoryModal — Execution + private network (AC29)', () => {
  it('renders a required, labeled Execution select with a placeholder and every profile', () => {
    renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    const execution = getExecution()
    expect(execution).toBeRequired()
    expect(execution).toHaveValue('')

    const options = within(execution).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual([
      'Select an execution profile',
      ...EXECUTION_PROFILES.map((profile) => profile.name),
    ])

    fireEvent.change(execution, { target: { value: EXECUTION_PROFILES[1].id } })
    expect(execution).toHaveValue(EXECUTION_PROFILES[1].id)
  })

  it('offers an unchecked “Require private network” toggle that never blocks Connect', () => {
    renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    fillRequiredSelects()
    fireEvent.click(resultButton(ACTIVE_SYSTEM_REPOS[0].id))
    expect(getConnect()).toBeEnabled()

    const network = screen.getByRole('checkbox', { name: 'Require private network' })
    expect(network).not.toBeChecked()
    fireEvent.click(network)
    expect(network).toBeChecked()
    expect(getConnect()).toBeEnabled() // optional — validity unchanged
    fireEvent.click(network)
    expect(network).not.toBeChecked()
  })
})

// ---------------------------------------------------------------------------
// Cancel / Connect — disabled validation (AC29, AC43)
// ---------------------------------------------------------------------------

describe('ManualRepositoryModal — Cancel/Connect validation (AC29, AC43)', () => {
  it('Connect stays disabled until connector, execution, and a repository are all supplied', () => {
    renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    expect(getConnect()).toBeDisabled()

    fireEvent.change(getConnector(), { target: { value: VCS_CONNECTORS[0].id } })
    expect(getConnect()).toBeDisabled() // execution + repository still missing

    fillRequiredSelects() // connector + execution — everything except the repository
    expect(getConnect()).toBeDisabled()

    fireEvent.click(resultButton(ACTIVE_SYSTEM_REPOS[0].id))
    expect(getConnect()).toBeEnabled()

    // Removing the only repository re-disables Connect.
    fireEvent.click(removeChipButton(ACTIVE_SYSTEM_REPOS[0].id))
    expect(getConnect()).toBeDisabled()
  })

  it('treats an invalid pending URL as an invalid field — Connect stays disabled until it is valid', () => {
    renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    fillRequiredSelects()
    fireEvent.click(resultButton(ACTIVE_SYSTEM_REPOS[0].id))
    expect(getConnect()).toBeEnabled()

    fireEvent.click(within(getDialog()).getByRole('button', { name: 'Enter URL manually' }))
    fireEvent.change(getUrlInput(), { target: { value: 'not-a-url' } })
    expect(getConnect()).toBeDisabled()

    fireEvent.change(getUrlInput(), { target: { value: 'https://github.com/org/repo' } })
    expect(getConnect()).toBeEnabled()
  })
})

// ---------------------------------------------------------------------------
// Connect commit — TOGGLE_REPO for new known repos only, then close
// ---------------------------------------------------------------------------

describe('ManualRepositoryModal — Connect commit', () => {
  it('adds only newly selected known repositories via TOGGLE_REPO, skips URL entries, and closes — with no network', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const { bucket } = renderManualRepositoryModal(
      { kind: 'manual-repo-modal' },
      { selectedRepoIds: [ACTIVE_SYSTEM_REPOS[0].id] },
    )

    fillRequiredSelects()
    // One chip the store already holds (re-toggling would deselect it),
    // one genuinely new known repository, and one URL entry with no
    // repository record to commit.
    fireEvent.click(resultButton(ACTIVE_SYSTEM_REPOS[0].id))
    fireEvent.click(resultButton(ACTIVE_SYSTEM_REPOS[1].id))
    fireEvent.click(within(getDialog()).getByRole('button', { name: 'Enter URL manually' }))
    fireEvent.change(getUrlInput(), { target: { value: 'https://github.com/org/new-repo' } })
    fireEvent.click(within(getDialog()).getByRole('button', { name: 'Add URL' }))

    fireEvent.click(getConnect())
    expect(bucket.current?.selectedRepoIds).toEqual([
      ACTIVE_SYSTEM_REPOS[0].id,
      ACTIVE_SYSTEM_REPOS[1].id,
    ])
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled() // local mockup state only — no network
    vi.unstubAllGlobals()
  })
})

// ---------------------------------------------------------------------------
// Demo variants — designed loading/empty states (AC43)
// ---------------------------------------------------------------------------

describe('ManualRepositoryModal — demo variants (AC43)', () => {
  it('?mock=loading renders the designed loading state instead of results, keeping the frame chrome', () => {
    renderManualRepositoryModal({ kind: 'manual-repo-modal' }, { demoVariant: 'loading' })
    const dialog = getDialog()

    const loading = within(dialog).getByRole('status')
    expect(loading).toHaveAccessibleName(/loading/i)
    expect(dialog.querySelectorAll('.kx-manual-modal__skeleton').length).toBeGreaterThanOrEqual(3)
    expect(within(dialog).queryByRole('button', { name: /^bsi\// })).not.toBeInTheDocument()
    expect(within(dialog).queryByText(/results/)).not.toBeInTheDocument()

    // Chrome persists — connector, search, execution, and footer stay mounted.
    expect(getConnector()).toBeInTheDocument()
    expect(getSearch()).toBeInTheDocument()
    expect(getExecution()).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(getConnect()).toBeDisabled()
  })

  it('?mock=empty renders the designed empty state — no results, URL escape hatch still reachable', () => {
    renderManualRepositoryModal({ kind: 'manual-repo-modal' }, initialState('?mock=empty'))
    const dialog = getDialog()

    expect(within(dialog).getByText(/no repositories yet/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/enter a repository url manually/i)).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: /^bsi\// })).not.toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Enter URL manually' }))
    expect(getUrlInput()).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Hygiene — semantic labels, no emoji (§16)
// ---------------------------------------------------------------------------

describe('ManualRepositoryModal — hygiene', () => {
  it('labels every control semantically and uses no emoji anywhere in the dialog', () => {
    renderManualRepositoryModal({ kind: 'manual-repo-modal' })
    const dialog = getDialog()
    expect(dialog.textContent).not.toMatch(EMOJI)

    for (const button of within(dialog).getAllByRole('button')) {
      expect(button).toHaveAccessibleName()
    }
    for (const box of within(dialog).getAllByRole('checkbox')) {
      expect(box).toHaveAccessibleName()
    }
    for (const select of within(dialog).getAllByRole('combobox')) {
      expect(select).toHaveAccessibleName()
    }
    expect(getSearch()).toHaveAccessibleName()
    expect(dialog).toHaveAccessibleName()
  })
})
