import { AlertTriangle, CheckCircle2, CreditCard, KeyRound } from 'lucide-react'
import { useState, type RefObject } from 'react'
import { usePrototypeLocale } from '../../i18n/prototypeLocale'
import type { BillingPlan, ProviderConnection, TopupPackage } from '../../state/settingsCustomizeStore'
import NestedFormDialog from '../shared/NestedFormDialog'

export function PlanCheckoutDialog({ plan, currentPlanId, triggerRef, onConfirm, onClose }: {
  plan: BillingPlan
  currentPlanId: string
  triggerRef: RefObject<HTMLElement | null>
  onConfirm: () => Promise<void>
  onClose: () => void
}) {
  const { t, locale } = usePrototypeLocale()
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'failure'>('idle')
  const busy = status === 'pending'
  const renewal = plan.id === currentPlanId
  const confirm = async () => {
    setStatus('pending')
    try { await onConfirm(); setStatus('success') }
    catch { setStatus('failure') }
  }
  return <NestedFormDialog title={renewal ? t('renewPlan') : t('changePlan')} description={t('checkoutHelp')} busy={busy} onClose={onClose} returnFocusRef={triggerRef}
    footer={status === 'success'
      ? <button className="kx-button kx-button--primary" onClick={onClose}>{t('done')}</button>
      : <><button className="kx-button" disabled={busy} onClick={onClose}>{t('cancel')}</button><button className="kx-button kx-button--primary" disabled={busy} onClick={confirm}>{busy ? t('processingPayment') : status === 'failure' ? t('retryPayment') : renewal ? t('renewPlan') : t('confirmPlan')}</button></>}>
    <div className="kx-dialog-form">
      <div className="kx-payment-hero"><CreditCard size={20} /><div><span>{t('selectedPlan')}</span><strong>{plan.name}</strong></div><strong>{formatMoney(plan.monthlyPrice, plan.currency, locale)}<small>{t('perMonth')}</small></strong></div>
      <dl className="kx-detail-grid"><div><dt>{t('includedStoryPoints')}</dt><dd>{plan.includedStoryPoints.toLocaleString(locale)}</dd></div><div><dt>{t('billingPeriod')}</dt><dd>{t('monthly')}</dd></div><div><dt>{t('seatLimit')}</dt><dd>{formatLimit(plan.seatLimit, t('unlimited'), locale)}</dd></div><div><dt>{t('support')}</dt><dd>{plan.support}</dd></div></dl>
      <p className="kx-field-help">{t('providerCostDisclosure')}</p>
      {status === 'success' && <div className="kx-callout kx-callout--success" role="status"><CheckCircle2 size={16} /><div><strong>{t('paymentConfirmed')}</strong><p>{t('planUpdated')}</p></div></div>}
      {status === 'failure' && <div className="kx-callout kx-callout--danger" role="alert"><AlertTriangle size={16} /><div><strong>{t('paymentFailed')}</strong><p>{t('paymentFailedHelp')}</p></div></div>}
    </div>
  </NestedFormDialog>
}

export function TopupCheckoutDialog({ packageItem, triggerRef, onConfirm, onClose }: {
  packageItem: TopupPackage
  triggerRef: RefObject<HTMLElement | null>
  onConfirm: () => Promise<void>
  onClose: () => void
}) {
  const { t, locale } = usePrototypeLocale()
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'failure'>('idle')
  const busy = status === 'pending'
  const confirm = async () => {
    setStatus('pending')
    try { await onConfirm(); setStatus('success') }
    catch { setStatus('failure') }
  }
  return <NestedFormDialog title={t('confirmTopup')} description={t('topupConfirmHelp')} busy={busy} onClose={onClose} returnFocusRef={triggerRef}
    footer={status === 'success'
      ? <button className="kx-button kx-button--primary" onClick={onClose}>{t('done')}</button>
      : <><button className="kx-button" disabled={busy} onClick={onClose}>{t('cancel')}</button><button className="kx-button kx-button--primary" disabled={busy} onClick={confirm}>{busy ? t('processingPayment') : status === 'failure' ? t('retryPayment') : t('confirmPurchase')}</button></>}>
    <div className="kx-dialog-form">
      <div className="kx-payment-hero"><KeyRound size={20} /><div><span>{packageItem.label}</span><strong>{packageItem.storyPoints.toLocaleString(locale)} {t('storyPoints')}</strong></div><strong>{formatMoney(packageItem.grossAmount, packageItem.currency, locale)}</strong></div>
      <dl className="kx-payment-breakdown"><div><dt>{t('netAmount')}</dt><dd>{formatMoney(packageItem.netAmount, packageItem.currency, locale)}</dd></div><div><dt>{t('taxAmount')}</dt><dd>{formatMoney(packageItem.taxAmount, packageItem.currency, locale)}</dd></div><div><dt>{t('total')}</dt><dd>{formatMoney(packageItem.grossAmount, packageItem.currency, locale)}</dd></div></dl>
      <p className="kx-field-help">{t('topupCurrencyHelp')}</p>
      {status === 'success' && <div className="kx-callout kx-callout--success" role="status"><CheckCircle2 size={16} /><div><strong>{t('topupComplete')}</strong><p>{t('balanceUpdated')}</p></div></div>}
      {status === 'failure' && <div className="kx-callout kx-callout--danger" role="alert"><AlertTriangle size={16} /><div><strong>{t('paymentFailed')}</strong><p>{t('paymentFailedHelp')}</p></div></div>}
    </div>
  </NestedFormDialog>
}

export function ProviderCredentialDialog({ provider, triggerRef, onConfirm, onClose }: {
  provider: ProviderConnection
  triggerRef: RefObject<HTMLElement | null>
  onConfirm: (credential: string) => Promise<void>
  onClose: () => void
}) {
  const { t } = usePrototypeLocale()
  const [credential, setCredential] = useState('')
  const [status, setStatus] = useState<'idle' | 'pending' | 'failure'>('idle')
  const busy = status === 'pending'
  const confirm = async () => {
    if (!credential.trim()) return
    setStatus('pending')
    try { await onConfirm(credential); onClose() }
    catch { setStatus('failure') }
  }
  return <NestedFormDialog title={t('rotateCredential')} description={t('rotateCredentialHelp')} busy={busy} onClose={onClose} returnFocusRef={triggerRef}
    footer={<><button className="kx-button" disabled={busy} onClick={onClose}>{t('cancel')}</button><button className="kx-button kx-button--primary" disabled={!credential.trim() || busy} onClick={confirm}>{busy ? t('validatingConnection') : t('rotate')}</button></>}>
    <div className="kx-dialog-form"><div className="kx-identity-line"><strong>{provider.name}</strong><span>{provider.provider} · •••• {provider.maskedSuffix}</span></div><label className="kx-field"><span>{provider.credentialKind === 'subscription-oauth' ? t('oauthToken') : t('apiKey')}</span><input autoFocus type="password" value={credential} onChange={(event) => { setCredential(event.target.value); setStatus('idle') }} /></label><p className="kx-field-help">{t('credentialNeverShown')}</p>{status === 'failure' && <p className="kx-validation" role="alert">{t('validationFailed')}</p>}</div>
  </NestedFormDialog>
}

export function ConfirmProviderRemovalDialog({ provider, triggerRef, onConfirm, onClose }: {
  provider: ProviderConnection
  triggerRef: RefObject<HTMLElement | null>
  onConfirm: () => Promise<void>
  onClose: () => void
}) {
  const { t } = usePrototypeLocale()
  const [busy, setBusy] = useState(false)
  const confirm = async () => { setBusy(true); try { await onConfirm(); onClose() } finally { setBusy(false) } }
  return <NestedFormDialog title={t('removeProvider')} description={t('removeProviderHelp')} busy={busy} onClose={onClose} returnFocusRef={triggerRef} size="compact"
    footer={<><button className="kx-button" disabled={busy} onClick={onClose}>{t('cancel')}</button><button className="kx-button kx-button--danger" disabled={busy} onClick={confirm}>{busy ? t('removing') : t('remove')}</button></>}>
    <div className="kx-callout kx-callout--danger"><AlertTriangle size={17} /><div><strong>{provider.name}</strong><p>{t('removeProviderWarning')}</p></div></div>
  </NestedFormDialog>
}

export function formatMoney(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency, maximumFractionDigits: currency === 'IDR' ? 0 : 2 }).format(amount)
}

function formatLimit(value: number | null, unlimited: string, locale: string) {
  return value === null ? unlimited : value.toLocaleString(locale)
}
