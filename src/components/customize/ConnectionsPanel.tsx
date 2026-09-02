import { Activity, Eye, Pencil, Plus, RefreshCw } from 'lucide-react'
import { useRef, useState } from 'react'
import { usePrototypeLocale } from '../../i18n/prototypeLocale'
import { nextPrototypeId, updateSettingsCustomizeState, useSettingsCustomizeStore, type ConnectionItem } from '../../state/settingsCustomizeStore'
import type { ConnectionSection } from '../../state/mockupReducer'
import ConnectionDialog, { type ConnectionDraft } from './ConnectionDialog'

export default function ConnectionsPanel({ subtab, onSelect }: { subtab: ConnectionSection; onSelect: (subtab: ConnectionSection) => void }) {
  const data = useSettingsCustomizeStore()
  const { t } = usePrototypeLocale()
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [detail, setDetail] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const items = data.connections.filter((item) => item.kind === subtab)
  const selected = editing && editing !== 'new' ? data.connections.find((item) => item.id === editing) : undefined
  const open = (id: string | 'new', trigger: HTMLButtonElement) => { triggerRef.current = trigger; setEditing(id); setNotice('') }
  const save = async (draft: ConnectionDraft) => {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 400))
    const next: ConnectionItem = { ...draft, id: selected?.id ?? nextPrototypeId('connection'), status: 'connected', detail: 'Healthy · validated just now' }
    updateSettingsCustomizeState((state) => ({ ...state, connections: selected ? state.connections.map((item) => item.id === selected.id ? next : item) : [...state.connections, next] }))
    setNotice(t('validationPassed')); setEditing(null)
  }
  const setStatus = (id: string, status: 'connected' | 'disabled') => updateSettingsCustomizeState((state) => ({ ...state, connections: state.connections.map((item) => item.id === id ? { ...item, status, detail: status === 'connected' ? 'Healthy · validated just now' : 'Access revoked' } : item) }))
  return <div className="kx-stack">
    <div className="kx-subtabs" role="tablist" aria-label={t('connections')}>{(['mcp', 'vcs', 'search'] as ConnectionSection[]).map((item) => <button key={item} role="tab" aria-selected={subtab === item} onClick={() => { onSelect(item); setEditing(null) }}>{item === 'mcp' ? t('mcpServers') : item === 'vcs' ? t('vcs') : t('searchConnectors')}</button>)}</div>
    {notice && <p className="kx-notice" role="status">{notice}</p>}
    <div className="kx-toolbar"><p>Credentials are validated without being displayed or stored.</p><button className="kx-button kx-button--primary" onClick={(event) => open('new', event.currentTarget)}><Plus size={15} />{t('createConnection')}</button></div>
    <div className="kx-list">{items.map((item) => <article className="kx-list-row" key={item.id}><div><strong>{item.name}</strong><span>{item.provider} · {item.detail}</span></div><span className={`kx-status kx-status--${item.status === 'connected' ? 'success' : item.status === 'disabled' ? 'danger' : 'warning'}`}>{item.status === 'needs-setup' ? t('needsSetup') : item.status}</span><div className="kx-row-actions"><button className="kx-icon-btn" aria-label={`${t('edit')} ${item.name}`} onClick={(event) => open(item.id, event.currentTarget)}><Pencil size={15} /></button>{item.status === 'disabled' ? <button className="kx-button kx-button--small" onClick={() => setStatus(item.id, 'connected')}>{t('restore')}</button> : <><button className="kx-icon-btn" title={t('healthCheck')} aria-label={`${t('healthCheck')} ${item.name}`} onClick={() => { setTesting(item.id); window.setTimeout(() => { setStatus(item.id, 'connected'); setTesting(null) }, 450) }}>{testing === item.id ? <RefreshCw className="kx-spin-icon" size={15} /> : <Activity size={15} />}</button><button className="kx-icon-btn" title={subtab === 'vcs' ? t('viewRepos') : t('viewTools')} aria-label={`View ${item.name} details`} onClick={() => setDetail(detail === item.id ? null : item.id)}><Eye size={15} /></button><button className="kx-button kx-button--small" onClick={() => subtab === 'search' ? setStatus(item.id, 'connected') : setStatus(item.id, 'disabled')}>{subtab === 'search' ? t('sync') : t('revoke')}</button></>}</div>{detail === item.id && <div className="kx-list-detail" role="status">{subtab === 'vcs' ? 'konteks-web, agent-runtime, design-system + 31 repositories' : subtab === 'mcp' ? 'search_context, read_resource, list_components + 9 tools' : 'Systems and components index · 24,180 documents'}</div>}</article>)}</div>
    {editing && <ConnectionDialog kind={subtab} connection={selected} connections={data.connections.filter((item) => item.kind === subtab)} triggerRef={triggerRef} onSave={save} onClose={() => setEditing(null)} />}
  </div>
}
