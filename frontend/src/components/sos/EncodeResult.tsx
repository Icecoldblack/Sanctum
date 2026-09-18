import { Icon } from '@/components/shared/Icon'

interface EncodeResultProps {
  imageUrl: string
  byteSize: number
  fileName?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function EncodeResult({ imageUrl, byteSize, fileName = 'sanctum-image.png' }: EncodeResultProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden">
        <img src={imageUrl} alt="Encoded carrier image preview" className="w-full object-cover" />
      </div>
      <p className="text-xs text-on-surface-variant/70 italic">
        {formatBytes(byteSize)} · Verify this image looks ordinary before sharing it.
      </p>
      <a
        href={imageUrl}
        download={fileName}
        className="w-full bg-primary text-on-primary py-4 rounded-full font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
      >
        <Icon name="download_for_offline" />
        Download Secure Image
      </a>
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Ready</span>
      </div>
    </div>
  )
}
