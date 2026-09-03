/*
 * attendanceReviewStory — the stream fixture for the chat-style session
 * detail page (spec: .pi/orch/plans/chat-session-stream-spec.md).
 *
 * The session is the "Review attendance integration" entry from
 * mockData.ts (recent id `recent-attendance`, history id
 * `hist-attendance`, system `bsi-hris`): a pre-release review of the
 * MyTok ↔ BSI HRIS attendance integration.
 *
 * The story reads like a REAL settled conversation (spec §Fixture, 12
 * steps + the three §Fase 4 kinds): user request bubble with attachment
 * cards → agent understanding prose → a QUOTE of the spec’s timezone rule
 * (the basis for the clarification questions) → clarification prose
 * (settled, answers recorded) → user answer bubble → plan (approved) →
 * approval gate (settled: Allow once) → progress collapsed to a one-line
 * summary → tool batch collapsed (all done — including the scan that ran
 * live during the session) → a WARNING notice (connection lost mid-scan,
 * resumed) → an ERROR report (initial verification 503, retried and
 * resolved) → review finding → artifact chip → agent final answer →
 * completion handoff. Timestamps are monotonic and realistic
 * (14:02 → 15:03).
 *
 * LIVE_TURN_SCRIPT drives the STAGED composer flow (spec §Live mock
 * v2): each send plays typing → understanding, then PARKS at an
 * outstanding approval gate; the user's decision settles the gate and
 * continues to an interactive plan; approving the plan runs the
 * execution leg (live progress with a ticking elapsed clock → tool
 * call running→done → artifact chip → final answer), while Deny or
 * Request changes close the turn with short prose. All waits are
 * interactive — nothing advances until the user decides.
 */
import type {
  AnswerBlockData,
  ApprovalGateBlockData,
  ArtifactBlockData,
  ClarificationBlockData,
  PlanBlockData,
  ProgressBlockData,
  ReviewFindingBlockData,
  StreamStoryEntry,
  ToolCall,
} from './sessionStreamTypes'

/** Recent-sessions fixture id that routes to the stream detail page. */
export const ATTENDANCE_REVIEW_RECENT_ID = 'recent-attendance'

/** Session-history fixture id that routes to the stream detail page. */
export const ATTENDANCE_REVIEW_HISTORY_ID = 'hist-attendance'

/** The session title both fixtures share (display + matching key). */
export const ATTENDANCE_REVIEW_TITLE = 'Review attendance integration'

export const ATTENDANCE_REVIEW_STORY: StreamStoryEntry[] = [
  // 1 — User request bubble (message prose + two attachment cards).
  {
    kind: 'request',
    data: {
      intent: 'Review the MyTok ↔ BSI HRIS attendance integration before Friday’s release.',
      message:
        'Review the MyTok ↔ BSI HRIS attendance integration before Friday’s release. Monday’s payroll cut-off depends on check-in events from the MyTok mobile app landing in HRIS as attendance records: trace the sync path end to end, check timezone and overnight-shift handling, verify idempotency on retries, and report findings with evidence — no production fixes in this session.\n\nRun everything against staging.',
      chips: [
        { label: 'environment: staging', kind: 'parameter' },
        { label: 'bsi-hris · attendance sync worker', mono: true, kind: 'context' },
      ],
      attachments: [
        { name: 'attendance-sync-spec.md', meta: 'Markdown · rev 4 · 18 KB', type: 'doc' },
        { name: 'mytok-sync-logs-aug.csv', meta: 'CSV · 1,284 rows · 38 KB', type: 'sheet' },
      ],
    },
  },
  // 2 — Agent understanding (flat prose, scope + confidence).
  {
    kind: 'acknowledgement',
    data: {
      summary:
        'Got it — you need the attendance integration reviewed end to end before the release so Monday’s payroll cut-off can trust MyTok check-ins. I’ll trace the sync worker in `bsi-hris`, audit the timezone and idempotency handling, replay a sample batch in the sandbox, and deliver a findings report. Production stays untouched unless you approve a specific fix.',
      scopeIn: [
        'Attendance sync worker and shift-boundary handling in `bsi-hris`',
        'MyTok check-in API contract as the sync consumes it',
        'Reconciliation of the August sample (1,284 records) against HRIS',
      ],
      scopeOut: [
        'MyTok mobile app UI changes',
        'Payroll calculation engine or cut-off schedule',
        'Backfilling attendance records before 2026-07-01',
      ],
      confidence: 'High',
      confidenceNote:
        'The sync worker is the only writer of attendance records, and spec rev 4 pins the MyTok contract explicitly — there is one integration seam to audit.',
      grounding:
        'Grounded in bsi/hris-attendance@main · attendance-sync-spec.md (rev 4) · mytok-sync-logs-aug.csv',
    },
  },
  // 3 — Quote: the spec rule the clarification questions hang on
  // (spec §Fase 4 §Penempatan — cites attendance-sync-spec.md).
  {
    kind: 'quote',
    data: {
      label: 'From the spec',
      text: 'The attendance business day follows the HRIS server timezone (Asia/Jakarta). A check-in recorded during an overnight shift belongs to the shift’s start date — never to the device’s local calendar day.',
      attribution: 'attendance-sync-spec.md · §3.1 Shift boundaries · rev 4',
    },
  },
  // 4 — Clarification (settled: answers recorded, no live chips).
  {
    kind: 'clarification',
    data: {
      pausedNotice:
        'Execution is paused until both answers land — the audit does not start against the sample in the meantime.',
      resumedNotice:
        'Both answers received — execution resumed with the confirmed shift-boundary rule and reconciliation window.',
      questions: [
        {
          id: 'q-boundary',
          question:
            'Which day owns a MyTok check-in when an overnight shift crosses midnight — the check-in device’s local time, or the HRIS server timezone (`Asia/Jakarta`)?',
          options: ['Device local time', 'HRIS server time (Asia/Jakarta)', 'Split the record at midnight'],
        },
        {
          id: 'q-window',
          question: 'Which attendance records should the reconciliation cover?',
          options: ['August sample only (1,284)', 'Full July–August', 'Last 7 days'],
        },
      ],
      settledAnswers: ['HRIS server time (Asia/Jakarta)', 'August sample only (1,284)'],
    },
  },
  // 5 — User answer bubble.
  {
    kind: 'request',
    data: {
      intent: 'Boundary + window answers',
      message:
        '1. HRIS server time (Asia/Jakarta) — the business day follows the server timezone, per spec rev 4 §3.1.\n2. August sample only (1,284 records) — keep July out of this pass.',
      chips: [],
    },
  },
  // 6 — Plan (settled approved; the page renders it approved).
  {
    kind: 'plan',
    data: {
      steps: [
        {
          id: 'step-map',
          verb: 'Trace',
          target: 'services/attendance-sync/**',
          targetMono: true,
          agent: 'Analysis',
          estimate: '~10 min',
        },
        {
          id: 'step-audit',
          verb: 'Audit',
          target: 'services/attendance-sync/shiftBoundary.ts',
          targetMono: true,
          agent: 'Engineering',
          estimate: '~20 min',
          risk: 'shared shift-boundary helper also used by the payroll export',
        },
        {
          id: 'step-replay',
          verb: 'Replay',
          target: 'sandbox batch att-2026-0814',
          targetMono: true,
          agent: 'Engineering',
          estimate: '~15 min',
        },
        {
          id: 'step-report',
          verb: 'Draft',
          target: 'docs/attendance-review-report.md',
          targetMono: true,
          agent: 'PM',
          estimate: '~10 min',
        },
      ],
      totalEstimate: '~55 min',
    },
  },
  // 7 — Approval gate (settled: Allow once; the page renders it decided).
  {
    kind: 'approval-gate',
    data: {
      action: 'Write replayed attendance records to the BSI HRIS sandbox to run the sample batch end to end',
      rows: [
        { label: 'Target', value: 'bsi-hris · sandbox', mono: true },
        { label: 'Scope', value: '1,284 attendance records, 2026-08-01 through 2026-08-14' },
        { label: 'Estimated cost', value: '~2 min replay · no production data touched' },
        { label: 'Rollback path', value: 'sandbox-attendance-reset.sh runs before every batch', mono: true },
      ],
      consequence:
        'This replay writes real employee attendance payloads into the shared sandbox. Once a batch id is consumed it cannot be replayed — an interrupted run requires resetting the sandbox and re-importing the sample, and partial replay results must not be treated as evidence.',
    },
  },
  // 8 — Progress (collapsed one-line summary in history).
  {
    kind: 'progress',
    data: {
      elapsed: '34m 41s',
      phases: [
        { id: 'phase-map', label: 'Map the MyTok → HRIS sync path', state: 'done', duration: '6m 12s' },
        { id: 'phase-audit', label: 'Audit shift-boundary and idempotency handling', state: 'done', duration: '17m 48s' },
        { id: 'phase-replay', label: 'Replay sandbox batch att-2026-0814', state: 'done', duration: '2m 06s' },
        { id: 'phase-reconcile', label: 'Reconcile against the August sample (1,284 records)', state: 'done', duration: '5m 21s' },
        { id: 'phase-report', label: 'Draft the review report', state: 'done', duration: '3m 14s' },
      ],
    },
  },
  // 9 — Tool evidence batch (all settled; the scan ran live mid-session).
  {
    kind: 'tool',
    data: {
      calls: [
        {
          id: 'call-trace-sync',
          verb: 'grep',
          target: 'services/attendance-sync/**',
          state: 'done',
          duration: '0.5s',
          result: '4 call sites found: worker.ts, shiftBoundary.ts, syncClient.ts, reconciler.ts',
          io: {
            input: 'rg -n "mytok" services/attendance-sync --type ts',
            output: [
              'services/attendance-sync/worker.ts:64: const events = await mytokFetch(window)',
              'services/attendance-sync/shiftBoundary.ts:47: const day = utcDateOf(event.checkinAt)',
              'services/attendance-sync/syncClient.ts:31: if (seen(event.id)) return SKIP',
              'services/attendance-sync/reconciler.ts:88: report.mismatch(workdayOf(record), record.day)',
            ],
          },
        },
        {
          id: 'call-read-boundary',
          verb: 'read',
          target: 'services/attendance-sync/shiftBoundary.ts:40-58',
          state: 'done',
          duration: '0.2s',
          result: 'Confirmed: boundary derived from UTC, not Asia/Jakarta — overnight shifts land on the wrong day',
          io: {
            input: 'sed -n 40,58p services/attendance-sync/shiftBoundary.ts',
            output: [
              'export function workdayOf(checkinAt: string) {',
              '-  const day = utcDateOf(checkinAt);',
              '+  const day = jakartaDateOf(checkinAt); // spec rev 4 §3.1',
              '  return day;',
              '}',
            ],
          },
        },
        {
          id: 'call-scan-logs',
          verb: 'scan',
          target: 'mytok-sync-logs-aug.csv (1,284 rows)',
          state: 'done',
          duration: '2m 06s',
          result: '37 overnight records cross midnight UTC; retry window p99 measured at 45s',
          io: {
            input: 'scan mytok-sync-logs-aug.csv --window august --report drift',
            output: [
              'rows scanned: 1,284 (2026-08-01 .. 2026-08-14)',
              'overnight records crossing midnight UTC: 37',
              'duplicate event ids (idempotent skip): 4',
              'retry window p99: 45s (configured window: 30s)',
            ],
          },
        },
        {
          id: 'call-replay',
          verb: 'replay',
          target: 'sandbox batch att-2026-0814',
          state: 'done',
          duration: '1m 58s',
          result: '1,284 records replayed into the sandbox — batch consumed, reset script verified',
          io: {
            input: 'att-replay run --batch att-2026-0814 --env sandbox',
            output: [
              'replayed 1,284 records into bsi-hris (sandbox)',
              'mismatches before boundary fix: 37',
              'batch id consumed — replay requires sandbox reset',
            ],
          },
        },
      ],
    },
  },
  // 10 — Warning: the brief mid-scan interruption notice (spec §Fase 4
  // §Penempatan — between the tool batch and the review finding).
  {
    kind: 'warning',
    data: {
      text: 'Connection lost during sync check — paused 2m 14s, resumed automatically.',
      badge: 'Waiting for input',
    },
  },
  // 11 — Error: the initial verification failure, retried and resolved
  // (spec §Fase 4 §Penempatan — after the tool batch, before the finding).
  {
    kind: 'error',
    data: {
      title: 'Initial verification call failed — replay evidence stayed unconfirmed',
      code: 'HTTP 503',
      source: 'canteen-api',
      impact:
        'The first post-replay verification call could not cross-check the 1,284 replayed attendance records against the downstream consumer, so the reconciliation result stayed unconfirmed for four minutes. No data was written and the replay batch itself was unaffected.',
      resolution: { text: 'Retried — succeeded', tone: 'accent' },
    },
  },
  // 12 — Review finding.
  {
    kind: 'review',
    data: {
      severity: 'High',
      title: 'Timezone drift: overnight shifts land on the wrong attendance day',
      impact:
        'The shift boundary is derived from UTC while the business day runs on `Asia/Jakarta`: a check-in at 23:40 Jakarta time on an overnight shift is recorded on the previous day in HRIS. The August sample shows 37 such records — enough to shift overtime and payroll totals for night-shift employees.',
      location: 'services/attendance-sync/shiftBoundary.ts:47',
      quote: 'const day = utcDateOf(event.checkinAt) // business day derived from UTC, not Asia/Jakarta',
    },
  },
  // 13 — Artifact chip (report v1).
  {
    kind: 'artifact',
    data: {
      badge: 'REPORT',
      title: 'Review report — attendance integration',
      excerpt:
        'Pre-release review findings for the attendance integration: the sync path traced end to end, the timezone and idempotency audit, the sandbox replay results, and the release sign-off recommendation.',
      schema: [
        '## Sync path',
        'MyTok check-in API -> worker.ts -> shiftBoundary.ts -> attendance_records',
        '## Findings',
        '+ 1 High — overnight shifts recorded on the wrong day (UTC boundary)',
        '+ 1 Medium — retry window shorter than the MyTok API SLA',
        '## Sign-off',
        '+ Release blocked until the High finding ships a verified fix',
      ],
      version: 'v1',
      time: '14:46',
      copyPayload: [
        '# Review report — MyTok ↔ BSI HRIS attendance integration (v1)',
        '',
        '## Scope',
        'Pre-release review of the attendance sync between the MyTok mobile',
        'app and BSI HRIS: sync path, timezone and overnight-shift handling,',
        'idempotency on retries, and reconciliation of the August sample',
        '(1,284 records).',
        '',
        '## Sync path',
        'MyTok check-in API -> worker.ts -> shiftBoundary.ts ->',
        'attendance_records. The worker is the only writer of attendance',
        'records; duplicate event ids skip cleanly (idempotent retries).',
        '',
        '## Findings',
        'High — the shift boundary is derived from UTC while the business',
        'day runs on Asia/Jakarta (shiftBoundary.ts:47). Overnight-shift',
        'check-ins land on the wrong attendance day: 37 of 1,284 August',
        'records affected.',
        'Medium — the retry window (30 s) is shorter than the MyTok API',
        'p99 SLA (45 s); a slow response can double-write a window.',
        '',
        '## Sign-off',
        'Release blocked until the High finding ships a verified fix; the',
        'Medium finding is tracked for the following release.',
      ].join('\n'),
    },
  },
  // 14 — Agent final answer (conversational prose).
  {
    kind: 'answer',
    data: {
      paragraphs: [
        'Here’s where the review landed. The sync path itself is sound — the worker is the only writer of attendance records and retries are idempotent, so duplicate check-ins skip cleanly. The real defect is the shift boundary: it derives the business day from UTC while the business runs on `Asia/Jakarta`, so 37 of the 1,284 August records landed on the wrong attendance day (High — `shiftBoundary.ts:47`).',
        'I patched the boundary to derive from `Asia/Jakarta` per spec rev 4 §3.1 and locked it behind 26 passing regression tests; the sandbox replay then reconciled the full sample with zero mismatches. The Medium retry-window finding is real but separable — I’ve tracked it for the next release rather than widening this session.',
      ],
    },
  },
  // 15 — Completion handoff.
  {
    kind: 'completion',
    data: {
      done: [
        'Sync path traced end to end — the worker is the only writer of attendance records, and retries are idempotent (duplicate event ids skip cleanly)',
        'High finding verified and fixed: the shift boundary now derives from `Asia/Jakarta` per spec rev 4 §3.1, locked behind 26 passing regression tests',
        'Sandbox replay of the August sample reconciled — 0 mismatches remain after the boundary fix',
        'Review report drafted for the release sign-off',
      ],
      notDone: [
        'MyTok mobile app check-in UI — out of scope for this session',
        'Attendance records before 2026-07-01 left unaudited — needs its own session if requested',
      ],
      artifacts: [
        { label: 'PR #1301', mono: true },
        { label: 'docs/attendance-review-report.md', mono: true },
        { label: 'Test report — attendance.boundary', mono: true },
      ],
      nextActions: [
        'Release owner signs off the review report before Friday’s cut',
        'Cherry-pick the boundary fix into the release branch (`2.9.x`)',
        'Schedule the pre-July backfill audit as its own session if requested',
      ],
      rollback:
        'Revert PR #1301 — the boundary helper returns to UTC derivation. The sandbox needs no rollback (it resets before every batch), and no production records were written.',
      receipt:
        'Session SES-2026-0121 · 6 tool calls logged · 2 artifacts · 38m 27s elapsed · receipt R-0121',
    },
  },
]

// ── Live turn script (staged interactive composer flow) ───────────────────

/** A closing branch: the turn ends with short prose and the composer
 * unlocks — used when the gate is DENIED or the plan gets "Request
 * changes" (no execution runs). */
export interface LiveClosingScript {
  /** Decision recorded → brief typing indicator. */
  typingDelayMs: number
  /** After typing starts: the closing prose replaces the indicator. */
  answerDelayMs: number
  answer: AnswerBlockData
  /** After the prose: the turn settles and the composer unlocks. */
  settleDelayMs: number
}

/** The execution leg after "Approve plan": live progress with a real
 * ticking elapsed clock → tool call running→done (collapses) → artifact
 * chip → final answer → unlock. */
export interface LiveExecutionScript {
  progressDelayMs: number
  /** Live progress (an active phase; elapsed ticks on the page clock). */
  progress: ProgressBlockData
  toolRunningDelayMs: number
  /** The call as it first appears — running, open, animated. */
  toolRunning: ToolCall
  toolDoneDelayMs: number
  /** The same call once it finishes — done, collapsed, expandable. */
  toolDone: ToolCall
  artifactDelayMs: number
  /** Progress once the turn settles — all phases done, collapsed summary. */
  progressSettled: ProgressBlockData
  artifact: ArtifactBlockData
  answerDelayMs: number
  answer: AnswerBlockData
  /** After the answer: the turn settles and the composer unlocks. */
  settleDelayMs: number
}

/** One STAGED scripted turn (spec §Live mock v2 — staged interactive):
 * the run advances on timers up to an explicit WAIT point, then parks —
 * no further steps are scheduled until the user decides. Wait point #1
 * is the OUTSTANDING approval gate (the only way forward is choosing);
 * wait point #2 is the interactive plan (Approve plan / Request
 * changes). Each decision branches the continuation. */
export interface LiveStagedScript {
  /** After send: the bubble flips Sending… → sent + timestamp. */
  sentDelayMs: number
  /** After sent: the typing indicator appears. */
  typingDelayMs: number
  /** After typing starts: the agent turn opens with understanding prose. */
  openDelayMs: number
  understanding: AnswerBlockData
  /** After understanding: the approval gate appears OUTSTANDING and the
   * run parks — WAIT POINT #1 (the composer stays locked). */
  gateDelayMs: number
  gate: ApprovalGateBlockData
  /** Gate allowed (once / always): the decision settles visibly, brief
   * typing, then the interactive plan appears — WAIT POINT #2. */
  allowTypingDelayMs: number
  planDelayMs: number
  plan: PlanBlockData
  /** Plan approved → the execution leg runs to completion. */
  execution: LiveExecutionScript
  /** Gate denied → short polite prose (no execution), turn ends, unlock. */
  deny: LiveClosingScript
  /** Plan "Request changes" → agent asks what to change, turn ends,
   * unlock (the user can send the changes as a new message). */
  requestChanges: LiveClosingScript
}

/** The staged follow-up turn for the composer flow (spec §Live mock v2):
 * the user asks to re-verify the overnight-shift fix from PR #1301, and
 * the agent PAUSES for approval before touching the sandbox — first at
 * the approval gate, then at the plan — before replaying the subset,
 * refreshing the report to v1.1, and answering. */
export const LIVE_TURN_SCRIPT: LiveStagedScript = {
  sentDelayMs: 450,
  typingDelayMs: 900,
  openDelayMs: 1500,
  understanding: {
    paragraphs: [
      'Got it — I’ll re-verify the overnight-shift boundary fix from `PR #1301` against the August sample: the 37 records that previously landed on the wrong day, plus one fresh sandbox replay to confirm the corrected boundary holds.',
      'No production writes this time — the replay stays inside the sandbox, and I’ll ask for your approval before anything runs.',
    ],
  },
  gateDelayMs: 1000,
  gate: {
    action:
      'Replay sandbox batch att-2026-0815 (overnight subset · 37 records) and write the refreshed verification evidence into the session sandbox',
    rows: [
      { label: 'Target', value: 'bsi-hris · sandbox', mono: true },
      { label: 'Scope', value: '37 overnight-shift records, 2026-08-01 through 2026-08-14' },
      { label: 'Estimated cost', value: '~2 min replay · no production data touched' },
      { label: 'Rollback path', value: 'sandbox-attendance-reset.sh runs before every batch', mono: true },
    ],
    consequence:
      'The replay writes attendance payloads into the shared sandbox. Once the batch id is consumed it cannot be replayed — an interrupted run requires resetting the sandbox and re-importing the sample, and partial replay results must not be treated as evidence.',
  },
  allowTypingDelayMs: 600,
  planDelayMs: 1400,
  plan: {
    steps: [
      {
        id: 'live-step-replay',
        verb: 'Replay',
        target: 'sandbox batch att-2026-0815 (overnight subset)',
        targetMono: true,
        agent: 'Engineering',
        estimate: '~2 min',
      },
      {
        id: 'live-step-reconcile',
        verb: 'Reconcile',
        target: 'replayed records vs attendance_records',
        targetMono: true,
        agent: 'Engineering',
        estimate: '~1 min',
      },
      {
        id: 'live-step-report',
        verb: 'Refresh',
        target: 'docs/attendance-review-report.md → v1.1',
        targetMono: true,
        agent: 'PM',
        estimate: '~1 min',
      },
    ],
    totalEstimate: '~4 min',
  },
  execution: {
    progressDelayMs: 900,
    progress: {
      elapsed: '00:00',
      phases: [
        { id: 'live-phase-replay', label: 'Replay overnight subset (37 records)', state: 'active' },
        { id: 'live-phase-reconcile', label: 'Reconcile against attendance_records', state: 'queued' },
      ],
    },
    toolRunningDelayMs: 1400,
    toolRunning: {
      id: 'live-replay',
      verb: 'replay',
      target: 'sandbox batch att-2026-0815 (overnight subset · 37 records)',
      state: 'running',
    },
    toolDoneDelayMs: 1600,
    toolDone: {
      id: 'live-replay',
      verb: 'replay',
      target: 'sandbox batch att-2026-0815 (overnight subset · 37 records)',
      state: 'done',
      duration: '1m 12s',
      result: '37/37 overnight records land on their shift start day — 0 boundary mismatches',
      io: {
        input: 'att-replay run --batch att-2026-0815 --filter overnight --env sandbox',
        output: [
          'replayed 37 records (overnight shifts, 2026-08-01 .. 2026-08-14)',
          'boundary mismatches: 0 (was 37 before PR #1301)',
          'duplicate event ids skipped: 4',
          'PASS',
        ],
      },
    },
    artifactDelayMs: 1100,
    progressSettled: {
      elapsed: '2m 05s',
      phases: [
        { id: 'live-phase-replay', label: 'Replay overnight subset (37 records)', state: 'done', duration: '1m 12s' },
        { id: 'live-phase-reconcile', label: 'Reconcile against attendance_records', state: 'done', duration: '0m 53s' },
      ],
    },
    artifact: {
      badge: 'REPORT',
      title: 'Review report — attendance integration',
      excerpt: 'Refreshed verification evidence: the PR #1301 boundary fix replayed against the 37 affected overnight records.',
      schema: [
        '## Verification (v1.1)',
        '+ replay att-2026-0815 — 37/37 overnight records on the correct day',
        '+ reconciliation vs attendance_records — 0 mismatches',
        '## Sign-off',
        '+ v1 finding closed; report supersedes v1 for the Friday sign-off',
      ],
      version: 'v1.1',
      time: '15:12',
      copyPayload: [
        '# Review report — attendance integration (v1.1)',
        '',
        '## Verification of PR #1301',
        'Replay batch att-2026-0815 (overnight subset, 37 records):',
        '37/37 records now land on their shift start day; reconciliation',
        'against attendance_records reports 0 mismatches.',
      ].join('\n'),
    },
    answerDelayMs: 1300,
    answer: {
      paragraphs: [
        'Verified — the boundary fix holds. All 37 overnight-shift records from the August sample now land on their shift start day, and the replay reconciled 37/37 against `attendance_records` with zero mismatches. Duplicate check-ins still skip cleanly, so idempotency is intact.',
        'The refreshed report (v1.1) is attached above — it supersedes v1 for the sign-off. From my side the release is ready for Friday once you countersign.',
      ],
    },
    settleDelayMs: 900,
  },
  deny: {
    typingDelayMs: 600,
    answerDelayMs: 1000,
    answer: {
      paragraphs: [
        'Understood — I won’t run the replay. Nothing was executed and nothing was written; the session sandbox is untouched.',
        'The verification stays ready whenever you want it — send another message and I’ll pick it up from here.',
      ],
    },
    settleDelayMs: 800,
  },
  requestChanges: {
    typingDelayMs: 600,
    answerDelayMs: 1000,
    answer: {
      paragraphs: [
        'Happy to adjust — tell me what to change in the plan (steps, targets, or estimates) and I’ll bring a revised plan for your approval before anything runs.',
      ],
    },
    settleDelayMs: 800,
  },
}

// ── Live turn scripts v3 — progressive continuation (spec §Live mock v3) ──

/** The execution leg of the DEEP continuation turn: live progress →
 * MULTI-TOOL execution (two tool rows — the first running→done, the
 * second queued→running→done) → a fresh REVIEW FINDING → a short fix
 * tool call → settled progress + the bumped artifact → the final
 * answer → unlock. */
export interface LiveDeepExecutionScript {
  progressDelayMs: number
  progress: ProgressBlockData
  tool1RunningDelayMs: number
  /** Tool row #1 as it first appears — running, open, animated. */
  tool1Running: ToolCall
  tool1DoneDelayMs: number
  /** Tool row #1 once finished — done, collapsed, expandable. */
  tool1Done: ToolCall
  tool2QueuedDelayMs: number
  /** Tool row #2 as it first appears — QUEUED behind the first. */
  tool2Queued: ToolCall
  tool2RunningDelayMs: number
  tool2Running: ToolCall
  tool2DoneDelayMs: number
  tool2Done: ToolCall
  reviewDelayMs: number
  /** The fresh review finding surfaced mid-execution (High severity). */
  review: ReviewFindingBlockData
  fixRunningDelayMs: number
  /** The short fix tool call — running, open. */
  fixRunning: ToolCall
  fixDoneDelayMs: number
  fixDone: ToolCall
  artifactDelayMs: number
  /** Progress once the turn settles — all phases done, collapsed summary. */
  progressSettled: ProgressBlockData
  artifact: ArtifactBlockData
  answerDelayMs: number
  answer: AnswerBlockData
  /** After the answer: the turn settles and the composer unlocks. */
  settleDelayMs: number
}

/** The SECOND-send DEEP continuation script (spec §Live mock v3): the
 * agent knows the context now, so the turn is richer — typing → an
 * INTERACTIVE clarification (two questions, answer chips) that WAITS
 * with the composer locked (same parking pattern as the gate) → the
 * chosen answers insert as a user bubble → brief typing → a REVISED
 * plan that waits (Approve plan / Request changes) → the multi-tool
 * execution leg above. Request changes closes politely like v2. */
export interface LiveDeepContinuationScript {
  /** After send: the bubble flips Sending… → sent + timestamp. */
  sentDelayMs: number
  typingDelayMs: number
  /** After typing: the interactive clarification appears and the run
   * parks — WAIT POINT (the composer stays locked until every question
   * is answered via the chips). */
  clarDelayMs: number
  clarification: ClarificationBlockData
  /** All questions answered → the chosen options insert as a USER
   * BUBBLE (the page's inserted-answer pattern). */
  answerDelayMs: number
  briefTypingDelayMs: number
  planDelayMs: number
  /** The REVISED plan — waits at its own wait point like the v2 plan. */
  revisedPlan: PlanBlockData
  execution: LiveDeepExecutionScript
  /** Revised plan "Request changes" → polite closing, unlock (like v2). */
  requestChanges: LiveClosingScript
}

/** The LIGHT follow-up script (third send and every other one after):
 * typing → a single tool call running→done → a short answer → unlock.
 * NO wait points — the whole turn completes on timers alone. */
export interface LiveLightFollowUpScript {
  sentDelayMs: number
  typingDelayMs: number
  /** After typing: the one tool call appears RUNNING (open, animated). */
  toolRunningDelayMs: number
  toolRunning: ToolCall
  toolDoneDelayMs: number
  toolDone: ToolCall
  answerDelayMs: number
  answer: AnswerBlockData
  settleDelayMs: number
}

/** Turn 2 (second send) — DEEP CONTINUATION: the user reports the
 * night-shift payroll export still looks wrong and asks for a retry-path
 * audit. The agent asks two targeted questions via answer chips (duplicate
 * policy + failure window), then brings a REVISED plan; approval runs the
 * multi-tool audit: a code read, a queued→running→done sandbox replay, a
 * HIGH review finding (retry dedupe window shorter than the MyTok p99 —
 * slow responses double-write attendance windows), a short fix call, and
 * the report refreshed to a new version. */
export const LIVE_DEEP_CONTINUATION_SCRIPT: LiveDeepContinuationScript = {
  sentDelayMs: 450,
  typingDelayMs: 900,
  clarDelayMs: 1400,
  clarification: {
    pausedNotice:
      'Execution is paused until both answers land — the retry audit does not start in the meantime.',
    resumedNotice:
      'Both answers received — the retry audit continues with the confirmed duplicate policy and failure window.',
    questions: [
      {
        id: 'q-retry-policy',
        question:
          'When the same MyTok check-in event id is delivered twice — for example after a mobile retry — what should the sync do with the second delivery?',
        options: ['Skip as duplicate', 'Overwrite with the newest', 'Quarantine for review'],
      },
      {
        id: 'q-failure-window',
        question: 'Which delivery-failure window should the retry audit cover?',
        options: ['Last 7 days', 'August sample only (1,284)', 'Full July–August'],
      },
    ],
  },
  answerDelayMs: 600,
  briefTypingDelayMs: 500,
  planDelayMs: 1400,
  revisedPlan: {
    steps: [
      {
        id: 'deep-step-audit',
        verb: 'Audit',
        target: 'services/attendance-sync/syncClient.ts (retry + dedupe)',
        targetMono: true,
        agent: 'Engineering',
        estimate: '~10 min',
        risk: 'the dedupe helper is shared with the leave-sync importer',
      },
      {
        id: 'deep-step-replay',
        verb: 'Replay',
        target: 'sandbox batch att-2026-0816 (slow-response subset · 9 events)',
        targetMono: true,
        agent: 'Engineering',
        estimate: '~3 min',
      },
      {
        id: 'deep-step-fix',
        verb: 'Patch',
        target: 'pr-1302 · syncClient.ts dedupe window 30s → 60s',
        targetMono: true,
        agent: 'Engineering',
        estimate: '~10 min',
      },
      {
        id: 'deep-step-report',
        verb: 'Refresh',
        target: 'docs/attendance-review-report.md (new version)',
        targetMono: true,
        agent: 'PM',
        estimate: '~5 min',
      },
    ],
    totalEstimate: '~28 min',
  },
  execution: {
    progressDelayMs: 900,
    progress: {
      elapsed: '00:00',
      phases: [
        { id: 'deep-phase-audit', label: 'Audit the retry + dedupe path', state: 'active' },
        { id: 'deep-phase-replay', label: 'Replay slow-response subset (9 events)', state: 'queued' },
        { id: 'deep-phase-fix', label: 'Patch + regression-test the dedupe window', state: 'queued' },
      ],
    },
    tool1RunningDelayMs: 1300,
    tool1Running: {
      id: 'deep-read-syncclient',
      verb: 'read',
      target: 'services/attendance-sync/syncClient.ts:24-38',
      state: 'running',
    },
    tool1DoneDelayMs: 1400,
    tool1Done: {
      id: 'deep-read-syncclient',
      verb: 'read',
      target: 'services/attendance-sync/syncClient.ts:24-38',
      state: 'done',
      duration: '0.3s',
      result:
        'Dedupe window is 30 s while the MyTok p99 response time is 45 s — slow responses double-write attendance windows',
      io: {
        input: 'sed -n 24,38p services/attendance-sync/syncClient.ts',
        output: [
          'const DEDUPE_WINDOW_MS = 30_000;',
          'async function ingest(event: CheckinEvent) {',
          '  if (seen(event.id)) return SKIP; // dedupe window: 30s',
          '  const window = await mytokFetchWindow(event.windowId);',
          '  await writeAttendance(window); // no idempotency key on re-ingest',
        ],
      },
    },
    tool2QueuedDelayMs: 700,
    tool2Queued: {
      id: 'deep-replay-retries',
      verb: 'replay',
      target: 'sandbox batch att-2026-0816 (slow-response subset · 9 events)',
      state: 'queued',
    },
    tool2RunningDelayMs: 900,
    tool2Running: {
      id: 'deep-replay-retries',
      verb: 'replay',
      target: 'sandbox batch att-2026-0816 (slow-response subset · 9 events)',
      state: 'running',
    },
    tool2DoneDelayMs: 1500,
    tool2Done: {
      id: 'deep-replay-retries',
      verb: 'replay',
      target: 'sandbox batch att-2026-0816 (slow-response subset · 9 events)',
      state: 'done',
      duration: '1m 06s',
      result: '9/9 slow events replayed — 3 double-wrote attendance windows before the fix',
      io: {
        input: 'att-replay run --batch att-2026-0816 --filter slow-response --env sandbox',
        output: [
          'replayed 9 events (responses > 30 s, 2026-08-08 .. 2026-08-14)',
          'double-writes observed: 3 (windows 0811-A, 0812-C, 0814-F)',
          'duplicate event ids skipped inside the window: 6',
        ],
      },
    },
    reviewDelayMs: 1000,
    review: {
      severity: 'High',
      title: 'Retry dedupe window shorter than the MyTok p99 SLA: slow responses double-write attendance',
      impact:
        'The sync dedupes by event id for only 30 s, while MyTok’s p99 response time is 45 s — a slow response that eventually succeeds after the window closes writes the same check-in window twice. The replay shows 3 of 9 slow events double-writing attendance windows, inflating night-shift totals in the payroll export.',
      location: 'services/attendance-sync/syncClient.ts:31',
      quote: 'if (seen(event.id)) return SKIP // dedupe window: 30s (MyTok p99: 45s)',
    },
    fixRunningDelayMs: 800,
    fixRunning: {
      id: 'deep-patch-window',
      verb: 'patch',
      target: 'pr-1302 · syncClient.ts dedupe window 30s → 60s',
      state: 'running',
    },
    fixDoneDelayMs: 1200,
    fixDone: {
      id: 'deep-patch-window',
      verb: 'patch',
      target: 'pr-1302 · syncClient.ts dedupe window 30s → 60s',
      state: 'done',
      duration: '3m 18s',
      result: 'Dedupe window widened to 60 s · 14 regression tests pass · sandbox re-replay reconciles 9/9',
      io: {
        input: 'patch pr-1302 --window 60s --test attendance.boundary+retry',
        output: [
          '- const DEDUPE_WINDOW_MS = 30_000;',
          '+ const DEDUPE_WINDOW_MS = 60_000; // MyTok p99 SLA: 45s',
          'tests: 14 passed (0 failed) · re-replay: 9/9 reconciled',
        ],
      },
    },
    artifactDelayMs: 1000,
    progressSettled: {
      elapsed: '15m 12s',
      phases: [
        { id: 'deep-phase-audit', label: 'Audit the retry + dedupe path', state: 'done', duration: '8m 44s' },
        { id: 'deep-phase-replay', label: 'Replay slow-response subset (9 events)', state: 'done', duration: '1m 06s' },
        { id: 'deep-phase-fix', label: 'Patch + regression-test the dedupe window', state: 'done', duration: '5m 22s' },
      ],
    },
    artifact: {
      badge: 'REPORT',
      title: 'Review report — attendance integration',
      excerpt:
        'Refreshed with the retry-path audit: the slow-response replay, the double-write finding, and the verified dedupe-window fix — supersedes the previous version for the Friday sign-off.',
      schema: [
        '## Retry-path audit',
        '+ replay att-2026-0816 — 9/9 slow events, 3 double-writes observed',
        '## Findings',
        '+ High — dedupe window 30 s < MyTok p99 45 s (syncClient.ts:31), fixed on pr-1302',
        '## Sign-off',
        '+ both findings verified; report supersedes the previous version',
      ],
      version: 'v2',
      time: '15:31',
      copyPayload: [
        '# Review report — attendance integration (retry audit)',
        '',
        '## Retry-path audit',
        'Replay batch att-2026-0816 (slow-response subset, 9 events):',
        '3 events double-wrote attendance windows before the fix;',
        'after pr-1302 widens the dedupe window to 60 s, the re-replay',
        'reconciles 9/9 and 14 regression tests pass.',
      ].join('\n'),
    },
    answerDelayMs: 1300,
    answer: {
      paragraphs: [
        'The deeper pass surfaced a second real defect. The retry dedupe window (30 s) is shorter than MyTok’s 45 s p99 response time, so 3 of the 9 replayed slow responses double-wrote attendance windows — High, `syncClient.ts:31`. Per your answers I treated the second delivery as a duplicate skip and audited the last 7 days of delivery failures; the fix on `pr-1302` widens the window to 60 s and is locked behind 14 regression tests, and the sandbox re-replay now reconciles 9/9.',
        'The refreshed report (v2) is attached above — it supersedes the previous version for the Friday sign-off and now carries both the boundary finding and this retry finding with the replay evidence.',
      ],
    },
    settleDelayMs: 900,
  },
  requestChanges: {
    typingDelayMs: 600,
    answerDelayMs: 1000,
    answer: {
      paragraphs: [
        'Happy to rework the revised plan — tell me which steps to change (audit scope, replay subset, or the fix approach) and I’ll bring it back for your approval before anything runs. Nothing has executed yet.',
      ],
    },
    settleDelayMs: 800,
  },
}

/** Turn 3 (third send, then every other one) — LIGHT FOLLOW-UP: a quick
 * sanity question about leftover duplicate check-ins gets one tool call
 * and a short answer. No waits, no plan, no gate — the turn completes on
 * timers alone. */
export const LIVE_LIGHT_FOLLOWUP_SCRIPT: LiveLightFollowUpScript = {
  sentDelayMs: 450,
  typingDelayMs: 800,
  toolRunningDelayMs: 1200,
  toolRunning: {
    id: 'light-scan-dupes',
    verb: 'scan',
    target: 'mytok-sync-logs-aug.csv (duplicate event ids)',
    state: 'running',
  },
  toolDoneDelayMs: 1300,
  toolDone: {
    id: 'light-scan-dupes',
    verb: 'scan',
    target: 'mytok-sync-logs-aug.csv (duplicate event ids)',
    state: 'done',
    duration: '0.9s',
    result: '4 duplicate event ids — all skipped cleanly after the window fix; idempotency holds',
    io: {
      input: 'scan mytok-sync-logs-aug.csv --report duplicates',
      output: [
        'rows scanned: 1,284',
        'duplicate event ids: 4 (all inside the widened 60 s window)',
        'double-writes: 0',
      ],
    },
  },
  answerDelayMs: 1000,
  answer: {
    paragraphs: [
      'Quick check done — the August sample still contains 4 duplicate event ids, and every one of them now skips cleanly inside the widened 60 s window. No double-writes remain, so idempotency holds and nothing else needs attention before Friday.',
    ],
  },
  settleDelayMs: 700,
}
