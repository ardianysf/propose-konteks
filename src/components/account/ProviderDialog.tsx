import { useMemo, useState, type FormEvent, type RefObject } from 'react'
import { usePrototypeLocale } from '../../i18n/prototypeLocale'
import type { ProviderConnection } from '../../state/settingsCustomizeStore'
import NestedFormDialog from '../shared/NestedFormDialog'

const PROVIDERS = ['OpenAI', 'Anthropic', 'Azure OpenAI', 'OpenAI-compatible'] as const
const DEFAULT_ENDPOINTS: Record<(typeof PROVIDERS)[number], string> = {
  OpenAI: 'https://api.openai.com/v1',
  Anthropic: 'https://api.anthropic.com',
  'Azure OpenAI': 'https://example.openai.azure.com',
  'OpenAI-compatible': 'https://api.example.com/v1',
}

function isHttpsUrl(value: string) {
  try { return new URL(value).protocol === 'https:' } catch { return false }
}

export interface ProviderDraft {
  name: string
  provider: string
  endpoint: string
  credentialKind: 'api-key' | 'subscription-oauth'
  region: string
  modelFamilies: string[]
}

export default function ProviderDialog({
  provider,
  providers,
  triggerRef,
  onSave,
  onClose,
}: {
  provider?: ProviderConnection
  providers: ProviderConnection[]
  triggerRef: RefObject<HTMLElement | null>
  onSave: (draft: ProviderDraft) => Promise<void>
  onClose: () => void
}) {
  const { t } = usePrototypeLocale()
  const [name, setName] = useState(provider?.name ?? '')
  const [type, setType] = useState<(typeof PROVIDERS)[number]>((provider?.provider as (typeof PROVIDERS)[number]) ?? 'OpenAI')
  const [endpoint, setEndpoint] = useState(provider?.endpoint ?? DEFAULT_ENDPOINTS.OpenAI)
  const [credentialKind, setCredentialKind] = useState<'api-key' | 'subscription-oauth'>(provider?.credentialKind ?? 'api-key')
  const [region, setRegion] = useState(provider?.region ?? 'Global')
  const [modelFamilies, setModelFamilies] = useState(provider?.modelFamilies.join(', ') ?? 'GPT-4.1, GPT-4o')
  const [credential, setCredential] = useState('')
  const [validation, setValidation] = useState<'idle' | 'pending' | 'success' | 'failure'>('idle')
  const [saving, setSaving] = useState(false)
  const busy = validation === 'pending' || saving
  const duplicate = useMemo(() => providers.some((item) => item.id !== provider?.id && item.name.toLowerCase() === name.trim().toLowerCase()), [name, provider?.id, providers])
  const customEndpoint = type === 'Azure OpenAI' || type === 'OpenAI-compatible'
  const valid = Boolean(name.trim()) && !duplicate && isHttpsUrl(endpoint) && Boolean(modelFamilies.trim()) && (Boolean(provider) || Boolean(credential.trim()))

  const resetValidation = () => setValidation('idle')
  const validate = () => {
    if (!valid || busy) return
    setValidation('pending')
    window.setTimeout(() => setValidation(credential === 'invalid-demo' ? 'failure' : 'success'), 450)
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!valid || validation !== 'success' || busy) return
    setSaving(true)
    try { await onSave({ name: name.trim(), provider: type, endpoint: endpoint.trim(), credentialKind, region: region.trim() || 'Global', modelFamilies: modelFamilies.split(',').map((item) => item.trim()).filter(Boolean) }) }
    finally { setSaving(false) }
  }

  return (
    <NestedFormDialog
      title={provider ? t('editProvider') : t('addProvider')}
      description={t('providerFormHelp')}
      busy={busy}
      onClose={onClose}
      returnFocusRef={triggerRef}
      footer={<><button className="kx-button" type="button" disabled={busy} onClick={onClose}>{t('cancel')}</button><button className="kx-button" type="button" disabled={!valid || busy} onClick={validate}>{validation === 'pending' ? t('validatingConnection') : t('validateConnection')}</button><button className="kx-button kx-button--primary" type="submit" form="provider-form" disabled={!valid || validation !== 'success' || busy}>{saving ? t('saving') : t('save')}</button></>}
    >
      <form id="provider-form" className="kx-dialog-form" onSubmit={submit}>
        <label className="kx-field"><span>{t('connectionName')}</span><input autoFocus value={name} onChange={(event) => { setName(event.target.value); resetValidation() }} /></label>
        {duplicate && <p className="kx-validation" role="alert">{t('duplicateName')}</p>}
        <label className="kx-field"><span>{t('providerType')}</span><select value={type} onChange={(event) => { const next = event.target.value as (typeof PROVIDERS)[number]; setType(next); setEndpoint(DEFAULT_ENDPOINTS[next]); resetValidation() }}>{PROVIDERS.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="kx-field"><span>{t('credentialType')}</span><select value={credentialKind} onChange={(event) => { setCredentialKind(event.target.value as 'api-key' | 'subscription-oauth'); resetValidation() }}><option value="api-key">{t('meteredApiKey')}</option><option value="subscription-oauth">{t('subscriptionOauth')}</option></select></label>
        {customEndpoint && <><label className="kx-field"><span>{t('endpoint')}</span><input type="url" value={endpoint} aria-invalid={Boolean(endpoint) && !isHttpsUrl(endpoint)} onChange={(event) => { setEndpoint(event.target.value); resetValidation() }} /></label>{endpoint && !isHttpsUrl(endpoint) && <p className="kx-validation" role="alert">{t('invalidUrl')}</p>}</>}
        <div className="kx-form-columns"><label className="kx-field"><span>{t('region')}</span><input value={region} onChange={(event) => { setRegion(event.target.value); resetValidation() }} /></label><label className="kx-field"><span>{t('modelFamilies')}</span><input value={modelFamilies} placeholder="GPT-4.1, GPT-4o" onChange={(event) => { setModelFamilies(event.target.value); resetValidation() }} /></label></div>
        <label className="kx-field"><span>{credentialKind === 'subscription-oauth' ? t('oauthToken') : t('apiKey')}</span><input type="password" value={credential} placeholder={provider ? '••••••••••••' : credentialKind === 'subscription-oauth' ? 'oauth-…' : 'sk-…'} onChange={(event) => { setCredential(event.target.value); resetValidation() }} /></label>
        {provider && <p className="kx-field-help">{t('apiKeyEditHelp')}</p>}
        <p className="kx-field-help">{t('credentialNeverShown')}</p>
        {validation === 'success' && <p className="kx-notice" role="status">{t('validationPassed')}</p>}
        {validation === 'failure' && <p className="kx-validation" role="alert">{t('validationFailed')}</p>}
      </form>
    </NestedFormDialog>
  )
}
