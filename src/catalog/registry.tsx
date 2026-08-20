/*
 * registry.tsx (Task T3a) — the runtime registry mirroring
 * src/catalog/components.json 1:1 (32 entries).
 *
 * Each entry lazy-imports its source module from src/components/ so the
 * catalog can load implementations on demand without copying them.
 * ID order and values must stay in sync with the manifest; the
 * verify:manifest script (T3b) enforces the 1:1 mapping.
 */

export interface RegistryEntry {
  id: string
  kind: 'component' | 'utility'
  load: () => Promise<{ default?: unknown; [k: string]: unknown }>
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
  },
  // system
  {
    id: 'system-map-modal',
    kind: 'component',
    load: () => import('../components/system/SystemMapModal'),
  },
]
