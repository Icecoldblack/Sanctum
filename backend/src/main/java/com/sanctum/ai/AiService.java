package com.sanctum.ai;

import java.util.List;

/** Provider-neutral model access, so the provider can be swapped and stubbed in tests. */
public interface AiService {

    /**
     * Generates the next assistant turn.
     *
     * @param systemPrompt the system instruction
     * @param conversation prior turns in chronological order, ending with the user's new message
     * @return the model's reply text; never blank
     * @throws com.sanctum.common.exceptions.ApiException with code {@code ai_unavailable} on any
     *     failure. Implementations must never fabricate a reply.
     */
    String generate(String systemPrompt, List<AiMessage> conversation);

    record AiMessage(Role role, String content) {
        public static AiMessage user(String content) {
            return new AiMessage(Role.USER, content);
        }

        public static AiMessage assistant(String content) {
            return new AiMessage(Role.ASSISTANT, content);
        }
    }

    enum Role { USER, ASSISTANT }
}
