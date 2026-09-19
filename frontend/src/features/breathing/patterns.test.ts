import { describe, expect, it } from 'vitest'
import { LEAD_IN_SECONDS, fullness, patternById, positionAt } from '@/features/breathing/patterns'

const calm = patternById('calm')
const box = patternById('box')

describe('positionAt', () => {
  it('starts with a lead-in before the first breath', () => {
    const p = positionAt(calm, 0)
    expect(p.index).toBe(-1)
    expect(p.remaining).toBe(LEAD_IN_SECONDS)
    expect(fullness(p)).toBe(0)
  })

  it('follows the phases of the pattern, including an exhale longer than the inhale', () => {
    expect(positionAt(calm, LEAD_IN_SECONDS + 1).phase?.kind).toBe('inhale')
    const exhale = positionAt(calm, LEAD_IN_SECONDS + 5)
    expect(exhale.phase?.kind).toBe('exhale')
    expect(exhale.remaining).toBe(5)
  })

  it('counts completed breaths and wraps around', () => {
    const p = positionAt(box, LEAD_IN_SECONDS + 16 * 2 + 1)
    expect(p.cycles).toBe(2)
    expect(p.phase?.kind).toBe('inhale')
  })

  it('falls back to the default pattern for an unknown id', () => {
    expect(patternById('nope').id).toBe('calm')
  })
})

describe('fullness', () => {
  it('rises through the inhale, stays full on the hold, and empties on the exhale', () => {
    const start = LEAD_IN_SECONDS
    expect(fullness(positionAt(box, start))).toBeCloseTo(0)
    expect(fullness(positionAt(box, start + 2))).toBeCloseTo(0.5)
    expect(fullness(positionAt(box, start + 5))).toBe(1)
    expect(fullness(positionAt(box, start + 10))).toBeCloseTo(0.5)
    expect(fullness(positionAt(box, start + 13))).toBe(0)
  })
})
