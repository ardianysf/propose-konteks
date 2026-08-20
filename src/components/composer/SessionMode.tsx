/*
 * SessionMode — the dominant Engineering/QA/Planning segmented control
 * (Task 5, spec §7.1, AC15; QA added between Engineering and Planning).
 *
 * Reducer-bound: radios commit SET_MODE to the shared store; the page
 * (NewSessionPage) reads the mode and swaps its regions. Rendered with a
 * visible uppercase "SESSION MODE" label above the segmented control,
 * right-aligned in the composer's setup/mode top row (AC15). Semantic
 * radiogroup with roving tabindex + arrow-key switching (§16 keyboard
 * operability).
 */
import type { KeyboardEvent } from 'react'
import { useMockup } from '../../state/MockupContext'
import type { SessionMode as Mode } from '../../state/mockupReducer'
import './SessionMode.css'

const MODES: { id: Mode; label: string }[] = [
  { id: 'engineering', label: 'Engineering' },
  { id: 'qa', label: 'QA' },
  { id: 'planning', label: 'Planning' },
]

export default function SessionMode() {
  const { state, dispatch } = useMockup()

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0
    if (delta === 0) return
    event.preventDefault()
    const index = MODES.findIndex((mode) => mode.id === state.sessionMode)
    const next = MODES[(index + delta + MODES.length) % MODES.length]
    dispatch({ type: 'SET_MODE', mode: next.id })
  }

  return (
    <div className="kx-session-mode" data-testid="session-mode">
      {/* Visible uppercase caption — sits above the radio group. */}
      <span className="kx-session-mode__label">SESSION MODE</span>
      <div
        className="kx-segmented kx-session-mode__group"
        role="radiogroup"
        aria-label="Session mode"
        onKeyDown={handleKeyDown}
      >
        {MODES.map((mode) => {
          const active = state.sessionMode === mode.id
          return (
            <button
              key={mode.id}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              className={
                active
                  ? 'kx-segmented__btn kx-segmented__btn--active'
                  : 'kx-segmented__btn'
              }
              onClick={() => dispatch({ type: 'SET_MODE', mode: mode.id })}
            >
              {mode.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
