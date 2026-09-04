import { useState, type FormEvent, type RefObject } from 'react'
import { usePrototypeLocale } from '../../i18n/prototypeLocale'
import type { ContextResource, RepositoryContext } from '../../state/settingsCustomizeStore'
import NestedFormDialog from '../shared/NestedFormDialog'

export interface ContextResourceDraft { name: string; detail: string; content: string }

export function ContextResourceDialog({ resource, resources, triggerRef, onSave, onClose }: {
  resource?: ContextResource
  resources: ContextResource[]
  triggerRef: RefObject<HTMLElement | null>
  onSave: (draft: ContextResourceDraft) => Promise<void>
  onClose: () => void
}) {
  const { t } = usePrototypeLocale()
  const [name, setName] = useState(resource?.name ?? '')
  const [detail, setDetail] = useState(resource?.detail ?? '')
  const [content, setContent] = useState(resource?.content ?? '')
  const [busy, setBusy] = useState(false)
  const duplicate = resources.some((item) => item.id !== resource?.id && item.name.toLowerCase() === name.trim().toLowerCase())
  const valid = Boolean(name.trim() && content.trim()) && !duplicate
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!valid || busy) return; setBusy(true); try { await onSave({ name: name.trim(), detail: detail.trim(), content }) } finally { setBusy(false) } }
  return <NestedFormDialog title={resource ? t('editResource') : t('createResource')} description={t('resourceFormHelp')} busy={busy} onClose={onClose} returnFocusRef={triggerRef} size="wide" footer={<><button className="kx-button" type="button" disabled={busy} onClick={onClose}>{t('cancel')}</button><button className="kx-button kx-button--primary" type="submit" form="context-resource-form" disabled={!valid || busy}>{busy ? t('saving') : t('save')}</button></>}>
    <form id="context-resource-form" className="kx-dialog-form" onSubmit={submit}>
      <label className="kx-field"><span>{t('name')}</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} /></label>
      {duplicate && <p className="kx-validation" role="alert">{t('duplicateName')}</p>}
      <label className="kx-field"><span>{t('description')}</span><input value={detail} onChange={(event) => setDetail(event.target.value)} /></label>
      <label className="kx-field"><span>{t('content')}</span><textarea value={content} onChange={(event) => setContent(event.target.value)} /></label>
    </form>
  </NestedFormDialog>
}

function isHttpsUrl(value: string) { try { return new URL(value).protocol === 'https:' } catch { return false } }

export function RepositoryDialog({ repository, triggerRef, onSave, onClose }: {
  repository: RepositoryContext
  triggerRef: RefObject<HTMLElement | null>
  onSave: (draft: RepositoryContext) => Promise<void>
  onClose: () => void
}) {
  const { t } = usePrototypeLocale()
  const [url, setUrl] = useState(repository.url)
  const [ref, setRef] = useState(repository.ref)
  const [path, setPath] = useState(repository.path)
  const [busy, setBusy] = useState(false)
  const valid = isHttpsUrl(url) && Boolean(ref.trim())
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!valid || busy) return; setBusy(true); try { await onSave({ url: url.trim(), ref: ref.trim(), path: path.trim() || '/', lastLoaded: 'Just now' }) } finally { setBusy(false) } }
  return <NestedFormDialog title={t('loadRepository')} description={t('repositoryFormHelp')} busy={busy} onClose={onClose} returnFocusRef={triggerRef} footer={<><button className="kx-button" type="button" disabled={busy} onClick={onClose}>{t('cancel')}</button><button className="kx-button kx-button--primary" type="submit" form="repository-form" disabled={!valid || busy}>{busy ? t('loadingRepository') : t('loadRepository')}</button></>}>
    <form id="repository-form" className="kx-dialog-form" onSubmit={submit}>
      <label className="kx-field"><span>{t('repositoryUrl')}</span><input autoFocus type="url" value={url} onChange={(event) => setUrl(event.target.value)} /></label>
      {url && !isHttpsUrl(url) && <p className="kx-validation" role="alert">{t('invalidUrl')}</p>}
      <label className="kx-field"><span>{t('repositoryRef')}</span><input value={ref} onChange={(event) => setRef(event.target.value)} placeholder="main" /></label>
      <label className="kx-field"><span>{t('repositoryPath')}</span><input value={path} onChange={(event) => setPath(event.target.value)} placeholder="/" /></label>
    </form>
  </NestedFormDialog>
}
