package com.sanctum.sos.steganography;

/**
 * Writes bytes into the least significant bit of the R, G, and B channels of packed ARGB pixels,
 * in row-major pixel order, R then G then B, most significant bit of each byte first. Alpha is
 * never touched: changing it produces visible artifacts.
 */
final class LsbEncoder {

    static final int[] CHANNEL_SHIFTS = {16, 8, 0};

    private LsbEncoder() {}

    /** Number of payload bytes that fit in {@code pixelCount} pixels. */
    static long capacityBytes(long pixelCount) {
        return pixelCount * 3 / 8;
    }

    static void embed(int[] pixels, byte[] data) {
        long bitsNeeded = (long) data.length * 8;
        if (bitsNeeded > (long) pixels.length * 3) {
            throw new IllegalArgumentException("Payload does not fit");
        }
        for (int bit = 0; bit < bitsNeeded; bit++) {
            int value = (data[bit >>> 3] >>> (7 - (bit & 7))) & 1;
            int pixel = bit / 3;
            int shift = CHANNEL_SHIFTS[bit % 3];
            pixels[pixel] = (pixels[pixel] & ~(1 << shift)) | (value << shift);
        }
    }
}
