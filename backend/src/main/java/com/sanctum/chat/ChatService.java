package com.sanctum.chat;

import com.sanctum.ai.AiService;
import com.sanctum.ai.AiService.AiMessage;
import com.sanctum.ai.CrisisDetector;
import com.sanctum.ai.PromptLibrary;
import com.sanctum.chat.dto.ChatDtos.ChatRequest;
import com.sanctum.chat.dto.ChatDtos.ChatResponse;
import com.sanctum.config.RateLimitConfig;
import com.sanctum.config.RateLimitConfig.Limit;
import com.sanctum.config.SanctumProperties;
import com.sanctum.crypto.EncryptionService;
import com.sanctum.session.SessionEntity;
import com.sanctum.session.SessionService;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class ChatService {

    private final SessionService sessionService;
    private final ConversationRepository messages;
    private final EncryptionService encryption;
    private final AiService ai;
    private final PromptLibrary prompts;
    private final CrisisDetector crisisDetector;
    private final RateLimitConfig rateLimiter;
    private final TransactionTemplate tx;
    private final Clock clock;
    private final int maxHistoryMessages;

    public ChatService(
            SessionService sessionService,
            ConversationRepository messages,
            EncryptionService encryption,
            AiService ai,
            PromptLibrary prompts,
            CrisisDetector crisisDetector,
            RateLimitConfig rateLimiter,
            TransactionTemplate tx,
            Clock clock,
            SanctumProperties properties) {
        this.sessionService = sessionService;
        this.messages = messages;
        this.encryption = encryption;
        this.ai = ai;
        this.prompts = prompts;
        this.crisisDetector = crisisDetector;
        this.rateLimiter = rateLimiter;
        this.tx = tx;
        this.clock = clock;
        // A turn is one user message plus one assistant reply.
        this.maxHistoryMessages = properties.ai().maxHistoryTurns() * 2;
    }

    public ChatResponse send(Conversation conversation, ChatRequest request) {
        SessionEntity session = sessionService.requireActive(request.sessionId());
        UUID sessionId = session.getSessionId();
        rateLimiter.check(Limit.CHAT, sessionId.toString());

        String userMessage = request.message().trim();
        List<AiMessage> context = loadHistory(sessionId, conversation);
        context.add(AiMessage.user(userMessage));

        // Runs on the user's words independently of the model, before and regardless of its reply.
        CrisisDetector.Assessment crisis = crisisDetector.assess(userMessage);

        // Outside any transaction: this can take up to the AI timeout. Throws ai_unavailable on failure,
        // in which case nothing is stored and nothing is fabricated.
        String modelReply = ai.generate(prompts.get(conversation.promptName()), context);
        String reply = crisisDetector.applyTo(modelReply, crisis);

        Instant userAt = now();
        Instant replyAt = userAt.plusMillis(1);
        tx.executeWithoutResult(status -> sessionService.findActive(sessionId).ifPresent(active -> {
            // If the session was deleted ("Clear My Data") while the model was answering, store nothing.
            String ctx = SessionService.messageContext(sessionId);
            messages.save(new MessageEntity(sessionId, conversation.key(), "user",
                    encryption.encrypt(userMessage, ctx), userAt));
            messages.save(new MessageEntity(sessionId, conversation.key(), "assistant",
                    encryption.encrypt(reply, ctx), replyAt));
            sessionService.touch(active);
        }));
        return new ChatResponse(reply, replyAt);
    }

    private List<AiMessage> loadHistory(UUID sessionId, Conversation conversation) {
        List<MessageEntity> recent = messages.findBySessionIdAndConversationOrderByCreatedAtDescIdDesc(
                sessionId, conversation.key(), PageRequest.of(0, maxHistoryMessages));
        String ctx = SessionService.messageContext(sessionId);
        List<AiMessage> history = new ArrayList<>(recent.size() + 1);
        for (int i = recent.size() - 1; i >= 0; i--) {
            MessageEntity m = recent.get(i);
            String content = encryption.decrypt(m.getContent(), ctx);
            history.add("user".equals(m.getRole()) ? AiMessage.user(content) : AiMessage.assistant(content));
        }
        // The window may cut a turn in half; the context sent to the model must start with the user.
        while (!history.isEmpty() && history.get(0).role() != AiService.Role.USER) {
            history.remove(0);
        }
        return history;
    }

    private Instant now() {
        return clock.instant().truncatedTo(ChronoUnit.MILLIS);
    }
}
