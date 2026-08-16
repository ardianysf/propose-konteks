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

function renderNewSessionPage() {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, initialState())
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

function renderAppShell() {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, initialState())
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

const switchToPlanning = () =>
  fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Session mode' })).getByRole('radio', { name: 'Planning' }))

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

// ---------------------------------------------------------------------------
// Mode hierarchy (Task 5, spec §7.1 — AC15)
// ---------------------------------------------------------------------------

describe('NewSessionPage — mode hierarchy (AC15)', () => {
  it('renders the Engineering/Planning segmented control above the setup row and composer in DOM order, with the dominant-hierarchy class', () => {
    const { container } = renderNewSessionPage()
    const page = screen.getByRole('region', { name: /new session/i })
    expect(page).toHaveClass('kx-new-session')

    const mode = screen.getByRole('radiogroup', { name: 'Session mode' })
    expect(mode).toHaveClass('kx-segmented', 'kx-session-mode', 'kx-session-mode--dominant')

    const setupRow = container.querySelector('.kx-setup-row')
    expect(setupRow).not.toBeNull()
    const composer = container.querySelector('.kx-composer')
    expect(composer).not.toBeNull()

    expect(follows(mode, setupRow!)).toBe(true)
    expect(follows(setupRow!, composer!)).toBe(true)

    // Page semantics: a heading names the route without visual noise.
    expect(screen.getByRole('heading', { name: /new session/i })).toBeInTheDocument()
  })

  it('offers Engineering and Planning as radios, Engineering checked by default, and switches modes through the reducer (SET_MODE)', () => {
    const { bucket } = renderNewSessionPage()
    const group = screen.getByRole('radiogroup', { name: 'Session mode' })
    const engineering = within(group).getByRole('radio', { name: 'Engineering' })
    const planning = within(group).getByRole('radio', { name: 'Planning' })

    expect(engineering).toHaveAttribute('aria-checked', 'true')
    expect(planning).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(planning)
    expect(bucket.current?.sessionMode).toBe('planning')
    expect(planning).toHaveAttribute('aria-checked', 'true')
    expect(engineering).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(engineering)
    expect(bucket.current?.sessionMode).toBe('engineering')
    expect(engineering).toHaveAttribute('aria-checked', 'true')
  })

  it('supports switching modes with arrow keys from the segmented control', () => {
    const { bucket } = renderNewSessionPage()
    const group = screen.getByRole('radiogroup', { name: 'Session mode' })
    fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(bucket.current?.sessionMode).toBe('planning')
    fireEvent.keyDown(group, { key: 'ArrowLeft' })
    expect(bucket.current?.sessionMode).toBe('engineering')
  })
})

// ---------------------------------------------------------------------------
// Planning mode (spec §7.1 — AC16)
// ---------------------------------------------------------------------------

describe('NewSessionPage — Planning mode (AC16)', () => {
  it('hides the repository/component setup row entirely', () => {
    const { container } = renderNewSessionPage()
    switchToPlanning()
    expect(container.querySelector('.kx-setup-row')).toBeNull()
    expect(screen.queryByRole('button', { name: /system \/ repositories/i })).not.toBeInTheDocument()
    expect(screen.queryByTestId('component-trigger')).not.toBeInTheDocument()
  })

  it('shows the Start planning CTA and the exact planning placeholder', () => {
    renderNewSessionPage()
    switchToPlanning()
    const input = screen.getByRole('textbox', { name: /prompt/i })
    expect(input).toHaveAttribute('placeholder', 'Describe the product outcome you want to plan…')
    const cta = screen.getByRole('button', { name: /start planning/i })
    expect(cta).toHaveClass('kx-composer__send')
  })
})

// ---------------------------------------------------------------------------
// Engineering mode (spec §7.1 — AC17)
// ---------------------------------------------------------------------------

describe('NewSessionPage — Engineering mode (AC17)', () => {
  it('shows the system/repository trigger and the component trigger alongside the composer', () => {
    const { container } = renderNewSessionPage()
    const repoTrigger = screen.getByRole('button', { name: /system \/ repositories/i })
    expect(repoTrigger).toHaveTextContent('BSI - HRIS')
    expect(screen.getByTestId('component-trigger')).toBeInTheDocument()
    expect(container.querySelector('.kx-composer')).not.toBeNull()
  })

  it('repository trigger dispatches OPEN_OVERLAY repository-modal (modal arrives in Task 7)', () => {
    const { bucket } = renderNewSessionPage()
    fireEvent.click(screen.getByRole('button', { name: /system \/ repositories/i }))
    expect(bucket.current?.overlay).toEqual({ kind: 'repository-modal' })
  })

  it('component trigger opens the component-menu overlay and the anchored menu mounts from its trigger (Task 8)', () => {
    const { bucket } = renderNewSessionPage()
    fireEvent.click(screen.getByTestId('component-trigger'))
    expect(bucket.current?.overlay).toEqual({ kind: 'component-menu' })
    expect(screen.getByTestId('component-menu')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // Component trigger anchoring (Task 8, spec §7.4 — AC30)
  // ---------------------------------------------------------------------------

  describe('NewSessionPage — Component menu anchoring (Task 8, AC30)', () => {
    it('wraps the Component trigger in an anchor wrapper that hosts the menu as the trigger’s sibling', () => {
      renderNewSessionPage()
      const trigger = screen.getByTestId('component-trigger')
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByTestId('component-menu')).not.toBeInTheDocument()

      fireEvent.click(trigger)
      const menu = screen.getByTestId('component-menu')
      expect(trigger).toHaveAttribute('aria-expanded', 'true')

      // Anchor DOM relation: the menu mounts inside the trigger's
      // anchor wrapper, not a page-level overlay slot (AC30).
      const anchor = trigger.closest('.kx-setup-row__component-anchor')
      expect(anchor).not.toBeNull()
      expect(menu.closest('.kx-setup-row__component-anchor')).toBe(anchor)
    })

    it('unmounts on Escape and reopens cleanly with the committed selection intact', () => {
      const { bucket } = renderNewSessionPage()
      const trigger = screen.getByTestId('component-trigger')
      fireEvent.click(trigger)
      const menu = screen.getByTestId('component-menu')
      fireEvent.click(within(menu).getByRole('menuitemcheckbox', { name: /canteen-api/ }))
      expect(bucket.current?.selectedComponentIds).toEqual(['comp-canteen-api'])

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(bucket.current?.overlay).toEqual({ kind: 'none' })
      expect(screen.queryByTestId('component-menu')).not.toBeInTheDocument()
      expect(trigger).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(trigger)
      const reopened = screen.getByTestId('component-menu')
      expect(
        within(reopened).getByRole('menuitemcheckbox', { name: /canteen-api/, checked: true }),
      ).toBeInTheDocument()
      expect(within(reopened).getByText('1 selected')).toBeInTheDocument()
    })

    it('switching overlays unmounts the component menu — exactly one overlay at a time', () => {
      const { bucket } = renderNewSessionPage()
      fireEvent.click(screen.getByTestId('component-trigger'))
      expect(screen.getByTestId('component-menu')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /system \/ repositories/i }))
      expect(bucket.current?.overlay).toEqual({ kind: 'repository-modal' })
      expect(screen.queryByTestId('component-menu')).not.toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// Composer visual hierarchy (spec §7.2 — AC18/AC19/AC43 disabled)
// ---------------------------------------------------------------------------

describe('Composer — hierarchy (AC18/AC19/AC43 disabled)', () => {
  it('renders the soft-matcha outer container class wrapping the white input class', () => {
    const { container } = renderNewSessionPage()
    const outer = container.querySelector('.kx-composer')
    expect(outer).not.toBeNull()
    const inputs = outer!.querySelectorAll('textarea.kx-composer__input')
    expect(inputs).toHaveLength(1)
    expect(outer!.querySelectorAll('textarea')).toHaveLength(1)
  })

  it('toolbar attachment/text-document/mic icons are unboxed icon buttons with the hover-affordance class, using inline SVGs', () => {
    renderNewSessionPage()
    const cases: [name: string, icon: string][] = [
      ['Attach file', 'attachment'],
      ['Add text document', 'text-document'],
      ['Voice input', 'mic'],
    ]
    for (const [name, icon] of cases) {
      const button = screen.getByRole('button', { name })
      expect(button).toHaveClass('kx-icon-btn')
      expect(button).not.toHaveClass('kx-btn')
      const svg = button.querySelector(`svg[data-icon="${icon}"]`)
      expect(svg).not.toBeNull()
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('send button carries the soft-accent class and a send icon in Engineering mode', () => {
    renderNewSessionPage()
    const send = screen.getByRole('button', { name: 'Send' })
    expect(send).toHaveClass('kx-composer__send')
    expect(send.querySelector('svg[data-icon="send"]')).not.toBeNull()
  })

  it('send is disabled while the input is empty (or whitespace) and enabled once text exists; input stays local (AC43)', () => {
    const { bucket } = renderNewSessionPage()
    const input = screen.getByRole('textbox', { name: /prompt/i })
    const send = screen.getByRole('button', { name: 'Send' })
    expect(send).toBeDisabled()

    fireEvent.change(input, { target: { value: 'Fix the EDP integration' } })
    expect(input).toHaveValue('Fix the EDP integration')
    expect(send).toBeEnabled()

    fireEvent.change(input, { target: { value: '   ' } })
    expect(send).toBeDisabled()

    // Composer input state is local — it never leaks into the store.
    expect(bucket.current?.search.components).toBe('')
  })

  it('the Start planning CTA follows the same disabled-when-empty contract in Planning mode (AC43)', () => {
    renderNewSessionPage()
    switchToPlanning()
    const cta = screen.getByRole('button', { name: /start planning/i })
    expect(cta).toBeDisabled()
    fireEvent.change(screen.getByRole('textbox', { name: /prompt/i }), {
      target: { value: 'Plan the vendor portal revamp' },
    })
    expect(cta).toBeEnabled()
  })
})

// ---------------------------------------------------------------------------
// Execution Profile placement (spec §7.2 — AC21)
// ---------------------------------------------------------------------------

describe('Composer — Execution Profile control (AC21)', () => {
  it('sits in the toolbar immediately after the text/document control, before mic and send, bottom-left of the toolbar', () => {
    renderNewSessionPage()
    const attach = screen.getByRole('button', { name: 'Attach file' })
    const document_ = screen.getByRole('button', { name: 'Add text document' })
    const profile = screen.getByRole('button', { name: /execution profile/i })
    const mic = screen.getByRole('button', { name: 'Voice input' })
    const send = screen.getByRole('button', { name: 'Send' })

    expect(follows(attach, document_)).toBe(true)
    expect(follows(document_, profile)).toBe(true)
    expect(follows(profile, mic)).toBe(true)
    expect(follows(mic, send)).toBe(true)

    expect(profile).toHaveAttribute('aria-haspopup', 'menu')
    expect(profile).toHaveTextContent('Default')
    expect(profile.closest('.kx-composer__toolbar')).not.toBeNull()
  })

  it('opens the execution-profile-menu overlay kind — the anchored menu mounts with Task 6', () => {
    const { bucket } = renderNewSessionPage()
    fireEvent.click(screen.getByRole('button', { name: /execution profile/i }))
    expect(bucket.current?.overlay).toEqual({ kind: 'execution-profile-menu' })
    expect(screen.getByTestId('execution-profile-menu')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Composer footer (spec §7.2 — AC20 placement)
// ---------------------------------------------------------------------------

describe('Composer — footer placement (AC20)', () => {
  it('disclaimer sits left below the input; Reviews waiting with a round count badge sits right (DOM order)', () => {
    const { container } = renderNewSessionPage()
    const footer = container.querySelector('.kx-composer__footer')
    expect(footer).not.toBeNull()

    const disclaimer = footer!.querySelector('.kx-composer__disclaimer')
    expect(disclaimer).not.toBeNull()
    expect(disclaimer!.textContent).not.toBe('')

    const reviews = screen.getByRole('button', { name: /reviews waiting/i })
    expect(reviews).toHaveClass('kx-composer__reviews')
    expect(follows(disclaimer!, reviews)).toBe(true)

    const badge = reviews.querySelector('.kx-composer__badge')
    expect(badge).not.toBeNull()
    expect(badge).toHaveTextContent(String(PENDING_REVIEWS.length))
  })

  it('clicking Reviews waiting opens the Learned overlay on the pending tab (drawer arrives in Task 10)', () => {
    const { bucket } = renderNewSessionPage()
    fireEvent.click(screen.getByRole('button', { name: /reviews waiting/i }))
    expect(bucket.current?.overlay).toEqual({ kind: 'learned', tab: 'pending' })
  })
})

// ---------------------------------------------------------------------------
// AppShell integration + hygiene
// ---------------------------------------------------------------------------

describe('NewSessionPage — AppShell integration', () => {
  it('renders inside the main region on the new-session route', () => {
    renderAppShell()
    const main = screen.getByRole('main')
    expect(within(main).getByRole('radiogroup', { name: 'Session mode' })).toBeInTheDocument()
    expect(within(main).getByRole('textbox', { name: /prompt/i })).toBeInTheDocument()
  })

  it('unmounts when navigating away; the Task 6 profile menu and the Task 7 repository modal mount from their triggers', () => {
    const { bucket } = renderAppShell()
    const main = screen.getByRole('main')

    // Task 6: the anchored Execution Profile menu mounts from the composer.
    fireEvent.click(within(main).getByRole('button', { name: /execution profile/i }))
    expect(bucket.current?.overlay).toEqual({ kind: 'execution-profile-menu' })
    expect(screen.getByTestId('execution-profile-menu')).toBeInTheDocument()

    // Task 7: the repository trigger sets state and mounts the real
    // selector modal — exactly one dialog replaces the anchored menu.
    fireEvent.click(within(main).getByTestId('repository-trigger'))
    expect(bucket.current?.overlay).toEqual({ kind: 'repository-modal' })
    expect(screen.queryByTestId('execution-profile-menu')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Choose work repositories' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // Navigating away unmounts the page, the composer, and its anchored menu.
    fireEvent.click(screen.getByRole('button', { name: /view all/i }))
    expect(screen.queryByTestId('execution-profile-menu')).not.toBeInTheDocument()
    expect(within(main).queryByRole('radiogroup', { name: 'Session mode' })).not.toBeInTheDocument()
    expect(within(main).getByRole('heading', { name: /session history/i })).toBeInTheDocument()
  })

  it('unmounts when navigating away; the Task 8 component menu mounts from the setup row anchor and swaps with other overlays', () => {
    const { bucket } = renderAppShell()
    const main = screen.getByRole('main')

    // Task 8: the anchored Component menu mounts from the page's setup
    // row anchor — inside main, not the AppShell overlay slot (AC30).
    fireEvent.click(within(main).getByTestId('component-trigger'))
    expect(bucket.current?.overlay).toEqual({ kind: 'component-menu' })
    const componentMenu = screen.getByTestId('component-menu')
    expect(componentMenu.closest('main')).toBe(main)
    expect(
      within(componentMenu).getByRole('menuitemcheckbox', { name: /mytok-mobile/ }),
    ).toBeInTheDocument()

    // Exactly one overlay: the Task 7 repository modal replaces the
    // anchored component menu.
    fireEvent.click(within(main).getByTestId('repository-trigger'))
    expect(bucket.current?.overlay).toEqual({ kind: 'repository-modal' })
    expect(screen.queryByTestId('component-menu')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Choose work repositories' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // Navigating away unmounts the page and its anchored menus.
    fireEvent.click(screen.getByRole('button', { name: /view all/i }))
    expect(screen.queryByTestId('component-menu')).not.toBeInTheDocument()
    expect(within(main).queryByRole('radiogroup', { name: 'Session mode' })).not.toBeInTheDocument()
    expect(within(main).getByRole('heading', { name: /session history/i })).toBeInTheDocument()
  })

  it('uses semantic controls with accessibility labels and no emoji anywhere on the page', () => {
    renderNewSessionPage()
    const page = screen.getByRole('region', { name: /new session/i })
    expect(page.textContent).not.toMatch(EMOJI)
    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAccessibleName()
    }
  })
})
