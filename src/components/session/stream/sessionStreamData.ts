/*
 * sessionStreamData — the full story fixture for the response stream demo.
 *
 * One realistic session, narrative order per the spec: request →
 * acknowledgement → clarification (2 questions) → plan (4 steps) →
 * approval gate (migration with cost + irreversibility) → live progress
 * (5 phases, middle active) → tool evidence batch 1 (2 done with io,
 * 1 running, 1 queued) → artifact (PRD draft) → review finding (medium,
 * contract drift) → tool evidence batch 2 (the fix, done) → agent final
 * answer (conversational prose) → completion.
 *
 * Domain and copy language follow src/data/mockData.ts (English, internal
 * ops world: BSI Canteen, canteen-api, SOP references, Refactory Admin
 * as the user, Konteks agents as actors).
 */
import type { StreamStoryEntry } from './sessionStreamTypes'

export const SESSION_STREAM_STORY: StreamStoryEntry[] = [
  {
    kind: 'request',
    data: {
      intent:
        'Vendor invoices in the canteen portal are off by 1-2 rupiah on tax lines. Finance flagged it during the August close: totals on the printed invoices do not match the stored order amounts. Find where the rounding diverges and fix it so invoice totals reconcile following the rounding rule in SOP-FIN-012.',
      chips: [
        { label: 'invoices-aug-sample.csv', mono: true, kind: 'attachment' },
        { label: 'SOP-FIN-012 (rev 3)', mono: true, kind: 'attachment' },
        { label: 'environment: production', kind: 'parameter' },
        { label: 'canteen-api · invoice service', mono: true, kind: 'context' },
      ],
    },
  },
  {
    kind: 'acknowledgement',
    data: {
      summary:
        'You need the invoice tax rounding corrected so printed totals reconcile with stored order amounts, per SOP-FIN-012. I will trace where the divergence enters the invoice pipeline, patch the rounding rule, and verify against the August sample before touching production data.',
      scopeIn: [
        'Tax rounding on invoice lines and totals in canteen-api',
        'Reconciliation report for the August sample (41 invoices)',
        'Migration for stored invoice totals that diverge',
      ],
      scopeOut: [
        'Rewriting the invoice PDF layout',
        'Backfilling orders older than 2026-06-01',
        'Vendor portal front-end changes',
      ],
      confidence: 'High',
      confidenceNote:
        'SOP-FIN-012 defines the rounding rule explicitly, and the invoice service is the only writer of stored totals — there is a single divergence point to correct.',
      grounding:
        'Grounded in bsi-canteen/canteen-api@main · SOP-FIN-012 (rev 3) · invoices-aug-sample.csv',
    },
  },
  {
    kind: 'clarification',
    data: {
      pausedNotice:
        'Execution is paused until both answers land — nothing runs against production in the meantime.',
      resumedNotice:
        'Both answers received — execution resumed with the confirmed rounding rule and restatement window.',
      questions: [
        {
          id: 'q-rounding',
          question:
            'Which rounding rule should apply to tax lines when the third decimal is exactly 5?',
          options: [
            'Round half up (SOP default)',
            'Bankers rounding (half to even)',
            'Truncate to 2 decimals',
          ],
        },
        {
          id: 'q-window',
          question:
            'Should the fix restate stored totals for invoices that were already issued this month?',
          options: ['Restate August only', 'Restate July and August', 'Leave issued invoices untouched'],
        },
      ],
    },
  },
  {
    kind: 'plan',
    data: {
      steps: [
        {
          id: 'step-trace',
          verb: 'Trace',
          target: 'src/invoicing/**',
          targetMono: true,
          agent: 'Analysis',
          estimate: '~10 min',
        },
        {
          id: 'step-patch',
          verb: 'Patch',
          target: 'src/invoicing/rounding.ts',
          targetMono: true,
          agent: 'Engineering',
          estimate: '~25 min',
          risk: 'shared helper also used by the reports job',
        },
        {
          id: 'step-verify',
          verb: 'Verify',
          target: 'tests/invoice.rounding.spec.ts',
          targetMono: true,
          agent: 'QA',
          estimate: '~15 min',
        },
        {
          id: 'step-draft',
          verb: 'Draft',
          target: 'docs/prd-tax-rounding.md',
          targetMono: true,
          agent: 'PM',
          estimate: '~10 min',
        },
      ],
      totalEstimate: '~60 min',
    },
  },
  {
    kind: 'approval-gate',
    data: {
      action: 'Run migration 20260901_tax_rounding_mode.sql on canteen-api (production)',
      rows: [
        { label: 'Target', value: 'canteen-api · production', mono: true },
        { label: 'Scope', value: '412 invoice rows, 2026-07-01 through 2026-08-31' },
        { label: 'Estimated cost', value: '~40 s write lock on invoices · ~3 min total' },
        { label: 'Rollback path', value: 'snapshot invoices-20260831 taken before apply', mono: true },
      ],
      consequence:
        'This migration rewrites stored invoice totals in place. Once applied, previous totals can only be recovered from the pre-migration snapshot — re-running the migration will not undo it.',
    },
  },
  {
    kind: 'progress',
    data: {
      elapsed: '31m 12s',
      phases: [
        { id: 'phase-trace', label: 'Trace invoice totals pipeline', state: 'done', duration: '8m 32s' },
        { id: 'phase-patch', label: 'Patch taxRounding helper and call sites', state: 'done', duration: '21m 45s' },
        { id: 'phase-migrate', label: 'Run migration 20260901_tax_rounding_mode.sql', state: 'active' },
        { id: 'phase-verify', label: 'Verify against August sample (41 invoices)', state: 'queued' },
        { id: 'phase-draft', label: 'Draft PRD and handoff notes', state: 'queued' },
      ],
    },
  },
  {
    kind: 'tool',
    data: {
      calls: [
        {
          id: 'call-grep-rounding',
          verb: 'grep',
          target: 'src/invoicing/**',
          state: 'done',
          duration: '0.4s',
          result: '3 call sites found: calculateTotals, applyTax, recalcInvoice',
          io: {
            input: 'rg -n "round(" src/invoicing --type ts',
            output: [
              'src/invoicing/totals.ts:112:  const tax = round(base * rate, 2)',
              'src/invoicing/tax.ts:48:  return Math.round(amount * 100) / 100',
              'src/invoicing/recalc.ts:77:  totals.tax = round2(taxBase)',
            ],
          },
        },
        {
          id: 'call-read-tax',
          verb: 'read',
          target: 'src/invoicing/tax.ts:40-64',
          state: 'done',
          duration: '0.2s',
          result: 'Confirmed: tax.ts truncates via toFixed(2) before the totals split',
          io: {
            input: 'sed -n 40,64p src/invoicing/tax.ts',
            output: [
              'export function applyTax(amount: number, rate: number) {',
              '  const scaled = amount * rate;',
              '-  const rounded = Number(scaled.toFixed(2));',
              '+  const rounded = roundHalfUp(scaled, 2);',
              '  return rounded;',
              '}',
            ],
          },
        },
        {
          id: 'call-scan-sample',
          verb: 'scan',
          target: 'invoices-aug-sample.csv (41 rows)',
          state: 'running',
        },
        {
          id: 'call-migrate',
          verb: 'migrate',
          target: 'db/migrations/20260901_tax_rounding_mode.sql',
          state: 'queued',
        },
      ],
    },
  },
  {
    kind: 'artifact',
    data: {
      badge: 'PRD',
      title: 'PRD — Canteen invoice tax rounding correction',
      excerpt:
        'Product requirements for correcting tax-line rounding on canteen vendor invoices: the rounding rule, the restatement window for issued invoices, and the rollout notes for the August close.',
      schema: [
        '## Rounding rule',
        '- Old: truncate(scaled, 2) via toFixed',
        '+ New: roundHalfUp(scaled, 2) per SOP-FIN-012 §4.2',
        '## Restatement window',
        '+ August 2026 only — 412 invoices',
        '+ Snapshot before apply: invoices-20260831',
        '## Rollout',
        '+ Ship behind flag TAX_ROUNDING_V2 for one billing day',
      ],
      version: 'v0.3 draft',
      time: '09:33',
      copyPayload: [
        '# PRD — Canteen invoice tax rounding correction',
        '',
        '## Problem',
        'Vendor invoices are off by 1-2 rupiah on tax lines; printed totals',
        'diverge from stored order amounts during the August close.',
        '',
        '## Rounding rule',
        'Old: truncate(scaled, 2) via toFixed.',
        'New: roundHalfUp(scaled, 2) per SOP-FIN-012 §4.2.',
        '',
        '## Restatement window',
        'August 2026 only — 412 invoices. Snapshot invoices-20260831 is',
        'taken before the migration applies.',
        '',
        '## Rollout',
        'Ship behind flag TAX_ROUNDING_V2 for one billing day, then remove',
        'the flag in the following release.',
      ].join('\n'),
    },
  },
  {
    kind: 'review',
    data: {
      severity: 'Medium',
      title: 'Contract drift: invoice totals response shape',
      impact:
        'The rounding patch lets totals.tax serialize as a string in JSON responses whenever the half-up path triggers, silently breaking the mobile client’s sum validation against the documented number contract.',
      location: 'src/invoicing/http/serializer.ts:87',
      quote:
        'if (halfUpApplied) totals.tax = totals.tax.toFixed(2) // leaks string into the API contract',
    },
  },
  {
    kind: 'tool',
    data: {
      calls: [
        {
          id: 'call-edit-serializer',
          verb: 'edit',
          target: 'src/invoicing/http/serializer.ts:84-90',
          state: 'done',
          duration: '0.3s',
          result: 'Tax now serialized as number; contract test added',
          io: {
            input: 'apply patch src/invoicing/http/serializer.ts',
            output: [
              '-  if (halfUpApplied) totals.tax = totals.tax.toFixed(2)',
              '+  if (halfUpApplied) totals.tax = roundHalfUp(totals.tax, 2)',
              '+  // contract: totals.tax stays number — see contract.tax.spec.ts',
            ],
          },
        },
        {
          id: 'call-test-contract',
          verb: 'test',
          target: 'tests/contract.tax.spec.ts',
          state: 'done',
          duration: '2.1s',
          result: '18 passed, 0 failed — tax contract locked',
          io: {
            input: 'vitest run tests/contract.tax.spec.ts',
            output: [
              'PASS serializes totals.tax as number (12 ms)',
              'PASS keeps 2-decimal precision after half-up (9 ms)',
              'Test Files  1 passed (1)',
              '     Tests  18 passed (18)',
            ],
          },
        },
      ],
    },
  },
  // 11 — Agent final answer (conversational prose — the turn that
  // carries the hover footer; spec refinements v2 #4).
  {
    kind: 'answer',
    data: {
      paragraphs: [
        'Here’s where the rounding fix landed. The divergence traced to a single point — src/invoicing/tax.ts truncated the scaled amount with toFixed(2) before the totals split, so every half-cent fell away instead of rounding half up per SOP-FIN-012 §4.2. The patch swaps the helper at all three call sites, the migration restated the 412 August invoices, and the sample now reconciles line for line.',
        'The serializer drift the review caught is fixed and locked behind 18 contract tests, and the PRD is ready for finance. Production has been quiet since the snapshot — nothing else needs your attention before sign-off.',
      ],
    },
  },
  {
    kind: 'completion',
    data: {
      done: [
        'Tax rounding now follows SOP-FIN-012 §4.2 (round half up) across all three call sites',
        'Migration 20260901 applied — 412 August invoices restated and reconciled against the sample CSV',
        'Contract drift on totals.tax fixed and locked behind 18 passing contract tests',
        'PRD drafted for the finance review',
      ],
      notDone: [
        'July invoices left untouched — out of scope per the clarification answer',
        'Vendor portal display of restated totals — needs its own session',
      ],
      artifacts: [
        { label: 'PR #1289', mono: true },
        { label: 'docs/prd-tax-rounding.md', mono: true },
        { label: 'Test report — contract.tax', mono: true },
      ],
      nextActions: [
        'Finance signs off the restated August totals against SOP-FIN-012',
        'Schedule the July restatement as its own session if requested',
        'Cherry-pick the serializer guard into the release branch (2.14.x)',
      ],
      rollback:
        'Restore snapshot invoices-20260831, then revert PR #1289 — stored totals return to pre-migration values; no schema change is involved.',
      receipt:
        'Session SES-2026-0117 · 6 tool calls logged · 2 artifacts · 47m 03s elapsed · receipt R-0117',
    },
  },
]
