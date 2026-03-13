package com.vn.son.jobhunter.domain.res.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiAvailabilityResponse {
    private boolean available;
    private String message;
}
