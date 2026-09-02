import { useMemo, useState, type FormEvent, type RefObject } from 'react'
import { usePrototypeLocale } from '../../i18n/prototypeLocale'
import type { AgentProfile, ExecutionProfile, ProviderConnection } from '../../state/settingsCustomizeStore'
import NestedFormDialog from '../shared/NestedFormDialog'

export interface AgentDraft {
  name: string
  role: AgentProfile['role']
  providerConnectionId: string
  provider: string
  model: string
}

export function AgentDialog({ agent, agents, providers, triggerRef, onSave, onClose }: {
  agent?: AgentProfile
  agents: AgentProfile[]
  providers: ProviderConnection[]
  triggerRef: RefObject<HTMLElement | null>
  onSave: (draft: AgentDraft) => Promise<void>
  onClose: () => void
}) {
  const { t } = usePrototypeLocale()
  const [name, setName] = useState(agent?.name ?? '')
  const [role, setRole] = useState<AgentProfile['role']>(agent?.role ?? 'Assistant')
  const [providerId, setProviderId] = useState(agent?.providerConnectionId ?? providers[0]?.id ?? '')
  const [model, setModel] = useState(agent?.model ?? '')
  const [busy, setBusy] = useState(false)
  const duplicate = useMemo(() => agents.some((item) => item.id !== agent?.id && item.name.toLowerCase() === name.trim().toLowerCase()), [agent?.id, agents, name])
  const provider = providers.find((item) => item.id === providerId)
  const valid = Boolean(name.trim() && provider && model.trim()) && !duplicate
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!valid || !provider || busy) return
    setBusy(true)
    try { await onSave({ name: name.trim(), role, providerConnectionId: provider.id, provider: provider.provider, model: model.trim() }) }
    finally { setBusy(false) }
  }
  return <NestedFormDialog title={agent ? t('configureAgent') : t('createAgent')} description={t('agentFormHelp')} busy={busy} onClose={onClose} returnFocusRef={triggerRef} footer={<><button className="kx-button" type="button" disabled={busy} onClick={onClose}>{t('cancel')}</button><button className="kx-button kx-button--primary" type="submit" form="agent-form" disabled={!valid || busy}>{busy ? t('saving') : t('save')}</button></>}>
    <form id="agent-form" className="kx-dialog-form" onSubmit={submit}>
      <label className="kx-field"><span>{t('agentName')}</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} /></label>
      {duplicate && <p className="kx-validation" role="alert">{t('duplicateName')}</p>}
      <label className="kx-field"><span>{t('agentRole')}</span><select value={role} onChange={(event) => setRole(event.target.value as AgentProfile['role'])}>{(['Assistant', 'Harness', 'Search', 'QA runner'] as AgentProfile['role'][]).map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="kx-field"><span>{t('providerConnection')}</span><select value={providerId} onChange={(event) => setProviderId(event.target.value)}>{providers.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.provider}</option>)}</select></label>
      <label className="kx-field"><span>{t('model')}</span><input value={model} onChange={(event) => setModel(event.target.value)} placeholder="GPT-4.1" /></label>
    </form>
  </NestedFormDialog>
}

export interface ExecutionProfileDraft {
  name: string
  planner: string
  executor: string
  isDefault: boolean
}

export function ExecutionProfileDialog({ profile, profiles, triggerRef, onSave, onClose }: {
  profile?: ExecutionProfile
  profiles: ExecutionProfile[]
  triggerRef: RefObject<HTMLElement | null>
  onSave: (draft: ExecutionProfileDraft) => Promise<void>
  onClose: () => void
}) {
  const { t } = usePrototypeLocale()
  const [name, setName] = useState(profile?.name ?? '')
  const [planner, setPlanner] = useState(profile?.planner ?? '')
  const [executor, setExecutor] = useState(profile?.executor ?? '')
  const [isDefault, setIsDefault] = useState(profile?.isDefault ?? false)
  const [busy, setBusy] = useState(false)
  const duplicate = profiles.some((item) => item.id !== profile?.id && item.name.toLowerCase() === name.trim().toLowerCase())
  const valid = Boolean(name.trim() && planner.trim() && executor.trim()) && !duplicate
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    try { await onSave({ name: name.trim(), planner: planner.trim(), executor: executor.trim(), isDefault }) }
    finally { setBusy(false) }
  }
  return <NestedFormDialog title={profile ? t('editProfile') : t('createProfile')} description={t('profileFormHelp')} busy={busy} onClose={onClose} returnFocusRef={triggerRef} footer={<><button className="kx-button" type="button" disabled={busy} onClick={onClose}>{t('cancel')}</button><button className="kx-button kx-button--primary" type="submit" form="execution-profile-form" disabled={!valid || busy}>{busy ? t('saving') : t('save')}</button></>}>
    <form id="execution-profile-form" className="kx-dialog-form" onSubmit={submit}>
      <label className="kx-field"><span>{t('profileName')}</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} /></label>
      {duplicate && <p className="kx-validation" role="alert">{t('duplicateName')}</p>}
      <label className="kx-field"><span>{t('plannerModel')}</span><input value={planner} onChange={(event) => setPlanner(event.target.value)} placeholder="GPT-4.1" /></label>
      <label className="kx-field"><span>{t('executorModel')}</span><input value={executor} onChange={(event) => setExecutor(event.target.value)} placeholder="Claude Sonnet 4.5" /></label>
      <label className="kx-check-field"><input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} /><span>{t('makeDefault')}</span></label>
    </form>
  </NestedFormDialog>
}
