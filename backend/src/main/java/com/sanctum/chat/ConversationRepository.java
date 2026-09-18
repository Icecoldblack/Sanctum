package com.sanctum.chat;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<MessageEntity, Long> {

    List<MessageEntity> findBySessionIdOrderByCreatedAtAscIdAsc(UUID sessionId);

    /** Most recent first; callers reverse into chronological order. */
    List<MessageEntity> findBySessionIdAndConversationOrderByCreatedAtDescIdDesc(
            UUID sessionId, String conversation, Pageable page);
}
