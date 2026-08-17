/*
 * NewSessionPage — the default route (composer layout correction).
 *
 * Page-level composition: a full-width header (h1 "New session", subtitle,
 * right-aligned approval indicator) followed by a bounded content region
 * holding, in order: the centered mode-specific intro (decorative
 * empty-sessions image + h2 + body), the standalone right-aligned Reviews
 * waiting pill, the unified composer panel (setup pills + Session Mode +
 * nested input box), and the centered disclaimer. The previous combined
 * page-level external footer wrapper is gone; the sidebar keeps its own
 * Illustrative data marker.
 */
import { PENDING_REVIEWS } from '../data/mockData'
import Composer from '../components/composer/Composer'
import { useOverlayLifecycle } from '../components/shell/OverlayLifecycle'
import { useMockup } from '../state/MockupContext'

const ENGINEERING_INTRO_BODY =
  'Engineering sessions analyze, propose, and deliver software changes. You approve every proposal before work proceeds.'
const PLANNING_INTRO_BODY =
  'Draft a PRD, then break it into a roadmap, milestones, sprints, and tickets that drive Engineering delivery.'
const DISCLAIMER = 'Konteks can make mistakes. Verify important information.'

export default function NewSessionPage() {
  const { state, dispatch } = useMockup()
  const { beginOverlayChain } = useOverlayLifecycle()
  const engineering = state.sessionMode === 'engineering'
  const pendingCount = PENDING_REVIEWS.length

  return (
    <section className="kx-new-session" aria-label="New session">
      {/* Page header — full-width band: the single visible h1, subtitle,
          approval indicator. */}
      <header className="kx-new-session__header" data-testid="new-session-header">
        <div className="kx-new-session__header-copy">
          <h1 className="kx-new-session__title">New session</h1>
          <p className="kx-new-session__subtitle">
            Start governed work with the right mode and context.
          </p>
        </div>
        <p className="kx-new-session__approval">Human approval required for proposals</p>
      </header>

      {/* Bounded content region — everything below the header band. */}
      <div className="kx-new-session__content" data-testid="new-session-content">
        {/* Centered intro — decorative illustration + mode-specific copy. */}
        <div className="kx-new-session__intro" data-testid="new-session-intro">
          <img
            className="kx-new-session__intro-img"
            src="/assets/konteks/empty-sessions.png"
            alt=""
            aria-hidden="true"
          />
          <h2 className="kx-new-session__intro-heading">
            {engineering ? 'What would you like to build?' : 'Start planning'}
          </h2>
          <p className="kx-new-session__intro-body">
            {engineering ? ENGINEERING_INTRO_BODY : PLANNING_INTRO_BODY}
          </p>
        </div>

        {/* Standalone right-aligned Reviews waiting wrapper — immediately
            before the composer. */}
        <div className="kx-new-session__reviews" data-testid="reviews-wrapper">
          <button
            type="button"
            className="kx-composer__reviews"
            data-testid="reviews-waiting"
            onClick={(event) => {
              beginOverlayChain(event.currentTarget)
              dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'learned', tab: 'pending' } })
            }}
          >
            Reviews waiting
            <span className="kx-composer__badge">{pendingCount}</span>
          </button>
        </div>

        {/* The single unified composer container — no separate mode/setup
            regions outside it. */}
        <Composer />

        {/* Standalone centered disclaimer — after the composer. */}
        <p className="kx-new-session__disclaimer" data-testid="disclaimer">
          {DISCLAIMER}
        </p>
      </div>
    </section>
  )
}
