/*
 * V2AddWorkspace tests — the context popover's add-workspace flow.
 *
 * Renders the real V2App exactly like V2Shell.test.tsx. The affordance
 * now lives at the END of the workspace flyout (a dashed "Add new
 * workspace" row after the listbox options, never in the panel footer —
 * the footer keeps only "Create new system"): the inline draft input,
 * Enter/check confirmation (workspace appended to the flyout listbox AND
 * made active so the sidebar identity card follows), the blank-name
 * 'New Workspace' fallback, and Escape/X cancellation which appends
 * nothing. Every workspace row — seeds and created ones — carries an
 * uppercase membership-role chip (OWNER/ADMIN/MEMBER); a freshly created
 * workspace has zero systems, so the systems list scopes to it
 * gracefully (no crash) and the identity card falls to its 'No systems
 * yet' placeholder instead of an out-of-scope system pairing.
 *
 * No matchMedia stub needed here (unlike V2Shell.test.tsx): this file
 * never touches theme resolution and V2Sidebar's forced-rail listener
 * guards against a missing window.matchMedia.
 */
import { fireEvent, render, screen, within } from '@testing-library/react'
import V2App from './V2App'

const getContextPopover = () => screen.getByRole('dialog', { name: 'Workspace and systems' })

const getFlyout = () => screen.getByTestId('v2-popover-workspace-list')

/** Document-order check: `after` follows `before` in the DOM. */
const followsInDom = (before: Element, after: Element) =>
  // eslint-disable-next-line no-bitwise
  (before.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

describe('V2ContextPopover add workspace', () => {
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

  it('shows the seeded membership roles: Owner/Admin/Member chips on rows and the identity', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId('v2-context-trigger'))
    const popover = getContextPopover()

    // Identity row: plan line carries the active workspace's role chip.
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

  it('adds a workspace from the end-of-list row: type a name, Enter confirms, appended + selected', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId('v2-context-trigger'))
    const popover = getContextPopover()

    // The affordance is the flyout's last row, below the three options.
    fireEvent.click(screen.getByTestId('v2-popover-workspace'))
    const list = getFlyout()
    const addRow = within(popover).getByTestId('v2-popover-add-workspace')
    expect(followsInDom(within(list).getAllByRole('option')[2], addRow)).toBe(true)
    fireEvent.click(addRow)

    // The SAME end-of-list position swaps for the inline draft input
    // (after the options, inside the flyout); focus lands in it.
    const form = within(popover).getByTestId('v2-popover-add-workspace-form')
    const input = within(form).getByLabelText('New workspace name')
    expect(input).toHaveFocus()
    expect(within(form).getByTestId('v2-popover-add-workspace-confirm')).toBeInTheDocument()
    expect(within(form).getByTestId('v2-popover-add-workspace-cancel')).toBeInTheDocument()
    expect(followsInDom(list, form)).toBe(true)
    expect(form.closest('.kx-v2-pop__ws-flyout')).toBe(list.parentElement)

    // Type a name and confirm with Enter — the flyout and panel stay
    // open; the Add row returns in place of the form.
    fireEvent.change(input, { target: { value: 'Acme Crew' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.queryByTestId('v2-popover-add-workspace-form')).not.toBeInTheDocument()
    expect(screen.getByTestId('v2-popover-add-workspace')).toBeInTheDocument()
    expect(getContextPopover()).toBeInTheDocument()

    // Appended: the flyout listbox now counts four options; the new one
    // carries its slug id, an OWNER chip (creator owns it), the selected
    // mark, and sits at the END of the list.
    const options = within(list).getAllByRole('option')
    expect(options).toHaveLength(4)
    const added = within(list).getByRole('option', { name: /Acme Crew/ })
    expect(within(added).getByTestId('v2-popover-workspace-ws-acme-crew')).toHaveTextContent(
      'Acme Crew',
    )
    expect(within(added).getByText('OWNER')).toBeInTheDocument()
    expect(added).toHaveAttribute('aria-selected', 'true')
    expect(options[3]).toBe(added)
    expect(followsInDom(added, screen.getByTestId('v2-popover-add-workspace'))).toBe(true)

    // Selected: the sidebar identity card follows the new workspace and
    // — zero systems — falls to the placeholder instead of an out-of-scope
    // system pairing; the systems list scopes to it without crashing.
    const trigger = screen.getByTestId('v2-context-trigger')
    expect(trigger.textContent).toContain('Acme Crew')
    expect(trigger.textContent).toContain('No systems yet')
    const reopened = getContextPopover()
    expect(within(reopened).getByText('In Acme Crew')).toBeInTheDocument()
    expect(within(reopened).getAllByText('0 systems').length).toBeGreaterThanOrEqual(1)
  })

  it('confirming a blank draft falls back to the New Workspace name', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId('v2-context-trigger'))
    const popover = getContextPopover()

    fireEvent.click(screen.getByTestId('v2-popover-workspace'))
    fireEvent.click(within(popover).getByTestId('v2-popover-add-workspace'))
    fireEvent.change(within(popover).getByLabelText('New workspace name'), {
      target: { value: '   ' },
    })
    fireEvent.click(within(popover).getByTestId('v2-popover-add-workspace-confirm'))

    const list = getFlyout()
    expect(within(list).getAllByRole('option')).toHaveLength(4)
    const added = within(list).getByRole('option', { name: /New Workspace/ })
    expect(added).toHaveAttribute('aria-selected', 'true')
    expect(within(added).getByText('OWNER')).toBeInTheDocument()
    expect(screen.getByTestId('v2-context-trigger').textContent).toContain('New Workspace')
  })

  it('Escape and the X control cancel the draft without appending a workspace', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId('v2-context-trigger'))
    const popover = getContextPopover()

    // Escape cancels the draft — the flyout stays open and the Add row
    // returns to its end-of-list position; the panel itself stays open.
    fireEvent.click(screen.getByTestId('v2-popover-workspace'))
    fireEvent.click(within(popover).getByTestId('v2-popover-add-workspace'))
    fireEvent.change(within(popover).getByLabelText('New workspace name'), {
      target: { value: 'Ghost' },
    })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('v2-popover-add-workspace-form')).not.toBeInTheDocument()
    expect(screen.getByTestId('v2-popover-add-workspace')).toBeInTheDocument()
    expect(getContextPopover()).toBeInTheDocument()

    // The X control cancels too.
    fireEvent.click(within(popover).getByTestId('v2-popover-add-workspace'))
    fireEvent.change(within(popover).getByLabelText('New workspace name'), {
      target: { value: 'Ghost' },
    })
    fireEvent.click(within(popover).getByTestId('v2-popover-add-workspace-cancel'))
    expect(screen.queryByTestId('v2-popover-add-workspace-form')).not.toBeInTheDocument()

    // Nothing was appended either time: still the three seeded workspaces.
    expect(within(getFlyout()).getAllByRole('option')).toHaveLength(3)
    expect(screen.getByTestId('v2-context-trigger').textContent).toContain('Refactory')
  })

  it('closing the flyout cancels a pending draft: reopen shows the Add row, no stale input', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId('v2-context-trigger'))
    const popover = getContextPopover()

    // Start a draft with text in it.
    fireEvent.click(screen.getByTestId('v2-popover-workspace'))
    fireEvent.click(within(popover).getByTestId('v2-popover-add-workspace'))
    fireEvent.change(within(popover).getByLabelText('New workspace name'), {
      target: { value: 'Ghost' },
    })
    expect(within(popover).getByTestId('v2-popover-add-workspace-form')).toBeInTheDocument()

    // Dismiss the flyout via the identity-row toggle — the panel stays
    // open but the flyout (and the draft with it) is gone.
    fireEvent.click(screen.getByTestId('v2-popover-workspace'))
    expect(screen.queryByTestId('v2-popover-workspace-list')).not.toBeInTheDocument()
    expect(screen.queryByTestId('v2-popover-add-workspace-form')).not.toBeInTheDocument()

    // Reopen: the Add row is back in place — no lingering draft input
    // resurrecting the stale 'Ghost' text — and nothing was appended.
    fireEvent.click(screen.getByTestId('v2-popover-workspace'))
    expect(screen.getByTestId('v2-popover-add-workspace')).toBeInTheDocument()
    expect(screen.queryByTestId('v2-popover-add-workspace-form')).not.toBeInTheDocument()
    expect(within(getFlyout()).getAllByRole('option')).toHaveLength(3)
  })
})
