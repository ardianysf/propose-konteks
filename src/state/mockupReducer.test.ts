import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ASSISTANT_RESPONSES } from '../data/assistantResponses'
import {
  initialState,
  mockupReducer,
  resolveSessionContextDraft,
  DEFAULT_CUSTOMIZE_TAB,
  type MockupAction,
  type MockupState,
  type OpenOverlayPayload,
} from './mockupReducer'
import {
  ILLUSTRATIVE_DATA_NOTE,
  mockData,
  SESSION_DETAIL,
  SYSTEMS,
  REPOSITORIES,
  EXECUTION_PROFILES,
  WORKSPACE_SETTINGS,
  COMPONENTS,
  DEFAULT_ACTIVE_SYSTEM_ID,
  DEFAULT_ACTIVE_PROFILE_ID,
} from '../data/mockData'

const ACTIVE_SYSTEM_REPO = 'bsi/hris-frontend-shared'
const ACTIVE_SYSTEM_REPO_2 = 'bsi/hris-frontend-promotion'
const OTHER_SYSTEM_REPO = 'bsi/canteen-backend'

function freshState(search = ''): MockupState {
  return initialState(search)
}

function stateWithRepoSelection(): MockupState {
  let state = freshState()
  state = mockupReducer(state, { type: 'TOGGLE_REPO', repoId: ACTIVE_SYSTEM_REPO })
  state = mockupReducer(state, { type: 'TOGGLE_REPO', repoId: ACTIVE_SYSTEM_REPO_2 })
  return state
}

// ---------------------------------------------------------------------------
// initialState — demo variants via ?mock= query (AC43), consumed once at init
// ---------------------------------------------------------------------------

describe('initialState', () => {
  it('defaults to the new-session route, Engineering mode, ready variant, no overlay, expanded sidebar', () => {
    const state = freshState()
    expect(state.route).toBe('new-session')
    expect(state.sessionMode).toBe('engineering')
    expect(state.demoVariant).toBe('ready')
    expect(state.overlay).toEqual({ kind: 'none' })
    expect(state.sidebarCollapsed).toBe(false)
    expect(state.sidebarMobileOpen).toBe(false)
  })

  it('initializes systems from mock data with the default active system and profile', () => {
    const state = freshState()
    expect(state.systems).toEqual(SYSTEMS)
    expect(state.systems).not.toBe(SYSTEMS) // defensive copy, not the module constant
    expect(state.activeSystemId).toBe(DEFAULT_ACTIVE_SYSTEM_ID)
    expect(state.activeProfileId).toBe(DEFAULT_ACTIVE_PROFILE_ID)
    expect(state.selectedRepoIds).toEqual([])
    expect(state.selectedComponentIds).toEqual([])
  })

  it('starts with empty search strings for every list', () => {
    const state = freshState()
    expect(state.search).toEqual({ systems: '', repositories: '', components: '', sessions: '' })
  })

  it.each([
    ['?mock=loading', 'loading'],
    ['mock=loading', 'loading'],
    ['?mock=empty', 'empty'],
    ['mock=empty', 'empty'],
    ['?mock=ready', 'ready'],
    ['?mock=unknown', 'ready'],
    ['', 'ready'],
  ])('initialState(%j) sets demoVariant %j (AC43)', (search, variant) => {
    expect(freshState(search).demoVariant).toBe(variant)
  })
})

// ---------------------------------------------------------------------------
// SET_ACTIVE_SYSTEM — switching clears repo selection; same system keeps it (AC26)
// ---------------------------------------------------------------------------

describe('SET_ACTIVE_SYSTEM', () => {
  it('switching to a different system clears selectedRepoIds (AC26)', () => {
    let state = stateWithRepoSelection()
    expect(state.selectedRepoIds).toEqual([ACTIVE_SYSTEM_REPO, ACTIVE_SYSTEM_REPO_2])
    state = mockupReducer(state, { type: 'SET_ACTIVE_SYSTEM', systemId: 'bsi-canteen' })
    expect(state.activeSystemId).toBe('bsi-canteen')
    expect(state.selectedRepoIds).toEqual([])
  })

  it('redispatching the same system keeps the current selection (AC26)', () => {
    let state = stateWithRepoSelection()
    state = mockupReducer(state, { type: 'SET_ACTIVE_SYSTEM', systemId: DEFAULT_ACTIVE_SYSTEM_ID })
    expect(state.selectedRepoIds).toEqual([ACTIVE_SYSTEM_REPO, ACTIVE_SYSTEM_REPO_2])
  })

  it('ignores unknown system ids', () => {
    const state = stateWithRepoSelection()
    const next = mockupReducer(state, { type: 'SET_ACTIVE_SYSTEM', systemId: 'nope' })
    expect(next).toBe(state)
  })
})

// ---------------------------------------------------------------------------
// TOGGLE_REPO — only repositories of the active system are selectable (AC25)
// ---------------------------------------------------------------------------

describe('TOGGLE_REPO', () => {
  it('adds an active-system repository, then removes it on the second toggle', () => {
    let state = freshState()
    state = mockupReducer(state, { type: 'TOGGLE_REPO', repoId: ACTIVE_SYSTEM_REPO })
    expect(state.selectedRepoIds).toEqual([ACTIVE_SYSTEM_REPO])
    state = mockupReducer(state, { type: 'TOGGLE_REPO', repoId: ACTIVE_SYSTEM_REPO })
    expect(state.selectedRepoIds).toEqual([])
  })

  it('ignores a repository that belongs to a non-active system (AC25)', () => {
    const state = freshState()
    const next = mockupReducer(state, { type: 'TOGGLE_REPO', repoId: OTHER_SYSTEM_REPO })
    expect(next).toBe(state)
    expect(next.selectedRepoIds).toEqual([])
  })

  it('ignores unknown repository ids', () => {
    const state = stateWithRepoSelection()
    const next = mockupReducer(state, { type: 'TOGGLE_REPO', repoId: 'ghost/repo' })
    expect(next).toBe(state)
  })
})

// ---------------------------------------------------------------------------
// CREATE_SYSTEM — append, activate, clear repo selection (AC33)
// ---------------------------------------------------------------------------

describe('CREATE_SYSTEM', () => {
  it('appends the system, makes it active, and clears repo selection (AC33)', () => {
    const before = stateWithRepoSelection()
    const after = mockupReducer(before, {
      type: 'CREATE_SYSTEM',
      name: 'Payments Gateway',
      description: 'Illustrative new system',
    })
    expect(after.systems).toHaveLength(before.systems.length + 1)
    const created = after.systems.at(-1)!
    expect(created.name).toBe('Payments Gateway')
    expect(created.description).toBe('Illustrative new system')
    expect(created.repoIds).toEqual([])
    expect(after.activeSystemId).toBe(created.id)
    expect(after.selectedRepoIds).toEqual([])
  })

  it('treats description as optional', () => {
    const before = freshState()
    const after = mockupReducer(before, { type: 'CREATE_SYSTEM', name: 'Docs Hub' })
    const created = after.systems.at(-1)!
    expect(created.description).toBeUndefined()
  })

  it('never mutates the existing systems list and keeps ids unique', () => {
    let state = freshState()
    const originalLength = state.systems.length
    state = mockupReducer(state, { type: 'CREATE_SYSTEM', name: 'Docs Hub' })
    state = mockupReducer(state, { type: 'CREATE_SYSTEM', name: 'Docs Hub' })
    expect(state.systems).toHaveLength(originalLength + 2)
    const ids = state.systems.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ---------------------------------------------------------------------------
// NAVIGATE — changes the route only (AC11)
// ---------------------------------------------------------------------------

describe('NAVIGATE', () => {
  it('changes the route and leaves every other slice of state untouched (AC11)', () => {
    let state = stateWithRepoSelection()
    state = mockupReducer(state, { type: 'TOGGLE_SIDEBAR' })
    state = mockupReducer(state, { type: 'SET_MODE', mode: 'planning' })
    state = mockupReducer(state, { type: 'SET_SEARCH', list: 'systems', value: 'bsi' })
    const before = state
    const after = mockupReducer(before, { type: 'NAVIGATE', route: 'session-history' })
    expect(after.route).toBe('session-history')
    expect(after.sidebarCollapsed).toBe(before.sidebarCollapsed)
    expect(after.sessionMode).toBe(before.sessionMode)
    expect(after.systems).toBe(before.systems)
    expect(after.activeSystemId).toBe(before.activeSystemId)
    expect(after.selectedRepoIds).toBe(before.selectedRepoIds)
    expect(after.selectedComponentIds).toBe(before.selectedComponentIds)
    expect(after.activeProfileId).toBe(before.activeProfileId)
    expect(after.overlay).toBe(before.overlay)
    expect(after.search).toBe(before.search)
    expect(after.demoVariant).toBe(before.demoVariant)
  })

  it('navigates back to new-session', () => {
    let state = freshState()
    state = mockupReducer(state, { type: 'NAVIGATE', route: 'session-history' })
    state = mockupReducer(state, { type: 'NAVIGATE', route: 'new-session' })
    expect(state.route).toBe('new-session')
  })

  it('navigates to session-detail route', () => {
    let state = freshState()
    state = mockupReducer(state, { type: 'NAVIGATE', route: 'session-detail' })
    expect(state.route).toBe('session-detail')
  })
})

// ---------------------------------------------------------------------------
// OPEN_OVERLAY / CLOSE_OVERLAY — every overlay closes via CLOSE_OVERLAY (AC45)
// ---------------------------------------------------------------------------

const everyOverlayOpen: OpenOverlayPayload[] = [
  { kind: 'workspace-menu' },
  { kind: 'system-menu' },
  { kind: 'execution-profile-menu' },
  { kind: 'component-menu' },
  { kind: 'repository-modal' },
  { kind: 'manual-repo-modal' },
  { kind: 'create-system-modal' },
  { kind: 'system-map', systemId: 'bsi-hris' },
  { kind: 'customize' },
  { kind: 'learned' },
  { kind: 'account-menu' },
  { kind: 'settings' },
]

describe('OPEN_OVERLAY / CLOSE_OVERLAY', () => {
  it.each(everyOverlayOpen)('OPEN_OVERLAY %j then CLOSE_OVERLAY ends at none (AC45)', (payload) => {
    let state = freshState()
    state = mockupReducer(state, { type: 'OPEN_OVERLAY', overlay: payload })
    expect(state.overlay.kind).toBe(payload.kind)
    expect(state.overlay).not.toEqual({ kind: 'none' })
    state = mockupReducer(state, { type: 'CLOSE_OVERLAY' })
    expect(state.overlay).toEqual({ kind: 'none' })
  })

  it('resolves the customize tab from the payload or the default', () => {
    let state = freshState()
    state = mockupReducer(state, { type: 'OPEN_OVERLAY', overlay: { kind: 'customize' } })
    expect(state.overlay).toEqual({ kind: 'customize', tab: DEFAULT_CUSTOMIZE_TAB })
    state = mockupReducer(state, { type: 'OPEN_OVERLAY', overlay: { kind: 'customize', tab: 'tools' } })
    expect(state.overlay).toEqual({ kind: 'customize', tab: 'tools' })
  })

  it('resolves the learned tab from the payload or the default', () => {
    let state = freshState()
    state = mockupReducer(state, { type: 'OPEN_OVERLAY', overlay: { kind: 'learned' } })
    expect(state.overlay).toEqual({ kind: 'learned', tab: 'pending' })
    state = mockupReducer(state, { type: 'OPEN_OVERLAY', overlay: { kind: 'learned', tab: 'audit' } })
    expect(state.overlay).toEqual({ kind: 'learned', tab: 'audit' })
  })

  it('resolves the settings section from the payload or the default', () => {
    let state = freshState()
    state = mockupReducer(state, { type: 'OPEN_OVERLAY', overlay: { kind: 'settings' } })
    expect(state.overlay).toEqual({ kind: 'settings', section: 'general' })
    state = mockupReducer(state, { type: 'OPEN_OVERLAY', overlay: { kind: 'settings', section: 'billing' } })
    expect(state.overlay).toEqual({ kind: 'settings', section: 'billing' })
  })

  it('CLOSE_OVERLAY on an already-closed state is a safe no-op', () => {
    const state = freshState()
    const next = mockupReducer(state, { type: 'CLOSE_OVERLAY' })
    expect(next.overlay).toEqual({ kind: 'none' })
  })
})

// ---------------------------------------------------------------------------
// SET_CUSTOMIZE_TAB — switches tab in place, no close/reopen
// ---------------------------------------------------------------------------

describe('SET_CUSTOMIZE_TAB', () => {
  it('switches the customize overlay tab in place without closing it', () => {
    let state = freshState()
    state = mockupReducer(state, { type: 'OPEN_OVERLAY', overlay: { kind: 'customize', tab: 'agents' } })
    state = mockupReducer(state, { type: 'SET_CUSTOMIZE_TAB', tab: 'skills' })
    expect(state.overlay).toEqual({ kind: 'customize', tab: 'skills' })
    state = mockupReducer(state, { type: 'SET_CUSTOMIZE_TAB', tab: 'tools' })
    expect(state.overlay).toEqual({ kind: 'customize', tab: 'tools' })
  })

  it('is a no-op when the customize overlay is not open', () => {
    const state = freshState()
    const next = mockupReducer(state, { type: 'SET_CUSTOMIZE_TAB', tab: 'skills' })
    expect(next).toBe(state)
    expect(next.overlay).toEqual({ kind: 'none' })
  })
})

// ---------------------------------------------------------------------------
// SET_MODE, TOGGLE_COMPONENT, CLEAR_COMPONENTS (AC32)
// ---------------------------------------------------------------------------

describe('SET_MODE', () => {
  it('sets planning mode and back to engineering', () => {
    let state = freshState()
    state = mockupReducer(state, { type: 'SET_MODE', mode: 'planning' })
    expect(state.sessionMode).toBe('planning')
    state = mockupReducer(state, { type: 'SET_MODE', mode: 'engineering' })
    expect(state.sessionMode).toBe('engineering')
  })

  it('sets qa mode between engineering and planning', () => {
    let state = freshState()
    state = mockupReducer(state, { type: 'SET_MODE', mode: 'qa' })
    expect(state.sessionMode).toBe('qa')
    state = mockupReducer(state, { type: 'SET_MODE', mode: 'planning' })
    expect(state.sessionMode).toBe('planning')
  })
})

describe('TOGGLE_COMPONENT / CLEAR_COMPONENTS', () => {
  it('toggles components into and out of the selection list (AC32)', () => {
    let state = freshState()
    state = mockupReducer(state, { type: 'TOGGLE_COMPONENT', componentId: 'comp-hris-web' })
    state = mockupReducer(state, { type: 'TOGGLE_COMPONENT', componentId: 'comp-canteen-api' })
    expect(state.selectedComponentIds).toEqual(['comp-hris-web', 'comp-canteen-api'])
    state = mockupReducer(state, { type: 'TOGGLE_COMPONENT', componentId: 'comp-hris-web' })
    expect(state.selectedComponentIds).toEqual(['comp-canteen-api'])
  })

  it('does not duplicate a component already selected', () => {
    let state = freshState()
    state = mockupReducer(state, { type: 'TOGGLE_COMPONENT', componentId: 'comp-hris-web' })
    state = mockupReducer(state, { type: 'TOGGLE_COMPONENT', componentId: 'comp-hris-web' })
    expect(state.selectedComponentIds).toEqual([])
  })

  it('CLEAR_COMPONENTS empties the selection (AC32)', () => {
    let state = freshState()
    state = mockupReducer(state, { type: 'TOGGLE_COMPONENT', componentId: 'comp-hris-web' })
    state = mockupReducer(state, { type: 'TOGGLE_COMPONENT', componentId: 'comp-canteen-api' })
    state = mockupReducer(state, { type: 'CLEAR_COMPONENTS' })
    expect(state.selectedComponentIds).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Session context — sessionContext/sessionContextDraft (composer layout
// correction). The repository modal edits only the transient draft; the
// committed sessionContext + global active/repo state stay frozen until
// COMMIT/CONFIRM. BEGIN reseeds the draft from committed or global state.
// ---------------------------------------------------------------------------

describe('session context initial state', () => {
  it('starts with no committed context and no open draft', () => {
    const state = freshState()
    expect(state.sessionContext).toBeNull()
    expect(state.sessionContextDraft).toBeNull()
  })

  it('initializes sessionDetail from SESSION_DETAIL via deep clone', () => {
    const state = freshState()
    expect(state.sessionDetail).toEqual(SESSION_DETAIL)
    expect(state.sessionDetail).not.toBe(SESSION_DETAIL)
    expect(state.sessionDetail.quotes).not.toBe(SESSION_DETAIL.quotes)
    expect(state.sessionDetail.timeline).not.toBe(SESSION_DETAIL.timeline)
  })

  it('stores mode/system/component context metadata on sessionDetail itself (option B)', () => {
    const state = freshState()
    expect(state.sessionDetail.mode).toBe('engineering')
    expect(state.sessionDetail.systemId).toBe('bsi-hris')
    expect(state.sessionDetail.systemName).toBe('BSI - HRIS')
    expect(state.sessionDetail.componentName).toBe('hris-web')
  })

  it('mutating the state copy does not alter the SESSION_DETAIL constant', () => {
    const state = freshState()
    // Mutate the state copy
    const mutatedState = {
      ...state,
      sessionDetail: {
        ...state.sessionDetail,
        status: 'CANCELLED' as const,
      },
    }
    expect(mutatedState.sessionDetail.status).toBe('CANCELLED')
    expect(SESSION_DETAIL.status).toBe('WAITING_APPROVAL')
  })
})

describe('BEGIN_SESSION_CONTEXT_DRAFT', () => {
  it('seeds the draft from the global active system and repo selection when nothing is committed', () => {
    let state = stateWithRepoSelection()
    state = mockupReducer(state, { type: 'BEGIN_SESSION_CONTEXT_DRAFT' })

    expect(state.sessionContextDraft).toEqual({
      systemId: DEFAULT_ACTIVE_SYSTEM_ID,
      repoIds: [ACTIVE_SYSTEM_REPO, ACTIVE_SYSTEM_REPO_2],
    })
    // The global slices stay exactly as they were.
    expect(state.sessionContext).toBeNull()
    expect(state.activeSystemId).toBe(DEFAULT_ACTIVE_SYSTEM_ID)
    expect(state.selectedRepoIds).toEqual([ACTIVE_SYSTEM_REPO, ACTIVE_SYSTEM_REPO_2])
  })

  it('reseeds the draft from the committed context when its system still exists', () => {
    let state = freshState()
    state = mockupReducer(state, {
      type: 'CONFIRM_SESSION_CONTEXT',
      systemId: 'bsi-canteen',
      repoIds: ['bsi/canteen-backend'],
    })
    // Open a draft and steer it away so a stale draft would differ.
    state = mockupReducer(state, { type: 'BEGIN_SESSION_CONTEXT_DRAFT' })
    state = mockupReducer(state, { type: 'SET_SESSION_DRAFT_SYSTEM', systemId: DEFAULT_ACTIVE_SYSTEM_ID })
    state = mockupReducer(state, { type: 'TOGGLE_SESSION_DRAFT_REPO', repoId: ACTIVE_SYSTEM_REPO })
    expect(state.sessionContextDraft).not.toEqual(state.sessionContext)

    state = mockupReducer(state, { type: 'BEGIN_SESSION_CONTEXT_DRAFT' })
    expect(state.sessionContextDraft).toEqual({ systemId: 'bsi-canteen', repoIds: ['bsi/canteen-backend'] })
  })
})

describe('resolveSessionContextDraft', () => {
  it('falls back to the global selection when the committed system no longer exists', () => {
    let state = freshState()
    state = { ...state, sessionContext: { systemId: 'ghost-system', repoIds: ['ghost/repo'] } }
    state = mockupReducer(state, { type: 'TOGGLE_REPO', repoId: ACTIVE_SYSTEM_REPO })

    expect(resolveSessionContextDraft(state)).toEqual({
      systemId: DEFAULT_ACTIVE_SYSTEM_ID,
      repoIds: [ACTIVE_SYSTEM_REPO],
    })
  })
})

describe('SET_SESSION_DRAFT_SYSTEM', () => {
  it('switches the draft system and clears draft repos without leaking to global state', () => {
    let state = stateWithRepoSelection()
    state = mockupReducer(state, { type: 'BEGIN_SESSION_CONTEXT_DRAFT' })
    state = mockupReducer(state, { type: 'SET_SESSION_DRAFT_SYSTEM', systemId: 'bsi-canteen' })

    expect(state.sessionContextDraft).toEqual({ systemId: 'bsi-canteen', repoIds: [] })
    // Global active system + repo selection remain frozen.
    expect(state.activeSystemId).toBe(DEFAULT_ACTIVE_SYSTEM_ID)
    expect(state.selectedRepoIds).toEqual([ACTIVE_SYSTEM_REPO, ACTIVE_SYSTEM_REPO_2])
    expect(state.sessionContext).toBeNull()
  })

  it('implicitly seeds a draft from global when none is open', () => {
    let state = stateWithRepoSelection()
    state = mockupReducer(state, { type: 'SET_SESSION_DRAFT_SYSTEM', systemId: 'bsi-canteen' })

    expect(state.sessionContextDraft).toEqual({ systemId: 'bsi-canteen', repoIds: [] })
    expect(state.activeSystemId).toBe(DEFAULT_ACTIVE_SYSTEM_ID)
    expect(state.selectedRepoIds).toEqual([ACTIVE_SYSTEM_REPO, ACTIVE_SYSTEM_REPO_2])
  })

  it('is a no-op for the same system and for unknown systems', () => {
    let state = stateWithRepoSelection()
    state = mockupReducer(state, { type: 'BEGIN_SESSION_CONTEXT_DRAFT' })

    const sameSystem = mockupReducer(state, {
      type: 'SET_SESSION_DRAFT_SYSTEM',
      systemId: DEFAULT_ACTIVE_SYSTEM_ID,
    })
    expect(sameSystem).toBe(state)

    const unknown = mockupReducer(state, { type: 'SET_SESSION_DRAFT_SYSTEM', systemId: 'nope' })
    expect(unknown).toBe(state)
  })
})

describe('TOGGLE_SESSION_DRAFT_REPO', () => {
  it('toggles repos inside the draft only and never leaks to global state', () => {
    let state = stateWithRepoSelection()
    state = mockupReducer(state, { type: 'BEGIN_SESSION_CONTEXT_DRAFT' })
    state = mockupReducer(state, { type: 'TOGGLE_SESSION_DRAFT_REPO', repoId: ACTIVE_SYSTEM_REPO })

    expect(state.sessionContextDraft).toEqual({
      systemId: DEFAULT_ACTIVE_SYSTEM_ID,
      repoIds: [ACTIVE_SYSTEM_REPO_2],
    })
    expect(state.selectedRepoIds).toEqual([ACTIVE_SYSTEM_REPO, ACTIVE_SYSTEM_REPO_2])
    expect(state.sessionContext).toBeNull()
  })

  it('implicitly seeds from global when no draft is open', () => {
    let state = freshState()
    state = mockupReducer(state, { type: 'TOGGLE_SESSION_DRAFT_REPO', repoId: ACTIVE_SYSTEM_REPO })

    expect(state.sessionContextDraft).toEqual({
      systemId: DEFAULT_ACTIVE_SYSTEM_ID,
      repoIds: [ACTIVE_SYSTEM_REPO],
    })
    expect(state.selectedRepoIds).toEqual([])
  })

  it('ignores repositories that do not belong to the draft system', () => {
    let state = stateWithRepoSelection()
    state = mockupReducer(state, { type: 'BEGIN_SESSION_CONTEXT_DRAFT' })
    const next = mockupReducer(state, { type: 'TOGGLE_SESSION_DRAFT_REPO', repoId: OTHER_SYSTEM_REPO })
    expect(next).toBe(state)
  })
})

describe('COMMIT_SESSION_CONTEXT_DRAFT', () => {
  it('atomically syncs committed context, active system, and repo selection, then clears the draft', () => {
    let state = stateWithRepoSelection()
    state = mockupReducer(state, { type: 'BEGIN_SESSION_CONTEXT_DRAFT' })
    state = mockupReducer(state, { type: 'SET_SESSION_DRAFT_SYSTEM', systemId: 'bsi-canteen' })
    state = mockupReducer(state, { type: 'TOGGLE_SESSION_DRAFT_REPO', repoId: 'bsi/canteen-backend' })
    state = mockupReducer(state, { type: 'COMMIT_SESSION_CONTEXT_DRAFT' })

    expect(state.sessionContext).toEqual({ systemId: 'bsi-canteen', repoIds: ['bsi/canteen-backend'] })
    expect(state.activeSystemId).toBe('bsi-canteen')
    expect(state.selectedRepoIds).toEqual(['bsi/canteen-backend'])
    expect(state.sessionContextDraft).toBeNull()
  })

  it('is a no-op when no draft is open', () => {
    const state = freshState()
    expect(mockupReducer(state, { type: 'COMMIT_SESSION_CONTEXT_DRAFT' })).toBe(state)
  })
})

describe('CONFIRM_SESSION_CONTEXT', () => {
  it('commits an explicit system with an empty repo scope by default', () => {
    let state = stateWithRepoSelection()
    state = mockupReducer(state, { type: 'CONFIRM_SESSION_CONTEXT', systemId: 'bsi-canteen' })

    expect(state.sessionContext).toEqual({ systemId: 'bsi-canteen', repoIds: [] })
    expect(state.activeSystemId).toBe('bsi-canteen')
    expect(state.selectedRepoIds).toEqual([])
    expect(state.sessionContextDraft).toBeNull()
  })

  it('commits the provided repo scope when given', () => {
    let state = freshState()
    state = mockupReducer(state, {
      type: 'CONFIRM_SESSION_CONTEXT',
      systemId: 'bsi-canteen',
      repoIds: ['bsi/canteen-cms'],
    })

    expect(state.sessionContext).toEqual({ systemId: 'bsi-canteen', repoIds: ['bsi/canteen-cms'] })
    expect(state.selectedRepoIds).toEqual(['bsi/canteen-cms'])
  })

  it('ignores unknown systems and leaves the previous state untouched', () => {
    const state = stateWithRepoSelection()
    expect(mockupReducer(state, { type: 'CONFIRM_SESSION_CONTEXT', systemId: 'nope' })).toBe(state)
  })
})

describe('committed session context isolation', () => {
  it('keeps the committed context frozen when the sidebar switches the active system', () => {
    let state = freshState()
    state = mockupReducer(state, {
      type: 'CONFIRM_SESSION_CONTEXT',
      systemId: 'bsi-canteen',
      repoIds: ['bsi/canteen-backend'],
    })
    state = mockupReducer(state, { type: 'SET_ACTIVE_SYSTEM', systemId: DEFAULT_ACTIVE_SYSTEM_ID })

    expect(state.activeSystemId).toBe(DEFAULT_ACTIVE_SYSTEM_ID)
    expect(state.selectedRepoIds).toEqual([])
    expect(state.sessionContext).toEqual({ systemId: 'bsi-canteen', repoIds: ['bsi/canteen-backend'] })
  })

  it('keeps the committed context frozen when global repo selection changes', () => {
    let state = freshState()
    state = mockupReducer(state, {
      type: 'CONFIRM_SESSION_CONTEXT',
      systemId: DEFAULT_ACTIVE_SYSTEM_ID,
      repoIds: [],
    })
    state = mockupReducer(state, { type: 'TOGGLE_REPO', repoId: ACTIVE_SYSTEM_REPO })

    expect(state.selectedRepoIds).toEqual([ACTIVE_SYSTEM_REPO])
    expect(state.sessionContext).toEqual({ systemId: DEFAULT_ACTIVE_SYSTEM_ID, repoIds: [] })
  })

  it('BEGIN after a sidebar change still reseeds from the committed context, not the global selection', () => {
    let state = freshState()
    state = mockupReducer(state, {
      type: 'CONFIRM_SESSION_CONTEXT',
      systemId: 'bsi-canteen',
      repoIds: ['bsi/canteen-backend'],
    })
    state = mockupReducer(state, { type: 'SET_ACTIVE_SYSTEM', systemId: DEFAULT_ACTIVE_SYSTEM_ID })
    state = mockupReducer(state, { type: 'TOGGLE_REPO', repoId: ACTIVE_SYSTEM_REPO })
    state = mockupReducer(state, { type: 'BEGIN_SESSION_CONTEXT_DRAFT' })

    expect(state.sessionContextDraft).toEqual({ systemId: 'bsi-canteen', repoIds: ['bsi/canteen-backend'] })
  })
})

// ---------------------------------------------------------------------------
// SET_ACTIVE_PROFILE, TOGGLE_SIDEBAR, SET_SEARCH
// ---------------------------------------------------------------------------

describe('SET_ACTIVE_PROFILE', () => {
  it('activates a known execution profile', () => {
    const state = freshState()
    const next = mockupReducer(state, { type: 'SET_ACTIVE_PROFILE', profileId: 'profile-core-banking' })
    expect(next.activeProfileId).toBe('profile-core-banking')
  })

  it('ignores unknown profile ids', () => {
    const state = freshState()
    const next = mockupReducer(state, { type: 'SET_ACTIVE_PROFILE', profileId: 'profile-ghost' })
    expect(next).toBe(state)
  })
})

describe('TOGGLE_SIDEBAR', () => {
  it('collapses and restores the sidebar', () => {
    let state = freshState()
    state = mockupReducer(state, { type: 'TOGGLE_SIDEBAR' })
    expect(state.sidebarCollapsed).toBe(true)
    state = mockupReducer(state, { type: 'TOGGLE_SIDEBAR' })
    expect(state.sidebarCollapsed).toBe(false)
  })

  it('leaves the mobile drawer state untouched', () => {
    let state = mockupReducer(freshState(), { type: 'TOGGLE_SIDEBAR' })
    expect(state.sidebarMobileOpen).toBe(false)
    state = mockupReducer(state, { type: 'TOGGLE_SIDEBAR_MOBILE' })
    expect(state.sidebarMobileOpen).toBe(true)
    state = mockupReducer(state, { type: 'TOGGLE_SIDEBAR' })
    expect(state.sidebarCollapsed).toBe(false)
    expect(state.sidebarMobileOpen).toBe(true)
  })
})

describe('TOGGLE_SIDEBAR_MOBILE', () => {
  it('opens and closes the mobile drawer, independent of the collapse state', () => {
    let state = freshState()
    expect(state.sidebarMobileOpen).toBe(false)
    state = mockupReducer(state, { type: 'TOGGLE_SIDEBAR_MOBILE' })
    expect(state.sidebarMobileOpen).toBe(true)
    state = mockupReducer(state, { type: 'TOGGLE_SIDEBAR_MOBILE' })
    expect(state.sidebarMobileOpen).toBe(false)
    expect(state.sidebarCollapsed).toBe(false)
  })

  it('is payload-less and composes with a collapsed sidebar', () => {
    let state = mockupReducer(freshState(), { type: 'TOGGLE_SIDEBAR' })
    state = mockupReducer(state, { type: 'TOGGLE_SIDEBAR_MOBILE' })
    expect(state.sidebarCollapsed).toBe(true)
    expect(state.sidebarMobileOpen).toBe(true)
  })
})

describe('SET_SEARCH', () => {
  it('updates each list search independently', () => {
    let state = freshState()
    state = mockupReducer(state, { type: 'SET_SEARCH', list: 'systems', value: 'bsi' })
    state = mockupReducer(state, { type: 'SET_SEARCH', list: 'components', value: 'api' })
    expect(state.search).toEqual({ systems: 'bsi', repositories: '', components: 'api', sessions: '' })
  })
})

// ---------------------------------------------------------------------------
// SESSION_APPROVE_QUOTE — approves pending quote, transitions to DELIVERING
// ---------------------------------------------------------------------------

describe('SESSION_APPROVE_QUOTE', () => {
  it('approves a pending quote and transitions session to DELIVERING', () => {
    let state = freshState()
    const beforeTimelineLength = state.sessionDetail.timeline.length
    state = mockupReducer(state, { type: 'SESSION_APPROVE_QUOTE', quoteId: 'Q-102' })

    const quote = state.sessionDetail.quotes.find((q) => q.id === 'Q-102')
    expect(quote?.status).toBe('APPROVED')
    expect(quote?.approvedBy).toBe('Refactory Admin')
    expect(quote?.approvedAt).toBeDefined()

    expect(state.sessionDetail.status).toBe('DELIVERING')
    expect(state.sessionDetail.updatedAt).toBe(quote?.approvedAt)

    const quoteStage = state.sessionDetail.stages.find((s) => s.id === 'quote')
    const planStage = state.sessionDetail.stages.find((s) => s.id === 'plan')
    expect(quoteStage?.status).toBe('COMPLETED')
    expect(planStage?.status).toBe('IN_PROGRESS')

    expect(state.sessionDetail.timeline).toHaveLength(beforeTimelineLength + 2)
    const lastTwo = state.sessionDetail.timeline.slice(-2)
    expect(lastTwo[0].type).toBe('APPROVAL')
    expect(lastTwo[0].quoteId).toBe('Q-102')
    expect(lastTwo[0].content).toContain('approved by Refactory Admin')
    expect(lastTwo[1].type).toBe('SYSTEM_EVENT')
    expect(lastTwo[1].content).toBe('Quote approved — delivery started')
  })

  it('is a no-op for non-pending quotes', () => {
    const state = freshState()
    const next = mockupReducer(state, { type: 'SESSION_APPROVE_QUOTE', quoteId: 'Q-101' })
    expect(next).toBe(state)
  })

  it('is a no-op for unknown quote ids', () => {
    const state = freshState()
    const next = mockupReducer(state, { type: 'SESSION_APPROVE_QUOTE', quoteId: 'Q-999' })
    expect(next).toBe(state)
  })
})

// ---------------------------------------------------------------------------
// SESSION_REJECT_QUOTE — rejects pending quote, sets quote stage to BLOCKED
// ---------------------------------------------------------------------------

describe('SESSION_REJECT_QUOTE', () => {
  it('rejects a pending quote and sets quote stage to BLOCKED', () => {
    let state = freshState()
    const beforeTimelineLength = state.sessionDetail.timeline.length
    const reason = 'Scope too broad for current sprint'
    state = mockupReducer(state, { type: 'SESSION_REJECT_QUOTE', quoteId: 'Q-102', reason })

    const quote = state.sessionDetail.quotes.find((q) => q.id === 'Q-102')
    expect(quote?.status).toBe('REJECTED')
    expect(quote?.rejectionReason).toBe(reason)

    expect(state.sessionDetail.status).toBe('WAITING_APPROVAL')

    const quoteStage = state.sessionDetail.stages.find((s) => s.id === 'quote')
    expect(quoteStage?.status).toBe('BLOCKED')

    expect(state.sessionDetail.timeline).toHaveLength(beforeTimelineLength + 2)
    const lastTwo = state.sessionDetail.timeline.slice(-2)
    expect(lastTwo[0].type).toBe('APPROVAL')
    expect(lastTwo[0].quoteId).toBe('Q-102')
    expect(lastTwo[0].content).toContain('rejected')
    expect(lastTwo[0].content).toContain(reason)
    expect(lastTwo[1].type).toBe('ASSISTANT_MESSAGE')
    expect(lastTwo[1].content).toContain('revised quote can be requested')
  })

  it('is a no-op for non-pending quotes', () => {
    const state = freshState()
    const next = mockupReducer(state, {
      type: 'SESSION_REJECT_QUOTE',
      quoteId: 'Q-101',
      reason: 'test',
    })
    expect(next).toBe(state)
  })

  it('is a no-op for unknown quote ids', () => {
    const state = freshState()
    const next = mockupReducer(state, {
      type: 'SESSION_REJECT_QUOTE',
      quoteId: 'Q-999',
      reason: 'test',
    })
    expect(next).toBe(state)
  })
})

// ---------------------------------------------------------------------------
// SESSION_REQUEST_QUOTE_REVISION — superseded quote, new quote created
// ---------------------------------------------------------------------------

describe('SESSION_REQUEST_QUOTE_REVISION', () => {
  it('supersedes current pending quote and creates a revised one', () => {
    let state = freshState()
    const beforeQuoteCount = state.sessionDetail.quotes.length
    const beforeTimelineLength = state.sessionDetail.timeline.length

    state = mockupReducer(state, { type: 'SESSION_REQUEST_QUOTE_REVISION', quoteId: 'Q-102' })

    const oldQuote = state.sessionDetail.quotes.find((q) => q.id === 'Q-102')
    expect(oldQuote?.status).toBe('SUPERSEDED')

    expect(state.sessionDetail.quotes).toHaveLength(beforeQuoteCount + 1)
    const newQuote = state.sessionDetail.quotes[beforeQuoteCount]
    expect(newQuote.version).toBe(3)
    expect(newQuote.status).toBe('PENDING_APPROVAL')
    expect(newQuote.expiresAt).toBeDefined()
    expect(newQuote.estimatedStoryPoints).toBe(6)
    expect(newQuote.maxStoryPoints).toBe(9)

    expect(state.sessionDetail.timeline).toHaveLength(beforeTimelineLength + 2)
    const lastTwo = state.sessionDetail.timeline.slice(-2)
    expect(lastTwo[0].type).toBe('SYSTEM_EVENT')
    expect(lastTwo[0].content).toContain('superseded')
    expect(lastTwo[0].content).toContain('revised quote')
    expect(lastTwo[1].type).toBe('QUOTE')
    expect(lastTwo[1].quoteId).toBe(newQuote.id)
  })

  it('is a no-op for non-pending quotes', () => {
    const state = freshState()
    const next = mockupReducer(state, {
      type: 'SESSION_REQUEST_QUOTE_REVISION',
      quoteId: 'Q-101',
    })
    expect(next).toBe(state)
  })

  it('is a no-op for unknown quote ids', () => {
    const state = freshState()
    const next = mockupReducer(state, {
      type: 'SESSION_REQUEST_QUOTE_REVISION',
      quoteId: 'Q-999',
    })
    expect(next).toBe(state)
  })
})

// ---------------------------------------------------------------------------
// SESSION_SEND_DETAIL_MESSAGE / SESSION_RECEIVE_DETAIL_MESSAGE — two-phase
// pending chat flow: the send lands only the user message and flags the
// assistant reply as pending; the fixed acknowledgment arrives on receive.
// ---------------------------------------------------------------------------

describe('SESSION_SEND_DETAIL_MESSAGE', () => {
  it('appends only the user message and flags a pending assistant reply', () => {
    let state = freshState()
    const beforeTimelineLength = state.sessionDetail.timeline.length
    const content = 'Please add unit tests for the pagination fix'

    state = mockupReducer(state, { type: 'SESSION_SEND_DETAIL_MESSAGE', content })

    expect(state.sessionDetail.timeline).toHaveLength(beforeTimelineLength + 1)
    const last = state.sessionDetail.timeline[state.sessionDetail.timeline.length - 1]
    expect(last.type).toBe('USER_MESSAGE')
    expect(last.content).toBe(content)
    expect(last.actorType).toBe('USER')
    expect(state.sessionDetail.pendingAssistant).toBe(true)

    expect(state.sessionDetail.updatedAt).toBeDefined()
  })

  it('keeps the pending flag set across consecutive sends until a receive lands', () => {
    let state = freshState()
    expect(state.sessionDetail.pendingAssistant).toBe(false)

    state = mockupReducer(state, { type: 'SESSION_SEND_DETAIL_MESSAGE', content: 'test' })
    expect(state.sessionDetail.pendingAssistant).toBe(true)

    state = mockupReducer(state, { type: 'SESSION_RECEIVE_DETAIL_MESSAGE' })
    expect(state.sessionDetail.pendingAssistant).toBe(false)

    state = mockupReducer(state, { type: 'SESSION_SEND_DETAIL_MESSAGE', content: 'again' })
    expect(state.sessionDetail.pendingAssistant).toBe(true)
  })

  it('user message appears with bumped timestamp', () => {
    let state = freshState()
    const lastTimestamp = state.sessionDetail.timeline[state.sessionDetail.timeline.length - 1].createdAt

    state = mockupReducer(state, { type: 'SESSION_SEND_DETAIL_MESSAGE', content: 'test' })

    const newMessage = state.sessionDetail.timeline[state.sessionDetail.timeline.length - 1]
    expect(new Date(newMessage.createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(lastTimestamp).getTime(),
    )
  })
})

describe('SESSION_RECEIVE_DETAIL_MESSAGE', () => {
  it('appends a natural response from the pool with meta and clears the pending state', () => {
    let state = freshState()
    const beforeTimelineLength = state.sessionDetail.timeline.length

    state = mockupReducer(state, { type: 'SESSION_SEND_DETAIL_MESSAGE', content: 'test' })
    const drawnPhases = state.sessionDetail.pendingPhases
    state = mockupReducer(state, { type: 'SESSION_RECEIVE_DETAIL_MESSAGE' })

    expect(state.sessionDetail.timeline).toHaveLength(beforeTimelineLength + 2)
    const lastTwo = state.sessionDetail.timeline.slice(-2)
    expect(lastTwo[0].type).toBe('USER_MESSAGE')
    expect(lastTwo[1].type).toBe('ASSISTANT_MESSAGE')
    expect(ASSISTANT_RESPONSES).toContain(lastTwo[1].content)
    expect(lastTwo[1].actorType).toBe('ASSISTANT')
    // Response meta (duration/tokens) rides on the message for the footer.
    expect(lastTwo[1].meta).toBeDefined()
    expect(lastTwo[1].meta?.durationMs).toBeGreaterThanOrEqual(12_000)
    expect(lastTwo[1].meta?.durationMs).toBeLessThanOrEqual(45_000)
    expect(lastTwo[1].meta?.tokensIn).toBeGreaterThanOrEqual(80_000)
    expect(lastTwo[1].meta?.tokensIn).toBeLessThanOrEqual(140_000)
    expect(lastTwo[1].meta?.tokensOut).toBeGreaterThanOrEqual(300)
    expect(lastTwo[1].meta?.tokensOut).toBeLessThanOrEqual(900)
    expect(state.sessionDetail.pendingAssistant).toBe(false)
    expect(state.sessionDetail.pendingPhases).toEqual([])
    expect(drawnPhases.length).toBeGreaterThanOrEqual(3)
  })

  it('acknowledgment timestamp is not earlier than the send timestamp', () => {
    let state = freshState()
    state = mockupReducer(state, { type: 'SESSION_SEND_DETAIL_MESSAGE', content: 'test' })
    const sentAt = state.sessionDetail.timeline[state.sessionDetail.timeline.length - 1].createdAt

    state = mockupReducer(state, { type: 'SESSION_RECEIVE_DETAIL_MESSAGE' })

    const ack = state.sessionDetail.timeline[state.sessionDetail.timeline.length - 1]
    expect(new Date(ack.createdAt).getTime()).toBeGreaterThanOrEqual(new Date(sentAt).getTime())
  })
})

// ---------------------------------------------------------------------------
// SESSION_CREATE_FROM_COMPOSER — main-page composer send starts a fresh
// pending session and routes to the session detail.
// ---------------------------------------------------------------------------

describe('SESSION_CREATE_FROM_COMPOSER', () => {
  it('creates a fresh pending session seeded with the prompt and routes to session detail', () => {
    let state = freshState()
    const fixtureSessionId = state.sessionDetail.sessionId

    state = mockupReducer(state, {
      type: 'SESSION_CREATE_FROM_COMPOSER',
      content: 'Build a renewal reminder dashboard widget',
    })

    expect(state.route).toBe('session-detail')
    expect(state.sessionDetail.pendingAssistant).toBe(true)
    expect(state.sessionDetail.sessionId).not.toBe(fixtureSessionId)
    expect(state.sessionDetail.title).toBe('Build a renewal reminder dashboard widget')
    expect(state.sessionDetail.status).toBe('IN_PROGRESS')
    expect(state.sessionDetail.currentCycle).toBe(1)
    expect(state.sessionDetail.systemId).toBe(state.activeSystemId)
    expect(state.sessionDetail.timeline).toHaveLength(1)
    expect(state.sessionDetail.timeline[0].type).toBe('USER_MESSAGE')
    expect(state.sessionDetail.timeline[0].content).toBe('Build a renewal reminder dashboard widget')
    expect(state.sessionDetail.timeline[0].actorType).toBe('USER')
    // Workflow progress resets: first stage in progress, nothing delivered.
    expect(state.sessionDetail.stages[0].status).toBe('IN_PROGRESS')
    expect(state.sessionDetail.stages.slice(1).every((stage) => stage.status === 'NOT_STARTED')).toBe(true)
    expect(state.sessionDetail.quotes).toHaveLength(0)
    expect(state.sessionDetail.delivery.status).toBe('NOT_STARTED')
  })

  it('truncates long prompts to a clean session title', () => {
    let state = freshState()
    const longPrompt = 'Investigate and fix the error when get list approval exception that list not showing'

    state = mockupReducer(state, { type: 'SESSION_CREATE_FROM_COMPOSER', content: longPrompt })

    expect(state.sessionDetail.title).toBe(`${longPrompt.slice(0, 48).trimEnd()}…`)
    expect(state.sessionDetail.title.endsWith('…')).toBe(true)
    // The full prompt is preserved verbatim in the timeline message.
    expect(state.sessionDetail.timeline[0].content).toBe(longPrompt)
  })

  it('receive lands a natural response on the new session and clears pending', () => {
    let state = freshState()

    state = mockupReducer(state, { type: 'SESSION_CREATE_FROM_COMPOSER', content: 'New idea' })
    state = mockupReducer(state, { type: 'SESSION_RECEIVE_DETAIL_MESSAGE' })

    expect(state.sessionDetail.pendingAssistant).toBe(false)
    expect(state.sessionDetail.timeline).toHaveLength(2)
    expect(state.sessionDetail.timeline[1].type).toBe('ASSISTANT_MESSAGE')
    expect(ASSISTANT_RESPONSES).toContain(state.sessionDetail.timeline[1].content)
    expect(state.sessionDetail.timeline[1].meta).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Immutability — the reducer never mutates the previous state
// ---------------------------------------------------------------------------

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

describe('immutability', () => {
  it('every transition leaves the frozen previous state intact and returns a new object', () => {
    const actions: MockupAction[] = [
      { type: 'SET_ACTIVE_SYSTEM', systemId: 'richapp' },
      { type: 'TOGGLE_REPO', repoId: 'richapp/fe-richapp' },
      { type: 'CREATE_SYSTEM', name: 'Frozen Probe', description: 'immutability check' },
      { type: 'NAVIGATE', route: 'session-history' },
      { type: 'OPEN_OVERLAY', overlay: { kind: 'customize', tab: 'skills' } },
      { type: 'SET_CUSTOMIZE_TAB', tab: 'tools' },
      { type: 'CLOSE_OVERLAY' },
      { type: 'SET_MODE', mode: 'planning' },
      { type: 'TOGGLE_COMPONENT', componentId: 'comp-hris-web' },
      { type: 'CLEAR_COMPONENTS' },
      { type: 'SET_ACTIVE_PROFILE', profileId: 'profile-commerce-platform' },
      { type: 'TOGGLE_SIDEBAR' },
      { type: 'TOGGLE_SIDEBAR_MOBILE' },
      { type: 'SET_SEARCH', list: 'sessions', value: 'edp' },
      // Session-context draft actions (composer correction) — the transient
      // draft edits and commits must also return new objects without mutating
      // the frozen previous state.
      { type: 'BEGIN_SESSION_CONTEXT_DRAFT' },
      { type: 'SET_SESSION_DRAFT_SYSTEM', systemId: 'richapp' },
      { type: 'TOGGLE_SESSION_DRAFT_REPO', repoId: 'richapp/fe-richapp' },
      { type: 'COMMIT_SESSION_CONTEXT_DRAFT' },
      { type: 'CONFIRM_SESSION_CONTEXT', systemId: 'bsi-canteen', repoIds: ['bsi/canteen-backend'] },
      // Session detail actions — Q-102 is PENDING_APPROVAL in initial state
      { type: 'SESSION_SEND_DETAIL_MESSAGE', content: 'test message' },
      { type: 'SESSION_REQUEST_QUOTE_REVISION', quoteId: 'Q-102' },
      { type: 'SESSION_APPROVE_QUOTE', quoteId: 'Q-103' },
    ]
    let state: MockupState = deepFreeze(freshState())
    for (const action of actions) {
      const next = mockupReducer(state, action)
      expect(next).not.toBe(state)
      state = next
    }
    expect(state.route).toBe('session-history')
    expect(state.sessionMode).toBe('planning')
    expect(state.sidebarCollapsed).toBe(true)
    expect(state.activeProfileId).toBe('profile-commerce-platform')
    expect(state.search.sessions).toBe('edp')
  })
})

// ---------------------------------------------------------------------------
// mockData contract — illustrative placeholder data (AC46 and Task 3 scope)
// ---------------------------------------------------------------------------

// jsdom rewrites import.meta.url to an http origin, so resolve from cwd instead.
const mockDataSource = readFileSync(join(process.cwd(), 'src/data/mockData.ts'), 'utf8')

describe('mockData contract', () => {
  it('carries the exact illustrative-data marker comment at the top (AC46)', () => {
    expect(mockDataSource).toContain(
      '// ILLUSTRATIVE DATA — all names/counts/timestamps are placeholders, not production facts (spec AC46)',
    )
  })

  it('exports the visible marker string', () => {
    expect(ILLUSTRATIVE_DATA_NOTE).toBe('Illustrative data')
  })

  it('contains no TODO placeholder text anywhere', () => {
    expect(mockDataSource.toUpperCase()).not.toContain('TODO')
  })

  it('defines exactly the nine illustrative systems', () => {
    expect(SYSTEMS.map((s) => s.name)).toEqual([
      'BSI - HRIS',
      'BSI Canteen',
      'MPM - Mytok',
      'MPM - Portal Vendor',
      'Hanoman',
      'Kookree',
      'Richapp',
      'Online Store',
      'Personal Blogspot',
    ])
  })

  it('keeps system ↔ repository associations consistent', () => {
    const systemIds = new Set(SYSTEMS.map((s) => s.id))
    for (const repo of REPOSITORIES) {
      expect(systemIds.has(repo.systemId)).toBe(true)
    }
    for (const system of SYSTEMS) {
      const owned = REPOSITORIES.filter((r) => r.systemId === system.id).map((r) => r.id)
      expect(system.repoIds).toEqual(owned)
      expect(owned.length).toBeGreaterThan(0)
    }
  })

  it('defines five execution profiles with planner/executor/authorization/readiness', () => {
    expect(EXECUTION_PROFILES).toHaveLength(5)
    expect(EXECUTION_PROFILES.map((p) => p.name)).toEqual([
      'Default',
      'Commerce Platform',
      'Core Banking',
      'Merchant Portal',
      'Refactory Admin',
    ])
    for (const profile of EXECUTION_PROFILES) {
      expect(profile.plannerModel.length).toBeGreaterThan(0)
      expect(profile.executorModel.length).toBeGreaterThan(0)
      expect(profile.authorization.length).toBeGreaterThan(0)
      expect(['ready', 'needs-setup']).toContain(profile.readiness)
    }
  })

  it('includes workspace-level Assistant and Search entries', () => {
    expect(WORKSPACE_SETTINGS.map((w) => w.name)).toEqual(['Assistant', 'Search'])
  })

  it('associates every component with an existing repository', () => {
    const repoIds = new Set(REPOSITORIES.map((r) => r.id))
    for (const component of COMPONENTS) {
      for (const repoId of component.repoIds) {
        expect(repoIds.has(repoId)).toBe(true)
      }
    }
  })

  it('lists recent sessions newest-first with the five illustrative titles (AC10)', () => {
    expect(mockData.recentSessions.map((s) => s.title)).toEqual([
      'EDP Integration Fix - Mobile',
      'Review attendance integration',
      'Prepare sprint proposal',
      'Map frontend dependencies',
      'Validate delivery evidence',
    ])
    const stamps = mockData.recentSessions.map((s) => s.timestamp)
    expect(stamps).toEqual([...stamps].sort((a, b) => b.localeCompare(a)))
  })

  it('keeps a richer session history with title, mode, system, component, and time (AC40)', () => {
    expect(mockData.sessionHistory.length).toBeGreaterThan(mockData.recentSessions.length)
    for (const row of mockData.sessionHistory) {
      expect(row.title.length).toBeGreaterThan(0)
      expect(['engineering', 'qa', 'planning']).toContain(row.mode)
      expect(SYSTEMS.some((s) => s.id === row.systemId)).toBe(true)
      expect(row.componentName.length).toBeGreaterThan(0)
      expect(row.time.length).toBeGreaterThan(0)
    }
    const stamps = mockData.sessionHistory.map((r) => r.timestamp)
    expect(stamps).toEqual([...stamps].sort((a, b) => b.localeCompare(a)))
  })

  it('provides pending reviews and a flat audit timeline', () => {
    expect(mockData.pendingReviews.length).toBeGreaterThan(0)
    for (const review of mockData.pendingReviews) {
      expect(review.title.length).toBeGreaterThan(0)
      expect(SYSTEMS.some((s) => s.id === review.systemId)).toBe(true)
    }
    expect(mockData.auditHistory.length).toBeGreaterThan(0)
    for (const event of mockData.auditHistory) {
      expect(event.actor.length).toBeGreaterThan(0)
      expect(event.action.length).toBeGreaterThan(0)
      expect(event.time.length).toBeGreaterThan(0)
    }
    const stamps = mockData.auditHistory.map((e) => e.timestamp)
    expect(stamps).toEqual([...stamps].sort((a, b) => b.localeCompare(a)))
  })

  it('lists account menu actions with unique labels', () => {
    expect(mockData.accountActions.length).toBeGreaterThan(0)
    const labels = mockData.accountActions.map((a) => a.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('preserves Settings structure: General, Billing sub-tabs, Team (AC42)', () => {
    const sections = mockData.settings.sections
    expect(sections.map((s) => s.id)).toEqual(['general', 'billing', 'team'])
    expect(sections.map((s) => s.label)).toEqual(['General', 'Billing', 'Team'])
    expect(sections[1].subTabs).toEqual([
      'Usage',
      'Plans',
      'Providers',
      'Budgets',
      'Top Up',
      'Transactions',
    ])
  })

  it('provides structured preserved Skills/Tools content usable by Task 9', () => {
    expect(mockData.preservedSkills.length).toBeGreaterThan(0)
    expect(mockData.preservedTools.length).toBeGreaterThan(0)
    for (const item of [...mockData.preservedSkills, ...mockData.preservedTools]) {
      expect(item.name.length).toBeGreaterThan(0)
      expect(item.description.length).toBeGreaterThan(0)
      expect(item.scope === 'Workspace' || /^System:/.test(item.scope)).toBe(true)
    }
  })
})
