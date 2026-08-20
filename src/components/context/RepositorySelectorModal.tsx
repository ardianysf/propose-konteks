/*
 * RepositorySelectorModal — the system/repository selector modal
 * (Task 7 Part A, spec §8.1, AC25–AC28 + AC43 variants).
 *
 * A centered .kx-modal over the shared backdrop primitive. Repositories
 * group under exactly one active system: only the active group renders
 * its repositories — enabled, checkable rows plus the contextual "Add
 * repository manually" action — while every other system stays collapsed
 * to its selector row (AC25). System heads switch the active system through
 * SET_ACTIVE_SYSTEM — the reducer clears the previous selection (AC26).
 * One search input filters system names and repository names together,
 * retaining the owning system group (AC27), with "Add new system" pinned
 * at the top of the list (AC27). The footer is a single row — status
 * left, Cancel/Done right (AC28). Loading/empty variants swap the group
 * region only (AC43). The manual repository form and Create System
 * modals arrive in later Task 7 parts; this modal only dispatches their
 * overlay kinds. AppShell integration is likewise a later part.
 *
 * Nested Create System: while the repository-sourced Create System modal
 * stacks above this one, AppShell keeps this modal mounted with
 * `suspended` — the dialog stays visually rendered behind the nested
 * stack but is removed from the accessibility tree (aria-hidden), inert
 * to pointers, and its shared focus containment stands down. When the
 * nested modal returns (cancel/escape/create), containment reactivates
 * and restores focus to this dialog. Draft/search state is entirely
 * reducer-backed, so suspending never loses it.
 */
import { useId, useRef } from 'react'
import { REPOSITORIES } from '../../data/mockData'
import type { Repository, System } from '../../data/mockData'
import { useMockup } from '../../state/MockupContext'
import { resolveSessionContextDraft } from '../../state/mockupReducer'
import { useOverlayLifecycle } from '../shell/OverlayLifecycle'
import { useFocusContainment } from '../shell/useFocusContainment'

/** Plus — marks the create/add affordances (AC27/AC28). */
function PlusIcon() {
  return (
    <svg
      data-icon="plus"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 3v10M3 8h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Close — the header dismiss control. */
function CloseIcon() {
  return (
    <svg
      data-icon="close"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 4l8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** One system group surviving the shared search, with its narrowed rows. */
interface VisibleGroup {
  system: System
  repos: Repository[]
}

export interface RepositorySelectorModalProps {
  /** True while a nested overlay (the repository-sourced Create System
   *  modal) stacks above this one: keep rendering, but stand down from
   *  the accessibility tree, pointers, and focus containment until this
   *  dialog becomes the active modal again. */
  suspended?: boolean
}

export default function RepositorySelectorModal({
  suspended = false,
}: RepositorySelectorModalProps) {
  const { state, dispatch } = useMockup()
  const { dismissOverlay } = useOverlayLifecycle()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Shared focus containment replaces the component-local initial-focus
  // and Escape effects (Task 13). While suspended under the nested
  // Create System modal, containment installs nothing; reactivation
  // re-runs the effect and restores focus to this dialog.
  useFocusContainment(dialogRef, { active: !suspended })

  const close = () => dismissOverlay()

  // The modal edits only the transient draft. It reads the effective draft
  // (committed/global fallback when BEGIN has not run) and never touches
  // activeSystemId/selectedRepoIds until Done commits.
  const draft = state.sessionContextDraft ?? resolveSessionContextDraft(state)
  const activeSystem =
    state.systems.find((system) => system.id === draft.systemId) ?? state.systems[0]
  const selectedCount = draft.repoIds.length

  // One shared query filters system names and repository names together:
  // a system survives when its own name matches or any of its
  // repositories matches, and the query narrows the repositories inside
  // a surviving group (AC27).
  const query = state.search.repositories.trim().toLowerCase()
  const repoById = new Map(REPOSITORIES.map((repo) => [repo.id, repo]))
  const resolveRepos = (system: System): Repository[] =>
    system.repoIds
      .map((repoId) => repoById.get(repoId))
      .filter((repo): repo is Repository => repo !== undefined)

  const visibleGroups: VisibleGroup[] = state.systems
    .map((system) => {
      const repos = resolveRepos(system)
      if (!query) return { system, repos }
      const matching = repos.filter((repo) => repo.name.toLowerCase().includes(query))
      const nameMatches = system.name.toLowerCase().includes(query)
      if (!nameMatches && matching.length === 0) return null
      return { system, repos: nameMatches && matching.length === 0 ? repos : matching }
    })
    .filter((group): group is VisibleGroup => group !== null)

  return (
    <>
      <div
        aria-hidden="true"
        className={
          suspended ? 'kx-modal-backdrop kx-modal-backdrop--suspended' : 'kx-modal-backdrop'
        }
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={suspended ? 'true' : undefined}
        tabIndex={-1}
        className={
          suspended
            ? 'kx-modal kx-repo-modal kx-repo-modal--suspended'
            : 'kx-modal kx-repo-modal'
        }
      >
        <header className="kx-repo-modal__head">
          <div className="kx-repo-modal__head-copy">
            <h2 id={titleId} className="kx-repo-modal__title">
              Choose work repositories
            </h2>
            <p className="kx-repo-modal__subtitle">
              Search by system or repository. Scope locks when the session starts.
            </p>
          </div>
          <button
            type="button"
            className="kx-icon-btn kx-repo-modal__close"
            aria-label="Close"
            onClick={close}
          >
            <CloseIcon />
          </button>
        </header>

        <div className="kx-repo-modal__body">
          {/* One toolbar row — search (left, system + repository names,
              AC27) and "Add new system" (right, pinned at the top of the
              system list, AC27). */}
          <div className="kx-repo-modal__toolbar">
            <input
              type="search"
              className="kx-input kx-repo-modal__search"
              aria-label="Search systems or repositories"
              placeholder="Search systems or repositories"
              value={state.search.repositories}
              onChange={(event) =>
                dispatch({ type: 'SET_SEARCH', list: 'repositories', value: event.target.value })
              }
            />
            <button
              type="button"
              className="kx-btn kx-btn--primary kx-repo-modal__add-system"
              onClick={() =>
                dispatch({
                  type: 'OPEN_OVERLAY',
                  overlay: { kind: 'create-system-modal', source: 'repository-modal' },
                })
              }
            >
              <PlusIcon />
              <span className="kx-repo-modal__add-system-label">Add new system</span>
            </button>
          </div>

          {/* The only scrolling region — groups or designed states (AC43). */}
          <div className="kx-repo-modal__groups">
            {state.demoVariant === 'loading' ? (
              <div
                className="kx-repo-modal__loading"
                role="status"
                aria-label="Loading systems and repositories"
              >
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="kx-repo-modal__skeleton" aria-hidden="true" />
                ))}
              </div>
            ) : state.demoVariant === 'empty' ? (
              <div className="kx-repo-modal__empty">
                <p className="kx-repo-modal__empty-title">No systems yet</p>
                <p className="kx-repo-modal__empty-hint">
                  Create a system to group repositories and components for your sessions.
                </p>
              </div>
            ) : visibleGroups.length === 0 ? (
              <div className="kx-repo-modal__empty">
                <p className="kx-repo-modal__empty-title">No matches</p>
                <p className="kx-repo-modal__empty-hint">
                  No systems or repositories match your search.
                </p>
              </div>
            ) : (
              visibleGroups.map(({ system, repos }) => {
                const active = system.id === activeSystem.id
                const count = system.repoIds.length
                return (
                  <section
                    key={system.id}
                    aria-label={system.name}
                    className={
                      active
                        ? 'kx-repo-modal__system kx-repo-modal__system--active'
                        : 'kx-repo-modal__system'
                    }
                  >
                    <button
                      type="button"
                      className="kx-repo-modal__system-head"
                      aria-current={active ? 'true' : undefined}
                      onClick={() =>
                        dispatch({ type: 'SET_SESSION_DRAFT_SYSTEM', systemId: system.id })
                      }
                    >
                      <span className="kx-repo-modal__system-radio" aria-hidden="true" />
                      <span className="kx-repo-modal__system-copy">
                        <span className="kx-repo-modal__system-name">{system.name}</span>
                        {system.description && (
                          <span className="kx-repo-modal__system-desc">
                            {system.description}
                          </span>
                        )}
                      </span>
                      <span className="kx-repo-modal__system-count">
                        {count} {count === 1 ? 'repository' : 'repositories'}
                      </span>
                    </button>

                    {/* Repository rows render only for the active system;
                        inactive systems stay collapsed to their selector
                        row — selecting one reveals its (query-filtered)
                        repos. */}
                    {active && (
                      <div className="kx-repo-modal__repos">
                        {repos.map((repo) => (
                          <label key={repo.id} className="kx-repo-modal__repo">
                            <input
                              type="checkbox"
                              className="kx-repo-modal__repo-check"
                              aria-label={repo.name}
                              checked={draft.repoIds.includes(repo.id)}
                              onChange={() =>
                                dispatch({ type: 'TOGGLE_SESSION_DRAFT_REPO', repoId: repo.id })
                              }
                            />
                            <span className="kx-repo-modal__repo-copy">
                              <span className="kx-repo-modal__repo-name">{repo.name}</span>
                              <span className="kx-repo-modal__repo-meta">
                                Updated {repo.updatedAt}
                              </span>
                            </span>
                            <span className="kx-repo-modal__repo-vcs">{repo.vcs}</span>
                          </label>
                        ))}

                        {/* Contextual manual add — inside the expanded
                            active system group (AC28); the form modal
                            itself is a later Task 7 part. */}
                        <button
                          type="button"
                          className="kx-repo-modal__add-repo"
                          onClick={() =>
                            dispatch({
                              type: 'OPEN_OVERLAY',
                              overlay: { kind: 'manual-repo-modal' },
                            })
                          }
                        >
                          <PlusIcon />
                          <span className="kx-repo-modal__add-repo-label">
                            Add repository manually
                          </span>
                        </button>
                      </div>
                    )}
                  </section>
                )
              })
            )}
          </div>
        </div>

        {/* Single-row footer — status left, actions right (AC28). */}
        <footer className="kx-repo-modal__footer">
          <p className="kx-repo-modal__status">
            <span className="kx-repo-modal__status-system">{activeSystem.name}</span>
            <span className="kx-repo-modal__status-divider" aria-hidden="true">
              ·
            </span>
            <span className="kx-repo-modal__status-count">
              {selectedCount} {selectedCount === 1 ? 'repository' : 'repositories'} selected
            </span>
          </p>
          <div className="kx-repo-modal__actions">
            <button
              type="button"
              className="kx-btn kx-btn--ghost kx-repo-modal__cancel"
              onClick={close}
            >
              Cancel
            </button>
            <button
              type="button"
              className="kx-btn kx-btn--primary kx-repo-modal__done"
              onClick={() => {
                dispatch({ type: 'COMMIT_SESSION_CONTEXT_DRAFT' })
                dismissOverlay()
              }}
            >
              Done
            </button>
          </div>
        </footer>
      </div>
    </>
  )
}
