package com.sanctum.chat;

/** The two chat contexts. The key is stored in the database and used as the JSON field name. */
public enum Conversation {
    THERAPY("therapy", "therapy-system"),
    LEGAL("legal", "legal-system");

    private final String key;
    private final String promptName;

    Conversation(String key, String promptName) {
        this.key = key;
        this.promptName = promptName;
    }

    public String key() {
        return key;
    }

    public String promptName() {
        return promptName;
    }
}
