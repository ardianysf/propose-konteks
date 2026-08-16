/*
 * WorkspaceMenu — the workspace floating menu (Task 4, spec §6.1/AC7).
 *
 * The workspace control's chevron-right affordance completes AC7: like
 * the system control, it opens an anchored .kx-menu to the right of the
 * sidebar — no modal backdrop, no header. Scope is deliberately minimal
 * per the plan: NO workspace management. The menu shows only the
 * current workspace ('Refactory', illustrative mock data — AC46) as a
 * selected row; Escape closes through the CLOSE_OVERLAY contract (AC45).
 */
import { WORKSPACE } from '../../data/mockData'
import { useMockup } from '../../state/MockupContext'

export default function WorkspaceMenu() {
  const { dispatch } = useMockup()

  return (
    <div
      role="menu"
      aria-label="Workspace"
      className="kx-menu kx-workspace-menu"
      onKeyDown={(event) => {
        if (event.key === 'Escape') dispatch({ type: 'CLOSE_OVERLAY' })
      }}
    >
      {/* The current workspace — illustrative row, marked selected.
          Clicking keeps it current and just closes the menu. */}
      <button
        type="button"
        role="menuitem"
        className="kx-workspace-menu__item kx-workspace-menu__item--current"
        aria-current="true"
        onClick={() => dispatch({ type: 'CLOSE_OVERLAY' })}
      >
        <span className="kx-workspace-menu__item-avatar" aria-hidden="true">
          {WORKSPACE.name[0]}
        </span>
        <span className="kx-workspace-menu__item-copy">
          <span className="kx-workspace-menu__item-name">{WORKSPACE.name}</span>
          <span className="kx-workspace-menu__item-plan">{WORKSPACE.plan}</span>
        </span>
      </button>
    </div>
  )
}
