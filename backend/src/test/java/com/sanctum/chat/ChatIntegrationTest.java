package com.sanctum.chat;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.sanctum.ai.AiService.AiMessage;
import com.sanctum.ai.AiService.Role;
import com.sanctum.ai.CrisisDetector;
import com.sanctum.support.AbstractIntegrationTest;
import java.time.Instant;
import java.util.List;
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

class ChatIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    CrisisDetector crisisDetector;

    @Test
    void therapyChatUsesTherapyPromptPersistsEncryptedAndShowsInSession() {
        String id = createSession();
        ai.replyWith("I'm here. Would a grounding exercise help?");

        ResponseEntity<String> response = postJson("/api/chat/therapy", Map.of("sessionId", id, "message", "I feel scared tonight"));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = json(response);
        assertThat(body.get("reply").asText()).isEqualTo("I'm here. Would a grounding exercise help?");
        assertThat(Instant.parse(body.get("timestamp").asText())).isBefore(Instant.now().plusSeconds(1));

        assertThat(ai.lastCall().systemPrompt()).contains("Haven").contains("Do not tell them to leave");
        assertThat(ai.lastCall().conversation()).containsExactly(AiMessage.user("I feel scared tonight"));

        List<String> stored = jdbc.queryForList(
                "select content from messages where session_id = ?::uuid order by id", String.class, id);
        assertThat(stored).hasSize(2).allMatch(c -> c.startsWith("v1:"))
                .noneMatch(c -> c.contains("scared")).noneMatch(c -> c.contains("grounding"));

        JsonNode conversations = json(get("/api/sessions/" + id)).get("conversations");
        assertThat(conversations.get("therapy")).hasSize(2);
        assertThat(conversations.get("therapy").get(0).get("role").asText()).isEqualTo("user");
        assertThat(conversations.get("therapy").get(0).get("content").asText()).isEqualTo("I feel scared tonight");
        assertThat(conversations.get("therapy").get(1).get("role").asText()).isEqualTo("assistant");
        assertThat(conversations.get("therapy").get(1).get("timestamp").asText()).isEqualTo(body.get("timestamp").asText());
        assertThat(conversations.get("legal")).isEmpty();
    }

    @Test
    void legalChatUsesLegalPromptAndSeparateHistory() {
        String id = createSession();
        postJson("/api/chat/therapy", Map.of("sessionId", id, "message", "therapy message"));
        ResponseEntity<String> response = postJson("/api/chat/legal", Map.of("sessionId", id, "message", "What is a protective order?"));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(ai.lastCall().systemPrompt()).contains("Compass").contains("not legal advice");
        assertThat(ai.lastCall().conversation()).containsExactly(AiMessage.user("What is a protective order?"));
        assertThat(json(get("/api/sessions/" + id)).get("conversations").get("legal")).hasSize(2);
    }

    @Test
    void sendsPriorTurnsAsContextCappedAtMaxHistoryTurns() {
        String id = createSession();
        for (int i = 1; i <= 5; i++) {
            ai.replyWith("reply " + i);
            postJson("/api/chat/therapy", Map.of("sessionId", id, "message", "message " + i));
        }
        // max-history-turns is 3 in the test profile: 3 prior turns (6 messages) plus the new message.
        List<AiMessage> sent = ai.lastCall().conversation();
        assertThat(sent).hasSize(7);
        assertThat(sent.get(0)).isEqualTo(AiMessage.user("message 2"));
        assertThat(sent.get(1)).isEqualTo(new AiMessage(Role.ASSISTANT, "reply 2"));
        assertThat(sent.get(6)).isEqualTo(AiMessage.user("message 5"));
    }

    @Test
    void crisisResourcesArePrependedRegardlessOfModelReply() {
        String id = createSession();
        ai.replyWith("Tell me more.");
        JsonNode body = json(postJson("/api/chat/therapy", Map.of("sessionId", id, "message", "he has a gun and I'm hiding")));
        assertThat(body.get("reply").asText())
                .startsWith(crisisDetector.resourceBlock())
                .contains("911")
                .endsWith("Tell me more.");

        JsonNode ordinary = json(postJson("/api/chat/legal", Map.of("sessionId", id, "message", "How do custody hearings work?")));
        assertThat(ordinary.get("reply").asText()).isEqualTo("Tell me more.");
    }

    @Test
    void aiFailureReturns503AndStoresNothing() {
        String id = createSession();
        ai.failNextCalls();
        ResponseEntity<String> response = postJson("/api/chat/therapy", Map.of("sessionId", id, "message", "hello"));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        JsonNode body = json(response);
        assertThat(body.get("code").asText()).isEqualTo("ai_unavailable");
        assertThat(body.has("reply")).isFalse();
        assertThat(jdbc.queryForObject("select count(*) from messages where session_id = ?::uuid", Integer.class, id)).isZero();
    }

    @Test
    void crisisMessageWithAiFailureStillFailsRatherThanFabricating() {
        String id = createSession();
        ai.failNextCalls();
        ResponseEntity<String> response = postJson("/api/chat/therapy", Map.of("sessionId", id, "message", "I want to kill myself"));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(json(response).has("reply")).isFalse();
    }

    @Test
    void sessionDeletedDuringModelCallStoresNothing() {
        String id = createSession();
        ai.beforeReply(() -> delete("/api/sessions/" + id));
        ResponseEntity<String> response = postJson("/api/chat/therapy", Map.of("sessionId", id, "message", "hello"));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(jdbc.queryForObject("select count(*) from messages where session_id = ?::uuid", Integer.class, id)).isZero();
    }

    @Test
    void chatActivitySlidesExpiry() {
        String id = createSession();
        jdbc.update("update sessions set expires_at = now() + interval '5 minutes' where session_id = ?::uuid", id);
        postJson("/api/chat/therapy", Map.of("sessionId", id, "message", "hi"));
        Instant expires = Instant.parse(json(get("/api/sessions/" + id)).get("expiresAt").asText());
        assertThat(expires).isAfter(Instant.now().plusSeconds(23 * 3600));
    }

    @Test
    void validatesRequests() {
        String id = createSession();
        assertBadRequest(postJson("/api/chat/therapy", Map.of("sessionId", id, "message", "   ")), "validation_failed");
        assertBadRequest(postJson("/api/chat/therapy", Map.of("sessionId", id)), "validation_failed");
        assertBadRequest(postJson("/api/chat/legal", Map.of("sessionId", id, "message", "x".repeat(4001))), "validation_failed");
        assertThat(postJson("/api/chat/legal", Map.of("sessionId", id, "message", "x".repeat(4000))).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<String> malformed = rest.exchange("/api/chat/therapy", HttpMethod.POST,
                new HttpEntity<>("{not json", headers), String.class);
        assertBadRequest(malformed, "malformed_request");

        ResponseEntity<String> unknown = postJson("/api/chat/therapy", Map.of("sessionId", UUID.randomUUID().toString(), "message", "hi"));
        assertThat(unknown.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(postJson("/api/chat/other", Map.of("sessionId", id, "message", "hi")).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void rateLimitsChatPerSession() {
        String id = createSession();
        for (int i = 0; i < 20; i++) {
            assertThat(postJson("/api/chat/therapy", Map.of("sessionId", id, "message", "m" + i)).getStatusCode())
                    .isEqualTo(HttpStatus.OK);
        }
        ResponseEntity<String> limited = postJson("/api/chat/legal", Map.of("sessionId", id, "message", "one more"));
        assertThat(limited.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(json(limited).get("code").asText()).isEqualTo("rate_limited");
        assertThat(Long.parseLong(limited.getHeaders().getFirst(HttpHeaders.RETRY_AFTER))).isBetween(1L, 60L);

        // Another session is unaffected.
        String other = createSession();
        assertThat(postJson("/api/chat/therapy", Map.of("sessionId", other, "message", "hi")).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    private static void assertBadRequest(ResponseEntity<String> response, String code) {
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(json(response).get("code").asText()).isEqualTo(code);
    }
}
