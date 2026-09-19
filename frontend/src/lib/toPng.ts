/**
 * Turns any photo the browser can open into a PNG the steganography server accepts.
 *
 * Hidden messages only survive in lossless pixels, so the server takes PNG alone. Phone photos are
 * almost always JPEG (or HEIC, which Safari decodes), so they are redrawn onto a canvas and
 * re-encoded here, before upload. Re-encoding also drops EXIF metadata such as GPS location.
 *
 * A PNG of a photo is several times larger than the JPEG, so the image is scaled down until the
 * result fits the upload limit. Even the smallest size still holds far more text than a message
 * needs.
 */

/** Must match the server's multipart limit. */
export const MAX_CARRIER_BYTES = 10 * 1024 * 1024

/** Server-side guards (sanctum.stego.max-dimension / max-pixels). */
const MAX_DIMENSION = 8192
const MAX_PIXELS = 20_000_000

/** Longest edge for converted photos, then smaller steps if the PNG is still too large. */
const EDGE_STEPS = [1600, 1200, 900]

export async function toCarrierPng(file: Blob): Promise<Blob> {
  const bitmap = await decode(file)
  try {
    const { width, height } = bitmap
    if (
      file.type === 'image/png' &&
      file.size <= MAX_CARRIER_BYTES &&
      width <= MAX_DIMENSION &&
      height <= MAX_DIMENSION &&
      width * height <= MAX_PIXELS
    ) {
      return file
    }

    for (const edge of EDGE_STEPS) {
      const scale = Math.min(1, edge / Math.max(width, height))
      const png = await drawPng(bitmap, Math.round(width * scale), Math.round(height * scale))
      if (png.size <= MAX_CARRIER_BYTES) return png
    }
    throw new Error('Photo is too large to convert')
  } finally {
    bitmap.close()
  }
}

async function decode(file: Blob): Promise<ImageBitmap> {
  // createImageBitmap applies EXIF orientation, so portrait phone photos stay upright.
  try {
    return await createImageBitmap(file)
  } catch {
    throw new Error('This photo could not be opened')
  }
}

function drawPng(bitmap: ImageBitmap, width: number, height: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas unavailable'))
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png')
  })
}
