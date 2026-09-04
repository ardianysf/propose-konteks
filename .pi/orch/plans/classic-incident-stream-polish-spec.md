# Spec — Classic Session Detail Incident Stream Polish

Repo: `/Users/ardian/AllJobs/Konteks`. Approved direction: operational incident stream for the classic session detail. This is a refinement of the existing page, not a redesign.

## Objective
Make the classic session detail for `SES-2026-0042` read like a real operational incident stream while preserving existing page chrome, fixture facts, stream component contracts, and source-order mapping.

## Source evidence / paths
- `src/pages/SessionDetailPage.tsx` — current timeline→stream mapping, delivery artifact tokens, header/tracker/composer composition.
- `src/data/mockData.ts` (`SESSION_DETAIL`) — session title, repo/branch/issue, quotes `Q-101`/`Q-102`, delivery artifacts, timeline facts `T-001…T-016`.
- `src/components/session/stream/blocks/ErrorBlock.tsx`
- `src/components/session/stream/blocks/EstimateBlock.tsx`
- `src/components/session/stream/SessionStream.css`
- `src/catalog/registry.tsx` (`streamErrorPreview`, `streamEstimatePreview`) — collapsed preview expectations.

## Scope in
- Polish the classic `SessionDetailPage.tsx` incident arc and stream grouping so it reads as: request + log attachment → acknowledgement / session-created context → diagnosis → transient runner timeout → retry-success answer → approval → delivery evidence → follow-up decision.
- Polish `ErrorBlock` / `EstimateBlock` visual treatment in their existing TSX + `SessionStream.css`, and keep catalog previews aligned.
- Allow semantic wording/order cleanup only where needed to support the approved arc; do not alter any fixture fact or value.

## Explicit non-goals
- No new routes, reducer behavior, block kinds, backend logic, or page layout redesign.
- No new global color tokens.
- No changes to the factual substance of `SESSION_DETAIL`.
- No work on `SessionStreamDetailPage`, task session pages, or unrelated catalog surfaces.

## Approved behavior
1. **Incident arc and factual bounds**
   - Keep existing page chrome unchanged: `SessionHeader`, metadata footer chips, `SessionTracker`, `SessionDetailComposer`, and the `role="log"` stream container.
   - The visible sequence must read as: request + attachment, acknowledgement, session-created context, diagnosis, collapsed transient failure, retry-success answer, `Q-101`, approval, delivery started, implementation, delivery evidence, cycle-complete, follow-up recommendation, `Q-102`, waiting approval.
   - Diagnosis content is bounded by existing `T-005` prose only: `ApprovalListQuery` throws NPE when paginating past an empty result set; root cause in `ApprovalListMapper` line `142` where safe navigation operator is missing.
   - The `SESSION_DETAIL` `ERROR` event is bounded by its existing timeout message only. Expanded `ErrorBlock` may show that timeout message plus the existing mapper-owned impact line `Automatically retried by the runner.`
   - The already-existing next assistant answer `All 127 integration tests green` is the proof of retry success.
   - Do not add HTTP status, stack trace, extra file location, alternate root cause, or any invented technical detail.
   - Delivery evidence must come strictly from existing `sessionDetail.delivery.artifacts`: `PR #142`, `commit 9f3c2ab`, `Test Report`, `Receipt R-0057`.

2. **Timeline mapping contract (`T-001…T-016` → 15 rendered slots)**

   | Source | Slot | Rendered form | Contract |
   | --- | --- | --- | --- |
   | `T-001` + `T-002` | 1 | user request + attachment | `T-002` merges into slot 1 as attachment; attachment stays outside bubble shell but inside the user row |
   | `T-003` | 2 | answer | acknowledgement |
   | `T-004` | 3 | answer | session-created context |
   | `T-005` | 4 | answer | diagnosis from existing prose only |
   | `T-006` | 5 | error disclosure | collapsed by default |
   | `T-007` | 6 | answer | retry-success proof |
   | `T-008` | 7 | estimate disclosure | keep source order; do not chronological re-sort even though this timestamp predates some earlier-rendered facts |
   | `T-009` | 8 | approval gate | resolved approval record |
   | `T-010` | 9 | answer | delivery started |
   | `T-011` | 10 | answer | implementation |
   | `T-012` | 11 | answer + artifact tokens | delivery evidence stays on this turn |
   | `T-013` | 12 | answer | cycle-complete system event |
   | `T-014` | 13 | answer | follow-up recommendation |
   | `T-015` | 14 | estimate disclosure | pending follow-up quote |
   | `T-016` | 15 | answer | waiting-approval state |

   - Source order remains exactly the fixture order from `SESSION_DETAIL.timeline`; no chronological re-sort.
   - Group footer placement contract remains: only the group-final slot renders the hover footer for the initial fixture (`session-turn-15`), unless response-group logic changes outside this task.

3. **ErrorBlock token / CSS contract**
   - `ErrorBlock` stays collapsed by default with working disclosure button, `aria-expanded`, `aria-controls`, correct `hidden` state, and keyboard activation.
   - The `ErrorBlock` top separator uses `--kx-danger`.
   - The `ErrorBlock` bottom separator uses `--kx-danger`.
   - The `ERROR` label/marker uses `--kx-danger`.
   - No error accent may use `--kx-attention`.
   - Expanded detail may only elaborate the existing timeout title plus the existing retry-impact line; it must remain readable in both themes.

4. **EstimateBlock token / CSS contract**
   - `EstimateBlock` stays collapsed by default with working disclosure button, `aria-expanded`, `aria-controls`, correct `hidden` state, and keyboard activation.
   - The `EstimateBlock` top separator uses `--kx-attention`.
   - The `EstimateBlock` bottom separator uses `--kx-attention`.
   - The estimate kind/indicator uses `--kx-attention`.
   - The estimate toggle affordance uses `--kx-attention`.
   - Dotted leaders stay `--kx-border` because they are structural data separators, not alert identity.
   - The expanded card’s ordinary border stays `--kx-border`.
   - Collapsed state always shows the summary row; expanded state shows heading, dotted-leader rows, validity line, and note.
   - `Q-101` remains approved historical evidence; `Q-102` remains a pending follow-up decision.

5. **Copy/order cleanup rules**
   - Semantic wording cleanup and ordering cleanup are allowed only to improve readability of the approved incident arc.
   - All existing fixture facts, values, ids, statuses, story points, repo metadata, timestamps, artifacts, and diagnosis details stay unchanged.
   - Preserve the attachment presentation as outside the bubble shell but inside the user row.

6. **Themes, accessibility, reduced motion, catalog parity**
   - Light and dark themes must rely on existing `--kx-*` tokens only.
   - Required danger/attention separators and labels must remain visibly distinct in both themes with sufficient contrast against current stream surfaces.
   - Disclosure toggles must be keyboard reachable, expose a visible `:focus-visible` state, and not require hover.
   - `aria-controls` must target the actual disclosure body id, and collapsed vs expanded state must be reflected via `hidden`.
   - No added motion beyond existing behavior; any disclosure/chevron transition must still respect `prefers-reduced-motion: reduce`.
   - `stream-error` and `stream-estimate` catalog previews must continue to show the collapsed default state with the same separator/accent behavior as the page.

## Acceptance criteria
- The classic detail page remains the same feature entry point and still renders the current header, tracker, footer chips, and composer.
- The stream renders 15 slots from `T-001…T-016`, with `T-002` merged into slot 1 as the attachment row and no chronological re-sort.
- The incident arc clearly communicates request → diagnosis → retry timeout → retry success → approval → delivery evidence → follow-up decision without adding facts.
- Error disclosure is collapsed by default, keyboard operable, correctly wires `aria-controls`/`hidden`, and uses `--kx-danger` for top separator, bottom separator, and `ERROR` label/marker only.
- Estimate disclosures are collapsed by default, keyboard operable, correctly wire `aria-controls`/`hidden`, use `--kx-attention` for top separator, bottom separator, kind/indicator, and toggle affordance, while dotted leaders and ordinary expanded-card border stay `--kx-border`.
- Delivery evidence still comes only from the existing artifact list: `PR #142`, `commit 9f3c2ab`, `Test Report`, `Receipt R-0057`.
- `Q-101` still reads as approved history, `Q-102` still reads as waiting approval, and the attachment remains outside the bubble shell but inside the user row.
- No new global tokens, no layout redesign, and no regression in focus-visible or reduced-motion behavior.

## Validation
- `npm test`
- `npm run typecheck`
- `npm run build`
- `impeccable-detector src/pages/SessionDetailPage.tsx src/data/mockData.ts src/components/session/stream/blocks/ErrorBlock.tsx src/components/session/stream/blocks/EstimateBlock.tsx src/components/session/stream/SessionStream.css`
- Extend/add targeted tests covering:
  - `src/components/session/stream/blocks/ErrorBlock.test.tsx` — `aria-controls` target, `hidden` state, keyboard toggle, and error-token/separator assertions.
  - `src/components/session/stream/blocks/EstimateBlock.test.tsx` or equivalent estimate-disclosure coverage — `aria-controls` target, `hidden` state, keyboard toggle, summary-row persistence, and attention/border token assertions.
  - `src/pages/SessionDetailPage.test.tsx` — 15-slot mapping table contract, `T-002` merge, no chronological re-sort, delivery artifacts sourced from existing data, retry-success answer, and footer-only-on-final-slot placement.
  - catalog preview coverage (`src/catalog/registry.tsx`-backed tests) — collapsed preview parity for `stream-error` and `stream-estimate`.
  - theme/style coverage (existing token or browser-style assertions, e.g. `styles/contrast.test.ts`) — required danger/attention visibility and contrast in both light and dark themes.
  - reduced-motion / focus-visible coverage — no added motion requirement and visible keyboard focus on disclosure toggles.
- Independent validator review required after author self-check and before approval.
