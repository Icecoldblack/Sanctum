import type { IconSpec } from '@/features/disguise/presets'

const SYMBOL_FONT = 'Material Symbols Outlined'

export type IconShape = 'rounded' | 'full-bleed'

/**
 * Renders an icon to a square PNG data URL. "rounded" suits favicons and ordinary app icons;
 * "full-bleed" suits maskable and iOS icons, where the platform applies its own mask and the
 * glyph must sit inside the central safe zone.
 */
export async function renderIcon(spec: IconSpec, size: number, shape: IconShape = 'rounded', fallbackText = '?'): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')

  if (shape === 'rounded') {
    ctx.beginPath()
    ctx.roundRect(0, 0, size, size, size * 0.22)
    ctx.clip()
  }

  if (spec.kind === 'image') {
    const image = await loadImage(spec.dataUrl)
    drawCover(ctx, image, size)
  } else {
    ctx.fillStyle = spec.background
    ctx.fillRect(0, 0, size, size)
    const glyphScale = shape === 'full-bleed' ? 0.5 : 0.62
    const fontReady = await ensureSymbolFont(spec.symbol)
    ctx.fillStyle = spec.foreground
    if (fontReady) {
      ctx.font = `${Math.round(size * glyphScale)}px "${SYMBOL_FONT}"`
      drawCentered(ctx, spec.symbol, size)
    } else {
      // Offline or font blocked: a letter still reads as a plausible app icon.
      ctx.font = `700 ${Math.round(size * glyphScale * 0.8)}px Manrope, system-ui, sans-serif`
      drawCentered(ctx, (fallbackText.trim()[0] ?? '?').toUpperCase(), size)
    }
  }
  return canvas.toDataURL('image/png')
}

/**
 * Turns an uploaded picture into a 512px square PNG, center-cropped. Re-encoding through a canvas
 * also drops EXIF metadata such as GPS coordinates.
 */
export async function imageFileToIcon(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new IconUploadError('Choose an image file (PNG, JPG, or WebP).')
  if (file.size > 8 * 1024 * 1024) throw new IconUploadError('That image is over 8 MB. Choose a smaller one.')
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new IconUploadError("That image couldn't be opened. Try a different one.")
  }
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new IconUploadError('Your browser could not process the image.')
  drawCover(ctx, bitmap, 512)
  bitmap.close()
  return canvas.toDataURL('image/png')
}

export class IconUploadError extends Error {}

function drawCentered(ctx: CanvasRenderingContext2D, text: string, size: number) {
  const m = ctx.measureText(text)
  const width = m.actualBoundingBoxLeft + m.actualBoundingBoxRight
  const height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
  const x = (size - width) / 2 + m.actualBoundingBoxLeft
  const y = (size - height) / 2 + m.actualBoundingBoxAscent
  ctx.fillText(text, x, y)
}

function drawCover(ctx: CanvasRenderingContext2D, image: CanvasImageSource & { width: number; height: number }, size: number) {
  const side = Math.min(image.width, image.height)
  const sx = (image.width - side) / 2
  const sy = (image.height - side) / 2
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image failed to load'))
    img.src = src
  })
}

async function ensureSymbolFont(sample: string): Promise<boolean> {
  if (!('fonts' in document)) return false
  try {
    await document.fonts.load(`48px "${SYMBOL_FONT}"`, sample)
    return document.fonts.check(`48px "${SYMBOL_FONT}"`, sample)
  } catch {
    return false
  }
}
