import {
  DEFAULT_ACTIVE_PROFILE_ID,
  DEFAULT_ACTIVE_SYSTEM_ID,
  EXECUTION_PROFILES,
  SYSTEMS,
  type SessionMode,
  type System,
} from '../data/mockData'

export type { SessionMode } from '../data/mockData'

// ---------------------------------------------------------------------------
// Overlay union — exactly one overlay may be open at a time
// ---------------------------------------------------------------------------

export type CustomizeTab = 'agents' | 'context' | 'mcp' | 'connectors' | 'vcs' | 'skills' | 'tools'
export type LearnedTab = 'pending' | 'audit'
export type SettingsSection = 'general' | 'billing' | 'team'

export type MockupOverlay =
  | { kind: 'none' }
  | { kind: 'system-menu' }
  | { kind: 'execution-profile-menu' }
  | { kind: 'component-menu' }
  | { kind: 'repository-modal' }
  | { kind: 'manual-repo-modal' }
  | { kind: 'create-system-modal' }
  | { kind: 'customize'; tab: CustomizeTab }
  | { kind: 'learned'; tab: LearnedTab }
  | { kind: 'account-menu' }
  | { kind: 'settings'; section: SettingsSection }

/** Payload for OPEN_OVERLAY; tab/section default when omitted. */
export type OpenOverlayPayload =
  | { kind: 'system-menu' }
  | { kind: 'execution-profile-menu' }
  | { kind: 'component-menu' }
  | { kind: 'repository-modal' }
  | { kind: 'manual-repo-modal' }
  | { kind: 'create-system-modal' }
  | { kind: 'customize'; tab?: CustomizeTab }
  | { kind: 'learned'; tab?: LearnedTab }
  | { kind: 'account-menu' }
  | { kind: 'settings'; section?: SettingsSection }

export const DEFAULT_CUSTOMIZE_TAB: CustomizeTab = 'agents'
export const DEFAULT_LEARNED_TAB: LearnedTab = 'pending'
export const DEFAULT_SETTINGS_SECTION: SettingsSection = 'general'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type MockupRoute = 'new-session' | 'session-history'
export type DemoVariant = 'ready' | 'loading' | 'empty'

export type SearchList = 'systems' | 'repositories' | 'components' | 'sessions'

export interface MockupSearchState {
  systems: string
  repositories: string
  components: string
  sessions: string
}

export interface MockupState {
  route: MockupRoute
  sidebarCollapsed: boolean
  sessionMode: SessionMode
  systems: System[]
  activeSystemId: string
  selectedRepoIds: string[]
  selectedComponentIds: string[]
  activeProfileId: string
  overlay: MockupOverlay
  search: MockupSearchState
  demoVariant: DemoVariant
}

export type MockupAction =
  | { type: 'SET_ACTIVE_SYSTEM'; systemId: string }
  | { type: 'TOGGLE_REPO'; repoId: string }
  | { type: 'CREATE_SYSTEM'; name: string; description?: string }
  | { type: 'NAVIGATE'; route: MockupRoute }
  | { type: 'OPEN_OVERLAY'; overlay: OpenOverlayPayload }
  | { type: 'CLOSE_OVERLAY' }
  | { type: 'SET_MODE'; mode: SessionMode }
  | { type: 'TOGGLE_COMPONENT'; componentId: string }
  | { type: 'CLEAR_COMPONENTS' }
  | { type: 'SET_CUSTOMIZE_TAB'; tab: CustomizeTab }
  | { type: 'SET_ACTIVE_PROFILE'; profileId: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SEARCH'; list: SearchList; value: string }

/**
 * Builds the initial mockup state. The `mock` query parameter
 * (`?mock=loading|empty`) is parsed exactly once, here; anything else —
 * including a missing or unrecognized value — yields the `ready` variant.
 */
export function initialState(search: string = ''): MockupState {
  const query = search.startsWith('?') ? search.slice(1) : search
  const mock = new URLSearchParams(query).get('mock')
  const demoVariant: DemoVariant =
    mock === 'loading' ? 'loading' : mock === 'empty' ? 'empty' : 'ready'

  return {
    route: 'new-session',
    sidebarCollapsed: false,
    sessionMode: 'engineering',
    systems: SYSTEMS.map((system) => ({ ...system, repoIds: [...system.repoIds] })),
    activeSystemId: DEFAULT_ACTIVE_SYSTEM_ID,
    selectedRepoIds: [],
    selectedComponentIds: [],
    activeProfileId: DEFAULT_ACTIVE_PROFILE_ID,
    overlay: { kind: 'none' },
    search: { systems: '', repositories: '', components: '', sessions: '' },
    demoVariant,
  }
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function uniqueSystemId(existing: readonly System[], name: string): string {
  const base = slugify(name) || 'system'
  let candidate = base
  let counter = 2
  while (existing.some((system) => system.id === candidate)) {
    candidate = `${base}-${counter}`
    counter += 1
  }
  return candidate
}

// ---------------------------------------------------------------------------
// Reducer — pure and immutable: every transition returns a new state object
// (or the same reference for deliberate no-ops).
// ---------------------------------------------------------------------------

export function mockupReducer(state: MockupState, action: MockupAction): MockupState {
  switch (action.type) {
    case 'SET_ACTIVE_SYSTEM': {
      if (
        action.systemId === state.activeSystemId ||
        !state.systems.some((system) => system.id === action.systemId)
      ) {
        return state
      }
      return { ...state, activeSystemId: action.systemId, selectedRepoIds: [] }
    }

    case 'TOGGLE_REPO': {
      const activeSystem = state.systems.find((system) => system.id === state.activeSystemId)
      if (!activeSystem?.repoIds.includes(action.repoId)) return state
      const selectedRepoIds = state.selectedRepoIds.includes(action.repoId)
        ? state.selectedRepoIds.filter((id) => id !== action.repoId)
        : [...state.selectedRepoIds, action.repoId]
      return { ...state, selectedRepoIds }
    }

    case 'CREATE_SYSTEM': {
      const name = action.name.trim()
      if (!name) return state
      const system: System = {
        id: uniqueSystemId(state.systems, name),
        name,
        description: action.description?.trim() || undefined,
        repoIds: [],
      }
      return {
        ...state,
        systems: [...state.systems, system],
        activeSystemId: system.id,
        selectedRepoIds: [],
      }
    }

    case 'NAVIGATE': {
      return { ...state, route: action.route }
    }

    case 'OPEN_OVERLAY': {
      return { ...state, overlay: resolveOverlay(action.overlay) }
    }

    case 'CLOSE_OVERLAY': {
      return { ...state, overlay: { kind: 'none' } }
    }

    case 'SET_MODE': {
      return { ...state, sessionMode: action.mode }
    }

    case 'TOGGLE_COMPONENT': {
      const selectedComponentIds = state.selectedComponentIds.includes(action.componentId)
        ? state.selectedComponentIds.filter((id) => id !== action.componentId)
        : [...state.selectedComponentIds, action.componentId]
      return { ...state, selectedComponentIds }
    }

    case 'CLEAR_COMPONENTS': {
      return { ...state, selectedComponentIds: [] }
    }

    case 'SET_CUSTOMIZE_TAB': {
      if (state.overlay.kind !== 'customize') return state
      return { ...state, overlay: { kind: 'customize', tab: action.tab } }
    }

    case 'SET_ACTIVE_PROFILE': {
      if (!EXECUTION_PROFILES.some((profile) => profile.id === action.profileId)) return state
      return { ...state, activeProfileId: action.profileId }
    }

    case 'TOGGLE_SIDEBAR': {
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    }

    case 'SET_SEARCH': {
      return { ...state, search: { ...state.search, [action.list]: action.value } }
    }
  }
}

function resolveOverlay(payload: OpenOverlayPayload): MockupOverlay {
  switch (payload.kind) {
    case 'customize':
      return { kind: 'customize', tab: payload.tab ?? DEFAULT_CUSTOMIZE_TAB }
    case 'learned':
      return { kind: 'learned', tab: payload.tab ?? DEFAULT_LEARNED_TAB }
    case 'settings':
      return { kind: 'settings', section: payload.section ?? DEFAULT_SETTINGS_SECTION }
    case 'system-menu':
    case 'execution-profile-menu':
    case 'component-menu':
    case 'repository-modal':
    case 'manual-repo-modal':
    case 'create-system-modal':
    case 'account-menu':
      return { kind: payload.kind }
  }
}
