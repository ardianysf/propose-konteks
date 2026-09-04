import { Copy } from 'lucide-react'
import { useState, type FormEvent, type RefObject } from 'react'
import { usePrototypeLocale } from '../../i18n/prototypeLocale'
import type { ActivationToken, OwnerMapping, TeamGroup } from '../../state/settingsCustomizeStore'
import NestedFormDialog from '../shared/NestedFormDialog'

export function OwnerMappingDialog({ mapping, mappings, groups, triggerRef, onSave, onClose }: {
  mapping?: OwnerMapping
  mappings: OwnerMapping[]
  groups: TeamGroup[]
  triggerRef: RefObject<HTMLElement | null>
  onSave: (draft: Omit<OwnerMapping, 'id'>) => Promise<void>
  onClose: () => void
}) {
  const { t } = usePrototypeLocale()
  const [handle, setHandle] = useState(mapping?.handle ?? '')
  const [groupId, setGroupId] = useState(mapping?.groupId ?? groups[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const duplicate = mappings.some((item) => item.id !== mapping?.id && item.handle.toLowerCase() === handle.trim().toLowerCase())
  const valid = Boolean(handle.trim() && groupId) && !duplicate
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!valid || busy) return; setBusy(true); try { await onSave({ handle: handle.trim(), groupId }) } finally { setBusy(false) } }
  return <NestedFormDialog title={t('addOwnerMapping')} description={t('ownerMappingHelp')} busy={busy} onClose={onClose} returnFocusRef={triggerRef} footer={<><button className="kx-button" type="button" disabled={busy} onClick={onClose}>{t('cancel')}</button><button className="kx-button kx-button--primary" type="submit" form="owner-mapping-form" disabled={!valid || busy}>{busy ? t('saving') : t('save')}</button></>}>
    <form id="owner-mapping-form" className="kx-dialog-form" onSubmit={submit}>
      <label className="kx-field"><span>{t('pathOrHandle')}</span><input autoFocus value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="apps/web/**" /></label>
      {duplicate && <p className="kx-validation" role="alert">{t('duplicateName')}</p>}
      <label className="kx-field"><span>{t('ownerGroup')}</span><select value={groupId} onChange={(event) => setGroupId(event.target.value)}>{groups.map((group) => <option key={group.id} value={group.id}>{group.displayName}</option>)}</select></label>
    </form>
  </NestedFormDialog>
}

export interface ActivationTokenDraft { label: string; scope: ActivationToken['scope']; expiresAt: string }

export function ActivationTokenDialog({ tokens, triggerRef, onGenerate, onClose }: {
  tokens: ActivationToken[]
  triggerRef: RefObject<HTMLElement | null>
  onGenerate: (draft: ActivationTokenDraft) => Promise<string>
  onClose: () => void
}) {
  const { t } = usePrototypeLocale()
  const [label, setLabel] = useState('')
  const [scope, setScope] = useState<ActivationToken['scope']>('runtime')
  const [expiry, setExpiry] = useState<'7' | '30'>('7')
  const [busy, setBusy] = useState(false)
  const [token, setToken] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'failure'>('idle')
  const duplicate = tokens.some((item) => item.label.toLowerCase() === label.trim().toLowerCase())
  const valid = Boolean(label.trim()) && !duplicate
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!valid || busy) return; setBusy(true); try { setToken(await onGenerate({ label: label.trim(), scope, expiresAt: expiry === '7' ? 'Sep 9, 2026' : 'Oct 2, 2026' })) } finally { setBusy(false) } }
  const copy = async () => { try { if (!navigator.clipboard?.writeText) throw new Error(); await navigator.clipboard.writeText(token); setCopyState('success') } catch { setCopyState('failure') } }
  return <NestedFormDialog title={token ? t('tokenReady') : t('generateToken')} description={token ? t('tokenWarning') : t('tokenFormHelp')} busy={busy} onClose={onClose} returnFocusRef={triggerRef} footer={token ? <button className="kx-button kx-button--primary" type="button" onClick={onClose}>{t('close')}</button> : <><button className="kx-button" type="button" disabled={busy} onClick={onClose}>{t('cancel')}</button><button className="kx-button kx-button--primary" type="submit" form="activation-token-form" disabled={!valid || busy}>{busy ? t('saving') : t('generateToken')}</button></>}>
    {token ? <><p className="kx-dialog-warning">{t('tokenWarning')}</p><label className="kx-field"><span>{t('activationTokens')}</span><span className="kx-copy-field"><input readOnly value={token} onFocus={(event) => event.currentTarget.select()} /><button className="kx-button" type="button" onClick={copy}><Copy size={14} />{t('copyToken')}</button></span></label><p className={copyState === 'failure' ? 'kx-validation' : 'kx-copy-status'} role="status">{copyState === 'success' ? t('tokenCopied') : copyState === 'failure' ? t('copyFailed') : ''}</p></> : <form id="activation-token-form" className="kx-dialog-form" onSubmit={submit}><label className="kx-field"><span>{t('tokenLabel')}</span><input autoFocus value={label} onChange={(event) => setLabel(event.target.value)} /></label>{duplicate && <p className="kx-validation" role="alert">{t('duplicateName')}</p>}<label className="kx-field"><span>{t('tokenScope')}</span><select value={scope} onChange={(event) => setScope(event.target.value as ActivationToken['scope'])}><option value="runtime">{t('runtimeScope')}</option><option value="workspace">{t('workspaceScope')}</option></select></label><label className="kx-field"><span>{t('tokenExpiry')}</span><select value={expiry} onChange={(event) => setExpiry(event.target.value as '7' | '30')}><option value="7">{t('sevenDays')}</option><option value="30">{t('thirtyDays')}</option></select></label></form>}
  </NestedFormDialog>
}
