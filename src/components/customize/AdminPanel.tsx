import { History, KeyRound, Pencil, Plus, RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import { usePrototypeLocale } from '../../i18n/prototypeLocale'
import { nextPrototypeId, updateSettingsCustomizeState, useSettingsCustomizeStore } from '../../state/settingsCustomizeStore'
import type { AdminSection } from '../../state/mockupReducer'
import { ActivationTokenDialog, OwnerMappingDialog, type ActivationTokenDraft } from './AdminDialogs'

type AdminDialog = { kind: 'token' } | { kind: 'mapping'; id?: string } | null

export default function AdminPanel({ subtab, onSelect }: { subtab: AdminSection; onSelect: (subtab: AdminSection) => void }) {
  const data = useSettingsCustomizeStore()
  const { t } = usePrototypeLocale()
  const [dialog, setDialog] = useState<AdminDialog>(null)
  const [saved, setSaved] = useState('')
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const open = (next: Exclude<AdminDialog, null>, trigger: HTMLButtonElement) => { triggerRef.current = trigger; setDialog(next); setSaved('') }
  const selectedMapping = dialog?.kind === 'mapping' && dialog.id ? data.ownerMappings.find((item) => item.id === dialog.id) : undefined
  const saveMapping = async (draft: { handle: string; groupId: string }) => {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 400))
    updateSettingsCustomizeState((state) => ({ ...state, ownerMappings: selectedMapping ? state.ownerMappings.map((item) => item.id === selectedMapping.id ? { ...item, ...draft } : item) : [...state.ownerMappings, { id: nextPrototypeId('mapping'), ...draft }] }))
    setSaved(t('saved')); setDialog(null)
  }
  const generateToken = async (draft: ActivationTokenDraft) => {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 450))
    const id = nextPrototypeId('token')
    updateSettingsCustomizeState((state) => ({ ...state, activationTokens: [...state.activationTokens, { id, ...draft, status: 'active' }] }))
    return `kx_act_${id.replace(/[^a-z0-9]/gi, '')}`
  }
  return <div className="kx-stack">
    <div className="kx-subtabs" role="tablist" aria-label={t('admin')}>{(['runtimes', 'runtime-config', 'owner-mappings'] as AdminSection[]).map((item) => <button key={item} role="tab" aria-selected={subtab === item} onClick={() => { onSelect(item); setDialog(null) }}>{t(item === 'runtime-config' ? 'runtimeConfig' : item === 'owner-mappings' ? 'ownerMappings' : 'runtimes')}</button>)}</div>
    {saved && <p className="kx-notice" role="status">{saved}</p>}
    {subtab === 'runtimes' ? <><div className="kx-section-heading"><div><h3>{t('activationTokens')}</h3><p>One-time bootstrap tokens for self-hosted runners.</p></div><button className="kx-button kx-button--primary" onClick={(event) => open({ kind: 'token' }, event.currentTarget)}><KeyRound size={14} />{t('generateToken')}</button></div><div className="kx-list">{data.activationTokens.map((token) => <article className="kx-list-row" key={token.id}><div><strong>{token.label}</strong><span>{token.scope} · {token.expiresAt}</span></div><span className={`kx-status kx-status--${token.status === 'active' ? 'success' : 'danger'}`}>{token.status}</span>{token.status === 'active' && <button className="kx-button kx-button--small" onClick={() => updateSettingsCustomizeState((state) => ({ ...state, activationTokens: state.activationTokens.map((item) => item.id === token.id ? { ...item, status: 'revoked' } : item) }))}>{t('revoke')}</button>}</article>)}</div><h3>{t('runtimes')}</h3><div className="kx-list">{data.runtimes.map((runtime) => <article className="kx-list-row" key={runtime.id}><div><strong>{runtime.name}</strong><span>Agent Zero {runtime.version}</span></div><span className={`kx-status kx-status--${runtime.status === 'active' ? 'success' : 'warning'}`}>{runtime.status}</span><button className="kx-button kx-button--small" onClick={() => updateSettingsCustomizeState((state) => ({ ...state, runtimes: state.runtimes.map((item) => item.id === runtime.id ? { ...item, status: item.status === 'active' ? 'suspended' : 'active' } : item) }))}>{runtime.status === 'active' ? t('suspend') : t('resume')}</button></article>)}</div></> : subtab === 'runtime-config' ? <><div className="kx-section-heading"><div><h3>{t('runtimeConfig')}</h3><p>Workspace scope · inherited values remain read-only.</p></div><div className="kx-row-actions"><button className="kx-button" onClick={() => setSaved('Reverted to audited revision 18')}><RotateCcw size={14} />Revert</button><button className="kx-button kx-button--primary" onClick={() => setSaved(t('saved'))}>{t('save')}</button></div></div><div className="kx-list">{data.runtimeConfig.map((entry) => <label className="kx-config-row" key={entry.key}><span><strong>{entry.key}</strong><small>{entry.inherited ? 'Organization inherited' : 'Workspace override'}</small></span><input disabled={entry.inherited} value={entry.value} onChange={(event) => updateSettingsCustomizeState((state) => ({ ...state, runtimeConfig: state.runtimeConfig.map((item) => item.key === entry.key ? { ...item, value: event.target.value, audited: false } : item) }))} /><span className={`kx-status kx-status--${entry.audited ? 'success' : 'warning'}`}>{entry.audited ? t('audited') : 'Changed'}</span></label>)}</div><div className="kx-audit"><History size={15} /><span>Revision 18 · Sari changed MAX_CONCURRENT_RUNS from 6 to 8.</span></div></> : <><div className="kx-section-heading"><div><h3>{t('ownerMappings')}</h3><p>Route repository paths and handles to accountable groups.</p></div><button className="kx-button kx-button--primary" onClick={(event) => open({ kind: 'mapping' }, event.currentTarget)}><Plus size={14} />{t('addMapping')}</button></div><div className="kx-table">{data.ownerMappings.map((item) => <div className="kx-table-row" key={item.id}><strong>{item.handle}</strong><span>{data.groups.find((group) => group.id === item.groupId)?.displayName}</span><div className="kx-row-actions"><button className="kx-icon-btn" aria-label={`${t('edit')} ${item.handle}`} onClick={(event) => open({ kind: 'mapping', id: item.id }, event.currentTarget)}><Pencil size={14} /></button><button className="kx-button kx-button--small kx-button--danger" onClick={() => updateSettingsCustomizeState((state) => ({ ...state, ownerMappings: state.ownerMappings.filter((mapping) => mapping.id !== item.id) }))}>{t('delete')}</button></div></div>)}</div></>}
    {dialog?.kind === 'token' && <ActivationTokenDialog tokens={data.activationTokens} triggerRef={triggerRef} onGenerate={generateToken} onClose={() => setDialog(null)} />}
    {dialog?.kind === 'mapping' && <OwnerMappingDialog mapping={selectedMapping} mappings={data.ownerMappings} groups={data.groups} triggerRef={triggerRef} onSave={saveMapping} onClose={() => setDialog(null)} />}
  </div>
}
