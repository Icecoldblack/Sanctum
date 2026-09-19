package com.sanctum.ai;

/** Generates ordinary-looking photos to hide SOS messages in. Stubbed in tests. */
public interface ImageGenerator {

    /**
     * @param description what the photo should show; already wrapped in the house style
     * @return a PNG, freshly encoded from pixel data only
     * @throws com.sanctum.common.exceptions.ApiException with code {@code ai_unavailable} on any
     *     failure, including the provider declining the request
     */
    byte[] generatePng(String description);
}
