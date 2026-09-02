import { Plus, ShieldCheck, Trash2, UserPlus, X } from 'lucide-react'
import { useId, useRef, useState, type FormEvent } from 'react'
import { usePrototypeLocale, type LocalePreference } from '../../i18n/prototypeLocale'
import {
  nextPrototypeId,
  updateSettingsCustomizeState,
  useSettingsCustomizeStore,
} from '../../state/settingsCustomizeStore'
import { useMockup } from '../../state/MockupContext'
import {
  DEFAULT_SETTINGS_DESTINATION,
  type SettingsDestination,
  type SettingsSection,
} from '../../state/mockupReducer'
import { applyTheme, getStoredPreference, type ThemePreference } from '../../theme'
import { useOverlayLifecycle } from '../shell/OverlayLifecycle'
import { useFocusContainment } from '../shell/useFocusContainment'
import { CreateGroupDialog, InviteMemberDialog, type NewTeamGroup } from './TeamDialogs'
import BillingWorkspace from './BillingWorkspace'
import './SettingsModal.css'

function Status({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return <span className={`kx-status kx-status--${tone}`}>{children}</span>
}

function GeneralPanel() {
  const data = useSettingsCustomizeStore()
  const { t, preference, setPreference } = usePrototypeLocale()
  const [name, setName] = useState(data.displayName)
  const [theme, setTheme] = useState<ThemePreference>(getStoredPreference())
  const [saved, setSaved] = useState(false)

  const saveProfile = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    updateSettingsCustomizeState((state) => ({ ...state, displayName: name.trim() }))
    setSaved(true)
  }

  return (
    <div className="kx-stack">
      <section className="kx-card">
        <div className="kx-card__heading"><div><h3>{t('profile')}</h3><p>{t('profileHelp')}</p></div>{saved && <Status tone="success">{t('saved')}</Status>}</div>
        <form className="kx-form-row" onSubmit={saveProfile}>
          <label className="kx-field"><span>{t('displayName')}</span><input value={name} onChange={(event) => { setName(event.target.value); setSaved(false) }} aria-invalid={!name.trim()} /></label>
          <button className="kx-button kx-button--primary" disabled={!name.trim()}>{t('save')}</button>
        </form>
        {!name.trim() && <p className="kx-validation" role="alert">A display name is required.</p>}
      </section>
      <section className="kx-card">
        <div className="kx-card__heading"><div><h3>{t('appearance')}</h3><p>{t('appearanceHelp')}</p></div></div>
        <div className="kx-segment" aria-label={t('appearance')}>
          {(['system', 'light', 'dark'] as ThemePreference[]).map((item) => <button key={item} aria-pressed={theme === item} onClick={() => { setTheme(item); applyTheme(item) }}>{t(item)}</button>)}
        </div>
      </section>
      <section className="kx-card">
        <div className="kx-card__heading"><div><h3>{t('language')}</h3><p>{t('languageHelp')}</p></div></div>
        <div className="kx-segment" aria-label={t('language')}>
          {(['auto', 'en', 'id'] as LocalePreference[]).map((item) => <button key={item} aria-pressed={preference === item} onClick={() => setPreference(item)}>{item === 'en' ? t('english') : item === 'id' ? t('indonesian') : t('auto')}</button>)}
        </div>
      </section>
    </div>
  )
}

function TeamPanel() {
  const data = useSettingsCustomizeStore()
  const { t } = usePrototypeLocale()
  const [dialog, setDialog] = useState<{ kind: 'create' } | { kind: 'invite'; groupId: string } | null>(null)
  const [teamStatus, setTeamStatus] = useState('')
  const openingTriggerRef = useRef<HTMLButtonElement | null>(null)
  const selectedGroup = dialog?.kind === 'invite' ? data.groups.find((group) => group.id === dialog.groupId) : undefined

  const openCreate = (trigger: HTMLButtonElement) => {
    openingTriggerRef.current = trigger
    setTeamStatus('')
    setDialog({ kind: 'create' })
  }
  const openInvite = (trigger: HTMLButtonElement, groupId: string) => {
    openingTriggerRef.current = trigger
    setTeamStatus('')
    setDialog({ kind: 'invite', groupId })
  }
  const closeDialog = () => {
    setDialog(null)
    window.setTimeout(() => openingTriggerRef.current?.focus(), 0)
  }
  const simulate = () => new Promise<void>((resolve) => window.setTimeout(resolve, 450))
  const createGroup = async (group: NewTeamGroup) => {
    await simulate()
    updateSettingsCustomizeState((state) => ({
      ...state,
      groups: [...state.groups, { id: nextPrototypeId('group'), ...group, memberIds: [], protected: false }],
    }))
    setTeamStatus(t('groupCreated'))
    closeDialog()
  }
  const addMember = async (groupId: string, memberId: string) => {
    await simulate()
    updateSettingsCustomizeState((state) => ({
      ...state,
      groups: state.groups.map((group) => group.id === groupId && !group.memberIds.includes(memberId)
        ? { ...group, memberIds: [...group.memberIds, memberId] }
        : group),
    }))
    setTeamStatus(t('memberAdded'))
    closeDialog()
  }
  const inviteByEmail = async (groupId: string, email: string) => {
    await simulate()
    const invitationId = nextPrototypeId('invite')
    updateSettingsCustomizeState((state) => ({
      ...state,
      invitations: [...state.invitations, { id: invitationId, email, groupId, status: 'pending' }],
    }))
    return `${window.location.origin}/accept-invitation?token=${encodeURIComponent(invitationId)}`
  }
  const deleteGroup = (groupId: string) => updateSettingsCustomizeState((state) => ({
    ...state,
    groups: state.groups.filter((group) => group.id !== groupId),
    invitations: state.invitations.filter((invitation) => invitation.groupId !== groupId),
  }))

  return (
    <div className="kx-stack">
      <div className="kx-toolbar">
        <p>{data.teamMembers.length} {t('members')}</p>
        <button className="kx-button kx-button--primary" onClick={(event) => openCreate(event.currentTarget)}><Plus size={15} />{t('createGroup')}</button>
      </div>
      {teamStatus && <p className="kx-notice" role="status">{teamStatus}</p>}
      <h3>{t('groups')}</h3>
      <div className="kx-list">
        {data.groups.map((group) => (
          <article className="kx-list-row" key={group.id}>
            <div>
              <strong>{group.displayName}</strong>
              <span>{group.slug} · {group.memberIds.length} {t('members').toLowerCase()} · {group.role === 'owner' ? t('roleOwner') : group.role === 'member' ? t('roleMember') : t('roleViewer')}</span>
            </div>
            {group.protected && <Status tone="success"><ShieldCheck size={12} />{t('protectedGroup')}</Status>}
            <div className="kx-row-actions">
              <button className="kx-button kx-button--small" aria-label={`${t('invite')} ${group.displayName}`} onClick={(event) => openInvite(event.currentTarget, group.id)}><UserPlus size={13} />{t('invite')}</button>
              {!group.protected && <button className="kx-icon-btn" aria-label={`${t('delete')} ${group.displayName}`} onClick={() => deleteGroup(group.id)}><Trash2 size={15} /></button>}
            </div>
          </article>
        ))}
      </div>
      <h3>{t('invitations')}</h3>
      <div className="kx-list">
        {data.invitations.map((invite) => (
          <article className="kx-list-row" key={invite.id}>
            <div><strong>{invite.email}</strong><span>{data.groups.find((group) => group.id === invite.groupId)?.displayName}</span></div>
            <Status tone={invite.status === 'pending' ? 'warning' : 'danger'}>{invite.status === 'pending' ? t('pending') : t('revoked')}</Status>
            {invite.status === 'pending' && <button className="kx-button kx-button--small" onClick={() => updateSettingsCustomizeState((state) => ({ ...state, invitations: state.invitations.map((item) => item.id === invite.id ? { ...item, status: 'revoked' } : item) }))}>{t('revoke')}</button>}
          </article>
        ))}
      </div>
      {dialog?.kind === 'create' && <CreateGroupDialog groups={data.groups} onCreate={createGroup} onClose={closeDialog} />}
      {dialog?.kind === 'invite' && selectedGroup && (
        <InviteMemberDialog
          group={selectedGroup}
          members={data.teamMembers}
          pendingEmails={data.invitations.filter((invitation) => invitation.groupId === selectedGroup.id && invitation.status === 'pending').map((invitation) => invitation.email)}
          onAddMember={(memberId) => addMember(selectedGroup.id, memberId)}
          onInvite={(email) => inviteByEmail(selectedGroup.id, email)}
          onClose={closeDialog}
        />
      )}
    </div>
  )
}

export default function SettingsModal() {
  const { state, dispatch } = useMockup()
  const { dismissOverlay } = useOverlayLifecycle()
  const { t } = usePrototypeLocale()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [retried, setRetried] = useState(false)
  useFocusContainment(dialogRef)
  const destination: SettingsDestination = state.overlay.kind === 'settings' ? state.overlay : DEFAULT_SETTINGS_DESTINATION
  const section: SettingsSection = destination.section
  const billingTab = destination.section === 'billing' ? destination.subtab : 'usage'
  const select = (next: SettingsDestination) => dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'settings', destination: next } })

  return <><div className="kx-modal-backdrop" aria-hidden="true" /><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} data-testid="settings-modal" className="kx-modal kx-settings"><header className="kx-settings__head"><div><h2 id={titleId}>{t('settings')}</h2><p>{t('illustrative')}</p></div><button className="kx-icon-btn" aria-label={t('close')} onClick={dismissOverlay}><X size={17} /></button></header><div className="kx-settings__body"><nav role="tablist" className="kx-settings__sections" aria-label={t('settings')}>{(['general', 'billing', 'team'] as SettingsSection[]).map((item) => <button role="tab" key={item} aria-selected={section === item} aria-current={section === item ? 'page' : undefined} onClick={() => select(item === 'billing' ? { section: 'billing', subtab: 'usage' } : { section: item })}>{t(item)}</button>)}</nav><main className="kx-settings__panel">{section === 'billing' ? <BillingWorkspace subtab={billingTab} select={(subtab) => select({ section: 'billing', subtab })} demoVariant={state.demoVariant} /> : state.demoVariant === 'loading' ? <div className="kx-state" role="status"><span className="kx-spinner" />{t('loading')}</div> : state.demoVariant === 'error' && !retried ? <div className="kx-state" role="alert"><strong>{t('loadError')}</strong><button className="kx-button" onClick={() => setRetried(true)}>{t('retry')}</button></div> : state.demoVariant === 'empty' ? <div className="kx-state"><strong>{t('noData')}</strong></div> : section === 'general' ? <GeneralPanel /> : <TeamPanel />}</main></div></div></>
}
