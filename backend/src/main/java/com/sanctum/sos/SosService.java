package com.sanctum.sos;

import com.sanctum.ai.AiService;
import com.sanctum.ai.AiService.AiMessage;
import com.sanctum.ai.PromptLibrary;
import com.sanctum.common.exceptions.Errors;
import com.sanctum.config.RateLimitConfig;
import com.sanctum.config.RateLimitConfig.Limit;
import com.sanctum.session.SessionEntity;
import com.sanctum.session.SessionService;
import com.sanctum.sos.dto.SosDtos.DecodeResponse;
import com.sanctum.sos.steganography.SteganographyService;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.List;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

/** SOS messages are never stored: text goes in, an image comes out, nothing is persisted. */
@Service
public class SosService {

    public static final int MAX_MESSAGE_CHARS = 4000;

    private final SessionService sessionService;
    private final SteganographyService steganography;
    private final AiService ai;
    private final PromptLibrary prompts;
    private final RateLimitConfig rateLimiter;
    private final byte[] defaultCarrier;

    public SosService(
            SessionService sessionService,
            SteganographyService steganography,
            AiService ai,
            PromptLibrary prompts,
            RateLimitConfig rateLimiter) {
        this.sessionService = sessionService;
        this.steganography = steganography;
        this.ai = ai;
        this.prompts = prompts;
        this.rateLimiter = rateLimiter;
        this.defaultCarrier = loadDefaultCarrier();
    }

    public String expand(String sessionId, String shortInput) {
        SessionEntity session = sessionService.requireActive(sessionId);
        rateLimiter.check(Limit.EXPAND, session.getSessionId().toString());
        return ai.generate(prompts.get(PromptLibrary.SOS_EXPAND), List.of(AiMessage.user(shortInput.trim())));
    }

    /** @param carrierPng the uploaded carrier, or null to use the bundled default */
    public byte[] encode(String sessionId, String message, byte[] carrierPng) {
        SessionEntity session = sessionService.requireActive(sessionId);
        rateLimiter.check(Limit.ENCODE, session.getSessionId().toString());
        if (message == null || message.isBlank()) {
            throw Errors.badRequest("message must not be blank");
        }
        if (message.length() > MAX_MESSAGE_CHARS) {
            throw Errors.badRequest("message size must be between 1 and " + MAX_MESSAGE_CHARS);
        }
        byte[] carrier = carrierPng == null || carrierPng.length == 0 ? defaultCarrier : carrierPng;
        return steganography.embed(carrier, message);
    }

    /** Decoding needs no session: the recipient of an image usually has none. Limited per client IP. */
    public DecodeResponse decode(byte[] png, String clientKey) {
        rateLimiter.check(Limit.DECODE, clientKey);
        return steganography.extract(png)
                .map(message -> new DecodeResponse(true, message))
                .orElseGet(DecodeResponse::notFound);
    }

    private static byte[] loadDefaultCarrier() {
        try (InputStream in = new ClassPathResource("carriers/default-carrier.png").getInputStream()) {
            return in.readAllBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Default carrier image is missing", e);
        }
    }
}
