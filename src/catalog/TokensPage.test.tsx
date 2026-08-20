/*
 * Unit tests for the T4 tokens page (AC7): groups render from the typed
 * token list, values come from (mocked) getComputedStyle, and the theme
 * toggle stamps data-theme and refreshes the displayed values.
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TokensPage } from './pages/TokensPage'
import { ALL_TOKEN_NAMES, TOKEN_GROUPS } from './tokens'

/** Deterministic per-token values so the mock distinguishes light/dark. */
function fakeGetComputedStyle(theme: string) {
  return () =>
    ({
      getPropertyValue: (name: string) =>
        name.startsWith('--kx-') ? `${theme}-value:${name}` : '',
    }) as unknown as CSSStyleDeclaration
}

describe('TokensPage', () => {
  let originalGetComputedStyle: typeof window.getComputedStyle

  beforeEach(() => {
    document.documentElement.dataset.theme = 'light'
    originalGetComputedStyle = window.getComputedStyle
    window.getComputedStyle = vi.fn(fakeGetComputedStyle('light'))
  })

  afterEach(() => {
    window.getComputedStyle = originalGetComputedStyle
  })

  it('renders every token group with all token names', () => {
    render(<TokensPage />)

    for (const group of TOKEN_GROUPS) {
      expect(
        screen.getByRole('heading', { name: group.title }),
      ).toBeInTheDocument()
    }
    for (const name of ALL_TOKEN_NAMES) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('shows values read via getComputedStyle (mocked)', () => {
    render(<TokensPage />)

    expect(window.getComputedStyle).toHaveBeenCalled()
    expect(screen.getByText('light-value:--kx-canvas')).toBeInTheDocument()
    expect(screen.getByText('light-value:--kx-text-md')).toBeInTheDocument()
  })

  it('theme toggle stamps data-theme and refreshes displayed values', () => {
    render(<TokensPage />)

    const darkButton = screen.getByRole('button', { name: 'Dark' })
    const lightButton = screen.getByRole('button', { name: 'Light' })
    expect(lightButton).toHaveAttribute('aria-pressed', 'true')

    window.getComputedStyle = vi.fn(fakeGetComputedStyle('dark'))
    fireEvent.click(darkButton)

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(darkButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('dark-value:--kx-canvas')).toBeInTheDocument()
    expect(screen.queryByText('light-value:--kx-canvas')).not.toBeInTheDocument()
  })

  it('falls back to an empty-value dash when computed values are unavailable', () => {
    window.getComputedStyle = vi.fn(() => {
      throw new Error('jsdom')
    })
    render(<TokensPage />)

    // No crash; every row renders its fallback dash.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.getByText('--kx-canvas')).toBeInTheDocument()
  })
})
