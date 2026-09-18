package com.sanctum.session;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.sanctum.scheduled.SessionCleanupJob;
import com.sanctum.support.AbstractIntegrationTest;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

class SessionLifecycleIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    SessionCleanupJob cleanupJob;

    @Test
    void createReturns201WithUuidAnd24HourExpiryOnBothPaths() {
        for (String path : new String[] {"/api/session", "/api/sessions"}) {
            ResponseEntity<String> response = rest.postForEntity(path, null, String.class);
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
            JsonNode body = json(response);
            UUID id = UUID.fromString(body.get("sessionId").asText());
            assertThat(id.version()).isEqualTo(4);
            Instant created = Instant.parse(body.get("createdAt").asText());
            Instant expires = Instant.parse(body.get("expiresAt").asText());
            assertThat(Duration.between(created, expires)).isEqualTo(Duration.ofHours(24));
            assertThat(body.get("conversations").get("therapy").isEmpty()).isTrue();
            assertThat(body.get("conversations").get("legal").isEmpty()).isTrue();
        }
    }

    @Test
    void getReturnsTheSession() {
        String id = createSession();
        for (String path : new String[] {"/api/session/", "/api/sessions/"}) {
            ResponseEntity<String> response = get(path + id);
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(json(response).get("sessionId").asText()).isEqualTo(id);
        }
    }

    @Test
    void unknownMalformedAndOfflineIdsAre404() {
        for (String id : new String[] {UUID.randomUUID().toString(), "local-" + UUID.randomUUID(), "garbage", "1"}) {
            ResponseEntity<String> response = get("/api/sessions/" + id);
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
            assertThat(json(response).get("code").asText()).isEqualTo("session_not_found");
        }
    }

    @Test
    void patchStoresSummaryEncryptedAndReturnsIt() {
        String id = createSession();
        String summary = "Living with partner; he checks my phone. Safe word: blue.";
        ResponseEntity<String> response = patchJson("/api/sessions/" + id, Map.of("situationSummary", summary));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(json(response).get("situationSummary").asText()).isEqualTo(summary);
        assertThat(json(get("/api/sessions/" + id)).get("situationSummary").asText()).isEqualTo(summary);

        String stored = jdbc.queryForObject(
                "select situation_summary from sessions where session_id = ?::uuid", String.class, id);
        assertThat(stored).startsWith("v1:").doesNotContain("partner").doesNotContain("blue");

        // Empty string clears it; a body without the field leaves it alone.
        patchJson("/api/sessions/" + id, Map.of("situationSummary", summary));
        patchJson("/api/sessions/" + id, Map.of());
        assertThat(json(get("/api/sessions/" + id)).get("situationSummary").asText()).isEqualTo(summary);
        JsonNode cleared = json(patchJson("/api/sessions/" + id, Map.of("situationSummary", "")));
        assertThat(cleared.has("situationSummary")).isFalse();
    }

    @Test
    void patchValidatesLengthAndSession() {
        String id = createSession();
        ResponseEntity<String> tooLong = patchJson("/api/sessions/" + id, Map.of("situationSummary", "x".repeat(4001)));
        assertThat(tooLong.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(json(tooLong).get("code").asText()).isEqualTo("validation_failed");
        assertThat(json(tooLong).get("message").asText()).doesNotContain("xxxx");

        assertThat(patchJson("/api/sessions/" + UUID.randomUUID(), Map.of("situationSummary", "a")).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void patchSlidesExpiryButNeverPastSevenDaysFromCreation() {
        String id = createSession();
        // Pretend the session was created 6.5 days ago and is about to expire.
        Instant created = Instant.now().minus(Duration.ofHours(156));
        jdbc.update("update sessions set created_at = ?, expires_at = ? where session_id = ?::uuid",
                java.sql.Timestamp.from(created), java.sql.Timestamp.from(Instant.now().plusSeconds(60)), id);

        JsonNode body = json(patchJson("/api/sessions/" + id, Map.of("situationSummary", "x")));
        Instant expires = Instant.parse(body.get("expiresAt").asText());
        assertThat(expires).isEqualTo(Instant.parse(body.get("createdAt").asText()).plus(Duration.ofDays(7)));

        // A younger session slides a full 24h from now.
        String fresh = createSession();
        jdbc.update("update sessions set expires_at = now() + interval '1 hour' where session_id = ?::uuid", fresh);
        Instant slid = Instant.parse(json(patchJson("/api/sessions/" + fresh, Map.of())).get("expiresAt").asText());
        assertThat(slid).isAfter(Instant.now().plus(Duration.ofHours(23)));
    }

    @Test
    void deleteHardDeletesSessionAndMessages() {
        String id = createSession();
        postJson("/api/chat/therapy", Map.of("sessionId", id, "message", "hello"));
        assertThat(countMessages(id)).isEqualTo(2);

        for (String path : new String[] {"/api/sessions/", "/api/session/"}) {
            assertThat(delete(path + id).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        }
        assertThat(get("/api/sessions/" + id).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(jdbc.queryForObject("select count(*) from sessions where session_id = ?::uuid", Integer.class, id))
                .isZero();
        assertThat(countMessages(id)).isZero();
    }

    @Test
    void eraseViaBeaconStyleRequestHardDeletes() {
        String id = createSession();
        postJson("/api/chat/therapy", Map.of("sessionId", id, "message", "hello"));

        // What navigator.sendBeacon sends: a bodiless, cross-origin POST with no preflight.
        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin("http://localhost:5173");
        headers.setContentType(MediaType.TEXT_PLAIN);
        ResponseEntity<String> response = rest.exchange(
                "/api/sessions/" + id + "/erase", HttpMethod.POST, new HttpEntity<>("", headers), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(get("/api/sessions/" + id).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(countMessages(id)).isZero();
        assertThat(rest.postForEntity("/api/sessions/" + UUID.randomUUID() + "/erase", null, String.class)
                .getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void deleteOfUnknownIdIsStill204() {
        assertThat(delete("/api/sessions/" + UUID.randomUUID()).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(delete("/api/sessions/local-abc").getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void expiredSessionIsInaccessibleEverywhere() {
        String id = createSession();
        expire(id);
        assertThat(get("/api/sessions/" + id).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(patchJson("/api/sessions/" + id, Map.of("situationSummary", "a")).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(postJson("/api/chat/therapy", Map.of("sessionId", id, "message", "hi")).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(postJson("/api/sos/expand", Map.of("sessionId", id, "shortInput", "hi")).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(ai.calls()).isEmpty();
    }

    @Test
    void cleanupJobHardDeletesExpiredSessionsAndTheirMessages() {
        String expired = createSession();
        String active = createSession();
        postJson("/api/chat/legal", Map.of("sessionId", expired, "message", "question"));
        postJson("/api/chat/legal", Map.of("sessionId", active, "message", "question"));
        expire(expired);

        cleanupJob.purgeExpired();

        assertThat(jdbc.queryForObject("select count(*) from sessions where session_id = ?::uuid", Integer.class, expired))
                .isZero();
        assertThat(countMessages(expired)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from sessions where session_id = ?::uuid", Integer.class, active))
                .isOne();
        assertThat(countMessages(active)).isEqualTo(2);
    }

    @Test
    void schemaHasNoIdentifyingColumns() {
        var columns = jdbc.queryForList(
                "select column_name from information_schema.columns where table_name in ('sessions','messages')",
                String.class);
        assertThat(columns).noneMatch(c -> c.matches("(?i).*(ip|agent|device|geo|location|email|phone|name).*"));
    }

    private void expire(String id) {
        jdbc.update("update sessions set expires_at = now() - interval '1 minute' where session_id = ?::uuid", id);
    }

    private int countMessages(String id) {
        return jdbc.queryForObject("select count(*) from messages where session_id = ?::uuid", Integer.class, id);
    }
}
