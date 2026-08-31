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
