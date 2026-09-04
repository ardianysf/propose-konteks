import { useReducer } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import SettingsModal from './SettingsModal'
import CustomizeModal from '../customize/CustomizeModal'
import { OverlayLifecycleProvider } from '../shell/OverlayLifecycle'
import { MockupContext } from '../../state/MockupContext'
import { initialState, mockupReducer, type DemoVariant, type MockupOverlay } from '../../state/mockupReducer'
import { getSettingsCustomizeState, resetSettingsCustomizeStore, updateSettingsCustomizeState } from '../../state/settingsCustomizeStore'
import { LOCALE_STORAGE_KEY, resetPrototypeLocaleForTests, setLocalePreference } from '../../i18n/prototypeLocale'

function renderOverlay(overlay: MockupOverlay = { kind: 'settings', section: 'general' }, demoVariant?: DemoVariant) {
  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, { ...initialState(), overlay, ...(demoVariant ? { demoVariant } : {}) })
    return <MockupContext.Provider value={{ state, dispatch }}><OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>{state.overlay.kind === 'settings' && <SettingsModal />}{state.overlay.kind === 'customize' && <CustomizeModal />}</OverlayLifecycleProvider></MockupContext.Provider>
  }
  return render(<Harness />)
}

beforeEach(() => { vi.restoreAllMocks(); resetSettingsCustomizeStore(); resetPrototypeLocaleForTests(); localStorage.clear() })

describe('SettingsModal', () => {
  it('opens Billing directly on a typed subtab and navigates all six areas', () => {
    renderOverlay({ kind: 'settings', section: 'billing', subtab: 'providers' })
    expect(screen.getByRole('tab', { name: 'Providers' })).toHaveAttribute('aria-selected', 'true')
    expect(within(screen.getByRole('tablist', { name: 'Billing' })).getAllByRole('tab')).toHaveLength(6)
    fireEvent.click(screen.getByRole('tab', { name: 'Budgets' }))
    expect(screen.getByText('Budget controls')).toBeInTheDocument()
  })

  it('keeps subscription and entitlement context above every billing destination', () => {
    renderOverlay({ kind: 'settings', section: 'billing', subtab: 'transactions' })
    expect(screen.getAllByText('Subscription').length).toBeGreaterThan(0)
    expect(screen.getByText('Plan entitlements')).toBeInTheDocument()
    expect(screen.getByText('Operational limits')).toBeInTheDocument()
    expect(screen.getByText('8,000')).toBeInTheDocument()
    expect(screen.getByText('12 / 25')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Transactions' })).toHaveAttribute('aria-selected', 'true')
  })

  it('renders complete usage evidence and switches reconciled dimensions', () => {
    renderOverlay({ kind: 'settings', section: 'billing', subtab: 'usage' })
    expect(screen.getByText('Story Point ledger')).toBeInTheDocument()
    expect(screen.getByText('Ledger consumption')).toBeInTheDocument()
    expect(screen.getByText('Delivery-attributed value')).toBeInTheDocument()
    expect(screen.getByText(/must not be added together/i)).toBeInTheDocument()
    expect(screen.getByText('Provider and model tokens')).toBeInTheDocument()
    expect(screen.getByText('Total sessions')).toBeInTheDocument()
    expect(screen.getAllByText('Input tokens').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Output tokens').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('tab', { name: 'Repository' }))
    expect(screen.getByText('apps/web')).toBeInTheDocument()
  })

  it('exports usage evidence as CSV and JSON downloads', () => {
    const createObjectURL = vi.fn(() => 'blob:konteks-usage')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    renderOverlay({ kind: 'settings', section: 'billing', subtab: 'usage' })
    fireEvent.click(screen.getByRole('button', { name: 'CSV' }))
    fireEvent.click(screen.getByRole('button', { name: 'JSON' }))
    expect(createObjectURL).toHaveBeenCalledTimes(2)
    expect(revokeObjectURL).toHaveBeenCalledTimes(2)
    expect(click).toHaveBeenCalledTimes(2)
  })

  it('shows reconciliation review state without merging ledger and delivery values', () => {
    updateSettingsCustomizeState((state) => ({ ...state, usageAnalytics: { ...state.usageAnalytics, reconciled: false } }))
    renderOverlay({ kind: 'settings', section: 'billing', subtab: 'usage' })
    expect(screen.getByText('Needs review')).toBeInTheDocument()
    expect(screen.getAllByText('1,760').length).toBeGreaterThan(0)
    expect(screen.getByText('1,483')).toBeInTheDocument()
  })

  it('changes plans through a dismissal-safe checkout dialog and records the transaction', async () => {
    renderOverlay({ kind: 'settings', section: 'billing', subtab: 'plans' })
    const scaleHeader = screen.getByText('Scale', { selector: 'strong' }).closest('th')
    expect(scaleHeader).not.toBeNull()
    fireEvent.click(within(scaleHeader as HTMLElement).getByRole('button', { name: 'Choose' }))
    const dialog = screen.getByRole('dialog', { name: 'Change plan' })
    const before = getSettingsCustomizeState().transactions.length
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm plan' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByRole('dialog', { name: 'Change plan' })).toBeInTheDocument()
    await waitFor(() => expect(within(dialog).getByText('Payment confirmed')).toBeInTheDocument())
    expect(getSettingsCustomizeState().subscription.planName).toBe('Scale')
    expect(getSettingsCustomizeState().entitlements.onPremRuntime).toBe(true)
    expect(getSettingsCustomizeState().transactions).toHaveLength(before + 1)
  })

  it('keeps failed plan checkout local and succeeds exactly once after retry', async () => {
    renderOverlay({ kind: 'settings', section: 'billing', subtab: 'plans' }, 'error')
    const builderHeader = screen.getByText('Builder', { selector: 'strong' }).closest('th')
    const before = getSettingsCustomizeState().transactions.length
    fireEvent.click(within(builderHeader as HTMLElement).getByRole('button', { name: 'Choose' }))
    const dialog = screen.getByRole('dialog', { name: 'Change plan' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm plan' }))
    await waitFor(() => expect(within(dialog).getByText('Payment failed')).toBeInTheDocument())
    expect(getSettingsCustomizeState().subscription.planId).toBe('team')
    expect(getSettingsCustomizeState().transactions).toHaveLength(before)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Retry payment' }))
    await waitFor(() => expect(within(dialog).getByText('Payment confirmed')).toBeInTheDocument())
    expect(getSettingsCustomizeState().subscription.planId).toBe('builder')
    expect(getSettingsCustomizeState().transactions).toHaveLength(before + 1)
  })

  it('top ups Story Points once through a tax-aware confirmation dialog', async () => {
    renderOverlay({ kind: 'settings', section: 'billing', subtab: 'topup' })
    const packageButton = screen.getByText('Team boost').closest('button')
    expect(packageButton).not.toBeNull()
    const before = getSettingsCustomizeState().storyPointLedger
    const transactions = getSettingsCustomizeState().transactions.length
    fireEvent.click(packageButton as HTMLButtonElement)
    const dialog = screen.getByRole('dialog', { name: 'Confirm Story Point purchase' })
    expect(within(dialog).getByText('Net amount')).toBeInTheDocument()
    expect(within(dialog).getByText('Tax')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm purchase' }))
    await waitFor(() => expect(within(dialog).getByText('Top-up complete')).toBeInTheDocument())
    expect(getSettingsCustomizeState().storyPointLedger.available).toBe(before.available + 500)
    expect(getSettingsCustomizeState().storyPointLedger.totalPurchased).toBe(before.totalPurchased + 500)
    expect(getSettingsCustomizeState().transactions).toHaveLength(transactions + 1)
    expect(within(dialog).queryByRole('button', { name: 'Confirm purchase' })).not.toBeInTheDocument()
  })

  it('saves authoritative budget caps and rejects duplicate provider currencies', () => {
    renderOverlay({ kind: 'settings', section: 'billing', subtab: 'budgets' })
    const monthly = screen.getByLabelText('Workspace monthly cap')
    fireEvent.change(monthly, { target: { value: '12000' } })
    expect(screen.getByLabelText(/Per-user cap/)).toBeDisabled()
    const currencies = screen.getAllByLabelText('Billing currency')
    fireEvent.change(currencies[1], { target: { value: 'IDR' } })
    expect(screen.getByRole('alert')).toHaveTextContent('only one threshold')
    expect(screen.getByRole('button', { name: 'Save budget policy' })).toBeDisabled()
    fireEvent.change(currencies[1], { target: { value: 'USD' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save budget policy' }))
    expect(getSettingsCustomizeState().budgetPolicy.workspaceMonthlyCap).toBe(12000)
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('paginates the full transaction status ledger', () => {
    renderOverlay({ kind: 'settings', section: 'billing', subtab: 'transactions' })
    expect(screen.getByText('TRX-2084')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText('TRX-2044')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText('Partially refunded')).toBeInTheDocument()
  })

  it('keeps the billing shell visible through loading, empty, and stale-data error variants', () => {
    const loading = renderOverlay({ kind: 'settings', section: 'billing', subtab: 'usage' }, 'loading')
    expect(screen.getByText('Subscription')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Loading billing information')
    loading.unmount()

    const empty = renderOverlay({ kind: 'settings', section: 'billing', subtab: 'transactions' }, 'empty')
    expect(screen.getByText('No transactions yet')).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: 'Billing' })).toBeInTheDocument()
    empty.unmount()

    renderOverlay({ kind: 'settings', section: 'billing', subtab: 'transactions' }, 'error')
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    expect(screen.getByText('TRX-2084')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Try again' })[0])
    expect(screen.queryByText('Some billing data is delayed')).not.toBeInTheDocument()
  })

  it('validates and saves a provider without persisting its credential', async () => {
    renderOverlay({ kind: 'settings', section: 'billing', subtab: 'providers' })
    fireEvent.click(screen.getByRole('button', { name: 'Connect provider' }))
    const dialog = screen.getByRole('dialog', { name: 'Connect provider' })
    fireEvent.change(within(dialog).getByLabelText('Connection name'), { target: { value: 'Release OpenAI' } })
    fireEvent.change(within(dialog).getByLabelText('API key'), { target: { value: 'transient-secret' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Validate connection' }))
    await waitFor(() => expect(within(dialog).getByText('Connection validated.')).toBeInTheDocument())
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByText('Release OpenAI')).toBeInTheDocument())
    expect(JSON.stringify(getSettingsCustomizeState())).not.toContain('transient-secret')
  })

  it('keeps a provider dialog open after simulated credential validation failure', async () => {
    renderOverlay({ kind: 'settings', section: 'billing', subtab: 'providers' })
    fireEvent.click(screen.getByRole('button', { name: 'Connect provider' }))
    const dialog = screen.getByRole('dialog', { name: 'Connect provider' })
    fireEvent.change(within(dialog).getByLabelText('Connection name'), { target: { value: 'Broken provider' } })
    fireEvent.change(within(dialog).getByLabelText('API key'), { target: { value: 'invalid-demo' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Validate connection' }))
    await waitFor(() => expect(within(dialog).getByRole('alert')).toHaveTextContent('Validation failed'))
    expect(screen.getByRole('dialog', { name: 'Connect provider' })).toBeInTheDocument()
  })

  it('edits provider metadata through the same validated dialog', async () => {
    renderOverlay({ kind: 'settings', section: 'billing', subtab: 'providers' })
    fireEvent.click(screen.getByRole('button', { name: 'Edit Team OpenAI' }))
    const dialog = screen.getByRole('dialog', { name: 'Edit provider' })
    const name = within(dialog).getByLabelText('Connection name')
    expect(name).toHaveValue('Team OpenAI')
    fireEvent.change(name, { target: { value: 'Primary OpenAI' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Validate connection' }))
    await waitFor(() => expect(within(dialog).getByText('Connection validated.')).toBeInTheDocument())
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByText('Primary OpenAI')).toBeInTheDocument())
  })

  it('rotates a write-only provider credential and removes a connection with confirmation', async () => {
    renderOverlay({ kind: 'settings', section: 'billing', subtab: 'providers' })
    const providerRow = screen.getByText('Team OpenAI', { selector: 'strong' }).closest('article')
    expect(providerRow).not.toBeNull()
    fireEvent.click(within(providerRow as HTMLElement).getByRole('button', { name: 'Rotate key' }))
    const rotate = screen.getByRole('dialog', { name: 'Rotate provider credential' })
    fireEvent.change(within(rotate).getByLabelText('API key'), { target: { value: 'super-secret-N3W9' } })
    fireEvent.click(within(rotate).getByRole('button', { name: 'Rotate key' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Rotate provider credential' })).not.toBeInTheDocument())
    expect(JSON.stringify(getSettingsCustomizeState())).not.toContain('super-secret-N3W9')
    expect(getSettingsCustomizeState().providers.find((item) => item.id === 'provider-openai')?.maskedSuffix).toBe('N3W9')

    const refreshedRow = screen.getByText('Team OpenAI', { selector: 'strong' }).closest('article')
    fireEvent.click(within(refreshedRow as HTMLElement).getByRole('button', { name: 'Remove Team OpenAI' }))
    const remove = screen.getByRole('dialog', { name: 'Remove provider' })
    fireEvent.click(within(remove).getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(getSettingsCustomizeState().providers.some((item) => item.id === 'provider-openai')).toBe(false))
  })

  it('saves the provider allowlist independently from provider credentials', () => {
    renderOverlay({ kind: 'settings', section: 'billing', subtab: 'providers' })
    const compatible = screen.getByLabelText('OpenAI-compatible')
    expect(compatible).not.toBeChecked()
    fireEvent.click(compatible)
    fireEvent.click(screen.getByRole('button', { name: 'Save policy' }))
    expect(getSettingsCustomizeState().providerPolicy.allowedProviders).toContain('OpenAI-compatible')
    expect(screen.getByRole('status')).toHaveTextContent('Provider policy saved')
  })

  it('validates and saves the profile name', () => {
    renderOverlay()
    const input = screen.getByLabelText('Display name')
    fireEvent.change(input, { target: { value: '' } })
    expect(screen.getByRole('alert')).toHaveTextContent('required')
    fireEvent.change(input, { target: { value: 'Ayu Admin' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('persists Indonesian locale and updates scoped copy', () => {
    renderOverlay()
    fireEvent.click(screen.getByRole('button', { name: 'Indonesian' }))
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('id')
    expect(screen.getByRole('dialog', { name: 'Pengaturan' })).toBeInTheDocument()
  })

  it('localizes billing summaries, analytics, and navigation in Indonesian', () => {
    setLocalePreference('id')
    renderOverlay({ kind: 'settings', section: 'billing', subtab: 'usage' })
    expect(screen.getByText('Langganan')).toBeInTheDocument()
    expect(screen.getByText('Hak paket')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Penggunaan' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Ledger dan atribusi pekerjaan')).toBeInTheDocument()
    expect(screen.getByText(/tidak boleh dijumlahkan/)).toBeInTheDocument()
  })

  it('creates a detailed group in a nested dialog and deletes the regular group', async () => {
    renderOverlay({ kind: 'settings', section: 'team' })
    expect(screen.queryByRole('button', { name: /Delete Refactory owners/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Create group' }))
    const dialog = screen.getByRole('dialog', { name: 'Create group' })
    const submit = within(dialog).getByRole('button', { name: 'Create group' })
    expect(submit).toBeDisabled()
    fireEvent.change(within(dialog).getByLabelText('Group slug'), { target: { value: 'quality' } })
    fireEvent.change(within(dialog).getByLabelText('Display name (optional)'), { target: { value: 'Quality' } })
    fireEvent.change(within(dialog).getByLabelText('Description (optional)'), { target: { value: 'Quality engineering' } })
    fireEvent.change(within(dialog).getByLabelText('Default role'), { target: { value: 'viewer' } })
    fireEvent.click(submit)
    expect(within(dialog).getByText('Creating group…')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByRole('dialog', { name: 'Create group' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Create group' })).not.toBeInTheDocument())
    expect(screen.getByText('Quality')).toBeInTheDocument()
    expect(screen.getByText(/refactory-quality · 0 members · Viewer/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete Quality' }))
    expect(screen.queryByText('Quality')).not.toBeInTheDocument()
  })

  it('validates required, malformed, duplicate, and over-length group slugs', () => {
    renderOverlay({ kind: 'settings', section: 'team' })
    fireEvent.click(screen.getByRole('button', { name: 'Create group' }))
    const dialog = screen.getByRole('dialog', { name: 'Create group' })
    const slug = within(dialog).getByLabelText('Group slug')
    fireEvent.blur(slug)
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Enter a group slug')
    fireEvent.change(slug, { target: { value: 'Bad Slug' } })
    expect(within(dialog).getByRole('alert')).toHaveTextContent('lowercase letters')
    fireEvent.change(slug, { target: { value: 'engineering' } })
    expect(within(dialog).getByRole('alert')).toHaveTextContent('already exists')
    fireEvent.change(slug, { target: { value: 'a'.repeat(60) } })
    expect(within(dialog).getByRole('alert')).toHaveTextContent('63 characters or fewer')
  })

  it('invites an existing member from the selected group row exactly once', async () => {
    renderOverlay({ kind: 'settings', section: 'team' })
    fireEvent.click(screen.getByRole('button', { name: 'Invite Engineering' }))
    const dialog = screen.getByRole('dialog', { name: 'Invite member — Engineering' })
    expect(within(dialog).getByRole('status')).toHaveTextContent('Loading workspace members')
    await waitFor(() => expect(within(dialog).getByText('Start typing to find a workspace member.')).toBeInTheDocument())
    fireEvent.change(within(dialog).getByLabelText('Search members'), { target: { value: 'Samira' } })
    fireEvent.click(within(dialog).getByLabelText(/Samira Putri/))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add to group' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Invite member — Engineering' })).not.toBeInTheDocument())
    const engineeringRow = screen.getByText('Engineering', { selector: 'strong' }).closest('article')
    expect(engineeringRow).not.toBeNull()
    expect(within(engineeringRow as HTMLElement).getByText(/9 members/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Invite Engineering' }))
    await waitFor(() => expect(screen.getByText('Start typing to find a workspace member.')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Search members'), { target: { value: 'Samira' } })
    expect(screen.getByText('No matching members found.')).toBeInTheDocument()
  })

  it('creates a group-scoped email invitation and exposes a copyable one-time link', async () => {
    const writeText = vi.fn().mockRejectedValueOnce(new Error('Clipboard denied')).mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    renderOverlay({ kind: 'settings', section: 'team' })
    fireEvent.click(screen.getByRole('button', { name: 'Invite Product reviewers' }))
    const dialog = screen.getByRole('dialog', { name: 'Invite member — Product reviewers' })
    fireEvent.click(within(dialog).getByRole('tab', { name: 'Invite by email' }))
    const email = within(dialog).getByLabelText('Email address')
    fireEvent.change(email, { target: { value: 'not-an-email' } })
    expect(within(dialog).getByRole('alert')).toHaveTextContent('valid email')
    fireEvent.change(email, { target: { value: 'new.member@example.com' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create invitation' }))
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Invitation ready to share' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('could not be copied'))
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Acceptance link copied'))
    expect(writeText).toHaveBeenCalledTimes(2)
    expect(writeText).toHaveBeenLastCalledWith(expect.stringContaining('/accept-invitation?token='))
    const handoffDialog = screen.getByRole('dialog', { name: 'Invitation ready to share' })
    const handoffFooter = handoffDialog.querySelector('footer')
    expect(handoffFooter).not.toBeNull()
    fireEvent.click(within(handoffFooter as HTMLElement).getByRole('button', { name: 'Close' }))
    expect(screen.getByText('new.member@example.com')).toBeInTheDocument()
    expect(screen.getByText('Product reviewers', { selector: 'span' })).toBeInTheDocument()
  })

  it('closes a nested dialog with backdrop or Escape and restores its row trigger', async () => {
    renderOverlay({ kind: 'settings', section: 'team' })
    const trigger = screen.getByRole('button', { name: 'Invite Refactory owners' })
    fireEvent.click(trigger)
    fireEvent.mouseDown(screen.getByTestId('team-dialog-backdrop'))
    await waitFor(() => expect(trigger).toHaveFocus())

    fireEvent.click(trigger)
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
  })

  it('keeps keyboard focus inside the active nested dialog', () => {
    renderOverlay({ kind: 'settings', section: 'team' })
    fireEvent.click(screen.getByRole('button', { name: 'Create group' }))
    const dialog = screen.getByRole('dialog', { name: 'Create group' })
    const close = within(dialog).getByRole('button', { name: 'Close' })
    const cancel = within(dialog).getByRole('button', { name: 'Cancel' })
    close.focus()
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })
    expect(cancel).toHaveFocus()
    fireEvent.keyDown(cancel, { key: 'Tab' })
    expect(close).toHaveFocus()
  })

  it('prevents duplicate group invitations and existing group-member email invites', () => {
    renderOverlay({ kind: 'settings', section: 'team' })
    fireEvent.click(screen.getByRole('button', { name: 'Invite Engineering' }))
    const dialog = screen.getByRole('dialog', { name: 'Invite member — Engineering' })
    fireEvent.click(within(dialog).getByRole('tab', { name: 'Invite by email' }))
    const email = within(dialog).getByLabelText('Email address')
    fireEvent.change(email, { target: { value: 'maya@refactory.dev' } })
    expect(within(dialog).getByRole('alert')).toHaveTextContent('already pending')
    fireEvent.change(email, { target: { value: 'ayu@refactory.dev' } })
    expect(within(dialog).getByRole('alert')).toHaveTextContent('already belongs')
    expect(within(dialog).getByRole('button', { name: 'Create invitation' })).toBeDisabled()
  })

  it('localizes both Team dialog surfaces in Indonesian', () => {
    setLocalePreference('id')
    renderOverlay({ kind: 'settings', section: 'team' })
    fireEvent.click(screen.getByRole('button', { name: 'Buat grup' }))
    expect(screen.getByRole('dialog', { name: 'Buat grup' })).toBeInTheDocument()
    expect(screen.getByLabelText('Slug grup')).toBeInTheDocument()
  })

  it('closes on Escape and restores the overlay slot', () => {
    renderOverlay()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Settings' })).not.toBeInTheDocument()
  })
})
