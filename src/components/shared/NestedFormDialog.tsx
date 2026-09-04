import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import { usePrototypeLocale } from '../../i18n/prototypeLocale'
import { useFocusContainment } from '../shell/useFocusContainment'
import './NestedFormDialog.css'

export type NestedDialogSize = 'compact' | 'default' | 'wide'

interface NestedFormDialogProps {
  title: string
  description: string
  busy: boolean
  onClose: () => void
  children: ReactNode
  footer: ReactNode
  size?: NestedDialogSize
  returnFocusRef?: RefObject<HTMLElement | null>
  backdropTestId?: string
}

export default function NestedFormDialog({
  title,
  description,
  busy,
  onClose,
  children,
  footer,
  size = 'default',
  returnFocusRef,
  backdropTestId = 'nested-dialog-backdrop',
}: NestedFormDialogProps) {
  const { t } = usePrototypeLocale()
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusContainment(dialogRef)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopImmediatePropagation()
      if (!busy) onClose()
    }
    document.addEventListener('keydown', handleEscape, true)
    return () => document.removeEventListener('keydown', handleEscape, true)
  }, [busy, onClose])

  useEffect(() => () => {
    window.setTimeout(() => returnFocusRef?.current?.focus(), 0)
  }, [returnFocusRef])

  return (
    <>
      <div
        className="kx-modal-backdrop kx-modal-backdrop--nested"
        data-testid={backdropTestId}
        aria-hidden="true"
        onMouseDown={() => { if (!busy) onClose() }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={`kx-modal kx-nested-dialog kx-nested-dialog--${size}`}
      >
        <header className="kx-nested-dialog__head">
          <div>
            <h2 id={titleId}>{title}</h2>
            <p id={descriptionId}>{description}</p>
          </div>
          <button className="kx-icon-btn" type="button" aria-label={t('close')} onClick={onClose} disabled={busy}>
            <X size={17} />
          </button>
        </header>
        <div className="kx-nested-dialog__body">{children}</div>
        <footer className="kx-nested-dialog__footer">{footer}</footer>
      </div>
    </>
  )
}
