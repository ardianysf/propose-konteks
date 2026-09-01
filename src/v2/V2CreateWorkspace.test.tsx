/*
 * V2CreateWorkspace tests — the workspace flyout + create-workspace
 * modal flow.
 *
 * Renders the real V2App exactly like V2Shell.test.tsx. The flyout rows
 * stay LEAN (avatar, name, role chip, active check — no system count);
 * the count appears once, in the identity row's meta line
 * ("plan · ROLE · N systems"), followed by a muted one-line description
 * when the workspace has one. The end-of-list "Add new workspace" row
 * (still after every option, footer keeps only "Create new system")
 * opens the modal: Workspace ID (mono, required, helper hint) /
 * Workspace Display (required) / Description (optional). "Add workspace"
 * stays disabled until ID + Display are non-empty after trim; an ID
 * colliding with an existing workspace shows the inline "This ID is
 * already used" error and keeps the button disabled. Cancel (button,
 * Escape) appends nothing; confirm appends the workspace to the END of
 * the list with its id used VERBATIM, makes it active (OWNER chip), and
 * closes the modal + the flyout while the panel stays open — a
 * zero-systems workspace scopes the systems list gracefully and the
 * identity card falls to its 'No systems yet' placeholder.
 *
 * No matchMedia stub needed here (unlike V2Shell.test.tsx): this file
 * never touches theme resolution and V2Sidebar's forced-rail listener
 * guards against a missing window.matchMedia.
 */
import { fireEvent, render, screen, within } from '@testing-library/react'
import V2App from './V2App'

const getContextPopover = () => screen.getByRole('dialog', { name: 'Workspace and systems' })

const getCreateModal = () => screen.getByRole('dialog', { name: 'Add new workspace' })

const getFlyout = () => screen.getByTestId('v2-popover-workspace-list')

const openCreateModal = () => {
  fireEvent.click(screen.getByTestId('v2-context-trigger'))
  fireEvent.click(screen.getByTestId('v2-popover-workspace'))
  fireEvent.click(screen.getByTestId('v2-popover-add-workspace'))
  return getCreateModal()
}

/** Document-order check: `after` follows `before` in the DOM. */
const followsInDom = (before: Element, after: Element) =>
  // eslint-disable-next-line no-bitwise
  (before.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

describe('V2ContextPopover create workspace', () => {
  it('places the Add row after every option and keeps the footer to Create new system only', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId('v2-context-trigger'))
    const popover = getContextPopover()

    // Closed resting state: no flyout, and the footer's ONLY create
    // action is "Create new system".
    expect(screen.queryByTestId('v2-popover-workspace-list')).not.toBeInTheDocument()
    const footer = popover.querySelector('.kx-v2-pop__footer') as HTMLElement
    expect(footer).toBeInTheDocument()
    expect(within(footer).getAllByRole('button')).toHaveLength(1)
    expect(footer).toHaveTextContent('Create new system')
    expect(footer).not.toHaveTextContent('Add new workspace')

    // Open the flyout: the dashed Add row is a real button sitting AFTER
    // the last workspace option (DOM order), inside the same flyout.
    fireEvent.click(screen.getByTestId('v2-popover-workspace'))
    const list = getFlyout()
    const options = within(list).getAllByRole('option')
    expect(options).toHaveLength(3)
    const addRow = screen.getByTestId('v2-popover-add-workspace')
    expect(addRow).toHaveTextContent('Add new workspace')
    expect(followsInDom(options[options.length - 1], addRow)).toBe(true)
    expect(followsInDom(list, addRow)).toBe(true)

    // The Add row and the option list share one flyout surface.
    expect(addRow.closest('.kx-v2-pop__ws-flyout')).toBe(list.parentElement)
  })

  it('shows no system counts in flyout rows; the selected identity carries plan · ROLE · N systems + description', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId('v2-context-trigger'))
    const popover = getContextPopover()

    // Identity of the SELECTED seed: plan · ROLE · count, one line, plus
    // the muted description line under it.
    const identity = within(popover).getByTestId('v2-popover-workspace')
    expect(identity).toHaveTextContent('Refactory')
    expect(identity).toHaveTextContent('Team plan · OWNER · 2 systems')
    expect(identity).toHaveTextContent('Product engineering workspace for the Refactory team')

    // Flyout rows: role chips stay, but NO row carries a system count.
    fireEvent.click(identity)
    const list = getFlyout()
    const options = within(list).getAllByRole('option')
    expect(options).toHaveLength(3)
    for (const option of options) {
      expect(within(option).queryByText(/\d+ systems?/)).not.toBeInTheDocument()
    }
    expect(within(list).queryByText(/\d+ systems?/)).not.toBeInTheDocument()

    // The panel's "All systems" row is NOT a workspace row — its scoped
    // count stays (identity meta carries the other "2 systems").
    expect(within(popover).getAllByText('2 systems').length).toBeGreaterThanOrEqual(1)

    // Selecting MPM Digital moves the count into its identity: the rows
    // still show none.
    fireEvent.click(within(list).getByTestId('v2-popover-workspace-ws-mpm'))
    expect(screen.queryByTestId('v2-popover-workspace-list')).not.toBeInTheDocument()
    const updatedIdentity = within(getContextPopover()).getByTestId('v2-popover-workspace')
    expect(updatedIdentity).toHaveTextContent('Team plan · ADMIN · 2 systems')
    expect(updatedIdentity).toHaveTextContent('Client engagement workspace for MPM Digital')
  })

  it('shows the seeded membership roles: Owner/Admin/Member chips on rows and the identity', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId('v2-context-trigger'))
    const popover = getContextPopover()

    // Identity row: meta line carries the active workspace's role chip.
    const identity = within(popover).getByTestId('v2-popover-workspace')
    expect(identity).toHaveTextContent('Refactory')
    expect(identity).toHaveTextContent('Team plan')
    expect(within(identity).getByText('OWNER')).toBeInTheDocument()

    // Flyout rows: each seed shows its own role chip.
    fireEvent.click(screen.getByTestId('v2-popover-workspace'))
    const list = getFlyout()
    expect(within(within(list).getByTestId('v2-popover-workspace-ws-refactory')).getByText('OWNER')).toBeInTheDocument()
    expect(within(within(list).getByTestId('v2-popover-workspace-ws-mpm')).getByText('ADMIN')).toBeInTheDocument()
    expect(
      within(within(list).getByTestId('v2-popover-workspace-ws-ardian-labs')).getByText('MEMBER'),
    ).toBeInTheDocument()
  })

  it('the Add row opens the modal with three labeled fields; confirm disabled until ID + Display are filled', () => {
    render(<V2App />)
    const modal = openCreateModal()

    // Three labeled fields — ID (with its helper hint), Display,
    // Description — plus the Cancel / Add workspace actions.
    const idField = within(modal).getByLabelText(/Workspace ID/)
    const displayField = within(modal).getByLabelText(/Workspace Display/)
    within(modal).getByLabelText(/Description/)
    expect(within(modal).getByText('Used as the workspace identifier')).toBeInTheDocument()
    const confirm = within(modal).getByRole('button', { name: 'Add workspace' })
    expect(within(modal).getByRole('button', { name: 'Cancel' })).toBeInTheDocument()

    // Confirm stays disabled while either required field is empty...
    expect(confirm).toBeDisabled()
    fireEvent.change(idField, { target: { value: 'acme-crew' } })
    expect(confirm).toBeDisabled()
    fireEvent.change(displayField, { target: { value: 'Acme Crew' } })
    expect(confirm).toBeEnabled()

    // ...and whitespace-only values do not count as filled.
    fireEvent.change(idField, { target: { value: '   ' } })
    fireEvent.change(displayField, { target: { value: '   ' } })
    expect(confirm).toBeDisabled()

    // The flyout stays open behind the modal; nothing was appended.
    expect(within(getFlyout()).getAllByRole('option')).toHaveLength(3)
  })

  it('an existing ID shows the inline collision error and keeps confirm disabled', () => {
    render(<V2App />)
    const modal = openCreateModal()

    const idField = within(modal).getByLabelText(/Workspace ID/)
    const displayField = within(modal).getByLabelText(/Workspace Display/)
    const confirm = within(modal).getByRole('button', { name: 'Add workspace' })

    fireEvent.change(idField, { target: { value: 'ws-refactory' } })
    fireEvent.change(displayField, { target: { value: 'Acme Crew' } })
    expect(within(modal).getByText('This ID is already used')).toBeInTheDocument()
    expect(confirm).toBeDisabled()

    // Fixing the ID clears the error and re-enables confirm.
    fireEvent.change(idField, { target: { value: 'acme-crew' } })
    expect(within(modal).queryByText('This ID is already used')).not.toBeInTheDocument()
    expect(confirm).toBeEnabled()
  })

  it('Cancel button closes the modal without appending a workspace', () => {
    render(<V2App />)
    const modal = openCreateModal()

    fireEvent.change(within(modal).getByLabelText(/Workspace ID/), {
      target: { value: 'ghost' },
    })
    fireEvent.change(within(modal).getByLabelText(/Workspace Display/), {
      target: { value: 'Ghost' },
    })
    fireEvent.click(within(modal).getByRole('button', { name: 'Cancel' }))

    // Modal gone; the panel + flyout stay open with the Add row back and
    // still only the three seeded workspaces.
    expect(screen.queryByRole('dialog', { name: 'Add new workspace' })).not.toBeInTheDocument()
    expect(getContextPopover()).toBeInTheDocument()
    expect(screen.getByTestId('v2-popover-add-workspace')).toBeInTheDocument()
    expect(within(getFlyout()).getAllByRole('option')).toHaveLength(3)
    expect(screen.getByTestId('v2-context-trigger').textContent).toContain('Refactory')
  })

  it('Escape closes the modal only — then the flyout, then the panel', () => {
    render(<V2App />)
    const modal = openCreateModal()
    fireEvent.change(within(modal).getByLabelText(/Workspace ID/), {
      target: { value: 'ghost' },
    })

    // First Escape: the modal owns it — the panel and flyout survive,
    // nothing appended.
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Add new workspace' })).not.toBeInTheDocument()
    expect(getContextPopover()).toBeInTheDocument()
    expect(screen.getByTestId('v2-popover-add-workspace')).toBeInTheDocument()
    expect(within(getFlyout()).getAllByRole('option')).toHaveLength(3)

    // The simplified chain behind: flyout first, panel second.
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('v2-popover-workspace-list')).not.toBeInTheDocument()
    expect(getContextPopover()).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('v2-context-popover')).not.toBeInTheDocument()
  })

  it('happy path: confirm appends the workspace last + activates it; identity follows with count + description', () => {
    render(<V2App />)
    const modal = openCreateModal()

    fireEvent.change(within(modal).getByLabelText(/Workspace ID/), {
      target: { value: 'acme-crew' },
    })
    fireEvent.change(within(modal).getByLabelText(/Workspace Display/), {
      target: { value: 'Acme Crew' },
    })
    fireEvent.change(within(modal).getByLabelText(/Description/), {
      target: { value: 'Everything the Acme crew builds together' },
    })
    fireEvent.click(within(modal).getByRole('button', { name: 'Add workspace' }))

    // Modal AND flyout closed — the panel stays open, re-scoped live to
    // the new zero-systems workspace.
    expect(screen.queryByRole('dialog', { name: 'Add new workspace' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('v2-popover-workspace-list')).not.toBeInTheDocument()
    const popover = getContextPopover()
    expect(within(popover).getByText('In Acme Crew')).toBeInTheDocument()
    expect(within(popover).getAllByText('0 systems').length).toBeGreaterThanOrEqual(1)

    // The identity card: name, Starter plan · OWNER · 0 systems meta,
    // and the description line under it.
    const identity = within(popover).getByTestId('v2-popover-workspace')
    expect(identity).toHaveTextContent('Acme Crew')
    expect(identity).toHaveTextContent('Starter · OWNER · 0 systems')
    expect(identity).toHaveTextContent('Everything the Acme crew builds together')

    // The sidebar identity follows: new workspace name + the zero-
    // systems placeholder instead of an out-of-scope system pairing.
    const trigger = screen.getByTestId('v2-context-trigger')
    expect(trigger.textContent).toContain('Acme Crew')
    expect(trigger.textContent).toContain('No systems yet')

    // Reopen the flyout: FOUR options — the new one LAST with its id
    // used verbatim, the selected mark, and the OWNER chip (creator
    // owns it), still above the end-of-list Add row.
    fireEvent.click(identity)
    const list = getFlyout()
    const options = within(list).getAllByRole('option')
    expect(options).toHaveLength(4)
    const added = within(list).getByRole('option', { name: /Acme Crew/ })
    expect(within(added).getByTestId('v2-popover-workspace-acme-crew')).toHaveTextContent(
      'Acme Crew',
    )
    expect(within(added).getByText('OWNER')).toBeInTheDocument()
    expect(added).toHaveAttribute('aria-selected', 'true')
    expect(options[3]).toBe(added)
    expect(followsInDom(added, screen.getByTestId('v2-popover-add-workspace'))).toBe(true)
  })
})
