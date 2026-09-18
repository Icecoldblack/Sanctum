package com.sanctum.sos.steganography;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sanctum.TestProperties;
import com.sanctum.common.exceptions.ApiException;
import com.sanctum.crypto.EncryptionService;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.awt.image.IndexColorModel;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageTypeSpecifier;
import javax.imageio.ImageWriter;
import javax.imageio.metadata.IIOMetadata;
import javax.imageio.metadata.IIOMetadataNode;
import javax.imageio.stream.ImageOutputStream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class SteganographyServiceTest {

    private final EncryptionService encryption = new EncryptionService(TestProperties.defaults());
    private final SteganographyService service = new SteganographyService(encryption, TestProperties.defaults());

    @ParameterizedTest
    @ValueSource(strings = {
        "a",
        "Need a ride, feel unsafe. Come to the back door at 9.",
        "Line one\nLine two\r\nLine three\ttabbed",
        "Emoji 🆘🚗🏠 and ZWJ family 👩‍👩‍👧 and flags 🇺🇸",
        "Ünïcödé — 日本語 — العربية — עברית — Ελληνικά — हिन्दी",
        "  leading and trailing whitespace  "
    })
    void roundTripsExactly(String message) throws IOException {
        byte[] encoded = service.embed(carrier(64, 64, BufferedImage.TYPE_INT_RGB), message);
        assertThat(service.extract(encoded)).contains(message);
    }

    @Test
    void roundTripsWithBundledCarrierAndMaximumLengthMessage() throws IOException {
        String message = "x".repeat(3999) + "é";
        byte[] carrier;
        try (InputStream in = getClass().getResourceAsStream("/carriers/default-carrier.png")) {
            carrier = in.readAllBytes();
        }
        assertThat(service.extract(service.embed(carrier, message))).contains(message);
    }

    @Test
    void preservesAlphaChannelAndRoundTripsTransparentImages() throws IOException {
        BufferedImage img = new BufferedImage(32, 32, BufferedImage.TYPE_INT_ARGB);
        for (int y = 0; y < 32; y++) {
            for (int x = 0; x < 32; x++) {
                int alpha = (x + y) % 3 == 0 ? 0 : (x * 8) & 0xFF;
                img.setRGB(x, y, (alpha << 24) | (x * 7 << 16) | (y * 5 << 8) | 0x40);
            }
        }
        byte[] encoded = service.embed(png(img), "transparent carrier");
        BufferedImage out = ImageIO.read(new ByteArrayInputStream(encoded));
        assertThat(out.getColorModel().hasAlpha()).isTrue();
        for (int y = 0; y < 32; y++) {
            for (int x = 0; x < 32; x++) {
                assertThat(out.getRGB(x, y) >>> 24).isEqualTo(img.getRGB(x, y) >>> 24);
            }
        }
        assertThat(service.extract(encoded)).contains("transparent carrier");
    }

    @Test
    void changesOnlyLeastSignificantBits() throws IOException {
        BufferedImage img = noise(40, 40, BufferedImage.TYPE_INT_RGB);
        BufferedImage out = ImageIO.read(new ByteArrayInputStream(service.embed(png(img), "hello")));
        for (int y = 0; y < 40; y++) {
            for (int x = 0; x < 40; x++) {
                int diff = img.getRGB(x, y) ^ out.getRGB(x, y);
                assertThat(diff & ~0x010101).isZero();
            }
        }
    }

    @Test
    void worksWithPaletteAndGrayscaleCarriers() throws IOException {
        byte[] r = new byte[256];
        byte[] g = new byte[256];
        byte[] b = new byte[256];
        for (int i = 0; i < 256; i++) {
            r[i] = (byte) i;
            g[i] = (byte) (255 - i);
            b[i] = (byte) (i / 2);
        }
        BufferedImage indexed = new BufferedImage(40, 40, BufferedImage.TYPE_BYTE_INDEXED, new IndexColorModel(8, 256, r, g, b));
        BufferedImage gray = new BufferedImage(40, 40, BufferedImage.TYPE_BYTE_GRAY);
        for (BufferedImage img : List.of(indexed, gray)) {
            Graphics2D g2 = img.createGraphics();
            g2.setColor(Color.GRAY);
            g2.fillRect(0, 0, 20, 40);
            g2.dispose();
            assertThat(service.extract(service.embed(png(img), "palette ok"))).contains("palette ok");
        }
    }

    @Test
    void capacityBoundaryIsExact() throws IOException {
        // 16x16 pixels hold 16*16*3/8 = 96 bytes. Overhead is 8 header + 28 seal = 36, leaving 60.
        byte[] carrier = carrier(16, 16, BufferedImage.TYPE_INT_RGB);
        String fits = "a".repeat(60);
        assertThat(SteganographyService.requiredBytes(fits)).isEqualTo(96);
        assertThat(service.extract(service.embed(carrier, fits))).contains(fits);

        String tooLong = "a".repeat(61);
        assertThatThrownBy(() -> service.embed(carrier, tooLong))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.getStatus().value()).isEqualTo(413);
                    assertThat(e.getCode()).isEqualTo("message_too_large");
                });
    }

    @Test
    void multiByteCharactersCountAsBytesForCapacity() throws IOException {
        byte[] carrier = carrier(16, 16, BufferedImage.TYPE_INT_RGB);
        String fourByteEmoji = "🆘".repeat(15); // 60 bytes
        assertThat(service.extract(service.embed(carrier, fourByteEmoji))).contains(fourByteEmoji);
        assertThatThrownBy(() -> service.embed(carrier, fourByteEmoji + "a"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void imageWithoutHiddenMessageReportsNotFound() throws IOException {
        assertThat(service.extract(carrier(64, 64, BufferedImage.TYPE_INT_RGB))).isEmpty();
        assertThat(service.extract(png(noise(64, 64, BufferedImage.TYPE_INT_RGB)))).isEmpty();
    }

    @Test
    void tinyImageReportsNotFound() throws IOException {
        assertThat(service.extract(carrier(2, 2, BufferedImage.TYPE_INT_RGB))).isEmpty();
    }

    @Test
    void corruptedPayloadIsReportedAsCorrupt() throws IOException {
        byte[] encoded = service.embed(carrier(64, 64, BufferedImage.TYPE_INT_RGB), "secret message");
        BufferedImage img = ImageIO.read(new ByteArrayInputStream(encoded));
        // Flip the LSB of a pixel inside the ciphertext region (past the 8-byte header = 22 pixels).
        int x = 30;
        img.setRGB(x, 0, img.getRGB(x, 0) ^ 0x010000);
        assertCorrupt(png(img));
    }

    @Test
    void implausibleLengthIsReportedAsCorrupt() throws IOException {
        BufferedImage img = new BufferedImage(64, 64, BufferedImage.TYPE_INT_RGB);
        int[] pixels = img.getRGB(0, 0, 64, 64, null, 0, 64);
        LsbEncoder.embed(pixels, ByteBuffer.allocate(8).put(SteganographyService.MAGIC).putInt(Integer.MAX_VALUE).array());
        img.setRGB(0, 0, 64, 64, pixels, 0, 64);
        assertCorrupt(png(img));

        LsbEncoder.embed(pixels, ByteBuffer.allocate(8).put(SteganographyService.MAGIC).putInt(3).array());
        img.setRGB(0, 0, 64, 64, pixels, 0, 64);
        assertCorrupt(png(img));
    }

    @Test
    void invalidUtf8InsideValidCiphertextIsCorrupt() throws IOException {
        byte[] sealed = encryption.sealForImage(new byte[] {(byte) 0xC3, (byte) 0x28});
        BufferedImage img = new BufferedImage(64, 64, BufferedImage.TYPE_INT_RGB);
        int[] pixels = img.getRGB(0, 0, 64, 64, null, 0, 64);
        LsbEncoder.embed(pixels, ByteBuffer.allocate(8 + sealed.length)
                .put(SteganographyService.MAGIC).putInt(sealed.length).put(sealed).array());
        img.setRGB(0, 0, 64, 64, pixels, 0, 64);
        assertCorrupt(png(img));
    }

    @Test
    void messageFromAnotherServerKeyIsCorrupt() throws IOException {
        EncryptionService otherKey = new EncryptionService(
                TestProperties.withKey("HyAdHBsaGRgXFhUUExIREA8ODQwLCgkIBwYFBAMCAQA="));
        byte[] encoded = new SteganographyService(otherKey, TestProperties.defaults())
                .embed(carrier(64, 64, BufferedImage.TYPE_INT_RGB), "hello");
        assertCorrupt(encoded);
    }

    @Test
    void rejectsNonPngByMagicBytesRegardlessOfName() throws IOException {
        ByteArrayOutputStream jpeg = new ByteArrayOutputStream();
        ImageIO.write(noise(16, 16, BufferedImage.TYPE_INT_RGB), "jpg", jpeg);
        for (byte[] bytes : List.of(jpeg.toByteArray(), "GIF89a....".getBytes(StandardCharsets.US_ASCII),
                new byte[0], new byte[] {(byte) 0x89, 'P', 'N'})) {
            assertThatThrownBy(() -> service.extract(bytes))
                    .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus().value()).isEqualTo(415));
            assertThatThrownBy(() -> service.embed(bytes, "x"))
                    .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus().value()).isEqualTo(415));
        }
        assertThatThrownBy(() -> service.extract(null)).isInstanceOf(ApiException.class);
    }

    @Test
    void truncatedPngIsInvalid() throws IOException {
        byte[] full = carrier(64, 64, BufferedImage.TYPE_INT_RGB);
        byte[] truncated = java.util.Arrays.copyOf(full, 40);
        assertThatThrownBy(() -> service.extract(truncated))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getCode()).isEqualTo("invalid_image"));
    }

    @Test
    void rejectsOversizedDimensionsBeforeDecoding() throws IOException {
        SteganographyService strict = new SteganographyService(encryption, TestProperties.withStegoLimits(1000, 50));
        assertThatThrownBy(() -> strict.extract(carrier(51, 10, BufferedImage.TYPE_INT_RGB)))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getCode()).isEqualTo("image_too_large"));
        assertThatThrownBy(() -> strict.extract(carrier(40, 40, BufferedImage.TYPE_INT_RGB)))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getCode()).isEqualTo("image_too_large"));
        assertThat(strict.extract(carrier(30, 30, BufferedImage.TYPE_INT_RGB))).isEmpty();
    }

    @Test
    void decompressionBombHeaderIsRejected() throws IOException {
        // A tiny file whose header claims 100000 x 100000 pixels.
        byte[] png = carrier(1, 1, BufferedImage.TYPE_INT_RGB);
        ByteBuffer.wrap(png, 16, 8).putInt(100_000).putInt(100_000);
        assertThatThrownBy(() -> service.extract(png))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getCode()).isEqualTo("image_too_large"));
    }

    @Test
    void stripsAllCarrierMetadata() throws IOException {
        byte[] withMetadata = pngWithTextChunks(carrier(48, 48, BufferedImage.TYPE_INT_RGB));
        assertThat(chunkTypes(withMetadata)).contains("tEXt", "tIME");

        byte[] encoded = service.embed(withMetadata, "hi");
        List<String> chunks = chunkTypes(encoded);
        assertThat(chunks).doesNotContain("tEXt", "zTXt", "iTXt", "eXIf", "tIME", "pHYs", "iCCP", "gAMA");
        assertThat(chunks).allMatch(c -> List.of("IHDR", "IDAT", "IEND").contains(c));
        assertThat(new String(encoded, StandardCharsets.ISO_8859_1)).doesNotContain("GPS").doesNotContain("40.7128");
    }

    // --- helpers ---------------------------------------------------------------------------

    private void assertCorrupt(byte[] png) {
        assertThatThrownBy(() -> service.extract(png))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.getStatus().value()).isEqualTo(422);
                    assertThat(e.getCode()).isEqualTo("corrupt_payload");
                });
    }

    static byte[] carrier(int w, int h, int type) throws IOException {
        BufferedImage img = new BufferedImage(w, h, type);
        Graphics2D g = img.createGraphics();
        g.setColor(new Color(90, 140, 80));
        g.fillRect(0, 0, w, h);
        g.setColor(new Color(200, 220, 180));
        g.fillOval(0, 0, Math.max(1, w / 2), Math.max(1, h / 2));
        g.dispose();
        return png(img);
    }

    static BufferedImage noise(int w, int h, int type) {
        Random random = new Random(42);
        BufferedImage img = new BufferedImage(w, h, type);
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                img.setRGB(x, y, random.nextInt());
            }
        }
        return img;
    }

    static byte[] png(BufferedImage img) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "png", out);
        return out.toByteArray();
    }

    private static byte[] pngWithTextChunks(byte[] source) throws IOException {
        BufferedImage img = ImageIO.read(new ByteArrayInputStream(source));
        ImageWriter writer = ImageIO.getImageWritersByFormatName("png").next();
        IIOMetadata metadata = writer.getDefaultImageMetadata(ImageTypeSpecifier.createFromRenderedImage(img), null);
        IIOMetadataNode root = new IIOMetadataNode("javax_imageio_png_1.0");
        IIOMetadataNode text = new IIOMetadataNode("tEXt");
        IIOMetadataNode entry = new IIOMetadataNode("tEXtEntry");
        entry.setAttribute("keyword", "Comment");
        entry.setAttribute("value", "GPS 40.7128 N 74.0060 W");
        text.appendChild(entry);
        root.appendChild(text);
        IIOMetadataNode time = new IIOMetadataNode("tIME");
        time.setAttribute("year", "2026");
        time.setAttribute("month", "9");
        time.setAttribute("day", "17");
        time.setAttribute("hour", "10");
        time.setAttribute("minute", "0");
        time.setAttribute("second", "0");
        root.appendChild(time);
        metadata.mergeTree("javax_imageio_png_1.0", root);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(out)) {
            writer.setOutput(ios);
            writer.write(new IIOImage(img, null, metadata));
        }
        writer.dispose();
        return out.toByteArray();
    }

    static List<String> chunkTypes(byte[] png) {
        List<String> types = new ArrayList<>();
        ByteBuffer buf = ByteBuffer.wrap(png);
        buf.position(8);
        while (buf.remaining() >= 12) {
            int length = buf.getInt();
            byte[] type = new byte[4];
            buf.get(type);
            types.add(new String(type, StandardCharsets.US_ASCII));
            buf.position(buf.position() + length + 4);
        }
        return types;
    }
}
