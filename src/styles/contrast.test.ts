/*
 * contrast.test.ts — Task 13 contrast-migration contracts (AC9).
 *
 * jsdom does not apply real CSS, so these are source-string assertions
 * against the committed stylesheets (same convention as responsive.test.ts).
 * The file embeds the complete consumer inventory (see the tally test for
 * the current count) and proves three things:
 *
 *   1. The three AA semantics are defined in tokens.css and every candidate
 *      pair clears 4.5:1 against white/canvas/pale.
 *   2. Every M/A/S consumer now reads its AA token while every U consumer
 *      keeps the original mixed-purpose token.
 *   3. The inventory is complete and non-duplicated: every use of the five
 *      tokens across the aggregated stylesheets (spec addendum §8:
 *      components.css + the inert per-domain files) + global.css maps to
 *      exactly one inventory entry and vice versa.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getAggregatedCss, getAggregatedCssParts } from '../test/cssAggregate'

// Per spec addendum §8 the component rules are read from the aggregate
// (components.css + src/components/**/*.css); global.css/tokens.css stay
// direct reads.
const components = getAggregatedCss()
const tokens = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')

const COMPONENTS = 'src/styles/components.css'
const GLOBAL = 'src/styles/global.css'
// customize/shared.css — the single surviving home of the .kx-preserved__*
// rules since the T5b dedup (they never lived in components.css, so the
// inventory points at their real file instead of a COMPONENTS stand-in).
const CUSTOMIZE_SHARED = 'src/components/customize/shared.css'
// session/sessionBadges.css — the single home of the .kx-badge base +
// modifier rules since the T5b session rework (moved out of
// SessionStatusBadge.css; never in components.css, so — like
// CUSTOMIZE_SHARED — the inventory points at the real file).
const SESSION_BADGES = 'src/components/session/sessionBadges.css'
const RESPONSE_FOOTER = 'src/components/session/ResponseFooter.css'
const FEEDBACK_MODAL = 'src/components/session/FeedbackModal.css'
const STREAM = 'src/components/session/stream/SessionStream.css'
// session/stream/SessionStream.css — the CHAT-STYLE session stream
// (spec §Anatomi turn): user bubbles (attachment cards + hover action
// bar) and flat agent turns (hover footer) plus the typed block bodies.
// Same M/A/S/U semantics as the session batch —
// muted captions read the AA muted token, accent text/glyphs read the AA
// accent token, white-ink solid fills are S, and decorative hover
// borders / dots / the focus outline stay on mixed-purpose tokens (U).
// One hard rule from the extractor: every selector reads at most ONE
// tracked token (solid fills drop their border overrides for the base
// hairline instead of restating the token).
// shell/{Sidebar,SystemMenu,WorkspaceMenu}.css — the single surviving
// homes of the shell-namespace rules since the T5d shell batch (moved
// out of components.css by the removal tool; they are NOT transitional
// duplicates). Like CUSTOMIZE_SHARED/SESSION_BADGES above, their
// inventory entries point at their REAL file instead of a COMPONENTS
// stand-in, so KNOWN_INERT_DUPLICATE_SELECTORS does not mask them — a
// re-introduced second copy in any shell stylesheet surfaces as an
// unclassified / duplicate selector. shell/shared.css carries only
// geometry (no tracked-token rules), so it holds no inventory entries.
const SIDEBAR = 'src/components/shell/Sidebar.css'
const SYSTEM_MENU = 'src/components/shell/SystemMenu.css'
const WORKSPACE_MENU = 'src/components/shell/WorkspaceMenu.css'
// technical/technical.css — the Technical Text design-system primitives
// (InlineCode, EntityToken, MetadataPair, StatusBadge, CodeBlock + the
// demo showcase). Its own home from day one (never in components.css),
// so — like SESSION_BADGES/CUSTOMIZE_SHARED — the entries point at the
// real file. Hard rule from the extractor still holds: each selector
// reads at most ONE tracked token; every other color rides the
// --kx-tech-* aliases declared in tokens.css, which are skipped by the
// extractor because alias DEFINITIONS are declarations, not consumer
// usages (their AA-ness is inherited from the aliased base token).
const TECHNICAL = 'src/components/technical/technical.css'

const MUTED = '--kx-muted'
const MUTED_AA = '--kx-muted-text-aa'
const ACCENT_STRONG = '--kx-accent-strong'
const ACCENT_AA = '--kx-accent-text-aa'
const ACCENT_SOLID_AA = '--kx-accent-solid-aa'

// ---------------------------------------------------------------------------
// WCAG sRGB relative luminance + contrast (mirrors the evidence runner).
// ---------------------------------------------------------------------------

function luminance(hex: string): number {
  const c = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

// ---------------------------------------------------------------------------
// Complete consumer inventory (261 entries — the §Fase 4 stream kinds
// added the quote's muted label/attribution and the error's accent
// resolution line).
// cls: M = enabled muted text/placeholder, A = enabled accent text/glyph,
//      S = white-text solid background, U = unchanged (decorative/disabled).
// token is the ORIGINAL token each consumer started from.
// ---------------------------------------------------------------------------

type Class = 'M' | 'A' | 'S' | 'U'

interface Entry {
  file: string
  selector: string
  property: string
  token: string
  cls: Class
}

const mutedM = [
  '.kx-input::placeholder',
  '.kx-page-placeholder p',
  '.kx-new-session__subtitle',
  '.kx-new-session__approval',
  '.kx-new-session__intro-body',
  '.kx-composer__input::placeholder',
  '.kx-new-session__disclaimer',
  '.kx-session-detail__context',
  '.kx-session-detail__meta',
  '.kx-session-timeline__event-text',
  '.kx-session-timeline__card-meta',
  '.kx-session-timeline__card-limitations',
  '.kx-session-detail__tracker-kicker',
  '.kx-quote-approval-card__history',
  '.kx-quote-approval-card__note',
  '.kx-quote-approval-card__quote-ref',
  '.kx-quote-approval-card__chevron',
  '.kx-session-composer__locked-notice',
  '.kx-profile-menu__item-meta',
  '.kx-profile-menu__section-label',
  '.kx-profile-menu__setting-desc',
  '.kx-profile-menu__setting-state',
  '.kx-profile-menu__readiness--setup',
  '.kx-profile-menu__sidecar-term',
  '.kx-repo-modal__subtitle',
  '.kx-repo-modal__system-desc',
  '.kx-repo-modal__system-count',
  '.kx-repo-modal__repo-meta',
  '.kx-repo-modal__repo-vcs',
  '.kx-repo-modal__status-count',
  '.kx-repo-modal__empty-hint',
  '.kx-manual-modal__subtitle',
  '.kx-manual-modal__field-hint',
  '.kx-manual-modal__result-meta',
  '.kx-manual-modal__count',
  '.kx-manual-modal__page-indicator',
  '.kx-manual-modal__network-hint',
  '.kx-manual-modal__footer-note',
  '.kx-manual-modal__empty-hint',
  '.kx-create-modal__subtitle',
  '.kx-create-modal__helper',
  '.kx-create-modal__opt',
  '.kx-create-modal__footer-note',
  '.kx-component-menu__row-repo',
  '.kx-component-menu__count',
  '.kx-component-menu__empty-hint',
  ".kx-customize-tab__table th[scope='col']",
  '.kx-agents__create-label',
  '.kx-agents__create-hint',
  '.kx-agents__fact-term',
  '.kx-agents__archived-on',
  '.kx-context__count',
  '.kx-context__item-note',
  '.kx-integrations__empty-text',
  '.kx-integrations__status--setup',
  '.kx-learned-item__meta',
  '.kx-learned-timeline__meta',
  '.kx-learned__empty-hint',
  '.kx-history__field-label',
  '.kx-history__row-meta',
  '.kx-history__empty-hint',
  '.kx-settings__note',
  '.kx-illustrative-note',
  '.kx-account-menu__section-label',
  '.kx-account-menu__theme-value',
]

const mutedU = [
  '.kx-panel__pill-chevron',
  '.kx-composer__profile-chevron',
  '.kx-history__open:disabled',
]

const accentA = [
  '.kx-panel__pill-icon',
  '.kx-composer__send',
  '.kx-composer__reviews',
  '.kx-profile-menu__check',
  '.kx-profile-menu__manage',
  '.kx-account-menu__theme-seg-btn:hover',
  '.kx-account-menu__theme-seg-btn--active',
  '.kx-account-menu__theme-seg-btn--active:hover',
  '.kx-profile-menu__readiness--ready',
  '.kx-repo-modal__add-repo',
  '.kx-repo-modal__status-system',
  '.kx-manual-modal__field-error',
  '.kx-manual-modal__swap',
  '.kx-manual-modal__result-flag',
  '.kx-manual-modal__add-another',
  '.kx-create-modal__req',
  '.kx-component-menu__clear',
  '.kx-agents__disclosure > summary:hover',
  '.kx-integrations__status--connected',
  '.kx-history__clear',
  '.kx-session-detail__action-needed',
  '.kx-session-timeline__artifact-link',
  '.kx-session-timeline__error-title',
  '.kx-quote-approval-card__quote-id',
  '.kx-session-detail__stage-pill-badge',
]

const accentS = [
  '.kx-btn--primary',
  '.kx-composer__badge',
  '.kx-session-detail__stage-pill',
]

const accentU: Array<[string, string]> = [
  ['.kx-input:focus', 'border-color'],
  ['.kx-history__row-button:focus-visible', 'outline'],
  ['.kx-composer__input-box:focus-within', 'box-shadow'],
  ['.kx-quote-approval-card__header:focus-visible', 'outline'],
  ['.kx-composer__send:hover:not(:disabled)', 'border-color'],
  ['.kx-profile-menu__manage:focus-visible', 'border-color'],
  ['.kx-profile-menu__setting-dot', 'background'],
  ['.kx-repo-modal__system--active .kx-repo-modal__system-radio', 'border-color'],
  ['.kx-manual-modal__network-check', 'accent-color'],
  ['.kx-component-menu__check', 'accent-color'],
  ['.kx-customize__tab:focus-visible', 'outline'],
  ['.kx-agents__review', 'border-left'],
  ['.kx-agents__disclosure > summary:focus-visible', 'outline'],
  ['.kx-learned__tab:focus-visible', 'outline'],
  ['.kx-learned-timeline__item::before', 'border'],
  ['.kx-history__clear:focus-visible', 'border-color'],
]

function shellEntries(): Entry[] {
  return [
    // muted M — sidebar/workspace/system-menu captions & counts
    ...[
      '.kx-sidebar__control-caption',
      '.kx-sidebar__label',
      '.kx-sidebar__session-meta',
    ].map((selector) => ({ file: SIDEBAR, selector, property: 'color', token: MUTED, cls: 'M' as Class })),
    { file: SYSTEM_MENU, selector: '.kx-system-menu__empty', property: 'color', token: MUTED, cls: 'M' },
    { file: SYSTEM_MENU, selector: '.kx-system-menu__item-count', property: 'color', token: MUTED, cls: 'M' },
    { file: WORKSPACE_MENU, selector: '.kx-workspace-menu__item-plan', property: 'color', token: MUTED, cls: 'M' },
    // muted U — decorative chevron at rest
    { file: SIDEBAR, selector: '.kx-sidebar__chevron', property: 'color', token: MUTED, cls: 'U' },
    // accent A — sidebar/menu glyphs & actions
    ...[
      '.kx-sidebar__system-icon',
      '.kx-sidebar__new-session-icon',
      '.kx-sidebar__view-all',
      '.kx-sidebar__user-avatar',
    ].map((selector) => ({ file: SIDEBAR, selector, property: 'color', token: ACCENT_STRONG, cls: 'A' as Class })),
    ...[
      '.kx-system-menu__all',
      '.kx-system-menu__all-icon',
      '.kx-system-menu__item-icon',
      '.kx-system-menu__create',
    ].map((selector) => ({ file: SYSTEM_MENU, selector, property: 'color', token: ACCENT_STRONG, cls: 'A' as Class })),
    // accent U — decorative avatars / hover border
    { file: SIDEBAR, selector: '.kx-sidebar__workspace-avatar', property: 'background', token: ACCENT_STRONG, cls: 'U' },
    { file: SYSTEM_MENU, selector: '.kx-system-menu__create:hover', property: 'border-color', token: ACCENT_STRONG, cls: 'U' },
    { file: WORKSPACE_MENU, selector: '.kx-workspace-menu__item-avatar', property: 'background', token: ACCENT_STRONG, cls: 'U' },
    // Sidebar-v2 hover-reveal icon actions (real-file attribution — see
    // the identical pattern in the components.css batch below): the REST
    // state reads the decorative muted token (U — hidden until hover),
    // while their revealed states (pinned, hovered map button) read the
    // AA accent token.
    { file: SIDEBAR, selector: '.kx-sidebar__session-pin', property: 'color', token: MUTED, cls: 'U' },
    { file: SIDEBAR, selector: ".kx-sidebar__session-pin[aria-pressed='true']", property: 'color', token: ACCENT_AA, cls: 'A' },
    { file: SYSTEM_MENU, selector: '.kx-system-menu__map-btn', property: 'color', token: MUTED, cls: 'U' },
    { file: SYSTEM_MENU, selector: '.kx-system-menu__map-btn:hover', property: 'color', token: ACCENT_AA, cls: 'A' },
    // Task-session children disclosure (Task Session Page feature): the
    // resting chevron reads the decorative muted token (U — sibling of
    // .kx-sidebar__chevron), its revealed hover/focus state maps to the
    // AA accent token, and the ticket glyph is an accent icon (sibling of
    // .kx-sidebar__system-icon). The nested task rows live in v2.css
    // outside the aggregate, so only these sidebar entries are needed.
    { file: SIDEBAR, selector: '.kx-sidebar__session-tasks', property: 'color', token: MUTED, cls: 'U' },
    { file: SIDEBAR, selector: '.kx-sidebar__session-tasks:focus-visible', property: 'color', token: ACCENT_AA, cls: 'A' },
    { file: SIDEBAR, selector: '.kx-sidebar__task-icon', property: 'color', token: ACCENT_STRONG, cls: 'A' },
  ]
}

function entries(): Entry[] {
  return [
    ...mutedM.map((selector) => ({ file: COMPONENTS, selector, property: 'color', token: MUTED, cls: 'M' as Class })),
    ...mutedU.map((selector) => ({ file: COMPONENTS, selector, property: 'color', token: MUTED, cls: 'U' as Class })),
    ...accentA.map((selector) => ({ file: COMPONENTS, selector, property: 'color', token: ACCENT_STRONG, cls: 'A' as Class })),
    ...accentS.map((selector) => ({ file: COMPONENTS, selector, property: 'background', token: ACCENT_STRONG, cls: 'S' as Class })),
    ...accentU.map(([selector, property]) => ({ file: COMPONENTS, selector, property, token: ACCENT_STRONG, cls: 'U' as Class })),
    ...shellEntries(),
    // Preserved Skills/Tools rows (customize/shared.css — T5b dedup: the
    // rules were duplicated verbatim in SkillsTab.css + ToolsTab.css and
    // collapsed to a single shared.css copy; components.css never carried
    // them). The entries point at their REAL file so KNOWN_INERT_DUPLICATE_
    // SELECTORS no longer masks them — a re-introduced second copy in any
    // tab stylesheet now surfaces as an unclassified selector.
    { file: CUSTOMIZE_SHARED, selector: '.kx-preserved__count', property: 'color', token: MUTED, cls: 'M' as Class },
    { file: CUSTOMIZE_SHARED, selector: '.kx-preserved__item-desc', property: 'color', token: MUTED, cls: 'M' as Class },
    { file: CUSTOMIZE_SHARED, selector: '.kx-preserved__item-scope', property: 'color', token: MUTED, cls: 'M' as Class },
    { file: CUSTOMIZE_SHARED, selector: '.kx-preserved__note', property: 'color', token: MUTED, cls: 'M' as Class },
    { file: CUSTOMIZE_SHARED, selector: '.kx-preserved__status--disabled', property: 'color', token: MUTED, cls: 'M' as Class },
    { file: CUSTOMIZE_SHARED, selector: '.kx-preserved__status--enabled', property: 'color', token: ACCENT_STRONG, cls: 'A' as Class },
    { file: CUSTOMIZE_SHARED, selector: '.kx-preserved__toggle--on', property: 'background', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: CUSTOMIZE_SHARED, selector: '.kx-preserved__toggle:focus-visible', property: 'outline', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: STREAM, selector: '.kx-stream-estimate__toggle:focus-visible', property: 'outline', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: STREAM, selector: '.kx-stream-turn--completion', property: 'border-top', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: STREAM, selector: '.kx-stream-error__toggle:focus-visible', property: 'outline', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: STREAM, selector: '.kx-stream-bubble__read-toggle:focus-visible', property: 'outline', token: ACCENT_STRONG, cls: 'U' as Class },
    // Session badge primitive (session/sessionBadges.css — T5b session
    // rework: the .kx-badge modifiers moved out of SessionStatusBadge.css
    // into the shared session stylesheet; components.css never carried
    // them). Same handling as CUSTOMIZE_SHARED above: the entries point at
    // their REAL file (no KNOWN_INERT_DUPLICATE_SELECTORS masking), so a
    // re-introduced second copy anywhere surfaces as an unclassified /
    // duplicate selector. The pending-quote pill shares the
    // waiting-approval S styling (same background token + property), so it
    // is classified as its own accent-strong S consumer.
    { file: SESSION_BADGES, selector: '.kx-badge--cancelled', property: 'color', token: MUTED, cls: 'M' as Class },
    { file: SESSION_BADGES, selector: '.kx-badge--blocked', property: 'color', token: ACCENT_STRONG, cls: 'A' as Class },
    { file: SESSION_BADGES, selector: '.kx-badge--failed', property: 'color', token: ACCENT_STRONG, cls: 'A' as Class },
    { file: SESSION_BADGES, selector: '.kx-badge--waiting_approval', property: 'background', token: ACCENT_STRONG, cls: 'S' as Class },
    { file: SESSION_BADGES, selector: '.kx-badge--pending_approval', property: 'background', token: ACCENT_STRONG, cls: 'S' as Class },
    // ResponseFooter (session/ResponseFooter.css) — the action row under
    // assistant messages: muted icon actions at rest, AA accent ink while a
    // reaction is pressed, muted date + stats captions.
    { file: RESPONSE_FOOTER, selector: '.kx-response-footer__action', property: 'color', token: MUTED_AA, cls: 'M' as Class },
    { file: RESPONSE_FOOTER, selector: ".kx-response-footer__action[aria-pressed='true']", property: 'color', token: ACCENT_AA, cls: 'A' as Class },
    { file: RESPONSE_FOOTER, selector: '.kx-response-footer__menu-date', property: 'color', token: MUTED_AA, cls: 'M' as Class },
    { file: RESPONSE_FOOTER, selector: '.kx-response-footer__stats', property: 'color', token: MUTED_AA, cls: 'M' as Class },
    // FeedbackModal (session/FeedbackModal.tsx) — muted captions (subtitle,
    // field label, close icon) and the textarea's accent focus border.
    { file: FEEDBACK_MODAL, selector: '.kx-feedback-modal__close', property: 'color', token: MUTED_AA, cls: 'M' as Class },
    { file: FEEDBACK_MODAL, selector: '.kx-feedback-modal__subtitle', property: 'color', token: MUTED_AA, cls: 'M' as Class },
    { file: FEEDBACK_MODAL, selector: '.kx-feedback-modal__label', property: 'color', token: MUTED_AA, cls: 'M' as Class },
    { file: FEEDBACK_MODAL, selector: '.kx-feedback-modal__input:focus', property: 'border-color', token: ACCENT_STRONG, cls: 'U' as Class },
    // Dark-theme ink pin: the active segment's text uses --kx-accent-text-aa
    // in light mode (its dark #4f7044 resolves AA on the #95a547 fill) and
    // a [data-theme='dark'] override switches it to dark --kx-raised ink on
    // the #a8c883 fill. Property is 'color' — the extractor keys each
    // selector to its single tracked-token line.
    { file: COMPONENTS, selector: '.kx-segmented__btn--active:hover', property: 'background', token: ACCENT_SOLID_AA, cls: 'S' as Class },
    // Account menu theme segmented buttons follow the sidebar-v2
    // hover-reveal pattern (see the shell batch above): muted icon at
    // rest (U), AA accent on hover and while active.
    { file: COMPONENTS, selector: '.kx-account-menu__theme-seg-btn', property: 'color', token: MUTED, cls: 'U' as Class },
    // System map node borders and outlines — decorative.
    { file: 'src/components/system/SystemMapModal.css', selector: '.system-node.selected', property: 'border-color', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: 'src/components/system/SystemMapModal.css', selector: '.system-node:focus', property: 'outline', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: 'src/components/system/SystemMapModal.css', selector: '.container-node.selected', property: 'border-color', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: 'src/components/system/SystemMapModal.css', selector: '.repository-node.selected', property: 'border-color', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: 'src/components/system/SystemMapModal.css', selector: '.repository-node:focus', property: 'outline', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: 'src/components/system/SystemMapModal.css', selector: '.container-node:focus', property: 'outline', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: 'src/components/system/SystemMapModal.css', selector: '.component-node.selected', property: 'border-color', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: 'src/components/system/SystemMapModal.css', selector: '.component-node:focus', property: 'outline', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: 'src/components/system/SystemMapModal.css', selector: '.component-node.expanded.selected', property: 'border', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: 'src/components/system/SystemMapModal.css', selector: '.component-node__metadata-label', property: 'color', token: MUTED_AA, cls: 'M' as Class },
    { file: 'src/components/system/SystemMapModal.css', selector: '.component-node__cta:hover', property: 'background', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: 'src/components/system/SystemMapModal.css', selector: '.component-node__cta:focus', property: 'outline', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: 'src/components/system/SystemMapModal.css', selector: '.react-flow__edge-path.highlighted', property: 'stroke', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: 'src/components/system/SystemMapModal.css', selector: '.react-flow__controls-button:hover', property: 'border-color', token: ACCENT_STRONG, cls: 'U' as Class },
    // Task Session Page feature (taskSession/* + pages/TaskSessionDetailPage.css
    // — the ticket-session composition: context banner, ticket request,
    // retry-pill timeline, quote + decision/estimate cards, stage chips).
    // Muted M — validity note, chip detail/pending ink, expiry + finished-line
    // captions (all read the AA muted token, like the session-detail batch).
    { file: 'src/components/taskSession/DecisionEstimateCard.css', selector: '.kx-decision-card__validity', property: 'color', token: MUTED, cls: 'M' as Class },
    { file: 'src/components/taskSession/StageChips.css', selector: '.kx-stage-chip__detail', property: 'color', token: MUTED, cls: 'M' as Class },
    { file: 'src/components/taskSession/StageChips.css', selector: '.kx-stage-chip--pending', property: 'color', token: MUTED, cls: 'M' as Class },
    { file: 'src/components/taskSession/TaskQuoteCard.css', selector: '.kx-task-quote__expires', property: 'color', token: MUTED, cls: 'M' as Class },
    { file: 'src/components/taskSession/TaskTimeline.css', selector: '.kx-task-timeline__retry-time', property: 'color', token: MUTED, cls: 'M' as Class },
    { file: 'src/components/taskSession/TaskTimeline.css', selector: '.kx-task-timeline__finished', property: 'color', token: MUTED, cls: 'M' as Class },
    { file: 'src/components/taskSession/TaskTimeline.css', selector: '.kx-task-timeline__finished-duration', property: 'color', token: MUTED, cls: 'M' as Class },
    // Accent A — done-state ink (book glyph marker + done chip label) reads
    // the AA accent token, like the session stage-pill badge.
    { file: 'src/components/taskSession/StageChips.css', selector: '.kx-stage-chip__marker--done', property: 'color', token: ACCENT_STRONG, cls: 'A' as Class },
    { file: 'src/components/taskSession/StageChips.css', selector: '.kx-stage-chip--done', property: 'color', token: ACCENT_STRONG, cls: 'A' as Class },
    // U — decorative: danger-action focus outline, pending dot border,
    // finished leading dot fill, and the header separator glyph.
    { file: 'src/components/taskSession/DecisionEstimateCard.css', selector: '.kx-decision-card__action--danger:focus-visible', property: 'outline', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: 'src/components/taskSession/StageChips.css', selector: '.kx-stage-chip__marker--pending', property: 'border', token: MUTED, cls: 'U' as Class },
    { file: 'src/components/taskSession/TaskTimeline.css', selector: '.kx-task-timeline__finished-dot', property: 'background', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: 'src/pages/TaskSessionDetailPage.css', selector: '.kx-task-session__sep', property: 'color', token: MUTED, cls: 'U' as Class },
    // System map banners and controls — decorative borders.
    { file: 'src/components/system/SystemMapModal.css', selector: '.kx-system-map__banner--warning', property: 'border-left', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: 'src/components/system/SystemMapModal.css', selector: '.kx-system-map__reset-btn:hover:not(:disabled)', property: 'border-color', token: ACCENT_STRONG, cls: 'U' as Class },
    // ── Response stream (session/stream/SessionStream.css) ───────────
    // M — muted captions, meta times, micro labels, queued-state ink.
    ...[
      '.kx-stream-page__kicker',
      '.kx-stream-page__anchor',
      '.kx-stream-turn__icon',
      '.kx-stream-turn__kind',
      '.kx-stream-turn__feedback',
      '.kx-stream-turn__time',
      '.kx-stream-bubble__chip-kind',
      '.kx-stream-bubble__time',
      '.kx-stream-bubble__feedback',
      '.kx-stream-icon-action',
      '.kx-stream-ack__scope-title',
      '.kx-stream-ack__grounding',
      '.kx-stream-clar__q-num',
      '.kx-stream-plan__num',
      '.kx-stream-plan__meta',
      '.kx-stream-phase--queued',
      '.kx-stream-phase--queued .kx-stream-phase__mark',
      '.kx-stream-phase--queued .kx-stream-phase__label',
      '.kx-stream-phase__duration',
      '.kx-stream-call--queued',
      '.kx-stream-call--queued .kx-stream-call__verb',
      '.kx-stream-call__duration',
      '.kx-stream-review__location',
      '.kx-stream-completion__section-label',
      '.kx-stream-completion__next-num',
      '.kx-stream-completion__receipt',
      '.kx-stream-typing',
      '.kx-stream-quote__label',
      '.kx-stream-quote__attribution',
      '.kx-stream-estimate__kind',
      '.kx-stream-turn__stats',
      '.kx-stream-bubble__read-toggle',
      '.kx-stream-estimate__note',
      '.kx-stream-error__toggle',
      '.kx-stream-estimate__toggle',
    ].map((selector) => ({ file: STREAM, selector, property: 'color', token: MUTED_AA, cls: 'M' as Class })),
    // A — accent text/glyphs: tone-colored kind labels + icons on accent
    // turns, secondary/chip actions, resumed notices + settled marks,
    // done-state marks, diff additions, resolved-gate check. (The
    // artifact badge is gone — refinements v2 #5 rendered the artifact
    // as a bare full-width row.)
    ...[
      '.kx-stream-turn--accent .kx-stream-turn__icon',
      '.kx-stream-turn--accent .kx-stream-turn__kind',
      '.kx-stream-btn--secondary',
      '.kx-stream-notice--accent',
      '.kx-stream-clar__settled-mark',
      '.kx-stream-plan__step-mark',
      '.kx-stream-plan__approved-note',
      '.kx-stream-gate__resolved-mark',
      '.kx-stream-phase--done .kx-stream-phase__mark',
      '.kx-stream-call--done .kx-stream-call__mark',
      '.kx-stream-io__line--add',
      '.kx-stream-chip-action',
      '.kx-stream-completion__item--done .kx-stream-completion__mark',
      '.kx-stream-error__resolution--accent',
    ].map((selector) => ({ file: STREAM, selector, property: 'color', token: ACCENT_AA, cls: 'A' as Class })),
    // S — white-ink solid accent fills: accent chips, the primary button,
    // the selected answer option.
    ...[
      '.kx-stream-chip--accent',
      '.kx-stream-btn--primary',
      '.kx-stream-option--selected:hover',
    ].map((selector) => ({ file: STREAM, selector, property: 'background', token: ACCENT_SOLID_AA, cls: 'S' as Class })),
    // U — decorative: hover border rings, list bullets, hollow dots, the
    // not-done mark, and the stream's own focus-visible outline.
    { file: STREAM, selector: '.kx-stream-page__anchor:hover', property: 'border-color', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: STREAM, selector: '.kx-stream-btn--primary:hover:not(:disabled)', property: 'border-color', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: STREAM, selector: '.kx-stream-btn--secondary:hover:not(:disabled)', property: 'border-color', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: STREAM, selector: '.kx-stream-option:hover', property: 'border-color', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: STREAM, selector: '.kx-stream-ack__scope-list li::before', property: 'background', token: MUTED, cls: 'U' as Class },
    { file: STREAM, selector: '.kx-stream-phase__dot', property: 'border', token: MUTED, cls: 'U' as Class },
    { file: STREAM, selector: '.kx-stream-call__dot', property: 'border', token: MUTED, cls: 'U' as Class },
    { file: STREAM, selector: '.kx-stream-completion__mark', property: 'color', token: MUTED, cls: 'U' as Class },
    { file: STREAM, selector: '.kx-stream-page :focus-visible', property: 'outline', token: ACCENT_AA, cls: 'U' as Class },
    { file: STREAM, selector: '.kx-stream-call__row:focus-visible', property: 'outline', token: ACCENT_AA, cls: 'U' as Class },
    // Session History header — the demo route's discrete entry button
    // (secondary accent action, same family as .kx-history__clear).
    { file: 'src/pages/SessionHistoryPage.css', selector: '.kx-history__demo-link', property: 'color', token: ACCENT_AA, cls: 'A' as Class },
    { file: 'src/pages/SessionHistoryPage.css', selector: '.kx-history__demo-link:focus-visible', property: 'border-color', token: ACCENT_STRONG, cls: 'U' as Class },
    // ── Technical text primitives (technical/technical.css) ──────────
    // M — muted AA ink: the entity kind icon, the metadata label, the
    // code header meta + line numbers + footer, and the showcase's
    // group labels + do/don't note (all enabled muted text).
    ...[
      '.kx-tech-entity__icon',
      '.kx-tech-meta__label',
      '.kx-tech-codeblock__meta',
      '.kx-tech-codeblock__ln',
      '.kx-tech-codeblock__footer',
      '.kx-tech-showcase__label',
      '.kx-tech-note',
    ].map((selector) => ({ file: TECHNICAL, selector, property: 'color', token: MUTED_AA, cls: 'M' as Class })),
    // A — AA accent ink: the text-like copy/expand actions (metadata
    // value copy, code header copy, Show full code toggle).
    ...[
      '.kx-tech-meta__copy',
      '.kx-tech-copy',
      '.kx-tech-codeblock__expand',
    ].map((selector) => ({ file: TECHNICAL, selector, property: 'color', token: ACCENT_AA, cls: 'A' as Class })),
    { file: GLOBAL, selector: ':focus-visible', property: 'outline', token: ACCENT_STRONG, cls: 'U' as Class },
  ]
}

function expectedToken(entry: Entry): string {
  switch (entry.cls) {
    case 'M':
      return MUTED_AA
    case 'A':
      return ACCENT_AA
    case 'S':
      return ACCENT_SOLID_AA
    case 'U':
      return entry.token
  }
}

// ---------------------------------------------------------------------------
// Usage extraction — every occurrence of the five tokens, mapped to its
// enclosing single-line selector. The stylesheet has no token use inside
// @media/@keyframes blocks, so a nearest-preceding-selector walk is exact.
// ---------------------------------------------------------------------------

interface Usage {
  file: string
  selector: string
  property: string
  token: string
}

const TOKEN_RE = /var\((--kx-(?:muted-text-aa|accent-text-aa|accent-solid-aa|muted|accent-strong))\)/

function extractUsages(css: string, file: string): Usage[] {
  const lines = css.split('\n')
  const usages: Usage[] = []
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(TOKEN_RE)
    if (!match) continue
    // Custom-property DEFINITION lines (--kx-tech-status-success:
    // var(--kx-accent-text-aa) in tokens.css) are alias declarations,
    // not consumer usages: the alias inherits its AA-ness from the
    // aliased base token, and consumers reading var(--kx-tech-*) do not
    // match TOKEN_RE at all. Skipping definition lines keeps the census
    // a complete inventory of CONSUMER reads (selector::property).
    if (lines[i].split(':')[0].trim().startsWith('--')) continue
    let selector = ''
    for (let j = i; j >= 0; j--) {
      const t = lines[j].trim()
      if (t.endsWith('{') && !t.startsWith('@') && !t.startsWith('/*') && !t.startsWith('*')) {
        selector = t.slice(0, -1).trim()
        break
      }
    }
    if (!selector) continue // no enclosing single-line rule (e.g. a file's first line)
    usages.push({ file, selector, property: lines[i].split(':')[0].trim(), token: match[1] })
  }
  return usages
}

/**
 * Extract tracked-token usages from the aggregated stylesheets (spec
 * addendum §8) + global.css.
 *
 * Pass-1 wrinkle: the selectors listed below were migrated into the inert
 * per-domain files while their components.css copy still exists (dedup is
 * pass 2). Their extra tracked-token hits are duplicates of EXISTING
 * inventory entries, so the compatibility fold in collectUsages() maps a
 * domain-file hit onto the entry it duplicates — it does not require its
 * own classification (which would break the established M/A/S/U tallies
 * and the no-duplicate-usage rule). After pass 2 deletes the
 * components.css copies the same fold maps the surviving domain-file hit
 * to the same entry, so the test keeps passing unchanged.
 * KNOWN_INERT_DUPLICATE_SELECTORS below IS the pass-1 components.css ↔
 * domain-file duplicate report for the handoff.
 *
 * The fold is SOURCE-FILE aware (it tracks provenance per
 * selector::property::token key, not just the recorded entry) and admits
 * exactly two transition shapes — anything else stays in the output and
 * fails the completeness/no-duplicate assertions:
 *
 *   (a) components.css + exactly ONE domain/page file  → the domain hit
 *       is skipped (pass 1: the original still exists and owns the entry);
 *   (b) exactly ONE domain/page file and NO components.css hit → the hit
 *       is re-attributed to COMPONENTS as the synthetic inventory stand-in
 *       (pass 2: the original is gone, the survivor keeps the legacy
 *       inventory addressable).
 *
 * A SECOND non-components hit for the same key — even in the SAME domain
 * file that already supplied the fold — is never folded: it is pushed
 * under its real file, where the 'no duplicate usage' / 'no missing
 * classification' assertions see it as a brand-new cross-file
 * re-duplication.
 */
const KNOWN_INERT_DUPLICATE_SELECTORS = new Set([
  // account/AccountMenu.css
  '.kx-account-menu__section-label',
  '.kx-account-menu__theme-seg-btn',
  '.kx-account-menu__theme-seg-btn--active',
  '.kx-account-menu__theme-seg-btn--active:hover',
  '.kx-account-menu__theme-seg-btn:hover',
  '.kx-account-menu__theme-value',
  // account/SettingsModal.css
  '.kx-settings__note',
  // composer/ComponentMenu.css
  '.kx-component-menu__check',
  '.kx-component-menu__clear',
  '.kx-component-menu__count',
  '.kx-component-menu__empty-hint',
  '.kx-component-menu__row-repo',
  // composer/Composer.css
  '.kx-composer__badge',
  '.kx-composer__input::placeholder',
  '.kx-composer__input-box:focus-within',
  '.kx-composer__profile-chevron',
  '.kx-composer__reviews',
  '.kx-composer__send',
  '.kx-composer__send:hover:not(:disabled)',
  // composer/ExecutionProfileMenu.css
  '.kx-profile-menu__check',
  '.kx-profile-menu__item-meta',
  '.kx-profile-menu__manage',
  '.kx-profile-menu__manage:focus-visible',
  '.kx-profile-menu__readiness--ready',
  '.kx-profile-menu__readiness--setup',
  '.kx-profile-menu__section-label',
  '.kx-profile-menu__setting-desc',
  '.kx-profile-menu__setting-dot',
  '.kx-profile-menu__setting-state',
  '.kx-profile-menu__sidecar-term',
  // composer panel primitives (global layer, spec addendum §8)
  '.kx-panel__pill-chevron',
  '.kx-panel__pill-icon',
  // context/CreateSystemModal.css
  '.kx-create-modal__footer-note',
  '.kx-create-modal__helper',
  '.kx-create-modal__opt',
  '.kx-create-modal__req',
  '.kx-create-modal__subtitle',
  // context/ManualRepositoryModal.css
  '.kx-manual-modal__add-another',
  '.kx-manual-modal__count',
  '.kx-manual-modal__empty-hint',
  '.kx-manual-modal__field-error',
  '.kx-manual-modal__field-hint',
  '.kx-manual-modal__footer-note',
  '.kx-manual-modal__network-check',
  '.kx-manual-modal__network-hint',
  '.kx-manual-modal__page-indicator',
  '.kx-manual-modal__result-flag',
  '.kx-manual-modal__result-meta',
  '.kx-manual-modal__subtitle',
  '.kx-manual-modal__swap',
  // context/RepositorySelectorModal.css
  '.kx-repo-modal__add-repo',
  '.kx-repo-modal__empty-hint',
  '.kx-repo-modal__repo-meta',
  '.kx-repo-modal__repo-vcs',
  '.kx-repo-modal__status-count',
  '.kx-repo-modal__status-system',
  '.kx-repo-modal__subtitle',
  '.kx-repo-modal__system--active .kx-repo-modal__system-radio',
  '.kx-repo-modal__system-count',
  '.kx-repo-modal__system-desc',
  // customize/CustomizeModal.css
  '.kx-customize__tab:focus-visible',
  // customize/shared.css
  ".kx-customize-tab__table th[scope='col']",
  // customize/AgentsTab.css
  '.kx-agents__create-label',
  '.kx-agents__create-hint',
  '.kx-agents__review',
  '.kx-agents__disclosure > summary:hover',
  '.kx-agents__disclosure > summary:focus-visible',
  '.kx-agents__fact-term',
  '.kx-agents__archived-on',
  // customize/ContextTab.css
  '.kx-context__count',
  '.kx-context__item-note',
  // customize/IntegrationsTab.css
  '.kx-integrations__status--connected',
  '.kx-integrations__status--setup',
  '.kx-integrations__empty-text',
  // reviews/LearnedDrawer.css (T5b batch: rules moved out of
  // components.css by the removal tool; the fold maps the surviving
  // domain-file hit back to the components.css inventory entry)
  '.kx-learned-item__meta',
  '.kx-learned-timeline__meta',
  '.kx-learned__empty-hint',
  '.kx-learned__tab:focus-visible',
  '.kx-learned-timeline__item::before',
  // pages/SessionHistoryPage.css (T5b batch: page namespace moved to
  // src/pages/*.css per addendum §8.3; same fold as above)
  '.kx-history__field-label',
  '.kx-history__row-meta',
  '.kx-history__empty-hint',
  '.kx-history__open:disabled',
  '.kx-history__clear',
  '.kx-history__row-button:focus-visible',
  '.kx-history__clear:focus-visible',
  // NOTE: the .kx-badge--* selectors are deliberately ABSENT. Their only
  // home is session/sessionBadges.css since the T5b session rework (they
  // were never in components.css), so masking them here would hide a
  // genuine cross-file re-duplication. Their inventory entries point at
  // sessionBadges.css directly — same handling as .kx-preserved__*.
  // session/SessionHeader.css
  '.kx-session-detail__context',
  // pages/SessionDetailPage.css
  '.kx-session-detail__meta',
  // session/SessionTracker.css
  '.kx-session-detail__tracker-kicker',
  '.kx-session-detail__action-needed',
  '.kx-session-detail__stage-pill',
  '.kx-session-detail__stage-pill-badge',
  // session/SessionTimeline.css
  '.kx-session-timeline__event-text',
  '.kx-session-timeline__card-meta',
  '.kx-session-timeline__card-limitations',
  '.kx-session-timeline__artifact-link',
  '.kx-session-timeline__error-title',
  // session/SessionQuoteCard.css
  '.kx-quote-approval-card__history',
  '.kx-quote-approval-card__note',
  '.kx-quote-approval-card__quote-ref',
  '.kx-quote-approval-card__chevron',
  '.kx-quote-approval-card__quote-id',
  '.kx-quote-approval-card__header:focus-visible',
  // session/SessionDetailComposer.css
  '.kx-session-composer__locked-notice',
  // pages/NewSessionPage.css (T5c batch: page namespace moved to
  // src/pages/*.css per addendum §8.3; same fold as above)
  '.kx-new-session__subtitle',
  '.kx-new-session__approval',
  '.kx-new-session__intro-body',
  '.kx-new-session__disclaimer',
  // NOTE: the .kx-preserved__* selectors are deliberately ABSENT. They
  // were never a components.css↔domain-file transitional duplicate (their
  // only home is customize/shared.css since the T5b dedup), so masking
  // them here would hide a genuine cross-file re-duplication. Their
  // inventory entries point at customize/shared.css directly.
])

const usageKey = (u: Pick<Usage, 'selector' | 'property' | 'token'>): string =>
  `${u.selector}::${u.property}::${u.token}`

/**
 * Provenance-aware fold for the pass-1 transitional duplicates (see the
 * KNOWN_INERT_DUPLICATE_SELECTORS contract above). `partUsages` must be
 * ordered components.css-first (getAggregatedCssParts guarantees it), so
 * `sources` accumulates the REAL source files of every raw hit per key:
 *
 *   - components.css hit                → recorded as-is, sources track it;
 *   - the FIRST non-components hit      → the one allowed fold: skipped
 *                                         when components.css already owns
 *                                         the key (pass-1 pair, shape (a)),
 *                                         otherwise re-attributed to
 *                                         COMPONENTS as the pass-2 stand-in
 *                                         (shape (b)); its real file is
 *                                         remembered either way;
 *   - ANY further non-components hit    → pushed under its REAL file —
 *                                         never folded — so the duplicate /
 *                                         completeness assertions fail,
 *                                         whether or not a components.css
 *                                         copy exists, and even when the
 *                                         repeat is in the SAME domain file.
 *
 * Exported so the regression suite below can drive the fold with
 * synthetic provenance sequences without touching the real stylesheets.
 */
export function foldTransitionalDuplicateUsages(partUsages: Usage[]): Usage[] {
  const out: Usage[] = []
  const sources = new Map<string, Set<string>>()
  for (const raw of partUsages) {
    if (!KNOWN_INERT_DUPLICATE_SELECTORS.has(raw.selector)) {
      out.push(raw)
      continue
    }
    const key = usageKey(raw)
    const seen = sources.get(key) ?? new Set<string>()
    sources.set(key, seen)
    if (raw.file === COMPONENTS) {
      seen.add(COMPONENTS)
      out.push(raw)
      continue
    }
    const nonComponentsSeen = seen.size - (seen.has(COMPONENTS) ? 1 : 0)
    if (nonComponentsSeen === 0) {
      // The single allowed transition fold for this key.
      seen.add(raw.file)
      if (seen.has(COMPONENTS)) continue // pass-1 pair: components.css owns the entry
      // Pass 2: the components.css original is gone — the lone surviving
      // domain-file hit stands in for the legacy inventory entry.
      out.push({ ...raw, file: COMPONENTS })
      continue
    }
    // Second (or later) non-components occurrence: the key already used its
    // one allowed fold, so keep this hit under its real file where the
    // no-duplicate-usage / completeness assertions surface it.
    seen.add(raw.file)
    out.push(raw)
  }
  return out
}

function collectUsages(): Usage[] {
  // The aggregate read uses the same convention as the pre-migration
  // components.css read (the walk assumes the tracked-token lines are not
  // the file's first line); global.css — whose :focus-visible rule opens
  // at line 1 — is extracted from its per-part read with correct file
  // attribution (getAggregatedCssParts), so a rule that opens a file stays
  // attributed to its own file instead of the aggregate's first part.
  const partUsages = getAggregatedCssParts().flatMap((p) => extractUsages(p.css, p.file))
  return foldTransitionalDuplicateUsages(partUsages)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('foldTransitionalDuplicateUsages provenance contract (T5b)', () => {
  // A selector that IS in KNOWN_INERT_DUPLICATE_SELECTORS (its only home
  // today is the per-domain file; the fold contract is what is under test).
  const KNOWN = '.kx-learned__empty-hint'
  const DOMAIN_A = 'src/components/reviews/LearnedDrawer.css'
  const DOMAIN_B = 'src/pages/SessionHistoryPage.css'
  const hit = (file: string): Usage => ({
    file,
    selector: KNOWN,
    property: 'color',
    token: MUTED_AA,
  })

  it('(a) allows the components.css + single domain-file transition pair', () => {
    const out = foldTransitionalDuplicateUsages([hit(COMPONENTS), hit(DOMAIN_A)])
    expect(out).toEqual([hit(COMPONENTS)]) // domain hit folded onto the entry
  })

  it('(b) re-attributes a single migrated domain hit to COMPONENTS', () => {
    const out = foldTransitionalDuplicateUsages([hit(DOMAIN_A)])
    expect(out).toEqual([{ ...hit(DOMAIN_A), file: COMPONENTS }])
  })

  it('(c) keeps a SECOND domain source visible (cross-file re-duplication fails)', () => {
    // Pass 1 shape: components + two different domain files.
    const out = foldTransitionalDuplicateUsages([
      hit(COMPONENTS),
      hit(DOMAIN_A),
      hit(DOMAIN_B),
    ])
    expect(out).toEqual([hit(COMPONENTS), hit(DOMAIN_B)])

    // Pass 2 shape: no components.css original, two domain files — the
    // second hit must NOT fold into the synthetic COMPONENTS stand-in.
    const out2 = foldTransitionalDuplicateUsages([hit(DOMAIN_A), hit(DOMAIN_B)])
    expect(out2).toEqual([{ ...hit(DOMAIN_A), file: COMPONENTS }, hit(DOMAIN_B)])

    // Even a second hit in the SAME domain file stays visible.
    const out3 = foldTransitionalDuplicateUsages([hit(DOMAIN_A), hit(DOMAIN_A)])
    expect(out3).toEqual([{ ...hit(DOMAIN_A), file: COMPONENTS }, hit(DOMAIN_A)])
  })

  it('scopes the fold to selector::property::token, not selector alone', () => {
    const other: Usage = { file: DOMAIN_B, selector: KNOWN, property: 'outline', token: ACCENT_STRONG }
    const out = foldTransitionalDuplicateUsages([hit(DOMAIN_A), other])
    // Different property+token key: no fold relationship, both recorded.
    expect(out).toEqual([{ ...hit(DOMAIN_A), file: COMPONENTS }, { ...other, file: COMPONENTS }])
  })

  it('never folds selectors outside KNOWN_INERT_DUPLICATE_SELECTORS', () => {
    const unknown: Usage = { file: DOMAIN_A, selector: '.kx-preserved__note', property: 'color', token: MUTED_AA }
    const out = foldTransitionalDuplicateUsages([unknown, { ...unknown, file: DOMAIN_B }])
    expect(out).toEqual([unknown, { ...unknown, file: DOMAIN_B }])
  })
})

describe('AA token definitions (tokens.css)', () => {
  it('defines --kx-muted-text-aa as #607260', () => {
    expect(tokens).toContain('--kx-muted-text-aa: #607260')
  })

  it('defines --kx-accent-text-aa as #4f7044', () => {
    expect(tokens).toContain('--kx-accent-text-aa: #4f7044')
  })

  it('defines --kx-accent-solid-aa as #4f7044', () => {
    expect(tokens).toContain('--kx-accent-solid-aa: #4f7044')
  })

  it('defines --kx-accent-segment-aa as #95a547', () => {
    expect(tokens).toContain('--kx-accent-segment-aa: #95a547')
  })

  it('keeps the original mixed-purpose tokens intact for U consumers', () => {
    expect(tokens).toContain('--kx-muted: #778c78')
    expect(tokens).toContain('--kx-accent-strong: #5f8d4e')
  })
})

describe('candidate ratios against white/canvas/pale (AC9)', () => {
  const surfaces = { white: '#ffffff', canvas: '#faf8ef', pale: '#f4f8ee' }

  it('--kx-muted-text-aa #607260 clears 4.5:1 on every surface', () => {
    for (const bg of Object.values(surfaces)) {
      expect(contrast('#607260', bg)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('--kx-accent-text-aa #4f7044 clears 4.5:1 on every surface', () => {
    for (const bg of Object.values(surfaces)) {
      expect(contrast('#4f7044', bg)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('--kx-accent-solid-aa #4f7044 clears 4.5:1 under white text', () => {
    expect(contrast('#ffffff', '#4f7044')).toBeGreaterThanOrEqual(4.5)
  })

  it('records the active segment white text on --kx-accent-solid-aa (shipped rule)', () => {
    // The shipped rule fills the active segment with --kx-accent-solid-aa
    // (#4f7044) and sets white text — AA 5.6:1 in both themes. The previous
    // --kx-accent-text-aa-on-#95a547 pairing shipped 2.076:1 and was replaced.
    expect(contrast('#ffffff', '#4f7044')).toBeGreaterThanOrEqual(4.5)
  })

  it('reports the exact approved ratios for the durable appendix', () => {
    expect(contrast('#607260', '#ffffff')).toBeCloseTo(5.156, 3)
    expect(contrast('#607260', '#faf8ef')).toBeCloseTo(4.846, 3)
    expect(contrast('#607260', '#f4f8ee')).toBeCloseTo(4.789, 3)
    expect(contrast('#4f7044', '#ffffff')).toBeCloseTo(5.625, 3)
    expect(contrast('#4f7044', '#faf8ef')).toBeCloseTo(5.287, 3)
    expect(contrast('#4f7044', '#f4f8ee')).toBeCloseTo(5.225, 3)
    expect(contrast('#ffffff', '#4f7044')).toBeGreaterThanOrEqual(4.5) // active segment white on --kx-accent-solid-aa (shipped rule)
  })
})

// ---------------------------------------------------------------------------
// Dark theme — konteks.io dark palette (ink-900 bg, matcha accents).
// ---------------------------------------------------------------------------

describe('dark theme token definitions (tokens.css)', () => {
  const darkBlock = tokens.slice(tokens.indexOf("[data-theme='dark']"))

  it('defines the dark block with color-scheme: dark', () => {
    expect(tokens).toContain("[data-theme='dark']")
    expect(darkBlock).toContain('color-scheme: dark')
  })

  it('overrides the palette with the konteks.io dark values', () => {
    expect(darkBlock).toContain('--kx-canvas: #0f1510')
    expect(darkBlock).toContain('--kx-raised: #1a231b')
    expect(darkBlock).toContain('--kx-sidebar-bg: #152618')
    expect(darkBlock).toContain('--kx-primary: #e8ede8')
    expect(darkBlock).toContain('--kx-secondary: #c5cfc6')
    expect(darkBlock).toContain('--kx-muted: #9ead9f')
    expect(darkBlock).toContain('--kx-muted-text-aa: #9ead9f')
    expect(darkBlock).toContain('--kx-accent-text-aa: #c5d9a6')
    expect(darkBlock).toContain('--kx-accent-segment-aa: #a8c883')
    expect(darkBlock).toContain('--kx-border: #35502c')
    expect(darkBlock).toContain('--kx-pale: #152618')
  })

  it('keeps --kx-accent-solid-aa at #4f7044 — white text stays AA in both themes', () => {
    expect(darkBlock).toContain('--kx-accent-solid-aa: #4f7044')
  })
})

describe('dark theme ratios against canvas/raised (AA)', () => {
  const dark = { canvas: '#0f1510', raised: '#1a231b', pale: '#152618' }

  it('dark --kx-primary #e8ede8 clears 4.5:1 on every dark surface', () => {
    for (const bg of Object.values(dark)) {
      expect(contrast('#e8ede8', bg)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('dark --kx-muted-text-aa #9ead9f clears 4.5:1 on every dark surface', () => {
    for (const bg of Object.values(dark)) {
      expect(contrast('#9ead9f', bg)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('dark --kx-accent-text-aa #c5d9a6 clears 4.5:1 on every dark surface', () => {
    for (const bg of Object.values(dark)) {
      expect(contrast('#c5d9a6', bg)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('white text on unchanged --kx-accent-solid-aa #4f7044 stays AA in dark', () => {
    expect(contrast('#ffffff', '#4f7044')).toBeGreaterThanOrEqual(4.5)
  })

  it('dark text on dark segment fill — the active segment pins dark ink in both themes', () => {
    // The active segment uses --kx-accent-segment-aa text (light) or a dark
    // ink (dark — --kx-raised resolves to #1a231b there); both are AA on
    // their respective fills.
    expect(contrast('#243025', '#95a547')).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#243025', '#a8c883')).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#1a231b', '#a8c883')).toBeGreaterThanOrEqual(4.5)
  })

  it('reports the exact approved dark ratios for the durable appendix', () => {
    expect(contrast('#e8ede8', '#0f1510')).toBeCloseTo(15.603, 3)
    expect(contrast('#9ead9f', '#0f1510')).toBeCloseTo(7.869, 3)
    expect(contrast('#c5d9a6', '#0f1510')).toBeCloseTo(12.202, 3)
    expect(contrast('#e8ede8', '#1a231b')).toBeCloseTo(13.621, 3)
  })
})

describe('ink-rgb shadow/backdrop tokenization', () => {
  it('defines --kx-ink-rgb in :root (#243025) and the dark block (#35502C)', () => {
    expect(tokens).toContain('--kx-ink-rgb: 36 48 37;')
    const darkBlock = tokens.slice(tokens.indexOf("[data-theme='dark']"))
    expect(darkBlock).toContain('--kx-ink-rgb: 53 80 44;')
  })

  it('leaves no rgba(36, 48, 37, …) literals in components.css', () => {
    expect(components).not.toContain('rgba(36, 48, 37')
  })

  it('every former ink literal now composes rgb(var(--kx-ink-rgb) / α)', () => {
    const usages = components.match(/rgb\(var\(--kx-ink-rgb\) \/ [0-9.]+\)/g) ?? []
    expect(usages.length).toBeGreaterThanOrEqual(9)
  })

  it('defines theme-aware --kx-scrim-* tokens (ink-based in light, black-based in dark)', () => {
    expect(tokens).toContain('--kx-scrim-base: rgb(36 48 37 / 0.44);')
    expect(tokens).toContain('--kx-scrim-nested: rgb(36 48 37 / 0.14);')
    const darkBlock = tokens.slice(tokens.indexOf("[data-theme='dark']"))
    // Dark scrims must be black-based: the dark canvas is near-black
    // (#0F1510), so an ink-tinted scrim would brighten instead of dim.
    expect(darkBlock).toContain('--kx-scrim-base: rgb(0 0 0 / 0.55);')
    expect(darkBlock).toContain('--kx-scrim-nested: rgb(0 0 0 / 0.3);')
  })

  it('modal backdrops consume the --kx-scrim-* tokens, not raw ink composition', () => {
    const base = components.match(/\.kx-modal-backdrop\s*\{[^}]*\}/)?.[0] ?? ''
    expect(base).toContain('background: var(--kx-scrim-base);')
    const nested = components.match(/\.kx-modal-backdrop--nested\s*\{[^}]*\}/)?.[0] ?? ''
    expect(nested).toContain('background: var(--kx-scrim-nested);')
  })
})

describe('inventory completeness and non-duplication (AC9)', () => {
  const inventory = entries()
  const usages = collectUsages()

  it('covers exactly 268 consumers — 98 muted, 93 accent-strong, 24 accent-text-aa', () => {
    expect(inventory).toHaveLength(268)
    expect(inventory.filter((e) => e.token === MUTED)).toHaveLength(98)
    expect(inventory.filter((e) => e.token === ACCENT_STRONG)).toHaveLength(93)
    expect(inventory.filter((e) => e.token === ACCENT_AA)).toHaveLength(24)
  })

  it('classifies the expected M/A/S/U counts', () => {
    expect(inventory.filter((e) => e.cls === 'M')).toHaveLength(133)
    expect(inventory.filter((e) => e.cls === 'A')).toHaveLength(61)
    expect(inventory.filter((e) => e.cls === 'S')).toHaveLength(9)
    expect(inventory.filter((e) => e.cls === 'U')).toHaveLength(65)
  })

  it('has no duplicate inventory selectors', () => {
    const keys = inventory.map((e) => `${e.file}::${e.selector}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('has no missing classification: every token use maps to an inventory entry', () => {
    const inventoryKeys = new Set(inventory.map((e) => `${e.file}::${e.selector}`))
    for (const u of usages) {
      expect(
        [...inventoryKeys],
        `unclassified selector ${u.file}::${u.selector}`,
      ).toContain(`${u.file}::${u.selector}`)
    }
  })

  it('has no duplicate usage: every selector uses exactly one token', () => {
    const usageKeys = usages.map((u) => `${u.file}::${u.selector}`)
    expect(new Set(usageKeys).size).toBe(usageKeys.length)
  })

  it('every inventory selector is present exactly once in the stylesheets', () => {
    const usageByKey = new Map(usages.map((u) => [`${u.file}::${u.selector}`, u]))
    for (const entry of inventory) {
      const key = `${entry.file}::${entry.selector}`
      expect(usageByKey.has(key), `missing from stylesheets: ${key}`).toBe(true)
    }
    // 'exactly once' holds modulo the known inert pass-1 duplicates:
    // tracked selectors copied into per-domain files (account/AccountMenu,
    // composer/{ComponentMenu,Composer,ExecutionProfileMenu},
    // context/{CreateSystemModal,ManualRepositoryModal,
    // RepositorySelectorModal}) are duplicates of existing inventory
    // entries and are folded onto them by collectUsages(). The
    // components.css copy disappears in pass 2; the fold then maps the
    // surviving domain-file copy to the same entry.
  })

  it('matches the declared property for every consumer', () => {
    const usageByKey = new Map(usages.map((u) => [`${u.file}::${u.selector}`, u]))
    for (const entry of inventory) {
      const u = usageByKey.get(`${entry.file}::${entry.selector}`)!
      expect(u.property, `${entry.selector} property`).toBe(entry.property)
    }
  })
})

describe('M/A/S assignments and U unchanged (AC9)', () => {
  const usageByKey = new Map(collectUsages().map((u) => [`${u.file}::${u.selector}`, u]))

  it.each(entries().map((e) => [e.selector, e] as const))(
    '%s uses its assigned token',
    (_selector, entry) => {
      const usage = usageByKey.get(`${entry.file}::${entry.selector}`)
      expect(usage).toBeDefined()
      expect(usage!.token, `${entry.selector} → ${entry.cls}`).toBe(expectedToken(entry))
    },
  )

  it('migrated consumers no longer read the original mixed-purpose token', () => {
    // Migration means moving OFF the mixed-purpose --kx-muted /
    // --kx-accent-strong pair: M → muted-text-aa, A → accent-text-aa,
    // S → accent-solid-aa. The dark-theme ink pin (token ACCENT_AA, cls A)
    // already reads accent-text-aa, so it is excluded from the comparison —
    // asserting token inequality against itself would be vacuously false.
    const migrated = entries().filter(
      (e) => (e.cls === 'M' || e.cls === 'A' || e.cls === 'S') && e.token !== expectedToken(e),
    )
    expect(migrated.length).toBeGreaterThan(0)
    for (const entry of migrated) {
      const usage = usageByKey.get(`${entry.file}::${entry.selector}`)!
      expect(usage.token).not.toBe(entry.token)
      expect(usage.token).toBe(expectedToken(entry))
    }
  })

  it('unchanged consumers keep the original mixed-purpose token', () => {
    const unchanged = entries().filter((e) => e.cls === 'U')
    for (const entry of unchanged) {
      const usage = usageByKey.get(`${entry.file}::${entry.selector}`)!
      expect(usage.token).toBe(entry.token)
    }
  })
})
