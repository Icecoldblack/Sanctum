package com.sanctum.sos;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.sanctum.ai.AiService.AiMessage;
import com.sanctum.support.AbstractIntegrationTest;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

class SosIntegrationTest extends AbstractIntegrationTest {

    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};

    @Test
    void expandUsesSosPromptAndReturnsModelText() {
        String id = createSession();
        ai.replyWith("I need a ride. I feel unsafe. Please come get me.");
        ResponseEntity<String> response = postJson("/api/sos/expand", Map.of("sessionId", id, "shortInput", "need a ride, feel unsafe"));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(json(response).get("expandedMessage").asText()).isEqualTo("I need a ride. I feel unsafe. Please come get me.");
        assertThat(ai.lastCall().systemPrompt()).contains("Do not add facts");
        assertThat(ai.lastCall().conversation()).containsExactly(AiMessage.user("need a ride, feel unsafe"));
        // Nothing about the SOS is stored.
        assertThat(jdbc.queryForObject("select count(*) from messages where session_id = ?::uuid", Integer.class, id)).isZero();
    }

    @Test
    void expandFailureIs503AndUnknownSessionIs404() {
        String id = createSession();
        ai.failNextCalls();
        ResponseEntity<String> failed = postJson("/api/sos/expand", Map.of("sessionId", id, "shortInput", "help"));
        assertThat(failed.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(json(failed).has("expandedMessage")).isFalse();

        assertThat(postJson("/api/sos/expand", Map.of("sessionId", UUID.randomUUID().toString(), "shortInput", "help"))
                .getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(postJson("/api/sos/expand", Map.of("sessionId", id, "shortInput", "")).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void encodeWithDefaultCarrierReturnsJsonDataUrlThatDecodes() {
        String id = createSession();
        String message = "Need help 🆘\nCall me at the usual time.\n— M";
        ResponseEntity<String> response = multipart("/api/sos/encode",
                parts(Map.of("sessionId", id, "message", message)), "application/json, text/plain, */*", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = json(response);
        String dataUrl = body.get("imageUrl").asText();
        assertThat(dataUrl).startsWith("data:image/png;base64,");
        byte[] png = Base64.getDecoder().decode(dataUrl.substring("data:image/png;base64,".length()));
        assertThat(body.get("byteSize").asLong()).isEqualTo(png.length);
        assertThat(Arrays.copyOf(png, 8)).isEqualTo(PNG_SIGNATURE);

        JsonNode decoded = decode(png, "sanctum-image.png");
        assertThat(decoded.get("found").asBoolean()).isTrue();
        assertThat(decoded.get("decodedMessage").asText()).isEqualTo(message);
    }

    @Test
    void encodeWithAcceptPngReturnsAttachmentBytes() {
        String id = createSession();
        String message = "Ünïcödé 日本語 👩‍👩‍👧 line\nbreak";
        ResponseEntity<byte[]> response = multipart("/api/sos/encode",
                parts(Map.of("sessionId", id, "message", message)), MediaType.IMAGE_PNG_VALUE, byte[].class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.IMAGE_PNG);
        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION))
                .startsWith("attachment").contains("sanctum-image.png");
        assertThat(Arrays.copyOf(response.getBody(), 8)).isEqualTo(PNG_SIGNATURE);
        assertThat(decode(response.getBody(), "photo.png").get("decodedMessage").asText()).isEqualTo(message);
    }

    @Test
    void encodeWithUploadedCarrierAsTheFrontendSendsIt() throws IOException {
        String id = createSession();
        byte[] carrier;
        try (InputStream in = getClass().getResourceAsStream("/carriers/default-carrier.png")) {
            carrier = in.readAllBytes();
        }
        // The frontend sends the carrier as a Blob named "blob".
        ResponseEntity<String> response = multipart("/api/sos/encode",
                parts(Map.of("sessionId", id, "message", "uploaded carrier", "image", file(carrier, "blob"))),
                null, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        byte[] png = Base64.getDecoder().decode(json(response).get("imageUrl").asText().substring(22));
        BufferedImage out = ImageIO.read(new java.io.ByteArrayInputStream(png));
        BufferedImage in = ImageIO.read(new java.io.ByteArrayInputStream(carrier));
        assertThat(out.getWidth()).isEqualTo(in.getWidth());
        assertThat(out.getHeight()).isEqualTo(in.getHeight());
        assertThat(decode(png, "x.png").get("decodedMessage").asText()).isEqualTo("uploaded carrier");
    }

    @Test
    void encodeRejectsNonPngCarrierEvenIfNamedPng() throws IOException {
        String id = createSession();
        ByteArrayOutputStream jpeg = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(32, 32, BufferedImage.TYPE_INT_RGB), "jpg", jpeg);
        ResponseEntity<String> response = multipart("/api/sos/encode",
                parts(Map.of("sessionId", id, "message", "hi", "image", file(jpeg.toByteArray(), "carrier.png"))),
                null, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        assertThat(json(response).get("code").asText()).isEqualTo("unsupported_image");
    }

    @Test
    void encodeRejectsMessageThatDoesNotFit() {
        String id = createSession();
        byte[] tiny = png(new BufferedImage(16, 16, BufferedImage.TYPE_INT_RGB));
        ResponseEntity<String> response = multipart("/api/sos/encode",
                parts(Map.of("sessionId", id, "message", "a".repeat(61), "image", file(tiny, "tiny.png"))),
                null, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
        assertThat(json(response).get("code").asText()).isEqualTo("message_too_large");
    }

    @Test
    void encodeValidatesSessionAndMessage() {
        ResponseEntity<String> unknown = multipart("/api/sos/encode",
                parts(Map.of("sessionId", UUID.randomUUID().toString(), "message", "hi")), null, String.class);
        assertThat(unknown.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        String id = createSession();
        assertThat(multipart("/api/sos/encode", parts(Map.of("sessionId", id, "message", "  ")), null, String.class)
                .getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(multipart("/api/sos/encode", parts(Map.of("sessionId", id, "message", "x".repeat(4001))), null, String.class)
                .getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(multipart("/api/sos/encode", parts(Map.of("sessionId", id)), null, String.class)
                .getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void decodeOfOrdinaryPngReportsNotFoundWithoutMessageField() {
        byte[] plain = png(new BufferedImage(64, 64, BufferedImage.TYPE_INT_RGB));
        JsonNode body = decode(plain, "holiday.png");
        assertThat(body.get("found").asBoolean()).isFalse();
        assertThat(body.has("decodedMessage")).isFalse();
    }

    @Test
    void decodeRejectsNonPngWith415() throws IOException {
        ByteArrayOutputStream jpeg = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(32, 32, BufferedImage.TYPE_INT_RGB), "jpg", jpeg);
        ResponseEntity<String> response = multipart("/api/sos/decode",
                parts(Map.of("image", file(jpeg.toByteArray(), "image.png"))), null, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }

    @Test
    void decodeRejectsUploadsOver10Mb() {
        byte[] big = new byte[11 * 1024 * 1024];
        System.arraycopy(PNG_SIGNATURE, 0, big, 0, 8);
        ResponseEntity<String> response = multipart("/api/sos/decode", parts(Map.of("image", file(big, "big.png"))), null, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
        assertThat(json(response).get("code").asText()).isEqualTo("payload_too_large");
    }

    @Test
    void decodeRequiresAnImage() {
        ResponseEntity<String> response = multipart("/api/sos/decode", parts(Map.of("other", "x")), null, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    private JsonNode decode(byte[] png, String filename) {
        ResponseEntity<String> response = multipart("/api/sos/decode", parts(Map.of("image", file(png, filename))), null, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return json(response);
    }
}
