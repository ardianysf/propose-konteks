/*
 * DotMatrixLoader — unit tests.
 *
 * Covers: 9 dots per variant, aria contract, custom label/size, per-dot
 * custom props, and the prefers-reduced-motion static fallback (jsdom
 * matchMedia stub — the glyph skips its rAF loop and renders the static
 * mask; CSS variants rely on the stylesheet, so we assert the props stay).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DotMatrixLoader, {
  DOT_MATRIX_VARIANTS,
  prefersReducedMotion,
} from './DotMatrixLoader'

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

function dots(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('.kx-dmx__dot'))
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('DotMatrixLoader', () => {
  it.each(DOT_MATRIX_VARIANTS)('renders 9 dots for the %s variant', (variant) => {
    const { container } = render(<DotMatrixLoader variant={variant} />)
    expect(container.querySelector('.kx-dmx')).toHaveClass(`kx-dmx--${variant}`)
    expect(dots(container)).toHaveLength(9)
  })

  it('defaults to the spiral variant', () => {
    const { container } = render(<DotMatrixLoader />)
    expect(container.querySelector('.kx-dmx')).toHaveClass('kx-dmx--spiral')
  })

  it('exposes role=status, aria-live=polite and the default aria-label', () => {
    render(<DotMatrixLoader />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveAttribute('aria-label', 'Memuat')
  })

  it('supports a custom label and size', () => {
    render(<DotMatrixLoader label="Menyusun jawaban" size={30} />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-label', 'Menyusun jawaban')
    expect(status.style.getPropertyValue('--kx-dmx-size')).toBe('30px')
  })

  it('sets row/col custom props on every dot (row-major 0..2)', () => {
    const { container } = render(<DotMatrixLoader variant="spiral" />)
    const all = dots(container)
    expect(all[0].style.getPropertyValue('--kx-dmx-row')).toBe('0')
    expect(all[0].style.getPropertyValue('--kx-dmx-col')).toBe('0')
    expect(all[4].style.getPropertyValue('--kx-dmx-row')).toBe('1')
    expect(all[4].style.getPropertyValue('--kx-dmx-col')).toBe('1')
    expect(all[8].style.getPropertyValue('--kx-dmx-row')).toBe('2')
    expect(all[8].style.getPropertyValue('--kx-dmx-col')).toBe('2')
  })

  it('drives each variant with its own delay custom prop', () => {
    // spiral: clockwise-in order rank, center dot (index 4) last.
    const spiral = render(<DotMatrixLoader variant="spiral" />)
    expect(dots(spiral.container)[0].style.getPropertyValue('--kx-dmx-order')).toBe('0')
    expect(dots(spiral.container)[4].style.getPropertyValue('--kx-dmx-order')).toBe('8')
    spiral.unmount()

    // drift: diagonal path (row+col)/4, bottom-right corner = 1.
    const drift = render(<DotMatrixLoader variant="drift" />)
    expect(dots(drift.container)[8].style.getPropertyValue('--kx-dmx-path')).toBe('1')
    drift.unmount()

    // ripple: euclidean distance from center — corners √2, center 0.
    const ripple = render(<DotMatrixLoader variant="ripple" />)
    expect(Number(dots(ripple.container)[0].style.getPropertyValue('--kx-dmx-distance'))).toBeCloseTo(Math.SQRT2, 5)
    expect(dots(ripple.container)[4].style.getPropertyValue('--kx-dmx-distance')).toBe('0')
    ripple.unmount()

    // echo: manhattan ring (clamped 0..2) + parity shimmer.
    const echo = render(<DotMatrixLoader variant="echo" />)
    expect(dots(echo.container)[0].style.getPropertyValue('--kx-dmx-ring')).toBe('2')
    expect(dots(echo.container)[0].style.getPropertyValue('--kx-dmx-parity')).toBe('0')
    expect(dots(echo.container)[1].style.getPropertyValue('--kx-dmx-ring')).toBe('1')
    expect(dots(echo.container)[1].style.getPropertyValue('--kx-dmx-parity')).toBe('1')
    echo.unmount()
  })
})

// ---------------------------------------------------------------------------
// prefers-reduced-motion — static fallback (global.css kills animations;
// the component additionally skips the glyph rAF loop)
// ---------------------------------------------------------------------------

describe('DotMatrixLoader — prefers-reduced-motion', () => {
  it('reports reduced motion through the guarded matchMedia helper', () => {
    expect(prefersReducedMotion()).toBe(false) // jsdom: no matchMedia by default
    stubMatchMedia(true)
    expect(prefersReducedMotion()).toBe(true)
  })

  it('glyph renders the static mask and never starts the rAF loop', () => {
    stubMatchMedia(true)
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame')
    const { container } = render(<DotMatrixLoader variant="glyph" />)

    const all = dots(container)
    // Smiley mask [1,0,1, 0,0,0, 0,1,0]: on dots at 0.5, off dots at 0.09.
    expect(all[0]).toHaveStyle({ opacity: '0.5' })
    expect(all[2]).toHaveStyle({ opacity: '0.5' })
    expect(all[7]).toHaveStyle({ opacity: '0.5' })
    expect(all[1]).toHaveStyle({ opacity: '0.09' })
    expect(all[4]).toHaveStyle({ opacity: '0.09' })
    expect(rafSpy).not.toHaveBeenCalled()
  })

  it('glyph animates via rAF when motion is allowed', () => {
    stubMatchMedia(false)
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1)
    const { container, unmount } = render(<DotMatrixLoader variant="glyph" />)
    expect(rafSpy).toHaveBeenCalled()
    // Mask at phase 0: eyes+mouth on.
    expect(dots(container)[0]).toHaveStyle({ opacity: '0.88' })
    expect(dots(container)[1]).toHaveStyle({ opacity: '0.09' })
    unmount()
  })

  it('keeps the per-dot driver props for CSS variants (static gradient in CSS)', () => {
    stubMatchMedia(true)
    const { container } = render(<DotMatrixLoader variant="spiral" />)
    const all = dots(container)
    expect(all[0].style.getPropertyValue('--kx-dmx-order')).toBe('0')
    expect(all[8].style.getPropertyValue('--kx-dmx-order')).toBe('4')
    expect(all).toHaveLength(9)
  })
})

// ---------------------------------------------------------------------------
// Reduced-motion CSS static fallback — asserted on the stylesheet contents
// (repo pattern: see src/styles/tokens.test.ts reading CSS files directly).
// ---------------------------------------------------------------------------

// jsdom rewrites import.meta.url to an http origin, so resolve from cwd instead.
const loaderCss = readFileSync(join(process.cwd(), 'src/components/ui/DotMatrixLoader.css'), 'utf8')

/** Extracts the top-level `@media (prefers-reduced-motion: reduce)` block
 * by brace matching (returns '' when absent). */
function reducedMotionBlock(css: string): string {
  const start = css.indexOf('@media (prefers-reduced-motion: reduce)')
  if (start === -1) return ''
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i += 1) {
    if (css[i] === '{') depth += 1
    else if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return css.slice(start, i + 1)
    }
  }
  return ''
}

describe('DotMatrixLoader.css — prefers-reduced-motion static fallback', () => {
  it.each(['spiral', 'drift', 'ripple', 'echo'] as const)(
    'disables the animation for the %s variant in the reduced-motion block',
    (variant) => {
      const block = reducedMotionBlock(loaderCss)
      expect(block).not.toBe('')
      const ruleStart = block.indexOf(`.kx-dmx--${variant} .kx-dmx__dot`)
      expect(ruleStart).toBeGreaterThan(-1)
      const rule = block.slice(ruleStart, block.indexOf('}', ruleStart) + 1)
      expect(rule).toContain('animation: none')
    },
  )
})
