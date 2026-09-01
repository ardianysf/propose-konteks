import {
  DEFAULT_ACTIVE_PROFILE_ID,
  DEFAULT_ACTIVE_SYSTEM_ID,
  EXECUTION_PROFILES,
  SESSION_DETAIL,
  SYSTEMS,
  TASK_SESSION_DETAIL,
  type SessionMode,
  type System,
  type SessionDetailData,
  type SessionStage,
  type DeliveryInfo,
} from '../data/mockData'
import { pickAssistantResponse, generateResponseMeta } from '../data/assistantResponses'
import { generatePendingPhases } from '../components/session/pendingPhases'

export type { SessionMode } from '../data/mockData'

// ---------------------------------------------------------------------------
// Overlay union — exactly one overlay may be open at a time
// ---------------------------------------------------------------------------

export type CustomizeTab = 'agents' | 'context' | 'mcp' | 'connectors' | 'vcs' | 'skills' | 'tools'
export type LearnedTab = 'pending' | 'audit'
export type SettingsSection = 'general' | 'billing' | 'team'

/** Where a Create System modal was opened from — the SystemMenu footer
 * (global create) or the repository selector's Add new system affordance
 * (session-context create). */
export type CreateSystemSource = 'system-menu' | 'repository-modal'

export type MockupOverlay =
  | { kind: 'none' }
  | { kind: 'workspace-menu' }
  | { kind: 'system-menu' }
  | { kind: 'execution-profile-menu' }
  | { kind: 'component-menu' }
  | { kind: 'repository-modal' }
  | { kind: 'manual-repo-modal' }
  | { kind: 'create-system-modal'; source: CreateSystemSource }
  | { kind: 'system-map'; systemId: string }
  | { kind: 'customize'; tab: CustomizeTab }
  | { kind: 'learned'; tab: LearnedTab }
  | { kind: 'account-menu' }
  | { kind: 'settings'; section: SettingsSection }

/** Payload for OPEN_OVERLAY; tab/section/source default when omitted. */
export type OpenOverlayPayload =
  | { kind: 'workspace-menu' }
  | { kind: 'system-menu' }
  | { kind: 'execution-profile-menu' }
  | { kind: 'component-menu' }
  | { kind: 'repository-modal' }
  | { kind: 'manual-repo-modal' }
  | { kind: 'create-system-modal'; source?: CreateSystemSource }
  | { kind: 'system-map'; systemId: string }
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

export type MockupRoute =
  | 'new-session'
  | 'session-history'
  | 'session-detail'
  | 'task-session-detail'
  | 'session-demo'
export type DemoVariant = 'ready' | 'loading' | 'empty'

export type SearchList = 'systems' | 'repositories' | 'components' | 'sessions'

export interface MockupSearchState {
  systems: string
  repositories: string
  components: string
  sessions: string
}

/** The committed session scope — a system plus its selected repositories.
 * `null` means a fresh session has no committed context yet. */
export interface SessionContext {
  systemId: string
  repoIds: string[]
}

export interface MockupState {
  route: MockupRoute
  sidebarCollapsed: boolean
  /** Mobile (≤760px) reveal drawer — independent of the collapse state. */
  sidebarMobileOpen: boolean
  sessionMode: SessionMode
  systems: System[]
  activeSystemId: string
  selectedRepoIds: string[]
  selectedComponentIds: string[]
  sessionContext: SessionContext | null
  sessionContextDraft: SessionContext | null
  activeProfileId: string
  overlay: MockupOverlay
  search: MockupSearchState
  demoVariant: DemoVariant
  sessionDetail: SessionDetailData
  /** The task session (ticket) whose detail page route `task-session-detail`
   * renders — set by NAVIGATE_TASK_SESSION (default: the TKT-3 fixture). */
  activeTaskSessionId: string
}

export type MockupAction =
  | { type: 'SET_ACTIVE_SYSTEM'; systemId: string }
  | { type: 'TOGGLE_REPO'; repoId: string }
  | { type: 'CREATE_SYSTEM'; name: string; description?: string }
  | { type: 'NAVIGATE'; route: MockupRoute }
  | { type: 'NAVIGATE_TASK_SESSION'; taskSessionId: string }
  | { type: 'OPEN_OVERLAY'; overlay: OpenOverlayPayload }
  | { type: 'CLOSE_OVERLAY' }
  | { type: 'SET_MODE'; mode: SessionMode }
  | { type: 'TOGGLE_COMPONENT'; componentId: string }
  | { type: 'CLEAR_COMPONENTS' }
  | { type: 'BEGIN_SESSION_CONTEXT_DRAFT' }
  | { type: 'SET_SESSION_DRAFT_SYSTEM'; systemId: string }
  | { type: 'TOGGLE_SESSION_DRAFT_REPO'; repoId: string }
  | { type: 'COMMIT_SESSION_CONTEXT_DRAFT' }
  | { type: 'CONFIRM_SESSION_CONTEXT'; systemId: string; repoIds?: string[] }
  | { type: 'SET_CUSTOMIZE_TAB'; tab: CustomizeTab }
  | { type: 'SET_ACTIVE_PROFILE'; profileId: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_SIDEBAR_MOBILE' }
  | { type: 'SET_SEARCH'; list: SearchList; value: string }
  | { type: 'SESSION_APPROVE_QUOTE'; quoteId: string }
  | { type: 'SESSION_REJECT_QUOTE'; quoteId: string; reason: string }
  | { type: 'SESSION_REQUEST_QUOTE_REVISION'; quoteId: string }
  | { type: 'SESSION_SEND_DETAIL_MESSAGE'; content: string }
  | { type: 'SESSION_RECEIVE_DETAIL_MESSAGE' }
  | { type: 'SESSION_CREATE_FROM_COMPOSER'; content: string }

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
    sidebarMobileOpen: false,
    sessionMode: 'engineering',
    systems: SYSTEMS.map((system) => ({ ...system, repoIds: [...system.repoIds] })),
    activeSystemId: DEFAULT_ACTIVE_SYSTEM_ID,
    selectedRepoIds: [],
    selectedComponentIds: [],
    sessionContext: null,
    sessionContextDraft: null,
    activeProfileId: DEFAULT_ACTIVE_PROFILE_ID,
    overlay: { kind: 'none' },
    search: { systems: '', repositories: '', components: '', sessions: '' },
    demoVariant,
    sessionDetail: structuredClone(SESSION_DETAIL),
    activeTaskSessionId: TASK_SESSION_DETAIL.id,
  }
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Deterministic, collision-free system id for a new system name. Exported
 * so the repository-sourced Create System flow can compute the id it will
 * confirm without duplicating the slugging rules. */
export function nextSystemId(existing: readonly System[], name: string): string {
  const base = slugify(name) || 'system'
  let candidate = base
  let counter = 2
  while (existing.some((system) => system.id === candidate)) {
    candidate = `${base}-${counter}`
    counter += 1
  }
  return candidate
}

/** The effective draft value BEGIN_SESSION_CONTEXT_DRAFT seeds: the
 * committed session context when its system still exists, otherwise the
 * global active-system/repository selection. */
export function resolveSessionContextDraft(state: MockupState): SessionContext {
  const committed = state.sessionContext
  if (committed && state.systems.some((system) => system.id === committed.systemId)) {
    return { systemId: committed.systemId, repoIds: [...committed.repoIds] }
  }
  return { systemId: state.activeSystemId, repoIds: [...state.selectedRepoIds] }
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
        id: nextSystemId(state.systems, name),
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

    // Sidebar task-row click / task deep link: select the task session and
    // route to its detail page in one transition. "Back to plan" returns
    // via plain NAVIGATE to 'session-detail'.
    case 'NAVIGATE_TASK_SESSION': {
      return {
        ...state,
        route: 'task-session-detail',
        activeTaskSessionId: action.taskSessionId,
      }
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

    // ------------------------------------------------------------------
    // Session context draft — the modal edits only the transient draft;
    // the committed sessionContext + global active/repo state stay frozen
    // until COMMIT/CONFIRM. BEGIN reseeds the draft from committed or
    // global state, so any stale draft from a cancelled open is reset.
    // ------------------------------------------------------------------

    case 'BEGIN_SESSION_CONTEXT_DRAFT': {
      return { ...state, sessionContextDraft: resolveSessionContextDraft(state) }
    }

    case 'SET_SESSION_DRAFT_SYSTEM': {
      const base = state.sessionContextDraft
        ? state
        : { ...state, sessionContextDraft: resolveSessionContextDraft(state) }
      const draft = base.sessionContextDraft!
      if (!base.systems.some((system) => system.id === action.systemId)) return base
      if (action.systemId === draft.systemId) return base
      return { ...base, sessionContextDraft: { systemId: action.systemId, repoIds: [] } }
    }

    case 'TOGGLE_SESSION_DRAFT_REPO': {
      const base = state.sessionContextDraft
        ? state
        : { ...state, sessionContextDraft: resolveSessionContextDraft(state) }
      const draft = base.sessionContextDraft!
      const system = base.systems.find((entry) => entry.id === draft.systemId)
      if (!system?.repoIds.includes(action.repoId)) return base
      const repoIds = draft.repoIds.includes(action.repoId)
        ? draft.repoIds.filter((id) => id !== action.repoId)
        : [...draft.repoIds, action.repoId]
      return { ...base, sessionContextDraft: { ...draft, repoIds } }
    }

    case 'COMMIT_SESSION_CONTEXT_DRAFT': {
      if (!state.sessionContextDraft) return state
      const draft = state.sessionContextDraft
      return {
        ...state,
        sessionContext: { systemId: draft.systemId, repoIds: [...draft.repoIds] },
        activeSystemId: draft.systemId,
        selectedRepoIds: [...draft.repoIds],
        sessionContextDraft: null,
      }
    }

    case 'CONFIRM_SESSION_CONTEXT': {
      if (!state.systems.some((system) => system.id === action.systemId)) return state
      const repoIds = action.repoIds ?? []
      return {
        ...state,
        sessionContext: { systemId: action.systemId, repoIds: [...repoIds] },
        activeSystemId: action.systemId,
        selectedRepoIds: [...repoIds],
        sessionContextDraft: null,
      }
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

    // Payload-less mobile drawer toggle — independent of the desktop
    // collapse preference (the reveal drawer is CSS-transform driven).
    case 'TOGGLE_SIDEBAR_MOBILE': {
      return { ...state, sidebarMobileOpen: !state.sidebarMobileOpen }
    }

    case 'SET_SEARCH': {
      return { ...state, search: { ...state.search, [action.list]: action.value } }
    }

    // ----------------------------------------------------------------------
    // Session Detail actions — pure, immutable transitions on sessionDetail
    // ----------------------------------------------------------------------

    case 'SESSION_APPROVE_QUOTE': {
      const quoteIndex = state.sessionDetail.quotes.findIndex(
        (q) => q.id === action.quoteId && q.status === 'PENDING_APPROVAL',
      )
      if (quoteIndex === -1) return state

      const approvedAt = new Date().toISOString()
      const updatedQuotes = [...state.sessionDetail.quotes]
      updatedQuotes[quoteIndex] = {
        ...updatedQuotes[quoteIndex],
        status: 'APPROVED' as const,
        approvedBy: 'Refactory Admin',
        approvedAt,
      }

      const updatedStages = state.sessionDetail.stages.map((stage) => {
        if (stage.id === 'quote') return { ...stage, status: 'COMPLETED' as const }
        if (stage.id === 'plan') return { ...stage, status: 'IN_PROGRESS' as const }
        return stage
      })

      const approvalItem = {
        id: `T-${Date.now()}-approval`,
        type: 'APPROVAL' as const,
        content: `Quote ${action.quoteId} approved by Refactory Admin`,
        actorType: 'USER' as const,
        createdAt: approvedAt,
        quoteId: action.quoteId,
      }

      const deliveryStartedEvent = {
        id: `T-${Date.now()}-delivery-started`,
        type: 'SYSTEM_EVENT' as const,
        content: 'Quote approved — delivery started',
        actorType: 'SYSTEM' as const,
        createdAt: approvedAt,
      }

      return {
        ...state,
        sessionDetail: {
          ...state.sessionDetail,
          status: 'DELIVERING',
          updatedAt: approvedAt,
          quotes: updatedQuotes,
          stages: updatedStages,
          timeline: [...state.sessionDetail.timeline, approvalItem, deliveryStartedEvent],
        },
      }
    }

    case 'SESSION_REJECT_QUOTE': {
      const quoteIndex = state.sessionDetail.quotes.findIndex(
        (q) => q.id === action.quoteId && q.status === 'PENDING_APPROVAL',
      )
      if (quoteIndex === -1) return state

      const rejectedAt = new Date().toISOString()
      const updatedQuotes = [...state.sessionDetail.quotes]
      updatedQuotes[quoteIndex] = {
        ...updatedQuotes[quoteIndex],
        status: 'REJECTED' as const,
        rejectionReason: action.reason,
      }

      const updatedStages = state.sessionDetail.stages.map((stage) =>
        stage.id === 'quote' ? { ...stage, status: 'BLOCKED' as const } : stage,
      )

      const approvalItem = {
        id: `T-${Date.now()}-rejection`,
        type: 'APPROVAL' as const,
        content: `Quote ${action.quoteId} rejected: ${action.reason}`,
        actorType: 'USER' as const,
        createdAt: rejectedAt,
        quoteId: action.quoteId,
      }

      const assistantMessage = {
        id: `T-${Date.now()}-ack`,
        type: 'ASSISTANT_MESSAGE' as const,
        content: 'Understood — a revised quote can be requested whenever you are ready.',
        actorType: 'ASSISTANT' as const,
        createdAt: rejectedAt,
      }

      return {
        ...state,
        sessionDetail: {
          ...state.sessionDetail,
          updatedAt: rejectedAt,
          quotes: updatedQuotes,
          stages: updatedStages,
          timeline: [...state.sessionDetail.timeline, approvalItem, assistantMessage],
        },
      }
    }

    case 'SESSION_REQUEST_QUOTE_REVISION': {
      const quoteIndex = state.sessionDetail.quotes.findIndex(
        (q) => q.id === action.quoteId && q.status === 'PENDING_APPROVAL',
      )
      if (quoteIndex === -1) return state

      const now = new Date().toISOString()
      const currentQuote = state.sessionDetail.quotes[quoteIndex]
      const newQuoteId = `Q-${100 + currentQuote.version + 1}`
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      const updatedQuotes = [...state.sessionDetail.quotes]
      updatedQuotes[quoteIndex] = { ...currentQuote, status: 'SUPERSEDED' as const }

      const newQuote = {
        id: newQuoteId,
        version: currentQuote.version + 1,
        estimatedStoryPoints: currentQuote.estimatedStoryPoints,
        maxStoryPoints: currentQuote.maxStoryPoints,
        status: 'PENDING_APPROVAL' as const,
        createdAt: now,
        expiresAt,
      }

      const supersededEvent = {
        id: `T-${Date.now()}-superseded`,
        type: 'SYSTEM_EVENT' as const,
        content: `Quote ${action.quoteId} superseded — revised quote ${newQuoteId} prepared`,
        actorType: 'SYSTEM' as const,
        createdAt: now,
      }

      const newQuoteItem = {
        id: `T-${Date.now()}-quote`,
        type: 'QUOTE' as const,
        content: `Quote ${newQuoteId} v${newQuote.version}: ${newQuote.estimatedStoryPoints} story points (max ${newQuote.maxStoryPoints}) for revised scope.`,
        actorType: 'ASSISTANT' as const,
        createdAt: now,
        quoteId: newQuoteId,
      }

      return {
        ...state,
        sessionDetail: {
          ...state.sessionDetail,
          updatedAt: now,
          quotes: [...updatedQuotes, newQuote],
          timeline: [...state.sessionDetail.timeline, supersededEvent, newQuoteItem],
        },
      }
    }

    // Two-phase pending chat flow: the send lands only the user message and
    // flags the assistant reply as pending; a randomized natural response
    // arrives via SESSION_RECEIVE_DETAIL_MESSAGE once the (simulated) wait
    // elapses (the pending bubble cycles the drawn process phases meanwhile).
    case 'SESSION_SEND_DETAIL_MESSAGE': {
      const now = new Date().toISOString()
      const userMessage = {
        id: `T-${Date.now()}-user`,
        type: 'USER_MESSAGE' as const,
        content: action.content,
        actorType: 'USER' as const,
        createdAt: now,
      }

      return {
        ...state,
        sessionDetail: {
          ...state.sessionDetail,
          updatedAt: now,
          pendingAssistant: true,
          pendingPhases: generatePendingPhases().map((phase) => phase.label),
          timeline: [...state.sessionDetail.timeline, userMessage],
        },
      }
    }

    // Main-page composer send: start a fresh session seeded with the prompt
    // as its first user message, already pending its assistant reply (the
    // phase-driven loader plays out in the session detail the composer
    // routes to). Derived from the SESSION_DETAIL fixture so every metadata
    // block the detail page renders still exists; workflow progress resets
    // to a just-started session.
    case 'SESSION_CREATE_FROM_COMPOSER': {
      const now = new Date().toISOString()
      const content = action.content.trim()
      const title =
        content.length > 48 ? `${content.slice(0, 48).trimEnd()}…` : content || 'New session'
      const activeSystem =
        state.systems.find((system) => system.id === state.activeSystemId) ?? state.systems[0]
      const userMessage = {
        id: `T-${Date.now()}-user`,
        type: 'USER_MESSAGE' as const,
        content,
        actorType: 'USER' as const,
        createdAt: now,
      }

      return {
        ...state,
        route: 'session-detail',
        sessionDetail: {
          ...structuredClone(SESSION_DETAIL),
          sessionId: `S-${Date.now()}`,
          title,
          status: 'IN_PROGRESS',
          systemId: activeSystem.id,
          systemName: activeSystem.name,
          createdAt: now,
          updatedAt: now,
          pendingAssistant: true,
          pendingPhases: generatePendingPhases().map((phase) => phase.label),
          currentCycle: 1,
          stages: SESSION_DETAIL.stages.map((stage, index) => ({
            ...stage,
            status: (index === 0 ? 'IN_PROGRESS' : 'NOT_STARTED') as SessionStage['status'],
          })),
          quotes: [],
          delivery: {
            ...SESSION_DETAIL.delivery,
            status: 'NOT_STARTED' as DeliveryInfo['status'],
            deliveredStoryPoints: undefined,
            progressPercentage: undefined,
            summary: undefined,
            knownLimitations: undefined,
            artifacts: [],
          },
          timeline: [userMessage],
        },
      }
    }

    case 'SESSION_RECEIVE_DETAIL_MESSAGE': {
      const now = new Date().toISOString()
      const assistantMessage = {
        id: `T-${Date.now()}-assistant`,
        type: 'ASSISTANT_MESSAGE' as const,
        content: pickAssistantResponse(),
        actorType: 'ASSISTANT' as const,
        createdAt: now,
        meta: generateResponseMeta(),
      }

      return {
        ...state,
        sessionDetail: {
          ...state.sessionDetail,
          updatedAt: now,
          pendingAssistant: false,
          pendingPhases: [],
          timeline: [...state.sessionDetail.timeline, assistantMessage],
        },
      }
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
    case 'workspace-menu':
    case 'system-menu':
    case 'execution-profile-menu':
    case 'component-menu':
    case 'repository-modal':
    case 'manual-repo-modal':
    case 'account-menu':
      return { kind: payload.kind }
    case 'create-system-modal':
      return { kind: 'create-system-modal', source: payload.source ?? 'system-menu' }
    case 'system-map':
      return { kind: 'system-map', systemId: payload.systemId }
  }
}
