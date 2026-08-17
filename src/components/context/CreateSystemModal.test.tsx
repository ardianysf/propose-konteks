import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { vi } from 'vitest'
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
// mounted exactly the way AppShell mounts it (Task 7 Part C): the
// overlay slot renders the modal only while overlay.kind ===
// 'create-system-modal'. A state bucket captures the committed store for
// dispatch assertions.
// ---------------------------------------------------------------------------

type StateBucket = { current: MockupState | null }

function StateProbe({ bucket }: { bucket: StateBucket }) {
  const { state } = useMockup()
  useEffect(() => {
    bucket.current = state
  })
  return null
}

function renderCreateSystemModal(
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
          {state.overlay.kind === 'create-system-modal' && <CreateSystemModal />}
        </OverlayLifecycleProvider>
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

const getDialog = () => screen.getByRole('dialog', { name: 'Create a new system' })
const getNameInput = () => screen.getByRole('textbox', { name: /^name/i })
const getDescriptionInput = () => screen.getByRole('textbox', { name: /description/i })
const getCreate = () => within(getDialog()).getByRole('button', { name: 'Create' })

/** True when `later` comes after `earlier` in document order. */
const follows = (earlier: Element, later: Element) =>
  (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

// jsdom does not load stylesheets, so frame/footer rules are verified
// against the shipped CSS directly (tokens.test.ts convention).
const css = readFileSync(join(process.cwd(), 'src/styles/components.css'), 'utf8')

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

// ---------------------------------------------------------------------------
// Frame + mount gating (spec §8.3, §16)
// ---------------------------------------------------------------------------

describe('CreateSystemModal — frame', () => {
  it('renders only while the create-system-modal overlay is open — no other overlay kind mounts it', () => {
    const closed = renderCreateSystemModal()
    expect(closed.container.querySelector('.kx-create-modal')).toBeNull()
    closed.unmount()

    const other = renderCreateSystemModal({ kind: 'repository-modal' })
    expect(other.container.querySelector('.kx-create-modal')).toBeNull()
    other.unmount()

    renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
    expect(getDialog()).toBeInTheDocument()
  })

  it('is a centered modal dialog over the shared backdrop — role=dialog, aria-modal, labelled by its title', () => {
    renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
    const dialog = getDialog()
    expect(dialog).toHaveClass('kx-modal', 'kx-create-modal')
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    const title = within(dialog).getByRole('heading', { name: 'Create a new system' })
    expect(title.tagName).toBe('H2')

    // Exactly one backdrop, mounted before the dialog in document order.
    const backdrop = document.querySelector('.kx-modal-backdrop')
    expect(backdrop).not.toBeNull()
    expect(follows(backdrop!, dialog)).toBe(true)

    // Header dismiss control.
    expect(within(dialog).getAllByRole('button', { name: 'Close' })).toHaveLength(1)

    // Frame + backdrop geometry ship in components.css.
    expect(css).toContain('.kx-create-modal')
    expect(css).toContain('.kx-modal-backdrop')
  })

  it('moves focus to the dialog on mount', () => {
    renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
    expect(getDialog()).toHaveFocus()
  })

  it('Escape dispatches CLOSE_OVERLAY and unmounts the dialog', () => {
    const { bucket } = renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes from the header dismiss control too', () => {
    const { bucket } = renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Cancel closes without touching systems or the current selection', () => {
    const { bucket } = renderCreateSystemModal(
      { kind: 'create-system-modal', source: 'system-menu' },
      { selectedRepoIds: ['bsi/hris-frontend-shared'] },
    )
    fireEvent.click(within(getDialog()).getByRole('button', { name: 'Cancel' }))
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(bucket.current?.systems).toHaveLength(SYSTEMS.length)
    expect(bucket.current?.selectedRepoIds).toEqual(['bsi/hris-frontend-shared'])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Field contract — Name required, Description optional, helper (AC33)
// ---------------------------------------------------------------------------

describe('CreateSystemModal — fields', () => {
  it('labels Name with a visible required cue', () => {
    renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
    const name = getNameInput()
    expect(name).toHaveAccessibleName(/name/i)
    expect(name.tagName).toBe('INPUT')
    expect(name).toHaveAttribute('required')

    // The cue is visible text inside the label itself.
    const label = getDialog().querySelector(`label[for="${name.id}"]`)
    expect(label).not.toBeNull()
    expect(label!).toHaveTextContent(/required/i)
  })

  it('labels Description as optional — a multi-line input, never required', () => {
    renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
    const description = getDescriptionInput()
    expect(description.tagName).toBe('TEXTAREA')
    expect(description).not.toHaveAttribute('required')

    const label = getDialog().querySelector(`label[for="${description.id}"]`)
    expect(label).not.toBeNull()
    expect(label!).toHaveTextContent(/optional/i)
  })

  it('carries a concise helper explaining that systems group repositories and components', () => {
    renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
    const helper = getDialog().querySelector('.kx-create-modal__helper')
    expect(helper).not.toBeNull()
    expect(helper!).toHaveTextContent(/group repositories and components/i)
    // Concise — one sentence, under 140 characters.
    expect(helper!.textContent!.length).toBeLessThan(140)
  })
})

// ---------------------------------------------------------------------------
// Create gating — disabled while the name is blank/whitespace (AC43)
// ---------------------------------------------------------------------------

describe('CreateSystemModal — Create gating (AC43)', () => {
  it('starts disabled while the name is blank', () => {
    renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
    expect(getCreate()).toBeDisabled()
  })

  it('stays disabled for whitespace-only names', () => {
    renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
    fireEvent.change(getNameInput(), { target: { value: '   ' } })
    expect(getCreate()).toBeDisabled()

    fireEvent.change(getNameInput(), { target: { value: '\t\n ' } })
    expect(getCreate()).toBeDisabled()
  })

  it('enables once the name has visible characters — surrounding whitespace is fine', () => {
    renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
    fireEvent.change(getNameInput(), { target: { value: 'QA Platform' } })
    expect(getCreate()).toBeEnabled()

    fireEvent.change(getNameInput(), { target: { value: '  QA Platform  ' } })
    expect(getCreate()).toBeEnabled()

    // And gates closed again when the name is emptied.
    fireEvent.change(getNameInput(), { target: { value: '' } })
    expect(getCreate()).toBeDisabled()
  })
})

// ---------------------------------------------------------------------------
// Submit — CREATE_SYSTEM, then close (AC33, reducer-proven)
// ---------------------------------------------------------------------------

describe('CreateSystemModal — submit (AC33)', () => {
  it('dispatches CREATE_SYSTEM with name + description then CLOSE_OVERLAY — the new system becomes active and the repo selection clears', () => {
    const { bucket } = renderCreateSystemModal(
      { kind: 'create-system-modal', source: 'system-menu' },
      { selectedRepoIds: ['bsi/hris-frontend-shared'] },
    )
    fireEvent.change(getNameInput(), { target: { value: 'QA Platform' } })
    fireEvent.change(getDescriptionInput(), { target: { value: 'Quality automation suite' } })

    fireEvent.click(getCreate())

    const state = bucket.current!
    expect(state.overlay).toEqual({ kind: 'none' })
    expect(state.systems).toHaveLength(SYSTEMS.length + 1)
    const created = state.systems[state.systems.length - 1]
    expect(created.name).toBe('QA Platform')
    expect(created.description).toBe('Quality automation suite')
    expect(created.repoIds).toEqual([])
    // Reducer-proven (AC33): the created system becomes active and the
    // previous repository selection is cleared.
    expect(state.activeSystemId).toBe(created.id)
    expect(state.selectedRepoIds).toEqual([])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('returns to the repository modal with the new system selected in the draft when created from the repository source — the session context is not committed', () => {
    const { bucket } = renderCreateSystemModal(
      { kind: 'create-system-modal', source: 'repository-modal' },
      { selectedRepoIds: ['bsi/hris-frontend-shared'] },
    )
    fireEvent.change(getNameInput(), { target: { value: 'QA Platform' } })
    fireEvent.click(getCreate())

    const state = bucket.current!
    const created = state.systems[state.systems.length - 1]
    expect(created.name).toBe('QA Platform')
    // The draft chooses the new system with an empty repository scope…
    expect(state.sessionContextDraft).toEqual({ systemId: created.id, repoIds: [] })
    // …and the modal returns to the repository selector instead of closing.
    expect(state.overlay).toEqual({ kind: 'repository-modal' })
    // The committed session context is untouched — it lands only after Done.
    expect(state.sessionContext).toBeNull()
    expect(state.activeSystemId).toBe(created.id)
  })

  it('omits the description when blank — CREATE_SYSTEM lands without one', () => {
    const { bucket } = renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
    fireEvent.change(getNameInput(), { target: { value: 'QA Platform' } })
    fireEvent.click(getCreate())

    const created = bucket.current!.systems[bucket.current!.systems.length - 1]
    expect(created.description).toBeUndefined()
  })

  it('trims the name and description before committing', () => {
    const { bucket } = renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
    fireEvent.change(getNameInput(), { target: { value: '  QA Platform  ' } })
    fireEvent.change(getDescriptionInput(), { target: { value: '  Quality automation  ' } })
    fireEvent.click(getCreate())

    const created = bucket.current!.systems[bucket.current!.systems.length - 1]
    expect(created.name).toBe('QA Platform')
    expect(created.description).toBe('Quality automation')
  })

  it('never dispatches CREATE_SYSTEM for a whitespace-only name — even through form submit', () => {
    const { bucket } = renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
    fireEvent.change(getNameInput(), { target: { value: '   ' } })
    const form = getDialog().querySelector('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)

    expect(bucket.current?.systems).toHaveLength(SYSTEMS.length)
    expect(bucket.current?.overlay).toEqual({ kind: 'create-system-modal', source: 'system-menu' })
    expect(getDialog()).toBeInTheDocument()
  })

  it('makes no network request while creating — the commit is pure reducer state', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    try {
      const { bucket } = renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
      fireEvent.change(getNameInput(), { target: { value: 'QA Platform' } })
      fireEvent.click(getCreate())
      expect(bucket.current?.systems).toHaveLength(SYSTEMS.length + 1)
    } finally {
      expect(fetchSpy).not.toHaveBeenCalled()
      vi.unstubAllGlobals()
    }
  })
})

// ---------------------------------------------------------------------------
// Nested repository source — stacking, escape interception, and the
// return-to-selector contract (repository-sourced Create System)
// ---------------------------------------------------------------------------

describe('CreateSystemModal — nested repository source', () => {
  it('renders the nested stacking classes above the repository modal layers — backdrop 60 / dialog 61 over 50/51', () => {
    renderCreateSystemModal({ kind: 'create-system-modal', source: 'repository-modal' })
    const dialog = getDialog()
    expect(dialog).toHaveClass('kx-create-modal--nested')

    const backdrops = document.querySelectorAll('.kx-modal-backdrop')
    expect(backdrops).toHaveLength(1)
    expect(backdrops[0]).toHaveClass('kx-modal-backdrop--nested')

    // The dedicated layers ship in components.css, strictly above the
    // repository modal's shared 50/51 layers.
    expect(css).toMatch(/\.kx-modal-backdrop\s*\{[^}]*z-index:\s*50/s)
    expect(css).toMatch(/\.kx-modal\s*\{[^}]*z-index:\s*51/s)
    expect(css).toMatch(/\.kx-modal-backdrop--nested\s*\{[^}]*z-index:\s*60/s)
    expect(css).toMatch(/\.kx-create-modal--nested\s*\{[^}]*z-index:\s*61/s)
  })

  it('keeps the single-modal frame when opened from the system menu — no nested classes, shared 50/51 layers', () => {
    renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
    const dialog = getDialog()
    expect(dialog).not.toHaveClass('kx-create-modal--nested')
    expect(document.querySelector('.kx-modal-backdrop')).not.toHaveClass(
      'kx-modal-backdrop--nested',
    )
  })

  it('Cancel returns directly to the repository modal — the chain is not dismissed and nothing commits', () => {
    const { bucket } = renderCreateSystemModal(
      { kind: 'create-system-modal', source: 'repository-modal' },
      { selectedRepoIds: ['bsi/hris-frontend-shared'] },
    )
    fireEvent.click(within(getDialog()).getByRole('button', { name: 'Cancel' }))

    expect(bucket.current?.overlay).toEqual({ kind: 'repository-modal' })
    // No system was created and no session context was committed.
    expect(bucket.current?.systems).toHaveLength(SYSTEMS.length)
    expect(bucket.current?.sessionContext).toBeNull()
  })

  it('the header Close control returns to the repository modal the same way', () => {
    const { bucket } = renderCreateSystemModal({ kind: 'create-system-modal', source: 'repository-modal' })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(bucket.current?.overlay).toEqual({ kind: 'repository-modal' })
  })

  it('intercepts Escape inside the dialog — it returns to the repository modal and never triggers the provider full dismissal', () => {
    const { bucket } = renderCreateSystemModal({ kind: 'create-system-modal', source: 'repository-modal' })
    const dialog = getDialog()
    expect(dialog).toHaveFocus()

    // Escape originates on the focused element inside the dialog.
    fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(bucket.current?.overlay).toEqual({ kind: 'repository-modal' })
    // The return is not a commit — no system was created either.
    expect(bucket.current?.sessionContext).toBeNull()
    expect(bucket.current?.systems).toHaveLength(SYSTEMS.length)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps the provider-owned full dismissal for the system-menu source — Escape still closes everything', () => {
    const { bucket } = renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
  })
})

// ---------------------------------------------------------------------------
// Hygiene — semantic labels, no emoji (§16)
// ---------------------------------------------------------------------------

describe('CreateSystemModal — hygiene', () => {
  it('labels every control semantically and uses no emoji anywhere in the dialog', () => {
    renderCreateSystemModal({ kind: 'create-system-modal', source: 'system-menu' })
    const dialog = getDialog()
    expect(dialog.textContent).not.toMatch(EMOJI)

    for (const button of within(dialog).getAllByRole('button')) {
      expect(button).toHaveAccessibleName()
    }
    expect(getNameInput()).toHaveAccessibleName()
    expect(getDescriptionInput()).toHaveAccessibleName()
    expect(dialog).toHaveAccessibleName()
  })
})
