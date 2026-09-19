import { describe, expect, it } from 'vitest'
import { parseBlocks } from '@/lib/markdown'

describe('parseBlocks', () => {
  it('splits paragraphs on blank lines and keeps single line breaks', () => {
    expect(parseBlocks('One\ntwo\n\nThree')).toEqual([
      { kind: 'p', lines: ['One', 'two'] },
      { kind: 'p', lines: ['Three'] },
    ])
  })

  it('groups bullets and numbered items into lists', () => {
    expect(parseBlocks('Steps:\n1. Call\n2. Write it down\n\n- a\n* b')).toEqual([
      { kind: 'p', lines: ['Steps:'] },
      { kind: 'ol', items: ['Call', 'Write it down'], start: 1 },
      { kind: 'ul', items: ['a', 'b'] },
    ])
  })

  it('treats headings as their own block and joins indented list continuations', () => {
    expect(parseBlocks('## Your rights\n- First item\n  continues here')).toEqual([
      { kind: 'h', text: 'Your rights' },
      { kind: 'ul', items: ['First item continues here'] },
    ])
  })

  it('turns --- into a divider rather than text', () => {
    expect(parseBlocks('Intro\n\n---\n\nMore')).toEqual([
      { kind: 'p', lines: ['Intro'] },
      { kind: 'hr' },
      { kind: 'p', lines: ['More'] },
    ])
  })

  it('never produces markup from input', () => {
    expect(parseBlocks('<img src=x onerror=alert(1)>')).toEqual([
      { kind: 'p', lines: ['<img src=x onerror=alert(1)>'] },
    ])
  })
})
