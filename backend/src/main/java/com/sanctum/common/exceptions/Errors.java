package com.sanctum.common.exceptions;

import org.springframework.http.HttpStatus;

/** Factory for the service's client-facing error conditions. */
public final class Errors {

    private Errors() {}

    public static ApiException sessionNotFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "session_not_found", "Session not found or expired.");
    }

    /** The model call failed. The service never substitutes a fabricated reply. */
    public static ApiException aiUnavailable() {
        return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "ai_unavailable",
                "The assistant is unavailable right now. Nothing was generated. Please try again.");
    }

    public static ApiException unsupportedImage() {
        return new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "unsupported_image",
                "Only PNG images are supported.");
    }

    public static ApiException invalidImage() {
        return new ApiException(HttpStatus.BAD_REQUEST, "invalid_image", "The image could not be read.");
    }

    public static ApiException imageTooLarge() {
        return new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "image_too_large",
                "The image dimensions are too large.");
    }

    public static ApiException messageTooLarge(long capacityBytes, long requiredBytes) {
        return new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "message_too_large",
                "The message does not fit in this image (needs " + requiredBytes + " bytes, the image holds "
                        + capacityBytes + "). Shorten the message or use a larger image.");
    }

    /** The image carries the Sanctum marker, but the hidden payload is damaged or cannot be decrypted. */
    public static ApiException corruptPayload() {
        return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "corrupt_payload",
                "This image contains a Sanctum message, but it is damaged and cannot be read.");
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, "validation_failed", message);
    }
}
