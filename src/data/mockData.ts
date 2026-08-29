// ILLUSTRATIVE DATA — all names/counts/timestamps are placeholders, not production facts (spec AC46)

export const ILLUSTRATIVE_DATA_NOTE = 'Illustrative data'

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type SessionMode = 'engineering' | 'qa' | 'planning'
export type Readiness = 'ready' | 'needs-setup'

// Session Detail types
export type SessionDetailStatus =
  | 'IN_PROGRESS'
  | 'WAITING_APPROVAL'
  | 'APPROVED'
  | 'DELIVERING'
  | 'PARTIALLY_COMPLETED'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'CANCELLED'

/** All session detail statuses, in union order — the runtime twin of the
 * SessionDetailStatus type (catalog fixtures iterate it for variants). */
export const SESSION_DETAIL_STATUSES: readonly SessionDetailStatus[] = [
  'IN_PROGRESS',
  'WAITING_APPROVAL',
  'APPROVED',
  'DELIVERING',
  'PARTIALLY_COMPLETED',
  'COMPLETED',
  'BLOCKED',
  'CANCELLED',
]

export type DetailStageId = 'ideation' | 'quote' | 'plan' | 'delivery' | 'receipt' | 'lessons'

export type StageStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'SKIPPED' | 'FAILED'

export type DetailTimelineType =
  | 'USER_MESSAGE'
  | 'ASSISTANT_MESSAGE'
  | 'SYSTEM_EVENT'
  | 'QUOTE'
  | 'APPROVAL'
  | 'DELIVERY'
  | 'ERROR'
  | 'ARTIFACT'

export interface SessionQuote {
  id: string
  version: number
  estimatedStoryPoints: number
  maxStoryPoints?: number
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED'
  createdAt: string
  expiresAt?: string
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
}

export interface SessionArtifact {
  type: 'PR' | 'COMMIT' | 'DOCUMENT' | 'TEST_REPORT' | 'RECEIPT' | 'LINK'
  label: string
  url: string
}

export interface DeliveryInfo {
  id: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PARTIALLY_COMPLETE' | 'COMPLETED' | 'FAILED'
  deliveredStoryPoints?: number
  progressPercentage?: number
  summary?: string
  knownLimitations?: string
  artifacts: SessionArtifact[]
}

export interface DetailTimelineItem {
  id: string
  type: DetailTimelineType
  content: string
  actorType: 'USER' | 'ASSISTANT' | 'SYSTEM'
  createdAt: string
  quoteId?: string
  deliveryId?: string
  artifact?: SessionArtifact
}

export interface SessionStage {
  id: DetailStageId
  label: string
  status: StageStatus
}

export interface SessionDetailData {
  sessionId: string
  title: string
  status: SessionDetailStatus
  // Session context metadata stored on the detail record itself (option B):
  // the session's mode, owning system, and target component travel with
  // sessionDetail instead of being read from transient current selection.
  mode: SessionMode
  systemId: string
  systemName: string
  componentName: string
  repository: string
  branch: string
  issueRef: string
  agent: string
  createdBy: string
  createdAt: string
  updatedAt: string
  /** True while the assistant reply is pending after a send (two-phase chat flow). */
  pendingAssistant: boolean
  currentCycle: number
  totalCycles: number
  stages: SessionStage[]
  quotes: SessionQuote[]
  delivery: DeliveryInfo
  timeline: DetailTimelineItem[]
}

export interface VcsConnector {
  id: string
  name: string
  hint: string
}

export interface Workspace {
  name: string
  plan: string
}

export interface System {
  id: string
  name: string
  description?: string
  repoIds: string[]
}

export interface Repository {
  id: string
  name: string
  systemId: string
  vcs: string
  updatedAt: string
}

export interface ExecutionProfile {
  id: string
  name: string
  plannerModel: string
  executorModel: string
  authorization: string
  readiness: Readiness
}

export interface WorkspaceSetting {
  id: string
  name: string
  description: string
  enabled: boolean
}

export interface ComponentEntry {
  id: string
  name: string
  /** C4 level 3 — the container this component lives in. */
  containerId: string
  /** C4 level 4 — code elements: the repositories implementing this
   * component. Many-to-many: one repo may host several components and
   * one component may span multiple repos. */
  repoIds: string[]
}

/** C4 level 2 — a container (web app, API, mobile app, CLI…) inside a
 * software system. */
export interface Container {
  id: string
  name: string
  systemId: string
  tech?: string
  description?: string
}

export interface RecentSession {
  id: string
  title: string
  systemId: string
  time: string
  timestamp: string
}

export interface SessionHistoryEntry {
  id: string
  title: string
  mode: SessionMode
  systemId: string
  componentName: string
  time: string
  timestamp: string
}

export interface PendingReview {
  id: string
  title: string
  systemId: string
  summary: string
  time: string
}

export interface AuditEvent {
  id: string
  time: string
  timestamp: string
  actor: string
  action: string
}

export interface AccountAction {
  id: string
  label: string
}

export type SettingsSectionId = 'general' | 'billing' | 'team'

export interface SettingsSectionDef {
  id: SettingsSectionId
  label: string
  subTabs: string[]
}

export interface PreservedItem {
  id: string
  name: string
  description: string
  enabled: boolean
  scope: string
}

// ---------------------------------------------------------------------------
// Workspace + systems + repositories
// ---------------------------------------------------------------------------

export const WORKSPACE: Workspace = {
  name: 'Refactory',
  plan: 'Team plan (illustrative)',
}

export const SYSTEMS: System[] = [
  {
    id: 'bsi-hris',
    name: 'BSI - HRIS',
    description: 'HRIS frontend services and shared libraries',
    repoIds: ['bsi/hris-frontend-shared', 'bsi/hris-frontend-promotion', 'bsi/hris-frontend-pref-eval'],
  },
  {
    id: 'bsi-canteen',
    name: 'BSI Canteen',
    description: 'Canteen ordering backend and CMS',
    repoIds: ['bsi/canteen-backend', 'bsi/canteen-cms'],
  },
  {
    id: 'mpm-mytok',
    name: 'MPM - Mytok',
    description: 'Mytok mobile application',
    repoIds: ['mpm/mytok'],
  },
  {
    id: 'mpm-portal-vendor',
    name: 'MPM - Portal Vendor',
    description: 'Vendor portal services',
    repoIds: ['mpm/portal-vendor'],
  },
  {
    id: 'hanoman',
    name: 'Hanoman',
    description: 'Internal automation tooling',
    repoIds: ['hanoman/api', 'hanoman/web'],
  },
  {
    id: 'kookree',
    name: 'Kookree',
    description: 'Agent runner experiments',
    repoIds: ['kookree/agent-runner'],
  },
  {
    id: 'richapp',
    name: 'Richapp',
    description: 'Richapp product frontend and backend',
    repoIds: ['richapp/fe-richapp', 'richapp/be-richapp'],
  },
  {
    id: 'online-store',
    name: 'Online Store',
    description: 'Storefront and checkout services',
    repoIds: ['online-store/storefront', 'online-store/checkout-api'],
  },
  {
    id: 'personal-blogspot',
    name: 'Personal Blogspot',
    description: 'Personal writing archive',
    repoIds: ['personal/blogspot-theme'],
  },
]

export const REPOSITORIES: Repository[] = [
  { id: 'bsi/hris-frontend-shared', name: 'bsi/hris-frontend-shared', systemId: 'bsi-hris', vcs: 'GitHub', updatedAt: '2026-08-15' },
  { id: 'bsi/hris-frontend-promotion', name: 'bsi/hris-frontend-promotion', systemId: 'bsi-hris', vcs: 'GitHub', updatedAt: '2026-08-14' },
  { id: 'bsi/hris-frontend-pref-eval', name: 'bsi/hris-frontend-pref-eval', systemId: 'bsi-hris', vcs: 'GitHub', updatedAt: '2026-08-12' },
  { id: 'bsi/canteen-backend', name: 'bsi/canteen-backend', systemId: 'bsi-canteen', vcs: 'GitHub', updatedAt: '2026-08-15' },
  { id: 'bsi/canteen-cms', name: 'bsi/canteen-cms', systemId: 'bsi-canteen', vcs: 'GitLab', updatedAt: '2026-08-11' },
  { id: 'mpm/mytok', name: 'mpm/mytok', systemId: 'mpm-mytok', vcs: 'GitHub', updatedAt: '2026-08-15' },
  { id: 'mpm/portal-vendor', name: 'mpm/portal-vendor', systemId: 'mpm-portal-vendor', vcs: 'Bitbucket', updatedAt: '2026-08-13' },
  { id: 'hanoman/api', name: 'hanoman/api', systemId: 'hanoman', vcs: 'GitHub', updatedAt: '2026-08-10' },
  { id: 'hanoman/web', name: 'hanoman/web', systemId: 'hanoman', vcs: 'GitHub', updatedAt: '2026-08-09' },
  { id: 'kookree/agent-runner', name: 'kookree/agent-runner', systemId: 'kookree', vcs: 'GitHub', updatedAt: '2026-08-08' },
  { id: 'richapp/fe-richapp', name: 'richapp/fe-richapp', systemId: 'richapp', vcs: 'GitHub', updatedAt: '2026-08-15' },
  { id: 'richapp/be-richapp', name: 'richapp/be-richapp', systemId: 'richapp', vcs: 'GitHub', updatedAt: '2026-08-14' },
  { id: 'online-store/storefront', name: 'online-store/storefront', systemId: 'online-store', vcs: 'GitHub', updatedAt: '2026-08-13' },
  { id: 'online-store/checkout-api', name: 'online-store/checkout-api', systemId: 'online-store', vcs: 'GitLab', updatedAt: '2026-08-12' },
  { id: 'personal/blogspot-theme', name: 'personal/blogspot-theme', systemId: 'personal-blogspot', vcs: 'GitHub', updatedAt: '2026-08-05' },
]

// VCS connectors offered by the manual repository form (spec §8.2, AC29) —
// names are illustrative placeholders like everything else here (AC46).
export const VCS_CONNECTORS: VcsConnector[] = [
  { id: 'github', name: 'GitHub', hint: 'github.com and GitHub Enterprise' },
  { id: 'gitlab', name: 'GitLab', hint: 'gitlab.com and self-hosted GitLab' },
  { id: 'bitbucket', name: 'Bitbucket', hint: 'Bitbucket Cloud' },
  { id: 'gitea', name: 'Gitea', hint: 'Self-hosted Gitea' },
]

// ---------------------------------------------------------------------------
// Execution profiles + workspace-level Assistant/Search entries
// ---------------------------------------------------------------------------

export const EXECUTION_PROFILES: ExecutionProfile[] = [
  {
    id: 'profile-default',
    name: 'Default',
    plannerModel: 'GPT-4o mini',
    executorModel: 'GPT-4o mini',
    authorization: 'Workspace default access',
    readiness: 'ready',
  },
  {
    id: 'profile-commerce-platform',
    name: 'Commerce Platform',
    plannerModel: 'Claude Sonnet 4.5',
    executorModel: 'Claude Haiku 4.5',
    authorization: 'Commerce GitHub organization',
    readiness: 'ready',
  },
  {
    id: 'profile-core-banking',
    name: 'Core Banking',
    plannerModel: 'GPT-4.1',
    executorModel: 'GPT-4.1 mini',
    authorization: 'Requires BSI private network',
    readiness: 'needs-setup',
  },
  {
    id: 'profile-merchant-portal',
    name: 'Merchant Portal',
    plannerModel: 'Claude Sonnet 4.5',
    executorModel: 'GPT-4o mini',
    authorization: 'MPM SSO group',
    readiness: 'ready',
  },
  {
    id: 'profile-refactory-admin',
    name: 'Refactory Admin',
    plannerModel: 'GPT-4o',
    executorModel: 'GPT-4o',
    authorization: 'Admin allowlist',
    readiness: 'needs-setup',
  },
]

export const WORKSPACE_SETTINGS: WorkspaceSetting[] = [
  {
    id: 'workspace-assistant',
    name: 'Assistant',
    description: 'Workspace-wide assistant replies and tone',
    enabled: true,
  },
  {
    id: 'workspace-search',
    name: 'Search',
    description: 'Workspace search across systems and repositories',
    enabled: true,
  },
]

// ---------------------------------------------------------------------------
// Components (name + owning repository)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// C4 level 2 — containers (one or more per system)
// ---------------------------------------------------------------------------

export const CONTAINERS: Container[] = [
  { id: 'cont-hris-web', name: 'HRIS Web App', systemId: 'bsi-hris', tech: 'React SPA', description: 'Employee-facing web application' },
  { id: 'cont-hris-api', name: 'HRIS API', systemId: 'bsi-hris', tech: 'Node.js', description: 'Backend API for HRIS data' },
  { id: 'cont-canteen-api', name: 'Canteen API', systemId: 'bsi-canteen', tech: 'Go', description: 'Ordering backend service' },
  { id: 'cont-canteen-cms', name: 'Canteen CMS', systemId: 'bsi-canteen', tech: 'Next.js', description: 'Menu content management' },
  { id: 'cont-mytok-mobile', name: 'Mytok Mobile App', systemId: 'mpm-mytok', tech: 'Flutter', description: 'Customer mobile application' },
  { id: 'cont-portal-api', name: 'Portal Vendor API', systemId: 'mpm-portal-vendor', tech: 'Node.js', description: 'Vendor portal service' },
  { id: 'cont-hanoman-api', name: 'Hanoman API', systemId: 'hanoman', tech: 'Python', description: 'Automation orchestration API' },
  { id: 'cont-agent-runner', name: 'Agent Runner CLI', systemId: 'kookree', tech: 'TypeScript', description: 'Local agent execution runtime' },
  { id: 'cont-richapp-web', name: 'Richapp Web', systemId: 'richapp', tech: 'React SPA', description: 'Product web frontend' },
  { id: 'cont-richapp-svc', name: 'Richapp Service', systemId: 'richapp', tech: 'Java', description: 'Product backend service' },
  { id: 'cont-store-web', name: 'Storefront Web', systemId: 'online-store', tech: 'Next.js', description: 'Customer storefront' },
  { id: 'cont-checkout', name: 'Checkout Service', systemId: 'online-store', tech: 'Go', description: 'Payment and checkout processing' },
]

export const COMPONENTS: ComponentEntry[] = [
  // hris-web spans two repos: one component implemented across repositories.
  { id: 'comp-hris-web', name: 'hris-web', containerId: 'cont-hris-web', repoIds: ['bsi/hris-frontend-shared', 'bsi/hris-frontend-promotion'] },
  { id: 'comp-hris-promotion', name: 'hris-promotion', containerId: 'cont-hris-web', repoIds: ['bsi/hris-frontend-promotion'] },
  { id: 'comp-pref-eval', name: 'pref-eval', containerId: 'cont-hris-api', repoIds: ['bsi/hris-frontend-pref-eval'] },
  { id: 'comp-canteen-api', name: 'canteen-api', containerId: 'cont-canteen-api', repoIds: ['bsi/canteen-backend'] },
  { id: 'comp-canteen-cms', name: 'canteen-cms', containerId: 'cont-canteen-cms', repoIds: ['bsi/canteen-cms'] },
  { id: 'comp-mytok-mobile', name: 'mytok-mobile', containerId: 'cont-mytok-mobile', repoIds: ['mpm/mytok'] },
  { id: 'comp-portal-vendor-api', name: 'portal-vendor-api', containerId: 'cont-portal-api', repoIds: ['mpm/portal-vendor'] },
  { id: 'comp-hanoman-api', name: 'hanoman-api', containerId: 'cont-hanoman-api', repoIds: ['hanoman/api'] },
  { id: 'comp-agent-runner', name: 'agent-runner', containerId: 'cont-agent-runner', repoIds: ['kookree/agent-runner'] },
  { id: 'comp-richapp-fe', name: 'richapp-fe', containerId: 'cont-richapp-web', repoIds: ['richapp/fe-richapp'] },
  { id: 'comp-richapp-be', name: 'richapp-be', containerId: 'cont-richapp-svc', repoIds: ['richapp/be-richapp'] },
  { id: 'comp-storefront', name: 'storefront', containerId: 'cont-store-web', repoIds: ['online-store/storefront'] },
  { id: 'comp-checkout-api', name: 'checkout-api', containerId: 'cont-checkout', repoIds: ['online-store/checkout-api'] },
]

// ---------------------------------------------------------------------------
// Sessions — recent (sidebar) and full history, newest first
// ---------------------------------------------------------------------------

export const RECENT_SESSIONS: RecentSession[] = [
  {
    id: 'recent-edp-mobile',
    title: 'EDP Integration Fix - Mobile',
    systemId: 'bsi-hris',
    time: '2h ago',
    timestamp: '2026-08-16T08:00:00Z',
  },
  {
    id: 'recent-attendance',
    title: 'Review attendance integration',
    systemId: 'bsi-hris',
    time: '5h ago',
    timestamp: '2026-08-16T05:00:00Z',
  },
  {
    id: 'recent-sprint-proposal',
    title: 'Prepare sprint proposal',
    systemId: 'mpm-mytok',
    time: 'Yesterday · 16:20',
    timestamp: '2026-08-15T16:20:00Z',
  },
  {
    id: 'recent-frontend-deps',
    title: 'Map frontend dependencies',
    systemId: 'richapp',
    time: 'Yesterday · 10:05',
    timestamp: '2026-08-15T10:05:00Z',
  },
  {
    id: 'recent-delivery-evidence',
    title: 'Validate delivery evidence',
    systemId: 'online-store',
    time: 'Aug 14 · 14:32',
    timestamp: '2026-08-14T14:32:00Z',
  },
]

export const SESSION_HISTORY: SessionHistoryEntry[] = [
  {
    id: 'hist-edp-mobile',
    title: 'EDP Integration Fix - Mobile',
    mode: 'engineering',
    systemId: 'bsi-hris',
    componentName: 'hris-web',
    time: '2h ago',
    timestamp: '2026-08-16T08:00:00Z',
  },
  {
    id: 'hist-attendance',
    title: 'Review attendance integration',
    mode: 'engineering',
    systemId: 'bsi-hris',
    componentName: 'hris-web',
    time: '5h ago',
    timestamp: '2026-08-16T05:00:00Z',
  },
  {
    id: 'hist-sprint-proposal',
    title: 'Prepare sprint proposal',
    mode: 'planning',
    systemId: 'mpm-mytok',
    componentName: 'mytok-mobile',
    time: 'Yesterday · 16:20',
    timestamp: '2026-08-15T16:20:00Z',
  },
  {
    id: 'hist-frontend-deps',
    title: 'Map frontend dependencies',
    mode: 'engineering',
    systemId: 'richapp',
    componentName: 'richapp-fe',
    time: 'Yesterday · 10:05',
    timestamp: '2026-08-15T10:05:00Z',
  },
  {
    id: 'hist-delivery-evidence',
    title: 'Validate delivery evidence',
    mode: 'qa',
    systemId: 'online-store',
    componentName: 'checkout-api',
    time: 'Aug 14 · 14:32',
    timestamp: '2026-08-14T14:32:00Z',
  },
  {
    id: 'hist-canteen-audit',
    title: 'Draft canteen CMS audit',
    mode: 'planning',
    systemId: 'bsi-canteen',
    componentName: 'canteen-cms',
    time: 'Aug 13 · 11:48',
    timestamp: '2026-08-13T11:48:00Z',
  },
  {
    id: 'hist-vendor-auth',
    title: 'Harden vendor portal auth',
    mode: 'engineering',
    systemId: 'mpm-portal-vendor',
    componentName: 'portal-vendor-api',
    time: 'Aug 12 · 17:05',
    timestamp: '2026-08-12T17:05:00Z',
  },
  {
    id: 'hist-incident-timeline',
    title: 'Summarize incident timeline',
    mode: 'planning',
    systemId: 'hanoman',
    componentName: 'hanoman-api',
    time: 'Aug 12 · 09:15',
    timestamp: '2026-08-12T09:15:00Z',
  },
  {
    id: 'hist-agent-runner-docs',
    title: 'Scaffold agent runner docs',
    mode: 'engineering',
    systemId: 'kookree',
    componentName: 'agent-runner',
    time: 'Aug 11 · 13:26',
    timestamp: '2026-08-11T13:26:00Z',
  },
]

// ---------------------------------------------------------------------------
// Konteks Learned — pending reviews + flat audit timeline
// ---------------------------------------------------------------------------

export const PENDING_REVIEWS: PendingReview[] = [
  {
    id: 'review-attendance-mapper',
    title: 'Attendance mapper override',
    systemId: 'bsi-hris',
    summary: 'Assistant proposes mapping weekend shifts to EDP code W-2.',
    time: '1h ago',
  },
  {
    id: 'review-canteen-tax',
    title: 'Canteen tax rounding rule',
    systemId: 'bsi-canteen',
    summary: 'Learned rule rounds tax down on bundled menus; needs confirmation.',
    time: '4h ago',
  },
  {
    id: 'review-vendor-checklist',
    title: 'Vendor onboarding checklist',
    systemId: 'mpm-portal-vendor',
    summary: 'Suggested checklist auto-adds a compliance step for new vendors.',
    time: 'Yesterday',
  },
]

export const AUDIT_HISTORY: AuditEvent[] = [
  {
    id: 'audit-pref-eval',
    time: 'Aug 16 · 09:12',
    timestamp: '2026-08-16T09:12:00Z',
    actor: 'Ardian',
    action: 'Approved learned rule "pref-eval weighting"',
  },
  {
    id: 'audit-canteen-rename',
    time: 'Aug 15 · 16:44',
    timestamp: '2026-08-15T16:44:00Z',
    actor: 'Ardian',
    action: 'Rejected proposed component rename for canteen-cms',
  },
  {
    id: 'audit-attendance-queue',
    time: 'Aug 15 · 11:02',
    timestamp: '2026-08-15T11:02:00Z',
    actor: 'Assistant',
    action: 'Queued review: attendance mapper override',
  },
  {
    id: 'audit-online-store',
    time: 'Aug 14 · 18:30',
    timestamp: '2026-08-14T18:30:00Z',
    actor: 'Ardian',
    action: 'Created system "Online Store"',
  },
  {
    id: 'audit-delivery-archive',
    time: 'Aug 14 · 14:31',
    timestamp: '2026-08-14T14:31:00Z',
    actor: 'Assistant',
    action: 'Archived session "Validate delivery evidence"',
  },
]

// ---------------------------------------------------------------------------
// Account menu + Settings structure
// ---------------------------------------------------------------------------

export const ACCOUNT_ACTIONS: AccountAction[] = [
  { id: 'account-settings', label: 'Settings' },
  { id: 'account-billing', label: 'Billing' },
  { id: 'account-integrations', label: 'Integrations' },
  { id: 'account-shortcuts', label: 'Keyboard shortcuts' },
  { id: 'account-logout', label: 'Log out' },
]

export const SETTINGS_SECTIONS: SettingsSectionDef[] = [
  { id: 'general', label: 'General', subTabs: [] },
  {
    id: 'billing',
    label: 'Billing',
    subTabs: ['Usage', 'Plans', 'Providers', 'Budgets', 'Top Up', 'Transactions'],
  },
  { id: 'team', label: 'Team', subTabs: [] },
]

// ---------------------------------------------------------------------------
// Preserved Skills/Tools content — structure preserved from the current
// product; every entry below is an illustrative placeholder (spec AC46),
// exposed as structured data for the Customize Skills/Tools tabs (Task 9).
// ---------------------------------------------------------------------------

export const PRESERVED_SKILLS: PreservedItem[] = [
  {
    id: 'skill-jira-issues',
    name: 'Create Jira issues',
    description: 'Draft and file issues in the workspace tracker',
    enabled: true,
    scope: 'Workspace',
  },
  {
    id: 'skill-release-notes',
    name: 'Draft release notes',
    description: 'Summarize merged changes into a release-notes draft',
    enabled: true,
    scope: 'Workspace',
  },
  {
    id: 'skill-incident-summary',
    name: 'Summarize incident reports',
    description: 'Condense incident threads into a timeline summary',
    enabled: false,
    scope: 'System: BSI - HRIS',
  },
]

export const PRESERVED_TOOLS: PreservedItem[] = [
  {
    id: 'tool-github-pr',
    name: 'GitHub PR review',
    description: 'Open diffs and leave review comments on pull requests',
    enabled: true,
    scope: 'Workspace',
  },
  {
    id: 'tool-slack-notify',
    name: 'Slack notifier',
    description: 'Post session summaries to a channel',
    enabled: true,
    scope: 'Workspace',
  },
  {
    id: 'tool-sentry-lookup',
    name: 'Sentry lookup',
    description: 'Fetch the latest error events for a component',
    enabled: false,
    scope: 'System: Online Store',
  },
]

// ---------------------------------------------------------------------------
// Customize tab content — illustrative entries for the Agents / Context /
// integration tabs (Task 9 Part B, spec §11, AC36/AC37). Every value is
// an illustrative placeholder exactly like the rest of this file (AC46).
// ---------------------------------------------------------------------------

/** AI roles the agent runtime assigns (Agents tab, AC36). */
export interface AgentRoleEntry {
  id: string
  role: string
  description: string
  currentModel: string
}

export const AGENT_ROLES: AgentRoleEntry[] = [
  {
    id: 'role-planner',
    role: 'Planner',
    description: 'Breaks a request into ordered execution steps',
    currentModel: 'GPT-4o mini on Default',
  },
  {
    id: 'role-executor',
    role: 'Executor',
    description: 'Runs each step against the selected repositories',
    currentModel: 'Claude Haiku 4.5 on Commerce Platform',
  },
  {
    id: 'role-reviewer',
    role: 'Reviewer',
    description: 'Summarizes changes for Konteks Learned reviews',
    currentModel: 'GPT-4.1 mini on Core Banking',
  },
]

/** Model providers available to agent roles (Agents tab, AC36). */
export interface ProviderEntry {
  id: string
  name: string
  models: string
  status: 'connected' | 'needs-setup'
}

export const AI_PROVIDERS: ProviderEntry[] = [
  { id: 'provider-openai', name: 'OpenAI', models: 'GPT-4o, GPT-4.1, GPT-4o mini', status: 'connected' },
  { id: 'provider-anthropic', name: 'Anthropic', models: 'Claude Sonnet 4.5, Claude Haiku 4.5', status: 'connected' },
  { id: 'provider-azure', name: 'Azure OpenAI', models: 'Not configured', status: 'needs-setup' },
]

/** Archived agents kept for reference (Agents tab, AC36). */
export interface ArchivedAgentEntry {
  id: string
  name: string
  archivedOn: string
}

export const ARCHIVED_AGENTS: ArchivedAgentEntry[] = [
  { id: 'agent-hris-promotion-reviewer', name: 'hris-promotion-reviewer', archivedOn: 'Aug 12, 2026' },
  { id: 'agent-canteen-audit-writer', name: 'canteen-audit-writer', archivedOn: 'Aug 9, 2026' },
]

/** Context files surfaced to sessions (Context tab, AC37). */
export interface ContextFileEntry {
  id: string
  path: string
  note: string
}

export const CONTEXT_FILES: ContextFileEntry[] = [
  { id: 'file-agents-md', path: 'AGENTS.md', note: 'Workspace agent instructions' },
  { id: 'file-architecture', path: 'docs/architecture.md', note: 'System architecture notes' },
  { id: 'file-konteks-context', path: '.konteks/context.md', note: 'Session context overrides' },
]

/** Configured MCP servers (Integrations → MCP, AC37). */
export interface McpServerEntry {
  id: string
  name: string
  transport: string
  status: 'connected' | 'needs-setup'
}

export const MCP_SERVERS: McpServerEntry[] = [
  { id: 'mcp-context7', name: 'Context7', transport: 'HTTP', status: 'connected' },
  { id: 'mcp-filesystem', name: 'Filesystem', transport: 'STDIO', status: 'connected' },
  { id: 'mcp-puppeteer', name: 'Puppeteer', transport: 'STDIO', status: 'needs-setup' },
]

/** Workspace connectors (Integrations → Connectors, AC37) — the empty
 * list drives the tab's designed empty state. */
export interface ConnectorEntry {
  id: string
  name: string
  hint: string
  status: 'connected' | 'needs-setup'
}

export const CONNECTORS: ConnectorEntry[] = []

// ---------------------------------------------------------------------------
// Aggregate consumed by components (mockData.profiles, mockData.components, …)
// ---------------------------------------------------------------------------

export interface MockData {
  workspace: Workspace
  systems: System[]
  repositories: Repository[]
  containers: Container[]
  profiles: ExecutionProfile[]
  workspaceSettings: WorkspaceSetting[]
  components: ComponentEntry[]
  recentSessions: RecentSession[]
  sessionHistory: SessionHistoryEntry[]
  pendingReviews: PendingReview[]
  auditHistory: AuditEvent[]
  accountActions: AccountAction[]
  settings: { sections: SettingsSectionDef[] }
  preservedSkills: PreservedItem[]
  preservedTools: PreservedItem[]
}

export const mockData: MockData = {
  workspace: WORKSPACE,
  systems: SYSTEMS,
  repositories: REPOSITORIES,
  containers: CONTAINERS,
  profiles: EXECUTION_PROFILES,
  workspaceSettings: WORKSPACE_SETTINGS,
  components: COMPONENTS,
  recentSessions: RECENT_SESSIONS,
  sessionHistory: SESSION_HISTORY,
  pendingReviews: PENDING_REVIEWS,
  auditHistory: AUDIT_HISTORY,
  accountActions: ACCOUNT_ACTIONS,
  settings: { sections: SETTINGS_SECTIONS },
  preservedSkills: PRESERVED_SKILLS,
  preservedTools: PRESERVED_TOOLS,
}

export const DEFAULT_ACTIVE_SYSTEM_ID = 'bsi-hris'
export const DEFAULT_ACTIVE_PROFILE_ID = 'profile-default'

// ---------------------------------------------------------------------------
// Session Detail — illustrative dataset for a multi-cycle session (AC46)
// ---------------------------------------------------------------------------

export const SESSION_DETAIL: SessionDetailData = {
  sessionId: 'SES-2026-0042',
  title: 'Investigate and fix the error when get list approval exception that list not showing',
  status: 'WAITING_APPROVAL',
  mode: 'engineering',
  systemId: 'bsi-hris',
  systemName: 'BSI - HRIS',
  componentName: 'hris-web',
  repository: 'bsi/hris-approval-service',
  branch: 'fix/approval-list-exception',
  issueRef: '#318',
  agent: 'Konteks Engineering Agent',
  createdBy: 'Refactory Admin',
  createdAt: '2026-08-15T09:12:00Z',
  updatedAt: '2026-08-16T14:40:00Z',
  pendingAssistant: false,
  currentCycle: 2,
  totalCycles: 3,
  stages: [
    { id: 'ideation', label: 'Ideation', status: 'COMPLETED' },
    { id: 'quote', label: 'Quote', status: 'IN_PROGRESS' },
    { id: 'plan', label: 'Plan', status: 'NOT_STARTED' },
    { id: 'delivery', label: 'Delivery', status: 'NOT_STARTED' },
    { id: 'receipt', label: 'Receipt', status: 'NOT_STARTED' },
    { id: 'lessons', label: 'Lessons', status: 'NOT_STARTED' },
  ],
  quotes: [
    {
      id: 'Q-101',
      version: 1,
      estimatedStoryPoints: 5,
      maxStoryPoints: 8,
      status: 'APPROVED',
      createdAt: '2026-08-15T09:15:00Z',
      approvedBy: 'Refactory Admin',
      approvedAt: '2026-08-15T09:20:00Z',
    },
    {
      id: 'Q-102',
      version: 2,
      estimatedStoryPoints: 6,
      maxStoryPoints: 9,
      status: 'PENDING_APPROVAL',
      createdAt: '2026-08-16T14:35:00Z',
      expiresAt: '2026-08-17T14:40:00Z',
    },
  ],
  delivery: {
    id: 'D-057',
    status: 'COMPLETED',
    deliveredStoryPoints: 5,
    progressPercentage: 100,
    summary:
      'Cycle 1 delivery completed: ApprovalListQuery null-safety fix with paginated edge case handling deferred.',
    knownLimitations:
      'Pagination edge case when navigating past an empty result set is deferred to Cycle 2.',
    artifacts: [
      { type: 'PR', label: 'PR #142', url: '#pr-142' },
      { type: 'COMMIT', label: 'commit 9f3c2ab', url: '#commit-9f3c2ab' },
      { type: 'TEST_REPORT', label: 'Test Report', url: '#test-report-142' },
      { type: 'RECEIPT', label: 'Receipt R-0057', url: '#receipt-0057' },
    ],
  },
  timeline: [
    {
      id: 'T-001',
      type: 'USER_MESSAGE',
      content: 'Investigate and fix the error when get list approval exception that list not showing',
      actorType: 'USER',
      createdAt: '2026-08-15T09:12:00Z',
    },
    {
      id: 'T-002',
      type: 'ARTIFACT',
      content: 'Attached error log file',
      actorType: 'USER',
      createdAt: '2026-08-15T09:12:30Z',
      artifact: { type: 'DOCUMENT', label: 'logs-approval-exception.txt', url: '#log-approval-exception' },
    },
    {
      id: 'T-003',
      type: 'ASSISTANT_MESSAGE',
      content: 'Acknowledged. Investigating the approval list exception in bsi/hris-approval-service repository.',
      actorType: 'ASSISTANT',
      createdAt: '2026-08-15T09:13:00Z',
    },
    {
      id: 'T-004',
      type: 'SYSTEM_EVENT',
      content: 'Session created — status: In Progress',
      actorType: 'SYSTEM',
      createdAt: '2026-08-15T09:13:00Z',
    },
    {
      id: 'T-005',
      type: 'ASSISTANT_MESSAGE',
      content:
        'Investigation findings: ApprovalListQuery throws NPE when paginating past an empty result set. Root cause in ApprovalListMapper line 142 where safe navigation operator is missing.',
      actorType: 'ASSISTANT',
      createdAt: '2026-08-15T09:25:00Z',
    },
    {
      id: 'T-006',
      type: 'ERROR',
      content: 'Transient test-runner timeout during integration test suite. Retrying...',
      actorType: 'SYSTEM',
      createdAt: '2026-08-15T10:15:00Z',
    },
    {
      id: 'T-007',
      type: 'ASSISTANT_MESSAGE',
      content: 'Test suite passed on retry. All 127 integration tests green.',
      actorType: 'ASSISTANT',
      createdAt: '2026-08-15T10:17:00Z',
    },
    {
      id: 'T-008',
      type: 'QUOTE',
      content: 'Quote Q-101 v1: 5 story points (max 8) for ApprovalListQuery NPE fix.',
      actorType: 'ASSISTANT',
      createdAt: '2026-08-15T09:15:00Z',
      quoteId: 'Q-101',
    },
    {
      id: 'T-009',
      type: 'APPROVAL',
      content: 'Quote Q-101 approved by Refactory Admin',
      actorType: 'USER',
      createdAt: '2026-08-15T09:20:00Z',
      quoteId: 'Q-101',
    },
    {
      id: 'T-010',
      type: 'SYSTEM_EVENT',
      content: 'Delivery started',
      actorType: 'SYSTEM',
      createdAt: '2026-08-15T09:20:00Z',
    },
    {
      id: 'T-011',
      type: 'ASSISTANT_MESSAGE',
      content: 'Implementing fix: adding null-safety checks to ApprovalListMapper and updating pagination logic.',
      actorType: 'ASSISTANT',
      createdAt: '2026-08-15T10:30:00Z',
    },
    {
      id: 'T-012',
      type: 'DELIVERY',
      content: 'Cycle 1 completed: PR #142, commit 9f3c2ab, test report passed, receipt R-0057. Delivered 5 of 5 story points.',
      actorType: 'ASSISTANT',
      createdAt: '2026-08-15T14:00:00Z',
      deliveryId: 'D-057',
    },
    {
      id: 'T-013',
      type: 'SYSTEM_EVENT',
      content: 'Cycle 1 completed — 5 of 5 story points delivered',
      actorType: 'SYSTEM',
      createdAt: '2026-08-15T14:00:00Z',
    },
    {
      id: 'T-014',
      type: 'ASSISTANT_MESSAGE',
      content:
        'Cycle 1 delivered the core NPE fix. I recommend a follow-up cycle to address the pagination edge case (navigating past empty result sets) which was deferred to keep scope bounded. This would add ~6 story points.',
      actorType: 'ASSISTANT',
      createdAt: '2026-08-16T14:30:00Z',
    },
    {
      id: 'T-015',
      type: 'QUOTE',
      content: 'Quote Q-102 v2: 6 story points (max 9) for pagination edge case fix.',
      actorType: 'ASSISTANT',
      createdAt: '2026-08-16T14:35:00Z',
      quoteId: 'Q-102',
    },
    {
      id: 'T-016',
      type: 'SYSTEM_EVENT',
      content: 'Status changed to Waiting Approval — quote Q-102 awaiting your response',
      actorType: 'SYSTEM',
      createdAt: '2026-08-16T14:40:00Z',
    },
  ],
}
