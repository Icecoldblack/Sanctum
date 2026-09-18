package com.sanctum.sos.steganography;

import com.sanctum.common.exceptions.Errors;
import com.sanctum.config.SanctumProperties;
import com.sanctum.crypto.EncryptionService;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Iterator;
import java.util.Optional;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.stereotype.Service;

/**
 * Hides an encrypted message in the RGB least significant bits of a PNG.
 *
 * <p>Hidden stream layout: {@code ["SNCT"][uint32 length][sealed ciphertext]}. The magic lets the
 * decoder tell "no Sanctum message" apart from "damaged message". The ciphertext is AES-GCM, so
 * someone who extracts the bits gets nothing readable, and tampering is detected.
 *
 * <p>Output images are freshly encoded from pixel data only: no EXIF, text chunks, timestamps, or
 * other metadata from the carrier survives.
 */
@Service
public class SteganographyService {

    static final byte[] MAGIC = {'S', 'N', 'C', 'T'};
    static final int HEADER_BYTES = 8;
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};

    private final EncryptionService encryption;
    private final long maxPixels;
    private final int maxDimension;

    public SteganographyService(EncryptionService encryption, SanctumProperties properties) {
        this.encryption = encryption;
        this.maxPixels = properties.stego().maxPixels();
        this.maxDimension = properties.stego().maxDimension();
    }

    /** Payload bytes needed to hide {@code message}, header included. */
    public static long requiredBytes(String message) {
        return HEADER_BYTES + EncryptionService.SEAL_OVERHEAD_BYTES
                + (long) message.getBytes(StandardCharsets.UTF_8).length;
    }

    public byte[] embed(byte[] carrierPng, String message) {
        BufferedImage carrier = readPng(carrierPng);
        int width = carrier.getWidth();
        int height = carrier.getHeight();
        int[] pixels = carrier.getRGB(0, 0, width, height, null, 0, width);

        byte[] sealed = encryption.sealForImage(message.getBytes(StandardCharsets.UTF_8));
        long capacity = LsbEncoder.capacityBytes((long) width * height);
        long required = HEADER_BYTES + (long) sealed.length;
        if (required > capacity) {
            throw Errors.messageTooLarge(capacity, required);
        }
        byte[] payload = ByteBuffer.allocate((int) required).put(MAGIC).putInt(sealed.length).put(sealed).array();
        LsbEncoder.embed(pixels, payload);

        boolean hasAlpha = carrier.getColorModel().hasAlpha();
        BufferedImage out = new BufferedImage(width, height,
                hasAlpha ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB);
        out.setRGB(0, 0, width, height, pixels, 0, width);
        return writePng(out);
    }

    /**
     * @return the hidden message, or empty if the image carries no Sanctum message
     * @throws com.sanctum.common.exceptions.ApiException {@code corrupt_payload} if the marker is
     *     present but the payload is damaged or fails authentication
     */
    public Optional<String> extract(byte[] png) {
        BufferedImage image = readPng(png);
        int width = image.getWidth();
        int height = image.getHeight();
        int[] pixels = image.getRGB(0, 0, width, height, null, 0, width);
        long capacity = LsbEncoder.capacityBytes((long) width * height);
        if (capacity < HEADER_BYTES) {
            return Optional.empty();
        }
        ByteBuffer header = ByteBuffer.wrap(LsbDecoder.read(pixels, 0, HEADER_BYTES));
        byte[] magic = new byte[MAGIC.length];
        header.get(magic);
        if (!Arrays.equals(magic, MAGIC)) {
            return Optional.empty();
        }
        int length = header.getInt();
        if (length < EncryptionService.SEAL_OVERHEAD_BYTES || length > capacity - HEADER_BYTES) {
            throw Errors.corruptPayload();
        }
        byte[] plaintext;
        try {
            plaintext = encryption.openFromImage(LsbDecoder.read(pixels, HEADER_BYTES, length));
        } catch (EncryptionService.DecryptionException e) {
            throw Errors.corruptPayload();
        }
        return Optional.of(strictUtf8(plaintext));
    }

    /**
     * Validates the PNG signature (never trusting Content-Type or file names), checks dimensions
     * from the header before decoding pixels (decompression-bomb guard), then decodes.
     */
    BufferedImage readPng(byte[] bytes) {
        if (bytes == null || bytes.length < PNG_SIGNATURE.length
                || !Arrays.equals(bytes, 0, PNG_SIGNATURE.length, PNG_SIGNATURE, 0, PNG_SIGNATURE.length)) {
            throw Errors.unsupportedImage();
        }
        Iterator<ImageReader> readers = ImageIO.getImageReadersByFormatName("png");
        if (!readers.hasNext()) {
            throw new IllegalStateException("No PNG reader available");
        }
        ImageReader reader = readers.next();
        try (ImageInputStream in = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            reader.setInput(in, true, true);
            int width = reader.getWidth(0);
            int height = reader.getHeight(0);
            if (width <= 0 || height <= 0) {
                throw Errors.invalidImage();
            }
            if (width > maxDimension || height > maxDimension || (long) width * height > maxPixels) {
                throw Errors.imageTooLarge();
            }
            BufferedImage image = reader.read(0);
            if (image == null) {
                throw Errors.invalidImage();
            }
            return image;
        } catch (IOException | RuntimeException e) {
            if (e instanceof com.sanctum.common.exceptions.ApiException api) {
                throw api;
            }
            throw Errors.invalidImage();
        } finally {
            reader.dispose();
        }
    }

    private static byte[] writePng(BufferedImage image) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            if (!ImageIO.write(image, "png", out)) {
                throw new IllegalStateException("No PNG writer available");
            }
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static String strictUtf8(byte[] bytes) {
        try {
            CharBuffer chars = StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes));
            return chars.toString();
        } catch (CharacterCodingException e) {
            throw Errors.corruptPayload();
        }
    }
}
