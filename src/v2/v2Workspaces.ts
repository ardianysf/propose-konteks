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

/* Membership role of the demo user inside a workspace — surfaces as the
 * OWNER/ADMIN/MEMBER chip on every workspace row. */
export type V2WorkspaceRole = 'owner' | 'admin' | 'member'

export interface V2Workspace {
  id: string
  name: string
  description: string
  plan: string
  systemIds: string[]
  role: V2WorkspaceRole
}

export const V2_WORKSPACES: V2Workspace[] = [
  {
    id: 'ws-refactory',
    name: 'Refactory',
    description: 'Product engineering workspace for the Refactory team',
    plan: 'Team plan',
    systemIds: ['bsi-hris', 'bsi-canteen'],
    role: 'owner',
  },
  {
    id: 'ws-mpm',
    name: 'MPM Digital',
    description: 'Client engagement workspace for MPM Digital',
    plan: 'Team plan',
    systemIds: ['mpm-mytok', 'mpm-portal-vendor'],
    role: 'admin',
  },
  {
    id: 'ws-ardian-labs',
    name: 'Ardian Labs',
    description: 'Personal lab for experiments and side projects',
    plan: 'Free plan',
    systemIds: ['hanoman', 'kookree', 'richapp', 'online-store', 'personal-blogspot'],
    role: 'member',
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
 * createV2Workspace — factory for the create-workspace modal's values.
 * The user-entered ID is used VERBATIM (trimmed) as the workspace id —
 * uniqueness is the modal's validation concern ("This ID is already
 * used"), not the factory's. The creator owns the workspace, so role is
 * always 'owner', and new workspaces start with zero systems.
 */
export const createV2Workspace = (
  id: string,
  displayName: string,
  description: string,
): V2Workspace => ({
  id: id.trim(),
  name: displayName.trim(),
  description: description.trim(),
  plan: 'Starter',
  role: 'owner',
  systemIds: [],
})
