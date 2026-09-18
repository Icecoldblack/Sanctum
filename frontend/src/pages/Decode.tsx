import { useRef, useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Icon } from '@/components/shared/Icon'
import { Button } from '@/components/shared/Button'
import { decodeImage } from '@/api/sos'

type DecodeState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found'; message: string }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string }

export function Decode() {
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<DecodeState>({ kind: 'idle' })
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(selected: File | null) {
    setFile(selected)
    setState({ kind: 'idle' })
  }

  async function handleDecode() {
    if (!file) return
    setState({ kind: 'loading' })
    try {
      const response = await decodeImage(file)
      if (response.found && response.decodedMessage) {
        setState({ kind: 'found', message: response.decodedMessage })
      } else {
        setState({ kind: 'not_found' })
      }
    } catch {
      setState({
        kind: 'error',
        message: 'This file could not be read. It may not be a valid image, or the upload failed.',
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Sidebar helpVariant="card" />
      <main className="flex-grow pt-24 pb-12 lg:ml-64 px-6 md:px-12 max-w-6xl mx-auto w-full">
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-4">
            SOS Decoder
          </h1>
          <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
            A secure utility to reveal messages hidden within sanctum-encoded safety images. Your
            privacy and safety remain our primary concern.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Upload Zone */}
          <div className="md:col-span-7 space-y-6">
            <div className="relative group">
              <div className="w-full aspect-video md:aspect-[4/3] bg-surface-container rounded-xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center transition-all duration-300 group-hover:bg-surface-container-high cursor-pointer p-8 text-center">
                <Icon name="cloud_upload" className="text-5xl text-primary mb-4" />
                <h3 className="text-xl font-bold text-on-surface mb-2">
                  {file ? file.name : 'Drop your image here'}
                </h3>
                <p className="text-sm text-on-surface-variant">Supports PNG or JPG encoded images</p>
                <input
                  ref={inputRef}
                  aria-label="Upload SOS Image"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <div className="flex justify-center md:justify-start">
              <Button onClick={handleDecode} disabled={!file} isLoading={state.kind === 'loading'}>
                <Icon name="key" />
                Decode Message
              </Button>
            </div>
          </div>

          {/* Results & Info Panel */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-surface-container-low rounded-xl p-8 min-h-[300px] flex flex-col shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Icon name="security" filled className="text-primary" />
                <h2 className="text-sm font-bold tracking-widest uppercase text-on-surface-variant">
                  Output Result
                </h2>
              </div>
              <DecodeResultView state={state} />
            </div>

            <div className="bg-tertiary-container rounded-xl p-6 flex items-start gap-4">
              <Icon name="verified_user" className="text-on-tertiary-container" />
              <div>
                <h4 className="font-bold text-on-tertiary-container text-sm">Privacy Guaranteed</h4>
                <p className="text-xs text-on-tertiary-container leading-relaxed mt-1">
                  Your image is decoded in memory and discarded immediately. Nothing is stored, and
                  no account or session is required.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Utility Footer Section */}
        <section className="mt-20 pt-12 border-t border-outline-variant/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="rounded-xl overflow-hidden aspect-video shadow-xl">
              <img
                alt="Serene nature background"
                className="w-full h-full object-cover"
                src="/images/decode-fern.png"
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-primary">How it works</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Sanctum uses advanced steganography to embed secure text within ordinary images.
                This tool allows you to extract those messages from an encoded image.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <span className="px-3 py-1 bg-surface-container-highest rounded-full text-xs font-medium">
                  End-to-End Encrypted
                </span>
                <span className="px-3 py-1 bg-surface-container-highest rounded-full text-xs font-medium">
                  Zero-Knowledge Protocol
                </span>
                <span className="px-3 py-1 bg-surface-container-highest rounded-full text-xs font-medium">
                  Open Source Core
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  )
}

function DecodeResultView({ state }: { state: DecodeState }) {
  switch (state.kind) {
    case 'idle':
      return (
        <div className="flex-grow flex flex-col items-center justify-center text-center opacity-40">
          <Icon name="visibility_off" className="text-4xl mb-3" />
          <p className="text-sm">Upload an image to reveal the hidden contents</p>
        </div>
      )
    case 'loading':
      return (
        <div className="flex-grow flex flex-col items-center justify-center text-center text-on-surface-variant">
          <p className="text-sm">Reading image…</p>
        </div>
      )
    case 'found':
      return (
        <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant/10">
          <p className="text-on-surface leading-relaxed italic">"{state.message}"</p>
        </div>
      )
    case 'not_found':
      return (
        <div className="flex-grow flex flex-col items-center justify-center text-center text-on-surface-variant">
          <Icon name="error_outline" className="text-4xl mb-3 text-outline" />
          <p className="text-sm font-medium">No hidden message was found in this image.</p>
        </div>
      )
    case 'error':
      return (
        <div role="alert" className="flex-grow flex flex-col items-center justify-center text-center text-error">
          <Icon name="error_outline" className="text-4xl mb-3" />
          <p className="text-sm font-medium">{state.message}</p>
        </div>
      )
  }
}
