package com.sanctum.session;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SessionRepository extends JpaRepository<SessionEntity, UUID> {

    Optional<SessionEntity> findBySessionIdAndExpiresAtAfter(UUID sessionId, Instant now);

    /** Hard delete. Messages go with it through ON DELETE CASCADE. */
    @Modifying
    @Query("delete from SessionEntity s where s.sessionId = :sessionId")
    int hardDelete(@Param("sessionId") UUID sessionId);

    /** Hard delete of every expired session. Messages go with them through ON DELETE CASCADE. */
    @Modifying
    @Query("delete from SessionEntity s where s.expiresAt <= :now")
    int hardDeleteExpired(@Param("now") Instant now);
}
