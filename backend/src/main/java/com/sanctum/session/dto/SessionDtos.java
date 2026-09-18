package com.sanctum.session.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

/**
 * Session wire types. Field names are a contract with the frontend: {@code sessionId}, never
 * {@code id}. ContractTest pins them.
 */
public final class SessionDtos {

    private SessionDtos() {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record SessionResponse(
            String sessionId,
            Instant createdAt,
            Instant expiresAt,
            String situationSummary,
            Conversations conversations) {}

    public record Conversations(List<ChatMessage> therapy, List<ChatMessage> legal) {}

    public record ChatMessage(String role, String content, Instant timestamp) {}

    /** PATCH body. A missing field is left unchanged; an empty string clears it. */
    public record UpdateSessionRequest(@Size(max = 4000) String situationSummary) {}
}
