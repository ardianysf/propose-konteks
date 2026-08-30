/*
 * NewSessionPage — the default route (composer layout correction).
 *
 * Page-level composition: a full-width header (h1 "New session", subtitle,
 * right-aligned approval indicator) followed by a bounded content region
 * holding, in order: the centered mode-specific intro (decorative
 * empty-sessions image + h2 + body), the standalone right-aligned Reviews
 * waiting pill, the unified composer panel (setup pills + Session Mode +
 * nested input box), and the centered disclaimer. No `Illustrative data`
 * marker renders here or in the sidebar — Session History and the
 * Settings notices carry the visible AC46 coverage.
 */
import { PENDING_REVIEWS } from '../data/mockData'
import Composer from '../components/composer/Composer'
import { useOverlayLifecycle } from '../components/shell/OverlayLifecycle'
import { useMockup } from '../state/MockupContext'
import './NewSessionPage.css'

const ENGINEERING_INTRO_BODY =
  'Engineering sessions analyze, propose, and deliver software changes. You approve every proposal before work proceeds.'
const QA_INTRO_BODY =
  'QA sessions design, run, and report tests for your systems. You approve every test plan before execution.'
const PLANNING_INTRO_BODY =
  'Draft a PRD, then break it into a roadmap, milestones, sprints, and tickets that drive Engineering delivery.'
const DISCLAIMER = 'Konteks can make mistakes. Verify important information.'

export default function NewSessionPage() {
  const { state, dispatch } = useMockup()
  const { beginOverlayChain } = useOverlayLifecycle()
  const engineering = state.sessionMode === 'engineering'
  const qa = state.sessionMode === 'qa'
  const planning = !engineering && !qa
  const pendingCount = PENDING_REVIEWS.length
  const introHeading = engineering
    ? 'What would you like to build?'
    : qa
      ? 'What would you like to test?'
      : 'Start planning'
  const introBody = engineering ? ENGINEERING_INTRO_BODY : qa ? QA_INTRO_BODY : PLANNING_INTRO_BODY

  return (
    <section className="kx-new-session" aria-label="New session">
      {/* Page header — full-width band: the single visible h1 + subtitle
          left, approval indicator right. The sidebar minimize/maximize
          control lives in the persistent shell sidebar (top-right of the
          brand row; hover/focus the rail logo to expand), not here. */}
      <header className="kx-new-session__header" data-testid="new-session-header">
        {/* Mobile (≤760px): the copy hides behind the shared sr-only
            utility (global.css scopes it to mobile) so the header band
            collapses while the h1/subtitle stay in the a11y tree. The
            utility sits on the wrapper AND the leaves so each element is
            individually sr-only. */}
        <div className="kx-new-session__header-copy kx-u-sr-only">
          <h1 className="kx-new-session__title kx-u-sr-only">New session</h1>
          <p className="kx-new-session__subtitle kx-u-sr-only">
            Start governed work with the right mode and context.
          </p>
        </div>
        <p className="kx-new-session__approval kx-u-sr-only">Human approval required for proposals</p>
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
          {/* Planning mode drops its generic heading on mobile (the
              segmented control already names the mode); engineering/QA
              keep theirs. See the ≤760px block in NewSessionPage.css. */}
          <h2
            className={`kx-new-session__intro-heading${
              planning ? ' kx-new-session__intro-heading--planning' : ''
            }`}
          >
            {introHeading}
          </h2>
          <p className="kx-new-session__intro-body">
            {introBody}
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
