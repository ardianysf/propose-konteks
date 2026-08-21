/*
 * useFocusContainment (Task 13) — shared modal focus containment for the
 * six modal surfaces (repository, manual repository, create system,
 * Customize, Learned, Settings).
 *
 * In one layout effect before paint, the hook focuses the existing
 * tabIndex={-1} root, then installs bubbling document keydown/focusin
 * listeners with a redirect guard; cleanup removes both listeners. Menus
 * intentionally do not use this hook.
 *
 * Catalog previews bypass containment (via CatalogPreviewContext) to
 * preserve catalog navigation: focus traps would block breadcrumb/backlink
 * clicks after the lazy preview resolves.
 */
import { useLayoutEffect, useRef, type RefObject } from 'react'
import { getTabbableElements } from '../../utils/overlays'
import { useIsCatalogPreview } from '../../catalog/CatalogPreviewContext'

export interface FocusContainmentOptions {
  /** When false the hook installs nothing (kept for callers that may gate). */
  active?: boolean
}

export function useFocusContainment(
  rootRef: RefObject<HTMLElement | null>,
  options?: FocusContainmentOptions,
): void {
  const active = options?.active ?? true
  const redirectingRef = useRef(false)
  const isCatalogPreview = useIsCatalogPreview()

  useLayoutEffect(() => {
    // Skip containment in catalog previews to preserve navigation
    if (isCatalogPreview) return
    if (!active) return
    const root = rootRef.current
    if (!root || !root.isConnected) return

    // Atomic initial focus — the same tabIndex=-1 root each modal already
    // exposes, focused before paint with no mounted-but-unprotected gap.
    root.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const tabbable = getTabbableElements(root)
      if (tabbable.length === 0) {
        // Zero-tabbable fallback — keep the dialog root focused.
        event.preventDefault()
        redirectingRef.current = true
        root.focus()
        redirectingRef.current = false
        return
      }

      const first = tabbable[0]
      const last = tabbable[tabbable.length - 1]
      const activeElement = document.activeElement as HTMLElement | null

      // Redirect an escaped/outside active element back into the cycle.
      if (!activeElement || !root.contains(activeElement)) {
        event.preventDefault()
        redirectingRef.current = true
        if (event.shiftKey) last.focus()
        else first.focus()
        redirectingRef.current = false
        return
      }

      // Interior Tab stays native — only the two cycle edges wrap.
      if (event.shiftKey) {
        if (activeElement === first) {
          event.preventDefault()
          redirectingRef.current = true
          last.focus()
          redirectingRef.current = false
        }
      } else if (activeElement === last) {
        event.preventDefault()
        redirectingRef.current = true
        first.focus()
        redirectingRef.current = false
      }
    }

    // Safety net: if focus escapes the modal by any non-Tab means, pull it
    // back to the first tabbable (or the root when empty). The redirecting
    // guard prevents re-entrant focus from looping.
    const onFocusIn = (event: FocusEvent) => {
      if (redirectingRef.current) return
      const target = event.target as HTMLElement | null
      if (!target || root.contains(target)) return

      redirectingRef.current = true
      const tabbable = getTabbableElements(root)
      if (tabbable.length === 0) {
        root.focus()
      } else {
        tabbable[0].focus()
      }
      redirectingRef.current = false
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [active, isCatalogPreview, rootRef])
}
