import { useState, type FormEvent, type RefObject } from 'react'
import { usePrototypeLocale } from '../../i18n/prototypeLocale'
import type { ConnectionItem, ConnectionKind } from '../../state/settingsCustomizeStore'
import NestedFormDialog from '../shared/NestedFormDialog'

export type ConnectionDraft =
  | { kind: 'mcp'; name: string; provider: 'Streamable HTTP' | 'SSE' | 'stdio'; endpoint: string }
  | { kind: 'vcs'; name: string; provider: 'GitHub' | 'GitLab' | 'Bitbucket'; baseUrl: string }
  | { kind: 'search'; name: string; provider: 'OpenSearch' | 'Elasticsearch'; endpoint: string; index: string }

type ConnectorProvider = ConnectionDraft['provider']

function isHttpsUrl(value: string) { try { return new URL(value).protocol === 'https:' } catch { return false } }

export default function ConnectionDialog({ kind, connection, connections, triggerRef, onSave, onClose }: {
  kind: ConnectionKind
  connection?: ConnectionItem
  connections: ConnectionItem[]
  triggerRef: RefObject<HTMLElement | null>
  onSave: (draft: ConnectionDraft) => Promise<void>
  onClose: () => void
}) {
  const { t } = usePrototypeLocale()
  const [name, setName] = useState(connection?.name ?? '')
  const [provider, setProvider] = useState<ConnectorProvider>(connection?.provider ?? (kind === 'mcp' ? 'Streamable HTTP' : kind === 'vcs' ? 'GitHub' : 'OpenSearch'))
  const [endpoint, setEndpoint] = useState(connection && 'endpoint' in connection ? connection.endpoint : kind === 'vcs' && connection ? connection.baseUrl : '')
  const [index, setIndex] = useState(connection?.kind === 'search' ? connection.index : '')
  const [credential, setCredential] = useState('')
  const [validation, setValidation] = useState<'idle' | 'pending' | 'success' | 'failure'>('idle')
  const [saving, setSaving] = useState(false)
  const duplicate = connections.some((item) => item.id !== connection?.id && item.name.toLowerCase() === name.trim().toLowerCase())
  const locationValid = kind === 'mcp' && provider === 'stdio' ? Boolean(endpoint.trim()) : isHttpsUrl(endpoint)
  const valid = Boolean(name.trim()) && !duplicate && locationValid && (Boolean(connection) || Boolean(credential.trim())) && (kind !== 'search' || Boolean(index.trim()))
  const busy = saving || validation === 'pending'
  const reset = () => setValidation('idle')
  const validate = () => { if (!valid || busy) return; setValidation('pending'); window.setTimeout(() => setValidation(credential === 'invalid-demo' ? 'failure' : 'success'), 450) }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!valid || validation !== 'success' || busy) return
    setSaving(true)
    try {
      if (kind === 'mcp') await onSave({ kind, name: name.trim(), provider: provider as 'Streamable HTTP' | 'SSE' | 'stdio', endpoint: endpoint.trim() })
      else if (kind === 'vcs') await onSave({ kind, name: name.trim(), provider: provider as 'GitHub' | 'GitLab' | 'Bitbucket', baseUrl: endpoint.trim() })
      else await onSave({ kind, name: name.trim(), provider: provider as 'OpenSearch' | 'Elasticsearch', endpoint: endpoint.trim(), index: index.trim() })
    } finally { setSaving(false) }
  }
  const providerOptions = kind === 'mcp' ? ['Streamable HTTP', 'SSE', 'stdio'] : kind === 'vcs' ? ['GitHub', 'GitLab', 'Bitbucket'] : ['OpenSearch', 'Elasticsearch']
  return <NestedFormDialog title={connection ? t('editConnection') : t('createConnection')} description={t('connectorFormHelp')} busy={busy} onClose={onClose} returnFocusRef={triggerRef} size="wide" footer={<><button className="kx-button" type="button" disabled={busy} onClick={onClose}>{t('cancel')}</button><button className="kx-button" type="button" disabled={!valid || busy} onClick={validate}>{validation === 'pending' ? t('validatingConnection') : t('validateConnection')}</button><button className="kx-button kx-button--primary" type="submit" form="connector-form" disabled={!valid || validation !== 'success' || busy}>{saving ? t('saving') : t('save')}</button></>}>
    <form id="connector-form" className="kx-dialog-form" onSubmit={submit}>
      <label className="kx-field"><span>{t('connectionName')}</span><input autoFocus value={name} onChange={(event) => { setName(event.target.value); reset() }} /></label>
      {duplicate && <p className="kx-validation" role="alert">{t('duplicateName')}</p>}
      <label className="kx-field"><span>{kind === 'mcp' ? t('transport') : t('providerType')}</span><select value={provider} onChange={(event) => { setProvider(event.target.value as ConnectorProvider); reset() }}>{providerOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="kx-field"><span>{kind === 'vcs' ? t('baseUrl') : kind === 'mcp' && provider === 'stdio' ? t('command') : t('endpoint')}</span><input type={kind === 'mcp' && provider === 'stdio' ? 'text' : 'url'} value={endpoint} onChange={(event) => { setEndpoint(event.target.value); reset() }} placeholder={kind === 'mcp' && provider === 'stdio' ? 'npx @company/mcp-server' : 'https://…'} /></label>
      {endpoint && !locationValid && <p className="kx-validation" role="alert">{t('invalidUrl')}</p>}
      {kind === 'search' && <label className="kx-field"><span>{t('searchIndex')}</span><input value={index} onChange={(event) => { setIndex(event.target.value); reset() }} /></label>}
      <label className="kx-field"><span>{t('credential')}</span><input type="password" value={credential} onChange={(event) => { setCredential(event.target.value); reset() }} placeholder={connection ? '••••••••••••' : 'token-…'} /></label>
      {connection && <p className="kx-field-help">{t('apiKeyEditHelp')}</p>}
      {validation === 'success' && <p className="kx-notice" role="status">{t('validationPassed')}</p>}
      {validation === 'failure' && <p className="kx-validation" role="alert">{t('validationFailed')}</p>}
    </form>
  </NestedFormDialog>
}
