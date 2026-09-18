package com.sanctum.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/** Chat wire types. The frontend reads {@code reply}; ContractTest pins the names. */
public final class ChatDtos {

    private ChatDtos() {}

    public record ChatRequest(
            @NotBlank @Size(max = 64) String sessionId,
            @NotBlank @Size(max = 4000) String message) {}

    public record ChatResponse(String reply, Instant timestamp) {}
}
