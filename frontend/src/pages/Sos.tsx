import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Icon } from '@/components/shared/Icon'
import { MessageComposer } from '@/components/sos/MessageComposer'
import { CarrierPicker } from '@/components/sos/CarrierPicker'
import { EncodeResult } from '@/components/sos/EncodeResult'
import type { Carrier } from '@/components/sos/carriers'
import { expandMessage, encodeMessage, generateCarrier } from '@/api/sos'
import type { ApiError } from '@/types'
import { useSession } from '@/hooks/useSession'
import { capacityForPixels, measureImage } from '@/lib/capacity'
import { toCarrierPng } from '@/lib/toPng'

/** Originals can be larger than the upload limit: they are converted and shrunk before upload. */
const MAX_PICK_BYTES = 25 * 1024 * 1024

export function Sos() {
  const { session } = useSession()

  const [shortInput, setShortInput] = useState('')
  const [expandedMessage, setExpandedMessage] = useState('')
  const [isExpanding, setIsExpanding] = useState(false)
  const [expandError, setExpandError] = useState<string | null>(null)

  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null)
  const [customCarrier, setCustomCarrier] = useState<Carrier | null>(null)
  const [customError, setCustomError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [capacity, setCapacity] = useState<number | null>(null)
  const [isEncoding, setIsEncoding] = useState(false)
  const [encodeError, setEncodeError] = useState<string | null>(null)
  const [result, setResult] = useState<{ imageUrl: string; byteSize: number } | null>(null)

  const finalMessage = expandedMessage || shortInput
  const overCapacity = capacity !== null && finalMessage.length > capacity

  // Measure whichever carrier is selected so the limit reflects the real image.
  useEffect(() => {
    if (!selectedCarrier) {
      setCapacity(null)
      return
    }
    let cancelled = false
    measureImage(selectedCarrier.src)
      .then(({ width, height }) => {
        if (!cancelled) setCapacity(capacityForPixels(width, height))
      })
      .catch(() => {
        if (!cancelled) setCapacity(null)
      })
    return () => {
      cancelled = true
    }
  }, [selectedCarrier])

  // A blob URL for an uploaded photo has to be released when it is replaced.
  useEffect(() => {
    const url = customCarrier?.src
    return () => {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
    }
  }, [customCarrier])

  async function handleCustomSelect(file: File) {
    setCustomError(null)
    if (file.size > MAX_PICK_BYTES) {
      setCustomError('That photo is larger than 25 MB. Choose a smaller one.')
      return
    }
    let png: Blob
    try {
      png = await toCarrierPng(file)
    } catch {
      setCustomError('That photo couldn’t be used. Try a different one, such as a JPG or PNG.')
      return
    }
    const carrier: Carrier = {
      id: `custom-${Date.now()}`,
      label: `Your photo (${file.name})`,
      src: URL.createObjectURL(png),
      alt: 'the photo you selected as a carrier image',
    }
    setCustomCarrier(carrier)
    setSelectedCarrier(carrier)
    setResult(null)
  }

  async function handleGenerate(scene: string) {
    if (!session) return
    setIsGenerating(true)
    setGenerateError(null)
    setCustomError(null)
    try {
      const { imageUrl } = await generateCarrier(session.sessionId, scene)
      // A blob URL like an uploaded photo, so the same selection and cleanup paths apply.
      const png = await (await fetch(imageUrl)).blob()
      const carrier: Carrier = {
        id: `generated-${Date.now()}`,
        label: scene.trim() ? `AI photo: ${scene.trim()}` : 'AI photo',
        src: URL.createObjectURL(png),
        alt: scene.trim() ? `an AI-created photo of ${scene.trim()}` : 'an AI-created everyday photo',
      }
      setCustomCarrier(carrier)
      setSelectedCarrier(carrier)
      setResult(null)
    } catch (err) {
      const code = (err as Partial<ApiError>)?.code
      setGenerateError(
        code === 'rate_limited'
          ? 'You’ve made several photos in a short time. Wait a minute and try again.'
          : code === 'network_error'
            ? 'Couldn’t reach the server. Check your connection and try again.'
            : 'The photo couldn’t be created. Try again, describe it differently, or pick one above.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleExpand() {
    if (!session || !shortInput.trim()) return
    setIsExpanding(true)
    setExpandError(null)
    try {
      const { expandedMessage: expanded } = await expandMessage(session.sessionId, shortInput)
      setExpandedMessage(expanded)
    } catch {
      setExpandError('AI expansion failed.')
    } finally {
      setIsExpanding(false)
    }
  }

  async function handleEncode() {
    if (!session || !selectedCarrier || !finalMessage.trim()) return
    setIsEncoding(true)
    setEncodeError(null)
    try {
      const imageResponse = await fetch(selectedCarrier.src)
      const imageBlob = await imageResponse.blob()
      const encoded = await encodeMessage(session.sessionId, finalMessage, imageBlob)
      setResult({ imageUrl: encoded.imageUrl, byteSize: encoded.byteSize })
    } catch {
      setEncodeError('Could not encode your message. Nothing was sent or saved — try again.')
    } finally {
      setIsEncoding(false)
    }
  }

  const canEncode =
    Boolean(session) && Boolean(finalMessage.trim()) && Boolean(selectedCarrier) && !overCapacity

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="pt-24 pb-28 lg:pb-12 lg:ml-64 px-6 md:px-12 max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tighter mb-4 font-headline">
            Steganography <span className="text-primary">Messenger</span>
          </h1>
          <p className="text-on-surface-variant max-w-2xl text-lg leading-relaxed">
            Securely transmit a distress signal hidden within a mundane image, so a woman being
            watched can still reach someone who can help. Your message is encrypted and embedded
            into the pixels of a carrier file, making it invisible to the casual observer.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-8">
            <MessageComposer
              shortInput={shortInput}
              onShortInputChange={setShortInput}
              expandedMessage={expandedMessage}
              onExpand={handleExpand}
              isExpanding={isExpanding}
              ready={Boolean(session)}
              expandError={expandError}
              capacity={capacity}
            />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-8">
            <section className="bg-surface-container-low rounded-3xl p-8 shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-tertiary">
                  <Icon name="image" />
                </div>
                <h3 className="text-xl font-bold text-on-surface font-headline">3. Carrier Image</h3>
              </div>

              <CarrierPicker
                selectedId={selectedCarrier?.id ?? null}
                onSelect={(carrier) => {
                  setSelectedCarrier(carrier)
                  setResult(null)
                }}
                custom={customCarrier}
                onCustomSelect={handleCustomSelect}
                error={customError}
                onGenerate={handleGenerate}
                generating={isGenerating}
                generateError={generateError}
              />

              <p className="text-xs text-on-surface-variant/70 mb-8 italic">
                {selectedCarrier && capacity !== null
                  ? `This image holds about ${capacity.toLocaleString()} characters.`
                  : 'Selecting a nature-themed image is recommended for maximum discretion.'}
              </p>

              {!selectedCarrier && finalMessage.trim() && (
                <p className="mb-4 text-xs font-medium text-on-surface-variant">
                  Choose a carrier image to continue.
                </p>
              )}

              {overCapacity && capacity !== null && (
                <p role="alert" className="mb-4 text-xs font-medium text-error">
                  Your message is {finalMessage.length - capacity} characters too long for this
                  image. Shorten it, or pick a larger photo.
                </p>
              )}

              {encodeError && (
                <p role="alert" className="mb-4 text-xs font-medium text-error">
                  {encodeError}
                </p>
              )}

              {result ? (
                <EncodeResult imageUrl={result.imageUrl} byteSize={result.byteSize} />
              ) : (
                <button
                  type="button"
                  onClick={handleEncode}
                  disabled={!canEncode || isEncoding}
                  className="w-full bg-primary text-on-primary py-4 rounded-full font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon name="download_for_offline" />
                  {isEncoding ? 'Encoding…' : 'Download Secure Image'}
                </button>
              )}
              {!result && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-bold text-primary tracking-widest uppercase">
                    Encryption Ready
                  </span>
                </div>
              )}
            </section>

            <div className="bg-secondary-container/30 rounded-3xl p-6 border border-secondary-container">
              <h4 className="font-bold text-secondary mb-2 flex items-center gap-2">
                <Icon name="verified_user" className="text-sm" />
                How it works
              </h4>
              <p className="text-sm text-on-secondary-container leading-relaxed">
                This image will look completely normal. To reveal the message, the recipient must
                upload it back to Sanctum's secure portal. It leaves no trace in your sent
                messages folder if deleted from your device.
              </p>
            </div>
          </div>
        </div>

        {/* Safety Footer Tips */}
        <footer className="mt-20 border-t border-surface-container-high pt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <Icon name="security" className="text-primary" />
              <h5 className="font-bold">Zero-Knowledge</h5>
              <p className="text-sm text-on-surface-variant">
                We never store your original messages. Once the image is generated, the raw text
                is purged from our servers.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Icon name="visibility_off" className="text-primary" />
              <h5 className="font-bold">Quick Exit</h5>
              <p className="text-sm text-on-surface-variant">
                Leaves instantly and buries this site behind decoy pages, so pressing Back won't
                bring it up. Your browser's history list can still show it, so use a private window
                when you can.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Icon name="history" className="text-primary" />
              <h5 className="font-bold">Timed Cleanup</h5>
              <p className="text-sm text-on-surface-variant">
                Sessions expire after 10 minutes of inactivity to ensure your data remains
                protected.
              </p>
            </div>
          </div>
        </footer>
      </main>
      <BottomNav />
    </>
  )
}
