package com.sanctum.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sanctum.TestProperties;
import com.sanctum.common.exceptions.RateLimitedException;
import com.sanctum.config.RateLimitConfig.Limit;
import org.junit.jupiter.api.Test;

class RateLimitConfigTest {

    @Test
    void allowsUpToLimitThenRejectsWithRetryAfter() {
        RateLimitConfig limiter = new RateLimitConfig(TestProperties.withRateLimit(3));
        for (int i = 0; i < 3; i++) {
            limiter.check(Limit.CHAT, "session-a");
        }
        assertThatThrownBy(() -> limiter.check(Limit.CHAT, "session-a"))
                .isInstanceOfSatisfying(RateLimitedException.class, e -> {
                    assertThat(e.getStatus().value()).isEqualTo(429);
                    assertThat(e.getRetryAfterSeconds()).isBetween(1L, 60L);
                });
    }

    @Test
    void bucketsAreIndependentPerKeyAndPerLimit() {
        RateLimitConfig limiter = new RateLimitConfig(TestProperties.withRateLimit(1));
        limiter.check(Limit.CHAT, "session-a");
        limiter.check(Limit.CHAT, "session-b");
        limiter.check(Limit.ENCODE, "session-a");
        assertThatThrownBy(() -> limiter.check(Limit.CHAT, "session-a")).isInstanceOf(RateLimitedException.class);
    }

    @Test
    void evictsIdleBucketsButKeepsActiveOnes() {
        RateLimitConfig limiter = new RateLimitConfig(TestProperties.withRateLimit(5));
        limiter.check(Limit.DECODE, "127.0.0.1");
        assertThat(limiter.size()).isEqualTo(1);
        limiter.evictIdle();
        assertThat(limiter.size()).isEqualTo(1);
    }
}
