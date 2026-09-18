package com.sanctum.ai;

import com.sanctum.config.SanctumProperties;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

/**
 * System prompts live in text files, not Java literals. They are read on each use, so when
 * {@code sanctum.ai.prompts-location} points at a directory ({@code file:/path/}) edits apply
 * without a restart.
 */
@Component
public class PromptLibrary {

    public static final String THERAPY = "therapy-system";
    public static final String LEGAL = "legal-system";
    public static final String SOS_EXPAND = "sos-expand";

    private final ResourceLoader resourceLoader;
    private final String location;

    public PromptLibrary(ResourceLoader resourceLoader, SanctumProperties properties) {
        this.resourceLoader = resourceLoader;
        String configured = properties.ai().promptsLocationOrDefault();
        this.location = configured.endsWith("/") ? configured : configured + "/";
        // Fail at startup, not on the first chat, if a prompt is missing.
        get(THERAPY);
        get(LEGAL);
        get(SOS_EXPAND);
    }

    public String get(String name) {
        Resource resource = resourceLoader.getResource(location + name + ".txt");
        try (InputStream in = resource.getInputStream()) {
            String prompt = new String(in.readAllBytes(), StandardCharsets.UTF_8).trim();
            if (prompt.isEmpty()) {
                throw new IllegalStateException("Prompt is empty: " + name);
            }
            return prompt;
        } catch (IOException e) {
            throw new UncheckedIOException("Prompt not found: " + name, e);
        }
    }
}
