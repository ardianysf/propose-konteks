/*
 * SessionMode — the dominant Engineering/Planning segmented control
 * (Task 5, spec §7.1, AC15).
 *
 * Reducer-bound: radios commit SET_MODE to the shared store; the page
 * (NewSessionPage) reads the mode and swaps its regions. Rendered above
 * the setup row and composer, scaled up so it reads as the primary
 * hierarchy element of the main area (AC15). Semantic radiogroup with
 * roving tabindex + arrow-key switching (§16 keyboard operability).
 */
import type { KeyboardEvent } from 'react'
import { useMockup } from '../../state/MockupContext'
import type { SessionMode as Mode } from '../../state/mockupReducer'

const MODES: { id: Mode; label: string }[] = [
  { id: 'engineering', label: 'Engineering' },
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
    <div
      className="kx-segmented kx-session-mode kx-session-mode--dominant"
      role="radiogroup"
      aria-label="Session mode"
      data-testid="session-mode"
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
  )
}
