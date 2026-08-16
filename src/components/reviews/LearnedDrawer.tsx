/*
 * LearnedDrawer — the Konteks Learned right drawer (Task 10, spec §12,
 * AC20/AC39/AC43).
 *
 * Frame contract: one modal backdrop + one fixed right drawer whose width
 * is pinned through the --kx-drawer-w token (450px) on every tab — the
 * frame never resizes and never remounts when tabs switch (AC39). The
 * fixed header (title + close) and the role=tablist nav sit outside the
 * sole .kx-learned__content scroll region, so only tab content ever
 * scrolls. Two tabs exactly — Pending (the default/primary tab, AC20)
 * and Audit History — with the selected tab read from overlay.tab and
 * tab buttons dispatching OPEN_OVERLAY learned with the chosen tab, in
 * place. Pending renders the actionable waiting-review list from
 * PENDING_REVIEWS (title, system, summary, time, plus local-only
 * Approve/Reject decisions); Audit History renders AUDIT_HISTORY as a
 * flat timeline — a border-left spine with dot markers, no boxed cards
 * (AC39). Demo variants swap the panel region only: skeleton rows
 * while loading, designed empty states when empty (AC43).
 */
import { useEffect, useId, useRef, useState } from 'react'
import { useMockup } from '../../state/MockupContext'
import { DEFAULT_LEARNED_TAB, type LearnedTab } from '../../state/mockupReducer'
import { AUDIT_HISTORY, PENDING_REVIEWS, SYSTEMS } from '../../data/mockData'

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

/** The two §12 tabs — Pending is the default/primary tab (order is part
 * of the contract). */
const TABS: ReadonlyArray<{ id: LearnedTab; label: string }> = [
  { id: 'pending', label: 'Pending' },
  { id: 'audit', label: 'Audit History' },
]

/** Pending — the actionable waiting-review list (AC20/AC39). */
function PendingPanel() {
  const { state } = useMockup()
  const [decidedIds, setDecidedIds] = useState<string[]>([])
  const systemNameById = new Map(SYSTEMS.map((system) => [system.id, system.name]))
  const visible = PENDING_REVIEWS.filter((review) => !decidedIds.includes(review.id))

  if (state.demoVariant === 'loading') {
    return (
      <div className="kx-learned__loading" role="status" aria-label="Loading pending reviews">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="kx-learned__skeleton" aria-hidden="true" />
        ))}
      </div>
    )
  }

  if (state.demoVariant === 'empty' || visible.length === 0) {
    return (
      <div className="kx-learned__empty">
        <h3 className="kx-learned__empty-title">No pending reviews</h3>
        <p className="kx-learned__empty-hint">
          You are all caught up. Approvals and rejections will land in Audit History.
        </p>
      </div>
    )
  }

  const decide = (id: string) => setDecidedIds((previous) => [...previous, id])

  return (
    <ul className="kx-learned__list" aria-label="Pending reviews">
      {visible.map((review) => (
        <li key={review.id} className="kx-learned-item">
          <div className="kx-learned-item__copy">
            <h3 className="kx-learned-item__title">{review.title}</h3>
            <p className="kx-learned-item__meta">
              {systemNameById.get(review.systemId) ?? review.systemId} · {review.time}
            </p>
            <p className="kx-learned-item__summary">{review.summary}</p>
          </div>
          <div className="kx-learned-item__actions">
            <button
              type="button"
              className="kx-btn kx-btn--primary kx-learned-item__decide"
              aria-label={`Approve ${review.title}`}
              onClick={() => decide(review.id)}
            >
              Approve
            </button>
            <button
              type="button"
              className="kx-btn kx-btn--ghost kx-learned-item__decide"
              aria-label={`Reject ${review.title}`}
              onClick={() => decide(review.id)}
            >
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Audit History — the flat timeline (AC39): a border-left spine with
 * dot markers, one unboxed entry per event. */
function AuditPanel() {
  const { state } = useMockup()

  if (state.demoVariant === 'loading') {
    return (
      <div className="kx-learned__loading" role="status" aria-label="Loading audit history">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="kx-learned__skeleton" aria-hidden="true" />
        ))}
      </div>
    )
  }

  if (state.demoVariant === 'empty') {
    return (
      <div className="kx-learned__empty">
        <h3 className="kx-learned__empty-title">No audit events yet</h3>
        <p className="kx-learned__empty-hint">
          Review decisions and system events will appear here.
        </p>
      </div>
    )
  }

  return (
    <ol className="kx-learned-timeline" aria-label="Audit history">
      {AUDIT_HISTORY.map((event) => (
        <li key={event.id} className="kx-learned-timeline__item">
          <p className="kx-learned-timeline__meta">
            {event.time} · {event.actor}
          </p>
          <p className="kx-learned-timeline__action">{event.action}</p>
        </li>
      ))}
    </ol>
  )
}

export default function LearnedDrawer() {
  const { state, dispatch } = useMockup()
  const titleId = useId()
  const drawerRef = useRef<HTMLDivElement>(null)

  // The selected tab comes from the overlay payload; the default only
  // guards a defensive render outside the learned overlay.
  const overlay = state.overlay
  const tab: LearnedTab = overlay.kind === 'learned' ? overlay.tab : DEFAULT_LEARNED_TAB

  // Focus moves to the drawer on mount (§16 keyboard contract).
  useEffect(() => {
    drawerRef.current?.focus()
  }, [])

  // Escape closes — local listener now; the shared overlay helpers
  // (focus return, single source) land with Task 13 (AC45).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch({ type: 'CLOSE_OVERLAY' })
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [dispatch])

  const close = () => dispatch({ type: 'CLOSE_OVERLAY' })

  const tabButtonId = (id: LearnedTab) => `kx-learned-tab-${id}`
  const panelId = 'kx-learned-panel'

  return (
    <>
      <div className="kx-modal-backdrop" aria-hidden="true" />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid="learned-drawer"
        className="kx-drawer kx-learned"
      >
        {/* Fixed header — title + dismiss control, outside the scroll region. */}
        <header className="kx-learned__head">
          <h2 id={titleId} className="kx-learned__title">
            Konteks Learned
          </h2>
          <button
            type="button"
            className="kx-icon-btn kx-learned__close"
            aria-label="Close"
            onClick={close}
          >
            <CloseIcon />
          </button>
        </header>

        {/* Fixed tab nav — Pending then Audit History; switching happens
            in place through OPEN_OVERLAY learned + tab (the overlay kind
            never leaves 'learned', so the frame never remounts, AC39). */}
        <div role="tablist" aria-label="Konteks Learned tabs" className="kx-learned__nav">
          {TABS.map((entry) => {
            const selected = entry.id === tab
            return (
              <button
                key={entry.id}
                type="button"
                role="tab"
                id={tabButtonId(entry.id)}
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                className={
                  selected ? 'kx-learned__tab kx-learned__tab--active' : 'kx-learned__tab'
                }
                onClick={() =>
                  dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'learned', tab: entry.id } })
                }
              >
                {entry.label}
              </button>
            )
          })}
        </div>

        {/* The sole scrolling region — only this area scrolls. */}
        <div className="kx-learned__content">
          <div
            role="tabpanel"
            id={panelId}
            aria-labelledby={tabButtonId(tab)}
            className="kx-learned__panel"
          >
            {tab === 'pending' ? <PendingPanel /> : <AuditPanel />}
          </div>
        </div>
      </aside>
    </>
  )
}
