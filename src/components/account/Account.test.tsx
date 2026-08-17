import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import AccountMenu from './AccountMenu'
import SettingsModal from './SettingsModal'
import Sidebar from '../shell/Sidebar'
import { OverlayLifecycleProvider } from '../shell/OverlayLifecycle'
import { MockupContext, useMockup } from '../../state/MockupContext'
import {
  initialState,
  mockupReducer,
  type MockupState,
} from '../../state/mockupReducer'
import { ACCOUNT_ACTIONS } from '../../data/mockData'

// ---------------------------------------------------------------------------
// Harness — the Sidebar + account overlay slot mounted the way AppShell
// mounts them (Task 12): exactly one overlay at a time. A state bucket
// captures the committed store for dispatch assertions.
// ---------------------------------------------------------------------------

type StateBucket = { current: MockupState | null }

function StateProbe({ bucket }: { bucket: StateBucket }) {
  const { state } = useMockup()
  useEffect(() => {
    bucket.current = state
  })
  return null
}

function renderShell(initial?: Partial<MockupState>) {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, { ...initialState(), ...initial })
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <StateProbe bucket={bucket} />
        <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
          <div className={state.sidebarCollapsed ? 'kx-app kx-app--rail' : 'kx-app'}>
            <Sidebar />
            {state.overlay.kind === 'account-menu' && <AccountMenu />}
            {state.overlay.kind === 'settings' && <SettingsModal />}
          </div>
        </OverlayLifecycleProvider>
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

const openAccountMenu = () => fireEvent.click(screen.getByTestId('account-trigger'))
const getMenu = () => screen.getByRole('menu', { name: 'Account' })
const getDialog = () => screen.getByRole('dialog', { name: 'Settings' })
const getSectionTablist = () => screen.getByRole('tablist', { name: 'Settings sections' })
const getBillingTablist = () => screen.getByRole('tablist', { name: 'Billing sections' })
const getSectionTabs = () => within(getSectionTablist()).getAllByRole('tab')
const getSectionTab = (name: string) => within(getSectionTablist()).getByRole('tab', { name })
const getBillingTabs = () => within(getBillingTablist()).getAllByRole('tab')
const getBillingTab = (name: string) => within(getBillingTablist()).getByRole('tab', { name })

// jsdom does not load stylesheets, so Warm Enterprise styling hooks are
// verified against the shipped CSS/tokens directly (CustomizeModal.test
// convention).
const css = readFileSync(join(process.cwd(), 'src/styles/components.css'), 'utf8')
const tokens = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

// ---------------------------------------------------------------------------
// Trigger wiring — account trigger vs separate Customize trigger (AC42/AC9)
// ---------------------------------------------------------------------------

describe('Account — sidebar trigger wiring', () => {
  it('keeps the account trigger distinct from the separate Customize sliders trigger', () => {
    const { bucket } = renderShell()
    const accountTrigger = screen.getByTestId('account-trigger')
    const customizeTrigger = screen.getByRole('button', { name: 'Customize' })

    expect(accountTrigger).not.toBe(customizeTrigger)
    expect(accountTrigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(accountTrigger).toHaveAccessibleName('Open account menu')
    expect(customizeTrigger).not.toHaveAttribute('aria-haspopup', 'menu')

    // The sliders icon opens Customize — never the account menu.
    fireEvent.click(customizeTrigger)
    expect(bucket.current?.overlay).toEqual({ kind: 'customize', tab: 'agents' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    // The user row opens the account menu.
    fireEvent.click(accountTrigger)
    expect(bucket.current?.overlay).toEqual({ kind: 'account-menu' })
    expect(getMenu()).toBeInTheDocument()
  })

  it('opens the account menu from the user row as a floating menu outside the sidebar', () => {
    renderShell()
    openAccountMenu()
    const menu = getMenu()
    expect(menu).toHaveClass('kx-menu', 'kx-account-menu')
    expect(menu.closest('.kx-sidebar')).toBeNull()
    expect(menu.closest('.kx-app')).not.toBeNull()
    expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
  })

  it('exposes aria-expanded matching whether the account menu is open', () => {
    renderShell()
    const trigger = screen.getByTestId('account-trigger')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('toggles the account menu closed on a second click of the same trigger', async () => {
    const { bucket } = renderShell()
    const trigger = screen.getByTestId('account-trigger')

    fireEvent.click(trigger)
    expect(getMenu()).toBeInTheDocument()
    expect(bucket.current?.overlay).toEqual({ kind: 'account-menu' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    // The second click dismisses through the lifecycle — the menu
    // unmounts and focus returns to the trigger.
    fireEvent.click(trigger)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(trigger).toHaveFocus())

    // A third click reopens — the toggle never wedges the menu shut.
    fireEvent.click(trigger)
    expect(getMenu()).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })
})

// ---------------------------------------------------------------------------
// Account menu contents + semantics (AC42, AC45)
// ---------------------------------------------------------------------------

describe('Account — menu contents and keyboard operation', () => {
  it('lists exactly the ACCOUNT_ACTIONS from mockData in data order — no renames, reorders, removals, or additions', () => {
    renderShell()
    openAccountMenu()
    const items = within(getMenu()).getAllByRole('menuitem')
    expect(items).toHaveLength(ACCOUNT_ACTIONS.length)
    expect(items.map((item) => item.textContent)).toEqual(ACCOUNT_ACTIONS.map((a) => a.label))
  })

  it('moves focus into the first menuitem on open and roves focus with arrow keys', () => {
    renderShell()
    openAccountMenu()
    const items = within(getMenu()).getAllByRole('menuitem')
    expect(items[0]).toHaveFocus()

    fireEvent.keyDown(items[0], { key: 'ArrowDown' })
    expect(items[1]).toHaveFocus()

    fireEvent.keyDown(items[1], { key: 'ArrowUp' })
    expect(items[0]).toHaveFocus()

    // Arrow wrapping — from the first item up wraps to the last.
    fireEvent.keyDown(items[0], { key: 'ArrowUp' })
    expect(items.at(-1)).toHaveFocus()
  })

  it('Settings opens the modal on General and Billing opens it on Billing', () => {
    const { bucket } = renderShell()
    openAccountMenu()
    fireEvent.click(within(getMenu()).getByRole('menuitem', { name: 'Settings' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(getDialog()).toBeInTheDocument()
    expect(bucket.current?.overlay).toEqual({ kind: 'settings', section: 'general' })
    expect(getSectionTab('General')).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })

    openAccountMenu()
    fireEvent.click(within(getMenu()).getByRole('menuitem', { name: 'Billing' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(getDialog()).toBeInTheDocument()
    expect(bucket.current?.overlay).toEqual({ kind: 'settings', section: 'billing' })
    expect(getSectionTab('Billing')).toHaveAttribute('aria-selected', 'true')
  })

  it('keeps the remaining illustrative actions as close-only items — no invented IA', () => {
    const { bucket } = renderShell()
    openAccountMenu()
    fireEvent.click(within(getMenu()).getByRole('menuitem', { name: 'Log out' }))
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Escape closes the open account menu', () => {
    const { bucket } = renderShell()
    openAccountMenu()
    expect(getMenu()).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('restores focus to the account trigger when Escape closes the menu', async () => {
    renderShell()
    const trigger = screen.getByTestId('account-trigger')
    openAccountMenu()
    expect(within(getMenu()).getAllByRole('menuitem')[0]).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Settings modal — sections, Billing subtabs, semantics (AC42)
// ---------------------------------------------------------------------------

describe('Account — Settings modal structure', () => {
  it('renders General / Billing / Team in exact data order with General selected by default', () => {
    renderShell({ overlay: { kind: 'settings', section: 'general' } })
    expect(getSectionTabs().map((tab) => tab.textContent)).toEqual(['General', 'Billing', 'Team'])
    expect(getSectionTab('General')).toHaveAttribute('aria-selected', 'true')
    expect(within(getDialog()).getByRole('heading', { name: 'General', level: 3 })).toBeInTheDocument()
  })

  it('shows exactly the six Billing subtabs — Usage, Plans, Providers, Budgets, Top Up, Transactions — when Billing is selected', () => {
    renderShell({ overlay: { kind: 'settings', section: 'billing' } })
    expect(getSectionTab('Billing')).toHaveAttribute('aria-selected', 'true')
    expect(getBillingTabs().map((tab) => tab.textContent)).toEqual([
      'Usage',
      'Plans',
      'Providers',
      'Budgets',
      'Top Up',
      'Transactions',
    ])
    expect(getBillingTab('Usage')).toHaveAttribute('aria-selected', 'true')
  })

  it('navigates General → Billing → Team in place and swaps the panel content', () => {
    renderShell({ overlay: { kind: 'settings', section: 'general' } })

    fireEvent.click(getSectionTab('Billing'))
    expect(getSectionTab('Billing')).toHaveAttribute('aria-selected', 'true')
    expect(getSectionTab('General')).toHaveAttribute('aria-selected', 'false')
    expect(within(getDialog()).getByRole('heading', { name: 'Usage', level: 3 })).toBeInTheDocument()

    fireEvent.click(getSectionTab('Team'))
    expect(getSectionTab('Team')).toHaveAttribute('aria-selected', 'true')
    expect(within(getDialog()).getByRole('heading', { name: 'Team', level: 3 })).toBeInTheDocument()

    fireEvent.click(getSectionTab('General'))
    expect(getSectionTab('General')).toHaveAttribute('aria-selected', 'true')
    expect(within(getDialog()).getByRole('heading', { name: 'General', level: 3 })).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Selection semantics + keyboard operation (AC42, AC45)
// ---------------------------------------------------------------------------

describe('Account — selection semantics and keyboard operation', () => {
  it('applies roving-tabindex selection semantics to the section tabs and moves selection with arrow keys', () => {
    renderShell({ overlay: { kind: 'settings', section: 'general' } })
    expect(getSectionTab('General')).toHaveAttribute('tabindex', '0')
    expect(getSectionTab('Billing')).toHaveAttribute('tabindex', '-1')
    expect(getSectionTab('Team')).toHaveAttribute('tabindex', '-1')

    fireEvent.keyDown(getSectionTab('General'), { key: 'ArrowDown' })
    expect(getSectionTab('Billing')).toHaveAttribute('aria-selected', 'true')
    expect(getSectionTab('Billing')).toHaveAttribute('tabindex', '0')
    expect(getSectionTab('General')).toHaveAttribute('tabindex', '-1')

    fireEvent.keyDown(getSectionTab('Billing'), { key: 'End' })
    expect(getSectionTab('Team')).toHaveAttribute('aria-selected', 'true')
    expect(getSectionTab('Team')).toHaveAttribute('tabindex', '0')
  })

  it('applies roving-tabindex selection semantics to Billing subtabs with ArrowRight and End movement', () => {
    renderShell({ overlay: { kind: 'settings', section: 'billing' } })
    expect(getBillingTab('Usage')).toHaveAttribute('tabindex', '0')
    expect(getBillingTab('Plans')).toHaveAttribute('tabindex', '-1')

    fireEvent.keyDown(getBillingTab('Usage'), { key: 'ArrowRight' })
    expect(getBillingTab('Plans')).toHaveAttribute('aria-selected', 'true')
    expect(getBillingTab('Plans')).toHaveAttribute('tabindex', '0')
    expect(getBillingTab('Usage')).toHaveAttribute('tabindex', '-1')

    fireEvent.keyDown(getBillingTab('Plans'), { key: 'End' })
    expect(getBillingTab('Transactions')).toHaveAttribute('aria-selected', 'true')
    expect(getBillingTab('Transactions')).toHaveAttribute('tabindex', '0')
  })
})

// ---------------------------------------------------------------------------
// Dialog accessibility + dismissal (AC45)
// ---------------------------------------------------------------------------

describe('Account — Settings dialog accessibility and dismissal', () => {
  it('is a labelled modal dialog that receives focus on mount and closes from the header control', () => {
    const { bucket } = renderShell({ overlay: { kind: 'settings', section: 'general' } })
    const dialog = getDialog()
    expect(dialog).toHaveClass('kx-modal', 'kx-settings')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName()
    expect(within(dialog).getByRole('heading', { name: 'Settings' }).tagName).toBe('H2')
    expect(dialog).toHaveFocus()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Escape closes the Settings modal from any focused descendant', () => {
    const { bucket } = renderShell({ overlay: { kind: 'settings', section: 'billing' } })
    expect(getDialog()).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('restores focus to the account trigger when Escape closes Settings opened from the account menu', async () => {
    renderShell()
    const trigger = screen.getByTestId('account-trigger')
    openAccountMenu()
    fireEvent.click(within(getMenu()).getByRole('menuitem', { name: 'Settings' }))
    expect(getDialog()).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('restores focus to the account trigger when the Close control closes Settings', async () => {
    renderShell()
    const trigger = screen.getByTestId('account-trigger')
    openAccountMenu()
    fireEvent.click(within(getMenu()).getByRole('menuitem', { name: 'Settings' }))
    expect(getDialog()).toBeInTheDocument()

    fireEvent.click(within(getDialog()).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('contains focus within the Settings dialog, wrapping at the cycle edges', () => {
    renderShell({ overlay: { kind: 'settings', section: 'billing' } })
    const dialog = getDialog()
    const close = within(dialog).getByRole('button', { name: 'Close' })
    const usageTab = getBillingTab('Usage')

    // Shared focus containment focuses the dialog root on mount.
    expect(dialog).toHaveFocus()

    // Tab from the last sequential stop (Usage) wraps to the first (Close).
    usageTab.focus()
    fireEvent.keyDown(usageTab, { key: 'Tab' })
    expect(close).toHaveFocus()

    // Shift+Tab from the first stop wraps to the last (Usage).
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })
    expect(usageTab).toHaveFocus()
  })
})

// ---------------------------------------------------------------------------
// Warm Enterprise styling hooks + hygiene (AC42, AC46)
// ---------------------------------------------------------------------------

describe('Account — styling hooks and hygiene', () => {
  it('ships raised-surface and DM Sans hooks for the account menu and Settings modal', () => {
    // Raised surfaces come from the shared .kx-menu / .kx-modal frames;
    // the account surfaces layer their own classes on top.
    expect(css).toContain('.kx-account-menu {')
    expect(css).toContain('.kx-settings {')
    expect(css).toMatch(/\.kx-menu\s*\{[^}]*background:\s*var\(--kx-raised\)/)
    expect(css).toMatch(/\.kx-modal\s*\{[^}]*background:\s*var\(--kx-raised\)/)
    expect(css).toMatch(/\.kx-account-menu__item\s*\{[^}]*font-family:\s*inherit/)
    expect(css).toMatch(/\.kx-settings__section\s*\{[^}]*font-family:\s*inherit/)
    expect(tokens).toMatch(/--kx-font-family:\s*'DM Sans'/)
    expect(tokens).toMatch(/--kx-raised:\s*#fff/)
  })

  it('shows the visible Illustrative data marker inside Settings (AC46)', () => {
    renderShell({ overlay: { kind: 'settings', section: 'general' } })
    expect(getDialog().textContent).toContain('Illustrative data')
  })

  it('uses no emoji anywhere in the account menu or Settings modal', () => {
    const first = renderShell()
    openAccountMenu()
    expect(getMenu().textContent).not.toMatch(EMOJI)
    first.unmount()

    renderShell({ overlay: { kind: 'settings', section: 'billing' } })
    expect(getDialog().textContent).not.toMatch(EMOJI)
  })
})
