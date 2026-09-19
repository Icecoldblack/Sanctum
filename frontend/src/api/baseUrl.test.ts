import { describe, expect, it } from 'vitest'
import { normalizeBaseUrl } from '@/api/baseUrl'

describe('normalizeBaseUrl', () => {
  it('keeps a full URL as it is', () => {
    expect(normalizeBaseUrl('https://api.example.com')).toBe('https://api.example.com')
    expect(normalizeBaseUrl('http://localhost:8080')).toBe('http://localhost:8080')
  })

  it('adds https:// to a bare host, so calls do not go to the static host', () => {
    expect(normalizeBaseUrl('sanctum-production.up.railway.app')).toBe('https://sanctum-production.up.railway.app')
  })

  it('drops trailing slashes and surrounding spaces', () => {
    expect(normalizeBaseUrl(' https://api.example.com/ ')).toBe('https://api.example.com')
    expect(normalizeBaseUrl('api.example.com//')).toBe('https://api.example.com')
  })

  it('leaves an empty value empty (same origin)', () => {
    expect(normalizeBaseUrl(undefined)).toBe('')
    expect(normalizeBaseUrl('  ')).toBe('')
  })
})
