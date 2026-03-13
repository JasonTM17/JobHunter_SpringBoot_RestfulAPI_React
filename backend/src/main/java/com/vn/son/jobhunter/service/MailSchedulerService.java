package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.config.properties.SchedulerProperties;
import com.vn.son.jobhunter.domain.res.email.SchedulerTriggerResponse;
import com.vn.son.jobhunter.util.error.MailDeliveryException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailSchedulerService {
    private static final DateTimeFormatter RUN_AT_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z");

    private final SchedulerProperties schedulerProperties;
    private final EmailService emailService;
    private final Environment environment;
    private final AtomicBoolean running = new AtomicBoolean(false);

    @Scheduled(
            cron = "${jobhunter.scheduler.mail.cron:0 0 9 * * *}",
            zone = "${jobhunter.scheduler.mail.zone:Asia/Ho_Chi_Minh}"
    )
    public void runScheduledHeartbeat() {
        SchedulerTriggerResponse result = executeHeartbeat("cron", false);
        if (!"SKIPPED".equals(result.getStatus()) || !"MAIL_CRON_DISABLED".equals(result.getCode())) {
            log.info(
                    "Mail scheduler run status={} code={} recipient={}",
                    result.getStatus(),
                    result.getCode(),
                    maskRecipient(result.getRecipient())
            );
        }
    }

    public SchedulerTriggerResponse triggerHeartbeatManually() {
        return executeHeartbeat("manual", true);
    }

    private SchedulerTriggerResponse executeHeartbeat(String source, boolean verboseLog) {
        SchedulerTriggerResponse response = new SchedulerTriggerResponse();
        response.setTriggerSource(source);
        response.setTriggeredAt(Instant.now());
        response.setRecipient(normalize(this.schedulerProperties.getMail().getRecipient()));

        if (!this.schedulerProperties.getMail().isEnabled()) {
            return skip(response, "MAIL_CRON_DISABLED", "Lịch gửi email tự động đang tắt.");
        }

        if (!running.compareAndSet(false, true)) {
            return skip(response, "SCHEDULER_BUSY", "Tác vụ gửi email đang chạy, bỏ qua lần kích hoạt mới.");
        }

        try {
            if (!StringUtils.hasText(response.getRecipient())) {
                return skip(response, "MAIL_CRON_RECIPIENT_MISSING", "Chưa cấu hình người nhận cho cron mail.");
            }
            if (!this.emailService.isMailConfigured()) {
                return skip(response, "MAIL_NOT_CONFIGURED", "Mail chưa đủ cấu hình để gửi từ scheduler.");
            }

            String zone = resolveZone();
            ZonedDateTime now = ZonedDateTime.now(ZoneId.of(zone));
            String activeProfile = resolveActiveProfile();

            Map<String, Object> variables = new HashMap<>();
            variables.put("recipientName", "Đội vận hành");
            variables.put("title", "Thông báo scheduler tự động");
            variables.put("previewText", "Thông báo heartbeat từ hệ thống Jobhunter.");
            variables.put("triggerSource", source);
            variables.put("activeProfile", activeProfile);
            variables.put("runAt", now.format(RUN_AT_FORMATTER));
            variables.put("message", "Hệ thống scheduler vẫn hoạt động ổn định.");

            String subjectPrefix = normalize(this.schedulerProperties.getMail().getSubjectPrefix());
            String subject = (StringUtils.hasText(subjectPrefix) ? subjectPrefix + " " : "")
                    + "Heartbeat " + now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));

            this.emailService.sendTemplateEmail(
                    response.getRecipient(),
                    subject,
                    this.schedulerProperties.getMail().getTemplate(),
                    variables
            );

            response.setStatus("SUCCESS");
            response.setCode("MAIL_SENT");
            response.setMessage("Đã gửi email heartbeat từ scheduler thành công.");
            if (verboseLog) {
                log.info(
                        "Manual scheduler trigger succeeded for {}",
                        maskRecipient(response.getRecipient())
                    );
            }
            return response;
        } catch (MailDeliveryException ex) {
            response.setStatus("FAILED");
            response.setCode(ex.getErrorCode());
            response.setMessage("Không thể gửi email scheduler lúc này. Vui lòng kiểm tra cấu hình mail.");
            log.warn(
                    "Scheduler mail failed with code={} recipient={}",
                    ex.getErrorCode(),
                    maskRecipient(response.getRecipient())
            );
            return response;
        } catch (Exception ex) {
            response.setStatus("FAILED");
            response.setCode("SCHEDULER_ERROR");
            response.setMessage("Tác vụ scheduler gặp lỗi tạm thời.");
            log.error("Unexpected scheduler mail error", ex);
            return response;
        } finally {
            running.set(false);
        }
    }

    private SchedulerTriggerResponse skip(SchedulerTriggerResponse response, String code, String message) {
        response.setStatus("SKIPPED");
        response.setCode(code);
        response.setMessage(message);
        return response;
    }

    private String resolveActiveProfile() {
        String[] profiles = this.environment.getActiveProfiles();
        if (profiles == null || profiles.length == 0) {
            return "default";
        }
        return profiles[0];
    }

    private String resolveZone() {
        String zone = normalize(this.schedulerProperties.getMail().getZone());
        if (!StringUtils.hasText(zone)) {
            return "Asia/Ho_Chi_Minh";
        }
        try {
            ZoneId.of(zone);
            return zone;
        } catch (Exception ex) {
            log.warn("Invalid scheduler zone '{}', fallback to Asia/Ho_Chi_Minh", zone);
            return "Asia/Ho_Chi_Minh";
        }
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String maskRecipient(String email) {
        String value = normalize(email).toLowerCase();
        int index = value.indexOf('@');
        if (index <= 1 || index == value.length() - 1) {
            return "***";
        }
        return value.charAt(0) + "***@" + value.substring(index + 1);
    }
}
