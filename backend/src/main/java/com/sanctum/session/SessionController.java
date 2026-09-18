package com.sanctum.session;

import com.sanctum.config.RateLimitConfig;
import com.sanctum.config.RateLimitConfig.Limit;
import com.sanctum.session.dto.SessionDtos.SessionResponse;
import com.sanctum.session.dto.SessionDtos.UpdateSessionRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Mapped at both {@code /api/session} (the backend plan) and {@code /api/sessions} (what the
 * current frontend calls).
 */
@RestController
@RequestMapping({"/api/session", "/api/sessions"})
public class SessionController {

    private final SessionService sessionService;
    private final RateLimitConfig rateLimiter;

    public SessionController(SessionService sessionService, RateLimitConfig rateLimiter) {
        this.sessionService = sessionService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping
    public ResponseEntity<SessionResponse> create(HttpServletRequest request) {
        // Keyed by IP in memory only; the IP is hashed and never persisted or logged.
        rateLimiter.check(Limit.SESSION_CREATE, request.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.create());
    }

    @GetMapping("/{sessionId}")
    public SessionResponse get(@PathVariable String sessionId) {
        return sessionService.get(sessionId);
    }

    @PatchMapping("/{sessionId}")
    public SessionResponse update(@PathVariable String sessionId, @Valid @RequestBody UpdateSessionRequest body) {
        return sessionService.update(sessionId, body);
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> delete(@PathVariable String sessionId) {
        sessionService.delete(sessionId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Same as DELETE, as a POST so the quick exit can fire it with {@code navigator.sendBeacon}
     * while the page is navigating away. Beacons can only POST, and a bodiless POST is a
     * CORS-simple request, so it is delivered without a preflight.
     */
    @PostMapping("/{sessionId}/erase")
    public ResponseEntity<Void> erase(@PathVariable String sessionId) {
        sessionService.delete(sessionId);
        return ResponseEntity.noContent().build();
    }
}
