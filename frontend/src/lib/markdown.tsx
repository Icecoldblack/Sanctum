import type { ReactNode } from 'react'

/**
 * The small slice of Markdown chat models actually produce, parsed into blocks and inline pieces.
 * Output is React elements only, never HTML, so nothing in a reply can inject markup.
 */

export type Block =
  | { kind: 'p'; lines: string[] }
  | { kind: 'h'; text: string }
  | { kind: 'hr' }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[]; start: number }

const BULLET = /^\s*[-*•]\s+(.*)$/
const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/
const HEADING = /^\s*#{1,6}\s+(.*)$/
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trimEnd()
    const last = blocks[blocks.length - 1]
    let match: RegExpMatchArray | null

    if (!line.trim()) {
      blocks.push({ kind: 'p', lines: [] })
    } else if (RULE.test(line)) {
      blocks.push({ kind: 'hr' })
    } else if ((match = line.match(HEADING))) {
      blocks.push({ kind: 'h', text: match[1] ?? '' })
    } else if ((match = line.match(BULLET))) {
      if (last?.kind === 'ul') last.items.push(match[1] ?? '')
      else blocks.push({ kind: 'ul', items: [match[1] ?? ''] })
    } else if ((match = line.match(NUMBERED))) {
      if (last?.kind === 'ol') last.items.push(match[2] ?? '')
      else blocks.push({ kind: 'ol', items: [match[2] ?? ''], start: Number(match[1]) || 1 })
    } else if (last?.kind === 'p' && last.lines.length) {
      last.lines.push(line.trim())
    } else if ((last?.kind === 'ul' || last?.kind === 'ol') && /^\s{2,}/.test(raw)) {
      // An indented continuation of the previous list item.
      last.items[last.items.length - 1] += ` ${line.trim()}`
    } else if (last?.kind === 'p') {
      last.lines.push(line.trim())
    } else {
      blocks.push({ kind: 'p', lines: [line.trim()] })
    }
  }
  return blocks.filter((b) => b.kind !== 'p' || b.lines.length > 0)
}

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`)/g

export function renderInline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (!part) return null
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={i} className="rounded bg-surface-container px-1 py-0.5 text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      )
    }
    if ((part.startsWith('*') || part.startsWith('_')) && part.length > 2 && part.endsWith(part[0]!)) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}
