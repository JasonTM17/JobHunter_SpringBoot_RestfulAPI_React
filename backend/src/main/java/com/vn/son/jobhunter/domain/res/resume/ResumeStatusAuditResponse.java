package com.vn.son.jobhunter.domain.res.resume;

import com.vn.son.jobhunter.util.constant.ResumeStateEnum;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class ResumeStatusAuditResponse {
    private Long id;
    private Long resumeId;
    private ResumeStateEnum previousStatus;
    private ResumeStateEnum nextStatus;
    private String note;
    private Long actorUserId;
    private String actorEmail;
    private Instant createdAt;
}
