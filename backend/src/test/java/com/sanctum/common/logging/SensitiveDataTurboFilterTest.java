package com.sanctum.common.logging;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class SensitiveDataTurboFilterTest {

    @ParameterizedTest
    @ValueSource(strings = {
        "session 3f2b8c1e-9a4d-4e2b-8f6a-1c2d3e4f5a6b not found",
        "client 192.168.1.20 connected",
        "from 127.0.0.1",
        "ipv6 2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        "ipv6 short fe80::1ff:fe23:4567:890a",
        "loopback ::1",
        "contact someone@example.org",
    })
    void flagsSensitiveContent(String message) {
        assertThat(SensitiveDataTurboFilter.containsSensitive(message)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "POST /api/sessions/{sessionId} -> 200 in 12ms",
        "Started SanctumApplication in 4.512 seconds (process running for 5.1)",
        "Tomcat started on port 8080 (http) with context path '/'",
        "Hibernate ORM core version 6.6.33.Final",
        "Session cleanup removed 3 expired sessions",
        "at 10:00:00 the job ran",
    })
    void allowsOrdinaryOperationalLogs(String message) {
        assertThat(SensitiveDataTurboFilter.containsSensitive(message)).isFalse();
    }
}
