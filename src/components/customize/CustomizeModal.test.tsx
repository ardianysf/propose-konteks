import { useReducer } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import CustomizeModal from './CustomizeModal'
import SettingsModal from '../account/SettingsModal'
import { OverlayLifecycleProvider } from '../shell/OverlayLifecycle'
import { MockupContext } from '../../state/MockupContext'
import { initialState, mockupReducer, type CustomizeDestination } from '../../state/mockupReducer'
import { getSettingsCustomizeState, resetSettingsCustomizeStore } from '../../state/settingsCustomizeStore'
import { resetPrototypeLocaleForTests, setLocalePreference } from '../../i18n/prototypeLocale'

function renderModal(destination: CustomizeDestination = { section: 'agents' }) {
  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, { ...initialState(), overlay: { kind: 'customize', destination } })
    return <MockupContext.Provider value={{ state, dispatch }}><OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>{state.overlay.kind === 'customize' && <CustomizeModal />}{state.overlay.kind === 'settings' && <SettingsModal />}</OverlayLifecycleProvider></MockupContext.Provider>
  }
  return render(<Harness />)
}

beforeEach(() => { resetSettingsCustomizeStore(); resetPrototypeLocaleForTests(); localStorage.clear() })

describe('CustomizeModal grouped workspace', () => {
  it('renders the five grouped destinations and navigates nested catalogs', () => {
    renderModal()
    const nav = screen.getByRole('tablist', { name: 'Customize' })
    expect(within(nav).getAllByRole('tab').map((button) => button.textContent)).toEqual(['Agents', 'Context', 'Capabilities', 'Connections', 'Admin'])
    fireEvent.click(within(nav).getByRole('tab', { name: /capabilities/i }))
    expect(screen.getByRole('tab', { name: 'Skills' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('tab', { name: 'Tools' }))
    expect(screen.getByText('Catalog search')).toBeInTheDocument()
  })

  it('deep-links a missing agent provider to Settings Providers', () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: /connect required provider/i }))
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Providers' })).toHaveAttribute('aria-selected', 'true')
  })

  it('creates a context file in a nested modal and keeps it in session state', async () => {
    renderModal({ section: 'context', subtab: 'files' })
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'docs/new.md' } })
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: '# New' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByText('docs/new.md')).toBeInTheDocument())
  })

  it('creates and configures individual agents and execution profiles in dialogs', async () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Create agent' }))
    let dialog = screen.getByRole('dialog', { name: 'Create agent' })
    fireEvent.change(within(dialog).getByLabelText('Agent name'), { target: { value: 'Release assistant' } })
    fireEvent.change(within(dialog).getByLabelText('Model'), { target: { value: 'GPT-4.1' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByText('Release assistant')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Create profile' }))
    dialog = screen.getByRole('dialog', { name: 'Create profile' })
    fireEvent.change(within(dialog).getByLabelText('Profile name'), { target: { value: 'Release delivery' } })
    fireEvent.change(within(dialog).getByLabelText('Planner model'), { target: { value: 'GPT-4.1' } })
    fireEvent.change(within(dialog).getByLabelText('Executor model'), { target: { value: 'Claude Sonnet 4.5' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByText('Release delivery')).toBeInTheDocument())
  })

  it('edits agent and connector records through prefilled dialogs', async () => {
    const view = renderModal()
    fireEvent.click(screen.getAllByRole('button', { name: 'Configure' })[0])
    let dialog = screen.getByRole('dialog', { name: 'Configure agent' })
    const model = within(dialog).getByLabelText('Model')
    fireEvent.change(model, { target: { value: 'GPT-4.2' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByText(/OpenAI · GPT-4.2/)).toBeInTheDocument())
    view.unmount()

    renderModal({ section: 'connections', subtab: 'mcp' })
    fireEvent.click(screen.getByRole('button', { name: 'Edit Context7' }))
    dialog = screen.getByRole('dialog', { name: 'Edit connection' })
    fireEvent.change(within(dialog).getByLabelText('Connection name'), { target: { value: 'Context7 primary' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Validate connection' }))
    await waitFor(() => expect(within(dialog).getByText('Connection validated.')).toBeInTheDocument())
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByText('Context7 primary')).toBeInTheDocument())
  })

  it('loads structured repository context from a modal', async () => {
    renderModal({ section: 'context', subtab: 'repositories' })
    fireEvent.click(screen.getByRole('button', { name: 'Load repository' }))
    const dialog = screen.getByRole('dialog', { name: 'Load repository' })
    fireEvent.change(within(dialog).getByLabelText('Repository URL'), { target: { value: 'https://github.com/refactory-id/new-context' } })
    fireEvent.change(within(dialog).getByLabelText('Branch or ref'), { target: { value: 'develop' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Load repository' }))
    await waitFor(() => expect(screen.getByText('https://github.com/refactory-id/new-context')).toBeInTheDocument())
    expect(getSettingsCustomizeState().repository.ref).toBe('develop')
  })

  it('creates capabilities and publishes typed versions from nested dialogs', async () => {
    renderModal({ section: 'capabilities', subtab: 'skills' })
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))
    let dialog = screen.getByRole('dialog', { name: 'Create resource' })
    fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: 'Dependency review' } })
    fireEvent.change(within(dialog).getByLabelText('Description'), { target: { value: 'Review dependency changes.' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByText('Dependency review')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Dependency review'))
    fireEvent.click(screen.getByRole('button', { name: 'Add version' }))
    dialog = screen.getByRole('dialog', { name: 'Add version' })
    fireEvent.change(within(dialog).getByLabelText('Semantic version'), { target: { value: '1.1.0' } })
    fireEvent.change(within(dialog).getByLabelText('Release notes'), { target: { value: 'Adds license checks.' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add version' }))
    await waitFor(() => expect(screen.getByText('v1.1.0')).toBeInTheDocument())
  })

  it.each([
    ['mcp', 'MCP servers', 'Endpoint URL'],
    ['vcs', 'Version control', 'Base URL'],
    ['search', 'Search connectors', 'Search index'],
  ] as const)('opens a typed %s connector dialog', (subtab, _label, field) => {
    renderModal({ section: 'connections', subtab })
    fireEvent.click(screen.getByRole('button', { name: 'Add connection' }))
    const dialog = screen.getByRole('dialog', { name: 'Add connection' })
    expect(within(dialog).getByLabelText(field)).toBeInTheDocument()
  })

  it('validates and stores a connector without persisting its credential', async () => {
    renderModal({ section: 'connections', subtab: 'mcp' })
    fireEvent.click(screen.getByRole('button', { name: 'Add connection' }))
    const dialog = screen.getByRole('dialog', { name: 'Add connection' })
    fireEvent.change(within(dialog).getByLabelText('Connection name'), { target: { value: 'Release MCP' } })
    fireEvent.change(within(dialog).getByLabelText('Endpoint URL'), { target: { value: 'https://mcp.release.example' } })
    fireEvent.change(within(dialog).getByLabelText('Credential'), { target: { value: 'secret-demo-value' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Validate connection' }))
    await waitFor(() => expect(within(dialog).getByText('Connection validated.')).toBeInTheDocument())
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByText('Release MCP')).toBeInTheDocument())
    expect(JSON.stringify(getSettingsCustomizeState())).not.toContain('secret-demo-value')
  })

  it('creates owner mappings and one-time activation tokens through dialogs', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const view = renderModal({ section: 'admin', subtab: 'owner-mappings' })
    fireEvent.click(screen.getByRole('button', { name: 'Add mapping' }))
    let dialog = screen.getByRole('dialog', { name: 'Add owner mapping' })
    fireEvent.change(within(dialog).getByLabelText('Path or handle'), { target: { value: 'packages/design/**' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByText('packages/design/**')).toBeInTheDocument())
    view.unmount()

    renderModal({ section: 'admin', subtab: 'runtimes' })
    fireEvent.click(screen.getByRole('button', { name: 'Generate token' }))
    dialog = screen.getByRole('dialog', { name: 'Generate token' })
    fireEvent.change(within(dialog).getByLabelText('Token label'), { target: { value: 'Release runner' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Generate token' }))
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Activation token ready' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Copy token' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Activation token copied'))
    expect(JSON.stringify(getSettingsCustomizeState())).not.toContain('kx_act_')
  })

  it('supports connection health and restore states', () => {
    renderModal({ section: 'connections', subtab: 'vcs' })
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }))
    expect(screen.getByText(/Healthy · validated just now/)).toBeInTheDocument()
  })

  it('localizes new resource dialogs in Indonesian', () => {
    setLocalePreference('id')
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Buat agen' }))
    const dialog = screen.getByRole('dialog', { name: 'Buat agen' })
    expect(within(dialog).getByLabelText('Nama agen')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Koneksi penyedia')).toBeInTheDocument()
  })

  it('closes on Escape through the shared overlay lifecycle', () => {
    renderModal()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Customize' })).not.toBeInTheDocument()
  })
})
