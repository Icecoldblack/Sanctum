package com.sanctum;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.sanctum.support.AbstractIntegrationTest;
import java.util.Base64;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

/** Exercises every endpoint, then greps the log output for anything that must never appear there. */
@ExtendWith(OutputCaptureExtension.class)
class LoggingPolicyIntegrationTest extends AbstractIntegrationTest {

    @Test
    void noSessionIdsMessageContentOrIpsInLogs(CapturedOutput output) {
        String id = createSession();
        String secretMessage = "MY-SECRET-MESSAGE he hurt me at Elm Street";
        String secretReply = "MODEL-SECRET-REPLY";
        ai.replyWith(secretReply);

        get("/api/sessions/" + id);
        patchJson("/api/sessions/" + id, Map.of("situationSummary", "SECRET-SUMMARY"));
        postJson("/api/chat/therapy", Map.of("sessionId", id, "message", secretMessage));
        postJson("/api/chat/legal", Map.of("sessionId", id, "message", secretMessage));
        postJson("/api/sos/expand", Map.of("sessionId", id, "shortInput", "SECRET-SOS-INPUT"));
        JsonNode encoded = json(multipart("/api/sos/encode",
                parts(Map.of("sessionId", id, "message", "SECRET-HIDDEN-TEXT")), null, String.class));
        byte[] png = Base64.getDecoder().decode(encoded.get("imageUrl").asText().substring(22));
        multipart("/api/sos/decode", parts(Map.of("image", file(png, "a.png"))), null, String.class);
        ai.failNextCalls();
        postJson("/api/chat/therapy", Map.of("sessionId", id, "message", secretMessage));
        get("/api/sessions/00000000-0000-4000-8000-000000000000");
        delete("/api/sessions/" + id);

        String logs = output.getAll();
        assertThat(logs).contains("POST /api/chat/therapy -> 200", "GET /api/sessions/{sessionId} -> 404");
        assertThat(logs)
                .doesNotContain(id)
                .doesNotContain("00000000-0000-4000-8000-000000000000")
                .doesNotContain("MY-SECRET-MESSAGE")
                .doesNotContain("Elm Street")
                .doesNotContain(secretReply)
                .doesNotContain("SECRET-SUMMARY")
                .doesNotContain("SECRET-SOS-INPUT")
                .doesNotContain("SECRET-HIDDEN-TEXT")
                .doesNotContain("127.0.0.1");
    }

    @Test
    void backstopFilterSuppressesAccidentalSensitiveLogging(CapturedOutput output) {
        Logger log = LoggerFactory.getLogger("com.sanctum.SomeCareLessCode");
        log.warn("Lookup failed for session {} from {}", "3f2b8c1e-9a4d-4e2b-8f6a-1c2d3e4f5a6b", "203.0.113.9");
        log.error("Wrapped", new IllegalStateException("id 3f2b8c1e-9a4d-4e2b-8f6a-1c2d3e4f5a6b"));
        log.info("An ordinary line that is fine");

        String logs = output.getAll();
        assertThat(logs).doesNotContain("3f2b8c1e-9a4d-4e2b-8f6a-1c2d3e4f5a6b").doesNotContain("203.0.113.9");
        assertThat(logs).contains("[log event suppressed: matched sensitive-data pattern]");
        assertThat(logs).contains("exception=java.lang.IllegalStateException");
        assertThat(logs).contains("An ordinary line that is fine");
    }
}
