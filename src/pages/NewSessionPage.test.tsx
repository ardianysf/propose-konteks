import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, waitFor, within, act } from '@testing-library/react'
import { vi } from 'vitest'
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

const switchToQA = () => fireEvent.click(within(modeGroup()).getByRole('radio', { name: 'QA' }))

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

const ENGINEERING_HEADING = 'What would you like to build?'
const ENGINEERING_BODY =
  'Engineering sessions analyze, propose, and deliver software changes. You approve every proposal before work proceeds.'
const QA_HEADING = 'What would you like to test?'
const QA_BODY =
  'QA sessions design, run, and report tests for your systems. You approve every test plan before execution.'
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

  it('shows the QA intro heading and body in QA mode', () => {
    renderNewSessionPage()
    switchToQA()
    expect(screen.getByRole('heading', { name: QA_HEADING, level: 2 })).toBeInTheDocument()
    expect(screen.getByText(QA_BODY)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: ENGINEERING_HEADING })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: PLANNING_HEADING })).not.toBeInTheDocument()
  })

  it('places the full-width header outside and before the bounded content region', () => {
    const { container } = renderNewSessionPage()
    const header = screen.getByTestId('new-session-header')
    const content = screen.getByTestId('new-session-content')

    expect(content).toHaveClass('kx-new-session__content')
    expect(container.querySelector('.kx-new-session')).toContainElement(content)

    // The header is a full-width sibling: it precedes the content region
    // and never sits inside it.
    expect(follows(header, content)).toBe(true)
    expect(content.contains(header)).toBe(false)
  })

  it('orders intro → reviews → composer → disclaimer inside the content region', () => {
    renderNewSessionPage()
    const content = screen.getByTestId('new-session-content')
    const intro = screen.getByTestId('new-session-intro')
    const reviewsWrapper = screen.getByTestId('reviews-wrapper')
    const composer = screen.getByTestId('composer')
    const disclaimer = screen.getByTestId('disclaimer')

    for (const child of [intro, reviewsWrapper, composer, disclaimer]) {
      expect(content.contains(child)).toBe(true)
    }

    expect(follows(intro, reviewsWrapper)).toBe(true)
    expect(follows(reviewsWrapper, composer)).toBe(true)
    expect(follows(composer, disclaimer)).toBe(true)
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

  it('shows the visible uppercase SESSION MODE label above the radiogroup inside the mode cluster', () => {
    const { container } = renderNewSessionPage()
    const label = screen.getByText('SESSION MODE')
    expect(label).toHaveClass('kx-session-mode__label')

    const wrapper = container.querySelector('.kx-session-mode') as HTMLElement
    expect(wrapper).not.toBeNull()
    expect(wrapper).toHaveAttribute('data-testid', 'session-mode')
    expect(wrapper.contains(label)).toBe(true)

    // The label precedes the radio group in document order.
    const group = modeGroup()
    expect(wrapper.contains(group)).toBe(true)
    expect(follows(label, group)).toBe(true)
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

  it('keeps the full Engineering setup pills in QA with QA-specific placeholders', () => {
    renderNewSessionPage()
    switchToQA()

    // QA mirrors the Engineering flow: both setup pills stay available.
    const repoPill = screen.getByRole('button', { name: 'Choose system / repositories to test' })
    const componentPill = screen.getByRole('button', { name: 'Choose component under test' })
    expect(repoPill).toHaveClass('kx-panel__pill')
    expect(componentPill).toHaveClass('kx-panel__pill')
    expect(screen.getByTestId('component-trigger')).toBeInTheDocument()

    // QA-specific prompt affordances.
    expect(screen.getByRole('textbox', { name: 'QA prompt' })).toHaveAttribute(
      'placeholder',
      'Describe the QA task…',
    )
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
  })

  it('QA Choose system pill opens the same system + repositories modal', () => {
    const { bucket } = renderNewSessionPage()
    switchToQA()
    fireEvent.click(screen.getByRole('button', { name: 'Choose system / repositories to test' }))
    expect(bucket.current?.overlay).toEqual({ kind: 'repository-modal' })
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

  it('renders the Execution Profile trigger as the active profile name + chevron only — no icon, no caption text', () => {
    renderNewSessionPage()
    const trigger = screen.getByTestId('execution-profile-trigger')

    // Visible content is just the active profile name.
    expect(trigger).toHaveTextContent('Default')
    expect(trigger.textContent).not.toMatch(/execution profile/i)
    expect(within(trigger).queryByText('Execution Profile')).not.toBeInTheDocument()

    // The gauge icon and caption markup are gone; the single remaining
    // glyph is the (aria-hidden) chevron.
    expect(trigger.querySelector('svg[data-icon="gauge"]')).toBeNull()
    expect(trigger.querySelector('.kx-composer__profile-icon')).toBeNull()
    expect(trigger.querySelector('.kx-composer__profile-copy')).toBeNull()
    expect(trigger.querySelector('.kx-composer__profile-caption')).toBeNull()
    const chevron = trigger.querySelector('svg[data-icon="chevron-down"]')
    expect(chevron).not.toBeNull()
    expect(chevron).toHaveAttribute('aria-hidden', 'true')
    expect(trigger.querySelectorAll('svg')).toHaveLength(1)

    // The accessible name carries the full label + active profile.
    expect(trigger).toHaveAccessibleName('Execution Profile · Default')
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

  it('toggles the anchored Execution Profile menu closed on a second click of its trigger', async () => {
    const { bucket } = renderNewSessionPage()
    const profile = screen.getByRole('button', { name: /execution profile/i })
    fireEvent.click(profile)
    expect(bucket.current?.overlay).toEqual({ kind: 'execution-profile-menu' })
    expect(profile).toHaveAttribute('aria-expanded', 'true')

    // Second click on the same trigger dismisses through the lifecycle —
    // focus is restored to the trigger instead of re-opening the menu.
    fireEvent.click(profile)
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(profile).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('execution-profile-menu')).not.toBeInTheDocument()
    await waitFor(() => expect(profile).toHaveFocus())

    // The trigger keeps working after a toggle — a third click re-opens.
    fireEvent.click(profile)
    expect(bucket.current?.overlay).toEqual({ kind: 'execution-profile-menu' })
    expect(screen.getByTestId('execution-profile-menu')).toBeInTheDocument()

    // Cross-overlay replacement is preserved: another trigger's control
    // swaps its own overlay in rather than toggling.
    fireEvent.click(screen.getByTestId('component-trigger'))
    expect(bucket.current?.overlay).toEqual({ kind: 'component-menu' })
    expect(screen.queryByTestId('execution-profile-menu')).not.toBeInTheDocument()
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

  it('keeps the Send gating contract in QA mode', () => {
    renderNewSessionPage()
    switchToQA()
    const send = screen.getByRole('button', { name: 'Send' })
    expect(send).toBeDisabled()
    fireEvent.change(screen.getByRole('textbox', { name: 'QA prompt' }), {
      target: { value: 'Regression-test the checkout flow' },
    })
    expect(send).toBeEnabled()
  })
})

// ---------------------------------------------------------------------------
// Footer (AC10–AC11)
// ---------------------------------------------------------------------------

describe('NewSessionPage — reviews pill + disclaimer', () => {
  it('renders the Reviews waiting pill in a standalone right-aligned wrapper immediately before the composer', () => {
    const { container } = renderNewSessionPage()
    const wrapper = screen.getByTestId('reviews-wrapper')
    expect(wrapper).toHaveClass('kx-new-session__reviews')

    // The wrapper is a content child sitting just before the composer.
    const composer = screen.getByTestId('composer')
    expect(follows(wrapper, composer)).toBe(true)
    expect(composer.previousElementSibling).toBe(wrapper)

    // The button keeps its original classes, testid, and badge.
    const reviews = within(wrapper).getByRole('button', { name: /reviews waiting/i })
    expect(reviews).toHaveClass('kx-composer__reviews')
    expect(reviews).toHaveAttribute('data-testid', 'reviews-waiting')
    expect(reviews).toHaveAttribute('type', 'button')

    const badge = reviews.querySelector('.kx-composer__badge')
    expect(badge).not.toBeNull()
    expect(badge).toHaveTextContent(String(PENDING_REVIEWS.length))

    // Both sit outside the composer container.
    const composerContainer = container.querySelector('.kx-composer')!
    expect(composerContainer.contains(wrapper)).toBe(false)
  })

  it('opens the Konteks Learned drawer on the Pending tab from Reviews waiting', () => {
    const { bucket } = renderNewSessionPage()
    fireEvent.click(screen.getByRole('button', { name: /reviews waiting/i }))
    expect(bucket.current?.overlay).toEqual({ kind: 'learned', tab: 'pending' })
  })

  it('renders the exact disclaimer in a standalone centered wrapper after the composer', () => {
    const { container } = renderNewSessionPage()
    const disclaimer = screen.getByTestId('disclaimer')
    expect(disclaimer).toHaveClass('kx-new-session__disclaimer')
    expect(disclaimer.textContent).toBe(DISCLAIMER)

    // It follows the composer and sits outside it.
    const composer = screen.getByTestId('composer')
    expect(follows(composer, disclaimer)).toBe(true)
    expect(container.querySelector('.kx-composer')!.contains(disclaimer)).toBe(false)

    // The old combined external footer wrapper is gone.
    expect(screen.queryByTestId('external-footer')).not.toBeInTheDocument()
    expect(container.querySelector('.kx-panel__external-footer')).toBeNull()
    expect(container.querySelectorAll('.kx-composer__disclaimer')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Illustrative-data marker (AC12)
// ---------------------------------------------------------------------------

describe('NewSessionPage — illustrative-data marker', () => {
  it('renders no illustrative-data marker — neither on the page nor in the shell sidebar', () => {
    // Page-only render has no marker.
    renderNewSessionPage()
    expect(screen.queryByTestId('illustrative-data-note')).not.toBeInTheDocument()

    // Full shell shows no marker either — the sidebar carries none and
    // the New Session page never had one (Session History/Settings keep
    // their own page-level notices).
    const shell = renderAppShell()
    const notes = shell.container.querySelectorAll('[data-testid="illustrative-data-note"]')
    expect(notes).toHaveLength(0)
    expect(shell.container.querySelectorAll('.kx-illustrative-note')).toHaveLength(0)
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
    const qa = within(group).getByRole('radio', { name: 'QA' })
    const planning = within(group).getByRole('radio', { name: 'Planning' })

    expect(engineering).toHaveAttribute('aria-checked', 'true')
    expect(qa).toHaveAttribute('aria-checked', 'false')
    expect(planning).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(planning)
    expect(bucket.current?.sessionMode).toBe('planning')
    expect(planning).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(engineering)
    expect(bucket.current?.sessionMode).toBe('engineering')
  })

  it('renders the segments in the Engineering → QA → Planning order with roving tabindex', () => {
    renderNewSessionPage()
    const group = modeGroup()
    const radios = within(group).getAllByRole('radio')
    expect(radios.map((radio) => radio.textContent)).toEqual(['Engineering', 'QA', 'Planning'])

    // Roving tabindex: only the active segment is tabbable.
    expect(radios[0]).toHaveAttribute('tabindex', '0')
    expect(radios[1]).toHaveAttribute('tabindex', '-1')
    expect(radios[2]).toHaveAttribute('tabindex', '-1')

    fireEvent.click(radios[1])
    expect(radios[0]).toHaveAttribute('tabindex', '-1')
    expect(radios[1]).toHaveAttribute('tabindex', '0')
  })

  it('supports arrow-key switching on the radiogroup', () => {
    const { bucket } = renderNewSessionPage()
    const group = modeGroup()
    fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(bucket.current?.sessionMode).toBe('qa')
    fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(bucket.current?.sessionMode).toBe('planning')
    fireEvent.keyDown(group, { key: 'ArrowLeft' })
    expect(bucket.current?.sessionMode).toBe('qa')
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

// ---------------------------------------------------------------------------
// Main-composer send → new session → pending phase flow (AppShell-level,
// so the route switch to the session detail runs exactly as in the app).
// ---------------------------------------------------------------------------

describe('main composer send flow', () => {
  it('send creates a new pending session, routes to session detail, and plays the phase sequence', () => {
    vi.useFakeTimers()
    try {
      const { bucket } = renderAppShell()

      const textarea = screen.getByTestId('composer-input') as HTMLTextAreaElement
      const sendButton = screen.getByTestId('composer-send')
      expect(sendButton).toBeDisabled()

      fireEvent.change(textarea, { target: { value: 'Build a renewal reminder dashboard widget' } })
      expect(sendButton).toBeEnabled()
      fireEvent.click(sendButton)

      // New session created and routed to the detail page.
      expect(bucket.current?.route).toBe('session-detail')
      expect(bucket.current?.sessionDetail.pendingAssistant).toBe(true)
      expect(bucket.current?.sessionDetail.timeline).toHaveLength(1)
      expect(bucket.current?.sessionDetail.timeline[0].content).toBe(
        'Build a renewal reminder dashboard widget',
      )
      // The main composer is unmounted with its input cleared for good
      // measure — the session composer takes over.
      expect(screen.queryByTestId('composer-input')).not.toBeInTheDocument()

      // The pending bubble shows the first phase beside the 12px loader.
      expect(screen.getByText('Validating')).toBeVisible()
      expect(
        screen.getByRole('status', { name: 'Menyusun jawaban — Validating' }),
      ).toHaveClass('kx-dmx--ripple')

      // Phases advance; the reply lands after the full sequence.
      act(() => {
        vi.advanceTimersByTime(900)
      })
      expect(screen.getByRole('status', { name: 'Menyusun jawaban — Analyzing' })).toHaveClass(
        'kx-dmx--drift',
      )
      act(() => {
        vi.advanceTimersByTime(900)
      })
      expect(screen.getByRole('status', { name: 'Menyusun jawaban — Synthesizing' })).toHaveClass(
        'kx-dmx--glyph',
      )
      act(() => {
        vi.advanceTimersByTime(900)
      })
      expect(screen.queryByRole('status', { name: /menyusun jawaban/i })).not.toBeInTheDocument()
      expect(bucket.current?.sessionDetail.pendingAssistant).toBe(false)
      const timeline = bucket.current?.sessionDetail.timeline ?? []
      expect(timeline[timeline.length - 1].type).toBe('ASSISTANT_MESSAGE')
    } finally {
      vi.useRealTimers()
    }
  })
})
