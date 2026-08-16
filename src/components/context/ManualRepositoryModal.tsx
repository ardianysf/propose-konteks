/*
 * ManualRepositoryModal — the "Add repository manually" form
 * (Task 7 Part B, spec §8.2, AC29 + AC43 variants).
 *
 * A centered .kx-modal over the shared backdrop primitive. The form owns
 * four required pieces: a VCS Connector select, an Execution select, and
 * at least one repository supplied either through the searchable
 * active-system picker (result count + Previous/Next pagination, local
 * component state) or through the "Enter URL manually" escape hatch that
 * swaps the picker for an http(s) URL input. Selected repositories
 * accumulate as removable chips, with "Add another repository" queueing
 * the next selection. "Require private network" is an optional toggle.
 * Connect stays disabled while required fields are missing or invalid
 * (AC29/AC43); when valid it commits only newly selected known repos
 * through TOGGLE_REPO and closes — URL entries are local mockup state,
 * never a network call. Loading/empty variants swap the picker region
 * only (AC43). AppShell integration is a later Task 7 part.
 */
import { useId, useRef, useState } from 'react'
import { EXECUTION_PROFILES, REPOSITORIES, VCS_CONNECTORS } from '../../data/mockData'
import { useMockup } from '../../state/MockupContext'
import { useOverlayLifecycle } from '../shell/OverlayLifecycle'
import { useFocusContainment } from '../shell/useFocusContainment'

/** Results per picker page — keeps pagination observable in the mockup. */
const PAGE_SIZE = 2

/** True when `value` parses as a full http(s) URL (spec §8.2 escape hatch). */
function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** Plus — marks the add-another affordance (AC29). */
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

/** Close — the header dismiss control and the chip removal control. */
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

/** Link — marks the "Enter URL manually" escape hatch (AC29). */
function LinkIcon() {
  return (
    <svg
      data-icon="link"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6.5 9.5l3-3M5 11l-1 1a2.1 2.1 0 0 1-3-3l2-2a2.1 2.1 0 0 1 3 0M11 5l1-1a2.1 2.1 0 0 1 3 3l-2 2a2.1 2.1 0 0 1-3 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function ManualRepositoryModal() {
  const { state, dispatch } = useMockup()
  const { dismissOverlay } = useOverlayLifecycle()
  const titleId = useId()
  const connectorId = useId()
  const executionSelectId = useId()
  const searchId = useId()
  const urlInputId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const urlRef = useRef<HTMLInputElement>(null)

  // Form state — connector/execution selects, picker query + page, the
  // URL escape hatch, the accumulated chip selection, and the optional
  // private-network requirement. All local: Connect is the only commit.
  const [connector, setConnector] = useState('')
  const [execution, setExecution] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [urlMode, setUrlMode] = useState(false)
  const [url, setUrl] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [privateNetwork, setPrivateNetwork] = useState(false)

  // Shared focus containment owns initial focus, Tab trapping, and the
  // focusin safety net (Task 13); Escape is owned by OverlayLifecycle.
  useFocusContainment(dialogRef)

  const close = () => dismissOverlay()

  // The picker is scoped to the one active system (AC29): only its
  // repositories are searchable, and only they can commit on Connect.
  const activeSystem =
    state.systems.find((system) => system.id === state.activeSystemId) ?? state.systems[0]
  const activeRepos = REPOSITORIES.filter((repo) => repo.systemId === activeSystem.id)

  const normalizedQuery = query.trim().toLowerCase()
  const matching = normalizedQuery
    ? activeRepos.filter((repo) => repo.name.toLowerCase().includes(normalizedQuery))
    : activeRepos
  const pageCount = Math.max(1, Math.ceil(matching.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageResults = matching.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  const trimmedUrl = url.trim()
  const urlValid = isHttpUrl(trimmedUrl)
  const pendingUrlInvalid = urlMode && trimmedUrl !== '' && !urlValid

  // Connect requires the connector, the execution, and at least one
  // repository chip — and never with an invalid URL left pending
  // (AC29/AC43 disabled validation).
  const canConnect =
    connector !== '' && execution !== '' && selected.length > 0 && !pendingUrlInvalid

  const addRepo = (repoId: string) => {
    if (selected.includes(repoId)) return
    setSelected((current) => [...current, repoId])
  }

  const addUrl = () => {
    if (!urlValid) return
    setSelected((current) => (current.includes(trimmedUrl) ? current : [...current, trimmedUrl]))
    setUrl('')
  }

  const removeChip = (name: string) => {
    setSelected((current) => current.filter((entry) => entry !== name))
  }

  // "Add another repository" queues the next selection by focusing the
  // active entry control (picker search or URL input) (AC29).
  const addAnother = () => {
    if (urlMode) {
      urlRef.current?.focus()
      return
    }
    setQuery('')
    setPage(0)
    searchRef.current?.focus()
  }

  // Connect commits only newly selected known repos — chips already in
  // the store would toggle off, and URL entries have no repo record, so
  // both are skipped; the modal then closes. No network is involved.
  const connect = () => {
    for (const entry of selected) {
      const known = activeRepos.some((repo) => repo.id === entry)
      if (known && !state.selectedRepoIds.includes(entry)) {
        dispatch({ type: 'TOGGLE_REPO', repoId: entry })
      }
    }
    dismissOverlay()
  }

  const countLabel = `${matching.length} ${matching.length === 1 ? 'result' : 'results'}`

  return (
    <>
      <div className="kx-modal-backdrop" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="kx-modal kx-manual-modal"
      >
        <header className="kx-manual-modal__head">
          <div className="kx-manual-modal__head-copy">
            <h2 id={titleId} className="kx-manual-modal__title">
              Add repository manually
            </h2>
            <p className="kx-manual-modal__subtitle">
              Connect a repository the picker cannot find, from {activeSystem.name}.
            </p>
          </div>
          <button
            type="button"
            className="kx-icon-btn kx-manual-modal__close"
            aria-label="Close"
            onClick={close}
          >
            <CloseIcon />
          </button>
        </header>

        {/* The only scrolling region — fields, picker, chips, options. */}
        <div className="kx-manual-modal__body">
          {/* VCS Connector — required labeled select (AC29). */}
          <div className="kx-manual-modal__field">
            <label className="kx-manual-modal__label" htmlFor={connectorId}>
              VCS Connector
            </label>
            <select
              id={connectorId}
              className="kx-input kx-manual-modal__select"
              required
              value={connector}
              onChange={(event) => setConnector(event.target.value)}
            >
              <option value="">Select a VCS connector</option>
              {VCS_CONNECTORS.map((each) => (
                <option key={each.id} value={each.id}>
                  {each.name}
                </option>
              ))}
            </select>
            {connector && (
              <p className="kx-manual-modal__field-hint">
                {VCS_CONNECTORS.find((each) => each.id === connector)?.hint}
              </p>
            )}
          </div>

          {/* Repository — searchable picker or manual URL (AC29). */}
          {urlMode ? (
            <div className="kx-manual-modal__field">
              <label className="kx-manual-modal__label" htmlFor={urlInputId}>
                Repository URL
              </label>
              <div className="kx-manual-modal__url-row">
                <input
                  ref={urlRef}
                  id={urlInputId}
                  type="url"
                  className="kx-input kx-manual-modal__url"
                  placeholder="https://github.com/organization/repository"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                />
                <button
                  type="button"
                  className="kx-btn kx-btn--primary kx-manual-modal__add-url"
                  disabled={!urlValid}
                  onClick={addUrl}
                >
                  Add URL
                </button>
              </div>
              {pendingUrlInvalid && (
                <p className="kx-manual-modal__field-error" role="alert">
                  Enter a full http(s) repository URL.
                </p>
              )}
              <button
                type="button"
                className="kx-manual-modal__swap"
                onClick={() => setUrlMode(false)}
              >
                Search repositories instead
              </button>
            </div>
          ) : (
            <div className="kx-manual-modal__field">
              <div className="kx-manual-modal__picker-head">
                <span className="kx-manual-modal__label">Searchable Repository</span>
                <button
                  type="button"
                  className="kx-manual-modal__swap"
                  onClick={() => setUrlMode(true)}
                >
                  <LinkIcon />
                  Enter URL manually
                </button>
              </div>
              <input
                ref={searchRef}
                id={searchId}
                type="search"
                className="kx-input kx-manual-modal__search"
                aria-label="Search repositories"
                placeholder="Search repositories"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(0)
                }}
              />

              {/* Picker region — results or designed states (AC43). */}
              {state.demoVariant === 'loading' ? (
                <div
                  className="kx-manual-modal__loading"
                  role="status"
                  aria-label="Loading repositories"
                >
                  {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="kx-manual-modal__skeleton" aria-hidden="true" />
                  ))}
                </div>
              ) : state.demoVariant === 'empty' ? (
                <div className="kx-manual-modal__empty">
                  <p className="kx-manual-modal__empty-title">No repositories yet</p>
                  <p className="kx-manual-modal__empty-hint">
                    This system has no connected repositories — enter a repository URL manually
                    to add the first one.
                  </p>
                </div>
              ) : matching.length === 0 ? (
                <div className="kx-manual-modal__empty">
                  <p className="kx-manual-modal__empty-title">No matching repositories</p>
                  <p className="kx-manual-modal__empty-hint">
                    No repositories in {activeSystem.name} match &quot;{query.trim()}&quot; — try
                    another search or enter the URL manually.
                  </p>
                </div>
              ) : (
                <>
                  <ul className="kx-manual-modal__results">
                    {pageResults.map((repo) => {
                      const added = selected.includes(repo.id)
                      const inStore = state.selectedRepoIds.includes(repo.id)
                      return (
                        <li key={repo.id}>
                          <button
                            type="button"
                            className={
                              added
                                ? 'kx-manual-modal__result kx-manual-modal__result--added'
                                : 'kx-manual-modal__result'
                            }
                            disabled={added}
                            onClick={() => addRepo(repo.id)}
                          >
                            <span className="kx-manual-modal__result-copy">
                              <span className="kx-manual-modal__result-name">{repo.name}</span>
                              <span className="kx-manual-modal__result-meta">
                                Updated {repo.updatedAt} · {repo.vcs}
                              </span>
                            </span>
                            {added ? (
                              <span className="kx-manual-modal__result-flag">Added</span>
                            ) : inStore ? (
                              <span className="kx-manual-modal__result-flag">Selected</span>
                            ) : null}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="kx-manual-modal__picker-foot">
                    <p className="kx-manual-modal__count">{countLabel}</p>
                    <div className="kx-manual-modal__pager">
                      <span className="kx-manual-modal__page-indicator">
                        Page {safePage + 1} of {pageCount}
                      </span>
                      <button
                        type="button"
                        className="kx-btn kx-btn--ghost kx-manual-modal__page-btn"
                        disabled={safePage === 0}
                        onClick={() => setPage(safePage - 1)}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        className="kx-btn kx-btn--ghost kx-manual-modal__page-btn"
                        disabled={safePage >= pageCount - 1}
                        onClick={() => setPage(safePage + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Selected repositories — removable chips + queue another (AC29). */}
          {selected.length > 0 && (
            <div className="kx-manual-modal__selection">
              <p className="kx-manual-modal__selection-label">Selected repositories</p>
              <ul className="kx-manual-modal__chips">
                {selected.map((entry) => (
                  <li key={entry} className="kx-chip kx-manual-modal__chip">
                    <span className="kx-manual-modal__chip-name">{entry}</span>
                    <button
                      type="button"
                      className="kx-manual-modal__chip-remove"
                      aria-label={`Remove ${entry}`}
                      onClick={() => removeChip(entry)}
                    >
                      <CloseIcon />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="kx-manual-modal__add-another"
                onClick={addAnother}
              >
                <PlusIcon />
                Add another repository
              </button>
            </div>
          )}

          {/* Execution — required labeled select (AC29). */}
          <div className="kx-manual-modal__field">
            <label className="kx-manual-modal__label" htmlFor={executionSelectId}>
              Execution
            </label>
            <select
              id={executionSelectId}
              className="kx-input kx-manual-modal__select"
              required
              value={execution}
              onChange={(event) => setExecution(event.target.value)}
            >
              <option value="">Select an execution profile</option>
              {EXECUTION_PROFILES.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          {/* Require private network — optional toggle (AC29). */}
          <label className="kx-manual-modal__network">
            <input
              type="checkbox"
              className="kx-manual-modal__network-check"
              aria-label="Require private network"
              checked={privateNetwork}
              onChange={(event) => setPrivateNetwork(event.target.checked)}
            />
            <span className="kx-manual-modal__network-copy">
              <span className="kx-manual-modal__network-label">Require private network</span>
              <span className="kx-manual-modal__network-hint">
                Route this repository&apos;s execution through the workspace private network.
              </span>
            </span>
          </label>
        </div>

        {/* Single-row footer — note left, Cancel/Connect right (AC29). */}
        <footer className="kx-manual-modal__footer">
          <p className="kx-manual-modal__footer-note">
            Connect adds new repositories to {activeSystem.name}.
          </p>
          <div className="kx-manual-modal__actions">
            <button
              type="button"
              className="kx-btn kx-btn--ghost kx-manual-modal__cancel"
              onClick={close}
            >
              Cancel
            </button>
            <button
              type="button"
              className="kx-btn kx-btn--primary kx-manual-modal__connect"
              disabled={!canConnect}
              onClick={connect}
            >
              Connect
            </button>
          </div>
        </footer>
      </div>
    </>
  )
}
