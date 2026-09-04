/*
 * registry.tsx (Task T3a, extended T4 + T6) — the runtime registry
 * mirroring src/catalog/components.json 1:1 (53 entries).
 *
 * Each entry lazy-imports its source module from src/components/ so the
 * catalog can load implementations on demand without copying them.
 * ID order and values must stay in sync with the manifest; the
 * verify:manifest script (T3b) enforces the 1:1 mapping.
 *
 * T6 gives EVERY component entry a `preview` (AC4/AC5/AC6):
 *   - adoptable entries render directly (optionally as variant grids);
 *     workspace-menu additionally needs the OverlayLifecycle contract,
 *     which MockupFixtureProvider wires from the same reducer state.
 *   - mockup-coupled entries render through MockupFixtureProvider — the
 *     real mockupReducer + MockupContext under a controlled initial
 *     state — never a copied implementation. Overlays/menus/modals are
 *     seeded with their overlay open; per-status components render one
 *     fixture per meaningful state.
 * Utility entries have no visual preview (manifest-only).
 */
import type { ReactNode } from 'react'
import { SESSION_DETAIL_STATUSES, type SessionDetailStatus } from '../data/mockData'
import { useMockup } from '../state/MockupContext'
import type { MockupState } from '../state/mockupReducer'
import {
  ATTENDANCE_REVIEW_STORY,
  LIVE_TURN_SCRIPT,
} from '../components/session/stream/attendanceReviewStory'
import type { StreamStoryEntry } from '../components/session/stream/sessionStreamTypes'
import type { TechStatus } from '../components/technical/StatusBadge'
import {
  MockupFixtureProvider,
  makeFixtureState,
} from './fixtures/MockupFixtureProvider'
import { type ManifestEntry } from './manifest'

export interface RegistryEntry {
  id: string
  kind: 'component' | 'utility'
  load: () => Promise<{ default?: unknown; [k: string]: unknown }>
  /**
   * Live-preview renderer (T4/T6). Receives the lazily loaded source
   * module and returns the preview tree (fixtures applied).
   */
  preview?: (mod: { default?: unknown; [k: string]: unknown }) => ReactNode
}

// ---------------------------------------------------------------------------
// Shared preview helpers
// ---------------------------------------------------------------------------

type LoadedModule = { default?: unknown; [k: string]: unknown }
type LoadedComponent = React.ComponentType<any>

function asDefaultComponent(mod: LoadedModule): LoadedComponent {
  return mod.default as LoadedComponent
}

function asNamedComponent(mod: LoadedModule, name: string): LoadedComponent {
  return mod[name] as LoadedComponent
}

/** Fixture wrapper for a mockup-coupled preview: the real reducer/context
 *  seeded with `overrides` (shallow over initialState). */
function Fixture({
  overrides,
  children,
}: {
  overrides?: Partial<MockupState>
  children: ReactNode
}) {
  return (
    <MockupFixtureProvider overrides={overrides}>{children}</MockupFixtureProvider>
  )
}

/** Labelled side-by-side variant grid (see catalog.css .kx-cat-variant-*).
 * `wide` stacks the variants at full width — for components whose
 * anatomy is a reading column (the session stream blocks: estimate,
 * error, progress, artifact size against the ~680px session canvas). */
function VariantGrid({
  items,
  wide = false,
}: {
  items: ReadonlyArray<{ label: ReactNode; node: ReactNode }>
  wide?: boolean
}) {
  return (
    <div className={`kx-cat-variant-row${wide ? ' kx-cat-variant-row--wide' : ''}`}>
      {items.map((item, i) => (
        // Labels are unique per preview by construction (fixtureRef lists
        // them); index fallback keeps the grid robust for layout-only
        // variants that share one label.
        <figure key={`${String(i)}`} className="kx-cat-variant">
          {item.node}
          <figcaption className="kx-cat-variant-label">{item.label}</figcaption>
        </figure>
      ))}
    </div>
  )
}

function variantRow(
  items: ReadonlyArray<{ label: ReactNode; node: ReactNode }>,
): ReactNode {
  return <VariantGrid items={items} />
}

/** Stream-context wrapper: the session-stream blocks size their
 *  typography, rhythm, and ch-based widths against .kx-stream — catalog
 *  previews must render inside the SAME context as the session page or
 *  estimate/error/progress/artifact read off-scale. */
function streamNode(node: ReactNode): ReactNode {
  return (
    <div className="kx-stream" style={{ width: '100%' }}>
      <div className="kx-stream-slot">{node}</div>
    </div>
  )
}

/** variantRow with every node wrapped in the stream context, stacked at
 * FULL WIDTH — the stream blocks are reading-column components. */
function streamVariantRow(
  items: ReadonlyArray<{ label: ReactNode; node: ReactNode }>,
): ReactNode {
  return (
    <VariantGrid wide items={items.map((item) => ({ ...item, node: streamNode(item.node) }))} />
  )
}

// ---------------------------------------------------------------------------
// account
// ---------------------------------------------------------------------------

/** account-menu: seeded with the overlay open; production .kx-menu
 *  anchoring is neutralized inside the frame (catalog.css). */
function accountMenuPreview(mod: LoadedModule): ReactNode {
  const AccountMenu = asDefaultComponent(mod)
  return (
    <Fixture overrides={{ overlay: { kind: 'account-menu' } }}>
      <div className="kx-cat-preview-static-menu">
        <AccountMenu />
      </div>
    </Fixture>
  )
}

/** settings-modal: one fixture per primary Settings section. Billing opens
 *  on its persistent subscription summary and dense Usage workspace. */
function settingsModalPreview(mod: LoadedModule): ReactNode {
  const SettingsModal = asDefaultComponent(mod)
  return variantRow(
    (['general', 'billing', 'team'] as const).map((section) => ({
      label: <code>{section}</code>,
      node: (
        <Fixture overrides={{ overlay: section === 'billing' ? { kind: 'settings', section, subtab: 'usage' } : { kind: 'settings', section } }}>
          <div className="kx-cat-preview-static-overlay">
            <SettingsModal />
          </div>
        </Fixture>
      ),
    })),
  )
}

// ---------------------------------------------------------------------------
// composer
// ---------------------------------------------------------------------------

function componentMenuPreview(mod: LoadedModule): ReactNode {
  const ComponentMenu = asDefaultComponent(mod)
  return (
    <Fixture overrides={{ overlay: { kind: 'component-menu' } }}>
      <div className="kx-cat-preview-static-menu">
        <ComponentMenu />
      </div>
    </Fixture>
  )
}

/** composer: the full panel — default ready state, plus the menu-open
 *  variant exercising its coupled children. */
function composerPreview(mod: LoadedModule): ReactNode {
  const Composer = asDefaultComponent(mod)
  return variantRow([
    {
      label: <code>default</code>,
      node: (
        <Fixture>
          <Composer />
        </Fixture>
      ),
    },
    {
      label: <code>component menu terbuka</code>,
      node: (
        <Fixture overrides={{ overlay: { kind: 'component-menu' } }}>
          {/* Anchored container: the composer's menu keeps its production
           * absolute anchoring (unlike the static-menu fixtures); the
           * wrapper supplies the positioning context and headroom. */}
          <div className="kx-cat-preview-anchored-menu">
            <Composer />
          </div>
        </Fixture>
      ),
    },
  ])
}

function executionProfileMenuPreview(mod: LoadedModule): ReactNode {
  const ExecutionProfileMenu = asDefaultComponent(mod)
  return (
    <Fixture overrides={{ overlay: { kind: 'execution-profile-menu' } }}>
      <div className="kx-cat-preview-static-menu">
        <ExecutionProfileMenu />
      </div>
    </Fixture>
  )
}

/** session-mode: the three committed mode states. */
function sessionModePreview(mod: LoadedModule): ReactNode {
  const SessionMode = asDefaultComponent(mod)
  return variantRow(
    (['engineering', 'qa', 'planning'] as const).map((sessionMode) => ({
      label: <code>{sessionMode}</code>,
      node: (
        <Fixture overrides={{ sessionMode }}>
          <SessionMode />
        </Fixture>
      ),
    })),
  )
}

// ---------------------------------------------------------------------------
// context
// ---------------------------------------------------------------------------

function createSystemModalPreview(mod: LoadedModule): ReactNode {
  const CreateSystemModal = asDefaultComponent(mod)
  return (
    <Fixture
      overrides={{
        overlay: { kind: 'create-system-modal', source: 'system-menu' },
      }}
    >
      <div className="kx-cat-preview-static-overlay">
        <CreateSystemModal />
      </div>
    </Fixture>
  )
}

function manualRepositoryModalPreview(mod: LoadedModule): ReactNode {
  const ManualRepositoryModal = asDefaultComponent(mod)
  return (
    <Fixture overrides={{ overlay: { kind: 'manual-repo-modal' } }}>
      <div className="kx-cat-preview-static-overlay">
        <ManualRepositoryModal />
      </div>
    </Fixture>
  )
}

/** repository-selector-modal: active + suspended (nested overlay stacked
 *  above — the modal stands down from the a11y tree). */
function repositorySelectorModalPreview(mod: LoadedModule): ReactNode {
  const RepositorySelectorModal = asNamedComponent(mod, 'default')
  return variantRow([
    {
      label: <code>suspended=false</code>,
      node: (
        <Fixture overrides={{ overlay: { kind: 'repository-modal' } }}>
          <div className="kx-cat-preview-static-overlay">
            <RepositorySelectorModal />
          </div>
        </Fixture>
      ),
    },
    {
      label: <code>suspended=true</code>,
      node: (
        <Fixture overrides={{ overlay: { kind: 'repository-modal' } }}>
          <div className="kx-cat-preview-static-overlay">
            <RepositorySelectorModal suspended />
          </div>
        </Fixture>
      ),
    },
  ])
}

// ---------------------------------------------------------------------------
// customize
// ---------------------------------------------------------------------------

function agentsTabPreview(mod: LoadedModule): ReactNode {
  const AgentsTab = asDefaultComponent(mod)
  return (
    <Fixture>
      <AgentsTab />
    </Fixture>
  )
}

/** context-tab: repository section follows the session-selected scope —
 *  empty selection vs committed session context. */
function contextTabPreview(mod: LoadedModule): ReactNode {
  const ContextTab = asDefaultComponent(mod)
  const seeded = makeFixtureState({}, [
    { type: 'TOGGLE_REPO', repoId: 'bsi/hris-frontend-shared' },
    { type: 'TOGGLE_REPO', repoId: 'bsi/hris-frontend-promotion' },
  ])
  return variantRow([
    {
      label: <code>tanpa repo terpilih</code>,
      node: (
        <Fixture>
          <ContextTab />
        </Fixture>
      ),
    },
    {
      label: <code>sessionContext committed</code>,
      node: (
        <Fixture overrides={{ selectedRepoIds: seeded.selectedRepoIds }}>
          <ContextTab />
        </Fixture>
      ),
    },
  ])
}

/** customize-modal: the production-style 896px × 85dvh frame across all five grouped sections. */
function customizeModalPreview(mod: LoadedModule): ReactNode {
  const CustomizeModal = asDefaultComponent(mod)
  const destinations = [
    { section: 'agents' },
    { section: 'context', subtab: 'files' },
    { section: 'capabilities', subtab: 'skills' },
    { section: 'connections', subtab: 'mcp' },
    { section: 'admin', subtab: 'runtimes' },
  ] as const
  return variantRow(
    destinations.map((destination) => ({
      label: <code>{destination.section}</code>,
      node: (
        <Fixture overrides={{ overlay: { kind: 'customize', destination } }}>
          <div className="kx-cat-preview-static-overlay">
            <CustomizeModal />
          </div>
        </Fixture>
      ),
    })),
  )
}

/** integrations-tab (adoptable): the three variants, side by side. */
function integrationsTabPreview(mod: LoadedModule): ReactNode {
  const IntegrationsTab = mod.default as React.ComponentType<{
    variant: 'mcp' | 'connectors' | 'vcs'
  }>
  return (
    <Fixture>
      {variantRow(
        (['mcp', 'connectors', 'vcs'] as const).map((variant) => ({
          label: <code>variant=&quot;{variant}&quot;</code>,
          node: <IntegrationsTab variant={variant} />,
        })),
      )}
    </Fixture>
  )
}

function skillsTabPreview(mod: LoadedModule): ReactNode {
  const SkillsTab = asDefaultComponent(mod)
  return (
    <Fixture>
      <SkillsTab />
    </Fixture>
  )
}

function toolsTabPreview(mod: LoadedModule): ReactNode {
  const ToolsTab = asDefaultComponent(mod)
  return (
    <Fixture>
      <ToolsTab />
    </Fixture>
  )
}

// ---------------------------------------------------------------------------
// reviews
// ---------------------------------------------------------------------------

function learnedDrawerPreview(mod: LoadedModule): ReactNode {
  const LearnedDrawer = asDefaultComponent(mod)
  return variantRow(
    (['pending', 'audit'] as const).map((tab) => ({
      label: <code>tab={tab}</code>,
      node: (
        <Fixture overrides={{ overlay: { kind: 'learned', tab } }}>
          <div className="kx-cat-preview-static-overlay">
            <LearnedDrawer />
          </div>
        </Fixture>
      ),
    })),
  )
}

// ---------------------------------------------------------------------------
// session
// ---------------------------------------------------------------------------

/** dot-matrix-loader (adoptable): all five variants animating side by
 *  side, plus one larger-size specimen. */
function dotMatrixLoaderPreview(mod: LoadedModule): ReactNode {
  const DotMatrixLoader = asDefaultComponent(mod)
  const variants = mod.DOT_MATRIX_VARIANTS as readonly string[]
  return variantRow([
    ...variants.map((variant) => ({
      label: <code>{variant}</code>,
      node: <DotMatrixLoader variant={variant} />,
    })),
    {
      label: <code>{`size={32}`}</code>,
      node: <DotMatrixLoader variant="spiral" size={32} />,
    },
  ])
}

// ── session stream blocks (Stage B1) ─────────────────────────────────────

/** Fixture accessor: the first (or indexed) ATTENDANCE_REVIEW_STORY
 *  entry of `kind`, typed to that entry's data payload. */
function story<K extends StreamStoryEntry['kind']>(kind: K, index = 0) {
  const matches = ATTENDANCE_REVIEW_STORY.filter((entry) => entry.kind === kind)
  const entry = matches[index]
  if (entry === undefined) {
    throw new Error(`attendanceReviewStory has no "${kind}" entry #${index}`)
  }
  return entry.data as unknown as Extract<StreamStoryEntry, { kind: K }>['data']
}

/** A 6-paragraph long request message — comfortably past the 5-line
 *  clamp so the fade + Read more/less toggle show in the live browser
 *  preview (the fixture's own message stays on the demo page). */
const LONG_REQUEST_MESSAGE = [
  'Review the MyTok ↔ BSI HRIS attendance integration before Friday’s release. Monday’s payroll cut-off depends on check-in events from the MyTok mobile app landing in HRIS as attendance records, so the sync path needs an end-to-end trace before anyone signs off.',
  'Start with the sync worker: it queues events from the mobile check-in API and replays them into the HRIS staging tables every five minutes. Last week’s migration reshuffled the attendance_records schema, and I want certainty that nothing silently dropped or doubled during the cutover window.',
  'Pay special attention to timezone and overnight-shift handling. The overnight canteen crew reported two shifts landing on the wrong day after the DST discussion, and payroll wants the boundary fix from the pull request actually verified against a replayed batch rather than assumed to hold.',
  'Please also sanity-check the retry path end to end. The worker is supposed to deduplicate on the mobile event id, but we have seen duplicate rows after connection drops during the August cut-off, which suggests the dedupe window may be shorter than the upstream API’s slowest successful responses.',
  'If you need a bigger sample, the August export is attached — 1,284 rows including the overnight shifts and the known duplicate deliveries. Reconcile it against the staging tables and call out every mismatch with its evidence, not just the aggregate counts.',
  'Run everything against staging — production stays read-only for this session. Report findings with file:line references and quoted snippets so the release owner can act on them directly.',
].join('\n\n')

/** stream-response-block (adoptable): labeled agent turn (kindLabel +
 *  icon + stateChip) vs bare conversational prose with showFooter. */
function streamResponseBlockPreview(mod: LoadedModule): ReactNode {
  const ResponseBlock = asDefaultComponent(mod)
  const PlanIcon = asNamedComponent(mod, 'PlanIcon')
  const StreamChip = asNamedComponent(mod, 'StreamChip')
  return streamVariantRow([
    {
      label: <code>labeled turn</code>,
      node: (
        <ResponseBlock
          kindLabel="PLAN"
          tone="attention"
          icon={<PlanIcon />}
          time="14:09"
          stateChip={<StreamChip tone="attention">pending approval</StreamChip>}
        >
          <p className="kx-stream-prose">
            Labeled agent turns open with the compact kind header — the
            stroke icon, the caps kind label, and the optional state chip
            riding the same row. The body below is the kind’s typed content.
          </p>
        </ResponseBlock>
      ),
    },
    {
      label: <code>bare · showFooter</code>,
      node: (
        <ResponseBlock tone="neutral" time="14:58" showFooter>
          <p className="kx-stream-prose">
            Conversational turns render bare — no header, flat prose. Hover
            (or focus) this turn to reveal the footer: copy, share, and the
            turn’s timestamp, the group-final turn anatomy.
          </p>
        </ResponseBlock>
      ),
    },
  ])
}

/** stream-bubble (adoptable): the USER-turn bubble with its hover/focus
 *  action bar, plus the afterBubble slot demo. */
function streamBubblePreview(mod: LoadedModule): ReactNode {
  const BubbleBlock = asDefaultComponent(mod)
  return streamVariantRow([
    {
      label: <code>default</code>,
      node: (
        <BubbleBlock time="14:02">
          <p className="kx-stream-prose">
            The user turn: a right-aligned bubble capped at 75% of the
            column, with the time + copy + edit action bar revealed on
            hover / focus-within under the bubble.
          </p>
        </BubbleBlock>
      ),
    },
    {
      label: <code>afterBubble slot</code>,
      node: (
        <BubbleBlock
          time="14:02"
          afterBubble={
            <p className="kx-stream-ack__grounding">
              afterBubble slot — rendered after the bubble, before the
              action bar (the attachment row seats here).
            </p>
          }
        >
          <p className="kx-stream-prose">
            Attachment cards live OUTSIDE the bubble: the caller passes the
            row through the afterBubble slot so it stays right-aligned
            beneath the bubble.
          </p>
        </BubbleBlock>
      ),
    },
  ])
}

/** stream-user-request (adoptable): short message (no clamp/toggle,
 *  attachments outside, chips inline) vs long message (5-line clamp +
 *  fade + Read more/less). */
function streamUserRequestPreview(mod: LoadedModule): ReactNode {
  const UserRequestBlock = asDefaultComponent(mod)
  const request = story('request')
  return streamVariantRow([
    {
      label: <code>short · no clamp</code>,
      node: (
        <UserRequestBlock
          data={{
            ...request,
            message:
              'Review the attendance integration before Friday’s release — staging only, no production fixes.',
          }}
        />
      ),
    },
    {
      label: <code>long · 5-line clamp</code>,
      node: <UserRequestBlock data={{ ...request, message: LONG_REQUEST_MESSAGE }} />,
    },
  ])
}

/** stream-acknowledgement (adoptable): the UNDERSTANDING turn — summary
 *  prose, scope in/out columns, confidence note, grounding line. */
function streamAcknowledgementPreview(mod: LoadedModule): ReactNode {
  const AcknowledgementBlock = asDefaultComponent(mod)
  return streamVariantRow([
    {
      label: <code>fixture · scope in/out + confidence</code>,
      node: <AcknowledgementBlock data={story('acknowledgement')} />,
    },
  ])
}

/** stream-answer (adoptable): flat conversational prose, with and without
 *  the group-final hover footer. */
function streamAnswerPreview(mod: LoadedModule): ReactNode {
  const AnswerBlock = asDefaultComponent(mod)
  const answer = story('answer')
  return streamVariantRow([
    {
      label: <code>prose</code>,
      node: <AnswerBlock data={answer} />,
    },
    {
      label: <code>showFooter</code>,
      node: <AnswerBlock data={answer} showFooter stats={{ duration: '229.2s', tokensIn: '1242k', tokensOut: '16.5k' }} />,
    },
  ])
}

/** stream-clarification (adoptable): interactive (answer chips,
 *  answered={}) vs settled history (recorded answers, resumed notice). */
function streamClarificationPreview(mod: LoadedModule): ReactNode {
  const ClarificationBlock = asDefaultComponent(mod)
  const clarification = story('clarification')
  return streamVariantRow([
    {
      label: <code>{'interactive · answered={}'}</code>,
      node: (
        <ClarificationBlock
          data={{ ...clarification, settledAnswers: undefined }}
          answered={{}}
        />
      ),
    },
    {
      label: <code>settled</code>,
      node: <ClarificationBlock data={clarification} />,
    },
  ])
}

/** stream-plan (adoptable): pending (Approve plan / Request changes) vs
 *  approved (checkmarks, actions retired). */
function streamPlanPreview(mod: LoadedModule): ReactNode {
  const PlanBlock = asDefaultComponent(mod)
  const plan = story('plan')
  return streamVariantRow([
    {
      label: <code>pending</code>,
      node: (
        <PlanBlock
          data={plan}
          approved={false}
          onApprove={() => undefined}
          onRequestChanges={() => undefined}
        />
      ),
    },
    {
      label: <code>approved</code>,
      node: (
        <PlanBlock
          data={plan}
          approved
          onApprove={() => undefined}
          onRequestChanges={() => undefined}
        />
      ),
    },
  ])
}

/** stream-approval-gate (adoptable): OUTSTANDING (attention frame,
 *  Waiting-approval badge, MetadataPair rows, consequence line) vs the
 *  resolved quiet line. */
function streamApprovalGatePreview(mod: LoadedModule): ReactNode {
  const ApprovalGateBlock = asDefaultComponent(mod)
  const gate = story('approval-gate')
  return streamVariantRow([
    {
      label: <code>outstanding</code>,
      node: <ApprovalGateBlock data={gate} onDecision={() => undefined} />,
    },
    {
      label: <code>resolved · allow-once</code>,
      node: (
        <ApprovalGateBlock
          data={gate}
          decision="allow-once"
          onDecision={() => undefined}
        />
      ),
    },
  ])
}

/** stream-progress (adoptable): live (active phase, expanded by default)
 *  vs the collapsed settled summary (expandable in the live preview). */
function streamProgressPreview(mod: LoadedModule): ReactNode {
  const ProgressBlock = asDefaultComponent(mod)
  return streamVariantRow([
    {
      label: <code>live · active phase</code>,
      node: (
        <ProgressBlock data={LIVE_TURN_SCRIPT.execution.progress} defaultExpanded />
      ),
    },
    {
      label: <code>settled · collapsed</code>,
      node: <ProgressBlock data={story('progress')} />,
    },
  ])
}

/** stream-tool-evidence (adoptable): collapsed done ledger rows vs a
 *  running row (auto-open, pulse) vs a done call with io (click expands
 *  the CodeBlock pair with Copy). */
function streamToolEvidencePreview(mod: LoadedModule): ReactNode {
  const ToolEvidenceBlock = asDefaultComponent(mod)
  return streamVariantRow([
    {
      label: <code>done · collapsed rows</code>,
      node: <ToolEvidenceBlock data={story('tool')} />,
    },
    {
      label: <code>running · auto-open</code>,
      node: (
        <ToolEvidenceBlock
          data={{ calls: [LIVE_TURN_SCRIPT.execution.toolRunning] }}
        />
      ),
    },
    {
      label: <code>done · io (klik row untuk expand)</code>,
      node: (
        <ToolEvidenceBlock
          data={{ calls: [LIVE_TURN_SCRIPT.execution.toolDone] }}
        />
      ),
    },
  ])
}

/** stream-artifact (adoptable): the full-width artifact row — hover
 *  reveals Open / Copy / Download; Open expands the mono schema preview
 *  (interactive in the live preview). */
function streamArtifactPreview(mod: LoadedModule): ReactNode {
  const ArtifactBlock = asDefaultComponent(mod)
  return streamVariantRow([
    {
      label: <code>full-width row · hover actions</code>,
      node: <ArtifactBlock data={story('artifact')} />,
    },
  ])
}

/** stream-review-finding (adoptable): the High-severity fixture — severity
 *  chip, impact prose, mono location, quoted evidence. */
function streamReviewFindingPreview(mod: LoadedModule): ReactNode {
  const ReviewFindingBlock = asDefaultComponent(mod)
  return streamVariantRow([
    {
      label: <code>High severity fixture</code>,
      node: <ReviewFindingBlock data={story('review')} />,
    },
  ])
}

/** stream-completion (adoptable): the HANDOFF turn — done / not-done
 *  lists, artifact EntityTokens, next actions, rollback + receipt under
 *  the 2px accent rule, with the hover footer. */
function streamCompletionPreview(mod: LoadedModule): ReactNode {
  const CompletionBlock = asDefaultComponent(mod)
  return streamVariantRow([
    {
      label: <code>fixture · showFooter</code>,
      node: <CompletionBlock data={story('completion')} showFooter />,
    },
  ])
}

/** stream-warning (adoptable): the short notice row — danger icon, one
 *  prose line in a hairline frame, trailing Waiting-for-input badge. */
function streamWarningPreview(mod: LoadedModule): ReactNode {
  const WarningBlock = asDefaultComponent(mod)
  return streamVariantRow([
    {
      label: <code>notice · Waiting for input</code>,
      node: <WarningBlock data={story('warning')} />,
    },
  ])
}

/** stream-error (adoptable): the flat disclosure — summary row between
 *  hairlines; the Show-detail toggle reveals code/source + impact +
 *  resolution above the bottom line (interactive in the live preview). */
function streamErrorPreview(mod: LoadedModule): ReactNode {
  const ErrorBlock = asDefaultComponent(mod)
  return streamVariantRow([
    {
      label: <code>collapsed · Show detail toggle</code>,
      node: <ErrorBlock data={story('error')} />,
    },
  ])
}

/** stream-estimate (adoptable): the estimate disclosure — label + toggle
 *  + total row between the rules; Show breakdown expands the dotted-leader
 *  card inside (interactive in the live preview). */
function streamEstimatePreview(mod: LoadedModule): ReactNode {
  const EstimateBlock = asDefaultComponent(mod)
  return streamVariantRow([
    {
      label: <code>collapsed · Show breakdown toggle</code>,
      node: <EstimateBlock data={story('estimate')} />,
    },
  ])
}

// ── technical text primitives (Stage B2) ──────────────────────────────────

/** Code specimen 1 — a short (4-line) attendance query: under the
 *  5-line gate, so it renders WITHOUT line numbers (default rules). */
const TECH_SHORT_SQL = `SELECT employee_id, clock_in, clock_out
FROM attendance_records
WHERE work_date = '2026-08-31'
  AND clock_out IS NULL;`

/** Code specimen 2 — a 16-line sync config: past the 12-line collapse
 *  threshold, so it starts collapsed (10 numbered lines) behind the
 *  Show full code toggle; Copy stays interactive in the live preview. */
const TECH_LONG_CONFIG = `source:
  provider: gitea
  repository: hris-frontend
  branch: development
sync:
  schedule: "0 7 * * 1-5"
  timezone: Asia/Jakarta
  window:
    opens: "07:30"
    closes: "09:00"
rules:
  late_after: "09:00:59"
  half_day_after: "13:00:00"
  overtime:
    min_minutes: 30
    requires_approval: true`

/** tech-inline-code (adoptable): the non-interactive literal VALUE —
 *  the ink-first wash in a sentence vs a standalone specimen. */
function techInlineCodePreview(mod: LoadedModule): ReactNode {
  const InlineCode = asDefaultComponent(mod)
  return streamVariantRow([
    {
      label: <code>in a sentence</code>,
      node: (
        <p className="kx-tech-showcase__prose">
          Repository <InlineCode>hris-frontend</InlineCode> berada pada branch{' '}
          <InlineCode>development</InlineCode>.
        </p>
      ),
    },
    {
      label: <code>standalone</code>,
      node: <InlineCode>ses_01JABC</InlineCode>,
    },
  ])
}

/** tech-entity-token (adoptable): pill (mono identifiers + sans title)
 *  vs link (rests underlined; hover/focus becomes a pill). */
function techEntityTokenPreview(mod: LoadedModule): ReactNode {
  const EntityToken = asDefaultComponent(mod)
  return streamVariantRow([
    {
      label: <code>pill · mono &amp; sans</code>,
      node: (
        <div className="kx-tech-showcase__row">
          <EntityToken kind="repository" label="hris-frontend" />
          <EntityToken kind="branch" label="development" />
          <EntityToken kind="task" label="Task 7" mono={false} openLabel="Open Task 7" />
          <EntityToken kind="session" label="ses_01JABC" />
        </div>
      ),
    },
    {
      label: <code>link · rests underlined</code>,
      node: (
        <p className="kx-tech-showcase__prose">
          Commit <EntityToken kind="commit" label="9f3c2a1" variant="link" /> masuk
          malam ini — rests as accent ink + underline; hover/focus swaps to a
          pill. The aria-label (default: Open commit 9f3c2a1) and title
          tooltip carry the full value.
        </p>
      ),
    },
  ])
}

/** tech-metadata-pair (adoptable): the 2×2 mixed-value grid vs one long
 *  string value with its hover/focus-revealed Copy action. */
function techMetadataPairPreview(mod: LoadedModule): ReactNode {
  const MetadataPair = asDefaultComponent(mod)
  const EntityToken = asNamedComponent(mod, 'EntityToken')
  return streamVariantRow([
    {
      label: <code>2×2 grid · mixed values</code>,
      node: (
        <div className="kx-tech-showcase__meta">
          <MetadataPair
            label="Repository"
            value={<EntityToken kind="repository" label="hris-frontend" />}
          />
          <MetadataPair
            label="Branch"
            value={<EntityToken kind="branch" label="development" />}
          />
          <MetadataPair label="Session ID" value="ses_01JG8Z4X7QK2M5RT9W3BV6DHC0LP" mono />
          <MetadataPair label="Provider" value="Gitea" />
        </div>
      ),
    },
    {
      label: <code>long value · hover copy</code>,
      node: (
        <MetadataPair
          label="Webhook URL"
          value="https://gitea.internal/api/v1/webhooks/wh_01JG8Z4X7QK2M5RT9W3BV6DHC0LP"
        />
      ),
    },
  ])
}

/** tech-status-badge (adoptable): all ten canonical statuses side by
 *  side (Running pulses its dot) vs one onClick upgrade to button
 *  semantics. */
function techStatusBadgePreview(mod: LoadedModule): ReactNode {
  const StatusBadge = asDefaultComponent(mod)
  const statuses = mod.TECH_STATUSES as readonly TechStatus[]
  return streamVariantRow([
    {
      label: <code>all ten statuses</code>,
      node: (
        <div className="kx-tech-showcase__row">
          {statuses.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      ),
    },
    {
      label: <code>onClick · button semantics</code>,
      node: <StatusBadge status="needs-review" onClick={() => undefined} />,
    },
  ])
}

/** tech-code-block (adoptable): 4-line SQL under the line-number gate vs
 *  a 16-line config collapsed behind Show full code vs the footer line. */
function techCodeBlockPreview(mod: LoadedModule): ReactNode {
  const CodeBlock = asDefaultComponent(mod)
  return streamVariantRow([
    {
      label: <code>sql · 4 lines · no numbers</code>,
      node: <CodeBlock code={TECH_SHORT_SQL} meta="sql" />,
    },
    {
      label: <code>yaml · 16 lines · collapsed</code>,
      node: (
        <CodeBlock code={TECH_LONG_CONFIG} meta="config/attendance-sync.yaml" />
      ),
    },
    {
      label: <code>footer · execution context</code>,
      node: (
        <CodeBlock
          code={TECH_SHORT_SQL}
          meta="sql"
          footer="Executed 09:41 · 3 rows returned"
        />
      ),
    },
  ])
}

/** feedback-modal (adoptable): good vs bad preset option sets. */
function feedbackModalPreview(mod: LoadedModule): ReactNode {
  const FeedbackModal = asDefaultComponent(mod)
  return streamVariantRow([
    {
      label: <code>good</code>,
      node: <FeedbackModal kind="good" embedded onClose={() => undefined} />,
    },
    {
      label: <code>bad</code>,
      node: <FeedbackModal kind="bad" embedded onClose={() => undefined} />,
    },
  ])
}

/** session-quote-card: the real SESSION_DETAIL fixture already carries a
 *  PENDING_APPROVAL quote under WAITING_APPROVAL, so the card renders as
 *  the collapsed decision row (expandable in the live preview). */
function sessionQuoteCardPreview(mod: LoadedModule): ReactNode {
  const SessionQuoteCard = asDefaultComponent(mod)
  return (
    <Fixture>
      <SessionQuoteCard />
    </Fixture>
  )
}

/**
 * session-status-badge (T4 sample): one fixture state per meaningful
 * status, rendered side by side. The statuses are a curated 4 of the real
 * SessionDetailStatus union (all 8 in SESSION_DETAIL_STATUSES); the
 * fixture overrides only `sessionDetail.status`.
 */
const BADGE_PREVIEW_STATUSES: readonly SessionDetailStatus[] = [
  'IN_PROGRESS',
  'WAITING_APPROVAL',
  'DELIVERING',
  'COMPLETED',
]

function SessionStatusBadgePreview({ mod }: { mod: LoadedModule }) {
  const SessionStatusBadge = asDefaultComponent(mod)
  const baseDetail = makeFixtureState().sessionDetail
  return variantRow(
    BADGE_PREVIEW_STATUSES.map((status) => ({
      label: <code>{status.toLowerCase()}</code>,
      node: (
        <MockupFixtureProvider
          overrides={{ sessionDetail: { ...baseDetail, status } }}
        >
          <SessionStatusBadge />
        </MockupFixtureProvider>
      ),
    })),
  )
}

function sessionStatusBadgePreview(mod: LoadedModule): ReactNode {
  return <SessionStatusBadgePreview mod={mod} />
}

function sessionTimelinePreview(mod: LoadedModule): ReactNode {
  const SessionTimeline = asDefaultComponent(mod)
  return (
    <Fixture>
      <SessionTimeline />
    </Fixture>
  )
}

function sessionTrackerPreview(mod: LoadedModule): ReactNode {
  const SessionTracker = asDefaultComponent(mod)
  return (
    <Fixture>
      <SessionTracker />
    </Fixture>
  )
}

// Re-exported so tests can assert the previewed statuses are a subset of
// the real union without re-declaring literals.
export const badgePreviewStatuses = BADGE_PREVIEW_STATUSES
export const allSessionStatuses = SESSION_DETAIL_STATUSES

// ---------------------------------------------------------------------------
// shell
// ---------------------------------------------------------------------------

/** collapse-icon (adoptable): both collapsed states. */
function collapseIconPreview(mod: LoadedModule): ReactNode {
  const CollapseIcon = mod.default as React.ComponentType<{
    collapsed: boolean
  }>
  return variantRow(
    ([false, true] as const).map((collapsed) => ({
      label: <code>{`collapsed={${collapsed}}`}</code>,
      node: <CollapseIcon collapsed={collapsed} />,
    })),
  )
}

/** overlay-lifecycle: a behaviour probe — a trigger opens an overlay via
 *  the fixture's real dispatch, and the provider's shared Escape listener
 *  dismisses it (the contract the hook/provider owns). */
function OverlayLifecycleProbe() {
  return (
    <Fixture>
      <OverlayLifecycleProbeInner />
    </Fixture>
  )
}

function OverlayLifecycleProbeInner() {
  const { state, dispatch } = useMockup()
  return (
    <div className="kx-cat-probe">
      <p className="kx-cat-probe-line">
        overlay aktif: <code>{state.overlay.kind}</code>
      </p>
      <button
        type="button"
        className="kx-cat-probe-button"
        onClick={() =>
          dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'workspace-menu' } })
        }
      >
        Buka workspace menu
      </button>
      <p className="kx-cat-probe-line">
        Tekan <kbd>Escape</kbd> setelah membuka — provider mendispatch{' '}
        <code>CLOSE_OVERLAY</code> dan overlay kembali <code>none</code>.
      </p>
    </div>
  )
}

function overlayLifecyclePreview(_mod: LoadedModule): ReactNode {
  return <OverlayLifecycleProbe />
}

/** sidebar: expanded 320px vs collapsed 64px rail (a real width token
 *  change, visible side by side). */
function sidebarPreview(mod: LoadedModule): ReactNode {
  const Sidebar = asDefaultComponent(mod)
  return streamVariantRow([
    {
      label: <code>expanded</code>,
      node: (
        <Fixture>
          <div className="kx-cat-preview-sidebar">
            <Sidebar />
          </div>
        </Fixture>
      ),
    },
    {
      label: <code>collapsed rail</code>,
      node: (
        <Fixture overrides={{ sidebarCollapsed: true }}>
          <div className="kx-cat-preview-sidebar">
            <Sidebar />
          </div>
        </Fixture>
      ),
    },
  ])
}

function systemMenuPreview(mod: LoadedModule): ReactNode {
  const SystemMenu = asDefaultComponent(mod)
  return (
    <Fixture overrides={{ overlay: { kind: 'system-menu' } }}>
      <div className="kx-cat-preview-static-menu">
        <SystemMenu />
      </div>
    </Fixture>
  )
}

/**
 * workspace-menu (T4 sample, adoptable): context-free w.r.t. MockupContext,
 * but it consumes `useOverlayLifecycle` (Escape → CLOSE_OVERLAY), so the
 * preview wraps it in a MockupFixtureProvider seeded with the overlay
 * open — the real lifecycle contract holds (noted on the manifest entry).
 *
 * The production .kx-menu geometry is absolutely anchored to the app
 * shell (`top: 62px; left: calc(var(--kx-sidebar-w) + 12px)`); the preview
 * frame neutralizes only that anchoring via a class in catalog.css so the
 * menu reads as a standalone specimen. All visual styling still comes
 * from the production CSS files.
 */
function workspaceMenuPreview(mod: LoadedModule): ReactNode {
  const WorkspaceMenu = asDefaultComponent(mod)
  return (
    <MockupFixtureProvider overrides={{ overlay: { kind: 'workspace-menu' } }}>
      <div className="kx-cat-preview-static-menu">
        <WorkspaceMenu />
      </div>
    </MockupFixtureProvider>
  )
}

// ---------------------------------------------------------------------------
// system
// ---------------------------------------------------------------------------

function systemMapModalPreview(mod: LoadedModule): ReactNode {
  const SystemMapModal = asDefaultComponent(mod)
  const { activeSystemId } = makeFixtureState()
  return (
    <Fixture overrides={{ overlay: { kind: 'system-map', systemId: activeSystemId } }}>
      <div className="kx-cat-preview-static-overlay">
        <SystemMapModal />
      </div>
    </Fixture>
  )
}

/** Manifest-driven example snippet for the detail page "Usage" section. */
export function usageSnippet(entry: ManifestEntry): string {
  const name = entry.name
  // Copy-layout convention for adopters (see docs/ai-adoption.md):
  // src/components -> ./components, src/state -> ./state, catalog fixtures -> ./catalog/fixtures.
  // Relative imports only — this repo has no path aliases.
  const importPath = `./${entry.sourcePath.replace(/^src\//, '').replace(/\.tsx?$/, '')}`
  const importLine =
    entry.exportName === 'default'
      ? `import ${name} from '${importPath}'`
      : `import { ${Array.isArray(entry.exportName) ? entry.exportName.join(', ') : entry.exportName} } from '${importPath}'`

  if (entry.classification === 'adoptable') {
    if (entry.id === 'workspace-menu') {
      // Runnable minimal example: WorkspaceMenu consumes
      // useOverlayLifecycle(), so it must be wrapped in an
      // OverlayLifecycleProvider fed by the real mockupReducer.
      return `${importLine}\nimport { useReducer } from 'react'\nimport { OverlayLifecycleProvider } from './components/shell/OverlayLifecycle'\nimport { initialState, mockupReducer } from './state/mockupReducer'\n\nfunction Example() {\n  const [state, dispatch] = useReducer(mockupReducer, null, initialState)\n  return (\n    <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>\n      <${name} />\n    </OverlayLifecycleProvider>\n  )\n}`
    }
    if (entry.propDocs && Object.keys(entry.propDocs).length > 0) {
      const sampleProps = Object.keys(entry.propDocs)
        .map((prop) => {
          const value =
            entry.id === 'integrations-tab' && prop === 'variant'
              ? `"mcp"`
              : entry.id === 'collapse-icon' && prop === 'collapsed'
                ? '{false}'
                : '{…}'
          return `${prop}=${value}`
        })
        .join(' ')
      return `${importLine}\n\nfunction Example() {\n  return <${name} ${sampleProps} />\n}`
    }
    return `${importLine}\n\nfunction Example() {\n  return <${name} />\n}`
  }
  if (entry.classification === 'mockup-coupled') {
    return `${importLine}\nimport { MockupFixtureProvider } from './catalog/fixtures/MockupFixtureProvider'\n\nfunction Example() {\n  return (\n    <MockupFixtureProvider>\n      <${name} />\n    </MockupFixtureProvider>\n  )\n}`
  }
  return `${importLine}\n\n// ${entry.classification}: ${entry.adoptionNotes}`
}

export const registry: RegistryEntry[] = [
  // account
  {
    id: 'account-menu',
    kind: 'component',
    load: () => import('../components/account/AccountMenu'),
    preview: accountMenuPreview,
  },
  {
    id: 'settings-modal',
    kind: 'component',
    load: () => import('../components/account/SettingsModal'),
    preview: settingsModalPreview,
  },
  // composer
  {
    id: 'component-menu',
    kind: 'component',
    load: () => import('../components/composer/ComponentMenu'),
    preview: componentMenuPreview,
  },
  {
    id: 'composer',
    kind: 'component',
    load: () => import('../components/composer/Composer'),
    preview: composerPreview,
  },
  {
    id: 'execution-profile-menu',
    kind: 'component',
    load: () => import('../components/composer/ExecutionProfileMenu'),
    preview: executionProfileMenuPreview,
  },
  {
    id: 'session-mode',
    kind: 'component',
    load: () => import('../components/composer/SessionMode'),
    preview: sessionModePreview,
  },
  // context
  {
    id: 'create-system-modal',
    kind: 'component',
    load: () => import('../components/context/CreateSystemModal'),
    preview: createSystemModalPreview,
  },
  {
    id: 'manual-repository-modal',
    kind: 'component',
    load: () => import('../components/context/ManualRepositoryModal'),
    preview: manualRepositoryModalPreview,
  },
  {
    id: 'repository-selector-modal',
    kind: 'component',
    load: () => import('../components/context/RepositorySelectorModal'),
    preview: repositorySelectorModalPreview,
  },
  // customize
  {
    id: 'agents-tab',
    kind: 'component',
    load: () => import('../components/customize/AgentsTab'),
    preview: agentsTabPreview,
  },
  {
    id: 'context-tab',
    kind: 'component',
    load: () => import('../components/customize/ContextTab'),
    preview: contextTabPreview,
  },
  {
    id: 'customize-modal',
    kind: 'component',
    load: () => import('../components/customize/CustomizeModal'),
    preview: customizeModalPreview,
  },
  {
    id: 'integrations-tab',
    kind: 'component',
    load: () => import('../components/customize/IntegrationsTab'),
    preview: integrationsTabPreview,
  },
  {
    id: 'skills-tab',
    kind: 'component',
    load: () => import('../components/customize/SkillsTab'),
    preview: skillsTabPreview,
  },
  {
    id: 'tools-tab',
    kind: 'component',
    load: () => import('../components/customize/ToolsTab'),
    preview: toolsTabPreview,
  },
  {
    id: 'preserved-content',
    kind: 'utility',
    load: () => import('../components/customize/preservedContent'),
  },
  // reviews
  {
    id: 'learned-drawer',
    kind: 'component',
    load: () => import('../components/reviews/LearnedDrawer'),
    preview: learnedDrawerPreview,
  },
  // session
  {
    id: 'dot-matrix-loader',
    kind: 'component',
    load: () => import('../components/ui/DotMatrixLoader'),
    preview: dotMatrixLoaderPreview,
  },
  {
    id: 'stream-response-block',
    kind: 'component',
    load: () => import('../components/session/stream/ResponseBlock'),
    preview: streamResponseBlockPreview,
  },
  {
    id: 'stream-bubble',
    kind: 'component',
    load: () => import('../components/session/stream/BubbleBlock'),
    preview: streamBubblePreview,
  },
  {
    id: 'stream-user-request',
    kind: 'component',
    load: () => import('../components/session/stream/blocks/UserRequestBlock'),
    preview: streamUserRequestPreview,
  },
  {
    id: 'stream-acknowledgement',
    kind: 'component',
    load: () => import('../components/session/stream/blocks/AcknowledgementBlock'),
    preview: streamAcknowledgementPreview,
  },
  {
    id: 'stream-answer',
    kind: 'component',
    load: () => import('../components/session/stream/blocks/AnswerBlock'),
    preview: streamAnswerPreview,
  },
  {
    id: 'stream-clarification',
    kind: 'component',
    load: () => import('../components/session/stream/blocks/ClarificationBlock'),
    preview: streamClarificationPreview,
  },
  {
    id: 'stream-plan',
    kind: 'component',
    load: () => import('../components/session/stream/blocks/PlanBlock'),
    preview: streamPlanPreview,
  },
  {
    id: 'stream-approval-gate',
    kind: 'component',
    load: () => import('../components/session/stream/blocks/ApprovalGateBlock'),
    preview: streamApprovalGatePreview,
  },
  {
    id: 'stream-progress',
    kind: 'component',
    load: () => import('../components/session/stream/blocks/ProgressBlock'),
    preview: streamProgressPreview,
  },
  {
    id: 'stream-tool-evidence',
    kind: 'component',
    load: () => import('../components/session/stream/blocks/ToolEvidenceBlock'),
    preview: streamToolEvidencePreview,
  },
  {
    id: 'stream-artifact',
    kind: 'component',
    load: () => import('../components/session/stream/blocks/ArtifactBlock'),
    preview: streamArtifactPreview,
  },
  {
    id: 'stream-review-finding',
    kind: 'component',
    load: () => import('../components/session/stream/blocks/ReviewFindingBlock'),
    preview: streamReviewFindingPreview,
  },
  {
    id: 'stream-completion',
    kind: 'component',
    load: () => import('../components/session/stream/blocks/CompletionBlock'),
    preview: streamCompletionPreview,
  },
  {
    id: 'stream-warning',
    kind: 'component',
    load: () => import('../components/session/stream/blocks/WarningBlock'),
    preview: streamWarningPreview,
  },
  {
    id: 'stream-error',
    kind: 'component',
    load: () => import('../components/session/stream/blocks/ErrorBlock'),
    preview: streamErrorPreview,
  },
  {
    id: 'stream-estimate',
    kind: 'component',
    load: () => import('../components/session/stream/blocks/EstimateBlock'),
    preview: streamEstimatePreview,
  },
  {
    id: 'tech-inline-code',
    kind: 'component',
    load: () => import('../components/technical/InlineCode'),
    preview: techInlineCodePreview,
  },
  {
    id: 'tech-entity-token',
    kind: 'component',
    load: () => import('../components/technical/EntityToken'),
    preview: techEntityTokenPreview,
  },
  {
    id: 'tech-metadata-pair',
    kind: 'component',
    // MetadataPair previews compose EntityToken values; both stay lazy.
    load: () =>
      Promise.all([
        import('../components/technical/MetadataPair'),
        import('../components/technical/EntityToken'),
      ]).then(([meta, entity]) => ({
        default: meta.default,
        EntityToken: entity.default,
      })),
    preview: techMetadataPairPreview,
  },
  {
    id: 'tech-status-badge',
    kind: 'component',
    load: () => import('../components/technical/StatusBadge'),
    preview: techStatusBadgePreview,
  },
  {
    id: 'tech-code-block',
    kind: 'component',
    load: () => import('../components/technical/CodeBlock'),
    preview: techCodeBlockPreview,
  },
  {
    id: 'feedback-modal',
    kind: 'component',
    load: () => import('../components/session/FeedbackModal'),
    preview: feedbackModalPreview,
  },
  {
    id: 'session-quote-card',
    kind: 'component',
    load: () => import('../components/session/SessionQuoteCard'),
    preview: sessionQuoteCardPreview,
  },
  {
    id: 'session-status-badge',
    kind: 'component',
    load: () => import('../components/session/SessionStatusBadge'),
    // T4 sample: mockup-coupled fixture — one provider per status variant.
    preview: sessionStatusBadgePreview,
  },
  {
    id: 'session-timeline',
    kind: 'component',
    load: () => import('../components/session/SessionTimeline'),
    preview: sessionTimelinePreview,
  },
  {
    id: 'session-tracker',
    kind: 'component',
    load: () => import('../components/session/SessionTracker'),
    preview: sessionTrackerPreview,
  },
  {
    id: 'format-time',
    kind: 'utility',
    load: () => import('../components/session/formatTime'),
  },
  // shell
  {
    id: 'app-shell',
    kind: 'component',
    load: () => import('../components/shell/AppShell'),
    // internal: no adoption detail page — listed with its reason on the
    // index page (spec §4), so no live preview here.
  },
  {
    id: 'collapse-icon',
    kind: 'component',
    load: () => import('../components/shell/CollapseIcon'),
    preview: collapseIconPreview,
  },
  {
    id: 'overlay-lifecycle',
    kind: 'component',
    load: () => import('../components/shell/OverlayLifecycle'),
    preview: overlayLifecyclePreview,
  },
  {
    id: 'sidebar',
    kind: 'component',
    load: () => import('../components/shell/Sidebar'),
    preview: sidebarPreview,
  },
  {
    id: 'system-menu',
    kind: 'component',
    load: () => import('../components/shell/SystemMenu'),
    preview: systemMenuPreview,
  },
  {
    id: 'use-focus-containment',
    kind: 'utility',
    load: () => import('../components/shell/useFocusContainment'),
  },
  {
    id: 'workspace-menu',
    kind: 'component',
    load: () => import('../components/shell/WorkspaceMenu'),
    // T4 sample: adoptable, but consumes OverlayLifecycle — see manifest.
    preview: workspaceMenuPreview,
  },
  // system
  {
    id: 'system-map-modal',
    kind: 'component',
    load: () => import('../components/system/SystemMapModal'),
    preview: systemMapModalPreview,
  },
]
