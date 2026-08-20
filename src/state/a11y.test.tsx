/*
 * a11y.test.tsx — aggregate Task 13 accessibility contracts.
 *
 * The first block pins the shared getTabbableElements helper against a
 * synthetic fixture. The second block asserts the exact ordered
 * accessible-name list of the new-session main content (Engineering
 * empty/non-empty and Planning non-empty) through getTabbableElements +
 * computeAccessibleName — never through faked native Tab. The remaining
 * blocks prove the reducer-overlay lifecycle contracts end to end: every
 * direct origin family restores its root trigger after Escape, every
 * approved replacement chain returns to the original trigger, and an
 * external direct CLOSE_OVERLAY skips restoration and resets the chain.
 */
import { useReducer } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { computeAccessibleName } from 'dom-accessibility-api'
import { getTabbableElements } from '../utils/overlays'
import AppShell from '../components/shell/AppShell'
import { OverlayLifecycleProvider } from '../components/shell/OverlayLifecycle'
import AccountMenu from '../components/account/AccountMenu'
import SystemMenu from '../components/shell/SystemMenu'
import WorkspaceMenu from '../components/shell/WorkspaceMenu'
import { MockupContext } from './MockupContext'
import {
  initialState,
  mockupReducer,
  type MockupAction,
} from './mockupReducer'
import { WORKSPACE } from '../data/mockData'

/** Normalized accessible-name list for an ordered tabbable collection. */
function tabbableNames(scope: HTMLElement): string[] {
  return getTabbableElements(scope).map((element) =>
    computeAccessibleName(element).replace(/\s+/g, ' ').trim(),
  )
}

function TabbableFixture() {
  return (
    <div data-testid="fixture">
      <button type="button">First</button>
      <input aria-label="Second field" />
      <a href="#third">Third link</a>
      <button type="button" disabled>
        Disabled skip
      </button>
      <div tabIndex={-1}>Negative skip</div>
      <button type="button">Last</button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Full-shell harness — the real AppShell under the real reducer, so every
// trigger, overlay slot, and the OverlayLifecycleProvider are exercised as
// they ship. The raw dispatch is surfaced for the external direct-CLOSE
// contract.
// ---------------------------------------------------------------------------

interface ShellControls {
  dispatch: (action: MockupAction) => void
}

function renderShell(): ShellControls {
  const dispatchRef: { current: ((action: MockupAction) => void) | null } = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, initialState())
    dispatchRef.current = dispatch
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <AppShell />
      </MockupContext.Provider>
    )
  }

  render(<Harness />)
  return {
    dispatch: (action) => dispatchRef.current!(action),
  }
}

const getMain = () => document.querySelector('main') as HTMLElement

// ---------------------------------------------------------------------------
// getTabbableElements — synthetic fixture edge cases
// ---------------------------------------------------------------------------

describe('ordered tabbable accessible-name fixture', () => {
  it('collects sequential stops in DOM order using getTabbableElements — not faked native Tab', () => {
    const { container } = render(<TabbableFixture />)
    const scope = container.querySelector('[data-testid="fixture"]') as HTMLElement
    const tabbable = getTabbableElements(scope)

    const names = tabbable.map((element) => {
      if (element instanceof HTMLInputElement) return element.getAttribute('aria-label') ?? ''
      return element.textContent?.trim() ?? ''
    })
    expect(names).toEqual(['First', 'Second field', 'Third link', 'Last'])

    // Every collected stop carries an accessible name.
    for (const element of tabbable) {
      expect(element).toHaveAccessibleName()
    }
  })
})

// ---------------------------------------------------------------------------
// New-session main-content tab order (AC45) — exact accessible names.
// jsdom computes the ordered list directly; it never claims fireEvent
// simulates native browser Tab traversal.
// ---------------------------------------------------------------------------

describe('new-session main-content tab order (AC45)', () => {
  // The sidebar minimize/maximize control lives in the shell sidebar
  // (top-right while expanded; the rail logo becomes the expand control),
  // so it is no longer part of the main-content tab order. The first
  // tabbable stop of the main content is Reviews waiting in its own
  // wrapper immediately before the composer.
  const ENGINEERING_EMPTY = [
    'Reviews waiting 3',
    'Choose system / repositories',
    'Choose component',
    'Engineering',
    'Engineering prompt',
    'Attach file',
    'Add text document',
    'Execution Profile · Default',
    'Voice input',
  ]

  const ENGINEERING_NON_EMPTY = [
    'Reviews waiting 3',
    'Choose system / repositories',
    'Choose component',
    'Engineering',
    'Engineering prompt',
    'Attach file',
    'Add text document',
    'Execution Profile · Default',
    'Voice input',
    'Send',
  ]

  const PLANNING_NON_EMPTY = [
    'Reviews waiting 3',
    'Choose system',
    'Planning',
    'Planning prompt',
    'Attach file',
    'Add text document',
    'Execution Profile · Default',
    'Voice input',
    'Start planning',
  ]

  it('Engineering empty: Reviews waiting → selected mode → setup pills → composer → toolbar; disabled Send is skipped', () => {
    renderShell()
    expect(tabbableNames(getMain())).toEqual(ENGINEERING_EMPTY)
  })

  it('Engineering non-empty: enabled Send appears after Voice input, still inside the composer toolbar', () => {
    renderShell()
    fireEvent.change(screen.getByRole('textbox', { name: 'Engineering prompt' }), {
      target: { value: 'Fix the EDP integration' },
    })
    expect(tabbableNames(getMain())).toEqual(ENGINEERING_NON_EMPTY)
  })

  it('Planning non-empty: omits the component trigger, keeps the system pill, and uses Start planning in the enabled slot', () => {
    renderShell()
    fireEvent.click(screen.getByRole('radio', { name: 'Planning' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Planning prompt' }), {
      target: { value: 'Plan the vendor portal revamp' },
    })
    expect(tabbableNames(getMain())).toEqual(PLANNING_NON_EMPTY)
  })
})

// ---------------------------------------------------------------------------
// Reducer overlay menus — untrapped vs open-focus distinctions
// ---------------------------------------------------------------------------

function renderOverlay(kind: 'account-menu' | 'system-menu' | 'workspace-menu') {
  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, {
      ...initialState(),
      overlay: { kind },
    })
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
          <button type="button" data-testid="outside">
            outside
          </button>
          {state.overlay.kind === 'account-menu' && <AccountMenu />}
          {state.overlay.kind === 'system-menu' && <SystemMenu />}
          {state.overlay.kind === 'workspace-menu' && <WorkspaceMenu />}
        </OverlayLifecycleProvider>
      </MockupContext.Provider>
    )
  }
  return render(<Harness />)
}

describe('reducer overlay menus — untrapped vs open-focus', () => {
  it('menus are untrapped: focus is not pulled back into the menu', () => {
    renderOverlay('system-menu')
    const outside = screen.getByTestId('outside')
    outside.focus()
    outside.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(outside).toHaveFocus()
    expect(screen.getByRole('menu', { name: 'Systems' })).toBeInTheDocument()
  })

  it('AccountMenu moves focus to its first menu item on open (open-focus)', () => {
    renderOverlay('account-menu')
    const menu = screen.getByRole('menu', { name: 'Account' })
    // The Theme radios (menuitemradio) precede the action items — the
    // first menu item in DOM order is the "Light" theme radio.
    const menuItems = menu.querySelectorAll('[role="menuitem"], [role="menuitemradio"]')
    expect(menuItems[0]).toHaveFocus()
  })

  it('WorkspaceMenu does not force open-focus — its menuitem is not focused on open', () => {
    renderOverlay('workspace-menu')
    const menu = screen.getByRole('menu', { name: 'Workspace' })
    expect(within(menu).getByRole('menuitem')).not.toHaveFocus()
  })
})

// ---------------------------------------------------------------------------
// Direct reducer-overlay origin families — Escape restores the root trigger.
// manual-repo/create-system/settings are replacement-only and covered by the
// chain block; workspace is included as a direct origin.
// ---------------------------------------------------------------------------

interface DirectOriginCase {
  label: string
  getTrigger: () => HTMLElement
  assertOpen: () => void
}

const directOriginCases: DirectOriginCase[] = [
  {
    label: 'workspace-menu',
    getTrigger: () => screen.getByRole('button', { name: `${WORKSPACE.name} workspace` }),
    assertOpen: () =>
      expect(screen.getByRole('menu', { name: 'Workspace' })).toBeInTheDocument(),
  },
  {
    label: 'system-menu',
    getTrigger: () => screen.getByRole('button', { name: /open system menu/ }),
    assertOpen: () => expect(screen.getByRole('menu', { name: 'Systems' })).toBeInTheDocument(),
  },
  {
    label: 'execution-profile-menu',
    getTrigger: () => screen.getByTestId('execution-profile-trigger'),
    assertOpen: () =>
      expect(screen.getByRole('menu', { name: 'Execution Profile' })).toBeInTheDocument(),
  },
  {
    label: 'component-menu',
    getTrigger: () => screen.getByTestId('component-trigger'),
    assertOpen: () => expect(screen.getByTestId('component-menu')).toBeInTheDocument(),
  },
  {
    label: 'repository-modal',
    getTrigger: () => screen.getByTestId('repository-trigger'),
    assertOpen: () =>
      expect(screen.getByRole('dialog', { name: 'Choose work repositories' })).toBeInTheDocument(),
  },
  {
    label: 'customize',
    getTrigger: () => screen.getByRole('button', { name: 'Customize' }),
    assertOpen: () => expect(screen.getByTestId('customize-modal')).toBeInTheDocument(),
  },
  {
    label: 'learned',
    getTrigger: () => screen.getByTestId('reviews-waiting'),
    assertOpen: () => expect(screen.getByTestId('learned-drawer')).toBeInTheDocument(),
  },
  {
    label: 'account-menu',
    getTrigger: () => screen.getByTestId('account-trigger'),
    assertOpen: () => expect(screen.getByRole('menu', { name: 'Account' })).toBeInTheDocument(),
  },
]

describe('direct reducer-overlay origin families — Escape restores the root trigger', () => {
  it.each(directOriginCases)(
    '$label closes on Escape and returns focus to its direct trigger',
    async (testCase) => {
      renderShell()
      const trigger = testCase.getTrigger()
      fireEvent.click(trigger)
      testCase.assertOpen()

      fireEvent.keyDown(document, { key: 'Escape' })

      await waitFor(() => expect(trigger).toHaveFocus())
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    },
  )
})

// ---------------------------------------------------------------------------
// Approved replacement chains — Escape returns to the ORIGINAL root trigger,
// never to the disappearing intermediate menu/modal.
// ---------------------------------------------------------------------------

interface ReplacementChainCase {
  label: string
  open: () => HTMLElement
  replace: () => void
  assertReplaced: () => void
}

const replacementChainCases: ReplacementChainCase[] = [
  {
    label: 'system → create-system',
    open: () => {
      const trigger = screen.getByRole('button', { name: /open system menu/ })
      fireEvent.click(trigger)
      return trigger
    },
    replace: () => fireEvent.click(screen.getByRole('menuitem', { name: /create new system/i })),
    assertReplaced: () =>
      expect(screen.getByRole('dialog', { name: 'Create a new system' })).toBeInTheDocument(),
  },
  {
    label: 'repository → manual-repo',
    open: () => {
      const trigger = screen.getByTestId('repository-trigger')
      fireEvent.click(trigger)
      return trigger
    },
    replace: () =>
      fireEvent.click(screen.getByRole('button', { name: /add repository manually/i })),
    assertReplaced: () =>
      expect(screen.getByRole('dialog', { name: 'Add repository manually' })).toBeInTheDocument(),
  },
  {
    label: 'repository → create-system',
    open: () => {
      const trigger = screen.getByTestId('repository-trigger')
      fireEvent.click(trigger)
      return trigger
    },
    replace: () => fireEvent.click(screen.getByRole('button', { name: /add new system/i })),
    assertReplaced: () =>
      expect(screen.getByRole('dialog', { name: 'Create a new system' })).toBeInTheDocument(),
  },
  {
    label: 'execution-profile → customize',
    open: () => {
      const trigger = screen.getByTestId('execution-profile-trigger')
      fireEvent.click(trigger)
      return trigger
    },
    replace: () =>
      fireEvent.click(screen.getByRole('menuitem', { name: /manage \/ customize profile/i })),
    assertReplaced: () => expect(screen.getByTestId('customize-modal')).toBeInTheDocument(),
  },
  {
    label: 'account → settings/general',
    open: () => {
      const trigger = screen.getByTestId('account-trigger')
      fireEvent.click(trigger)
      return trigger
    },
    replace: () => fireEvent.click(screen.getByRole('menuitem', { name: 'Settings' })),
    assertReplaced: () => {
      expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'General', selected: true })).toBeInTheDocument()
    },
  },
  {
    label: 'account → settings/billing',
    open: () => {
      const trigger = screen.getByTestId('account-trigger')
      fireEvent.click(trigger)
      return trigger
    },
    replace: () => fireEvent.click(screen.getByRole('menuitem', { name: 'Billing' })),
    assertReplaced: () => {
      expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Billing', selected: true })).toBeInTheDocument()
    },
  },
]

describe('approved replacement chains — Escape returns to the original root trigger', () => {
  it.each(replacementChainCases)(
    '$label keeps the original trigger as the focus-return origin',
    async (chain) => {
      renderShell()
      const trigger = chain.open()
      chain.replace()
      chain.assertReplaced()

      fireEvent.keyDown(document, { key: 'Escape' })

      await waitFor(() => expect(trigger).toHaveFocus())
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    },
  )
})

// ---------------------------------------------------------------------------
// External direct CLOSE — no restoration, and the stale chain resets so the
// next direct open restores its own fresh origin.
// ---------------------------------------------------------------------------

describe('external direct CLOSE_OVERLAY — no restoration and fresh-origin reset', () => {
  it('skips restoration on a direct reducer close, then restores correctly on a fresh chain', async () => {
    const controls = renderShell()
    const trigger = screen.getByTestId('repository-trigger')
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Choose work repositories' })).toBeInTheDocument()

    // A programmatic/external close dispatches CLOSE_OVERLAY without going
    // through dismissOverlay, so no focus restoration is pending.
    act(() => {
      controls.dispatch({ type: 'CLOSE_OVERLAY' })
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).not.toHaveFocus()

    // The stale origin was cleared; a fresh direct open starts a new chain.
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Choose work repositories' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
