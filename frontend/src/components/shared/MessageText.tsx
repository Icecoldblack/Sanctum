import { parseBlocks, renderInline } from '@/lib/markdown'

/**
 * Renders a chat reply with the small slice of Markdown models actually produce: paragraphs, line
 * breaks, bulleted and numbered lists, headings, **bold**, *italic* and `code`.
 *
 * Everything is built as React elements, never as HTML, so nothing in a reply can inject markup.
 * Links are deliberately left as plain text: a clickable address from an AI reply could send
 * someone somewhere unsafe, and every visited link is another line in their browser history.
 */

export function MessageText({ text }: { text: string }) {
  return (
    <div className="space-y-3 break-words">
      {parseBlocks(text).map((block, i) => {
        switch (block.kind) {
          case 'h':
            return (
              <p key={i} className="font-bold">
                {renderInline(block.text)}
              </p>
            )
          case 'hr':
            return <hr key={i} className="border-outline-variant/30" />
          case 'ul':
            return (
              <ul key={i} className="list-disc space-y-1 pl-5">
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i} start={block.start} className="list-decimal space-y-1 pl-5">
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ol>
            )
          case 'p':
            return (
              <p key={i}>
                {block.lines.map((line, j) => (
                  <span key={j}>
                    {j > 0 && <br />}
                    {renderInline(line)}
                  </span>
                ))}
              </p>
            )
        }
      })}
    </div>
  )
}
