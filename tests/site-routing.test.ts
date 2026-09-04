// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { routeSiteRequest } from '../vite.config'

function request(url: string) {
  const req = { url }
  const res = { statusCode: 200, setHeader: vi.fn(), end: vi.fn() }
  const next = vi.fn()
  routeSiteRequest(req, res, next)
  return { req, res, next }
}

describe('site entry routing', () => {
  it.each(['/', '/?source=home'])('redirects %s to the catalog without dropping query parameters', (url) => {
    const { res, next } = request(url)
    expect(res.statusCode).toBe(302)
    expect(res.setHeader).toHaveBeenCalledWith('Location', `/catalog${url.slice(1)}`)
    expect(res.end).toHaveBeenCalledOnce()
    expect(next).not.toHaveBeenCalled()
  })

  it.each(['/catalog', '/catalog/', '/catalog/components/settings-modal'])('serves catalog deep link %s', (url) => {
    const { req, next } = request(url)
    expect(req.url).toBe('/catalog.html')
    expect(next).toHaveBeenCalledOnce()
  })

  it.each(['/v2', '/v2/session'])('keeps the mockup available at %s', (url) => {
    expect(request(`${url}?mock=empty`).req.url).toBe('/index.html?mock=empty')
  })

  it.each(['/catalog.html', '/catalogue', '/v20', '/src/v2/main.tsx', '/assets/icon.png'])('does not intercept %s', (url) => {
    expect(request(url).req.url).toBe(url)
  })

  it('matches the Vercel root redirect and app/catalog rewrites', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8'))
    expect(config.redirects).toEqual([{ source: '/', destination: '/catalog', permanent: false }])
    expect(config.rewrites).toEqual(expect.arrayContaining([
      { source: '/v2', destination: '/index.html' },
      { source: '/v2/:path*', destination: '/index.html' },
      { source: '/catalog', destination: '/catalog.html' },
      { source: '/catalog/:path*', destination: '/catalog.html' },
    ]))
  })
})
