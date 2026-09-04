import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import WarningBlock from './WarningBlock'

const STREAM_CSS = readFileSync(
  join(process.cwd(), 'src/components/session/stream/SessionStream.css'),
  'utf8',
)

describe('WarningBlock', () => {
  it('adds the danger modifier only for explicitly marked recovered connection failures', () => {
    render(
      <>
        <WarningBlock data={{ text: 'Ordinary warning', badge: 'Waiting for input' }} />
        <WarningBlock
          data={{
            text: 'Connection lost during sync check — paused 2m 14s, resumed automatically.',
            tone: 'danger',
            badge: 'Waiting for input',
          }}
        />
      </>,
    )

    expect(screen.getByText('Ordinary warning').closest('.kx-stream-warn')).not.toHaveClass(
      'kx-stream-warn--danger',
    )
    expect(
      screen
        .getByText('Connection lost during sync check — paused 2m 14s, resumed automatically.')
        .closest('.kx-stream-warn'),
    ).toHaveClass('kx-stream-warn--danger')
    expect(screen.getAllByTestId('warning-badge')).toHaveLength(2)
  })

  it('keeps the base icon on attention and scopes danger icon/tint styling to the modifier class', () => {
    const baseBlock = STREAM_CSS.match(/\.kx-stream-warn\s*\{[^}]*\}/s)?.[0] ?? ''
    const baseIconBlock = STREAM_CSS.match(/\.kx-stream-warn__icon\s*\{[^}]*\}/s)?.[0] ?? ''
    const dangerBlock = STREAM_CSS.match(/\.kx-stream-warn--danger\s*\{[^}]*\}/s)?.[0] ?? ''
    const dangerIconBlock =
      STREAM_CSS.match(/\.kx-stream-warn--danger\s+\.kx-stream-warn__icon\s*\{[^}]*\}/s)?.[0] ??
      ''

    expect(baseBlock).toContain('border: 1px solid var(--kx-border);')
    expect(baseBlock).not.toContain('background:')
    expect(baseIconBlock).toContain('color: var(--kx-attention);')
    expect(dangerBlock).toContain(
      'border-color: color-mix(in srgb, var(--kx-danger) 28%, var(--kx-border));',
    )
    expect(dangerBlock).toContain(
      'background: color-mix(in srgb, var(--kx-danger) 10%, transparent);',
    )
    expect(dangerIconBlock).toContain('color: var(--kx-danger);')
  })
})
