/*
 * v2Workspaces — demo-only workspace selector model for /v2.
 *
 * The shared mock data has exactly ONE workspace constant (Refactory) and
 * the shared reducer has no workspace concept. /v2 demonstrates a real
 * workspace SWITCHER without touching shared files: each v2 workspace is
 * a grouping over the existing shared SYSTEMS. Membership is resolved
 * against state.systems at render time, so ids that do not exist simply
 * drop out.
 */

export interface V2Workspace {
  id: string
  name: string
  plan: string
  systemIds: string[]
}

export const V2_WORKSPACES: V2Workspace[] = [
  {
    id: 'ws-refactory',
    name: 'Refactory',
    plan: 'Team plan',
    systemIds: ['bsi-hris', 'bsi-canteen'],
  },
  {
    id: 'ws-mpm',
    name: 'MPM Digital',
    plan: 'Team plan',
    systemIds: ['mpm-mytok', 'mpm-portal-vendor'],
  },
  {
    id: 'ws-ardian-labs',
    name: 'Ardian Labs',
    plan: 'Free plan',
    systemIds: ['hanoman', 'kookree', 'richapp', 'online-store', 'personal-blogspot'],
  },
]

export const resolveV2Workspace = (workspaceId: string): V2Workspace =>
  V2_WORKSPACES.find((workspace) => workspace.id === workspaceId) ?? V2_WORKSPACES[0]

/*
 * resolveV2WorkspaceIn — list-aware resolution for the sidebar's live
 * workspace state (the static seed plus workspaces created at runtime).
 * Unknown ids keep the exact same fallback semantics as
 * resolveV2Workspace: the first seeded workspace, never undefined.
 */
export const resolveV2WorkspaceIn = (
  workspaces: readonly V2Workspace[],
  workspaceId: string,
): V2Workspace =>
  workspaces.find((workspace) => workspace.id === workspaceId) ?? resolveV2Workspace(workspaceId)

/*
 * createV2Workspace — factory for the popover's add-workspace flow.
 * Id is 'ws-' + slugified name (empty slug falls back to Date.now);
 * a slug collision with an existing id is disambiguated with a
 * timestamp suffix. Empty/blank names fall back to 'New Workspace'.
 */
const slugifyV2WorkspaceName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const createV2Workspace = (
  name: string,
  existing: readonly V2Workspace[],
): V2Workspace => {
  const trimmed = name.trim()
  const base = `ws-${slugifyV2WorkspaceName(trimmed) || Date.now()}`
  const id = existing.some((workspace) => workspace.id === base) ? `${base}-${Date.now()}` : base
  return {
    id,
    name: trimmed || 'New Workspace',
    plan: 'Starter',
    systemIds: [],
  }
}
