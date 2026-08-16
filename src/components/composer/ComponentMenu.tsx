/*
 * ComponentMenu — the Component anchored floating menu (Task 8,
 * spec §7.4, AC30–AC32 + AC43 variants).
 *
 * An anchored .kx-menu that floats from the setup row's Component
 * trigger, aligned under its left edge: no modal, no backdrop, no
 * header (AC30). The list is flat — every row shows the component name
 * with its repository underneath on the same row and no component-type
 * chip or group header (AC31). One labeled search filters component
 * names OR repository names through the store's components search slot
 * (AC31). Selection is a true multi-select: checkbox rows toggle
 * TOGGLE_COMPONENT, and a single-row footer carries the selection count
 * plus a Clear action dispatching CLEAR_COMPONENTS (AC32). Demo variants
 * swap the list region only — skeletons while loading, designed empty
 * states for an empty workspace and for no search matches (AC43).
 * Escape closes through the shared OverlayLifecycle listener (AC45).
 */
import { COMPONENTS, REPOSITORIES } from '../../data/mockData'
import type { ComponentEntry } from '../../data/mockData'
import { useMockup } from '../../state/MockupContext'

export default function ComponentMenu() {
  const { state, dispatch } = useMockup()

  // One query matches the component's own name OR its repository's
  // name — a system-scoped "what was that module in…" lookup (AC31).
  const repoById = new Map(REPOSITORIES.map((repo) => [repo.id, repo]))
  const query = state.search.components.trim().toLowerCase()
  const visible: ComponentEntry[] = query
    ? COMPONENTS.filter((component) => {
        const repo = repoById.get(component.repoId)
        return (
          component.name.toLowerCase().includes(query) ||
          (repo?.name.toLowerCase().includes(query) ?? false)
        )
      })
    : COMPONENTS

  const selectedCount = state.selectedComponentIds.length

  return (
    <div
      role="menu"
      aria-label="Components"
      data-testid="component-menu"
      className="kx-menu kx-component-menu"
    >
      {/* The single search input — component OR repository names (AC31). */}
      <div className="kx-component-menu__search">
        <input
          type="search"
          className="kx-input kx-component-menu__search-input"
          aria-label="Search components or repositories"
          placeholder="Search components or repositories"
          value={state.search.components}
          onChange={(event) =>
            dispatch({ type: 'SET_SEARCH', list: 'components', value: event.target.value })
          }
        />
      </div>

      {/* The only scrolling region — rows or designed states (AC43). */}
      <div className="kx-component-menu__list">
        {state.demoVariant === 'loading' ? (
          <div
            className="kx-component-menu__loading"
            role="status"
            aria-label="Loading components"
          >
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="kx-component-menu__skeleton" aria-hidden="true" />
            ))}
          </div>
        ) : state.demoVariant === 'empty' ? (
          <div className="kx-component-menu__empty">
            <p className="kx-component-menu__empty-title">No components yet</p>
            <p className="kx-component-menu__empty-hint">
              Components appear once repositories are connected to a system.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="kx-component-menu__empty">
            <p className="kx-component-menu__empty-title">No matches</p>
            <p className="kx-component-menu__empty-hint">
              No components or repositories match your search.
            </p>
          </div>
        ) : (
          visible.map((component) => {
            const checked = state.selectedComponentIds.includes(component.id)
            const repo = repoById.get(component.repoId)
            const repoName = repo?.name ?? component.repoId
            return (
              <label
                key={component.id}
                className={
                  checked
                    ? 'kx-component-menu__row kx-component-menu__row--selected'
                    : 'kx-component-menu__row'
                }
              >
                <input
                  type="checkbox"
                  className="kx-component-menu__check"
                  role="menuitemcheckbox"
                  aria-label={`${component.name} (${repoName})`}
                  aria-checked={checked}
                  checked={checked}
                  onChange={() =>
                    dispatch({ type: 'TOGGLE_COMPONENT', componentId: component.id })
                  }
                />
                <span className="kx-component-menu__row-copy">
                  <span className="kx-component-menu__row-name">{component.name}</span>
                  <span className="kx-component-menu__row-repo">{repoName}</span>
                </span>
              </label>
            )
          })
        )}
      </div>

      {/* Single-row footer — selection count left, Clear right (AC32). */}
      <div className="kx-component-menu__footer">
        <p className="kx-component-menu__count">{selectedCount} selected</p>
        <button
          type="button"
          role="menuitem"
          className="kx-component-menu__clear"
          disabled={selectedCount === 0}
          onClick={() => dispatch({ type: 'CLEAR_COMPONENTS' })}
        >
          Clear
        </button>
      </div>
    </div>
  )
}
