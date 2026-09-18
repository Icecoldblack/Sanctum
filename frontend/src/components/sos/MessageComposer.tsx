import { useAutoResize } from '@/hooks/useAutoResize'
import { Icon } from '@/components/shared/Icon'

interface MessageComposerProps {
  shortInput: string
  onShortInputChange: (value: string) => void
  expandedMessage: string
  onExpand: () => void
  isExpanding: boolean
  expandError: string | null
  /** Characters the selected carrier can hold, or null if none is chosen yet. */
  capacity: number | null
}

export function MessageComposer({
  shortInput,
  onShortInputChange,
  expandedMessage,
  onExpand,
  isExpanding,
  expandError,
  capacity,
}: MessageComposerProps) {
  const textareaRef = useAutoResize(shortInput)
  const finalMessage = expandedMessage || shortInput
  const over = capacity !== null && finalMessage.length > capacity

  return (
    <>
      <section className="bg-surface-container-low rounded-3xl p-8 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary">
            <Icon name="edit_note" />
          </div>
          <h3 className="text-xl font-bold text-on-surface font-headline">1. Note your situation</h3>
        </div>
        <label htmlFor="sos-short-input" className="sr-only">
          Brief summary of your situation
        </label>
        <textarea
          id="sos-short-input"
          ref={textareaRef}
          value={shortInput}
          onChange={(e) => onShortInputChange(e.target.value)}
          className="w-full bg-surface-container border-none focus:ring-2 focus:ring-primary rounded-2xl p-6 text-on-surface-variant placeholder:text-outline-variant min-h-[120px] resize-none text-base"
          placeholder="Type a brief summary of what's happening. e.g. 'I need a ride home now, things feel unsafe.'"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={onExpand}
          disabled={isExpanding || !shortInput.trim()}
          className="mt-4 flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>{isExpanding ? 'Expanding…' : 'Expand with AI'}</span>
          <Icon
            name="auto_awesome"
            className="text-sm transition-transform group-hover:translate-x-1"
          />
        </button>
        {expandError && (
          <p role="alert" className="mt-3 text-xs font-medium text-error">
            {expandError} You can still send your original message below, unexpanded.
          </p>
        )}
      </section>

      <section className="bg-surface-container-highest rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
              <Icon name="lock_open" />
            </div>
            <h3 className="text-xl font-bold text-on-surface font-headline">2. Hidden Message</h3>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-outline">Encrypted</span>
        </div>
        <div
          className={`bg-surface p-6 rounded-2xl border-l-4 italic text-on-surface-variant leading-relaxed ${
            over ? 'border-error' : 'border-primary'
          }`}
        >
          {finalMessage || 'Your message will appear here once you start typing.'}
        </div>
        {finalMessage && (
          <p
            className={`mt-3 text-right text-xs font-medium tabular-nums ${
              over ? 'text-error' : 'text-on-surface-variant'
            }`}
          >
            {finalMessage.length.toLocaleString()}
            {capacity !== null && ` / ${capacity.toLocaleString()}`} characters
          </p>
        )}
      </section>
    </>
  )
}
