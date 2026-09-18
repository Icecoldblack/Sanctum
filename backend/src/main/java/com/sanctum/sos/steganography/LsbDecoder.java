package com.sanctum.sos.steganography;

/** Reads bytes written by {@link LsbEncoder}. */
final class LsbDecoder {

    private LsbDecoder() {}

    /** Reads {@code length} bytes starting at byte offset {@code offset} of the hidden stream. */
    static byte[] read(int[] pixels, long offset, int length) {
        long firstBit = offset * 8;
        long lastBit = firstBit + (long) length * 8;
        if (lastBit > (long) pixels.length * 3) {
            throw new IllegalArgumentException("Read beyond image capacity");
        }
        byte[] out = new byte[length];
        for (long bit = firstBit; bit < lastBit; bit++) {
            int pixel = (int) (bit / 3);
            int shift = LsbEncoder.CHANNEL_SHIFTS[(int) (bit % 3)];
            int value = (pixels[pixel] >>> shift) & 1;
            long rel = bit - firstBit;
            out[(int) (rel >>> 3)] |= (byte) (value << (7 - (rel & 7)));
        }
        return out;
    }
}
