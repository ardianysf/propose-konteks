import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// jsdom rewrites import.meta.url to an http origin, so resolve from cwd instead.
const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')

const palette = [
  '#FAF8EF',
  '#FFFFFF',
  '#FFF',
  '#243025',
  '#58735A',
  '#778C78',
  '#E2E9D5',
  '#F4F8EE',
  '#8FBF6A',
  '#5F8D4E',
]

it.each(palette)('tokens.css defines %s', (hex) =>
  expect(css.toUpperCase()).toContain(hex.toUpperCase()),
)

it.each([24, 20, 18, 16, 13, 12, 11, 10])('type scale defines %spx', (px) =>
  expect(css).toContain(`${px}px`),
)

it('defines fixed dimensions (19.5px corners, 240px sidebar, 790x580 customize, 450px drawer)', () => {
  expect(css).toContain('19.5px')
  expect(css).toContain('240px')
  expect(css).toContain('790px')
  expect(css).toContain('580px')
  expect(css).toContain('450px')
})
