package com.sanctum;

import static org.assertj.core.api.Assertions.assertThat;

import com.sanctum.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;

@TestPropertySource(properties = {
    "sanctum.ratelimit.session-create-per-minute=5",
    "sanctum.ratelimit.decode-per-minute=3"
})
class SessionCreateRateLimitIntegrationTest extends AbstractIntegrationTest {

    @Test
    void sessionCreationIsLimitedPerClient() {
        for (int i = 0; i < 5; i++) {
            assertThat(rest.postForEntity("/api/sessions", null, String.class).getStatusCode()).isEqualTo(HttpStatus.CREATED);
        }
        ResponseEntity<String> limited = rest.postForEntity("/api/sessions", null, String.class);
        assertThat(limited.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(limited.getHeaders().getFirst(HttpHeaders.RETRY_AFTER)).isNotBlank();
    }

    @Test
    void decodeIsLimitedPerClient() {
        byte[] plain = png(new java.awt.image.BufferedImage(8, 8, java.awt.image.BufferedImage.TYPE_INT_RGB));
        for (int i = 0; i < 3; i++) {
            assertThat(multipart("/api/sos/decode", parts(java.util.Map.of("image", file(plain, "a.png"))), null, String.class)
                    .getStatusCode()).isEqualTo(HttpStatus.OK);
        }
        assertThat(multipart("/api/sos/decode", parts(java.util.Map.of("image", file(plain, "a.png"))), null, String.class)
                .getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }
}
