/** Illustrative fixtures only. Never populated from the connected production account. */
export const CUSTOMIZE_SECTIONS = [
  'runtimes',
  'access',
  'models',
  'context',
  'skills',
  'tools',
  'mcps',
  'connectors',
  'vcs',
  'operations',
] as const
export type ProductCustomizeSection = (typeof CUSTOMIZE_SECTIONS)[number]
export const SETTINGS_SECTIONS = [
  'general',
  'plan',
  'usage',
  'budgets',
  'payments',
] as const
export type ProductSettingsSection = (typeof SETTINGS_SECTIONS)[number]
export type ProductRoute =
  | 'activities'
  | 'work'
  | 'work-detail'
  | 'issues'
  | 'releases'
  | 'leaderboard'
  | 'customize-page'
  | 'settings-page'
  | 'profile'
  | 'runtime'
  | 'systems'
  | 'work-locally'
  | 'support'
export const PRODUCT_ROUTES: readonly ProductRoute[] = [
  'activities',
  'work',
  'work-detail',
  'issues',
  'releases',
  'leaderboard',
  'customize-page',
  'settings-page',
  'profile',
  'runtime',
  'systems',
  'work-locally',
  'support',
]
export const SECTION_LABELS: Record<
  ProductCustomizeSection | ProductSettingsSection,
  string
> = {
  runtimes: 'Runtimes',
  access: 'Access',
  models: 'Models',
  context: 'Context',
  skills: 'Skills',
  tools: 'Tools',
  mcps: 'MCPs',
  connectors: 'Connectors',
  vcs: 'VCS Connectors',
  operations: 'Operations',
  general: 'General',
  plan: 'Plan',
  usage: 'Usage',
  budgets: 'Budgets',
  payments: 'Payments',
}
export const WORKLOADS = [
  'Planning',
  'Implementation & correction',
  'Assistant & Search',
  'Validation, QA & preview',
  'Operations',
  'Catalog onboarding',
] as const
export interface ProductNote {
  id: string
  body: string
  attachment?: string
  reactions: string[]
  comments: string[]
}
export interface Initiative {
  id: string
  title: string
  systemId: string
  owner: string
  status: 'Planning' | 'In progress' | 'Needs attention'
  update: string
  notes: ProductNote[]
}
export interface Runtime {
  id: string
  name: string
  platform: 'macOS' | 'Linux' | 'Windows'
  status: 'Ready' | 'Not connected' | 'Draining' | 'Revoked'
  workloads: string[]
  previews: boolean
  owner: 'Personal' | 'Organization'
}
export interface Channel {
  id: string
  provider: string
  name: string
  enabled: boolean
}
export interface Credential {
  id: string
  name: string
  status: 'Active' | 'Revoked'
  expiry: string
}
export interface ProductState {
  selectedId: string
  returnRoute: ProductRoute
  customizeSection: ProductCustomizeSection
  settingsSection: ProductSettingsSection
  systemFilter: string
  initiatives: Initiative[]
  runtimes: Runtime[]
  channels: Channel[]
  credentials: Credential[]
  workspaceName: string
  runtimePolicy: string
  signedOut: boolean
}
export function initialProductState(): ProductState {
  return {
    selectedId: '',
    returnRoute: 'work',
    customizeSection: 'runtimes',
    settingsSection: 'general',
    systemFilter: 'all',
    workspaceName: 'Refactory',
    runtimePolicy: 'automatic',
    signedOut: false,
    initiatives: [
      {
        id: 'initiative-1',
        title: 'Improve the checkout experience',
        systemId: 'bsi-hris',
        owner: 'Alex Morgan',
        status: 'Planning',
        update: 'A revised plan is ready for your review.',
        notes: [
          {
            id: 'note-1',
            body: 'Make checkout easier to use on smaller screens. Keep order totals visible and preserve keyboard navigation throughout the flow.',
            reactions: [],
            comments: [],
          },
        ],
      },
      {
        id: 'initiative-2',
        title: 'Refresh repository documentation',
        systemId: 'bsi-hris',
        owner: 'Jordan Lee',
        status: 'In progress',
        update: 'Implementation is underway.',
        notes: [
          {
            id: 'note-2',
            body: 'Document local setup, contribution guidelines, and the release process with examples that developers can run.',
            reactions: [],
            comments: [],
          },
        ],
      },
      {
        id: 'initiative-3',
        title: 'Review component accessibility',
        systemId: 'mpm-mytok',
        owner: 'Taylor Chen',
        status: 'Needs attention',
        update: 'The planning session stopped. Add a note to try again.',
        notes: [
          {
            id: 'note-3',
            body: 'Check the shared dialogs for focus return, contrast, and keyboard support.',
            reactions: [],
            comments: [],
          },
        ],
      },
    ],
    runtimes: [
      {
        id: 'runtime-mac',
        name: 'Studio Mac',
        platform: 'macOS',
        status: 'Ready',
        workloads: WORKLOADS.filter((w) => w !== 'Operations'),
        previews: true,
        owner: 'Personal',
      },
      {
        id: 'runtime-linux',
        name: 'Build Linux',
        platform: 'Linux',
        status: 'Ready',
        workloads: [...WORKLOADS],
        previews: true,
        owner: 'Organization',
      },
      {
        id: 'runtime-windows',
        name: 'QA Windows',
        platform: 'Windows',
        status: 'Not connected',
        workloads: ['Validation, QA & preview'],
        previews: false,
        owner: 'Personal',
      },
    ],
    channels: [],
    credentials: [
      {
        id: 'credential-demo',
        name: 'Local agent',
        status: 'Active',
        expiry: '90 days',
      },
    ],
  }
}
export type ProductAction =
  | { kind: 'session'; signedOut: boolean }
  | { kind: 'filter'; systemId: string }
  | {
      kind: 'create-initiative'
      title: string
      systemId: string
      attachment?: string
    }
  | {
      kind: 'post-note'
      initiativeId: string
      body: string
      attachment?: string
    }
  | { kind: 'react'; initiativeId: string; noteId: string; reaction: string }
  | { kind: 'comment'; initiativeId: string; noteId: string; body: string }
  | {
      kind: 'create-runtime'
      name: string
      platform: Runtime['platform']
      workloads: string[]
    }
  | {
      kind: 'update-runtime'
      id: string
      changes: Partial<Omit<Runtime, 'id'>>
    }
  | { kind: 'runtime-policy'; id: string }
  | { kind: 'workspace-name'; name: string }
  | { kind: 'create-channel'; name: string; provider: string }
  | { kind: 'toggle-channel'; id: string }
  | { kind: 'create-credential'; expiry: string }
  | { kind: 'credential-status'; id: string; status: Credential['status'] }

const nextId = (prefix: string, existing: readonly { id: string }[]) => {
  let number = existing.length + 1
  while (existing.some((x) => x.id === `${prefix}-${number}`)) number++
  return `${prefix}-${number}`
}
export function productReducer(
  state: ProductState,
  action: ProductAction,
): ProductState {
  switch (action.kind) {
    case 'session':
      return { ...state, signedOut: action.signedOut }
    case 'filter':
      return { ...state, systemFilter: action.systemId }
    case 'create-initiative': {
      if (!action.title.trim() || !action.systemId) return state
      const id = nextId('initiative', state.initiatives)
      return {
        ...state,
        selectedId: id,
        returnRoute: 'work',
        initiatives: [
          {
            id,
            title: action.title.trim(),
            systemId: action.systemId,
            owner: 'Refactory Admin',
            status: 'Planning',
            update: 'A planning session is ready to read your notes.',
            notes: [
              {
                id: `${id}-note-1`,
                body: action.title.trim(),
                attachment: action.attachment,
                reactions: [],
                comments: [],
              },
            ],
          },
          ...state.initiatives,
        ],
      }
    }
    case 'post-note':
      if (!action.body.trim()) return state
      return {
        ...state,
        initiatives: state.initiatives.map((i) =>
          i.id === action.initiativeId
            ? {
                ...i,
                update: 'A new note was added to the plan.',
                notes: [
                  ...i.notes,
                  {
                    id: nextId('note', i.notes),
                    body: action.body.trim(),
                    attachment: action.attachment,
                    reactions: [],
                    comments: [],
                  },
                ],
              }
            : i,
        ),
      }
    case 'react':
      return {
        ...state,
        initiatives: state.initiatives.map((i) =>
          i.id === action.initiativeId
            ? {
                ...i,
                notes: i.notes.map((n) =>
                  n.id === action.noteId
                    ? {
                        ...n,
                        reactions: n.reactions.includes(action.reaction)
                          ? n.reactions.filter((r) => r !== action.reaction)
                          : [...n.reactions, action.reaction],
                      }
                    : n,
                ),
              }
            : i,
        ),
      }
    case 'comment':
      if (!action.body.trim()) return state
      return {
        ...state,
        initiatives: state.initiatives.map((i) =>
          i.id === action.initiativeId
            ? {
                ...i,
                notes: i.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, comments: [...n.comments, action.body.trim()] }
                    : n,
                ),
              }
            : i,
        ),
      }
    case 'create-runtime': {
      if (!action.name.trim() || action.workloads.length === 0) return state
      const id = nextId('runtime', state.runtimes)
      return {
        ...state,
        selectedId: id,
        runtimes: [
          ...state.runtimes,
          {
            id,
            name: action.name.trim(),
            platform: action.platform,
            workloads: [...action.workloads],
            status: 'Not connected',
            previews: false,
            owner: 'Personal',
          },
        ],
      }
    }
    case 'update-runtime':
      return {
        ...state,
        runtimes: state.runtimes.map((r) =>
          r.id === action.id ? { ...r, ...action.changes } : r,
        ),
      }
    case 'runtime-policy':
      return { ...state, runtimePolicy: action.id }
    case 'workspace-name':
      return action.name.trim()
        ? { ...state, workspaceName: action.name.trim() }
        : state
    case 'create-channel':
      return action.name.trim()
        ? {
            ...state,
            channels: [
              ...state.channels,
              {
                id: nextId('channel', state.channels),
                name: action.name.trim(),
                provider: action.provider,
                enabled: true,
              },
            ],
          }
        : state
    case 'toggle-channel':
      return {
        ...state,
        channels: state.channels.map((c) =>
          c.id === action.id ? { ...c, enabled: !c.enabled } : c,
        ),
      }
    case 'create-credential':
      return {
        ...state,
        credentials: [
          ...state.credentials,
          {
            id: nextId('credential', state.credentials),
            name: 'Local agent',
            status: 'Active',
            expiry: action.expiry,
          },
        ],
      }
    case 'credential-status':
      return {
        ...state,
        credentials: state.credentials.map((c) =>
          c.id === action.id ? { ...c, status: action.status } : c,
        ),
      }
  }
}
