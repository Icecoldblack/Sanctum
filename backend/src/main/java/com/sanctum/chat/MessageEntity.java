package com.sanctum.chat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "messages")
@Getter
@NoArgsConstructor
public class MessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false, updatable = false)
    private UUID sessionId;

    /** "therapy" or "legal". */
    @Column(name = "conversation", nullable = false, length = 16)
    private String conversation;

    /** "user" or "assistant". */
    @Column(name = "role", nullable = false, length = 16)
    private String role;

    /** Ciphertext. Read and written only through EncryptionService. */
    @Column(name = "content", nullable = false)
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public MessageEntity(UUID sessionId, String conversation, String role, String content, Instant createdAt) {
        this.sessionId = sessionId;
        this.conversation = conversation;
        this.role = role;
        this.content = content;
        this.createdAt = createdAt;
    }
}
