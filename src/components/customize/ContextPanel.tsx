import { FileText, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { usePrototypeLocale } from '../../i18n/prototypeLocale'
import { nextPrototypeId, updateSettingsCustomizeState, useSettingsCustomizeStore } from '../../state/settingsCustomizeStore'
import type { ContextSection } from '../../state/mockupReducer'
import { ContextResourceDialog, RepositoryDialog, type ContextResourceDraft } from './ContextDialogs'

export default function ContextPanel({ subtab, onSelect }: { subtab: ContextSection; onSelect: (subtab: ContextSection) => void }) {
  const data = useSettingsCustomizeStore()
  const { t } = usePrototypeLocale()
  const [editing, setEditing] = useState<string | 'new' | 'repository' | null>(null)
  const [notice, setNotice] = useState('')
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const resources = data.contextResources.filter((item) => item.kind === subtab)
  const selected = data.contextResources.find((item) => item.id === editing)
  const open = (id: string | 'new' | 'repository', trigger: HTMLButtonElement) => { triggerRef.current = trigger; setEditing(id); setNotice('') }
  const saveResource = async (draft: ContextResourceDraft) => {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 400))
    updateSettingsCustomizeState((state) => editing === 'new'
      ? ({ ...state, contextResources: [...state.contextResources, { id: nextPrototypeId('context'), kind: subtab === 'skills' ? 'skills' : 'files', ...draft }] })
      : ({ ...state, contextResources: state.contextResources.map((item) => item.id === editing ? { ...item, ...draft } : item) }))
    setNotice(t('saved')); setEditing(null)
  }
  const saveRepository = async (repository: typeof data.repository) => {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 500))
    updateSettingsCustomizeState((state) => ({ ...state, repository }))
    setNotice(t('saved')); setEditing(null)
  }

  return <div className="kx-stack">
    <div className="kx-subtabs" role="tablist" aria-label={t('context')}>{(['files', 'skills', 'repositories'] as ContextSection[]).map((item) => <button key={item} role="tab" aria-selected={subtab === item} onClick={() => { onSelect(item); setEditing(null) }}>{t(item)}</button>)}</div>
    {notice && <p className="kx-notice" role="status">{notice}</p>}
    {subtab === 'repositories' ? <section className="kx-card"><div className="kx-card__heading"><div><h3>{t('repositoryContext')}</h3><p>{data.repository.url}</p></div><span className="kx-status kx-status--success">{data.repository.lastLoaded}</span></div><p>{data.repository.ref} · {data.repository.path}</p><button className="kx-button kx-button--primary" onClick={(event) => open('repository', event.currentTarget)}><RefreshCw size={15} />{t('loadRepository')}</button></section> : <><div className="kx-toolbar"><p>{resources.length} {subtab}</p><button className="kx-button kx-button--primary" onClick={(event) => open('new', event.currentTarget)}><Plus size={15} />{t('addItem')}</button></div><div className="kx-list">{resources.map((resource) => <article className="kx-list-row" key={resource.id}><FileText size={16} /><div><strong>{resource.name}</strong><span>{resource.detail}</span></div><button className="kx-button kx-button--small" onClick={(event) => open(resource.id, event.currentTarget)}>{t('edit')}</button><button className="kx-icon-btn" aria-label={`${t('delete')} ${resource.name}`} onClick={() => updateSettingsCustomizeState((state) => ({ ...state, contextResources: state.contextResources.filter((item) => item.id !== resource.id) }))}><Trash2 size={15} /></button></article>)}</div></>}
    {(editing === 'new' || selected) && <ContextResourceDialog resource={selected} resources={resources} triggerRef={triggerRef} onSave={saveResource} onClose={() => setEditing(null)} />}
    {editing === 'repository' && <RepositoryDialog repository={data.repository} triggerRef={triggerRef} onSave={saveRepository} onClose={() => setEditing(null)} />}
  </div>
}
