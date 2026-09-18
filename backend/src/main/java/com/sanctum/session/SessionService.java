package com.sanctum.session;

import com.sanctum.chat.Conversation;
import com.sanctum.chat.ConversationRepository;
import com.sanctum.chat.MessageEntity;
import com.sanctum.common.exceptions.Errors;
import com.sanctum.config.SanctumProperties;
import com.sanctum.crypto.EncryptionService;
import com.sanctum.session.dto.SessionDtos.ChatMessage;
import com.sanctum.session.dto.SessionDtos.Conversations;
import com.sanctum.session.dto.SessionDtos.SessionResponse;
import com.sanctum.session.dto.SessionDtos.UpdateSessionRequest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SessionService {

    private final SessionRepository sessions;
    private final ConversationRepository messages;
    private final EncryptionService encryption;
    private final Clock clock;
    private final Duration ttl;
    private final Duration maxTtl;

    public SessionService(
            SessionRepository sessions,
            ConversationRepository messages,
            EncryptionService encryption,
            Clock clock,
            SanctumProperties properties) {
        this.sessions = sessions;
        this.messages = messages;
        this.encryption = encryption;
        this.clock = clock;
        this.ttl = Duration.ofHours(properties.session().ttlHours());
        this.maxTtl = Duration.ofDays(properties.session().maxTtlDays());
    }

    @Transactional
    public SessionResponse create() {
        Instant now = now();
        SessionEntity session = new SessionEntity(UUID.randomUUID(), now, now.plus(ttl));
        sessions.save(session);
        return toResponse(session, List.of());
    }

    @Transactional(readOnly = true)
    public SessionResponse get(String rawSessionId) {
        SessionEntity session = requireActive(rawSessionId);
        return toResponse(session, messages.findBySessionIdOrderByCreatedAtAscIdAsc(session.getSessionId()));
    }

    @Transactional
    public SessionResponse update(String rawSessionId, UpdateSessionRequest request) {
        SessionEntity session = requireActive(rawSessionId);
        if (request.situationSummary() != null) {
            String summary = request.situationSummary().isEmpty() ? null : request.situationSummary();
            session.setSituationSummary(encryption.encrypt(summary, summaryContext(session.getSessionId())));
        }
        touch(session);
        return toResponse(session, messages.findBySessionIdOrderByCreatedAtAscIdAsc(session.getSessionId()));
    }

    /** Idempotent hard delete. Unknown or malformed IDs succeed silently, revealing nothing. */
    @Transactional
    public void delete(String rawSessionId) {
        parse(rawSessionId).ifPresent(sessions::hardDelete);
    }

    /** Returns the session if it exists and has not expired; otherwise 404. */
    @Transactional(readOnly = true)
    public SessionEntity requireActive(String rawSessionId) {
        UUID id = parse(rawSessionId).orElseThrow(Errors::sessionNotFound);
        return sessions.findBySessionIdAndExpiresAtAfter(id, now()).orElseThrow(Errors::sessionNotFound);
    }

    /** Looks up an active session within the caller's transaction, without throwing. */
    public Optional<SessionEntity> findActive(UUID sessionId) {
        return sessions.findBySessionIdAndExpiresAtAfter(sessionId, now());
    }

    /** Sliding expiry: activity pushes expiry forward, capped at an absolute maximum from creation. */
    public void touch(SessionEntity session) {
        Instant now = now();
        Instant slid = now.plus(ttl);
        Instant cap = session.getCreatedAt().plus(maxTtl);
        session.setLastActiveAt(now);
        session.setExpiresAt(slid.isBefore(cap) ? slid : cap);
    }

    @Transactional
    public int deleteExpired() {
        return sessions.hardDeleteExpired(now());
    }

    public static String summaryContext(UUID sessionId) {
        return "session:" + sessionId + ":situation_summary";
    }

    public static String messageContext(UUID sessionId) {
        return "session:" + sessionId + ":message";
    }

    private SessionResponse toResponse(SessionEntity session, List<MessageEntity> history) {
        List<ChatMessage> therapy = new ArrayList<>();
        List<ChatMessage> legal = new ArrayList<>();
        String context = messageContext(session.getSessionId());
        for (MessageEntity m : history) {
            ChatMessage dto = new ChatMessage(m.getRole(), encryption.decrypt(m.getContent(), context), m.getCreatedAt());
            if (Conversation.THERAPY.key().equals(m.getConversation())) {
                therapy.add(dto);
            } else if (Conversation.LEGAL.key().equals(m.getConversation())) {
                legal.add(dto);
            }
        }
        return new SessionResponse(
                session.getSessionId().toString(),
                session.getCreatedAt(),
                session.getExpiresAt(),
                encryption.decrypt(session.getSituationSummary(), summaryContext(session.getSessionId())),
                new Conversations(therapy, legal));
    }

    private Instant now() {
        // Millisecond precision: survives the Postgres round trip unchanged and matches JS Date.
        return clock.instant().truncatedTo(ChronoUnit.MILLIS);
    }

    private static Optional<UUID> parse(String raw) {
        if (raw == null || raw.length() != 36) {
            return Optional.empty();
        }
        try {
            return Optional.of(UUID.fromString(raw));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
