/*
 * Overlay accessibility helpers (Task 13).
 *
 * Pure DOM predicates and ordered tabbable collection shared by the
 * overlay lifecycle provider and the focus-containment hook. No module
 * singleton state lives here — every function reads the live DOM it is
 * given.
 */

/** Native `disabled` or `aria-disabled="true"` — both exclude an element
 * from focus restoration and the sequential Tab order. */
export function isDisabled(element: HTMLElement): boolean {
  return (
    element.hasAttribute('disabled') ||
    element.getAttribute('aria-disabled') === 'true'
  )
}

/** Hidden for accessibility purposes: self or an ancestor carrying
 * `hidden`, `aria-hidden="true"`, or `inert`, or the element's own
 * computed `display:none` / `visibility:hidden|collapse`. */
export function isHidden(element: Element): boolean {
  let current: Element | null = element
  while (current) {
    if (
      current.hasAttribute('hidden') ||
      current.getAttribute('aria-hidden') === 'true' ||
      current.hasAttribute('inert')
    ) {
      return true
    }
    current = current.parentElement
  }

  if (element instanceof HTMLElement) {
    const style = getComputedStyle(element)
    if (style.display === 'none') return true
    if (style.visibility === 'hidden' || style.visibility === 'collapse') {
      return true
    }
  }
  return false
}

/** True when the running environment performs real layout. jsdom returns
 * a zero-sized document element rect, so zero-size origin checks are
 * skipped there and exercised through explicit layout mocks in tests. */
function hasLayoutEngine(): boolean {
  if (typeof document === 'undefined' || !document.documentElement) return false
  const rect = document.documentElement.getBoundingClientRect()
  return rect.width > 0 || rect.height > 0
}

/** A focus-return origin is restorable when it is connected, enabled,
 * exposed, and (in layout-capable browsers) has a non-zero box. */
export function isRestorable(
  element: Element | null | undefined,
): element is HTMLElement {
  if (!element || !(element instanceof HTMLElement)) return false
  if (!element.isConnected) return false
  if (isDisabled(element)) return false
  if (isHidden(element)) return false

  if (hasLayoutEngine()) {
    const rect = element.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return false
  }
  return true
}

function isContentEditableElement(element: HTMLElement): boolean {
  const value = element.getAttribute('contenteditable')
  return value === '' || value === 'true'
}

function isNamedRadioInput(element: HTMLElement): element is HTMLInputElement {
  if (typeof HTMLInputElement === 'undefined') return false
  if (!(element instanceof HTMLInputElement)) return false
  if (element.type !== 'radio') return false
  const name = element.getAttribute('name')
  return name !== null && name !== ''
}

/** Single-element tabbable predicate — enabled, exposed, and part of the
 * sequential Tab order (tabIndex >= 0). Radio-group collapsing is applied
 * separately by `getTabbableElements`. */
export function isTabbable(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false
  if (element instanceof HTMLInputElement && element.type === 'hidden') {
    return false
  }
  if (isHidden(element)) return false
  if (isDisabled(element)) return false

  // jsdom reports tabIndex -1 for contenteditable elements; treat them as
  // sequential stops unless they carry an explicit negative tabindex.
  if (isContentEditableElement(element)) {
    return element.getAttribute('tabindex') === null || element.tabIndex >= 0
  }
  return element.tabIndex >= 0
}

const TABBABLE_SELECTOR = [
  'a[href]',
  'button',
  'select',
  'textarea',
  'input',
  '[contenteditable]',
  '[tabindex]',
].join(',')

/** Ordered enabled, visible, sequential tab stops in DOM order. Named
 * radio groups contribute exactly one stop: the checked eligible radio,
 * or the first eligible radio in DOM order when none is checked. */
export function getTabbableElements(scope: Element): HTMLElement[] {
  const candidates = Array.from(
    scope.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR),
  ).filter(isTabbable)

  const result: HTMLElement[] = []
  const handledRadioGroups = new Set<string>()

  for (const element of candidates) {
    if (isNamedRadioInput(element)) {
      const name = element.getAttribute('name')!
      if (handledRadioGroups.has(name)) continue
      handledRadioGroups.add(name)

      const group = candidates.filter(
        (candidate): candidate is HTMLInputElement =>
          isNamedRadioInput(candidate) && candidate.getAttribute('name') === name,
      )
      const checked = group.find((radio) => radio.checked)
      result.push(checked ?? group[0])
      continue
    }
    result.push(element)
  }

  return result
}
