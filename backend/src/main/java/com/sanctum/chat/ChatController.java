package com.sanctum.chat;

import com.sanctum.chat.dto.ChatDtos.ChatRequest;
import com.sanctum.chat.dto.ChatDtos.ChatResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/therapy")
    public ChatResponse therapy(@Valid @RequestBody ChatRequest request) {
        return chatService.send(Conversation.THERAPY, request);
    }

    @PostMapping("/legal")
    public ChatResponse legal(@Valid @RequestBody ChatRequest request) {
        return chatService.send(Conversation.LEGAL, request);
    }
}
