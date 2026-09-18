package com.sanctum.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Boots the full application on a random port against a real Postgres (Testcontainers) and talks
 * to it over HTTP. Only the model provider is stubbed.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(StubAiService.Config.class)
public abstract class AbstractIntegrationTest {

    /** One container for the whole test run. */
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    protected static final ObjectMapper JSON = new ObjectMapper();

    @Autowired
    protected TestRestTemplate rest;

    @Autowired
    protected JdbcTemplate jdbc;

    @Autowired
    protected StubAiService ai;

    @BeforeEach
    void resetStub() {
        ai.reset();
    }

    // --- HTTP helpers -------------------------------------------------------------------------

    protected ResponseEntity<String> postJson(String path, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return rest.exchange(path, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
    }

    protected ResponseEntity<String> patchJson(String path, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return rest.exchange(path, HttpMethod.PATCH, new HttpEntity<>(body, headers), String.class);
    }

    protected ResponseEntity<String> get(String path) {
        return rest.getForEntity(path, String.class);
    }

    protected ResponseEntity<String> delete(String path) {
        return rest.exchange(path, HttpMethod.DELETE, HttpEntity.EMPTY, String.class);
    }

    protected <T> ResponseEntity<T> multipart(String path, MultiValueMap<String, Object> parts, String accept, Class<T> type) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        if (accept != null) {
            headers.set(HttpHeaders.ACCEPT, accept);
        }
        return rest.exchange(path, HttpMethod.POST, new HttpEntity<>(parts, headers), type);
    }

    protected static MultiValueMap<String, Object> parts(Map<String, Object> values) {
        MultiValueMap<String, Object> map = new LinkedMultiValueMap<>();
        values.forEach(map::add);
        return map;
    }

    /** A file part. The filename is deliberately misleading in some tests: only magic bytes count. */
    protected static ByteArrayResource file(byte[] bytes, String filename) {
        return new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        };
    }

    protected static JsonNode json(ResponseEntity<String> response) {
        try {
            return JSON.readTree(response.getBody());
        } catch (IOException e) {
            throw new IllegalStateException("Response is not JSON: " + response.getBody(), e);
        }
    }

    protected String createSession() {
        ResponseEntity<String> response = rest.postForEntity("/api/sessions", null, String.class);
        return json(response).get("sessionId").asText();
    }

    protected static byte[] png(java.awt.image.BufferedImage image) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            javax.imageio.ImageIO.write(image, "png", out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }
}
