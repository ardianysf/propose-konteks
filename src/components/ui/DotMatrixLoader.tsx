/*
 * DotMatrixLoader — 3×3 dot-matrix loading indicator (5 variants).
 *
 * Pure opacity animation on 9 currentColor dots; the root inherits
 * `color: var(--kx-primary)` from the cascade, so light/dark themes both
 * work with zero extra theming. Four variants are pure CSS keyframes with
 * per-dot custom-prop delays; `glyph` runs a requestAnimationFrame phase
 * clock (stopped on unmount and while document.hidden). Under
 * prefers-reduced-motion the CSS variants fall back to a static gradient
 * (see DotMatrixLoader.css — global.css force-disables animations) and the
 * glyph skips the rAF loop, rendering the static mask.
 */
import { useEffect, useState, type CSSProperties } from 'react'
import './DotMatrixLoader.css'

export type DotMatrixVariant = 'spiral' | 'drift' | 'ripple' | 'echo' | 'glyph'

/** Deterministic rotation order — the session timeline cycles its pending
 * phases through these variants (see session/pendingPhases.ts). */
export const DOT_MATRIX_VARIANTS: readonly DotMatrixVariant[] = [
  'spiral',
  'drift',
  'ripple',
  'echo',
  'glyph',
]

export interface DotMatrixLoaderProps {
  /** Animation variant (default 'spiral'). */
  variant?: DotMatrixVariant
  /** Root width/height in px (default 22). */
  size?: number
  /** Accessible name announced via role="status" (default 'Memuat'). */
  label?: string
}

// spiral: clockwise-in order rank per row-major dot (center dot last).
const SPIRAL_ORDER = [0, 1, 2, 5, 8, 7, 6, 3, 4]
// ripple: euclidean distance from the center dot (0 | 1 | √2 | 2).
const RIPPLE_DISTANCE = [Math.SQRT2, 1, Math.SQRT2, 1, 0, 1, Math.SQRT2, 1, Math.SQRT2]
// echo: manhattan ring clamped 0..2; parity = ring % 2 (shimmer offset).
const ECHO_RING = [2, 1, 2, 1, 0, 1, 2, 1, 2]

/** True when the user prefers reduced motion. Guarded for environments
 * without matchMedia (e.g. jsdom without a stub). */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Per-dot CSS custom props driving each variant's animation delay (and the
 * reduced-motion static gradient — see DotMatrixLoader.css). */
function dotCustomProps(variant: DotMatrixVariant, index: number): CSSProperties {
  const row = Math.floor(index / 3)
  const col = index % 3
  const props: Record<string, number> = {
    '--kx-dmx-row': row,
    '--kx-dmx-col': col,
  }
  switch (variant) {
    case 'spiral':
      props['--kx-dmx-order'] = SPIRAL_ORDER[index]
      break
    case 'drift':
      props['--kx-dmx-path'] = (row + col) / 4
      break
    case 'ripple':
      props['--kx-dmx-distance'] = RIPPLE_DISTANCE[index]
      break
    case 'echo':
      props['--kx-dmx-ring'] = ECHO_RING[index]
      props['--kx-dmx-parity'] = ECHO_RING[index] % 2
      break
    case 'glyph':
      break
  }
  return props as CSSProperties
}

// ---------------------------------------------------------------------------
// glyph — rAF phase clock (smiley mask tumbling clockwise)
// ---------------------------------------------------------------------------

/** Smiley mask, row-major: eyes top corners + mouth bottom center. */
const GLYPH_MASK = [1, 0, 1, 0, 0, 0, 0, 1, 0]
const GLYPH_CYCLE_MS = 720
const GLYPH_STATIC_ON = 0.5
const GLYPH_STATIC_OFF = 0.09

/** One clockwise 90° turn maps (r,c) → (c, 2−r). */
function rotateClockwise(mask: readonly number[]): number[] {
  const out = new Array<number>(9).fill(0)
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      out[c * 3 + (2 - r)] = mask[r * 3 + c]
    }
  }
  return out
}

// Precomputed mask at 0..3 clockwise turns (turn 4 ≡ turn 0).
const GLYPH_ROTATIONS: number[][] = [GLYPH_MASK.slice()]
for (let turn = 1; turn < 4; turn += 1) {
  GLYPH_ROTATIONS.push(rotateClockwise(GLYPH_ROTATIONS[turn - 1]))
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

/** Dot opacities for a phase in [0,1): the mask blends through its four
 * clockwise turns across the cycle, smoothstep-eased within each turn. */
function glyphOpacities(phase: number): number[] {
  const clamped = Math.min(1, Math.max(0, phase))
  const scaled = clamped * 4
  const turns = Math.floor(scaled) % 4
  const t = smoothstep(scaled - Math.floor(scaled))
  const current = GLYPH_ROTATIONS[turns]
  const next = GLYPH_ROTATIONS[(turns + 1) % 4]
  return current.map((w, i) => GLYPH_STATIC_OFF + (w * (1 - t) + next[i] * t) * 0.79)
}

/** Shared rAF clock: looping phase in [0,1) over `cycleMs`. Stops on
 * unmount and while document.hidden; never runs under reduced motion. */
function useRafPhase(cycleMs: number, enabled: boolean): number {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    if (!enabled) return undefined
    let rafId = 0
    let start: number | null = null
    const tick = (now: number) => {
      if (start === null) start = now
      setPhase(((now - start) % cycleMs) / cycleMs)
      rafId = requestAnimationFrame(tick)
    }
    const stop = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = 0
    }
    const startLoop = () => {
      if (document.hidden) return
      if (!rafId) rafId = requestAnimationFrame(tick)
    }
    const onVisibilityChange = () => {
      if (document.hidden) stop()
      else startLoop()
    }
    // Start only when the document is visible — the visibilitychange
    // handler restarts the loop when the tab becomes visible again.
    startLoop()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [cycleMs, enabled])
  return phase
}

export default function DotMatrixLoader({
  variant = 'spiral',
  size = 22,
  label = 'Memuat',
}: DotMatrixLoaderProps) {
  const reducedMotion = prefersReducedMotion()
  const phase = useRafPhase(GLYPH_CYCLE_MS, variant === 'glyph' && !reducedMotion)

  // glyph is JS-driven: opacity per dot from the phase clock, or the static
  // mask under reduced motion. The other variants are CSS-only.
  const dotOpacities =
    variant === 'glyph'
      ? reducedMotion
        ? GLYPH_MASK.map((on) => (on ? GLYPH_STATIC_ON : GLYPH_STATIC_OFF))
        : glyphOpacities(phase)
      : null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`kx-dmx kx-dmx--${variant}`}
      style={{ '--kx-dmx-size': `${size}px` } as CSSProperties}
      data-testid="dot-matrix-loader"
    >
      {Array.from({ length: 9 }, (_, index) => {
        const style = dotCustomProps(variant, index)
        if (dotOpacities) style.opacity = dotOpacities[index]
        return <span key={index} className="kx-dmx__dot" style={style} />
      })}
    </div>
  )
}
