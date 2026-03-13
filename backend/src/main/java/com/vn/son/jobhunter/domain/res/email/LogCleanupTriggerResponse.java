package com.vn.son.jobhunter.domain.res.email;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class LogCleanupTriggerResponse {
    private String status;
    private String code;
    private String message;
    private String triggerSource;
    private Instant triggeredAt;
    private int retentionDays;
    private int scannedFiles;
    private int deletedFiles;
    private int skippedFiles;
    private int errorCount;
}
