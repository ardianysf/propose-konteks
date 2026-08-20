/*
 * registry.tsx (Task T3a, extended T4) — the runtime registry mirroring
 * src/catalog/components.json 1:1 (32 entries).
 *
 * Each entry lazy-imports its source module from src/components/ so the
 * catalog can load implementations on demand without copying them.
 * ID order and values must stay in sync with the manifest; the
 * verify:manifest script (T3b) enforces the 1:1 mapping.
 *
 * T4 adds an OPTIONAL `preview` per entry: a render function returning the
 * component wrapped in whatever fixture it needs (MockupFixtureProvider
 * for mockup-coupled entries; for workspace-menu — nominally adoptable —
 * the same provider supplies the OverlayLifecycle contract it consumes).
 * Entries without `preview` fall back to rendering the raw default export
 * (adoptable) or a "menyusul" note (coupled entries until T6 fills them).
 */
import type { ReactNode } from 'react'
import { SESSION_DETAIL_STATUSES, type SessionDetailStatus } from '../data/mockData'
import {
  MockupFixtureProvider,
  makeFixtureState,
} from './fixtures/MockupFixtureProvider'
import { type ManifestEntry } from './manifest'

export interface RegistryEntry {
  id: string
  kind: 'component' | 'utility'
  load: () => Promise<{ default?: unknown; [k: string]: unknown }>
  /**
   * Optional live-preview renderer (T4+). Receives the lazily loaded
   * source module and returns the preview tree (fixtures applied).
   */
  preview?: (mod: { default?: unknown; [k: string]: unknown }) => ReactNode
}

// ---------------------------------------------------------------------------
// T4 sample previews — the proven fixture patterns for the vertical slice.
// ---------------------------------------------------------------------------

type LoadedModule = { default?: unknown; [k: string]: unknown }
type LoadedComponent = React.ComponentType<Record<string, never>>

function asDefaultComponent(mod: LoadedModule): LoadedComponent {
  return mod.default as LoadedComponent
}

/**
 * workspace-menu (adoptable): context-free w.r.t. MockupContext, but it
 * consumes `useOverlayLifecycle` (Escape → CLOSE_OVERLAY), so the preview
 * wraps it in a MockupFixtureProvider seeded with the overlay open — the
 * real lifecycle contract holds (noted on the manifest entry).
 *
 * The production .kx-menu geometry is absolutely anchored to the app
 * shell (`top: 62px; left: calc(var(--kx-sidebar-w) + 12px)`); the preview
 * frame neutralizes only that anchoring via a class in catalog.css so the
 * menu reads as a standalone specimen. All visual styling still comes
 * from src/styles/components.css.
 */
function WorkspaceMenuPreview({ mod }: { mod: LoadedModule }) {
  const WorkspaceMenu = asDefaultComponent(mod)
  return (
    <MockupFixtureProvider overrides={{ overlay: { kind: 'workspace-menu' } }}>
      <div className="kx-cat-preview-static-menu">
        <WorkspaceMenu />
      </div>
    </MockupFixtureProvider>
  )
}

function workspaceMenuPreview(mod: LoadedModule): ReactNode {
  return <WorkspaceMenuPreview mod={mod} />
}

/**
 * session-status-badge (mockup-coupled, reads sessionDetail): one fixture
 * state per meaningful status, rendered side by side. The statuses are a
 * curated 4 of the real SessionDetailStatus union (all 8 in
 * SESSION_DETAIL_STATUSES); the fixture overrides only `sessionDetail.status`.
 */
const BADGE_PREVIEW_STATUSES: readonly SessionDetailStatus[] = [
  'IN_PROGRESS',
  'WAITING_APPROVAL',
  'DELIVERING',
  'COMPLETED',
]

function SessionStatusBadgePreview({ mod }: { mod: LoadedModule }) {
  const SessionStatusBadge = asDefaultComponent(mod)
  const baseDetail = makeFixtureState().sessionDetail
  return (
    <div className="kx-cat-variant-row">
      {BADGE_PREVIEW_STATUSES.map((status) => (
        <figure key={status} className="kx-cat-variant">
          <MockupFixtureProvider
            overrides={{ sessionDetail: { ...baseDetail, status } }}
          >
            <SessionStatusBadge />
          </MockupFixtureProvider>
          <figcaption className="kx-cat-variant-label">
            <code>{status.toLowerCase()}</code>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

function sessionStatusBadgePreview(mod: LoadedModule): ReactNode {
  return <SessionStatusBadgePreview mod={mod} />
}

// Re-exported so tests can assert the previewed statuses are a subset of
// the real union without re-declaring literals.
export const badgePreviewStatuses = BADGE_PREVIEW_STATUSES
export const allSessionStatuses = SESSION_DETAIL_STATUSES

/** Manifest-driven example snippet for the detail page "Usage" section. */
export function usageSnippet(entry: ManifestEntry): string {
  const name = entry.name
  // Copy-layout convention for adopters (see docs/ai-adoption.md):
  // src/components -> ./components, src/state -> ./state, catalog fixtures -> ./catalog/fixtures.
  // Relative imports only — this repo has no path aliases.
  const importPath = `./${entry.sourcePath.replace(/^src\//, '').replace(/\.tsx?$/, '')}`
  const importLine =
    entry.exportName === 'default'
      ? `import ${name} from '${importPath}'`
      : `import { ${Array.isArray(entry.exportName) ? entry.exportName.join(', ') : entry.exportName} } from '${importPath}'`

  if (entry.classification === 'adoptable') {
    if (entry.id === 'workspace-menu') {
      // Runnable minimal example: WorkspaceMenu consumes
      // useOverlayLifecycle(), so it must be wrapped in an
      // OverlayLifecycleProvider fed by the real mockupReducer.
      return `${importLine}\nimport { useReducer } from 'react'\nimport { OverlayLifecycleProvider } from './components/shell/OverlayLifecycle'\nimport { initialState, mockupReducer } from './state/mockupReducer'\n\nfunction Example() {\n  const [state, dispatch] = useReducer(mockupReducer, null, initialState)\n  return (\n    <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>\n      <${name} />\n    </OverlayLifecycleProvider>\n  )\n}`
    }
    return `${importLine}\n\nfunction Example() {\n  return <${name} />\n}`
  }
  if (entry.classification === 'mockup-coupled') {
    return `${importLine}\nimport { MockupFixtureProvider } from './catalog/fixtures/MockupFixtureProvider'\n\nfunction Example() {\n  return (\n    <MockupFixtureProvider>\n      <${name} />\n    </MockupFixtureProvider>\n  )\n}`
  }
  return `${importLine}\n\n// ${entry.classification}: ${entry.adoptionNotes}`
}

export const registry: RegistryEntry[] = [
  // account
  {
    id: 'account-menu',
    kind: 'component',
    load: () => import('../components/account/AccountMenu'),
  },
  {
    id: 'settings-modal',
    kind: 'component',
    load: () => import('../components/account/SettingsModal'),
  },
  // composer
  {
    id: 'component-menu',
    kind: 'component',
    load: () => import('../components/composer/ComponentMenu'),
  },
  {
    id: 'composer',
    kind: 'component',
    load: () => import('../components/composer/Composer'),
  },
  {
    id: 'execution-profile-menu',
    kind: 'component',
    load: () => import('../components/composer/ExecutionProfileMenu'),
  },
  {
    id: 'session-mode',
    kind: 'component',
    load: () => import('../components/composer/SessionMode'),
  },
  // context
  {
    id: 'create-system-modal',
    kind: 'component',
    load: () => import('../components/context/CreateSystemModal'),
  },
  {
    id: 'manual-repository-modal',
    kind: 'component',
    load: () => import('../components/context/ManualRepositoryModal'),
  },
  {
    id: 'repository-selector-modal',
    kind: 'component',
    load: () => import('../components/context/RepositorySelectorModal'),
  },
  // customize
  {
    id: 'agents-tab',
    kind: 'component',
    load: () => import('../components/customize/AgentsTab'),
  },
  {
    id: 'context-tab',
    kind: 'component',
    load: () => import('../components/customize/ContextTab'),
  },
  {
    id: 'customize-modal',
    kind: 'component',
    load: () => import('../components/customize/CustomizeModal'),
  },
  {
    id: 'integrations-tab',
    kind: 'component',
    load: () => import('../components/customize/IntegrationsTab'),
  },
  {
    id: 'skills-tab',
    kind: 'component',
    load: () => import('../components/customize/SkillsTab'),
  },
  {
    id: 'tools-tab',
    kind: 'component',
    load: () => import('../components/customize/ToolsTab'),
  },
  {
    id: 'preserved-content',
    kind: 'utility',
    load: () => import('../components/customize/preservedContent'),
  },
  // reviews
  {
    id: 'learned-drawer',
    kind: 'component',
    load: () => import('../components/reviews/LearnedDrawer'),
  },
  // session
  {
    id: 'session-detail-composer',
    kind: 'component',
    load: () => import('../components/session/SessionDetailComposer'),
  },
  {
    id: 'session-header',
    kind: 'component',
    load: () => import('../components/session/SessionHeader'),
  },
  {
    id: 'session-quote-card',
    kind: 'component',
    load: () => import('../components/session/SessionQuoteCard'),
  },
  {
    id: 'session-status-badge',
    kind: 'component',
    load: () => import('../components/session/SessionStatusBadge'),
    // T4 sample: mockup-coupled fixture — one provider per status variant.
    preview: sessionStatusBadgePreview,
  },
  {
    id: 'session-timeline',
    kind: 'component',
    load: () => import('../components/session/SessionTimeline'),
  },
  {
    id: 'session-tracker',
    kind: 'component',
    load: () => import('../components/session/SessionTracker'),
  },
  {
    id: 'format-time',
    kind: 'utility',
    load: () => import('../components/session/formatTime'),
  },
  // shell
  {
    id: 'app-shell',
    kind: 'component',
    load: () => import('../components/shell/AppShell'),
  },
  {
    id: 'collapse-icon',
    kind: 'component',
    load: () => import('../components/shell/CollapseIcon'),
  },
  {
    id: 'overlay-lifecycle',
    kind: 'component',
    load: () => import('../components/shell/OverlayLifecycle'),
  },
  {
    id: 'sidebar',
    kind: 'component',
    load: () => import('../components/shell/Sidebar'),
  },
  {
    id: 'system-menu',
    kind: 'component',
    load: () => import('../components/shell/SystemMenu'),
  },
  {
    id: 'use-focus-containment',
    kind: 'utility',
    load: () => import('../components/shell/useFocusContainment'),
  },
  {
    id: 'workspace-menu',
    kind: 'component',
    load: () => import('../components/shell/WorkspaceMenu'),
    // T4 sample: adoptable, but consumes OverlayLifecycle — see manifest.
    preview: workspaceMenuPreview,
  },
  // system
  {
    id: 'system-map-modal',
    kind: 'component',
    load: () => import('../components/system/SystemMapModal'),
  },
]
