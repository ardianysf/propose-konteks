/*
 * Contract tests for workspace-menu (T4-rework): WorkspaceMenu is classified
 * "adoptable" but is NOT presentation-only-without-context — it calls
 * useOverlayLifecycle() (Escape/dismiss → CLOSE_OVERLAY), so it REQUIRES an
 * OverlayLifecycleProvider above it (props overlay + dispatch). It does NOT
 * need MockupContext (contextContract stays null per verify-manifest S7).
 *
 * These tests pin the honest contract:
 *  1. Rendering <WorkspaceMenu /> with NO OverlayLifecycleProvider throws
 *     (the useOverlayLifecycle error), captured by an error boundary.
 *  2. The manifest entry documents the provider dependency (adoptionNotes +
 *     description mention OverlayLifecycleProvider) and keeps
 *     contextContract null.
 */
import { Component, type ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import WorkspaceMenu from '../components/shell/WorkspaceMenu'
import { getManifestEntry } from './manifest'

// Minimal class error boundary to capture the render throw.
class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return <div data-testid="boundary-error">{this.state.error.message}</div>
    }
    return this.props.children
  }
}

describe('workspace-menu contract', () => {
  it('throws when rendered WITHOUT an OverlayLifecycleProvider', () => {
    // Silence React's expected error logging for this throw.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      render(
        <Boundary>
          <WorkspaceMenu />
        </Boundary>,
      )
      const err = screen.getByTestId('boundary-error')
      expect(err.textContent).toContain('useOverlayLifecycle')
      expect(err.textContent).toMatch(/no OverlayLifecycleProvider/)
    } finally {
      spy.mockRestore()
    }
  })

  it('manifest documents the OverlayLifecycleProvider dependency and keeps contextContract null', () => {
    const entry = getManifestEntry('workspace-menu')
    expect(entry).toBeDefined()
    expect(entry!.classification).toBe('adoptable')
    // Provider dependency is documented in notes/description, not in
    // contextContract (which is reserved for MockupContext reads/dispatches).
    expect(entry!.adoptionNotes).toContain('OverlayLifecycleProvider')
    expect(entry!.description).toContain('OverlayLifecycleProvider')
    expect(entry!.contextContract).toBeNull()
  })
})
