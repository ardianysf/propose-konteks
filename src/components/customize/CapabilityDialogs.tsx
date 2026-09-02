import { useState, type FormEvent, type RefObject } from 'react'
import { usePrototypeLocale } from '../../i18n/prototypeLocale'
import type { CapabilityItem, CapabilityVersion } from '../../state/settingsCustomizeStore'
import NestedFormDialog from '../shared/NestedFormDialog'

const SEMVER = /^\d+\.\d+\.\d+$/

export interface CapabilityDraft { name: string; description: string; initialVersion?: CapabilityVersion }

export function CapabilityDialog({ capability, capabilities, triggerRef, onSave, onClose }: {
  capability?: CapabilityItem
  capabilities: CapabilityItem[]
  triggerRef: RefObject<HTMLElement | null>
  onSave: (draft: CapabilityDraft) => Promise<void>
  onClose: () => void
}) {
  const { t } = usePrototypeLocale()
  const [name, setName] = useState(capability?.name ?? '')
  const [description, setDescription] = useState(capability?.description ?? '')
  const [version, setVersion] = useState('1.0.0')
  const [notes, setNotes] = useState('Initial release.')
  const [busy, setBusy] = useState(false)
  const duplicate = capabilities.some((item) => item.id !== capability?.id && item.name.toLowerCase() === name.trim().toLowerCase())
  const valid = Boolean(name.trim() && description.trim()) && !duplicate && (Boolean(capability) || SEMVER.test(version))
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!valid || busy) return; setBusy(true); try { await onSave({ name: name.trim(), description: description.trim(), initialVersion: capability ? undefined : { version, notes: notes.trim(), createdAt: 'Sep 2, 2026' } }) } finally { setBusy(false) } }
  return <NestedFormDialog title={capability ? t('editCapability') : t('createResource')} description={t('capabilityFormHelp')} busy={busy} onClose={onClose} returnFocusRef={triggerRef} footer={<><button className="kx-button" type="button" disabled={busy} onClick={onClose}>{t('cancel')}</button><button className="kx-button kx-button--primary" type="submit" form="capability-form" disabled={!valid || busy}>{busy ? t('saving') : t('save')}</button></>}>
    <form id="capability-form" className="kx-dialog-form" onSubmit={submit}>
      <label className="kx-field"><span>{t('name')}</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} /></label>
      {duplicate && <p className="kx-validation" role="alert">{t('duplicateName')}</p>}
      <label className="kx-field"><span>{t('description')}</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      {!capability && <><label className="kx-field"><span>{t('semanticVersion')}</span><input value={version} onChange={(event) => setVersion(event.target.value)} /></label>{version && !SEMVER.test(version) && <p className="kx-validation" role="alert">{t('invalidVersion')}</p>}<label className="kx-field"><span>{t('releaseNotes')}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label></>}
    </form>
  </NestedFormDialog>
}

export function CapabilityVersionDialog({ capability, triggerRef, onSave, onClose }: {
  capability: CapabilityItem
  triggerRef: RefObject<HTMLElement | null>
  onSave: (version: CapabilityVersion) => Promise<void>
  onClose: () => void
}) {
  const { t } = usePrototypeLocale()
  const [version, setVersion] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const duplicate = capability.versions.some((item) => item.version === version.trim())
  const valid = SEMVER.test(version.trim()) && Boolean(notes.trim()) && !duplicate
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!valid || busy) return; setBusy(true); try { await onSave({ version: version.trim(), notes: notes.trim(), createdAt: 'Sep 2, 2026' }) } finally { setBusy(false) } }
  return <NestedFormDialog title={t('addVersion')} description={t('versionFormHelp')} busy={busy} onClose={onClose} returnFocusRef={triggerRef} footer={<><button className="kx-button" type="button" disabled={busy} onClick={onClose}>{t('cancel')}</button><button className="kx-button kx-button--primary" type="submit" form="capability-version-form" disabled={!valid || busy}>{busy ? t('saving') : t('addVersion')}</button></>}>
    <form id="capability-version-form" className="kx-dialog-form" onSubmit={submit}>
      <label className="kx-field"><span>{t('semanticVersion')}</span><input autoFocus value={version} onChange={(event) => setVersion(event.target.value)} placeholder="2.2.0" /></label>
      {version && !SEMVER.test(version) && <p className="kx-validation" role="alert">{t('invalidVersion')}</p>}
      {duplicate && <p className="kx-validation" role="alert">{t('duplicateVersion')}</p>}
      <label className="kx-field"><span>{t('releaseNotes')}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
    </form>
  </NestedFormDialog>
}
