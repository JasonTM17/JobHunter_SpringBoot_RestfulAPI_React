package com.vn.son.jobhunter.domain.res.email;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class WeeklyRecommendationTriggerResponse {
    private String status;
    private String code;
    private String message;
    private String triggerSource;
    private String weekKey;
    private Instant triggeredAt;
    private int totalCandidates;
    private int evaluatedCandidates;
    private int sentCount;
    private int skippedCount;
    private int failedCount;
}
