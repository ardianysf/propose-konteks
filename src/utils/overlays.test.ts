/*
 * overlays.test.ts — pure predicate + tabbable-collection coverage for the
 * Task 13 overlay accessibility helpers. No React here: the helpers read
 * live DOM, so these tests build jsdom fixtures directly.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getTabbableElements,
  isDisabled,
  isHidden,
  isRestorable,
  isTabbable,
} from './overlays'

function element(tag = 'div', attrs: Record<string, string> = {}): HTMLElement {
  const node = document.createElement(tag)
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  return node
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

describe('isDisabled', () => {
  it('treats the native disabled attribute and aria-disabled="true" as disabled', () => {
    const native = element('button', { disabled: '' })
    const aria = element('button', { 'aria-disabled': 'true' })
    expect(isDisabled(native)).toBe(true)
    expect(isDisabled(aria)).toBe(true)
  })

  it('treats aria-disabled="false" and unmarked controls as enabled', () => {
    expect(isDisabled(element('button'))).toBe(false)
    expect(isDisabled(element('button', { 'aria-disabled': 'false' }))).toBe(false)
    expect(isDisabled(element('button', { 'aria-disabled': 'true-ish' }))).toBe(false)
  })
})

describe('isHidden', () => {
  it('detects self or ancestor hidden / aria-hidden="true" / inert', () => {
    for (const attrs of [
      { hidden: '' },
      { 'aria-hidden': 'true' },
      { inert: '' },
    ] as Array<Record<string, string>>) {
      const node = element('div', attrs)
      document.body.append(node)
      expect(isHidden(node)).toBe(true)
      node.remove()
    }

    const ancestor = element('div', { 'aria-hidden': 'true' })
    const child = element('button')
    ancestor.append(child)
    document.body.append(ancestor)
    expect(isHidden(child)).toBe(true)
  })

  it('detects computed display:none and visibility:hidden|collapse', () => {
    const displayNone = element('button')
    displayNone.style.display = 'none'
    document.body.append(displayNone)
    expect(isHidden(displayNone)).toBe(true)
    displayNone.remove()

    const hidden = element('button')
    hidden.style.visibility = 'hidden'
    document.body.append(hidden)
    expect(isHidden(hidden)).toBe(true)
    hidden.remove()

    const collapsed = element('button')
    collapsed.style.visibility = 'collapse'
    document.body.append(collapsed)
    expect(isHidden(collapsed)).toBe(true)
  })

  it('returns false for a plain, attached, visible element', () => {
    const node = element('button')
    document.body.append(node)
    expect(isHidden(node)).toBe(false)
  })
})

describe('isRestorable', () => {
  it('rejects null, undefined, and non-HTMLElement origins', () => {
    expect(isRestorable(null)).toBe(false)
    expect(isRestorable(undefined)).toBe(false)
    expect(isRestorable(document.createTextNode('x') as unknown as HTMLElement)).toBe(false)
  })

  it('rejects disconnected, disabled, and hidden origins', () => {
    const disconnected = element('button')
    expect(isRestorable(disconnected)).toBe(false)

    const disabled = element('button', { disabled: '' })
    document.body.append(disabled)
    expect(isRestorable(disabled)).toBe(false)

    const hidden = element('button', { hidden: '' })
    document.body.append(hidden)
    expect(isRestorable(hidden)).toBe(false)
  })

  it('accepts a connected, enabled, visible origin when jsdom reports no layout', () => {
    const node = element('button')
    document.body.append(node)
    // jsdom's documentElement has a zero box, so the zero-size origin
    // check is skipped here and covered by the explicit layout mock below.
    expect(isRestorable(node)).toBe(true)
  })

  it('rejects a zero-sized origin when a layout engine is simulated', () => {
    const node = element('button')
    document.body.append(node)

    vi.spyOn(document.documentElement, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 1024,
      bottom: 768,
      width: 1024,
      height: 768,
      toJSON: () => ({}),
    } as DOMRect)
    vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      toJSON: () => ({}),
    } as DOMRect)

    expect(isRestorable(node)).toBe(false)
  })
})

describe('isTabbable', () => {
  it('excludes hidden inputs, hidden/disabled elements, and negative tabindex', () => {
    const hiddenInput = element('input', { type: 'hidden' })
    const disabled = element('button', { disabled: '' })
    const negative = element('button', { tabindex: '-1' })
    for (const node of [hiddenInput, disabled, negative]) {
      document.body.append(node)
      expect(isTabbable(node)).toBe(false)
      node.remove()
    }
  })

  it('includes plain buttons, inputs, and links with href', () => {
    const button = element('button')
    const input = element('input')
    const link = element('a', { href: '#x' })
    for (const node of [button, input, link]) {
      document.body.append(node)
      expect(isTabbable(node)).toBe(true)
      node.remove()
    }
  })

  it('treats contenteditable as sequential unless it carries an explicit negative tabindex', () => {
    const editable = element('div', { contenteditable: '' })
    document.body.append(editable)
    expect(isTabbable(editable)).toBe(true)

    const skipped = element('div', { contenteditable: '', tabindex: '-1' })
    document.body.append(skipped)
    expect(isTabbable(skipped)).toBe(false)
  })
})

describe('getTabbableElements', () => {
  it('returns enabled, visible sequential stops in DOM order, skipping disabled and negative-tabindex nodes', () => {
    const scope = element('div')
    const first = element('button')
    const skipped = element('button', { disabled: '' })
    const negative = element('button', { tabindex: '-1' })
    const last = element('button')
    scope.append(first, skipped, negative, last)
    document.body.append(scope)

    expect(getTabbableElements(scope)).toEqual([first, last])
  })

  it('collapses a named radio group to the checked radio, or the first when none is checked', () => {
    const scope = element('div')
    const checked = element('input', { type: 'radio', name: 'choice' })
    ;(checked as HTMLInputElement).checked = true
    const other = element('input', { type: 'radio', name: 'choice' })
    const after = element('button')
    scope.append(checked, other, after)
    document.body.append(scope)

    expect(getTabbableElements(scope)).toEqual([checked, after])

    ;(checked as HTMLInputElement).checked = false
    expect(getTabbableElements(scope)).toEqual([checked, after])
  })

  it('keeps independent radio groups as separate stops', () => {
    const scope = element('div')
    const a = element('input', { type: 'radio', name: 'a' })
    const b = element('input', { type: 'radio', name: 'b' })
    scope.append(a, b)
    document.body.append(scope)

    expect(getTabbableElements(scope)).toEqual([a, b])
  })
})
