package com.sanctum.scheduled;

import com.sanctum.session.SessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Hard-deletes expired sessions (and, by cascade, their messages). Nothing is soft-deleted. */
@Component
public class SessionCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(SessionCleanupJob.class);

    private final SessionService sessionService;

    public SessionCleanupJob(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @Scheduled(initialDelayString = "${sanctum.session.cleanup-initial-delay:PT1M}",
            fixedDelayString = "${sanctum.session.cleanup-interval:PT1H}")
    public void purgeExpired() {
        int deleted = sessionService.deleteExpired();
        if (deleted > 0) {
            log.info("Session cleanup removed {} expired sessions", deleted);
        }
    }
}
