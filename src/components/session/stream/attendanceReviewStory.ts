/*
 * attendanceReviewStory — the stream fixture for the alternative session
 * detail page (spec: .pi/orch/plans/session-stream-detail-spec.md).
 *
 * The session is the "Review attendance integration" entry from
 * mockData.ts (recent id `recent-attendance`, history id
 * `hist-attendance`, system `bsi-hris`): a pre-release review of the
 * MyTok ↔ BSI HRIS attendance integration. Narrative order mirrors the
 * demo story (sessionStreamData.ts): request → acknowledgement →
 * clarification (2 questions) → plan (4 steps) → approval gate (sandbox
 * write access with an irreversible batch id) → live progress (5 phases,
 * middle active) → tool evidence batch 1 (2 done with io, 1 running,
 * 1 queued) → artifact (review report) → review finding (high, timezone
 * drift on overnight shifts) → tool evidence batch 2 (the verified fix)
 * → completion.
 *
 * The exported id/title constants are the mockup-level navigation wiring
 * keys: V2Sidebar and SessionHistoryPage route exactly these entries to
 * the `session-stream-detail` page while every other session keeps the
 * classic `session-detail` route.
 */
import type { StreamStoryEntry } from './sessionStreamTypes'

/** Recent-sessions fixture id that routes to the stream detail page. */
export const ATTENDANCE_REVIEW_RECENT_ID = 'recent-attendance'

/** Session-history fixture id that routes to the stream detail page. */
export const ATTENDANCE_REVIEW_HISTORY_ID = 'hist-attendance'

/** The session title both fixtures share (display + matching key). */
export const ATTENDANCE_REVIEW_TITLE = 'Review attendance integration'

export const ATTENDANCE_REVIEW_STORY: StreamStoryEntry[] = [
  {
    kind: 'request',
    data: {
      intent:
        'Review the MyTok ↔ BSI HRIS attendance integration before Friday’s release. Monday’s payroll cut-off depends on check-in events from the MyTok mobile app landing in HRIS as attendance records: trace the sync path end to end, check timezone and overnight-shift handling, verify idempotency on retries, and report findings with evidence — no production fixes in this session.',
      chips: [
        { label: 'attendance-sync-spec.md (rev 4)', mono: true, kind: 'attachment' },
        { label: 'mytok-sync-logs-aug.csv', mono: true, kind: 'attachment' },
        { label: 'environment: staging', kind: 'parameter' },
        { label: 'bsi-hris · attendance sync worker', mono: true, kind: 'context' },
      ],
    },
  },
  {
    kind: 'acknowledgement',
    data: {
      summary:
        'You need the attendance integration reviewed end to end before the release so Monday’s payroll cut-off can trust MyTok check-ins. I will trace the sync worker in bsi-hris, audit the timezone and idempotency handling, replay a sample batch in the sandbox, and deliver a findings report — production stays untouched unless you approve a specific fix.',
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
    },
  },
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
  {
    kind: 'progress',
    data: {
      elapsed: '24m 10s',
      phases: [
        { id: 'phase-map', label: 'Map the MyTok → HRIS sync path', state: 'done', duration: '6m 12s' },
        { id: 'phase-audit', label: 'Audit shift-boundary and idempotency handling', state: 'done', duration: '17m 48s' },
        { id: 'phase-replay', label: 'Replay sandbox batch att-2026-0814', state: 'active' },
        { id: 'phase-reconcile', label: 'Reconcile against the August sample (1,284 records)', state: 'queued' },
        { id: 'phase-report', label: 'Draft the review report', state: 'queued' },
      ],
    },
  },
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
          state: 'running',
        },
        {
          id: 'call-replay',
          verb: 'replay',
          target: 'sandbox batch att-2026-0814',
          state: 'queued',
        },
      ],
    },
  },
  {
    kind: 'artifact',
    data: {
      badge: 'RESEARCH',
      title: 'Review report — MyTok ↔ BSI HRIS attendance integration',
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
      version: 'v0.4 draft',
      time: '14:41',
      copyPayload: [
        '# Review report — MyTok ↔ BSI HRIS attendance integration',
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
  {
    kind: 'tool',
    data: {
      calls: [
        {
          id: 'call-edit-boundary',
          verb: 'edit',
          target: 'services/attendance-sync/shiftBoundary.ts:44-52',
          state: 'done',
          duration: '0.3s',
          result: 'Boundary now derived from Asia/Jakarta; regression test added',
          io: {
            input: 'apply patch services/attendance-sync/shiftBoundary.ts',
            output: [
              '-  const day = utcDateOf(checkinAt);',
              '+  const day = jakartaDateOf(checkinAt); // spec rev 4 §3.1',
              '+  // regression: tests/attendance.boundary.spec.ts locks the shift window',
            ],
          },
        },
        {
          id: 'call-test-boundary',
          verb: 'test',
          target: 'tests/attendance.boundary.spec.ts',
          state: 'done',
          duration: '3.4s',
          result: '26 passed, 0 failed — overnight-shift boundaries locked',
          io: {
            input: 'vitest run tests/attendance.boundary.spec.ts',
            output: [
              'PASS jakarta overnight shift stays on its start day (14 ms)',
              'PASS check-in at 23:40 does not cross midnight UTC (11 ms)',
              'Test Files  1 passed (1)',
              '     Tests  26 passed (26)',
            ],
          },
        },
      ],
    },
  },
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
        'Schedule the pre-July backfill audit as its own session if requested',
        'Cherry-pick the boundary fix into the release branch (2.9.x)',
      ],
      rollback:
        'Revert PR #1301 — the boundary helper returns to UTC derivation. The sandbox needs no rollback (it resets before every batch), and no production records were written.',
      receipt:
        'Session SES-2026-0121 · 6 tool calls logged · 2 artifacts · 38m 27s elapsed · receipt R-0121',
    },
  },
]
