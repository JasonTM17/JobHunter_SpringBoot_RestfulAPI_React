package com.vn.son.jobhunter.controller;

import com.vn.son.jobhunter.domain.dto.AiChatRequest;
import com.vn.son.jobhunter.domain.res.ai.AiAvailabilityResponse;
import com.vn.son.jobhunter.domain.res.ai.AiChatResponse;
import com.vn.son.jobhunter.service.AiChatService;
import com.vn.son.jobhunter.util.annotation.ApiMessage;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.vn.son.jobhunter.util.error.AiServiceException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping(path = "${apiPrefix}/ai")
@RestController
@RequiredArgsConstructor
@Tag(name = "Trợ lý AI", description = "Nhóm API hỗ trợ hội thoại với trợ lý AI của Jobhunter")
public class AiChatController {
    private final AiChatService aiChatService;

    @GetMapping("/status")
    @ApiMessage("Lấy trạng thái sẵn sàng của trợ lý AI")
    public ResponseEntity<AiAvailabilityResponse> status() {
        boolean available = this.aiChatService.isAvailable();
        String message = available
                ? "Tr\u1ee3 l\u00fd AI \u0111ang s\u1eb5n s\u00e0ng."
                : this.aiChatService.unavailableMessage();
        return ResponseEntity.ok(new AiAvailabilityResponse(available, message));
    }

    @PostMapping("/chat")
    @ApiMessage("Tạo phản hồi từ trợ lý AI")
    public ResponseEntity<AiChatResponse> chat(@Valid @RequestBody AiChatRequest request) throws AiServiceException {
        return ResponseEntity.ok(this.aiChatService.generateReply(request));
    }
}
