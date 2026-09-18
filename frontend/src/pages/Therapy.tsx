import { useEffect, useRef, useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Icon } from '@/components/shared/Icon'
import { useChat } from '@/hooks/useChat'
import { useAutoResize } from '@/hooks/useAutoResize'
import { BreathingExercise } from '@/components/shared/BreathingExercise'
import { CrisisNumbers } from '@/components/shared/CrisisNumbers'
import { quickExit } from '@/features/quick-exit/quickExit'

const groundingSteps = [
  { n: 5, label: 'Things you can see', opacity: '' },
  { n: 4, label: 'Things you can touch', opacity: 'opacity-60' },
  { n: 3, label: 'Things you can hear', opacity: 'opacity-40' },
]

export function Therapy() {
  const { messages, input, setInput, send, isLoading, error } = useChat('therapy')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useAutoResize(input)
  const [numbersOpen, setNumbersOpen] = useState(false)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="bg-background text-on-surface">
      <Navbar />
      <Sidebar helpVariant="card" />
      <main className="lg:ml-64 pt-16 pb-24 md:pb-8 flex flex-col">
        {/* Situation Summary Header */}
        <header className="px-4 py-4 md:px-12 md:py-8">
          <div className="max-w-4xl mx-auto">
            <div className="hidden md:flex items-center gap-4 mb-2">
              <span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-[10px] font-bold tracking-widest uppercase">
                Current Session
              </span>
              <span className="text-xs text-on-surface-variant italic">This session only</span>
            </div>
            <div className="bg-surface-container-low rounded-2xl px-5 py-3 md:p-8 flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-headline font-bold text-on-surface tracking-tight md:mb-3">
                  The Sanctuary
                </h1>
                <p className="hidden md:block text-on-surface-variant text-sm md:text-base leading-relaxed max-w-2xl">
                  A non-judgmental space for women navigating fear, isolation, or an unsafe
                  situation to process their feelings, build a safety plan, and find immediate
                  emotional groundedness.
                </p>
              </div>
              <div className="hidden md:block w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0">
                <img
                  alt=""
                  className="w-full h-full object-cover grayscale-[20%] opacity-80"
                  src="/images/therapy-leaves.png"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Chat & Exercise Section */}
        <section className="flex-1 px-4 md:px-12 pb-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Chat Window */}
            <div className="md:col-span-8 min-h-[32rem] bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/10 flex flex-col overflow-hidden">
              <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                aria-label="Conversation"
                data-lenis-prevent
                className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar"
              >
                {messages.length === 0 && (
                  <div className="flex gap-4 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                      <Icon name="auto_awesome" className="text-primary text-sm" />
                    </div>
                    <div className="space-y-2">
                      <div className="bg-surface-container-high px-5 py-4 rounded-2xl rounded-tl-none text-on-surface leading-relaxed text-sm">
                        I'm here to listen. Say as much or as little as you're ready to.
                      </div>
                      <div className="text-[10px] text-on-surface-variant px-1 italic">
                        Sanctum AI
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((message, index) => {
                  const isUser = message.role === 'user'
                  return (
                    <div
                      key={`${message.timestamp}-${index}`}
                      className={`flex gap-4 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isUser ? 'bg-secondary-container' : 'bg-primary-container'
                        }`}
                      >
                        <Icon
                          name={isUser ? 'person' : 'auto_awesome'}
                          className={`text-sm ${isUser ? 'text-secondary' : 'text-primary'}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <div
                          className={`px-5 py-4 rounded-2xl leading-relaxed text-sm ${
                            isUser
                              ? 'bg-primary text-on-primary rounded-tr-none'
                              : 'bg-surface-container-high text-on-surface rounded-tl-none'
                          }`}
                        >
                          {message.content}
                        </div>
                        <div
                          className={`text-[10px] text-on-surface-variant px-1 italic ${isUser ? 'text-right' : ''}`}
                        >
                          {isUser ? 'You' : 'Sanctum AI'}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {isLoading && (
                  <div className="flex gap-4 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                      <Icon name="auto_awesome" className="text-primary text-sm" />
                    </div>
                    <div className="bg-surface-container-high px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary/30 animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-primary/30 animate-pulse delay-75" />
                      <span className="w-2 h-2 rounded-full bg-primary/30 animate-pulse delay-150" />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <p role="alert" className="px-6 py-2 text-xs font-medium text-error border-t border-error-container bg-error-container/30">
                  {error}
                </p>
              )}

              {/* Chat Input */}
              <div className="p-4 border-t border-outline-variant/10 bg-surface-container-lowest">
                <div className="relative flex items-center">
                  <label htmlFor="therapy-input" className="sr-only">
                    Message
                  </label>
                  <textarea
                    id="therapy-input"
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full bg-surface-container px-6 py-4 rounded-full border-none focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-on-surface-variant/60 resize-none max-h-[160px]"
                    placeholder="Type what's on your mind..."
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={isLoading || !input.trim()}
                    aria-label="Send message"
                    className="absolute right-2 w-11 h-11 shrink-0 aspect-square flex items-center justify-center bg-primary text-on-primary rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
                  >
                    <Icon name="arrow_upward" className="text-lg" />
                  </button>
                </div>
              </div>
            </div>

            {/* Grounding Sidebar */}
            <div className="md:col-span-4 flex flex-col gap-6">
              <div className="bg-tertiary-container/30 rounded-3xl p-6 border border-tertiary-fixed-dim/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-tertiary-container rounded-lg">
                    <Icon name="grid_view" filled className="text-on-tertiary-container text-sm" />
                  </div>
                  <h3 className="font-headline font-bold text-sm text-on-tertiary-container">
                    5-4-3-2-1 Grounding
                  </h3>
                </div>
                <ul className="space-y-3">
                  {groundingSteps.map(({ n, label, opacity }) => (
                    <li
                      key={n}
                      className={`flex items-center gap-3 text-xs text-on-tertiary-fixed-variant ${opacity}`}
                    >
                      <span className="w-5 h-5 rounded-full bg-tertiary-fixed-dim flex items-center justify-center text-[10px] font-bold">
                        {n}
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="h-56 bg-surface-container-high rounded-3xl overflow-hidden relative group">
                <img
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src="/images/therapy-ocean.png"
                />
                <BreathingExercise />
              </div>

              <div className="p-4 bg-error-container/10 rounded-2xl border border-error-container/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-error tracking-widest uppercase">
                    Safety First
                  </p>
                  <Icon name="shield" className="text-error text-sm" />
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
                  Feeling unsafe? Exit immediately and contact local support.
                </p>
                <button
                  type="button"
                  onClick={() => setNumbersOpen(true)}
                  className="w-full py-2 border border-error text-error rounded-full text-[10px] font-bold hover:bg-error/5 transition-colors"
                >
                  Emergency Protocol
                </button>
                <button
                  type="button"
                  onClick={quickExit}
                  className="mt-2 w-full py-2 bg-error text-on-error rounded-full text-[10px] font-bold hover:brightness-110 transition-all"
                >
                  Leave this site now
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <BottomNav />
      <CrisisNumbers open={numbersOpen} onClose={() => setNumbersOpen(false)} />
    </div>
  )
}
