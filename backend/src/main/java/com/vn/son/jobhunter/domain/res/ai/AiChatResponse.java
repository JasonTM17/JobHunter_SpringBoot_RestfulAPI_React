package com.vn.son.jobhunter.domain.res.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {
    private String reply;
    private String model;
}
