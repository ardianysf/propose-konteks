/*
 * V2AddWorkspace tests — the context popover's add-workspace flow.
 *
 * Renders the real V2App exactly like V2Shell.test.tsx, covering the
 * footer affordance next to "Create new system": the inline draft input,
 * Enter/check confirmation (workspace appended to the flyout listbox AND
 * made active so the sidebar identity card follows), the blank-name
 * 'New Workspace' fallback, and Escape/X cancellation which appends
 * nothing. A freshly created workspace has zero systems — the systems
 * list scopes to it gracefully (no crash) and the identity card falls
 * to its 'No systems yet' placeholder instead of an out-of-scope
 * system pairing.
 *
 * No matchMedia stub needed here (unlike V2Shell.test.tsx): this file
 * never touches theme resolution and V2Sidebar's forced-rail listener
 * guards against a missing window.matchMedia.
 */
import { fireEvent, render, screen, within } from '@testing-library/react'
import V2App from './V2App'

const getContextPopover = () => screen.getByRole('dialog', { name: 'Workspace and systems' })

describe('V2ContextPopover add workspace', () => {
  it('adds a workspace from the footer affordance: type a name, Enter confirms, appended + selected', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId('v2-context-trigger'))
    const popover = getContextPopover()

    // The affordance sits in the footer right beside Create new system.
    expect(within(popover).getByText('Create new system')).toBeInTheDocument()
    fireEvent.click(within(popover).getByTestId('v2-popover-add-workspace'))

    // Inline draft input with confirm/cancel controls; focus lands in it.
    const form = within(popover).getByTestId('v2-popover-add-workspace-form')
    const input = within(form).getByLabelText('New workspace name')
    expect(input).toHaveFocus()
    expect(within(form).getByTestId('v2-popover-add-workspace-confirm')).toBeInTheDocument()
    expect(within(form).getByTestId('v2-popover-add-workspace-cancel')).toBeInTheDocument()

    // Type a name and confirm with Enter — the panel stays open.
    fireEvent.change(input, { target: { value: 'Acme Crew' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.queryByTestId('v2-popover-add-workspace-form')).not.toBeInTheDocument()
    expect(getContextPopover()).toBeInTheDocument()

    // Appended: the flyout listbox now counts four options, the new one
    // carries its slug id and the selected mark.
    fireEvent.click(screen.getByTestId('v2-popover-workspace'))
    const list = screen.getByTestId('v2-popover-workspace-list')
    const options = within(list).getAllByRole('option')
    expect(options).toHaveLength(4)
    const added = within(list).getByTestId('v2-popover-workspace-ws-acme-crew')
    expect(added).toHaveTextContent('Acme Crew')
    expect(within(list).getByRole('option', { name: /Acme Crew/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )

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

    fireEvent.click(within(popover).getByTestId('v2-popover-add-workspace'))
    fireEvent.change(within(popover).getByLabelText('New workspace name'), {
      target: { value: '   ' },
    })
    fireEvent.click(within(popover).getByTestId('v2-popover-add-workspace-confirm'))

    fireEvent.click(screen.getByTestId('v2-popover-workspace'))
    const list = screen.getByTestId('v2-popover-workspace-list')
    expect(within(list).getAllByRole('option')).toHaveLength(4)
    const added = within(list).getByRole('option', { name: /New Workspace/ })
    expect(added).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('v2-context-trigger').textContent).toContain('New Workspace')
  })

  it('Escape and the X control cancel the draft without appending a workspace', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId('v2-context-trigger'))
    const popover = getContextPopover()

    // Escape cancels the draft — the panel itself stays open.
    fireEvent.click(within(popover).getByTestId('v2-popover-add-workspace'))
    fireEvent.change(within(popover).getByLabelText('New workspace name'), {
      target: { value: 'Ghost' },
    })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('v2-popover-add-workspace-form')).not.toBeInTheDocument()
    expect(getContextPopover()).toBeInTheDocument()

    // The X control cancels too.
    fireEvent.click(within(popover).getByTestId('v2-popover-add-workspace'))
    fireEvent.change(within(popover).getByLabelText('New workspace name'), {
      target: { value: 'Ghost' },
    })
    fireEvent.click(within(popover).getByTestId('v2-popover-add-workspace-cancel'))
    expect(screen.queryByTestId('v2-popover-add-workspace-form')).not.toBeInTheDocument()

    // Nothing was appended either time: still the three seeded workspaces.
    fireEvent.click(screen.getByTestId('v2-popover-workspace'))
    expect(
      within(screen.getByTestId('v2-popover-workspace-list')).getAllByRole('option'),
    ).toHaveLength(3)
    expect(screen.getByTestId('v2-context-trigger').textContent).toContain('Refactory')
  })
})
