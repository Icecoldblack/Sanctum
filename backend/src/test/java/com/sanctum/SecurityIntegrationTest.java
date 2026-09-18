package com.sanctum;

import static org.assertj.core.api.Assertions.assertThat;

import com.sanctum.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class SecurityIntegrationTest extends AbstractIntegrationTest {

    @Test
    void apiResponsesCarrySecurityHeaders() {
        ResponseEntity<String> response = rest.postForEntity("/api/sessions", null, String.class);
        HttpHeaders headers = response.getHeaders();
        assertThat(headers.getFirst("X-Content-Type-Options")).isEqualTo("nosniff");
        assertThat(headers.getFirst("Referrer-Policy")).isEqualTo("no-referrer");
        assertThat(headers.getFirst("Content-Security-Policy")).contains("default-src 'none'").contains("frame-ancestors 'none'");
        assertThat(headers.getFirst("X-Frame-Options")).isEqualTo("DENY");
        assertThat(headers.getFirst("Cache-Control")).contains("no-store");
        assertThat(headers.getFirst("X-Request-Id")).matches("[0-9a-f]{16}");
        assertThat(headers.containsKey("Set-Cookie")).isFalse();
    }

    @Test
    void healthIsOpenEverythingElseInActuatorIsClosed() {
        ResponseEntity<String> health = get("/actuator/health");
        assertThat(health.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(json(health).get("status").asText()).isEqualTo("UP");
        assertThat(json(health).has("components")).isFalse();
        assertThat(get("/actuator/health/liveness").getStatusCode()).isEqualTo(HttpStatus.OK);

        for (String path : new String[] {"/actuator", "/actuator/env", "/actuator/beans", "/actuator/metrics",
                "/actuator/configprops", "/actuator/heapdump", "/actuator/loggers"}) {
            assertThat(get(path).getStatusCode()).as(path).isEqualTo(HttpStatus.FORBIDDEN);
        }
    }

    @Test
    void pathsOutsideTheApiAreClosed() {
        ResponseEntity<String> response = get("/admin");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(json(response).get("code").asText()).isEqualTo("forbidden");
        assertThat(get("/api/unknown").getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void corsAllowsTheFrontendOriginWithoutCredentials() {
        ResponseEntity<String> preflight = preflight("http://localhost:5173", "PATCH");
        assertThat(preflight.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(preflight.getHeaders().getAccessControlAllowOrigin()).isEqualTo("http://localhost:5173");
        assertThat(preflight.getHeaders().getAccessControlAllowMethods()).contains(HttpMethod.PATCH, HttpMethod.DELETE);
        assertThat(preflight.getHeaders().getAccessControlAllowCredentials()).isFalse();

        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin("http://localhost:5173");
        ResponseEntity<String> actual = rest.exchange("/api/sessions", HttpMethod.POST, new HttpEntity<>(headers), String.class);
        assertThat(actual.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(actual.getHeaders().getAccessControlAllowOrigin()).isEqualTo("http://localhost:5173");
    }

    @Test
    void corsRejectsOtherOrigins() {
        assertThat(preflight("https://evil.example", "POST").getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin("https://evil.example");
        ResponseEntity<String> actual = rest.exchange("/api/sessions", HttpMethod.POST, new HttpEntity<>(headers), String.class);
        assertThat(actual.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(actual.getHeaders().getAccessControlAllowOrigin()).isNull();
    }

    @Test
    void errorsNeverLeakInternals() {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_TYPE, "application/json");
        ResponseEntity<String> response = rest.exchange("/api/chat/therapy", HttpMethod.POST,
                new HttpEntity<>("{\"sessionId\": [1,2,3], \"message\": {}}", headers), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).doesNotContain("Exception").doesNotContain("at com.").doesNotContain("jackson");
    }

    private ResponseEntity<String> preflight(String origin, String method) {
        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin(origin);
        headers.setAccessControlRequestMethod(HttpMethod.valueOf(method));
        headers.set(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "content-type");
        return rest.exchange("/api/sessions", HttpMethod.OPTIONS, new HttpEntity<>(headers), String.class);
    }
}
