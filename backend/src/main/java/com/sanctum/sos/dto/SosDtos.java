package com.sanctum.sos.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class SosDtos {

    private SosDtos() {}

    public record ExpandRequest(
            @NotBlank @Size(max = 64) String sessionId,
            @NotBlank @Size(max = 1000) String shortInput) {}

    public record ExpandResponse(String expandedMessage) {}

    /** {@code scene} is optional: blank means "surprise me". */
    public record GenerateRequest(
            @NotBlank @Size(max = 64) String sessionId,
            @Size(max = 300) String scene) {}

    /** A generated carrier photo as a PNG data URL. Nothing is stored server-side. */
    public record GenerateResponse(String imageUrl, long byteSize) {}

    /** JSON form of /encode: the PNG as a data URL, so nothing is stored server-side. */
    public record EncodeResponse(String imageUrl, long byteSize) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DecodeResponse(boolean found, String decodedMessage) {
        public static DecodeResponse notFound() {
            return new DecodeResponse(false, null);
        }
    }
}
