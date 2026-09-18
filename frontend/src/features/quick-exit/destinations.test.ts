import { describe, expect, it } from 'vitest'
import {
  EXIT_DESTINATIONS,
  isKnownDestination,
  normalizeExitUrl,
  resolveExitUrl,
} from '@/features/quick-exit/destinations'

describe('normalizeExitUrl', () => {
  it('accepts web addresses, adding https when missing', () => {
    expect(normalizeExitUrl('bbc.com/weather')).toBe('https://bbc.com/weather')
    expect(normalizeExitUrl('  https://example.org  ')).toBe('https://example.org/')
    expect(normalizeExitUrl('http://example.org/a?b=c')).toBe('http://example.org/a?b=c')
  })

  it('rejects anything that is not a plain web page', () => {
    expect(normalizeExitUrl('')).toBeNull()
    expect(normalizeExitUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeExitUrl('data:text/html,hi')).toBeNull()
    expect(normalizeExitUrl('file:///etc/passwd')).toBeNull()
    expect(normalizeExitUrl('not a url')).toBeNull()
    expect(normalizeExitUrl('intranet')).toBeNull()
  })
})

describe('resolveExitUrl', () => {
  const urls = EXIT_DESTINATIONS.map((d) => d.url)

  it('uses the chosen site', () => {
    expect(resolveExitUrl('news', '')).toBe('https://news.google.com/')
  })

  it('picks from the list at random, covering every entry', () => {
    const n = EXIT_DESTINATIONS.length
    const picked = Array.from({ length: n }, (_, i) => resolveExitUrl('random', '', () => i / n))
    expect(new Set(picked)).toEqual(new Set(urls))
    // The edge of the range still lands inside the list.
    expect(urls).toContain(resolveExitUrl('random', '', () => 0.9999999))
  })

  it('uses a valid custom URL, and a random everyday site otherwise', () => {
    expect(resolveExitUrl('custom', 'example.org')).toBe('https://example.org/')
    expect(urls).toContain(resolveExitUrl('custom', 'javascript:alert(1)'))
    expect(urls).toContain(resolveExitUrl('unknown', ''))
  })

  it('uses landing pages, never search URLs that persist in account history', () => {
    for (const url of urls) expect(url).not.toMatch(/[?&]q=/)
  })

  it('knows its own ids', () => {
    expect(isKnownDestination('random')).toBe(true)
    expect(isKnownDestination('custom')).toBe(true)
    expect(isKnownDestination('weather')).toBe(true)
    expect(isKnownDestination('evil')).toBe(false)
  })
})
