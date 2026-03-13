package com.vn.son.jobhunter.controller;

import com.vn.son.jobhunter.domain.dto.email.TestEmailRequest;
import com.vn.son.jobhunter.domain.dto.email.TestTemplateEmailRequest;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.res.email.MailDispatchResponse;
import com.vn.son.jobhunter.domain.res.email.LogCleanupTriggerResponse;
import com.vn.son.jobhunter.domain.res.email.SchedulerTriggerResponse;
import com.vn.son.jobhunter.domain.res.email.TemplateEmailResponse;
import com.vn.son.jobhunter.domain.res.email.TestEmailResponse;
import com.vn.son.jobhunter.domain.res.email.WeeklyRecommendationTriggerResponse;
import com.vn.son.jobhunter.service.EmailService;
import com.vn.son.jobhunter.service.LogCleanupSchedulerService;
import com.vn.son.jobhunter.service.MailSchedulerService;
import com.vn.son.jobhunter.service.SubscriberService;
import com.vn.son.jobhunter.service.UserService;
import com.vn.son.jobhunter.service.WeeklyRecommendationSchedulerService;
import com.vn.son.jobhunter.util.annotation.ApiMessage;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.vn.son.jobhunter.util.error.ForbiddenException;
import com.vn.son.jobhunter.util.error.MailDeliveryException;
import com.vn.son.jobhunter.util.error.UnauthorizedException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@RestController
@RequiredArgsConstructor
@RequestMapping(path = "${apiPrefix}/email")
@Tag(name = "Email & scheduler", description = "Nhóm API gửi email và kích hoạt tác vụ lịch")
public class EmailController {
    private static final String TEST_TEMPLATE_NAME = "mail/test-notification";
    private static final Set<String> MANUAL_TRIGGER_ROLES = Set.of("ADMIN", "SUPER_ADMIN");

    private final SubscriberService subscriberService;
    private final EmailService emailService;
    private final LogCleanupSchedulerService logCleanupSchedulerService;
    private final MailSchedulerService mailSchedulerService;
    private final WeeklyRecommendationSchedulerService weeklyRecommendationSchedulerService;
    private final UserService userService;

    @PostMapping("/subscribers")
    @ApiMessage("Gửi email gợi ý cho danh sách subscriber")
    @Transactional
    public ResponseEntity<MailDispatchResponse> sendSubscribersDigestEmail() {
        this.subscriberService.sendSubscribersEmailJobs();
        MailDispatchResponse response = new MailDispatchResponse();
        response.setMessage("Đã kích hoạt gửi email gợi ý việc làm cho danh sách subscriber.");
        response.setDispatchedAt(Instant.now());
        return ResponseEntity.ok().body(response);
    }

    @PostMapping("/test")
    @ApiMessage("Gửi email thử nghiệm")
    public ResponseEntity<TestEmailResponse> sendTestEmail(
            @Valid @RequestBody TestEmailRequest request
    ) throws MailDeliveryException {
        String recipient = normalize(request.getRecipient()).toLowerCase();
        String subject = normalize(request.getSubject());
        String body = normalize(request.getBody());

        if (request.isHtml()) {
            this.emailService.sendHtmlEmail(recipient, subject, body);
        } else {
            this.emailService.sendTextEmail(recipient, subject, body);
        }

        TestEmailResponse response = new TestEmailResponse();
        response.setRecipient(recipient);
        response.setSender(this.emailService.getDefaultSenderAddress());
        response.setSubject(subject);
        response.setSentAt(Instant.now());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/test-template")
    @ApiMessage("Gửi email mẫu thử nghiệm")
    public ResponseEntity<TemplateEmailResponse> sendTestTemplateEmail(
            @Valid @RequestBody TestTemplateEmailRequest request
    ) throws MailDeliveryException {
        String recipient = normalize(request.getRecipient()).toLowerCase();
        String recipientName = normalize(request.getRecipientName());
        String subject = normalize(request.getSubject());
        String title = normalize(request.getTitle());
        String message = normalize(request.getMessage());
        String actionText = normalize(request.getActionText());
        String actionUrl = normalize(request.getActionUrl());

        Map<String, Object> variables = new HashMap<>();
        variables.put("recipientName", recipientName.isBlank() ? "Bạn" : recipientName);
        variables.put("title", title.isBlank() ? "Thông báo từ Jobhunter" : title);
        variables.put("message", message);
        variables.put("previewText", "Đây là email kiểm tra giao diện template từ hệ thống Jobhunter.");

        if (!actionText.isBlank()) {
            variables.put("actionText", actionText);
        } else {
            variables.put("actionText", "Mở Jobhunter");
        }

        if (!actionUrl.isBlank()) {
            variables.put("actionUrl", actionUrl);
        }

        this.emailService.sendTemplateEmail(
                recipient,
                subject,
                TEST_TEMPLATE_NAME,
                variables
        );

        TemplateEmailResponse response = new TemplateEmailResponse();
        response.setRecipient(recipient);
        response.setSender(this.emailService.getDefaultSenderAddress());
        response.setSubject(subject);
        response.setTemplateName(TEST_TEMPLATE_NAME);
        response.setSentAt(Instant.now());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/scheduler/trigger")
    @ApiMessage("Kích hoạt thủ công email heartbeat của scheduler")
    public ResponseEntity<SchedulerTriggerResponse> triggerSchedulerMailHeartbeat() throws UnauthorizedException, ForbiddenException {
        ensureManualTriggerAccess();
        return ResponseEntity.ok(this.mailSchedulerService.triggerHeartbeatManually());
    }

    @PostMapping("/recommendations/weekly/trigger")
    @ApiMessage("Kích hoạt thủ công email gợi ý việc làm hằng tuần")
    public ResponseEntity<WeeklyRecommendationTriggerResponse> triggerWeeklyRecommendation() throws UnauthorizedException, ForbiddenException {
        ensureManualTriggerAccess();
        return ResponseEntity.ok(this.weeklyRecommendationSchedulerService.triggerManually());
    }

    @PostMapping("/logs/cleanup/trigger")
    @ApiMessage("Kích hoạt thủ công dọn log định kỳ")
    public ResponseEntity<LogCleanupTriggerResponse> triggerLogCleanup() throws UnauthorizedException, ForbiddenException {
        ensureManualTriggerAccess();
        return ResponseEntity.ok(this.logCleanupSchedulerService.triggerManually());
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private void ensureManualTriggerAccess() throws UnauthorizedException, ForbiddenException {
        User currentUser = this.userService.getCurrentAuthenticatedUserOrThrow();
        String roleName = currentUser.getRole() == null ? "" : normalize(currentUser.getRole().getName()).toUpperCase(Locale.ROOT);
        if (!StringUtils.hasText(roleName) || !MANUAL_TRIGGER_ROLES.contains(roleName)) {
            throw new ForbiddenException("Chỉ tài khoản quản trị mới được phép kích hoạt thủ công.");
        }
    }
}
