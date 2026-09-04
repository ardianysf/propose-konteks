import { Bot, Boxes, Cable, Database, Shield, X, type LucideIcon } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { usePrototypeLocale, type PrototypeCopyKey } from '../../i18n/prototypeLocale'
import { useMockup } from '../../state/MockupContext'
import { DEFAULT_CUSTOMIZE_DESTINATION, type CustomizeDestination } from '../../state/mockupReducer'
import { useOverlayLifecycle } from '../shell/OverlayLifecycle'
import { useFocusContainment } from '../shell/useFocusContainment'
import AgentsPanel from './AgentsPanel'
import ContextPanel from './ContextPanel'
import CapabilitiesPanel from './CapabilitiesPanel'
import ConnectionsPanel from './ConnectionsPanel'
import AdminPanel from './AdminPanel'
import './CustomizeModal.css'

const SECTIONS: { section: CustomizeDestination['section']; label: PrototypeCopyKey; icon: LucideIcon }[] = [
  { section: 'agents', label: 'agents', icon: Bot },
  { section: 'context', label: 'context', icon: Database },
  { section: 'capabilities', label: 'capabilities', icon: Boxes },
  { section: 'connections', label: 'connections', icon: Cable },
  { section: 'admin', label: 'admin', icon: Shield },
]

function defaultFor(section: CustomizeDestination['section']): CustomizeDestination {
  if (section === 'agents') return { section }
  if (section === 'context') return { section, subtab: 'files' }
  if (section === 'capabilities') return { section, subtab: 'skills' }
  if (section === 'connections') return { section, subtab: 'mcp' }
  return { section, subtab: 'runtimes' }
}

export default function CustomizeModal() {
  const { state, dispatch } = useMockup()
  const { dismissOverlay } = useOverlayLifecycle()
  const { t } = usePrototypeLocale()
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const [retried, setRetried] = useState(false)
  useFocusContainment(dialogRef)
  const destination = state.overlay.kind === 'customize' ? state.overlay.destination : DEFAULT_CUSTOMIZE_DESTINATION
  const select = (next: CustomizeDestination) => dispatch({ type: 'SET_CUSTOMIZE_DESTINATION', destination: next })
  const panel = destination.section === 'agents' ? <AgentsPanel /> : destination.section === 'context' ? <ContextPanel subtab={destination.subtab} onSelect={(subtab) => select({ section: 'context', subtab })} /> : destination.section === 'capabilities' ? <CapabilitiesPanel subtab={destination.subtab} onSelect={(subtab) => select({ section: 'capabilities', subtab })} /> : destination.section === 'connections' ? <ConnectionsPanel subtab={destination.subtab} onSelect={(subtab) => select({ section: 'connections', subtab })} /> : <AdminPanel subtab={destination.subtab} onSelect={(subtab) => select({ section: 'admin', subtab })} />

  return <><div className="kx-modal-backdrop" aria-hidden="true" /><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} data-testid="customize-modal" className="kx-modal kx-customize"><header className="kx-customize__head"><div><h2 id={titleId}>{t('customize')}</h2><p>{t('illustrative')}</p></div><button className="kx-icon-btn" aria-label={t('close')} onClick={dismissOverlay}><X size={17} /></button></header><div className="kx-customize__body"><nav role="tablist" className="kx-customize__nav" aria-label={t('customize')}>{SECTIONS.map(({ section, label, icon: Icon }) => <button role="tab" key={section} className="kx-customize__tab" aria-current={destination.section === section ? 'page' : undefined} aria-selected={destination.section === section} onClick={() => select(defaultFor(section))}><Icon size={15} />{t(label)}</button>)}</nav><main className="kx-customize__content">{state.demoVariant === 'loading' ? <div className="kx-state" role="status"><span className="kx-spinner" />{t('loading')}</div> : state.demoVariant === 'error' && !retried ? <div className="kx-state" role="alert"><strong>{t('loadError')}</strong><button className="kx-button" onClick={() => setRetried(true)}>{t('retry')}</button></div> : state.demoVariant === 'empty' ? <div className="kx-state"><strong>{t('noData')}</strong><button className="kx-button kx-button--primary">{t('addItem')}</button></div> : panel}</main></div></div></>
}
