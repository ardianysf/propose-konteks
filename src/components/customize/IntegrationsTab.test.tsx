/*
 * IntegrationsTab unit tests — verifies all three valid variants render
 * correctly and the runtime guard handles invalid variants gracefully.
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import IntegrationsTab, { type IntegrationsVariant } from './IntegrationsTab'

describe('IntegrationsTab', () => {
  describe('valid variants', () => {
    it('renders variant=mcp without errors', () => {
      // Should not throw - this was the original crash scenario
      // Verify the component renders with expected content
      const { unmount } = render(<IntegrationsTab variant="mcp" />)

      // Check that the title is visible
      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toBeVisible()
      expect(title).toHaveTextContent('MCP')

      // Check that the action button is visible
      const actionButton = screen.getByRole('button', { name: /Add MCP server/i })
      expect(actionButton).toBeVisible()

      // Verify table is rendered
      expect(screen.getByRole('table', { name: /MCP servers/i })).toBeVisible()

      unmount()
    })

    it('renders variant=connectors without errors', () => {
      const { unmount } = render(<IntegrationsTab variant="connectors" />)

      // Check that the title is visible
      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toBeVisible()
      expect(title).toHaveTextContent('Connectors')

      // Check that the action button is visible
      const actionButton = screen.getByRole('button', { name: /Add connector/i })
      expect(actionButton).toBeVisible()

      // With the current mock data, CONNECTORS array is empty, so we should see empty state
      const emptyState = screen.getByText(/No connectors yet/i)
      expect(emptyState).toBeVisible()

      unmount()
    })

    it('renders variant=vcs without errors', () => {
      const { unmount } = render(<IntegrationsTab variant="vcs" />)

      // Check that the title is visible
      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toBeVisible()
      expect(title).toHaveTextContent('VCS')

      // Check that the action button is visible
      const actionButton = screen.getByRole('button', { name: /Connect VCS/i })
      expect(actionButton).toBeVisible()

      // Verify table is rendered
      expect(screen.getByRole('table', { name: /VCS connectors/i })).toBeVisible()

      unmount()
    })
  })

  describe('runtime variant guard', () => {
    it('renders error state for invalid variant string', () => {
      // This simulates the original crash scenario where an invalid variant
      // was passed at runtime, causing "Element type is invalid" error
      const { unmount } = render(<IntegrationsTab variant={'invalid' as IntegrationsVariant} />)

      // Should render error state instead of crashing
      const errorMessage = screen.getByText(/Invalid variant/i)
      expect(errorMessage).toBeVisible()

      // Should display the invalid value
      expect(screen.getByText(/Invalid variant/i)).toBeVisible()
      expect(screen.getByText(/invalid/).closest('code')).toBeInTheDocument()

      // Should list valid variants
      expect(screen.getByText(/mcp/i)).toBeVisible()
      expect(screen.getByText(/connectors/i)).toBeVisible()
      expect(screen.getByText(/vcs/i)).toBeVisible()

      // Should NOT render any tables (which would crash with undefined Content)
      expect(screen.queryByRole('table')).not.toBeInTheDocument()

      unmount()
    })

    it('renders error state for undefined variant', () => {
      const { unmount } = render(<IntegrationsTab variant={undefined as unknown as IntegrationsVariant} />)

      // Should render error state instead of crashing
      expect(screen.getByText(/Invalid variant/i)).toBeVisible()

      unmount()
    })

    it('renders error state for null variant', () => {
      const { unmount } = render(<IntegrationsTab variant={null as unknown as IntegrationsVariant} />)

      // Should render error state instead of crashing
      expect(screen.getByText(/Invalid variant/i)).toBeVisible()

      unmount()
    })
  })

  describe('registry contract', () => {
    it('supports all three variants required by catalog registry', () => {
      // The catalog registry explicitly uses these three variants
      const registryVariants: IntegrationsVariant[] = ['mcp', 'connectors', 'vcs']

      registryVariants.forEach((variant) => {
        expect(() => {
          const { unmount } = render(<IntegrationsTab variant={variant} />)
          unmount()
        }).not.toThrow()
      })
    })
  })
})
