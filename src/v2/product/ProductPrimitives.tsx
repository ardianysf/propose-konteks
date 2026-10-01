import NestedFormDialog from '../../components/shared/NestedFormDialog'
import { ArrowLeft, Search } from 'lucide-react'
import { useRef, useState, type ReactNode, type RefObject } from 'react'
import { useMockup } from '../../state/MockupContext'
import StatusBadge from '../../components/technical/StatusBadge'
import type { TechStatus } from '../../components/technical/StatusBadge'
import '../../components/technical/technical.css'
import './product.css'

export function ProductPageHeader({
  title,
  description,
  actions,
  onBack,
  backLabel = 'Back',
}: {
  title: string
  description?: string
  actions?: ReactNode
  onBack?: () => void
  backLabel?: string
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  return (
    <header className="kx-product-header">
      <div>
        {onBack && (
          <button className="kx-product-back" onClick={onBack}>
            <ArrowLeft size={14} />
            {backLabel}
          </button>
        )}
        <h1 ref={heading} tabIndex={-1}>
          {title}
        </h1>
        {description && <p>{description}</p>}
      </div>
      <div className="kx-product-header__actions">
        <span className="kx-product-illustrative">Illustrative data</span>
        {actions}
      </div>
    </header>
  )
}
export function ProductFilters({
  query,
  onQuery,
  showCreate = false,
  showSearch = true,
}: {
  query: string
  onQuery: (query: string) => void
  showCreate?: boolean
  showSearch?: boolean
}) {
  const { state, dispatch } = useMockup()
  return (
    <div className="kx-product-filters">
      <div
        role="group"
        aria-label="Filter by Software System"
        className="kx-product-system-filters"
      >
        {[{ id: 'all', name: 'All systems' }, ...state.systems].map((s) => (
          <button
            key={s.id}
            className="kx-button kx-button--small"
            aria-pressed={state.product.systemFilter === s.id}
            onClick={() =>
              dispatch({
                type: 'PRODUCT',
                action: { kind: 'filter', systemId: s.id },
              })
            }
          >
            {s.name}
          </button>
        ))}
        {showCreate && (
          <button
            className="kx-button kx-button--small"
            onClick={() =>
              dispatch({ type: 'NAVIGATE_PRODUCT', route: 'systems' })
            }
          >
            Manage systems
          </button>
        )}
      </div>
      {showSearch && (
        <label className="kx-product-search">
          <Search size={15} />
          <input
            type="search"
            aria-label="Search initiatives"
            placeholder="Search initiatives…"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>
      )}
    </div>
  )
}
export function ProductRow({
  title,
  description,
  meta,
  status,
  statusLabel,
  onClick,
}: {
  title: string
  description?: string
  meta?: string
  status?: TechStatus
  statusLabel?: string
  onClick: () => void
}) {
  return (
    <button className="kx-product-row" onClick={onClick}>
      <span className="kx-product-avatar" aria-hidden="true">
        {title.slice(0, 1).toUpperCase()}
      </span>
      <span className="kx-product-row__copy">
        <strong>{title}</strong>
        {description && <span>{description}</span>}
        {meta && <small>{meta}</small>}
      </span>
      {status && <StatusBadge status={status} label={statusLabel} />}
    </button>
  )
}
export function ProductEmpty({
  title,
  children,
  action,
}: {
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="kx-product-empty">
      <span className="kx-product-empty__mark" aria-hidden="true">
        —
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  )
}
export function ProductStateGate({
  children,
  empty,
}: {
  children: ReactNode
  empty?: ReactNode
}) {
  const { state } = useMockup()
  const [recovered, setRecovered] = useState(false)
  if (state.demoVariant === 'loading')
    return (
      <div
        role="status"
        aria-label="Loading content"
        className="kx-product-skeleton"
      >
        <p>Loading…</p>
        {[1, 2, 3].map((n) => (
          <span key={n} />
        ))}
      </div>
    )
  if (state.demoVariant === 'error' && !recovered)
    return (
      <div role="alert" className="kx-product-empty">
        <h2>Unable to load this view</h2>
        <p>Your changes are safe. Try loading it again.</p>
        <button className="kx-button" onClick={() => setRecovered(true)}>
          Retry
        </button>
      </div>
    )
  if (state.demoVariant === 'empty' && empty) return <>{empty}</>
  return <>{children}</>
}

export function ProductDialog({
  title,
  children,
  onClose,
  triggerRef,
  footer,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  triggerRef: RefObject<HTMLElement | null>
  footer?: ReactNode
}) {
  return (
    <NestedFormDialog
      title={title}
      description="Illustrative data · changes stay in this prototype."
      busy={false}
      onClose={onClose}
      returnFocusRef={triggerRef}
      footer={
        footer ?? (
          <button className="kx-button" onClick={onClose}>
            Done
          </button>
        )
      }
    >
      {children}
    </NestedFormDialog>
  )
}
