import { useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { Icon } from '@/components/shared/Icon'

export interface PickedImage {
  file: File
  isPng: boolean
}

interface ImageDropzoneProps {
  value: PickedImage | null
  onChange: (value: PickedImage | null) => void
  disabled?: boolean
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const MAX_BYTES = 10 * 1024 * 1024

/**
 * Pick or drop one image, then see exactly what was chosen: a preview, the file name and size,
 * and Replace / Remove. The type is checked by the file's first bytes (as the server does), not
 * its name, so a renamed JPG is caught before upload.
 */
export function ImageDropzone({ value, onChange, disabled = false }: ImageDropzoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const preview = useObjectUrl(value?.file ?? null)

  async function accept(file: File | undefined) {
    setError(null)
    if (!file) return
    if (!file.type.startsWith('image/') && file.type !== '') {
      setError('That file isn’t an image. Choose the photo you were sent.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('That image is over 10 MB, which is larger than any Sanctum image. Check it’s the right file.')
      return
    }
    onChange({ file, isPng: await hasPngSignature(file) })
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    if (!disabled) accept(event.dataTransfer.files?.[0])
  }

  const input = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      accept="image/png,image/*"
      className="sr-only"
      disabled={disabled}
      onChange={(e) => {
        accept(e.target.files?.[0])
        e.target.value = ''
      }}
    />
  )

  if (value && preview) {
    return (
      <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest">
        {input}
        <div
          className="flex aspect-video items-center justify-center bg-[length:20px_20px] p-4"
          style={{
            backgroundImage:
              'linear-gradient(45deg,#edefe8 25%,transparent 25%),linear-gradient(-45deg,#edefe8 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#edefe8 75%),linear-gradient(-45deg,transparent 75%,#edefe8 75%)',
            backgroundPosition: '0 0,0 10px,10px -10px,-10px 0',
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <img src={preview} alt={`Selected image: ${value.file.name}`} className="max-h-full max-w-full rounded-lg object-contain shadow-md" />
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-outline-variant/20 p-4">
          <Icon name={value.isPng ? 'image' : 'warning'} className={value.isPng ? 'text-primary' : 'text-error'} />
          <div className="min-w-0 flex-1 basis-40">
            <p className="truncate text-sm font-semibold text-on-surface">{value.file.name || 'Pasted image'}</p>
            <p className="text-xs text-on-surface-variant">
              {value.isPng ? 'PNG' : 'Not a PNG'} · {formatBytes(value.file.size)}
            </p>
          </div>
          <label
            htmlFor={inputId}
            className="ml-auto inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-full px-4 text-sm font-semibold text-primary hover:bg-primary-container/40"
          >
            <Icon name="swap_horiz" className="text-lg" />
            Replace
          </label>
          <button
            type="button"
            onClick={() => {
              setError(null)
              onChange(null)
            }}
            disabled={disabled}
            className="inline-flex min-h-10 items-center gap-1 rounded-full px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
          >
            <Icon name="close" className="text-lg" />
            Remove
          </button>
        </div>
        {!value.isPng && (
          <p role="alert" className="border-t border-error/20 bg-error-container/15 p-4 text-sm leading-relaxed text-on-surface">
            <strong>This image can't contain a Sanctum message.</strong> Hidden messages only survive in PNG
            images. Messaging apps often convert photos to JPG, which erases the message. Ask the sender to send it
            as a <em>file</em> or <em>document</em> instead.
          </p>
        )}
        {error && <p role="alert" className="px-4 pb-4 text-sm font-medium text-error">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      {input}
      <label
        htmlFor={inputId}
        onDragEnter={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex aspect-video cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors md:aspect-[4/3] ${
          dragging ? 'border-primary bg-primary-container/30' : 'border-outline-variant/40 bg-surface-container hover:bg-surface-container-high'
        }`}
      >
        <Icon name={dragging ? 'file_download' : 'add_photo_alternate'} className="mb-3 text-5xl text-primary" />
        <span className="text-lg font-bold text-on-surface">{dragging ? 'Drop it here' : 'Choose the image you were sent'}</span>
        <span className="mt-1 text-sm text-on-surface-variant">or drag it here · PNG, up to 10 MB</span>
        <span className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-on-primary shadow-md">
          <Icon name="upload" className="text-lg" />
          Choose image
        </span>
      </label>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-error">
          {error}
        </p>
      )}
    </div>
  )
}

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])
  return url
}

async function hasPngSignature(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  return PNG_SIGNATURE.every((byte, i) => head[i] === byte)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
