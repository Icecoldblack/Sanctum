/**
 * How many characters an LSB carrier can actually hold.
 *
 * The encoder writes one bit per colour channel, so a WxH RGB image carries
 * W*H*3 bits. The previous flat 500-character guess was wrong in both
 * directions: it rejected long messages that a large photo could hold easily,
 * and accepted ones a small photo could not.
 */

/** Bits reserved by the encoder for a length header and terminator. */
const HEADER_BITS = 64

/** Stay clear of the theoretical maximum; the last bits are the least reliable. */
const SAFETY_FACTOR = 0.9

export function capacityForPixels(width: number, height: number): number {
  const totalBits = width * height * 3 - HEADER_BITS
  if (totalBits <= 0) return 0
  // UTF-8 worst case for non-ASCII text is 4 bytes per character.
  return Math.max(0, Math.floor(((totalBits / 8) * SAFETY_FACTOR) / 4))
}

/** Reads intrinsic dimensions without decoding the file into app state. */
export function measureImage(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Could not read image dimensions'))
    img.src = src
  })
}
