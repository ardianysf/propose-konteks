import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import NewSessionPage from './NewSessionPage'
import AppShell from '../components/shell/AppShell'
import { OverlayLifecycleProvider } from '../components/shell/OverlayLifecycle'
import { MockupContext, useMockup } from '../state/MockupContext'
import { initialState, mockupReducer, type MockupState } from '../state/mockupReducer'
import { PENDING_REVIEWS } from '../data/mockData'

// ---------------------------------------------------------------------------
// Harness — the page under the real reducer via the mockup context, with a
// state bucket capturing the committed store for dispatch assertions.
// ---------------------------------------------------------------------------

type StateBucket = { current: MockupState | null }

function StateProbe({ bucket }: { bucket: StateBucket }) {
  const { state } = useMockup()
  useEffect(() => {
    bucket.current = state
  })
  return null
}

function renderNewSessionPage(initial?: Partial<MockupState>) {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, { ...initialState(), ...initial })
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <StateProbe bucket={bucket} />
        <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
          <NewSessionPage />
        </OverlayLifecycleProvider>
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

function renderAppShell(initial?: Partial<MockupState>) {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, { ...initialState(), ...initial })
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <StateProbe bucket={bucket} />
        <AppShell />
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

/** True when `later` comes after `earlier` in document order. */
const follows = (earlier: Element, later: Element) =>
  (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

const modeGroup = () => screen.getByRole('radiogroup', { name: 'Session mode' })

const switchToPlanning = () =>
  fireEvent.click(within(modeGroup()).getByRole('radio', { name: 'Planning' }))

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

const ENGINEERING_HEADING = 'What would you like to build?'
const ENGINEERING_BODY =
  'Engineering sessions analyze, propose, and deliver software changes. You approve every proposal before work proceeds.'
const PLANNING_HEADING = 'Start planning'
const PLANNING_BODY =
  'Draft a PRD, then break it into a roadmap, milestones, sprints, and tickets that drive Engineering delivery.'
const DISCLAIMER = 'Konteks can make mistakes. Verify important information.'

// ---------------------------------------------------------------------------
// Header + intro (AC1–AC3)
// ---------------------------------------------------------------------------

describe('NewSessionPage — header + intro', () => {
  it('renders the single visible h1 "New session", its subtitle, and the approval indicator', () => {
    renderNewSessionPage()
    const h1 = screen.getByRole('heading', { name: 'New session', level: 1 })
    expect(h1).toHaveClass('kx-new-session__title')
    expect(screen.getByText('Start governed work with the right mode and context.')).toBeInTheDocument()
    expect(screen.getByText('Human approval required for proposals')).toBeInTheDocument()

    // Exactly one h1 — the intro heading is a subordinate h2.
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('renders the decorative intro image with empty alt text', () => {
    const { container } = renderNewSessionPage()
    const img = container.querySelector('.kx-new-session__intro-img')
    expect(img).not.toBeNull()
    expect(img).toHaveAttribute('alt', '')
    expect(img).toHaveAttribute('aria-hidden', 'true')
    expect(img).toHaveAttribute('src', '/assets/konteks/empty-sessions.png')
  })

  it('shows the Engineering intro heading and body by default', () => {
    renderNewSessionPage()
    expect(screen.getByRole('heading', { name: ENGINEERING_HEADING, level: 2 })).toBeInTheDocument()
    expect(screen.getByText(ENGINEERING_BODY)).toBeInTheDocument()
  })

  it('shows the Planning intro heading and body in Planning mode', () => {
    renderNewSessionPage()
    switchToPlanning()
    expect(screen.getByRole('heading', { name: PLANNING_HEADING, level: 2 })).toBeInTheDocument()
    expect(screen.getByText(PLANNING_BODY)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: ENGINEERING_HEADING })).not.toBeInTheDocument()
  })

  it('orders header → intro → composer → footer in the DOM', () => {
    const { container } = renderNewSessionPage()
    const header = screen.getByTestId('new-session-header')
    const intro = screen.getByTestId('new-session-intro')
    const composer = screen.getByTestId('composer')
    const footer = screen.getByTestId('external-footer')

    expect(follows(header, intro)).toBe(true)
    expect(follows(intro, composer)).toBe(true)
    expect(follows(composer, footer)).toBe(true)

    // The intro sits above the composer and the footer sits below it.
    expect(container.querySelector('.kx-new-session')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Unified composer panel (AC4–AC7)
// ---------------------------------------------------------------------------

describe('NewSessionPage — unified composer panel', () => {
  it('renders exactly one composer container with no separate mode/setup regions outside it', () => {
    const { container } = renderNewSessionPage()
    expect(container.querySelectorAll('.kx-composer')).toHaveLength(1)
    expect(container.querySelectorAll('.kx-setup-row')).toHaveLength(0)
    expect(container.querySelectorAll('.kx-session-mode--dominant')).toHaveLength(0)

    // The mode group lives inside the composer, not above it.
    const composer = container.querySelector('.kx-composer')!
    expect(composer.contains(modeGroup())).toBe(true)
  })

  it('lays out the setup cluster left and the Session Mode group right on the same top row', () => {
    const { container } = renderNewSessionPage()
    const setupCluster = container.querySelector('.kx-panel__setup-cluster')
    const modeCluster = container.querySelector('.kx-panel__mode-cluster')
    expect(setupCluster).not.toBeNull()
    expect(modeCluster).not.toBeNull()
    expect(follows(setupCluster!, modeCluster!)).toBe(true)
    expect(modeCluster!.contains(modeGroup())).toBe(true)
  })

  it('renders the two Engineering pills with their fresh placeholders', () => {
    renderNewSessionPage()
    const repoPill = screen.getByRole('button', { name: 'Choose system / repositories' })
    const componentPill = screen.getByRole('button', { name: 'Choose component' })
    expect(repoPill).toHaveClass('kx-panel__pill')
    expect(componentPill).toHaveClass('kx-panel__pill')
    expect(repoPill).toHaveAttribute('aria-haspopup', 'dialog')
    expect(componentPill).toHaveAttribute('aria-haspopup', 'menu')
  })

  it('keeps the setup pill placeholders independent of the sidebar active system on a fresh session', () => {
    renderNewSessionPage()
    // The sidebar's default active system is "BSI - HRIS"; the fresh
    // New Session pill must still read the literal placeholder.
    expect(screen.getByRole('button', { name: 'Choose system / repositories' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'BSI - HRIS' })).not.toBeInTheDocument()
  })

  it('keeps a single Choose system pill in Planning and removes only the Component pill', () => {
    renderNewSessionPage()
    switchToPlanning()

    expect(screen.getByRole('button', { name: 'Choose system' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Choose component' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('component-trigger')).not.toBeInTheDocument()

    // The mode group remains, right-aligned in the top row.
    expect(modeGroup()).toBeInTheDocument()
  })

  it('Planning Choose system pill opens the same system + repositories modal (not a system-only modal)', () => {
    const { bucket } = renderNewSessionPage()
    switchToPlanning()
    fireEvent.click(screen.getByRole('button', { name: 'Choose system' }))
    expect(bucket.current?.overlay).toEqual({ kind: 'repository-modal' })
  })
})

// ---------------------------------------------------------------------------
// Setup pill selection labels (AC6)
// ---------------------------------------------------------------------------

describe('NewSessionPage — setup pill selection labels', () => {
  it('component pill shows the selected component name for one and a count for many', () => {
    renderNewSessionPage()
    fireEvent.click(screen.getByTestId('component-trigger'))
    const menu = screen.getByTestId('component-menu')

    fireEvent.click(within(menu).getByRole('menuitemcheckbox', { name: /canteen-api/ }))
    expect(screen.getByTestId('component-trigger')).toHaveTextContent('canteen-api')

    fireEvent.click(within(menu).getByRole('menuitemcheckbox', { name: /canteen-cms/ }))
    expect(screen.getByTestId('component-trigger')).toHaveTextContent('2 components')
  })

  it('system pill shows the committed system name after Done in the repository modal', () => {
    const { bucket } = renderAppShell()
    fireEvent.click(screen.getByTestId('repository-trigger'))

    const dialog = screen.getByRole('dialog', { name: 'Choose work repositories' })
    fireEvent.click(within(dialog).getByRole('button', { name: /BSI Canteen/i }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Done' }))

    expect(bucket.current?.sessionContext).toEqual({ systemId: 'bsi-canteen', repoIds: [] })
    expect(screen.getByTestId('repository-trigger')).toHaveTextContent('BSI Canteen')
  })

  it('component trigger opens the anchored component menu and reflects its aria-expanded state', () => {
    const { bucket } = renderNewSessionPage()
    const trigger = screen.getByTestId('component-trigger')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    expect(bucket.current?.overlay).toEqual({ kind: 'component-menu' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('component-menu')).toBeInTheDocument()

    // The menu anchors inside the trigger's wrapper, not a page slot.
    expect(trigger.closest('.kx-setup-row__component-anchor')).toContainElement(
      screen.getByTestId('component-menu'),
    )
  })
})

// ---------------------------------------------------------------------------
// Nested input box + toolbar (AC8–AC9)
// ---------------------------------------------------------------------------

describe('NewSessionPage — nested input box + toolbar', () => {
  it('renders the textarea inside a nested white input box visually inside the composer', () => {
    const { container } = renderNewSessionPage()
    const inputBox = screen.getByTestId('composer-input-box')
    expect(inputBox).toHaveClass('kx-composer__input-box', 'kx-panel__input-box')

    const textarea = screen.getByRole('textbox', { name: 'Engineering prompt' })
    expect(inputBox.contains(textarea)).toBe(true)

    const composer = container.querySelector('.kx-composer')!
    expect(composer.contains(inputBox)).toBe(true)
  })

  it('places the input toolbar at the bottom of the input box, after the textarea', () => {
    renderNewSessionPage()
    const inputBox = screen.getByTestId('composer-input-box')
    const textarea = screen.getByRole('textbox', { name: 'Engineering prompt' })
    const toolbar = screen.getByTestId('composer-toolbar')

    expect(inputBox.contains(toolbar)).toBe(true)
    expect(follows(textarea, toolbar)).toBe(true)
    expect(toolbar).toHaveClass('kx-panel__toolbar')
  })

  it('groups Attach file, Add text document, and Execution Profile left; Voice input and Send right', () => {
    renderNewSessionPage()
    const attach = screen.getByRole('button', { name: 'Attach file' })
    const document_ = screen.getByRole('button', { name: 'Add text document' })
    const profile = screen.getByRole('button', { name: /execution profile/i })
    const mic = screen.getByRole('button', { name: 'Voice input' })
    const send = screen.getByRole('button', { name: 'Send' })

    const left = screen.getByTestId('toolbar-left')
    const right = screen.getByTestId('toolbar-right')

    expect(left.contains(attach)).toBe(true)
    expect(left.contains(document_)).toBe(true)
    expect(left.contains(profile)).toBe(true)
    expect(right.contains(mic)).toBe(true)
    expect(right.contains(send)).toBe(true)

    // Toolbar internal order: attach → document → profile → voice → send.
    expect(follows(attach, document_)).toBe(true)
    expect(follows(document_, profile)).toBe(true)
    expect(follows(profile, mic)).toBe(true)
    expect(follows(mic, send)).toBe(true)
  })

  it('keeps every toolbar control visually inside the input box', () => {
    renderNewSessionPage()
    const inputBox = screen.getByTestId('composer-input-box')
    for (const name of ['Attach file', 'Add text document', 'Voice input']) {
      expect(inputBox.contains(screen.getByRole('button', { name }))).toBe(true)
    }
    expect(inputBox.contains(screen.getByRole('button', { name: /execution profile/i }))).toBe(true)
    expect(inputBox.contains(screen.getByRole('button', { name: 'Send' }))).toBe(true)
  })

  it('opens the anchored Execution Profile menu from its control', () => {
    const { bucket } = renderNewSessionPage()
    const profile = screen.getByRole('button', { name: /execution profile/i })
    expect(profile).toHaveAttribute('aria-haspopup', 'menu')
    expect(profile).toHaveAttribute('aria-expanded', 'false')
    expect(profile).toHaveTextContent('Default')

    fireEvent.click(profile)
    expect(bucket.current?.overlay).toEqual({ kind: 'execution-profile-menu' })
    expect(profile).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('execution-profile-menu')).toBeInTheDocument()
    expect(profile.closest('.kx-composer__profile-anchor')).toContainElement(
      screen.getByTestId('execution-profile-menu'),
    )
  })
})

// ---------------------------------------------------------------------------
// Send / Start planning gating (AC16)
// ---------------------------------------------------------------------------

describe('NewSessionPage — send gating', () => {
  it('disables Send while the input is empty or whitespace and enables it once text exists', () => {
    renderNewSessionPage()
    const input = screen.getByRole('textbox', { name: 'Engineering prompt' })
    const send = screen.getByRole('button', { name: 'Send' })
    expect(send).toBeDisabled()

    fireEvent.change(input, { target: { value: 'Fix the EDP integration' } })
    expect(send).toBeEnabled()

    fireEvent.change(input, { target: { value: '   ' } })
    expect(send).toBeDisabled()
  })

  it('keeps the same disabled-when-empty contract for the Start planning CTA', () => {
    renderNewSessionPage()
    switchToPlanning()
    const cta = screen.getByRole('button', { name: 'Start planning' })
    expect(cta).toBeDisabled()
    fireEvent.change(screen.getByRole('textbox', { name: 'Planning prompt' }), {
      target: { value: 'Plan the vendor portal revamp' },
    })
    expect(cta).toBeEnabled()
  })
})

// ---------------------------------------------------------------------------
// Footer (AC10–AC11)
// ---------------------------------------------------------------------------

describe('NewSessionPage — page-level footer', () => {
  it('renders the exact disclaimer left and the Reviews waiting pill right, outside the composer', () => {
    const { container } = renderNewSessionPage()
    const footer = screen.getByTestId('external-footer')
    expect(footer).toHaveClass('kx-panel__external-footer')

    const disclaimer = footer.querySelector('.kx-composer__disclaimer')
    expect(disclaimer).not.toBeNull()
    expect(disclaimer).toHaveTextContent(DISCLAIMER)

    const reviews = screen.getByRole('button', { name: /reviews waiting/i })
    expect(reviews).toHaveClass('kx-composer__reviews')
    expect(follows(disclaimer!, reviews)).toBe(true)

    // The footer sits outside the composer container.
    expect(container.querySelector('.kx-composer')!.contains(footer)).toBe(false)

    const badge = reviews.querySelector('.kx-composer__badge')
    expect(badge).not.toBeNull()
    expect(badge).toHaveTextContent(String(PENDING_REVIEWS.length))
  })

  it('opens the Konteks Learned drawer on the Pending tab from Reviews waiting', () => {
    const { bucket } = renderNewSessionPage()
    fireEvent.click(screen.getByRole('button', { name: /reviews waiting/i }))
    expect(bucket.current?.overlay).toEqual({ kind: 'learned', tab: 'pending' })
  })
})

// ---------------------------------------------------------------------------
// Illustrative-data marker (AC12)
// ---------------------------------------------------------------------------

describe('NewSessionPage — illustrative-data marker', () => {
  it('removes the page-level marker while the sidebar keeps its own', () => {
    // Page-only render has no marker.
    renderNewSessionPage()
    expect(screen.queryByTestId('illustrative-data-note')).not.toBeInTheDocument()

    // Full shell still shows exactly the sidebar marker.
    const shell = renderAppShell()
    const notes = shell.container.querySelectorAll('[data-testid="illustrative-data-note"]')
    expect(notes).toHaveLength(1)
    expect(notes[0]).toHaveTextContent('Illustrative data')
  })
})

// ---------------------------------------------------------------------------
// Mode semantics + arrow switching (AC13)
// ---------------------------------------------------------------------------

describe('NewSessionPage — mode semantics', () => {
  it('defaults to Engineering and switches modes through the reducer', () => {
    const { bucket } = renderNewSessionPage()
    const group = modeGroup()
    const engineering = within(group).getByRole('radio', { name: 'Engineering' })
    const planning = within(group).getByRole('radio', { name: 'Planning' })

    expect(engineering).toHaveAttribute('aria-checked', 'true')
    expect(planning).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(planning)
    expect(bucket.current?.sessionMode).toBe('planning')
    expect(planning).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(engineering)
    expect(bucket.current?.sessionMode).toBe('engineering')
  })

  it('supports arrow-key switching on the radiogroup', () => {
    const { bucket } = renderNewSessionPage()
    const group = modeGroup()
    fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(bucket.current?.sessionMode).toBe('planning')
    fireEvent.keyDown(group, { key: 'ArrowLeft' })
    expect(bucket.current?.sessionMode).toBe('engineering')
  })
})

// ---------------------------------------------------------------------------
// AppShell integration + hygiene
// ---------------------------------------------------------------------------

describe('NewSessionPage — AppShell integration + hygiene', () => {
  it('renders inside the main region on the new-session route', () => {
    renderAppShell()
    const main = screen.getByRole('main')
    expect(within(main).getByRole('radiogroup', { name: 'Session mode' })).toBeInTheDocument()
    expect(within(main).getByRole('textbox', { name: 'Engineering prompt' })).toBeInTheDocument()
  })

  it('unmounts the page and its anchored menus when navigating away', () => {
    const { bucket } = renderAppShell()
    const main = screen.getByRole('main')

    fireEvent.click(within(main).getByRole('button', { name: /execution profile/i }))
    expect(bucket.current?.overlay).toEqual({ kind: 'execution-profile-menu' })
    expect(screen.getByTestId('execution-profile-menu')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /view all/i }))
    expect(screen.queryByTestId('execution-profile-menu')).not.toBeInTheDocument()
    expect(within(main).queryByRole('radiogroup', { name: 'Session mode' })).not.toBeInTheDocument()
    expect(within(main).getByRole('heading', { name: /session history/i })).toBeInTheDocument()
  })

  it('uses semantic controls with accessible names and no emoji anywhere on the page', () => {
    renderNewSessionPage()
    const page = screen.getByRole('region', { name: 'New session' })
    expect(page.textContent).not.toMatch(EMOJI)
    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAccessibleName()
    }
  })

  it('keeps the Session Mode radio semantics — labeled group, roving tabindex, aria-checked', () => {
    renderNewSessionPage()
    const group = modeGroup()
    expect(group).toHaveAttribute('aria-label', 'Session mode')
    const engineering = within(group).getByRole('radio', { name: 'Engineering' })
    const planning = within(group).getByRole('radio', { name: 'Planning' })
    expect(engineering).toHaveAttribute('tabindex', '0')
    expect(planning).toHaveAttribute('tabindex', '-1')
  })
})
