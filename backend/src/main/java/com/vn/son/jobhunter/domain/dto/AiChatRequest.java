package com.vn.son.jobhunter.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiChatRequest {
    @NotBlank(message = "Message cannot be blank")
    @Size(max = 2000, message = "Message must be at most 2000 characters")
    private String message;

    @Size(max = 1000, message = "System prompt must be at most 1000 characters")
    private String systemPrompt;
}
