package com.sanctum;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.sanctum.support.AbstractIntegrationTest;
import java.awt.image.BufferedImage;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * Pins the JSON field names the frontend reads. A rename here silently breaks the client
 * ({@code sessionId} not {@code id}, {@code reply} not {@code message}).
 */
class ContractTest extends AbstractIntegrationTest {

    private static final String ISO_UTC = "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,9})?Z";

    @Test
    void sessionResponseShape() {
        JsonNode created = json(rest.postForEntity("/api/sessions", null, String.class));
        assertThat(fields(created)).containsExactlyInAnyOrder("sessionId", "createdAt", "expiresAt", "conversations");
        assertThat(created.has("id")).isFalse();
        assertThat(created.get("createdAt").asText()).matches(ISO_UTC);
        assertThat(created.get("expiresAt").asText()).matches(ISO_UTC);
        assertThat(fields(created.get("conversations"))).containsExactlyInAnyOrder("therapy", "legal");

        String id = created.get("sessionId").asText();
        postJson("/api/chat/therapy", Map.of("sessionId", id, "message", "hi"));
        patchJson("/api/sessions/" + id, Map.of("situationSummary", "summary"));
        JsonNode full = json(get("/api/sessions/" + id));
        assertThat(fields(full)).containsExactlyInAnyOrder(
                "sessionId", "createdAt", "expiresAt", "situationSummary", "conversations");
        JsonNode message = full.get("conversations").get("therapy").get(0);
        assertThat(fields(message)).containsExactlyInAnyOrder("role", "content", "timestamp");
        assertThat(message.get("timestamp").asText()).matches(ISO_UTC);
    }

    @Test
    void chatResponseShape() {
        String id = createSession();
        for (String path : List.of("/api/chat/therapy", "/api/chat/legal")) {
            JsonNode body = json(postJson(path, Map.of("sessionId", id, "message", "hi")));
            assertThat(fields(body)).containsExactlyInAnyOrder("reply", "timestamp");
            assertThat(body.get("timestamp").asText()).matches(ISO_UTC);
        }
    }

    @Test
    void sosResponseShapes() {
        String id = createSession();
        JsonNode expanded = json(postJson("/api/sos/expand", Map.of("sessionId", id, "shortInput", "help")));
        assertThat(fields(expanded)).containsExactly("expandedMessage");

        JsonNode encoded = json(multipart("/api/sos/encode", parts(Map.of("sessionId", id, "message", "m")), null, String.class));
        assertThat(fields(encoded)).containsExactlyInAnyOrder("imageUrl", "byteSize");

        byte[] png = Base64.getDecoder().decode(encoded.get("imageUrl").asText().substring(22));
        JsonNode found = json(multipart("/api/sos/decode", parts(Map.of("image", file(png, "a.png"))), null, String.class));
        assertThat(fields(found)).containsExactlyInAnyOrder("found", "decodedMessage");

        byte[] plain = png(new BufferedImage(32, 32, BufferedImage.TYPE_INT_RGB));
        JsonNode notFound = json(multipart("/api/sos/decode", parts(Map.of("image", file(plain, "b.png"))), null, String.class));
        assertThat(fields(notFound)).containsExactly("found");
    }

    @Test
    void errorShape() {
        JsonNode error = json(get("/api/sessions/" + UUID.randomUUID()));
        assertThat(fields(error)).containsExactlyInAnyOrder("status", "code", "message");
        assertThat(error.get("status").asInt()).isEqualTo(404);
    }

    private static List<String> fields(JsonNode node) {
        List<String> names = new ArrayList<>();
        node.fieldNames().forEachRemaining(names::add);
        return names;
    }
}
