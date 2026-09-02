import {
  AlertTriangle, BarChart3, Check, ChevronLeft, ChevronRight, CircleDollarSign,
  Clock3, Download, Gauge, KeyRound, Minus, Pencil, Plus, RefreshCw, RotateCw,
  ShieldCheck, Trash2, WalletCards, X,
} from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { usePrototypeLocale, type PrototypeCopyKey } from '../../i18n/prototypeLocale'
import {
  nextPrototypeId, updateSettingsCustomizeState, useSettingsCustomizeStore,
  type BillingPlan, type BillingUsageRow, type BudgetPolicy, type ProviderConnection,
  type ProviderSpendWarning, type Transaction,
} from '../../state/settingsCustomizeStore'
import type { BillingSubtab, DemoVariant } from '../../state/mockupReducer'
import ProviderDialog, { type ProviderDraft } from './ProviderDialog'
import {
  ConfirmProviderRemovalDialog, formatMoney, PlanCheckoutDialog,
  ProviderCredentialDialog, TopupCheckoutDialog,
} from './BillingDialogs'

const BILLING_TABS: { id: BillingSubtab; icon: typeof BarChart3 }[] = [
  { id: 'usage', icon: BarChart3 }, { id: 'plans', icon: WalletCards },
  { id: 'providers', icon: KeyRound }, { id: 'budgets', icon: Gauge },
  { id: 'topup', icon: CircleDollarSign }, { id: 'transactions', icon: Clock3 },
]

function Status({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return <span className={`kx-status kx-status--${tone}`}>{children}</span>
}

function LoadingBlock() {
  const { t } = usePrototypeLocale()
  return <div className="kx-billing-loading" role="status"><span className="kx-spinner" />{t('loadingBilling')}</div>
}

function EmptyBlock({ title, body }: { title: string; body: string }) {
  return <div className="kx-billing-empty"><CircleDollarSign size={24} /><strong>{title}</strong><p>{body}</p></div>
}

export default function BillingWorkspace({ subtab, select, demoVariant }: {
  subtab: BillingSubtab
  select: (tab: BillingSubtab) => void
  demoVariant: DemoVariant
}) {
  const { t } = usePrototypeLocale()
  const [retried, setRetried] = useState(false)
  const showError = demoVariant === 'error' && !retried
  return <div className="kx-billing-workspace">
    <BillingOverview />
    <div className="kx-billing-tabs" role="tablist" aria-label={t('billing')}>
      {BILLING_TABS.map(({ id, icon: Icon }) => <button key={id} role="tab" aria-selected={subtab === id} onClick={() => select(id)}><Icon size={14} />{t(id)}</button>)}
    </div>
    {showError && <div className="kx-callout kx-callout--danger" role="alert"><AlertTriangle size={16} /><div><strong>{t('billingDataDelayed')}</strong><p>{t('billingDataDelayedHelp')}</p></div><button className="kx-button kx-button--small" onClick={() => setRetried(true)}>{t('retry')}</button></div>}
    <section className="kx-billing-panel" aria-label={t(subtab)}>
      {demoVariant === 'loading' ? <LoadingBlock />
        : subtab === 'usage' ? <UsagePanel empty={demoVariant === 'empty'} />
          : subtab === 'plans' ? <PlansPanel empty={demoVariant === 'empty'} failPayments={showError} />
            : subtab === 'providers' ? <ProvidersPanel empty={demoVariant === 'empty'} />
              : subtab === 'budgets' ? <BudgetsPanel empty={demoVariant === 'empty'} />
                : subtab === 'topup' ? <TopupPanel empty={demoVariant === 'empty'} failPayments={showError} />
                  : <TransactionsPanel empty={demoVariant === 'empty'} error={showError} onRetry={() => setRetried(true)} />}
    </section>
  </div>
}

function BillingOverview() {
  const data = useSettingsCustomizeStore()
  const { t, locale } = usePrototypeLocale()
  const { subscription: s, entitlements: e, storyPointLedger: ledger } = data
  const statusTone = s.status === 'active' || s.status === 'trialing' ? 'success' : s.status === 'past-due' ? 'warning' : 'danger'
  const limit = (used: number, cap: number | null) => cap === null ? t('unlimited') : `${used.toLocaleString(locale)} / ${cap.toLocaleString(locale)}`
  return <div className="kx-billing-overview">
    <section className="kx-billing-summary">
      <div className="kx-billing-section-head"><div><span className="kx-eyebrow">{t('subscription')}</span><h3>{s.planName}</h3></div><Status tone={statusTone}>{t(`subscriptionStatus${statusSuffix(s.status)}` as PrototypeCopyKey)}</Status></div>
      <dl className="kx-detail-grid kx-detail-grid--compact">
        <div><dt>{t('renewalDate')}</dt><dd>{formatDate(s.renewalDate, locale)}</dd></div>
        <div><dt>{t('billingPeriod')}</dt><dd>{t(s.billingPeriod)}</dd></div>
        <div><dt>{t('includedStoryPoints')}</dt><dd>{s.includedStoryPoints.toLocaleString(locale)}</dd></div>
        <div><dt>{t('availableAllowance')}</dt><dd>{ledger.available.toLocaleString(locale)}</dd></div>
        <div><dt>{t('purchasedBalance')}</dt><dd>{ledger.totalPurchased.toLocaleString(locale)}</dd></div>
        <div><dt>{t('overage')}</dt><dd>{s.overageEnabled ? t('enabled') : t('disabled')}</dd></div>
      </dl>
    </section>
    <section className="kx-billing-entitlements">
      <div className="kx-billing-section-head"><div><span className="kx-eyebrow">{t('planEntitlements')}</span><h3>{t('operationalLimits')}</h3></div><ShieldCheck size={17} /></div>
      <dl className="kx-entitlement-limits"><div><dt>{t('seats')}</dt><dd>{limit(e.seatsUsed, e.seatLimit)}</dd></div><div><dt>{t('systems')}</dt><dd>{limit(e.systemsUsed, e.systemLimit)}</dd></div><div><dt>{t('repositories')}</dt><dd>{limit(e.repositoriesUsed, e.repositoryLimit)}</dd></div><div><dt>{t('support')}</dt><dd>{e.support}</dd></div></dl>
      <div className="kx-entitlement-flags">{([['mcpAccess', e.mcp], ['validationRuntime', e.validationRuntime], ['presence', e.presence], ['onPremRuntime', e.onPremRuntime]] as const).map(([key, on]) => <span key={key} className={on ? 'is-on' : ''}>{on ? <Check size={11} /> : <Minus size={11} />}{t(key)}</span>)}</div>
    </section>
  </div>
}

function UsagePanel({ empty }: { empty: boolean }) {
  const data = useSettingsCustomizeStore()
  const { t, locale } = usePrototypeLocale()
  const [dimension, setDimension] = useState<'system' | 'agent' | 'repository' | 'user' | 'outcome' | 'model' | 'meter'>('system')
  const ledger = data.storyPointLedger
  const analytics = data.usageAnalytics
  if (empty) return <EmptyBlock title={t('noUsage')} body={t('noUsageHelp')} />
  const daysRemaining = Math.max(1, Math.round(ledger.available / Math.max(ledger.totalUsed / 12, 1)))
  const dimensions = {
    system: analytics.bySystem, agent: analytics.byAgentMode, repository: analytics.byRepository,
    user: analytics.byUser, outcome: analytics.byOutcome, model: analytics.byModel, meter: analytics.byMeterCategory,
  }
  const exportUsage = (format: 'csv' | 'json') => {
    const payload = format === 'json'
      ? JSON.stringify({ ledger, analytics }, null, 2)
      : `metric,value,unit\navailable,${ledger.available},story_points\nreserved,${ledger.reserved},story_points\nledger_consumption,${analytics.ledgerConsumption},story_points\ndelivery_attributed,${analytics.deliveryAttributed},story_points`
    const href = URL.createObjectURL(new Blob([payload], { type: format === 'json' ? 'application/json' : 'text/csv' }))
    const link = document.createElement('a'); link.href = href; link.download = `konteks-usage.${format}`; link.click(); URL.revokeObjectURL(href)
  }
  return <div className="kx-billing-stack">
    <div className="kx-billing-toolbar"><div><h3>{t('storyPointLedger')}</h3><p>{t('figuresAsOf')} {formatDateTime(ledger.updatedAt, locale)}</p></div><div className="kx-row-actions"><button className="kx-button kx-button--small" onClick={() => exportUsage('csv')}><Download size={13} />CSV</button><button className="kx-button kx-button--small" onClick={() => exportUsage('json')}><Download size={13} />JSON</button></div></div>
    <div className="kx-ledger-band">{([['available', ledger.available], ['reserved', ledger.reserved], ['purchased', ledger.totalPurchased], ['consumed', ledger.totalUsed]] as const).map(([key, value]) => <div key={key}><span>{t(key)}</span><strong>{value.toLocaleString(locale)}</strong><small>{t('storyPoints')}</small></div>)}<div><span>{t('estimatedRemaining')}</span><strong>~{daysRemaining}</strong><small>{t('days')}</small></div><div><span>{t('billingCurrency')}</span><strong>{ledger.currency}</strong><small>{t('currentPeriod')}</small></div></div>
    <section className="kx-billing-surface"><div className="kx-billing-section-head"><div><span className="kx-eyebrow">{t('meterBreakdown')}</span><h3>{t('usageByCategory')}</h3></div></div><div className="kx-meter-grid">{Object.entries(ledger.breakdown).map(([key, value]) => <div key={key}><span>{t(`meter${key[0].toUpperCase()}${key.slice(1)}` as PrototypeCopyKey)}</span><strong>{value.toLocaleString(locale)}</strong></div>)}</div></section>
    <section className="kx-billing-surface"><div className="kx-billing-section-head"><div><span className="kx-eyebrow">{t('usageAnalytics')}</span><h3>{t('ledgerAndDelivery')}</h3></div>{analytics.reconciled ? <Status tone="success">{t('reconciled')}</Status> : <Status tone="warning">{t('needsReview')}</Status>}</div>
      <div className="kx-basis-grid"><div><span>{t('ledgerConsumption')}</span><strong>{analytics.ledgerConsumption.toLocaleString(locale)}</strong><p>{t('ledgerConsumptionHelp')}</p></div><div><span>{t('deliveryAttributed')}</span><strong>{analytics.deliveryAttributed.toLocaleString(locale)}</strong><p>{t('deliveryAttributedHelp')}</p></div></div><p className="kx-field-help">{t('metricBasisDisclosure')}</p>
      <div className="kx-analytics-stats">
        <div><span>{t('totalSessions')}</span><strong>{analytics.totalSessions.toLocaleString(locale)}</strong></div>
        <div><span>{t('totalInputTokens')}</span><strong>{compact(analytics.totalInputTokens)}</strong></div>
        <div><span>{t('totalOutputTokens')}</span><strong>{compact(analytics.totalOutputTokens)}</strong></div>
        <div><span>{t('runtimeMinutes')}</span><strong>{analytics.runtimeMinutes}</strong></div>
        <div><span>{t('validationMinutes')}</span><strong>{analytics.validationMinutes}</strong></div>
        <div><span>{t('catalogWrites')}</span><strong>+{analytics.catalogGrowth.total}</strong><small>{analytics.catalogGrowth.systems} {t('systems').toLowerCase()} · {analytics.catalogGrowth.components} {t('catalogComponents')} · {analytics.catalogGrowth.repositories} {t('repositories').toLowerCase()}</small></div>
        <div><span>{t('quoteAbandonment')}</span><strong>{(analytics.quoteAbandonment.rate * 100).toFixed(1)}%</strong><small>{analytics.quoteAbandonment.abandoned}/{analytics.quoteAbandonment.created}</small></div>
      </div>
    </section>
    <section className="kx-billing-surface"><div className="kx-billing-section-head"><div><span className="kx-eyebrow">{t('providerTelemetry')}</span><h3>{t('providerModelTokens')}</h3></div><span className="kx-settings__note">{t('tokensNotMoney')}</span></div><div className="kx-table-scroll"><table className="kx-data-table"><thead><tr><th>{t('providerModel')}</th><th>{t('events')}</th><th>{t('inputTokens')}</th><th>{t('outputTokens')}</th><th>{t('cacheRead')}</th><th>{t('cacheWrite')}</th></tr></thead><tbody>{analytics.providerModels.map((row) => <tr key={`${row.provider}-${row.model}`}><td><strong>{row.provider}</strong><small>{row.model}</small></td><td>{compact(row.events)}</td><td>{compact(row.inputTokens)}</td><td>{compact(row.outputTokens)}</td><td>{compact(row.cacheReadTokens)}</td><td>{compact(row.cacheWriteTokens)}</td></tr>)}</tbody></table></div></section>
    <section className="kx-billing-surface"><div className="kx-billing-section-head"><div><span className="kx-eyebrow">{t('reconciledDimensions')}</span><h3>{t('storyPointRankings')}</h3></div></div><div className="kx-dimension-tabs" role="tablist" aria-label={t('reconciledDimensions')}>{(['system', 'agent', 'repository', 'user', 'outcome', 'model', 'meter'] as const).map((item) => <button key={item} role="tab" aria-selected={dimension === item} onClick={() => setDimension(item)}>{t(`dimension${item[0].toUpperCase()}${item.slice(1)}` as PrototypeCopyKey)}</button>)}</div><RankedBars rows={dimensions[dimension]} /></section>
  </div>
}

function RankedBars({ rows }: { rows: BillingUsageRow[] }) {
  const { locale, t } = usePrototypeLocale()
  const max = Math.max(...rows.map((row) => row.storyPoints), 1)
  return <div className="kx-ranked-bars">{rows.map((row) => <div key={row.id}><div><span>{row.label}</span><strong>{row.storyPoints.toLocaleString(locale)} <small>{t('storyPoints')}</small></strong></div><div className="kx-progress"><span style={{ width: `${Math.round(row.storyPoints / max * 100)}%` }} /></div><small>{row.count.toLocaleString(locale)} {t('events').toLowerCase()}</small></div>)}</div>
}

function PlansPanel({ empty, failPayments }: { empty: boolean; failPayments: boolean }) {
  const data = useSettingsCustomizeStore()
  const { t, locale } = usePrototypeLocale()
  const [selected, setSelected] = useState<string | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const failOnce = useRef(failPayments)
  if (empty) return <EmptyBlock title={t('noPlans')} body={t('noPlansHelp')} />
  const plan = data.plans.find((item) => item.id === selected)
  const checkout = async (next: BillingPlan) => {
    await delay(500)
    if (failOnce.current) { failOnce.current = false; throw new Error('mock payment failure') }
    updateSettingsCustomizeState((state) => ({ ...state,
      subscription: { ...state.subscription, planId: next.id, planName: next.name, currency: next.currency, monthlyPrice: next.monthlyPrice, includedStoryPoints: next.includedStoryPoints, renewalDate: '2026-10-02T00:00:00.000Z' },
      entitlements: { ...state.entitlements, seatLimit: next.seatLimit, systemLimit: next.systemLimit, repositoryLimit: next.repositoryLimit, support: next.support, mcp: next.mcp, validationRuntime: next.validationRuntime, presence: next.presence, onPremRuntime: next.onPremRuntime },
      transactions: [{ id: nextPrototypeId('TRX'), createdAt: new Date().toISOString(), type: 'subscription', description: `${next.name} plan ${next.id === state.subscription.planId ? 'renewal' : 'change'}`, paymentMethod: 'mock checkout', currency: next.currency, amount: next.monthlyPrice, netAmount: Math.round(next.monthlyPrice / 1.11), taxAmount: next.monthlyPrice - Math.round(next.monthlyPrice / 1.11), status: 'settled' }, ...state.transactions],
    }))
  }
  const rows: { label: PrototypeCopyKey; render: (p: BillingPlan) => React.ReactNode }[] = [
    { label: 'price', render: (p) => p.monthlyPrice ? formatMoney(p.monthlyPrice, p.currency, locale) : p.id === 'enterprise' ? t('custom') : t('free') },
    { label: 'includedStoryPoints', render: (p) => p.includedStoryPoints.toLocaleString(locale) },
    { label: 'seatMinimum', render: (p) => p.seatMinimum }, { label: 'seatLimit', render: (p) => limitValue(p.seatLimit, t('unlimited'), locale) },
    { label: 'systems', render: (p) => limitValue(p.systemLimit, t('unlimited'), locale) }, { label: 'repositories', render: (p) => limitValue(p.repositoryLimit, t('unlimited'), locale) },
    { label: 'support', render: (p) => p.support }, { label: 'byok', render: (p) => <BooleanMark on={p.byok} /> }, { label: 'mcpAccess', render: (p) => <BooleanMark on={p.mcp} /> },
    { label: 'validationRuntime', render: (p) => <BooleanMark on={p.validationRuntime} /> }, { label: 'presence', render: (p) => <BooleanMark on={p.presence} /> }, { label: 'onPremRuntime', render: (p) => <BooleanMark on={p.onPremRuntime} /> },
  ]
  return <div className="kx-billing-stack"><div className="kx-billing-toolbar"><div><h3>{t('comparePlans')}</h3><p>{t('comparePlansHelp')}</p></div></div><div className="kx-table-scroll kx-plan-table-wrap"><table className="kx-data-table kx-plan-table"><thead><tr><th>{t('planFeature')}</th>{data.plans.map((p) => <th key={p.id} className={p.id === data.subscription.planId ? 'is-current' : ''}><strong>{p.name}</strong>{p.id === data.subscription.planId && <Status tone="success">{t('current')}</Status>}{p.id === 'enterprise' ? <button className="kx-button kx-button--small" disabled>{t('contactSales')}</button> : <button className="kx-button kx-button--small" onClick={(event) => { triggerRef.current = event.currentTarget; setSelected(p.id) }}>{p.id === data.subscription.planId ? t('renew') : t('choose')}</button>}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th>{t(row.label)}</th>{data.plans.map((p) => <td key={p.id} className={p.id === data.subscription.planId ? 'is-current' : ''}>{row.render(p)}</td>)}</tr>)}</tbody></table></div><p className="kx-settings__note">{t('providerCostDisclosure')}</p>{plan && <PlanCheckoutDialog plan={plan} currentPlanId={data.subscription.planId} triggerRef={triggerRef} onConfirm={() => checkout(plan)} onClose={() => setSelected(null)} />}</div>
}

function ProvidersPanel({ empty }: { empty: boolean }) {
  const data = useSettingsCustomizeStore()
  const { t, locale } = usePrototypeLocale()
  const [dialog, setDialog] = useState<{ kind: 'edit' | 'rotate' | 'remove'; id?: string } | null>(null)
  const [notice, setNotice] = useState('')
  const [allowed, setAllowed] = useState(data.providerPolicy.allowedProviders)
  const triggerRef = useRef<HTMLElement | null>(null)
  const allProviders = ['OpenAI', 'Anthropic', 'Azure OpenAI', 'OpenAI-compatible']
  const open = (next: typeof dialog, trigger: HTMLElement) => { triggerRef.current = trigger; setDialog(next); setNotice('') }
  const save = async (draft: ProviderDraft) => {
    await delay(350)
    updateSettingsCustomizeState((state) => ({ ...state, providers: dialog?.id
      ? state.providers.map((p) => p.id === dialog.id ? { ...p, ...draft, status: 'connected', lastVerified: t('justNow') } : p)
      : [...state.providers, { id: nextPrototypeId('provider'), ...draft, scope: 'workspace', maskedSuffix: 'N8Q4', partnerDisclosed: false, externalSpend: null, status: 'connected', lastVerified: t('justNow') }] }))
    setDialog(null); setNotice(t('providerSaved'))
  }
  const patch = (id: string, changes: Partial<ProviderConnection>, message: string) => { updateSettingsCustomizeState((state) => ({ ...state, providers: state.providers.map((p) => p.id === id ? { ...p, ...changes } : p) })); setNotice(message) }
  const provider = dialog?.id ? data.providers.find((item) => item.id === dialog.id) : undefined
  if (empty) return <EmptyBlock title={t('noProviders')} body={t('noProvidersHelp')} />
  return <div className="kx-billing-stack">
    <div className="kx-billing-toolbar"><div><h3>{t('providerConnect')}</h3><p>{t('providerConnectHelp')}</p></div><button className="kx-button kx-button--primary" onClick={(event) => open({ kind: 'edit' }, event.currentTarget)}><Plus size={14} />{t('addProvider')}</button></div>{notice && <p className="kx-notice" role="status">{notice}</p>}
    <div className="kx-provider-list">{data.providers.map((item) => <article className="kx-provider-row" key={item.id}><div className="kx-provider-main"><div className="kx-provider-title"><div><strong>{item.name}</strong><span>{item.provider}{item.partnerDisclosed ? ` · ${t('partner')}` : ''}</span></div><Status tone={item.status === 'connected' ? 'success' : item.status === 'needs-setup' || item.status === 'unverified' ? 'warning' : 'danger'}>{t(`providerStatus${statusSuffix(item.status)}` as PrototypeCopyKey)}</Status></div><dl className="kx-provider-facts"><div><dt>{t('credentialType')}</dt><dd>{item.credentialKind === 'api-key' ? t('meteredApiKey') : t('subscriptionOauth')}</dd></div><div><dt>{t('region')}</dt><dd>{item.region}</dd></div><div><dt>{t('scope')}</dt><dd>{t('workspaceWide')}</dd></div><div><dt>{t('lastVerified')}</dt><dd>{item.lastVerified}</dd></div><div><dt>{t('maskedKey')}</dt><dd>•••• {item.maskedSuffix}</dd></div><div><dt>{t('externalProviderSpend')}</dt><dd>{item.externalSpend ? `${formatMoney(item.externalSpend.amount, item.externalSpend.currency, locale)} · ${item.externalSpend.period}` : t('notReported')}</dd></div></dl><p className="kx-provider-models">{t('modelFamilies')}: {item.modelFamilies.join(', ')}</p></div><div className="kx-provider-actions"><button className="kx-button kx-button--small" aria-label={`${t('edit')} ${item.name}`} onClick={(event) => open({ kind: 'edit', id: item.id }, event.currentTarget)}><Pencil size={12} />{t('edit')}</button>{item.status === 'disabled' ? <button className="kx-button kx-button--small" onClick={() => patch(item.id, { status: 'connected', lastVerified: t('justNow') }, t('providerRestored'))}>{t('restore')}</button> : <><button className="kx-button kx-button--small" onClick={() => patch(item.id, { status: 'connected', lastVerified: t('justNow') }, t('providerVerified'))}><RefreshCw size={12} />{t('verify')}</button><button className="kx-button kx-button--small" onClick={(event) => open({ kind: 'rotate', id: item.id }, event.currentTarget)}><RotateCw size={12} />{t('rotate')}</button><button className="kx-button kx-button--small" onClick={() => patch(item.id, { status: 'disabled' }, t('providerDisabled'))}>{t('disable')}</button></>}<button className="kx-icon-btn" aria-label={`${t('remove')} ${item.name}`} onClick={(event) => open({ kind: 'remove', id: item.id }, event.currentTarget)}><Trash2 size={14} /></button></div></article>)}</div>
    <form className="kx-billing-surface" onSubmit={(event) => { event.preventDefault(); updateSettingsCustomizeState((state) => ({ ...state, providerPolicy: { allowedProviders: allowed } })); setNotice(t('providerPolicySaved')) }}><div className="kx-billing-section-head"><div><span className="kx-eyebrow">{t('governance')}</span><h3>{t('providerPolicy')}</h3><p>{t('providerPolicyHelp')}</p></div><button className="kx-button kx-button--small">{t('savePolicy')}</button></div><div className="kx-policy-options">{allProviders.map((name) => <label key={name}><input type="checkbox" checked={allowed.includes(name)} onChange={() => setAllowed((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name])} />{name}</label>)}</div></form>
    {dialog?.kind === 'edit' && <ProviderDialog provider={provider} providers={data.providers} triggerRef={triggerRef} onSave={save} onClose={() => setDialog(null)} />}
    {dialog?.kind === 'rotate' && provider && <ProviderCredentialDialog provider={provider} triggerRef={triggerRef} onConfirm={async (credential) => { await delay(350); if (credential === 'invalid-demo') throw new Error(); patch(provider.id, { maskedSuffix: credential.slice(-4).toUpperCase(), status: 'connected', lastVerified: t('justNow') }, t('providerRotated')) }} onClose={() => setDialog(null)} />}
    {dialog?.kind === 'remove' && provider && <ConfirmProviderRemovalDialog provider={provider} triggerRef={triggerRef} onConfirm={async () => { await delay(350); updateSettingsCustomizeState((state) => ({ ...state, providers: state.providers.filter((p) => p.id !== provider.id) })); setNotice(t('providerRemoved')) }} onClose={() => setDialog(null)} />}
  </div>
}

function BudgetsPanel({ empty }: { empty: boolean }) {
  const data = useSettingsCustomizeStore()
  const { t, locale } = usePrototypeLocale()
  const [draft, setDraft] = useState(data.budgetPolicy)
  const [saved, setSaved] = useState(false)
  const duplicateCurrency = new Set(draft.providerSpendWarnings.map((row) => row.currency)).size !== draft.providerSpendWarnings.length
  if (empty) return <EmptyBlock title={t('budgetsUnavailable')} body={t('budgetsUnavailableHelp')} />
  const setNumber = (key: keyof BudgetPolicy, value: string) => setDraft({ ...draft, [key]: value === '' ? null : Math.max(0, Number(value)) })
  const updateWarning = (index: number, patch: Partial<ProviderSpendWarning>) => setDraft({ ...draft, providerSpendWarnings: draft.providerSpendWarnings.map((row, i) => i === index ? { ...row, ...patch } : row) })
  const submit = (event: FormEvent) => { event.preventDefault(); if (duplicateCurrency) return; updateSettingsCustomizeState((state) => ({ ...state, budgetPolicy: draft })); setSaved(true) }
  return <form className="kx-billing-stack" onSubmit={submit}><div className="kx-billing-toolbar"><div><h3>{t('budgetControls')}</h3><p>{t('budgetControlsHelp')}</p></div>{saved && <Status tone="success">{t('saved')}</Status>}</div>
    <fieldset className="kx-budget-fieldset"><legend>{t('storyPointCaps')}</legend><div className="kx-form-columns kx-form-columns--three">{([['workspaceMonthlyCap', 'monthlyCap'], ['perRunMaximum', 'runCap'], ['approvalThreshold', 'approvalThreshold']] as const).map(([key, label]) => <label className="kx-field" key={key}><span>{t(label)}</span><input type="number" min="0" placeholder={t('uncapped')} value={draft[key] ?? ''} onChange={(event) => { setSaved(false); setNumber(key, event.target.value) }} /></label>)}</div><div className="kx-form-columns kx-form-columns--two">{([['perUserCap', 'perUserCap'], ['perSystemCap', 'perSystemCap'], ['perRepositoryCap', 'perRepositoryCap'], ['autoRechargeThreshold', 'autoRecharge']] as const).map(([key, label]) => <label className="kx-field" key={key}><span>{t(label)} <small>{t('displayOnly')}</small></span><input disabled value={draft[key] ?? ''} placeholder={t('notSynced')} /><small>{t('notSyncedHelp')}</small></label>)}</div><div className="kx-enforcement"><ShieldCheck size={15} /><div><strong>{t('hardStop')}</strong><p>{t('hardStopHelp')}</p></div></div></fieldset>
    <fieldset className="kx-budget-fieldset kx-budget-fieldset--money"><legend>{t('providerSpendWarnings')}</legend><p>{t('providerSpendWarningsHelp')}</p>{draft.legacyProviderSpendPoints !== null && <div className="kx-callout kx-callout--warning"><AlertTriangle size={16} /><div><strong>{t('legacyPolicyReview')}</strong><p>{t('legacyPolicyHelp')} {draft.legacyProviderSpendPoints.toLocaleString(locale)} {t('storyPoints')}.</p></div></div>}<div className="kx-spend-warning-list">{draft.providerSpendWarnings.map((row, index) => <div key={index}><label className="kx-field"><span>{t('warnAbove')}</span><input type="number" min="0" value={row.amount} onChange={(event) => updateWarning(index, { amount: Number(event.target.value) })} /></label><label className="kx-field"><span>{t('billingCurrency')}</span><select value={row.currency} onChange={(event) => updateWarning(index, { currency: event.target.value as 'IDR' | 'USD' })}><option>IDR</option><option>USD</option></select></label><button className="kx-icon-btn" type="button" aria-label={`${t('remove')} ${index + 1}`} onClick={() => setDraft({ ...draft, providerSpendWarnings: draft.providerSpendWarnings.filter((_, i) => i !== index) })}><X size={14} /></button></div>)}</div>{duplicateCurrency && <p className="kx-validation" role="alert">{t('duplicateCurrency')}</p>}<button className="kx-button kx-button--small" type="button" disabled={draft.providerSpendWarnings.length >= 2} onClick={() => setDraft({ ...draft, providerSpendWarnings: [...draft.providerSpendWarnings, { currency: draft.providerSpendWarnings.some((row) => row.currency === 'IDR') ? 'USD' : 'IDR', amount: 0 }] })}><Plus size={13} />{t('addThreshold')}</button></fieldset>
    <section className="kx-billing-surface"><div className="kx-billing-section-head"><div><span className="kx-eyebrow">{t('currentBudgets')}</span><h3>{t('budgetByScope')}</h3></div></div><div className="kx-budget-scopes">{data.budgetScopes.map((scope) => { const pct = scope.limit && scope.consumed !== null ? Math.min(100, scope.consumed / scope.limit * 100) : 0; return <div key={scope.id}><div><span><strong>{scope.label}</strong><small>{t(`scope${scope.scope[0].toUpperCase()}${scope.scope.slice(1)}` as PrototypeCopyKey)}</small></span><Status tone={scope.status === 'ok' ? 'success' : scope.status === 'approaching' ? 'warning' : scope.status === 'exceeded' ? 'danger' : 'neutral'}>{t(`budgetStatus${statusSuffix(scope.status)}` as PrototypeCopyKey)}</Status></div><p>{scope.consumed !== null ? `${t('consumed')}: ${scope.consumed.toLocaleString(locale)}${scope.limit === null ? ` · ${t('uncapped')}` : ` / ${scope.limit.toLocaleString(locale)}`}` : `${t('observedConsumption')}: ${scope.observed?.toLocaleString(locale) ?? '—'}`}</p>{scope.limit !== null && scope.consumed !== null && <div className="kx-progress"><span style={{ width: `${pct}%` }} /></div>}{scope.consumed === null && <small>{t('aggregateNotEnforced')}</small>}</div> })}</div></section><button className="kx-button kx-button--primary" disabled={duplicateCurrency}>{t('saveBudgetPolicy')}</button>
  </form>
}

function TopupPanel({ empty, failPayments }: { empty: boolean; failPayments: boolean }) {
  const data = useSettingsCustomizeStore()
  const { t, locale } = usePrototypeLocale()
  const [selected, setSelected] = useState<string | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const failOnce = useRef(failPayments)
  const packageItem = data.topupPackages.find((item) => item.id === selected)
  if (empty) return <EmptyBlock title={t('noTopupPackages')} body={t('noTopupPackagesHelp')} />
  const buy = async () => {
    if (!packageItem) return
    await delay(500)
    if (failOnce.current) { failOnce.current = false; throw new Error('mock payment failure') }
    updateSettingsCustomizeState((state) => ({ ...state, storyPointLedger: { ...state.storyPointLedger, available: state.storyPointLedger.available + packageItem.storyPoints, totalPurchased: state.storyPointLedger.totalPurchased + packageItem.storyPoints, updatedAt: new Date().toISOString() }, transactions: [{ id: nextPrototypeId('TRX'), createdAt: new Date().toISOString(), type: 'top-up', description: `${packageItem.storyPoints.toLocaleString()} Story Points`, paymentMethod: 'mock checkout', currency: packageItem.currency, amount: packageItem.grossAmount, netAmount: packageItem.netAmount, taxAmount: packageItem.taxAmount, status: 'settled' }, ...state.transactions] }))
  }
  return <div className="kx-billing-stack"><div className="kx-billing-toolbar"><div><h3>{t('addOverageBalance')}</h3><p>{t('addOverageBalanceHelp')}</p></div><Status>{data.storyPointLedger.currency}</Status></div><div className="kx-topup-grid">{data.topupPackages.map((item) => <button key={item.id} onClick={(event) => { triggerRef.current = event.currentTarget; setSelected(item.id) }}><span>{item.label}</span><strong>{item.storyPoints.toLocaleString(locale)} <small>{t('storyPoints')}</small></strong><em>{formatMoney(item.grossAmount, item.currency, locale)}</em><small>{t('includesTax')} {formatMoney(item.taxAmount, item.currency, locale)}</small></button>)}</div><div className="kx-callout"><CircleDollarSign size={16} /><div><strong>{t('billingCurrency')}</strong><p>{t('topupCurrencyHelp')}</p></div></div>{packageItem && <TopupCheckoutDialog packageItem={packageItem} triggerRef={triggerRef} onConfirm={buy} onClose={() => setSelected(null)} />}</div>
}

function TransactionsPanel({ empty, error, onRetry }: { empty: boolean; error: boolean; onRetry: () => void }) {
  const data = useSettingsCustomizeStore()
  const { t, locale } = usePrototypeLocale()
  const [page, setPage] = useState(0)
  const pageSize = 5
  const rows = empty ? [] : data.transactions.slice(page * pageSize, (page + 1) * pageSize)
  const pages = Math.max(1, Math.ceil(data.transactions.length / pageSize))
  if (empty) return <EmptyBlock title={t('noTransactions')} body={t('noTransactionsHelp')} />
  return <div className="kx-billing-stack">{error && <div className="kx-callout kx-callout--danger" role="alert"><AlertTriangle size={16} /><div><strong>{t('transactionsDelayed')}</strong><p>{t('staleDataVisible')}</p></div><button className="kx-button kx-button--small" onClick={onRetry}>{t('retry')}</button></div>}<div className="kx-billing-toolbar"><div><h3>{t('transactionHistory')}</h3><p>{t('transactionHistoryHelp')}</p></div><span className="kx-settings__note">{data.transactions.length} {t('records')}</span></div><div className="kx-table-scroll"><table className="kx-data-table"><thead><tr><th>{t('date')}</th><th>{t('orderId')}</th><th>{t('transactionType')}</th><th>{t('paymentMethod')}</th><th>{t('amount')}</th><th>{t('status')}</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td>{formatDateTime(item.createdAt, locale)}</td><td><code>{item.id}</code></td><td>{t(`transaction${statusSuffix(item.type)}` as PrototypeCopyKey)}</td><td>{item.paymentMethod}</td><td><strong>{formatMoney(item.amount, item.currency, locale)}</strong><small>{t('net')} {formatMoney(item.netAmount, item.currency, locale)} · {t('tax')} {formatMoney(item.taxAmount, item.currency, locale)}</small></td><td><Status tone={transactionTone(item.status)}>{t(`transactionStatus${statusSuffix(item.status)}` as PrototypeCopyKey)}</Status></td></tr>)}</tbody></table></div><div className="kx-pagination"><span>{t('page')} {page + 1} {t('of')} {pages}</span><div><button className="kx-icon-btn" aria-label={t('previous')} disabled={page === 0} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={15} /></button><button className="kx-icon-btn" aria-label={t('next')} disabled={page + 1 >= pages} onClick={() => setPage((value) => value + 1)}><ChevronRight size={15} /></button></div></div></div>
}

function BooleanMark({ on }: { on: boolean }) {
  const { t } = usePrototypeLocale()
  return <>
    {on ? <Check className="kx-boolean-on" size={15} aria-hidden="true" /> : <Minus size={15} aria-hidden="true" />}
    <span className="kx-visually-hidden">{on ? t('includedFeature') : t('notIncludedFeature')}</span>
  </>
}
function compact(value: number) { return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toLocaleString() }
function delay(ms: number) { return new Promise<void>((resolve) => window.setTimeout(resolve, ms)) }
function limitValue(value: number | null, unlimited: string, locale: string) { return value === null ? unlimited : value.toLocaleString(locale) }
function formatDate(value: string, locale: string) { return new Date(value).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }
function formatDateTime(value: string, locale: string) { return new Date(value).toLocaleString(locale === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
function statusSuffix(value: string) { return value.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('') }
function transactionTone(status: Transaction['status']): 'success' | 'warning' | 'danger' { return status === 'settled' || status === 'captured' || status === 'refunded' ? 'success' : status === 'pending' || status === 'partially-refunded' ? 'warning' : 'danger' }
