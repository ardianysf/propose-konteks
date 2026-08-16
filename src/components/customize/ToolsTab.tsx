/*
 * ToolsTab — the top-level Customize → Tools tab content (Task 9
 * Part C, spec §11, AC38).
 *
 * The preserved Tools functionality and content inside the new shell
 * styling: a semantic list driven by the preservedContent adapter —
 * each row carries the item name, description, scope, a status chip,
 * and an enabled/disabled switch. The switch is a local-only mock
 * interaction: it flips the row's visual state and the enabled count
 * in place, but nothing is persisted and no network is touched
 * (AC46). The tab closes with the visible illustrative note.
 */
import { useState } from 'react'
import {
  preservedCountLine,
  preservedStatusLabel,
  TOOLS_SECTION,
  type PreservedContentItem,
} from './preservedContent'

export default function ToolsTab() {
  // Local-only toggle overrides — item id → enabled. The mock switch
  // never touches the committed store; flipping uses the merged
  // (override ?? preserved) state so the first click always moves.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})

  const items: PreservedContentItem[] = TOOLS_SECTION.items.map((item) => ({
    ...item,
    enabled: overrides[item.id] ?? item.enabled,
  }))

  const toggle = (id: string, enabled: boolean) =>
    setOverrides((current) => ({ ...current, [id]: !enabled }))

  return (
    <section className="kx-customize-tab kx-customize-tab--tools">
      <header className="kx-customize-tab__bar">
        <h3 className="kx-customize-tab__title">{TOOLS_SECTION.title}</h3>
        <button
          type="button"
          className="kx-btn kx-btn--ghost kx-preserved__action"
        >
          {TOOLS_SECTION.actionLabel}
        </button>
      </header>

      <p className="kx-preserved__count">{preservedCountLine(items)}</p>

      <ul className="kx-preserved__list" aria-label={TOOLS_SECTION.listLabel}>
        {items.map((item) => (
          <li key={item.id} className="kx-preserved__item">
            <div className="kx-preserved__item-main">
              <span className="kx-preserved__item-name">{item.name}</span>
              <span className="kx-preserved__item-desc">{item.description}</span>
            </div>
            <div className="kx-preserved__item-side">
              <span className="kx-preserved__item-scope">{item.scope}</span>
              <span
                className={
                  item.enabled
                    ? 'kx-preserved__status kx-preserved__status--enabled'
                    : 'kx-preserved__status kx-preserved__status--disabled'
                }
              >
                {preservedStatusLabel(item.enabled)}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={item.enabled}
                aria-label={`Toggle ${item.name}`}
                className={
                  item.enabled
                    ? 'kx-preserved__toggle kx-preserved__toggle--on'
                    : 'kx-preserved__toggle'
                }
                onClick={() => toggle(item.id, item.enabled)}
              >
                <span className="kx-preserved__toggle-knob" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <p className="kx-preserved__note">{TOOLS_SECTION.note}</p>
    </section>
  )
}
