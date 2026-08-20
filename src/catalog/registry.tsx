/*
 * registry.tsx (Task T3a, extended T4 + T6) — the runtime registry
 * mirroring src/catalog/components.json 1:1 (32 entries).
 *
 * Each entry lazy-imports its source module from src/components/ so the
 * catalog can load implementations on demand without copying them.
 * ID order and values must stay in sync with the manifest; the
 * verify:manifest script (T3b) enforces the 1:1 mapping.
 *
 * T6 gives EVERY component entry a `preview` (AC4/AC5/AC6):
 *   - adoptable entries render directly (optionally as variant grids);
 *     workspace-menu additionally needs the OverlayLifecycle contract,
 *     which MockupFixtureProvider wires from the same reducer state.
 *   - mockup-coupled entries render through MockupFixtureProvider — the
 *     real mockupReducer + MockupContext under a controlled initial
 *     state — never a copied implementation. Overlays/menus/modals are
 *     seeded with their overlay open; per-status components render one
 *     fixture per meaningful state.
 * Utility entries have no visual preview (manifest-only).
 */
import type { ReactNode } from 'react'
import { SESSION_DETAIL_STATUSES, type SessionDetailStatus } from '../data/mockData'
import { useMockup } from '../state/MockupContext'
import type { MockupState } from '../state/mockupReducer'
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
   * Live-preview renderer (T4/T6). Receives the lazily loaded source
   * module and returns the preview tree (fixtures applied).
   */
  preview?: (mod: { default?: unknown; [k: string]: unknown }) => ReactNode
}

// ---------------------------------------------------------------------------
// Shared preview helpers
// ---------------------------------------------------------------------------

type LoadedModule = { default?: unknown; [k: string]: unknown }
type LoadedComponent = React.ComponentType<any>

function asDefaultComponent(mod: LoadedModule): LoadedComponent {
  return mod.default as LoadedComponent
}

function asNamedComponent(mod: LoadedModule, name: string): LoadedComponent {
  return mod[name] as LoadedComponent
}

/** Fixture wrapper for a mockup-coupled preview: the real reducer/context
 *  seeded with `overrides` (shallow over initialState). */
function Fixture({
  overrides,
  children,
}: {
  overrides?: Partial<MockupState>
  children: ReactNode
}) {
  return (
    <MockupFixtureProvider overrides={overrides}>{children}</MockupFixtureProvider>
  )
}

/** Labelled side-by-side variant grid (see catalog.css .kx-cat-variant-*). */
function VariantGrid({
  items,
}: {
  items: ReadonlyArray<{ label: ReactNode; node: ReactNode }>
}) {
  return (
    <div className="kx-cat-variant-row">
      {items.map((item, i) => (
        // Labels are unique per preview by construction (fixtureRef lists
        // them); index fallback keeps the grid robust for layout-only
        // variants that share one label.
        <figure key={`${String(i)}`} className="kx-cat-variant">
          {item.node}
          <figcaption className="kx-cat-variant-label">{item.label}</figcaption>
        </figure>
      ))}
    </div>
  )
}

function variantRow(
  items: ReadonlyArray<{ label: ReactNode; node: ReactNode }>,
): ReactNode {
  return <VariantGrid items={items} />
}

// ---------------------------------------------------------------------------
// account
// ---------------------------------------------------------------------------

/** account-menu: seeded with the overlay open; production .kx-menu
 *  anchoring is neutralized inside the frame (catalog.css). */
function accountMenuPreview(mod: LoadedModule): ReactNode {
  const AccountMenu = asDefaultComponent(mod)
  return (
    <Fixture overrides={{ overlay: { kind: 'account-menu' } }}>
      <div className="kx-cat-preview-static-menu">
        <AccountMenu />
      </div>
    </Fixture>
  )
}

/** settings-modal: one fixture per Settings tab (dialog renders static
 *  inside the frame — the backdrop is neutralized). */
function settingsModalPreview(mod: LoadedModule): ReactNode {
  const SettingsModal = asDefaultComponent(mod)
  return variantRow(
    (['general', 'billing', 'team'] as const).map((section) => ({
      label: <code>{section}</code>,
      node: (
        <Fixture overrides={{ overlay: { kind: 'settings', section } }}>
          <div className="kx-cat-preview-static-overlay">
            <SettingsModal />
          </div>
        </Fixture>
      ),
    })),
  )
}

// ---------------------------------------------------------------------------
// composer
// ---------------------------------------------------------------------------

function componentMenuPreview(mod: LoadedModule): ReactNode {
  const ComponentMenu = asDefaultComponent(mod)
  return (
    <Fixture overrides={{ overlay: { kind: 'component-menu' } }}>
      <div className="kx-cat-preview-static-menu">
        <ComponentMenu />
      </div>
    </Fixture>
  )
}

/** composer: the full panel — default ready state, plus the menu-open
 *  variant exercising its coupled children. */
function composerPreview(mod: LoadedModule): ReactNode {
  const Composer = asDefaultComponent(mod)
  return variantRow([
    {
      label: <code>default</code>,
      node: (
        <Fixture>
          <Composer />
        </Fixture>
      ),
    },
    {
      label: <code>component menu terbuka</code>,
      node: (
        <Fixture overrides={{ overlay: { kind: 'component-menu' } }}>
          <div className="kx-cat-preview-static-menu">
            <Composer />
          </div>
        </Fixture>
      ),
    },
  ])
}

function executionProfileMenuPreview(mod: LoadedModule): ReactNode {
  const ExecutionProfileMenu = asDefaultComponent(mod)
  return (
    <Fixture overrides={{ overlay: { kind: 'execution-profile-menu' } }}>
      <div className="kx-cat-preview-static-menu">
        <ExecutionProfileMenu />
      </div>
    </Fixture>
  )
}

/** session-mode: the three committed mode states. */
function sessionModePreview(mod: LoadedModule): ReactNode {
  const SessionMode = asDefaultComponent(mod)
  return variantRow(
    (['engineering', 'qa', 'planning'] as const).map((sessionMode) => ({
      label: <code>{sessionMode}</code>,
      node: (
        <Fixture overrides={{ sessionMode }}>
          <SessionMode />
        </Fixture>
      ),
    })),
  )
}

// ---------------------------------------------------------------------------
// context
// ---------------------------------------------------------------------------

function createSystemModalPreview(mod: LoadedModule): ReactNode {
  const CreateSystemModal = asDefaultComponent(mod)
  return (
    <Fixture
      overrides={{
        overlay: { kind: 'create-system-modal', source: 'system-menu' },
      }}
    >
      <div className="kx-cat-preview-static-overlay">
        <CreateSystemModal />
      </div>
    </Fixture>
  )
}

function manualRepositoryModalPreview(mod: LoadedModule): ReactNode {
  const ManualRepositoryModal = asDefaultComponent(mod)
  return (
    <Fixture overrides={{ overlay: { kind: 'manual-repo-modal' } }}>
      <div className="kx-cat-preview-static-overlay">
        <ManualRepositoryModal />
      </div>
    </Fixture>
  )
}

/** repository-selector-modal: active + suspended (nested overlay stacked
 *  above — the modal stands down from the a11y tree). */
function repositorySelectorModalPreview(mod: LoadedModule): ReactNode {
  const RepositorySelectorModal = asNamedComponent(mod, 'default')
  return variantRow([
    {
      label: <code>suspended=false</code>,
      node: (
        <Fixture overrides={{ overlay: { kind: 'repository-modal' } }}>
          <div className="kx-cat-preview-static-overlay">
            <RepositorySelectorModal />
          </div>
        </Fixture>
      ),
    },
    {
      label: <code>suspended=true</code>,
      node: (
        <Fixture overrides={{ overlay: { kind: 'repository-modal' } }}>
          <div className="kx-cat-preview-static-overlay">
            <RepositorySelectorModal suspended />
          </div>
        </Fixture>
      ),
    },
  ])
}

// ---------------------------------------------------------------------------
// customize
// ---------------------------------------------------------------------------

function agentsTabPreview(mod: LoadedModule): ReactNode {
  const AgentsTab = asDefaultComponent(mod)
  return (
    <Fixture>
      <AgentsTab />
    </Fixture>
  )
}

/** context-tab: repository section follows the session-selected scope —
 *  empty selection vs committed session context. */
function contextTabPreview(mod: LoadedModule): ReactNode {
  const ContextTab = asDefaultComponent(mod)
  const seeded = makeFixtureState({}, [
    { type: 'TOGGLE_REPO', repoId: 'bsi/hris-frontend-shared' },
    { type: 'TOGGLE_REPO', repoId: 'bsi/hris-frontend-promotion' },
  ])
  return variantRow([
    {
      label: <code>tanpa repo terpilih</code>,
      node: (
        <Fixture>
          <ContextTab />
        </Fixture>
      ),
    },
    {
      label: <code>sessionContext committed</code>,
      node: (
        <Fixture overrides={{ selectedRepoIds: seeded.selectedRepoIds }}>
          <ContextTab />
        </Fixture>
      ),
    },
  ])
}

/** customize-modal: the fixed 790×580 frame across a representative set of
 *  its seven tabs (agents, one integrations variant, skills). */
function customizeModalPreview(mod: LoadedModule): ReactNode {
  const CustomizeModal = asDefaultComponent(mod)
  return variantRow(
    (['agents', 'context', 'mcp', 'skills'] as const).map((tab) => ({
      label: <code>tab={tab}</code>,
      node: (
        <Fixture overrides={{ overlay: { kind: 'customize', tab } }}>
          <div className="kx-cat-preview-static-overlay">
            <CustomizeModal />
          </div>
        </Fixture>
      ),
    })),
  )
}

/** integrations-tab (adoptable): the three variants, side by side. */
function integrationsTabPreview(mod: LoadedModule): ReactNode {
  const IntegrationsTab = mod.default as React.ComponentType<{
    variant: 'mcp' | 'connectors' | 'vcs'
  }>
  return (
    <Fixture>
      {variantRow(
        (['mcp', 'connectors', 'vcs'] as const).map((variant) => ({
          label: <code>variant=&quot;{variant}&quot;</code>,
          node: <IntegrationsTab variant={variant} />,
        })),
      )}
    </Fixture>
  )
}

function skillsTabPreview(mod: LoadedModule): ReactNode {
  const SkillsTab = asDefaultComponent(mod)
  return (
    <Fixture>
      <SkillsTab />
    </Fixture>
  )
}

function toolsTabPreview(mod: LoadedModule): ReactNode {
  const ToolsTab = asDefaultComponent(mod)
  return (
    <Fixture>
      <ToolsTab />
    </Fixture>
  )
}

// ---------------------------------------------------------------------------
// reviews
// ---------------------------------------------------------------------------

function learnedDrawerPreview(mod: LoadedModule): ReactNode {
  const LearnedDrawer = asDefaultComponent(mod)
  return variantRow(
    (['pending', 'audit'] as const).map((tab) => ({
      label: <code>tab={tab}</code>,
      node: (
        <Fixture overrides={{ overlay: { kind: 'learned', tab } }}>
          <div className="kx-cat-preview-static-overlay">
            <LearnedDrawer />
          </div>
        </Fixture>
      ),
    })),
  )
}

// ---------------------------------------------------------------------------
// session
// ---------------------------------------------------------------------------

/** session-detail-composer: active session (send enabled) vs terminal
 *  (locked notice). */
function sessionDetailComposerPreview(mod: LoadedModule): ReactNode {
  const SessionDetailComposer = asDefaultComponent(mod)
  const baseDetail = makeFixtureState().sessionDetail
  return variantRow([
    {
      label: <code>aktif (in_progress)</code>,
      node: (
        <Fixture
          overrides={{ sessionDetail: { ...baseDetail, status: 'IN_PROGRESS' } }}
        >
          <SessionDetailComposer />
        </Fixture>
      ),
    },
    {
      label: <code>terminal (completed — locked)</code>,
      node: (
        <Fixture
          overrides={{ sessionDetail: { ...baseDetail, status: 'COMPLETED' } }}
        >
          <SessionDetailComposer />
        </Fixture>
      ),
    },
  ])
}

function sessionHeaderPreview(mod: LoadedModule): ReactNode {
  const SessionHeader = asDefaultComponent(mod)
  return (
    <Fixture>
      <SessionHeader />
    </Fixture>
  )
}

/** session-quote-card: the real SESSION_DETAIL fixture already carries a
 *  PENDING_APPROVAL quote under WAITING_APPROVAL, so the card renders as
 *  the collapsed decision row (expandable in the live preview). */
function sessionQuoteCardPreview(mod: LoadedModule): ReactNode {
  const SessionQuoteCard = asDefaultComponent(mod)
  return (
    <Fixture>
      <SessionQuoteCard />
    </Fixture>
  )
}

/**
 * session-status-badge (T4 sample): one fixture state per meaningful
 * status, rendered side by side. The statuses are a curated 4 of the real
 * SessionDetailStatus union (all 8 in SESSION_DETAIL_STATUSES); the
 * fixture overrides only `sessionDetail.status`.
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
  return variantRow(
    BADGE_PREVIEW_STATUSES.map((status) => ({
      label: <code>{status.toLowerCase()}</code>,
      node: (
        <MockupFixtureProvider
          overrides={{ sessionDetail: { ...baseDetail, status } }}
        >
          <SessionStatusBadge />
        </MockupFixtureProvider>
      ),
    })),
  )
}

function sessionStatusBadgePreview(mod: LoadedModule): ReactNode {
  return <SessionStatusBadgePreview mod={mod} />
}

function sessionTimelinePreview(mod: LoadedModule): ReactNode {
  const SessionTimeline = asDefaultComponent(mod)
  return (
    <Fixture>
      <SessionTimeline />
    </Fixture>
  )
}

function sessionTrackerPreview(mod: LoadedModule): ReactNode {
  const SessionTracker = asDefaultComponent(mod)
  return (
    <Fixture>
      <SessionTracker />
    </Fixture>
  )
}

// Re-exported so tests can assert the previewed statuses are a subset of
// the real union without re-declaring literals.
export const badgePreviewStatuses = BADGE_PREVIEW_STATUSES
export const allSessionStatuses = SESSION_DETAIL_STATUSES

// ---------------------------------------------------------------------------
// shell
// ---------------------------------------------------------------------------

/** collapse-icon (adoptable): both collapsed states. */
function collapseIconPreview(mod: LoadedModule): ReactNode {
  const CollapseIcon = mod.default as React.ComponentType<{
    collapsed: boolean
  }>
  return variantRow(
    ([false, true] as const).map((collapsed) => ({
      label: <code>{`collapsed={${collapsed}}`}</code>,
      node: <CollapseIcon collapsed={collapsed} />,
    })),
  )
}

/** overlay-lifecycle: a behaviour probe — a trigger opens an overlay via
 *  the fixture's real dispatch, and the provider's shared Escape listener
 *  dismisses it (the contract the hook/provider owns). */
function OverlayLifecycleProbe() {
  return (
    <Fixture>
      <OverlayLifecycleProbeInner />
    </Fixture>
  )
}

function OverlayLifecycleProbeInner() {
  const { state, dispatch } = useMockup()
  return (
    <div className="kx-cat-probe">
      <p className="kx-cat-probe-line">
        overlay aktif: <code>{state.overlay.kind}</code>
      </p>
      <button
        type="button"
        className="kx-cat-probe-button"
        onClick={() =>
          dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'workspace-menu' } })
        }
      >
        Buka workspace menu
      </button>
      <p className="kx-cat-probe-line">
        Tekan <kbd>Escape</kbd> setelah membuka — provider mendispatch{' '}
        <code>CLOSE_OVERLAY</code> dan overlay kembali <code>none</code>.
      </p>
    </div>
  )
}

function overlayLifecyclePreview(_mod: LoadedModule): ReactNode {
  return <OverlayLifecycleProbe />
}

/** sidebar: expanded 312px vs collapsed 64px rail (a real width token
 *  change, visible side by side). */
function sidebarPreview(mod: LoadedModule): ReactNode {
  const Sidebar = asDefaultComponent(mod)
  return variantRow([
    {
      label: <code>expanded</code>,
      node: (
        <Fixture>
          <div className="kx-cat-preview-sidebar">
            <Sidebar />
          </div>
        </Fixture>
      ),
    },
    {
      label: <code>collapsed rail</code>,
      node: (
        <Fixture overrides={{ sidebarCollapsed: true }}>
          <div className="kx-cat-preview-sidebar">
            <Sidebar />
          </div>
        </Fixture>
      ),
    },
  ])
}

function systemMenuPreview(mod: LoadedModule): ReactNode {
  const SystemMenu = asDefaultComponent(mod)
  return (
    <Fixture overrides={{ overlay: { kind: 'system-menu' } }}>
      <div className="kx-cat-preview-static-menu">
        <SystemMenu />
      </div>
    </Fixture>
  )
}

/**
 * workspace-menu (T4 sample, adoptable): context-free w.r.t. MockupContext,
 * but it consumes `useOverlayLifecycle` (Escape → CLOSE_OVERLAY), so the
 * preview wraps it in a MockupFixtureProvider seeded with the overlay
 * open — the real lifecycle contract holds (noted on the manifest entry).
 *
 * The production .kx-menu geometry is absolutely anchored to the app
 * shell (`top: 62px; left: calc(var(--kx-sidebar-w) + 12px)`); the preview
 * frame neutralizes only that anchoring via a class in catalog.css so the
 * menu reads as a standalone specimen. All visual styling still comes
 * from the production CSS files.
 */
function workspaceMenuPreview(mod: LoadedModule): ReactNode {
  const WorkspaceMenu = asDefaultComponent(mod)
  return (
    <MockupFixtureProvider overrides={{ overlay: { kind: 'workspace-menu' } }}>
      <div className="kx-cat-preview-static-menu">
        <WorkspaceMenu />
      </div>
    </MockupFixtureProvider>
  )
}

// ---------------------------------------------------------------------------
// system
// ---------------------------------------------------------------------------

function systemMapModalPreview(mod: LoadedModule): ReactNode {
  const SystemMapModal = asDefaultComponent(mod)
  const { activeSystemId } = makeFixtureState()
  return (
    <Fixture overrides={{ overlay: { kind: 'system-map', systemId: activeSystemId } }}>
      <div className="kx-cat-preview-static-overlay">
        <SystemMapModal />
      </div>
    </Fixture>
  )
}

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
    if (entry.propDocs && Object.keys(entry.propDocs).length > 0) {
      const sampleProps = Object.keys(entry.propDocs)
        .map((prop) => {
          const value =
            entry.id === 'integrations-tab' && prop === 'variant'
              ? `"mcp"`
              : entry.id === 'collapse-icon' && prop === 'collapsed'
                ? '{false}'
                : '{…}'
          return `${prop}=${value}`
        })
        .join(' ')
      return `${importLine}\n\nfunction Example() {\n  return <${name} ${sampleProps} />\n}`
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
    preview: accountMenuPreview,
  },
  {
    id: 'settings-modal',
    kind: 'component',
    load: () => import('../components/account/SettingsModal'),
    preview: settingsModalPreview,
  },
  // composer
  {
    id: 'component-menu',
    kind: 'component',
    load: () => import('../components/composer/ComponentMenu'),
    preview: componentMenuPreview,
  },
  {
    id: 'composer',
    kind: 'component',
    load: () => import('../components/composer/Composer'),
    preview: composerPreview,
  },
  {
    id: 'execution-profile-menu',
    kind: 'component',
    load: () => import('../components/composer/ExecutionProfileMenu'),
    preview: executionProfileMenuPreview,
  },
  {
    id: 'session-mode',
    kind: 'component',
    load: () => import('../components/composer/SessionMode'),
    preview: sessionModePreview,
  },
  // context
  {
    id: 'create-system-modal',
    kind: 'component',
    load: () => import('../components/context/CreateSystemModal'),
    preview: createSystemModalPreview,
  },
  {
    id: 'manual-repository-modal',
    kind: 'component',
    load: () => import('../components/context/ManualRepositoryModal'),
    preview: manualRepositoryModalPreview,
  },
  {
    id: 'repository-selector-modal',
    kind: 'component',
    load: () => import('../components/context/RepositorySelectorModal'),
    preview: repositorySelectorModalPreview,
  },
  // customize
  {
    id: 'agents-tab',
    kind: 'component',
    load: () => import('../components/customize/AgentsTab'),
    preview: agentsTabPreview,
  },
  {
    id: 'context-tab',
    kind: 'component',
    load: () => import('../components/customize/ContextTab'),
    preview: contextTabPreview,
  },
  {
    id: 'customize-modal',
    kind: 'component',
    load: () => import('../components/customize/CustomizeModal'),
    preview: customizeModalPreview,
  },
  {
    id: 'integrations-tab',
    kind: 'component',
    load: () => import('../components/customize/IntegrationsTab'),
    preview: integrationsTabPreview,
  },
  {
    id: 'skills-tab',
    kind: 'component',
    load: () => import('../components/customize/SkillsTab'),
    preview: skillsTabPreview,
  },
  {
    id: 'tools-tab',
    kind: 'component',
    load: () => import('../components/customize/ToolsTab'),
    preview: toolsTabPreview,
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
    preview: learnedDrawerPreview,
  },
  // session
  {
    id: 'session-detail-composer',
    kind: 'component',
    load: () => import('../components/session/SessionDetailComposer'),
    preview: sessionDetailComposerPreview,
  },
  {
    id: 'session-header',
    kind: 'component',
    load: () => import('../components/session/SessionHeader'),
    preview: sessionHeaderPreview,
  },
  {
    id: 'session-quote-card',
    kind: 'component',
    load: () => import('../components/session/SessionQuoteCard'),
    preview: sessionQuoteCardPreview,
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
    preview: sessionTimelinePreview,
  },
  {
    id: 'session-tracker',
    kind: 'component',
    load: () => import('../components/session/SessionTracker'),
    preview: sessionTrackerPreview,
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
    // internal: no adoption detail page — listed with its reason on the
    // index page (spec §4), so no live preview here.
  },
  {
    id: 'collapse-icon',
    kind: 'component',
    load: () => import('../components/shell/CollapseIcon'),
    preview: collapseIconPreview,
  },
  {
    id: 'overlay-lifecycle',
    kind: 'component',
    load: () => import('../components/shell/OverlayLifecycle'),
    preview: overlayLifecyclePreview,
  },
  {
    id: 'sidebar',
    kind: 'component',
    load: () => import('../components/shell/Sidebar'),
    preview: sidebarPreview,
  },
  {
    id: 'system-menu',
    kind: 'component',
    load: () => import('../components/shell/SystemMenu'),
    preview: systemMenuPreview,
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
    preview: systemMapModalPreview,
  },
]
