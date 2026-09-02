import { Download, FlaskConical, Pencil, Plus, Search } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { usePrototypeLocale } from '../../i18n/prototypeLocale'
import { nextPrototypeId, updateSettingsCustomizeState, useSettingsCustomizeStore, type CapabilityVersion } from '../../state/settingsCustomizeStore'
import type { CapabilitySection } from '../../state/mockupReducer'
import { CapabilityDialog, CapabilityVersionDialog, type CapabilityDraft } from './CapabilityDialogs'

type CapabilityModal = { kind: 'item'; id?: string } | { kind: 'version'; id: string } | null

export default function CapabilitiesPanel({ subtab, onSelect }: { subtab: CapabilitySection; onSelect: (subtab: CapabilitySection) => void }) {
  const data = useSettingsCustomizeStore()
  const { t } = usePrototypeLocale()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modal, setModal] = useState<CapabilityModal>(null)
  const [evaluation, setEvaluation] = useState('')
  const [notice, setNotice] = useState('')
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const items = useMemo(() => data.capabilities.filter((item) => item.kind === subtab && item.name.toLowerCase().includes(query.toLowerCase())), [data.capabilities, query, subtab])
  const selected = data.capabilities.find((item) => item.id === selectedId)
  const edited = modal?.kind === 'item' && modal.id ? data.capabilities.find((item) => item.id === modal.id) : undefined
  const open = (next: Exclude<CapabilityModal, null>, trigger: HTMLButtonElement) => { triggerRef.current = trigger; setModal(next); setNotice('') }
  const save = async (draft: CapabilityDraft) => {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 400))
    updateSettingsCustomizeState((state) => ({ ...state, capabilities: edited
      ? state.capabilities.map((item) => item.id === edited.id ? { ...item, name: draft.name, description: draft.description } : item)
      : [...state.capabilities, { id: nextPrototypeId('capability'), kind: subtab, name: draft.name, description: draft.description, status: 'active', versions: [draft.initialVersion!] }] }))
    setNotice(t('saved')); setModal(null)
  }
  const addVersion = async (version: CapabilityVersion) => {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 400))
    updateSettingsCustomizeState((state) => ({ ...state, capabilities: state.capabilities.map((item) => item.id === selectedId ? { ...item, versions: [version, ...item.versions] } : item) }))
    setNotice(t('saved')); setModal(null)
  }
  return <div className="kx-stack">
    <div className="kx-subtabs" role="tablist" aria-label={t('capabilities')}>{(['skills', 'tools', 'mcp'] as CapabilitySection[]).map((item) => <button key={item} role="tab" aria-selected={subtab === item} onClick={() => { onSelect(item); setSelectedId(null); setModal(null) }}>{item === 'mcp' ? t('mcpPackages') : t(item)}</button>)}</div>
    {notice && <p className="kx-notice" role="status">{notice}</p>}
    <div className="kx-toolbar"><label className="kx-search-wrap"><Search size={15} /><input className="kx-search-input" aria-label={t('search')} placeholder={`${t('search')}…`} value={query} onChange={(event) => setQuery(event.target.value)} /></label><button className="kx-button kx-button--primary" onClick={(event) => open({ kind: 'item' }, event.currentTarget)}><Plus size={15} />{t('addItem')}</button></div>
    {selected ? <section className="kx-detail-panel"><div className="kx-section-heading"><div><span className="kx-eyebrow">{subtab}</span><h3>{selected.name}</h3><p>{selected.description}</p></div><div className="kx-row-actions"><button className="kx-button" onClick={(event) => open({ kind: 'item', id: selected.id }, event.currentTarget)}><Pencil size={14} />{t('edit')}</button><button className="kx-button" onClick={() => setSelectedId(null)}>{t('close')}</button></div></div><div className="kx-card"><div className="kx-card__heading"><h3>{t('versions')}</h3><button className="kx-button kx-button--small" onClick={(event) => open({ kind: 'version', id: selected.id }, event.currentTarget)}><Plus size={13} />{t('addVersion')}</button></div>{selected.versions.map((item) => <div className="kx-version" key={item.version}><span><strong>v{item.version}</strong><small>{item.notes}</small></span><span>{item.createdAt}</span></div>)}</div>{subtab === 'skills' && <div className="kx-evaluation"><blockquote>“Review this change for security regressions and missing tests.”</blockquote><button className="kx-button" onClick={() => { setEvaluation('Evaluating…'); window.setTimeout(() => setEvaluation('Passed · 92% relevance · 1.8s'), 450) }}><FlaskConical size={14} />{t('evaluate')}</button>{evaluation && <span role="status">{evaluation}</span>}</div>}<button className="kx-button"><Download size={14} />{t('download')}</button></section> : <div className="kx-list">{items.map((item) => <button className="kx-list-row kx-list-row--button" key={item.id} onClick={() => setSelectedId(item.id)}><div><strong>{item.name}</strong><span>{item.description}</span></div><span className={`kx-status kx-status--${item.status === 'active' ? 'success' : 'warning'}`}>{item.status}</span><span>{item.versions.length} {t('versions').toLowerCase()}</span></button>)}{items.length === 0 && <div className="kx-state">{t('noData')}</div>}</div>}
    {modal?.kind === 'item' && <CapabilityDialog capability={edited} capabilities={data.capabilities.filter((item) => item.kind === subtab)} triggerRef={triggerRef} onSave={save} onClose={() => setModal(null)} />}
    {modal?.kind === 'version' && selected && <CapabilityVersionDialog capability={selected} triggerRef={triggerRef} onSave={addVersion} onClose={() => setModal(null)} />}
  </div>
}
