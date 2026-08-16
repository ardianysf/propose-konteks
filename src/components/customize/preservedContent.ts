/*
 * preservedContent — the typed adapter for the top-level Customize →
 * Skills / Tools tabs (Task 9 Part C, spec §11, AC38).
 *
 * It adapts the preserved Skills/Tools content from mockData
 * (PRESERVED_SKILLS / PRESERVED_TOOLS) into the structured view model
 * the new shell renders: item names, descriptions, scopes, and
 * enabled/toggle states, plus the compact per-tab action metadata
 * (header action, list label, count wording, illustrative note). The
 * adapter is the single seam between the data and the two tabs, so
 * the shell renders the preserved content unchanged (AC38). Every
 * value is illustrative (AC46) — the toggles are local-only mock
 * interactions, there is no network or backend, and nothing persists.
 */
import { PRESERVED_SKILLS, PRESERVED_TOOLS, type PreservedItem } from '../../data/mockData'

/** One preserved Skills/Tools entry as rendered inside the shell. */
export interface PreservedContentItem {
  id: string
  name: string
  description: string
  scope: string
  /** Enabled/toggle state carried over from the preserved data. */
  enabled: boolean
}

/** Per-tab view model — items plus the compact action metadata. */
export interface PreservedContentSection {
  title: string
  /** Accessible name for the tab's semantic item list. */
  listLabel: string
  /** Compact header action — local-only, like the integration tabs. */
  actionLabel: string
  /** Visible illustrative marker (AC46): mock content, nothing persists. */
  note: string
  items: PreservedContentItem[]
}

/** Status chip text mirroring an item's enabled state. */
export const preservedStatusLabel = (enabled: boolean): string =>
  enabled ? 'Enabled' : 'Disabled'

/** Count line summarizing how many preserved items are enabled. */
export const preservedCountLine = (items: readonly PreservedContentItem[]): string =>
  `${items.filter((item) => item.enabled).length} of ${items.length} enabled`

function toSection(
  title: string,
  listLabel: string,
  actionLabel: string,
  note: string,
  items: PreservedItem[],
): PreservedContentSection {
  return {
    title,
    listLabel,
    actionLabel,
    note,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      scope: item.scope,
      enabled: item.enabled,
    })),
  }
}

/** Skills tab view model — adapted from PRESERVED_SKILLS. */
export const SKILLS_SECTION: PreservedContentSection = toSection(
  'Skills',
  'Preserved skills',
  'Add skill',
  'Illustrative preserved skills — toggles are local and not stored in this mockup.',
  PRESERVED_SKILLS,
)

/** Tools tab view model — adapted from PRESERVED_TOOLS. */
export const TOOLS_SECTION: PreservedContentSection = toSection(
  'Tools',
  'Preserved tools',
  'Add tool',
  'Illustrative preserved tools — toggles are local and not stored in this mockup.',
  PRESERVED_TOOLS,
)
