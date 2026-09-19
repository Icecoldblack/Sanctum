package com.sanctum.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanctum.common.exceptions.Errors;
import com.sanctum.config.SanctumProperties;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import javax.imageio.ImageIO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Gemini image model via {@code generateContent} with an image-only response. Gemini returns JPEG;
 * the pixels are re-encoded as a plain PNG (lossless, so the hidden message survives, and with no
 * metadata). Logs carry only the failure type and HTTP status, never prompts or images.
 */
@Service
public class GeminiImageGenerator implements ImageGenerator {

    private static final Logger log = LoggerFactory.getLogger(GeminiImageGenerator.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    private final RestClient restClient;
    private final SanctumProperties.Ai config;

    public GeminiImageGenerator(RestClient aiRestClient, SanctumProperties properties) {
        this.restClient = aiRestClient;
        this.config = properties.ai();
    }

    @Override
    public byte[] generatePng(String description) {
        if (config.apiKey() == null || config.apiKey().isBlank()) {
            log.warn("Image generation skipped: GEMINI_API_KEY is not configured");
            throw Errors.aiUnavailable();
        }
        Map<String, Object> request = Map.of(
                "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", description)))),
                "generationConfig", Map.of(
                        "responseModalities", List.of("IMAGE"),
                        "imageConfig", Map.of("aspectRatio", "4:3")));
        byte[] body;
        try {
            body = JSON.writeValueAsBytes(request);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not serialize image request", e);
        }

        JsonNode response;
        try {
            response = restClient.post()
                    .uri("/v1beta/models/{model}:generateContent", config.imageModelOrDefault())
                    .header("x-goog-api-key", config.apiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException e) {
            log.warn("Image provider returned HTTP {}", e.getStatusCode().value());
            throw Errors.aiUnavailable();
        } catch (RestClientException e) {
            log.warn("Image provider call failed: {}", e.getClass().getSimpleName());
            throw Errors.aiUnavailable();
        }
        return toPng(extractImage(response));
    }

    private static byte[] extractImage(JsonNode response) {
        if (response != null) {
            for (JsonNode part : response.path("candidates").path(0).path("content").path("parts")) {
                String data = part.path("inlineData").path("data").asText("");
                if (!data.isEmpty()) {
                    return Base64.getDecoder().decode(data);
                }
            }
        }
        String finishReason = response == null ? "no body" : response.path("candidates").path(0).path("finishReason").asText("none");
        log.warn("Image provider returned no image (finishReason={})", finishReason);
        throw Errors.aiUnavailable();
    }

    static byte[] toPng(byte[] encoded) {
        try {
            BufferedImage source = ImageIO.read(new ByteArrayInputStream(encoded));
            if (source == null) {
                log.warn("Image provider returned an unreadable image");
                throw Errors.aiUnavailable();
            }
            // Plain RGB copy: drops any colour profile or metadata the source carried.
            BufferedImage rgb = new BufferedImage(source.getWidth(), source.getHeight(), BufferedImage.TYPE_INT_RGB);
            rgb.createGraphics().drawImage(source, 0, 0, null);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(rgb, "png", out);
            return out.toByteArray();
        } catch (IOException e) {
            log.warn("Could not convert generated image: {}", e.getClass().getSimpleName());
            throw Errors.aiUnavailable();
        }
    }
}
