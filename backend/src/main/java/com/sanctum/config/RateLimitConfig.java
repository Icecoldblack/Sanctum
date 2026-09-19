package com.sanctum.config;

import com.sanctum.common.exceptions.RateLimitedException;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * In-memory token buckets (Bucket4j). Keys are session IDs or client IPs; they are hashed before
 * use so raw identifiers are never held in the map, and idle buckets are evicted. Nothing here is
 * persisted or logged.
 */
@Component
public class RateLimitConfig {

    public enum Limit { CHAT, EXPAND, ENCODE, DECODE, SESSION_CREATE, GENERATE }

    private static final Duration WINDOW = Duration.ofMinutes(1);
    private static final Duration IDLE_EVICTION = Duration.ofMinutes(5);

    private final Map<Limit, Integer> perMinute;
    private final Map<String, Entry> buckets = new ConcurrentHashMap<>();

    public RateLimitConfig(SanctumProperties properties) {
        SanctumProperties.RateLimit rl = properties.ratelimit();
        this.perMinute = Map.of(
                Limit.CHAT, rl.chatPerMinute(),
                Limit.EXPAND, rl.expandPerMinute(),
                Limit.ENCODE, rl.encodePerMinute(),
                Limit.DECODE, rl.decodePerMinute(),
                Limit.SESSION_CREATE, rl.sessionCreatePerMinute(),
                Limit.GENERATE, rl.generatePerMinute());
    }

    /** Consumes one token, or throws {@link RateLimitedException} carrying a Retry-After in seconds. */
    public void check(Limit limit, String key) {
        Entry entry = buckets.computeIfAbsent(limit.name() + ':' + hash(key), k -> new Entry(newBucket(limit)));
        entry.lastUsedNanos = System.nanoTime();
        ConsumptionProbe probe = entry.bucket.tryConsumeAndReturnRemaining(1);
        if (!probe.isConsumed()) {
            long seconds = Math.max(1, (probe.getNanosToWaitForRefill() + 999_999_999L) / 1_000_000_000L);
            throw new RateLimitedException(seconds);
        }
    }

    @Scheduled(fixedDelay = 60_000)
    public void evictIdle() {
        long cutoff = System.nanoTime() - IDLE_EVICTION.toNanos();
        buckets.values().removeIf(e -> e.lastUsedNanos - cutoff < 0);
    }

    int size() {
        return buckets.size();
    }

    private Bucket newBucket(Limit limit) {
        int capacity = perMinute.get(limit);
        return Bucket.builder()
                .addLimit(l -> l.capacity(capacity).refillGreedy(capacity, WINDOW))
                .build();
    }

    private static String hash(String key) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(key.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest, 0, 16);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static final class Entry {
        final Bucket bucket;
        volatile long lastUsedNanos;

        Entry(Bucket bucket) {
            this.bucket = bucket;
            this.lastUsedNanos = System.nanoTime();
        }
    }
}
