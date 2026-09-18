package com.sanctum.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanctum.TestProperties;
import com.sanctum.ai.AiService.AiMessage;
import com.sanctum.common.exceptions.ApiException;
import com.sanctum.config.AiClientConfig;
import com.sanctum.config.SanctumProperties;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** Exercises the real HTTP path against a local fake of the Gemini generateContent endpoint. */
class GeminiAiServiceTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    private HttpServer server;
    private final AtomicReference<String> requestBody = new AtomicReference<>();
    private final AtomicReference<String> requestPath = new AtomicReference<>();
    private final AtomicReference<String> apiKeyHeader = new AtomicReference<>();
    private final AtomicReference<String> contentLength = new AtomicReference<>();
    private volatile int status = 200;
    private volatile String responseBody = "{}";
    private volatile long delayMillis = 0;
    private volatile int dropConnections = 0;
    private final AtomicInteger requests = new AtomicInteger();

    @BeforeEach
    void start() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            requestPath.set(exchange.getRequestURI().getPath());
            apiKeyHeader.set(exchange.getRequestHeaders().getFirst("x-goog-api-key"));
            contentLength.set(exchange.getRequestHeaders().getFirst("Content-Length"));
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            if (requests.incrementAndGet() <= dropConnections) {
                // Close without any response, like a stale keep-alive connection.
                exchange.close();
                return;
            }
            if (delayMillis > 0) {
                try {
                    Thread.sleep(delayMillis);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            byte[] bytes = responseBody.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
    }

    @AfterEach
    void stop() {
        server.stop(0);
    }

    private GeminiAiService service(String apiKey, int timeoutSeconds) {
        SanctumProperties props = TestProperties.withAi(
                apiKey, "http://127.0.0.1:" + server.getAddress().getPort(), timeoutSeconds);
        return new GeminiAiService(new AiClientConfig().aiRestClient(props), props);
    }

    @Test
    void sendsSystemInstructionHistoryAndKeyAndReturnsText() throws IOException {
        responseBody = """
                {"candidates":[{"content":{"role":"model","parts":[
                  {"text":"thinking...","thought":true},
                  {"text":"You are not alone. "},{"text":"Let's breathe together."}]},
                  "finishReason":"STOP"}]}
                """;
        String reply = service("secret-key", 5).generate("SYSTEM PROMPT", List.of(
                AiMessage.user("first"), AiMessage.assistant("answer"), AiMessage.user("second")));

        assertThat(reply).isEqualTo("You are not alone. Let's breathe together.");
        assertThat(requestPath.get()).isEqualTo("/v1beta/models/gemini-test-model:generateContent");
        assertThat(apiKeyHeader.get()).isEqualTo("secret-key");
        // A fixed-length body, not chunked: some proxies and servers reject chunked requests.
        assertThat(contentLength.get()).isEqualTo(Integer.toString(requestBody.get().getBytes(StandardCharsets.UTF_8).length));

        JsonNode body = JSON.readTree(requestBody.get());
        assertThat(body.at("/systemInstruction/parts/0/text").asText()).isEqualTo("SYSTEM PROMPT");
        assertThat(body.at("/contents/0/role").asText()).isEqualTo("user");
        assertThat(body.at("/contents/1/role").asText()).isEqualTo("model");
        assertThat(body.at("/contents/1/parts/0/text").asText()).isEqualTo("answer");
        assertThat(body.at("/contents/2/parts/0/text").asText()).isEqualTo("second");
        assertThat(body.at("/generationConfig/maxOutputTokens").asInt()).isEqualTo(1024);
    }

    @Test
    void httpErrorIsUnavailableNotFabricated() {
        status = 500;
        responseBody = "{\"error\":{\"message\":\"boom\"}}";
        assertUnavailable(() -> service("k", 5).generate("s", List.of(AiMessage.user("hi"))));
        status = 429;
        assertUnavailable(() -> service("k", 5).generate("s", List.of(AiMessage.user("hi"))));
    }

    @Test
    void blockedOrEmptyResponseIsUnavailable() {
        responseBody = "{\"promptFeedback\":{\"blockReason\":\"SAFETY\"}}";
        assertUnavailable(() -> service("k", 5).generate("s", List.of(AiMessage.user("hi"))));
        responseBody = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"   \"}]},\"finishReason\":\"MAX_TOKENS\"}]}";
        assertUnavailable(() -> service("k", 5).generate("s", List.of(AiMessage.user("hi"))));
        responseBody = "";
        assertUnavailable(() -> service("k", 5).generate("s", List.of(AiMessage.user("hi"))));
    }

    @Test
    void timeoutIsUnavailableAndNotRetried() {
        delayMillis = 2500;
        responseBody = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"late\"}]}}]}";
        assertUnavailable(() -> service("k", 1).generate("s", List.of(AiMessage.user("hi"))));
        assertThat(requests.get()).isEqualTo(1);
    }

    @Test
    void droppedConnectionIsRetriedOnce() {
        dropConnections = 1;
        responseBody = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"second try\"}]}}]}";
        assertThat(service("k", 5).generate("s", List.of(AiMessage.user("hi")))).isEqualTo("second try");
        assertThat(requests.get()).isEqualTo(2);
    }

    @Test
    void repeatedlyDroppedConnectionIsUnavailable() {
        dropConnections = 5;
        responseBody = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"never\"}]}}]}";
        assertUnavailable(() -> service("k", 5).generate("s", List.of(AiMessage.user("hi"))));
        assertThat(requests.get()).isEqualTo(2);
    }

    @Test
    void unreachableProviderIsUnavailable() {
        SanctumProperties props = TestProperties.withAi("k", "http://127.0.0.1:1", 2);
        GeminiAiService unreachable = new GeminiAiService(new AiClientConfig().aiRestClient(props), props);
        assertUnavailable(() -> unreachable.generate("s", List.of(AiMessage.user("hi"))));
    }

    @Test
    void missingKeyIsUnavailableWithoutCallingProvider() {
        assertUnavailable(() -> service("", 5).generate("s", List.of(AiMessage.user("hi"))));
        assertUnavailable(() -> service(null, 5).generate("s", List.of(AiMessage.user("hi"))));
        assertThat(requestPath.get()).isNull();
    }

    private static void assertUnavailable(org.assertj.core.api.ThrowableAssert.ThrowingCallable call) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ApiException.class, e -> {
            assertThat(e.getStatus().value()).isEqualTo(503);
            assertThat(e.getCode()).isEqualTo("ai_unavailable");
        });
    }
}
