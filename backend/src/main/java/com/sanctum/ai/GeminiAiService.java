package com.sanctum.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanctum.common.exceptions.Errors;
import com.sanctum.config.SanctumProperties;
import java.net.SocketTimeoutException;
import java.net.http.HttpTimeoutException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Google Gemini via the REST {@code generateContent} endpoint. The API key comes from
 * {@code GEMINI_API_KEY}. Failures surface as {@code ai_unavailable}; no reply is ever invented.
 * Logs carry only the failure type and HTTP status, never prompts or model output.
 */
@Service
public class GeminiAiService implements AiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiService.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    private final RestClient restClient;
    private final SanctumProperties.Ai config;

    public GeminiAiService(RestClient aiRestClient, SanctumProperties properties) {
        this.restClient = aiRestClient;
        this.config = properties.ai();
    }

    @Override
    public String generate(String systemPrompt, List<AiMessage> conversation) {
        if (config.apiKey() == null || config.apiKey().isBlank()) {
            log.warn("AI call skipped: GEMINI_API_KEY is not configured");
            throw Errors.aiUnavailable();
        }
        byte[] body;
        try {
            // Serialized up front so the request carries a Content-Length instead of a chunked body.
            body = JSON.writeValueAsBytes(requestBody(systemPrompt, conversation));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not serialize AI request", e);
        }
        return extractText(post(body, true));
    }

    private JsonNode post(byte[] body, boolean mayRetry) {
        try {
            return restClient.post()
                    .uri("/v1beta/models/{model}:generateContent", config.model())
                    .header("x-goog-api-key", config.apiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException e) {
            log.warn("AI provider returned HTTP {}", e.getStatusCode().value());
            throw Errors.aiUnavailable();
        } catch (ResourceAccessException e) {
            // A pooled keep-alive connection closed by the far side fails before any response.
            // Retry that once on a fresh connection. Never retry timeouts: the time budget is spent.
            if (mayRetry && !isTimeout(e)) {
                log.info("AI provider connection failed ({}); retrying once", rootCauseType(e));
                return post(body, false);
            }
            log.warn("AI provider call failed: {}", rootCauseType(e));
            throw Errors.aiUnavailable();
        } catch (RestClientException e) {
            log.warn("AI provider call failed: {}", rootCauseType(e));
            throw Errors.aiUnavailable();
        }
    }

    private static boolean isTimeout(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            if (t instanceof HttpTimeoutException || t instanceof SocketTimeoutException) {
                return true;
            }
        }
        return false;
    }

    private Map<String, Object> requestBody(String systemPrompt, List<AiMessage> conversation) {
        List<Map<String, Object>> contents = new ArrayList<>();
        for (AiMessage message : conversation) {
            contents.add(Map.of(
                    "role", message.role() == Role.USER ? "user" : "model",
                    "parts", List.of(Map.of("text", message.content()))));
        }
        return Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
                "contents", contents,
                "generationConfig", Map.of("maxOutputTokens", config.maxOutputTokens()));
    }

    private static String extractText(JsonNode response) {
        if (response == null) {
            log.warn("AI provider returned an empty body");
            throw Errors.aiUnavailable();
        }
        JsonNode candidate = response.path("candidates").path(0);
        StringBuilder text = new StringBuilder();
        for (JsonNode part : candidate.path("content").path("parts")) {
            // Skip thought summaries; only the answer is returned to the user.
            if (part.path("thought").asBoolean(false)) {
                continue;
            }
            text.append(part.path("text").asText(""));
        }
        String reply = text.toString().trim();
        if (reply.isEmpty()) {
            String blockReason = response.path("promptFeedback").path("blockReason").asText("");
            String finishReason = candidate.path("finishReason").asText("");
            log.warn("AI provider returned no text (finishReason={}, blockReason={})",
                    finishReason.isEmpty() ? "none" : finishReason, blockReason.isEmpty() ? "none" : blockReason);
            throw Errors.aiUnavailable();
        }
        return reply;
    }

    private static String rootCauseType(Throwable e) {
        Throwable root = e;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        return root.getClass().getSimpleName();
    }
}
