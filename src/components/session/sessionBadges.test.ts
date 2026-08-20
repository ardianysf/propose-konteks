/*
 * sessionBadges.test.ts — ownership + variant contracts for the shared
 * session badge primitive (T5b session rework).
 *
 * SessionTimeline.tsx renders quote/delivery status pills with `.kx-badge`
 * + `.kx-badge--<status>` but its own stylesheet (SessionTimeline.css) never
 * defined those rules — they previously lived in SessionStatusBadge.css, a
 * stylesheet the timeline does not import. The rework moves the primitive to
 * sessionBadges.css and has BOTH consumers import it. These tests prove:
 *
 *   1. Ownership — the badge primitive lives in exactly ONE session-domain
 *      stylesheet (sessionBadges.css) and no other file re-declares it.
 *   2. Dependency — SessionStatusBadge.tsx and SessionTimeline.tsx both
 *      import the shared stylesheet (a regression deleting the timeline's
 *      import breaks its pill styling).
 *   3. Variant coverage — every modifier class the components can emit
 *      (derived from the SessionQuote/DeliveryInfo status unions in
 *      mockData.ts) either has an explicit rule in sessionBadges.css or is
 *      a documented base-fallback (see the stylesheet header); no other
 *      badge modifier rule may exist (nothing invented).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getAggregatedCssParts } from '../../test/cssAggregate'

const SESSION_DIR = join(process.cwd(), 'src/components/session')
const badges = readFileSync(join(SESSION_DIR, 'sessionBadges.css'), 'utf8')
const timelineTsx = readFileSync(join(SESSION_DIR, 'SessionTimeline.tsx'), 'utf8')
const statusBadgeTsx = readFileSync(join(SESSION_DIR, 'SessionStatusBadge.tsx'), 'utf8')

/** Collapse runs of whitespace so multi-line selector lists match flat. */
const flat = (css: string) => css.replace(/\s+/g, ' ')

/** True when `selector` opens a rule — alone or as one arm of a grouped
 * selector list (e.g. '.kx-badge--completed, .kx-badge--approved {').
 * `css` must be whitespace-flattened first. The boundary is "not a
 * selector-name char" ([^.\\w-]) so a selector directly after a flattened
 * comment closer ('… *\/' → '/ ') still matches, without accepting a
 * longer selector that merely ENDS in this one ('.kx-badge--x--y {').
 * The selector participates when followed by `{` (lone rule) or `,`
 * (one arm of a group whose list ends at `{` — the no-other-stylesheet
 * test below keeps that group inside sessionBadges.css). */
const opensRule = (css: string, selector: string) =>
  new RegExp(`(?:^|[^.\\w-])${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[,{]`).test(css)

/** Base declaration + every badge modifier selector defined across the
 * aggregated stylesheets (definitions, not class-attribute usages). */
function badgeDefinitions(): Array<{ file: string; selector: string }> {
  const found: Array<{ file: string; selector: string }> = []
  for (const part of getAggregatedCssParts()) {
    const re = /(\.kx-badge(?:--[a-z_]+)?(?:\s*,\s*\.kx-badge--[a-z_]+)*)\s*\{/g
    for (const match of part.css.matchAll(re)) {
      for (const selector of match[1].split(',')) {
        found.push({ file: part.file, selector: selector.trim() })
      }
    }
  }
  return found
}

describe('session badge primitive — ownership', () => {
  it('sessionBadges.css declares the .kx-badge base and the status modifiers', () => {
    expect(flat(badges)).toContain('.kx-badge {')
    // Modifiers the consumers can emit that are explicitly styled (the
    // fallback set is covered by the variant-coverage tests below).
    // completed/approved share one grouped rule — opensRule matches a
    // selector as any arm of a comma group, not just a lone selector.
    for (const modifier of ['waiting_approval', 'pending_approval', 'completed', 'approved', 'blocked', 'failed', 'in_progress', 'partially_completed', 'cancelled']) {
      expect(opensRule(flat(badges), `.kx-badge--${modifier}`), `.kx-badge--${modifier} opens a rule`).toBe(true)
    }
  })

  it('no other stylesheet re-declares a .kx-badge rule (single home, no duplication)', () => {
    const elsewhere = badgeDefinitions().filter((d) => d.file !== 'src/components/session/sessionBadges.css')
    expect(elsewhere).toEqual([])
  })
})

describe('session badge primitive — consumer dependency', () => {
  it('SessionStatusBadge.tsx imports the shared badge stylesheet', () => {
    expect(statusBadgeTsx).toContain("import './sessionBadges.css'")
  })

  it('SessionTimeline.tsx imports the shared badge stylesheet', () => {
    expect(timelineTsx).toContain("import './sessionBadges.css'")
  })
})

describe('session badge primitive — variant coverage', () => {
  // Modifier classes emitted by SessionStatusBadge/SessionTimeline, derived
  // from the status unions in src/data/mockData.ts (SessionDetailStatus,
  // SessionQuote['status'], DeliveryInfo['status']) — not invented variants.
  // '.kx-badge--pending' is only reachable from the missing-quote guard and
  // intentionally has no rule (see sessionBadges.css header).
  const modifiers = ['waiting_approval', 'pending_approval', 'in_progress', 'delivering', 'approved', 'rejected', 'superseded', 'partially_completed', 'partially_complete', 'completed', 'blocked', 'failed', 'cancelled', 'not_started']

  it('every emitted modifier either has an explicit rule or is a documented base fallback', () => {
    for (const modifier of modifiers) {
      const selector = `.kx-badge--${modifier}`
      if (opensRule(flat(badges), selector)) {
        // Explicitly styled (lone rule or one arm of a grouped selector).
        expect(opensRule(flat(badges), selector)).toBe(true)
      } else {
        // Fallback must be deliberate: the stylesheet header documents which
        // modifiers render as the base pill instead of inventing a rule.
        expect(badges).toMatch(/Deliberate base fallback[\s\S]*\*\//)
        expect(badges).toMatch(new RegExp(`Deliberate base fallback[\\s\\S]*\\b${modifier}\\b`))
      }
    }
  })

  it('no badge modifier rule exists beyond what the consumers can emit', () => {
    const defined = badgeDefinitions()
      .map((d) => d.selector.replace('.kx-badge--', ''))
      .filter((selector) => selector !== '.kx-badge')
    expect([...defined].sort()).toEqual(
      modifiers.filter((m) => m !== 'delivering' && m !== 'rejected' && m !== 'superseded' && m !== 'partially_complete' && m !== 'not_started').sort(),
    )
  })
})
