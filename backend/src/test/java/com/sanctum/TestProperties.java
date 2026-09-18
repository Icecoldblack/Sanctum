package com.sanctum;

import com.sanctum.config.SanctumProperties;
import java.util.List;

/** Properties for unit tests that do not start Spring. */
public final class TestProperties {

    /** A throwaway test key (32 zero-to-31 bytes). Never used outside tests. */
    public static final String TEST_KEY = "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=";

    private TestProperties() {}

    public static SanctumProperties defaults() {
        return withAi("test-key", "http://localhost:1", 30);
    }

    public static SanctumProperties withKey(String key) {
        return build(key, "test-key", "http://localhost:1", 30, 5, 16_777_216L, 8192);
    }

    public static SanctumProperties withAi(String apiKey, String baseUrl, int timeoutSeconds) {
        return build(TEST_KEY, apiKey, baseUrl, timeoutSeconds, 5, 16_777_216L, 8192);
    }

    public static SanctumProperties withRateLimit(int perMinute) {
        return build(TEST_KEY, "test-key", "http://localhost:1", 30, perMinute, 16_777_216L, 8192);
    }

    public static SanctumProperties withStegoLimits(long maxPixels, int maxDimension) {
        return build(TEST_KEY, "test-key", "http://localhost:1", 30, 5, maxPixels, maxDimension);
    }

    private static SanctumProperties build(
            String key, String apiKey, String baseUrl, int timeoutSeconds, int perMinute, long maxPixels, int maxDim) {
        return new SanctumProperties(
                new SanctumProperties.Session(24, 7),
                new SanctumProperties.Encryption(key),
                new SanctumProperties.Ai(apiKey, baseUrl, "gemini-test-model", timeoutSeconds, 20, 1024, null),
                new SanctumProperties.RateLimit(perMinute, perMinute, perMinute, perMinute, perMinute),
                new SanctumProperties.Stego(maxPixels, maxDim),
                new SanctumProperties.Cors(List.of("http://localhost:5173")),
                new SanctumProperties.Crisis(List.of("Call 911.", "Hotline 1-800-799-7233.")));
    }
}
