package com.sanctum.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("sanctum")
public record SanctumProperties(
        Session session,
        Encryption encryption,
        Ai ai,
        RateLimit ratelimit,
        Stego stego,
        Cors cors,
        Crisis crisis) {

    public record Session(int ttlHours, int maxTtlDays) {}

    public record Encryption(String key) {}

    public record Ai(
            String apiKey,
            String baseUrl,
            String model,
            int timeoutSeconds,
            int maxHistoryTurns,
            int maxOutputTokens,
            String promptsLocation,
            String imageModel) {

        public static final String DEFAULT_IMAGE_MODEL = "gemini-3.1-flash-image";

        /** Model used to generate SOS carrier photos. */
        public String imageModelOrDefault() {
            return imageModel == null || imageModel.isBlank() ? DEFAULT_IMAGE_MODEL : imageModel;
        }

        /** Prompts can be pointed at a directory (e.g. {@code file:/etc/sanctum/prompts/}) to edit them without a rebuild. */
        public String promptsLocationOrDefault() {
            return promptsLocation == null || promptsLocation.isBlank() ? "classpath:prompts/" : promptsLocation;
        }
    }

    public record RateLimit(
            int chatPerMinute,
            int expandPerMinute,
            int encodePerMinute,
            int decodePerMinute,
            int sessionCreatePerMinute,
            int generatePerMinute) {}

    public record Stego(long maxPixels, int maxDimension) {}

    public record Cors(List<String> allowedOrigins) {}

    public record Crisis(List<String> resources) {}
}
