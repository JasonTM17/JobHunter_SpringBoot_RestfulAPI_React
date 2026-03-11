package com.vn.son.jobhunter.controller;

import com.vn.son.jobhunter.domain.dto.AiChatRequest;
import com.vn.son.jobhunter.domain.res.ai.AiChatResponse;
import com.vn.son.jobhunter.service.AiChatService;
import com.vn.son.jobhunter.util.annotation.ApiMessage;
import com.vn.son.jobhunter.util.error.BadRequestException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping(path = "${apiPrefix}/ai")
@RestController
@RequiredArgsConstructor
public class AiChatController {
    private final AiChatService aiChatService;

    @PostMapping("/chat")
    @ApiMessage("Generate AI chatbot response")
    public ResponseEntity<AiChatResponse> chat(@Valid @RequestBody AiChatRequest request) throws BadRequestException {
        return ResponseEntity.ok(this.aiChatService.generateReply(request));
    }
}
