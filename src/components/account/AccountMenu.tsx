/*
 * AccountMenu — the account floating menu (Task 12, spec §14, AC42).
 *
 * An anchored .kx-menu that opens from the sidebar user row (the user
 * name/avatar trigger), right of the sidebar near its bottom edge. It
 * lists exactly mockData.ACCOUNT_ACTIONS in data order — no renames,
 * reorders, removals, or additions versus the data file (AC42) — with
 * proper menu semantics (role=menu / role=menuitem, roving focus via
 * arrow keys). "Settings" opens the Settings modal on General and
 * "Billing" opens it directly on Billing; the remaining illustrative
 * actions (Integrations, Keyboard shortcuts, Log out) stay represented
 * but simply close the menu without inventing new IA. Escape closes the
 * menu from any focused descendant (AC45).
 */
import { useEffect, useRef } from 'react'
import { ACCOUNT_ACTIONS, type AccountAction } from '../../data/mockData'
import { useMockup } from '../../state/MockupContext'
import { focusAccountTrigger } from './accountFocus'

export default function AccountMenu() {
  const { dispatch } = useMockup()
  const menuRef = useRef<HTMLDivElement>(null)

  // Move focus into the menu on open (§16 keyboard contract).
  useEffect(() => {
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
  }, [])

  // Escape closes from any focused descendant (AC45) and returns focus to
  // the sidebar account trigger. A single document listener (no container
  // onKeyDown duplication) avoids double dispatch.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        focusAccountTrigger()
        dispatch({ type: 'CLOSE_OVERLAY' })
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [dispatch])

  const handleAction = (action: AccountAction) => {
    if (action.id === 'account-settings') {
      dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'settings', section: 'general' } })
      return
    }
    if (action.id === 'account-billing') {
      dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'settings', section: 'billing' } })
      return
    }
    // Illustrative actions stay represented but safely close — no new IA.
    dispatch({ type: 'CLOSE_OVERLAY' })
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Account"
      data-testid="account-menu"
      className="kx-menu kx-account-menu"
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          const items = Array.from(
            menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
          )
          if (items.length === 0) return
          const index = items.indexOf(document.activeElement as HTMLButtonElement)
          const delta = event.key === 'ArrowDown' ? 1 : -1
          const next = items[(index + delta + items.length) % items.length]
          next.focus()
        }
      }}
    >
      {ACCOUNT_ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          role="menuitem"
          className="kx-account-menu__item"
          onClick={() => handleAction(action)}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
