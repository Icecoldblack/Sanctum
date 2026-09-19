package com.sanctum.support;

import com.sanctum.ai.AiService;
import com.sanctum.common.exceptions.Errors;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/** Records what the application sends to the model and returns a scripted reply or failure. */
public class StubAiService implements AiService {

    public record Call(String systemPrompt, List<AiMessage> conversation) {}

    private final List<Call> calls = new CopyOnWriteArrayList<>();
    private volatile String reply = "Stub reply.";
    private volatile boolean fail;
    private volatile Runnable beforeReply = () -> {};

    @Override
    public String generate(String systemPrompt, List<AiMessage> conversation) {
        calls.add(new Call(systemPrompt, new ArrayList<>(conversation)));
        beforeReply.run();
        if (fail) {
            throw Errors.aiUnavailable();
        }
        return reply;
    }

    public void reset() {
        calls.clear();
        reply = "Stub reply.";
        fail = false;
        beforeReply = () -> {};
    }

    public void replyWith(String reply) {
        this.reply = reply;
    }

    public void failNextCalls() {
        this.fail = true;
    }

    public void beforeReply(Runnable hook) {
        this.beforeReply = hook;
    }

    public List<Call> calls() {
        return calls;
    }

    public Call lastCall() {
        return calls.get(calls.size() - 1);
    }

    @TestConfiguration(proxyBeanMethods = false)
    public static class Config {
        @Bean
        @Primary
        public StubAiService stubAiService() {
            return new StubAiService();
        }

        @Bean
        @Primary
        public StubImageGenerator stubImageGenerator() {
            return new StubImageGenerator();
        }
    }
}
