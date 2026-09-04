import { Archive, Check, Copy, Pencil, Play, Plus, Settings2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { usePrototypeLocale } from '../../i18n/prototypeLocale'
import { nextPrototypeId, updateSettingsCustomizeState, useSettingsCustomizeStore } from '../../state/settingsCustomizeStore'
import { useMockup } from '../../state/MockupContext'
import { AgentDialog, ExecutionProfileDialog, type AgentDraft, type ExecutionProfileDraft } from './AgentDialogs'

type AgentsDialog = { kind: 'agent'; id?: string } | { kind: 'profile'; id?: string } | null

export default function AgentsPanel() {
  const data = useSettingsCustomizeStore()
  const { dispatch } = useMockup()
  const { t } = usePrototypeLocale()
  const [testing, setTesting] = useState<string | null>(null)
  const [tested, setTested] = useState<string | null>(null)
  const [dialog, setDialog] = useState<AgentsDialog>(null)
  const [notice, setNotice] = useState('')
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const open = (next: Exclude<AgentsDialog, null>, trigger: HTMLButtonElement) => { triggerRef.current = trigger; setDialog(next); setNotice('') }
  const delay = () => new Promise<void>((resolve) => window.setTimeout(resolve, 400))
  const saveAgent = async (draft: AgentDraft) => {
    await delay()
    const provider = data.providers.find((item) => item.id === draft.providerConnectionId)
    updateSettingsCustomizeState((state) => ({ ...state, agentProfiles: dialog?.kind === 'agent' && dialog.id
      ? state.agentProfiles.map((item) => item.id === dialog.id ? { ...item, ...draft, readiness: provider?.status === 'connected' ? 'ready' : 'needs-setup' } : item)
      : [...state.agentProfiles, { id: nextPrototypeId('agent'), ...draft, readiness: provider?.status === 'connected' ? 'ready' : 'needs-setup' }] }))
    setNotice(t('saved')); setDialog(null)
  }
  const saveProfile = async (draft: ExecutionProfileDraft) => {
    await delay()
    updateSettingsCustomizeState((state) => {
      const createdId = nextPrototypeId('profile')
      const targetId = dialog?.kind === 'profile' && dialog.id ? dialog.id : createdId
      const profiles = dialog?.kind === 'profile' && dialog.id
        ? state.executionProfiles.map((item) => item.id === dialog.id ? { ...item, ...draft, revision: item.revision + 1 } : item)
        : [...state.executionProfiles, { id: createdId, ...draft, revision: 1, status: 'active' as const }]
      return { ...state, executionProfiles: draft.isDefault ? profiles.map((item) => ({ ...item, isDefault: item.id === targetId })) : profiles }
    })
    setNotice(t('saved')); setDialog(null)
  }
  const test = (id: string) => { setTesting(id); window.setTimeout(() => { setTesting(null); setTested(id) }, 450) }

  return <div className="kx-stack">
    <section className="kx-setup-banner"><div><span className="kx-eyebrow">{t('setupGuide')}</span><h3>Planner → Executor → Assistant → Search → QA runner</h3><p>Review the working chain, test every role, then publish it to execution profiles.</p></div><button className="kx-button">{t('reviewSetup')}</button></section>
    <div className="kx-section-heading"><div><h3>{t('agents')}</h3><p>Role-specific AI workers connected to workspace providers.</p></div><button className="kx-button kx-button--primary" onClick={(event) => open({ kind: 'agent' }, event.currentTarget)}><Plus size={15} />{t('createAgent')}</button></div>
    {notice && <p className="kx-notice" role="status">{notice}</p>}
    <div className="kx-agent-grid">{data.agentProfiles.map((profile) => { const ready = data.providers.find((provider) => provider.id === profile.providerConnectionId)?.status === 'connected'; return <article className="kx-card" key={profile.id}><div className="kx-card__heading"><div><span className="kx-eyebrow">{profile.role}</span><h3>{profile.name}</h3></div><span className={`kx-status kx-status--${ready ? 'success' : 'warning'}`}>{ready ? t('ready') : t('needsSetup')}</span></div><p>{profile.provider} · {profile.model}</p><div className="kx-row-actions"><button className="kx-button kx-button--small" onClick={() => test(profile.id)}><Play size={13} />{testing === profile.id ? 'Testing…' : tested === profile.id ? 'Passed' : t('test')}</button><button className="kx-button kx-button--small" onClick={(event) => open({ kind: 'agent', id: profile.id }, event.currentTarget)}><Settings2 size={13} />{t('configure')}</button></div>{!ready && <button className="kx-text-action" onClick={() => dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'settings', destination: { section: 'billing', subtab: 'providers' } } })}>Connect required provider →</button>}</article> })}</div>
    <div className="kx-section-heading"><div><h3>{t('executionProfiles')}</h3><p>Reusable planner and executor combinations with revision history.</p></div><button className="kx-button kx-button--primary" onClick={(event) => open({ kind: 'profile' }, event.currentTarget)}><Plus size={15} />{t('createProfile')}</button></div>
    <div className="kx-list">{data.executionProfiles.map((profile) => <article className="kx-list-row" key={profile.id}><div><strong>{profile.name}</strong><span>{profile.planner} → {profile.executor} · Revision {profile.revision}</span></div>{profile.isDefault && <span className="kx-status kx-status--success"><Check size={12} />{t('default')}</span>}<div className="kx-row-actions">{profile.status === 'archived' ? <button className="kx-button kx-button--small" onClick={() => updateSettingsCustomizeState((state) => ({ ...state, executionProfiles: state.executionProfiles.map((item) => item.id === profile.id ? { ...item, status: 'active' } : item) }))}>{t('restore')}</button> : <><button className="kx-icon-btn" aria-label={`${t('edit')} ${profile.name}`} onClick={(event) => open({ kind: 'profile', id: profile.id }, event.currentTarget)}><Pencil size={15} /></button><button className="kx-icon-btn" title={t('setDefault')} aria-label={`${t('setDefault')} ${profile.name}`} onClick={() => updateSettingsCustomizeState((state) => ({ ...state, executionProfiles: state.executionProfiles.map((item) => ({ ...item, isDefault: item.id === profile.id })) }))}><Check size={15} /></button><button className="kx-icon-btn" title={t('duplicate')} aria-label={`${t('duplicate')} ${profile.name}`} onClick={() => updateSettingsCustomizeState((state) => ({ ...state, executionProfiles: [...state.executionProfiles, { ...profile, id: nextPrototypeId('profile'), name: `${profile.name} copy`, isDefault: false, revision: 1 }] }))}><Copy size={15} /></button><button className="kx-icon-btn" title={t('archive')} aria-label={`${t('archive')} ${profile.name}`} onClick={() => updateSettingsCustomizeState((state) => ({ ...state, executionProfiles: state.executionProfiles.map((item) => item.id === profile.id ? { ...item, status: 'archived', isDefault: false } : item) }))}><Archive size={15} /></button></>}</div></article>)}</div>
    {dialog?.kind === 'agent' && <AgentDialog agent={dialog.id ? data.agentProfiles.find((item) => item.id === dialog.id) : undefined} agents={data.agentProfiles} providers={data.providers} triggerRef={triggerRef} onSave={saveAgent} onClose={() => setDialog(null)} />}
    {dialog?.kind === 'profile' && <ExecutionProfileDialog profile={dialog.id ? data.executionProfiles.find((item) => item.id === dialog.id) : undefined} profiles={data.executionProfiles} triggerRef={triggerRef} onSave={saveProfile} onClose={() => setDialog(null)} />}
  </div>
}
