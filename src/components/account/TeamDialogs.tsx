import { Check, Copy, Search } from 'lucide-react'
import {
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { usePrototypeLocale } from '../../i18n/prototypeLocale'
import type { TeamGroup, TeamMember } from '../../state/settingsCustomizeStore'
import NestedFormDialog from '../shared/NestedFormDialog'
import './TeamDialogs.css'

const WORKSPACE_PREFIX = 'refactory-'
const MAX_GROUP_SLUG_LENGTH = 63
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface NewTeamGroup {
  slug: string
  displayName: string
  description: string
  role: 'member' | 'viewer'
}

function displayNameFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

export function CreateGroupDialog({
  groups,
  onCreate,
  onClose,
}: {
  groups: TeamGroup[]
  onCreate: (group: NewTeamGroup) => Promise<void>
  onClose: () => void
}) {
  const { t } = usePrototypeLocale()
  const slugId = useId()
  const slugHelpId = useId()
  const [slug, setSlug] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [role, setRole] = useState<'member' | 'viewer'>('member')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const fullSlug = `${WORKSPACE_PREFIX}${slug.trim()}`
  const remaining = MAX_GROUP_SLUG_LENGTH - fullSlug.length

  const slugError = !slug.trim()
    ? t('slugRequired')
    : fullSlug.length > MAX_GROUP_SLUG_LENGTH
      ? t('slugTooLong')
      : !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())
        ? t('slugInvalid')
        : groups.some((group) => group.slug.toLowerCase() === fullSlug.toLowerCase())
          ? t('slugDuplicate')
          : ''

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (slugError || busy) return
    setBusy(true)
    try {
      await onCreate({
        slug: fullSlug,
        displayName: displayName.trim() || displayNameFromSlug(slug.trim()),
        description: description.trim(),
        role,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <NestedFormDialog
      title={t('createGroup')}
      description={t('createGroupHelp')}
      busy={busy}
      onClose={onClose}
      backdropTestId="team-dialog-backdrop"
      footer={(
        <>
          <button className="kx-button" type="button" onClick={onClose} disabled={busy}>{t('cancel')}</button>
          <button className="kx-button kx-button--primary" type="submit" form="create-team-group" disabled={Boolean(slugError) || busy}>
            {busy && <span className="kx-spinner kx-spinner--small" aria-hidden="true" />}
            {busy ? t('creatingGroup') : t('createGroup')}
          </button>
        </>
      )}
    >
      <form id="create-team-group" className="kx-dialog-form" onSubmit={submit}>
        <label className="kx-field" htmlFor={slugId}>
          <span>{t('groupSlug')}</span>
          <span className="kx-prefix-input">
            <span aria-hidden="true">{WORKSPACE_PREFIX}</span>
            <input
              id={slugId}
              aria-label={t('groupSlug')}
              value={slug}
              aria-describedby={slugHelpId}
              aria-invalid={touched && Boolean(slugError)}
              onBlur={() => setTouched(true)}
              onChange={(event) => { setSlug(event.target.value); setTouched(true) }}
              placeholder="engineering"
            />
          </span>
        </label>
        <div id={slugHelpId} className="kx-field-help">
          <span>{t('groupSlugHelp')}</span>
          <span aria-live="polite">{remaining}</span>
        </div>
        {touched && slugError && <p className="kx-validation" role="alert">{slugError}</p>}
        <label className="kx-field">
          <span>{t('groupDisplayName')}</span>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Engineering" />
        </label>
        <label className="kx-field">
          <span>{t('groupDescription')}</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Who this group is for" />
        </label>
        <label className="kx-field">
          <span>{t('groupRole')}</span>
          <select value={role} onChange={(event) => setRole(event.target.value as 'member' | 'viewer')}>
            <option value="member">{t('roleMember')}</option>
            <option value="viewer">{t('roleViewer')}</option>
          </select>
        </label>
      </form>
    </NestedFormDialog>
  )
}

interface InvitationHandoff {
  email: string
  url: string
}

export function InviteMemberDialog({
  group,
  members,
  pendingEmails,
  onAddMember,
  onInvite,
  onClose,
}: {
  group: TeamGroup
  members: TeamMember[]
  pendingEmails: string[]
  onAddMember: (memberId: string) => Promise<void>
  onInvite: (email: string) => Promise<string>
  onClose: () => void
}) {
  const { t } = usePrototypeLocale()
  const [mode, setMode] = useState<'existing' | 'email'>('existing')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [handoff, setHandoff] = useState<InvitationHandoff | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'failure'>('idle')

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 300)
    return () => window.clearTimeout(timer)
  }, [])

  const availableMembers = useMemo(
    () => members.filter((member) => !group.memberIds.includes(member.id)),
    [group.memberIds, members],
  )
  const normalizedQuery = query.trim().toLowerCase()
  const matches = normalizedQuery
    ? availableMembers.filter((member) => `${member.name} ${member.email}`.toLowerCase().includes(normalizedQuery))
    : []
  const normalizedEmail = email.trim().toLowerCase()
  const existingMember = members.find((member) => member.email.toLowerCase() === normalizedEmail)
  const emailError = !normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)
    ? t('invalidEmail')
    : existingMember && group.memberIds.includes(existingMember.id)
      ? t('memberAlreadyInGroup')
      : pendingEmails.some((pendingEmail) => pendingEmail.toLowerCase() === normalizedEmail)
        ? t('invitationAlreadyPending')
        : ''

  const addExisting = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedId || busy) return
    setBusy(true)
    try {
      await onAddMember(selectedId)
    } finally {
      setBusy(false)
    }
  }

  const inviteByEmail = async (event: FormEvent) => {
    event.preventDefault()
    setEmailTouched(true)
    if (emailError || busy) return
    setBusy(true)
    try {
      const url = await onInvite(normalizedEmail)
      setHandoff({ email: normalizedEmail, url })
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async () => {
    if (!handoff) return
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(handoff.url)
      setCopyState('success')
    } catch {
      setCopyState('failure')
    }
  }

  if (handoff) {
    return (
      <NestedFormDialog
        title={t('invitationReady')}
        description={`${handoff.email} · ${group.displayName}`}
        busy={false}
        onClose={onClose}
        size="wide"
        backdropTestId="team-dialog-backdrop"
        footer={<button className="kx-button kx-button--primary" type="button" onClick={onClose}>{t('close')}</button>}
      >
        <div className="kx-invitation-handoff">
          <div className="kx-handoff-icon" aria-hidden="true"><Check size={19} /></div>
          <div>
            <strong>{t('acceptanceLinkHelp')}</strong>
            <p>{t('invitationExpires')}</p>
          </div>
        </div>
        <p className="kx-dialog-warning">{t('acceptanceLinkWarning')}</p>
        <label className="kx-field">
          <span>{t('acceptanceLink')}</span>
          <span className="kx-copy-field">
            <input readOnly value={handoff.url} onFocus={(event) => event.currentTarget.select()} />
            <button className="kx-button" type="button" onClick={copyLink}><Copy size={14} />{t('copyLink')}</button>
          </span>
        </label>
        <p className={copyState === 'failure' ? 'kx-validation' : 'kx-copy-status'} role="status" aria-live="polite">
          {copyState === 'success' ? t('linkCopied') : copyState === 'failure' ? t('copyFailed') : ''}
        </p>
      </NestedFormDialog>
    )
  }

  return (
    <NestedFormDialog
      title={`${t('inviteMember')} — ${group.displayName}`}
      description={`${t('inviteToGroup')}: ${group.slug}`}
      busy={busy}
      onClose={onClose}
      size="wide"
      backdropTestId="team-dialog-backdrop"
      footer={(
        <>
          <button className="kx-button" type="button" onClick={onClose} disabled={busy}>{t('cancel')}</button>
          <button
            className="kx-button kx-button--primary"
            type="submit"
            form={mode === 'existing' ? 'add-existing-member' : 'invite-member-email'}
            disabled={busy || (mode === 'existing' ? !selectedId : Boolean(emailError))}
          >
            {busy && <span className="kx-spinner kx-spinner--small" aria-hidden="true" />}
            {busy ? (mode === 'existing' ? t('addingMember') : t('sendingInvitation')) : (mode === 'existing' ? t('addToGroup') : t('sendInvitation'))}
          </button>
        </>
      )}
    >
      <div className="kx-segment" role="tablist" aria-label={t('inviteMember')}>
        <button type="button" role="tab" aria-selected={mode === 'existing'} onClick={() => setMode('existing')}>{t('existingMembers')}</button>
        <button type="button" role="tab" aria-selected={mode === 'email'} onClick={() => setMode('email')}>{t('inviteByEmail')}</button>
      </div>
      {mode === 'existing' ? (
        <form id="add-existing-member" className="kx-dialog-form" onSubmit={addExisting}>
          <label className="kx-field">
            <span>{t('searchMembers')}</span>
            <span className="kx-search-field"><Search size={15} aria-hidden="true" /><input autoFocus type="search" value={query} onChange={(event) => { setQuery(event.target.value); setSelectedId('') }} placeholder="name@refactory.dev" /></span>
          </label>
          <p className="kx-field-help">{t('searchMembersHelp')}</p>
          <div className="kx-member-results" aria-live="polite">
            {loading ? <div className="kx-dialog-empty" role="status"><span className="kx-spinner" />{t('loadingMembers')}</div>
              : availableMembers.length === 0 ? <div className="kx-dialog-empty">{t('noMembersAvailable')}</div>
                : !normalizedQuery ? <div className="kx-dialog-empty">{t('searchPrompt')}</div>
                  : matches.length === 0 ? <div className="kx-dialog-empty">{t('noMemberResults')}</div>
                    : matches.map((member) => (
                      <label className="kx-member-option" key={member.id}>
                        <input type="radio" name="team-member" value={member.id} checked={selectedId === member.id} onChange={() => setSelectedId(member.id)} />
                        <span><strong>{member.name}</strong><small>{member.email}</small></span>
                      </label>
                    ))}
          </div>
        </form>
      ) : (
        <form id="invite-member-email" className="kx-dialog-form" onSubmit={inviteByEmail}>
          <label className="kx-field">
            <span>{t('emailAddress')}</span>
            <input autoFocus type="email" value={email} aria-invalid={emailTouched && Boolean(emailError)} onBlur={() => setEmailTouched(true)} onChange={(event) => { setEmail(event.target.value); setEmailTouched(true) }} placeholder="name@company.com" />
          </label>
          <p className="kx-field-help">{t('emailHelp')}</p>
          {emailTouched && emailError && <p className="kx-validation" role="alert">{emailError}</p>}
        </form>
      )}
    </NestedFormDialog>
  )
}
