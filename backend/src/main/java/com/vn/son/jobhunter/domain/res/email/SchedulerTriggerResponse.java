package com.vn.son.jobhunter.domain.res.email;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class SchedulerTriggerResponse {
    private String status;
    private String code;
    private String message;
    private String triggerSource;
    private String recipient;
    private Instant triggeredAt;
}
