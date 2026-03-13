package com.vn.son.jobhunter.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "jobhunter.scheduler")
public class SchedulerProperties {
    private boolean enabled = false;
    private Mail mail = new Mail();
    private WeeklyRecommendation weeklyRecommendation = new WeeklyRecommendation();
    private LogCleanup logCleanup = new LogCleanup();

    @Getter
    @Setter
    public static class Mail {
        private boolean enabled = false;
        private String cron = "0 0 9 * * *";
        private String zone = "Asia/Ho_Chi_Minh";
        private String recipient = "";
        private String subjectPrefix = "[Jobhunter Scheduler]";
        private String template = "mail/scheduler-heartbeat";
    }

    @Getter
    @Setter
    public static class WeeklyRecommendation {
        private boolean enabled = false;
        private String cron = "0 0 8 * * MON";
        private String zone = "Asia/Ho_Chi_Minh";
        private int maxJobsPerUser = 8;
        private int recentApplyDays = 180;
        private boolean fallbackEnabled = true;
        private boolean manualTriggerEnabled = false;
        private String manualTriggerAllowedProfiles = "dev,local,docker,test";
        private int candidatePageSize = 200;
        private int maxCandidatesPerRun = 2000;
    }

    @Getter
    @Setter
    public static class LogCleanup {
        private boolean enabled = false;
        private String cron = "0 0 3 * * *";
        private String zone = "Asia/Ho_Chi_Minh";
        private int retentionDays = 7;
        private String paths = "logs";
        private String includePatterns = "*.log,*.log.*";
        private int maxScanFiles = 10000;
        private boolean manualTriggerEnabled = false;
        private String manualTriggerAllowedProfiles = "dev,local,docker,test";
    }
}
