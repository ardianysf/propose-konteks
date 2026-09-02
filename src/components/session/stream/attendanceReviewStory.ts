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
 * steps): user request bubble with attachment cards → agent understanding
 * prose → clarification prose (settled, answers recorded) → user answer
 * bubble → plan (approved) → approval gate (settled: Allow once) →
 * progress collapsed to a one-line summary → tool batch collapsed (all
 * done — including the scan that ran live during the session) → review
 * finding → artifact chip → agent final answer → completion handoff.
 * Timestamps are monotonic and realistic (14:02 → 15:03).
 *
 * LIVE_TURN_SCRIPT drives the composer flow: when the user sends a
 * message, the page plays it back step by step (typing → understanding →
 * tool call running→done → progress → artifact chip v1.1 → final
 * answer), with per-step delays in the 450–1600ms band.
 */
import type {
  AnswerBlockData,
  ArtifactBlockData,
  ProgressBlockData,
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
        'Got it — you need the attendance integration reviewed end to end before the release so Monday’s payroll cut-off can trust MyTok check-ins. I’ll trace the sync worker in bsi-hris, audit the timezone and idempotency handling, replay a sample batch in the sandbox, and deliver a findings report. Production stays untouched unless you approve a specific fix.',
      scopeIn: [
        'Attendance sync worker and shift-boundary handling in bsi-hris',
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
  // 3 — Clarification (settled: answers recorded, no live chips).
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
            'Which day owns a MyTok check-in when an overnight shift crosses midnight — the check-in device’s local time, or the HRIS server timezone (Asia/Jakarta)?',
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
  // 4 — User answer bubble.
  {
    kind: 'request',
    data: {
      intent: 'Boundary + window answers',
      message:
        '1. HRIS server time (Asia/Jakarta) — the business day follows the server timezone, per spec rev 4 §3.1.\n2. August sample only (1,284 records) — keep July out of this pass.',
      chips: [],
    },
  },
  // 5 — Plan (settled approved; the page renders it approved).
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
  // 6 — Approval gate (settled: Allow once; the page renders it decided).
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
  // 7 — Progress (collapsed one-line summary in history).
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
  // 8 — Tool evidence batch (all settled; the scan ran live mid-session).
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
  // 9 — Review finding.
  {
    kind: 'review',
    data: {
      severity: 'High',
      title: 'Timezone drift: overnight shifts land on the wrong attendance day',
      impact:
        'The shift boundary is derived from UTC while the business day runs on Asia/Jakarta: a check-in at 23:40 Jakarta time on an overnight shift is recorded on the previous day in HRIS. The August sample shows 37 such records — enough to shift overtime and payroll totals for night-shift employees.',
      location: 'services/attendance-sync/shiftBoundary.ts:47',
      quote: 'const day = utcDateOf(event.checkinAt) // business day derived from UTC, not Asia/Jakarta',
    },
  },
  // 10 — Artifact chip (report v1).
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
  // 11 — Agent final answer (conversational prose).
  {
    kind: 'answer',
    data: {
      paragraphs: [
        'Here’s where the review landed. The sync path itself is sound — the worker is the only writer of attendance records and retries are idempotent, so duplicate check-ins skip cleanly. The real defect is the shift boundary: it derives the business day from UTC while the business runs on Asia/Jakarta, so 37 of the 1,284 August records landed on the wrong attendance day (High — shiftBoundary.ts:47).',
        'I patched the boundary to derive from Asia/Jakarta per spec rev 4 §3.1 and locked it behind 26 passing regression tests; the sandbox replay then reconciled the full sample with zero mismatches. The Medium retry-window finding is real but separable — I’ve tracked it for the next release rather than widening this session.',
      ],
    },
  },
  // 12 — Completion handoff.
  {
    kind: 'completion',
    data: {
      done: [
        'Sync path traced end to end — the worker is the only writer of attendance records, and retries are idempotent (duplicate event ids skip cleanly)',
        'High finding verified and fixed: the shift boundary now derives from Asia/Jakarta per spec rev 4 §3.1, locked behind 26 passing regression tests',
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
        'Cherry-pick the boundary fix into the release branch (2.9.x)',
        'Schedule the pre-July backfill audit as its own session if requested',
      ],
      rollback:
        'Revert PR #1301 — the boundary helper returns to UTC derivation. The sandbox needs no rollback (it resets before every batch), and no production records were written.',
      receipt:
        'Session SES-2026-0121 · 6 tool calls logged · 2 artifacts · 38m 27s elapsed · receipt R-0121',
    },
  },
]

// ── Live turn script (composer flow) ──────────────────────────────────────

/** One scripted agent turn, played back step by step after a send. Each
 * delay is the gap BEFORE the step appears (spec band: 450–1600ms). */
export interface LiveTurnScript {
  /** After send: the bubble flips Sending… → sent + timestamp. */
  sentDelayMs: number
  /** After sent: the typing indicator appears. */
  typingDelayMs: number
  /** After typing starts: the agent turn opens with understanding prose. */
  openDelayMs: number
  understanding: AnswerBlockData
  toolRunningDelayMs: number
  /** The call as it first appears — running, open, animated. */
  toolRunning: ToolCall
  toolDoneDelayMs: number
  /** The same call once it finishes — done, collapsed, expandable. */
  toolDone: ToolCall
  progressDelayMs: number
  /** Live progress (an active phase; elapsed ticks on the page clock). */
  progress: ProgressBlockData
  /** Progress once the turn settles — all phases done, collapsed summary. */
  progressSettled: ProgressBlockData
  artifactDelayMs: number
  artifact: ArtifactBlockData
  answerDelayMs: number
  answer: AnswerBlockData
  /** After the answer: the turn settles and the composer unlocks. */
  settleDelayMs: number
}

/** The scripted follow-up turn for the composer flow (spec §Live mock):
 * the user asks to verify the overnight-shift fix from PR #1301 and the
 * agent replays the subset, refreshes the report to v1.1, and answers. */
export const LIVE_TURN_SCRIPT: LiveTurnScript = {
  sentDelayMs: 450,
  typingDelayMs: 900,
  openDelayMs: 1500,
  understanding: {
    paragraphs: [
      'Got it — I’ll re-verify the overnight-shift boundary fix from PR #1301 against the August sample: the 37 records that previously landed on the wrong day, plus one fresh sandbox replay to confirm the corrected boundary holds.',
      'No production writes this time — the replay stays inside the sandbox.',
    ],
  },
  toolRunningDelayMs: 1000,
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
  progressDelayMs: 1000,
  progress: {
    elapsed: '00:00',
    phases: [
      { id: 'live-phase-replay', label: 'Replay overnight subset (37 records)', state: 'done', duration: '1m 12s' },
      { id: 'live-phase-reconcile', label: 'Reconcile against attendance_records', state: 'active' },
    ],
  },
  progressSettled: {
    elapsed: '2m 05s',
    phases: [
      { id: 'live-phase-replay', label: 'Replay overnight subset (37 records)', state: 'done', duration: '1m 12s' },
      { id: 'live-phase-reconcile', label: 'Reconcile against attendance_records', state: 'done', duration: '0m 53s' },
    ],
  },
  artifactDelayMs: 1100,
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
      'Verified — the boundary fix holds. All 37 overnight-shift records from the August sample now land on their shift start day, and the replay reconciled 37/37 against attendance_records with zero mismatches. Duplicate check-ins still skip cleanly, so idempotency is intact.',
      'The refreshed report (v1.1) is attached above — it supersedes v1 for the sign-off. From my side the release is ready for Friday once you countersign.',
    ],
  },
  settleDelayMs: 900,
}
