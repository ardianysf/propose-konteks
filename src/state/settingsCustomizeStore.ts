import { useSyncExternalStore } from 'react'

export type Readiness = 'ready' | 'needs-setup' | 'testing'
export type CapabilityKind = 'skills' | 'tools' | 'mcp'
export type ConnectionKind = 'mcp' | 'vcs' | 'search'

export interface AgentProfile {
  id: string
  name: string
  role: 'Assistant' | 'Harness' | 'Search' | 'QA runner'
  provider: string
  providerConnectionId: string | null
  model: string
  readiness: Readiness
}

export interface ExecutionProfile {
  id: string
  name: string
  planner: string
  executor: string
  revision: number
  isDefault: boolean
  status: 'active' | 'archived'
}

export interface TeamGroup {
  id: string
  slug: string
  displayName: string
  description: string
  role: 'owner' | 'member' | 'viewer'
  memberIds: string[]
  protected: boolean
}

export interface TeamMember {
  id: string
  name: string
  email: string
  status: 'active' | 'invited'
}

export interface Invitation {
  id: string
  email: string
  groupId: string
  status: 'pending' | 'revoked'
}

export interface CapabilityItem {
  id: string
  kind: CapabilityKind
  name: string
  description: string
  status: 'active' | 'deprecated' | 'archived'
  versions: CapabilityVersion[]
}

export interface CapabilityVersion {
  version: string
  notes: string
  createdAt: string
}

export interface ContextResource {
  id: string
  kind: 'files' | 'skills'
  name: string
  detail: string
  content: string
}

interface BaseConnection {
  id: string
  name: string
  status: 'connected' | 'disabled' | 'needs-setup'
  detail: string
}

export interface McpConnection extends BaseConnection {
  kind: 'mcp'
  provider: 'Streamable HTTP' | 'SSE' | 'stdio'
  endpoint: string
}

export interface VcsConnection extends BaseConnection {
  kind: 'vcs'
  provider: 'GitHub' | 'GitLab' | 'Bitbucket'
  baseUrl: string
}

export interface SearchConnection extends BaseConnection {
  kind: 'search'
  provider: 'OpenSearch' | 'Elasticsearch'
  endpoint: string
  index: string
}

export type ConnectionItem = McpConnection | VcsConnection | SearchConnection

export interface ProviderConnection {
  id: string
  name: string
  provider: string
  endpoint: string
  credentialKind: 'api-key' | 'subscription-oauth'
  region: string
  modelFamilies: string[]
  scope: 'workspace'
  maskedSuffix: string
  partnerDisclosed: boolean
  externalSpend: { amount: number; currency: 'IDR' | 'USD'; period: string } | null
  status: 'connected' | 'disabled' | 'needs-setup' | 'error' | 'unverified'
  lastVerified: string
}

export type BillingSubscriptionStatus = 'trialing' | 'active' | 'past-due' | 'cancelled' | 'suspended'

export interface BillingSubscription {
  planId: string
  planName: string
  status: BillingSubscriptionStatus
  billingPeriod: 'monthly' | 'annual'
  periodStart: string
  periodEnd: string
  renewalDate: string
  currency: 'IDR' | 'USD'
  monthlyPrice: number
  includedStoryPoints: number
  overageEnabled: boolean
}

export interface BillingPlan {
  id: string
  name: string
  currency: 'IDR' | 'USD'
  monthlyPrice: number
  includedStoryPoints: number
  seatMinimum: number
  seatLimit: number | null
  systemLimit: number | null
  repositoryLimit: number | null
  support: string
  byok: boolean
  mcp: boolean
  validationRuntime: boolean
  presence: boolean
  onPremRuntime: boolean
}

export interface BillingEntitlements {
  seatsUsed: number
  seatLimit: number | null
  systemsUsed: number
  systemLimit: number | null
  repositoriesUsed: number
  repositoryLimit: number | null
  support: string
  mcp: boolean
  validationRuntime: boolean
  presence: boolean
  onPremRuntime: boolean
}

export interface StoryPointLedger {
  available: number
  reserved: number
  totalPurchased: number
  totalUsed: number
  currency: 'IDR' | 'USD'
  updatedAt: string
  breakdown: { tokens: number; compute: number; storage: number; platform: number; mcp: number }
}

export interface BillingUsageRow {
  id: string
  label: string
  storyPoints: number
  count: number
}

export interface UsageAnalytics {
  periodStart: string
  periodEnd: string
  reconciled: boolean
  ledgerConsumption: number
  deliveryAttributed: number
  totalSessions: number
  totalInputTokens: number
  totalOutputTokens: number
  runtimeMinutes: number
  validationMinutes: number
  catalogGrowth: { systems: number; components: number; repositories: number; total: number }
  quoteAbandonment: { created: number; authorized: number; abandoned: number; rate: number }
  providerModels: { provider: string; model: string; events: number; inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number }[]
  bySystem: BillingUsageRow[]
  byAgentMode: BillingUsageRow[]
  byRepository: BillingUsageRow[]
  byUser: BillingUsageRow[]
  byOutcome: BillingUsageRow[]
  byModel: BillingUsageRow[]
  byMeterCategory: BillingUsageRow[]
}

export interface ProviderSpendWarning {
  currency: 'IDR' | 'USD'
  amount: number
}

export interface BudgetPolicy {
  workspaceMonthlyCap: number | null
  perRunMaximum: number | null
  approvalThreshold: number | null
  perUserCap: number | null
  perSystemCap: number | null
  perRepositoryCap: number | null
  autoRechargeThreshold: number | null
  enforcement: 'hard-stop'
  providerSpendWarnings: ProviderSpendWarning[]
  legacyProviderSpendPoints: number | null
}

export interface BudgetScopeStatus {
  id: string
  scope: 'workspace' | 'user' | 'system' | 'repository'
  label: string
  limit: number | null
  consumed: number | null
  observed: number | null
  status: 'ok' | 'approaching' | 'exceeded' | 'unknown'
}

export interface TopupPackage {
  id: string
  label: string
  currency: 'IDR' | 'USD'
  netAmount: number
  taxAmount: number
  grossAmount: number
  storyPoints: number
}

export interface RuntimeItem {
  id: string
  name: string
  status: 'active' | 'suspended' | 'offline'
  version: string
}

export interface OwnerMapping {
  id: string
  handle: string
  groupId: string
}

export interface RepositoryContext {
  url: string
  ref: string
  path: string
  lastLoaded: string
}

export interface ActivationToken {
  id: string
  label: string
  scope: 'workspace' | 'runtime'
  expiresAt: string
  status: 'active' | 'revoked'
}

export interface Transaction {
  id: string
  createdAt: string
  type: 'subscription' | 'top-up' | 'refund'
  description: string
  paymentMethod: string
  currency: 'IDR' | 'USD'
  amount: number
  netAmount: number
  taxAmount: number
  status: 'settled' | 'captured' | 'pending' | 'denied' | 'expired' | 'cancelled' | 'failed' | 'refunded' | 'partially-refunded'
}

export interface SettingsCustomizeState {
  displayName: string
  subscription: BillingSubscription
  plans: BillingPlan[]
  entitlements: BillingEntitlements
  storyPointLedger: StoryPointLedger
  usageAnalytics: UsageAnalytics
  budgetPolicy: BudgetPolicy
  budgetScopes: BudgetScopeStatus[]
  topupPackages: TopupPackage[]
  providerPolicy: { allowedProviders: string[] }
  providers: ProviderConnection[]
  groups: TeamGroup[]
  teamMembers: TeamMember[]
  invitations: Invitation[]
  agentProfiles: AgentProfile[]
  executionProfiles: ExecutionProfile[]
  contextResources: ContextResource[]
  repository: RepositoryContext
  capabilities: CapabilityItem[]
  connections: ConnectionItem[]
  activationTokens: ActivationToken[]
  runtimes: RuntimeItem[]
  runtimeConfig: { key: string; value: string; audited: boolean; inherited: boolean }[]
  ownerMappings: OwnerMapping[]
  transactions: Transaction[]
}

export const INITIAL_SETTINGS_CUSTOMIZE_STATE: SettingsCustomizeState = {
  displayName: 'Refactory Admin',
  subscription: { planId: 'team', planName: 'Team', status: 'active', billingPeriod: 'monthly', periodStart: '2026-09-01T00:00:00.000Z', periodEnd: '2026-10-01T00:00:00.000Z', renewalDate: '2026-10-01T00:00:00.000Z', currency: 'IDR', monthlyPrice: 1200000, includedStoryPoints: 8000, overageEnabled: true },
  plans: [
    { id: 'free', name: 'Free', currency: 'IDR', monthlyPrice: 0, includedStoryPoints: 100, seatMinimum: 1, seatLimit: 1, systemLimit: 1, repositoryLimit: 1, support: 'Community', byok: false, mcp: false, validationRuntime: false, presence: false, onPremRuntime: false },
    { id: 'builder', name: 'Builder', currency: 'IDR', monthlyPrice: 450000, includedStoryPoints: 2000, seatMinimum: 1, seatLimit: 3, systemLimit: 5, repositoryLimit: 10, support: 'Standard', byok: true, mcp: true, validationRuntime: false, presence: false, onPremRuntime: false },
    { id: 'team', name: 'Team', currency: 'IDR', monthlyPrice: 1200000, includedStoryPoints: 8000, seatMinimum: 3, seatLimit: 25, systemLimit: 20, repositoryLimit: 50, support: 'Priority', byok: true, mcp: true, validationRuntime: true, presence: true, onPremRuntime: false },
    { id: 'scale', name: 'Scale', currency: 'IDR', monthlyPrice: 3600000, includedStoryPoints: 25000, seatMinimum: 10, seatLimit: 100, systemLimit: 100, repositoryLimit: 250, support: 'Priority+', byok: true, mcp: true, validationRuntime: true, presence: true, onPremRuntime: true },
    { id: 'enterprise', name: 'Enterprise', currency: 'IDR', monthlyPrice: 0, includedStoryPoints: 100000, seatMinimum: 25, seatLimit: null, systemLimit: null, repositoryLimit: null, support: 'Dedicated', byok: true, mcp: true, validationRuntime: true, presence: true, onPremRuntime: true },
  ],
  entitlements: { seatsUsed: 12, seatLimit: 25, systemsUsed: 8, systemLimit: 20, repositoriesUsed: 34, repositoryLimit: 50, support: 'Priority', mcp: true, validationRuntime: true, presence: true, onPremRuntime: false },
  storyPointLedger: { available: 6240, reserved: 485, totalPurchased: 4500, totalUsed: 1760, currency: 'IDR', updatedAt: '2026-09-02T09:42:00.000Z', breakdown: { tokens: 920, compute: 410, storage: 85, platform: 210, mcp: 135 } },
  usageAnalytics: {
    periodStart: '2026-09-01T00:00:00.000Z', periodEnd: '2026-10-01T00:00:00.000Z', reconciled: true, ledgerConsumption: 1760, deliveryAttributed: 1483,
    totalSessions: 2060, totalInputTokens: 12300000, totalOutputTokens: 2920000,
    runtimeMinutes: 320, validationMinutes: 75, catalogGrowth: { systems: 2, components: 18, repositories: 5, total: 25 }, quoteAbandonment: { created: 40, authorized: 35, abandoned: 5, rate: 0.125 },
    providerModels: [
      { provider: 'Anthropic', model: 'Claude Sonnet 4.5', events: 1200, inputTokens: 8000000, outputTokens: 2000000, cacheReadTokens: 1000000, cacheWriteTokens: 200000 },
      { provider: 'OpenAI', model: 'GPT-4.1', events: 860, inputTokens: 4300000, outputTokens: 920000, cacheReadTokens: 610000, cacheWriteTokens: 80000 },
    ],
    bySystem: [{ id: 'apps', label: 'Konteks Apps', storyPoints: 720, count: 51 }, { id: 'catalog', label: 'Component Catalog', storyPoints: 410, count: 29 }, { id: 'platform', label: 'Platform', storyPoints: 353, count: 24 }],
    byAgentMode: [{ id: 'autonomous', label: 'Autonomous', storyPoints: 1000, count: 80 }, { id: 'assisted', label: 'Assisted', storyPoints: 483, count: 31 }],
    byRepository: [{ id: 'apps-web', label: 'apps/web', storyPoints: 800, count: 50 }, { id: 'core', label: 'platform/core', storyPoints: 442, count: 33 }],
    byUser: [{ id: 'ayu', label: 'Ayu Lestari', storyPoints: 640, count: 40 }, { id: 'bima', label: 'Bima Nugraha', storyPoints: 388, count: 22 }],
    byOutcome: [{ id: 'merged', label: 'Merged', storyPoints: 700, count: 12 }, { id: 'reviewed', label: 'Reviewed', storyPoints: 525, count: 19 }],
    byModel: [{ id: 'sonnet', label: 'Claude Sonnet 4.5', storyPoints: 1000, count: 120 }, { id: 'gpt41', label: 'GPT-4.1', storyPoints: 483, count: 86 }],
    byMeterCategory: [{ id: 'execute', label: 'Task execution', storyPoints: 900, count: 62 }, { id: 'review', label: 'Validation and review', storyPoints: 368, count: 44 }, { id: 'mcp', label: 'MCP tools', storyPoints: 215, count: 73 }],
  },
  budgetPolicy: { workspaceMonthlyCap: 9000, perRunMaximum: 180, approvalThreshold: 100, perUserCap: null, perSystemCap: null, perRepositoryCap: null, autoRechargeThreshold: null, enforcement: 'hard-stop', providerSpendWarnings: [{ currency: 'IDR', amount: 2500000 }, { currency: 'USD', amount: 150 }], legacyProviderSpendPoints: 500 },
  budgetScopes: [
    { id: 'workspace', scope: 'workspace', label: 'Refactory workspace', limit: 9000, consumed: 1760, observed: null, status: 'ok' },
    { id: 'system-apps', scope: 'system', label: 'Konteks Apps', limit: 2200, consumed: 1810, observed: null, status: 'approaching' },
    { id: 'repo-legacy', scope: 'repository', label: 'legacy/portal', limit: 500, consumed: 540, observed: null, status: 'exceeded' },
    { id: 'user-aggregate', scope: 'user', label: 'All users', limit: null, consumed: null, observed: 1483, status: 'unknown' },
  ],
  topupPackages: [
    { id: 'sp-250', label: 'Starter boost', currency: 'IDR', netAmount: 225225, taxAmount: 24775, grossAmount: 250000, storyPoints: 250 },
    { id: 'sp-500', label: 'Team boost', currency: 'IDR', netAmount: 450450, taxAmount: 49550, grossAmount: 500000, storyPoints: 500 },
    { id: 'sp-1000', label: 'Scale boost', currency: 'IDR', netAmount: 900901, taxAmount: 99099, grossAmount: 1000000, storyPoints: 1000 },
    { id: 'sp-2500', label: 'Operations reserve', currency: 'IDR', netAmount: 2252252, taxAmount: 247748, grossAmount: 2500000, storyPoints: 2500 },
  ],
  providerPolicy: { allowedProviders: ['OpenAI', 'Anthropic', 'Azure OpenAI'] },
  providers: [
    { id: 'provider-openai', name: 'Team OpenAI', provider: 'OpenAI', endpoint: 'https://api.openai.com/v1', credentialKind: 'api-key', region: 'Global', modelFamilies: ['GPT-4.1', 'GPT-4o'], scope: 'workspace', maskedSuffix: '7K2Q', partnerDisclosed: false, externalSpend: { amount: 1840000, currency: 'IDR', period: 'Sep 1–30, 2026' }, status: 'connected', lastVerified: 'Today, 09:42' },
    { id: 'provider-anthropic', name: 'Delivery Anthropic', provider: 'Anthropic', endpoint: 'https://api.anthropic.com', credentialKind: 'subscription-oauth', region: 'Global', modelFamilies: ['Claude Sonnet 4.5', 'Claude Haiku 4.5'], scope: 'workspace', maskedSuffix: 'A91F', partnerDisclosed: true, externalSpend: null, status: 'connected', lastVerified: 'Yesterday, 16:10' },
    { id: 'provider-azure', name: 'Azure fallback', provider: 'Azure OpenAI', endpoint: 'https://refactory.openai.azure.com', credentialKind: 'api-key', region: 'Southeast Asia', modelFamilies: ['GPT-4.1'], scope: 'workspace', maskedSuffix: '—', partnerDisclosed: false, externalSpend: { amount: 42, currency: 'USD', period: 'Sep 1–30, 2026' }, status: 'needs-setup', lastVerified: 'Never' },
  ],
  groups: [
    { id: 'owners', slug: 'refactory-owners', displayName: 'Refactory owners', description: 'Workspace owners and administrators.', role: 'owner', memberIds: ['member-samira', 'member-dika'], protected: true },
    { id: 'engineering', slug: 'refactory-engineering', displayName: 'Engineering', description: 'Product engineering and platform delivery.', role: 'member', memberIds: ['member-ayu', 'member-bima', 'member-sari', 'member-kevin', 'member-arif', 'member-nanda', 'member-yusuf', 'member-dewi'], protected: false },
    { id: 'product', slug: 'refactory-product', displayName: 'Product reviewers', description: 'Product and design reviewers.', role: 'viewer', memberIds: ['member-ayu', 'member-sari', 'member-lina', 'member-rafi'], protected: false },
  ],
  teamMembers: [
    { id: 'member-samira', name: 'Samira Putri', email: 'samira@refactory.dev', status: 'active' },
    { id: 'member-dika', name: 'Dika Pratama', email: 'dika@refactory.dev', status: 'active' },
    { id: 'member-ayu', name: 'Ayu Lestari', email: 'ayu@refactory.dev', status: 'active' },
    { id: 'member-bima', name: 'Bima Nugraha', email: 'bima@refactory.dev', status: 'active' },
    { id: 'member-sari', name: 'Sari Dewi', email: 'sari@refactory.dev', status: 'active' },
    { id: 'member-kevin', name: 'Kevin Wijaya', email: 'kevin@refactory.dev', status: 'active' },
    { id: 'member-arif', name: 'Arif Rahman', email: 'arif@refactory.dev', status: 'active' },
    { id: 'member-nanda', name: 'Nanda Putra', email: 'nanda@refactory.dev', status: 'active' },
    { id: 'member-yusuf', name: 'Yusuf Hadi', email: 'yusuf@refactory.dev', status: 'active' },
    { id: 'member-lina', name: 'Lina Amelia', email: 'lina@refactory.dev', status: 'active' },
    { id: 'member-rafi', name: 'Rafi Akbar', email: 'rafi@refactory.dev', status: 'active' },
    { id: 'member-dewi', name: 'Dewi Kartika', email: 'dewi@refactory.dev', status: 'active' },
  ],
  invitations: [
    { id: 'invite-1', email: 'maya@refactory.dev', groupId: 'engineering', status: 'pending' },
  ],
  agentProfiles: [
    { id: 'assistant', name: 'Workspace assistant', role: 'Assistant', provider: 'OpenAI', providerConnectionId: 'provider-openai', model: 'GPT-4.1', readiness: 'ready' },
    { id: 'harness', name: 'Delivery harness', role: 'Harness', provider: 'Anthropic', providerConnectionId: 'provider-anthropic', model: 'Claude Sonnet 4.5', readiness: 'ready' },
    { id: 'search', name: 'Catalog search', role: 'Search', provider: 'OpenAI', providerConnectionId: 'provider-openai', model: 'text-embedding-3-large', readiness: 'ready' },
    { id: 'qa', name: 'Browser verification', role: 'QA runner', provider: 'Azure OpenAI', providerConnectionId: 'provider-azure', model: 'Computer use', readiness: 'needs-setup' },
  ],
  executionProfiles: [
    { id: 'standard', name: 'Standard delivery', planner: 'GPT-4.1', executor: 'Claude Sonnet 4.5', revision: 4, isDefault: true, status: 'active' },
    { id: 'fast', name: 'Fast fixes', planner: 'GPT-4o mini', executor: 'Claude Haiku 4.5', revision: 2, isDefault: false, status: 'active' },
    { id: 'legacy', name: 'Legacy migration', planner: 'GPT-4.1', executor: 'Claude Sonnet 4', revision: 7, isDefault: false, status: 'archived' },
  ],
  contextResources: [
    { id: 'file-agents', kind: 'files', name: 'AGENTS.md', detail: 'Workspace instructions', content: '# Agent instructions\nPrefer small, verified changes.' },
    { id: 'file-architecture', kind: 'files', name: 'docs/architecture.md', detail: 'System architecture', content: '# Architecture\nServices are grouped by software system.' },
    { id: 'context-review', kind: 'skills', name: 'code-review', detail: 'Contextual review guidance', content: 'Review correctness, security, and maintainability.' },
  ],
  repository: { url: 'https://github.com/refactory-id/konteks', ref: 'main', path: '/', lastLoaded: '18 minutes ago' },
  capabilities: [
    { id: 'skill-review', kind: 'skills', name: 'Code review', description: 'Review changes with workspace guidance.', status: 'active', versions: [{ version: '2.1.0', notes: 'Improved security checks.', createdAt: 'Aug 28, 2026' }, { version: '2.0.0', notes: 'Workspace-aware review.', createdAt: 'Jul 12, 2026' }] },
    { id: 'skill-release', kind: 'skills', name: 'Release notes', description: 'Draft release notes from merged changes.', status: 'active', versions: [{ version: '1.3.0', notes: 'Added grouped changes.', createdAt: 'Aug 19, 2026' }] },
    { id: 'tool-search', kind: 'tools', name: 'Catalog search', description: 'Search known systems and components.', status: 'active', versions: [{ version: '3.0.0', notes: 'New catalog index.', createdAt: 'Sep 1, 2026' }, { version: '2.4.0', notes: 'Ranking improvements.', createdAt: 'Aug 3, 2026' }] },
    { id: 'tool-archive', kind: 'tools', name: 'Document archive', description: 'Store generated artifacts in the workspace archive.', status: 'active', versions: [{ version: '1.0.0', notes: 'Initial release.', createdAt: 'Jul 6, 2026' }] },
    { id: 'mcp-workspace', kind: 'mcp', name: 'Workspace MCP', description: 'Expose workspace context to external agents.', status: 'active', versions: [{ version: '1.2.0', notes: 'Expanded resource support.', createdAt: 'Aug 30, 2026' }] },
  ],
  connections: [
    { id: 'mcp-context7', kind: 'mcp', name: 'Context7', provider: 'Streamable HTTP', endpoint: 'https://mcp.context7.com', status: 'connected', detail: '12 tools · healthy' },
    { id: 'mcp-internal', kind: 'mcp', name: 'Company MCP', provider: 'SSE', endpoint: 'https://mcp.refactory.dev/events', status: 'needs-setup', detail: 'Secret required' },
    { id: 'vcs-github', kind: 'vcs', name: 'GitHub Engineering', provider: 'GitHub', baseUrl: 'https://github.com/refactory-id', status: 'connected', detail: '34 repositories' },
    { id: 'vcs-gitlab', kind: 'vcs', name: 'GitLab Legacy', provider: 'GitLab', baseUrl: 'https://gitlab.refactory.dev', status: 'disabled', detail: '8 repositories' },
    { id: 'search-source', kind: 'search', name: 'Source index', provider: 'OpenSearch', endpoint: 'https://search.refactory.dev', index: 'source-v2', status: 'connected', detail: 'Synced 18 minutes ago' },
  ],
  activationTokens: [
    { id: 'token-1', label: 'Jakarta runner bootstrap', scope: 'runtime', expiresAt: 'Sep 9, 2026', status: 'active' },
  ],
  runtimes: [
    { id: 'runtime-1', name: 'Jakarta runner 01', status: 'active', version: '5.9.0' },
    { id: 'runtime-2', name: 'Singapore runner 02', status: 'suspended', version: '5.8.4' },
  ],
  runtimeConfig: [
    { key: 'MAX_CONCURRENT_RUNS', value: '8', audited: true, inherited: false },
    { key: 'RUN_TIMEOUT_MINUTES', value: '45', audited: true, inherited: false },
    { key: 'ALLOW_PREVIEW_NETWORK', value: 'false', audited: false, inherited: true },
  ],
  ownerMappings: [
    { id: 'map-1', handle: '@refactory/platform', groupId: 'owners' },
    { id: 'map-2', handle: 'apps/web/**', groupId: 'engineering' },
  ],
  transactions: [
    { id: 'TRX-2084', createdAt: '2026-09-01T08:14:00.000Z', type: 'subscription', description: 'Team plan renewal', paymentMethod: 'bank transfer', currency: 'IDR', amount: 1200000, netAmount: 1081081, taxAmount: 118919, status: 'settled' },
    { id: 'TRX-2079', createdAt: '2026-08-24T10:32:00.000Z', type: 'top-up', description: '500 Story Points', paymentMethod: 'virtual account', currency: 'IDR', amount: 500000, netAmount: 450450, taxAmount: 49550, status: 'captured' },
    { id: 'TRX-2072', createdAt: '2026-08-12T04:08:00.000Z', type: 'top-up', description: '250 Story Points', paymentMethod: 'QRIS', currency: 'IDR', amount: 250000, netAmount: 225225, taxAmount: 24775, status: 'settled' },
    { id: 'TRX-2061', createdAt: '2026-08-02T06:41:00.000Z', type: 'top-up', description: '1,000 Story Points', paymentMethod: 'credit card', currency: 'IDR', amount: 1000000, netAmount: 900901, taxAmount: 99099, status: 'refunded' },
    { id: 'TRX-2056', createdAt: '2026-07-28T14:20:00.000Z', type: 'top-up', description: '500 Story Points', paymentMethod: 'virtual account', currency: 'IDR', amount: 500000, netAmount: 450450, taxAmount: 49550, status: 'failed' },
    { id: 'TRX-2044', createdAt: '2026-07-14T03:51:00.000Z', type: 'top-up', description: '250 Story Points', paymentMethod: 'QRIS', currency: 'IDR', amount: 250000, netAmount: 225225, taxAmount: 24775, status: 'expired' },
    { id: 'TRX-2038', createdAt: '2026-07-01T09:00:00.000Z', type: 'subscription', description: 'Team plan renewal', paymentMethod: 'bank transfer', currency: 'IDR', amount: 1200000, netAmount: 1081081, taxAmount: 118919, status: 'settled' },
    { id: 'TRX-2029', createdAt: '2026-06-20T11:12:00.000Z', type: 'top-up', description: '500 Story Points', paymentMethod: 'bank transfer', currency: 'IDR', amount: 500000, netAmount: 450450, taxAmount: 49550, status: 'pending' },
    { id: 'TRX-2021', createdAt: '2026-06-12T05:33:00.000Z', type: 'top-up', description: '250 Story Points', paymentMethod: 'credit card', currency: 'IDR', amount: 250000, netAmount: 225225, taxAmount: 24775, status: 'denied' },
    { id: 'TRX-2018', createdAt: '2026-06-04T02:29:00.000Z', type: 'subscription', description: 'Team plan renewal', paymentMethod: 'virtual account', currency: 'IDR', amount: 1200000, netAmount: 1081081, taxAmount: 118919, status: 'cancelled' },
    { id: 'TRX-2007', createdAt: '2026-05-18T07:48:00.000Z', type: 'refund', description: 'Partial top-up refund', paymentMethod: 'QRIS', currency: 'IDR', amount: 125000, netAmount: 112613, taxAmount: 12387, status: 'partially-refunded' },
  ],
}

let currentState = structuredClone(INITIAL_SETTINGS_CUSTOMIZE_STATE)
const listeners = new Set<() => void>()

export function getSettingsCustomizeState(): SettingsCustomizeState {
  return currentState
}

export function updateSettingsCustomizeState(
  update: (state: SettingsCustomizeState) => SettingsCustomizeState,
): void {
  currentState = update(currentState)
  listeners.forEach((listener) => listener())
}

export function useSettingsCustomizeStore(): SettingsCustomizeState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSettingsCustomizeState,
    () => INITIAL_SETTINGS_CUSTOMIZE_STATE,
  )
}

export function resetSettingsCustomizeStore(): void {
  currentState = structuredClone(INITIAL_SETTINGS_CUSTOMIZE_STATE)
  listeners.forEach((listener) => listener())
}

export function nextPrototypeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
