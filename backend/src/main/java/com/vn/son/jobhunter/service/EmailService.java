package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.config.properties.MailSenderProperties;
import com.vn.son.jobhunter.config.properties.MailTemplateProperties;
import com.vn.son.jobhunter.util.error.MailDeliveryException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.mail.autoconfigure.MailProperties;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.nio.charset.StandardCharsets;
import java.time.Year;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {
    private final ObjectProvider<JavaMailSender> javaMailSenderProvider;
    private final SpringTemplateEngine templateEngine;
    private final MailProperties mailProperties;
    private final MailSenderProperties mailSenderProperties;
    private final MailTemplateProperties mailTemplateProperties;

    public boolean isMailConfigured() {
        if (!this.mailSenderProperties.isEnabled()) {
            return false;
        }
        if (!StringUtils.hasText(resolveSenderAddress())) {
            return false;
        }
        if (!StringUtils.hasText(normalizeValue(this.mailProperties.getUsername()))
                || !StringUtils.hasText(normalizeValue(this.mailProperties.getPassword()))) {
            return false;
        }
        return this.javaMailSenderProvider.getIfAvailable() != null;
    }

    public String getDefaultSenderAddress() {
        return resolveSenderAddress();
    }

    public void sendTextEmail(String to, String subject, String content) throws MailDeliveryException {
        sendEmailSync(to, subject, content, false, false);
    }

    public void sendHtmlEmail(String to, String subject, String content) throws MailDeliveryException {
        sendEmailSync(to, subject, content, false, true);
    }

    public void sendTemplateEmail(
            String to,
            String subject,
            String templateName,
            Map<String, Object> variables
    ) throws MailDeliveryException {
        String normalizedTemplate = normalizeTemplateName(templateName);
        Map<String, Object> mergedVariables = buildTemplateVariables(variables);
        String recipientForLog = maskEmail(to);
        log.info("Preparing template email template={} recipient={}", normalizedTemplate, recipientForLog);

        String htmlContent;
        try {
            Context context = new Context(Locale.forLanguageTag("vi-VN"));
            context.setVariables(mergedVariables);
            htmlContent = this.templateEngine.process(normalizedTemplate, context);
        } catch (Exception ex) {
            log.warn("Mail template render failed template={} recipient={}", normalizedTemplate, recipientForLog);
            throw new MailDeliveryException(
                    "MAIL_TEMPLATE_RENDER_FAILED",
                    "Không thể tạo nội dung email lúc này. Vui lòng thử lại sau.",
                    ex
            );
        }

        sendHtmlEmail(to, subject, htmlContent);
    }

    public void sendTemplateEmailSafely(
            String to,
            String subject,
            String templateName,
            Map<String, Object> variables
    ) {
        try {
            sendTemplateEmail(to, subject, templateName, variables);
        } catch (MailDeliveryException e) {
            log.warn("Skip template email to {} due to {}", maskEmail(to), e.getErrorCode());
        }
    }

    public void sendEmailFromTemplateSync(
            String to,
            String subject,
            String templateName,
            String username,
            Object value
    ) throws MailDeliveryException {
        Map<String, Object> variables = new HashMap<>();
        variables.put("recipientName", normalizeText(username));
        variables.put("jobs", value);
        sendTemplateEmail(to, subject, templateName, variables);
    }

    public void sendEmailFromTemplateSafely(
            String to,
            String subject,
            String templateName,
            String username,
            Object value
    ) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("recipientName", normalizeText(username));
        variables.put("jobs", value);
        sendTemplateEmailSafely(to, subject, templateName, variables);
    }

    public void sendEmailSync(
            String to,
            String subject,
            String content,
            boolean isMultipart,
            boolean isHtml
    ) throws MailDeliveryException {
        JavaMailSender javaMailSender = ensureMailServiceReady();
        String normalizedRecipient = normalizeAndValidateEmail(to, "nguoi nhan", "MAIL_INVALID_RECIPIENT");
        String normalizedSender = normalizeAndValidateEmail(getDefaultSenderAddress(), "nguoi gui", "MAIL_INVALID_SENDER");
        String normalizedSubject = normalizeText(subject);
        String normalizedContent = normalizeText(content);
        String contentType = isHtml ? "HTML" : "TEXT";

        if (!StringUtils.hasText(normalizedSubject)) {
            throw new MailDeliveryException("MAIL_INVALID_SUBJECT", "Tiêu đề email không hợp lệ.");
        }
        if (!StringUtils.hasText(normalizedContent)) {
            throw new MailDeliveryException("MAIL_INVALID_CONTENT", "Nội dung email không hợp lệ.");
        }

        log.info(
                "Dispatching {} email recipient={} subjectLength={}",
                contentType,
                maskEmail(normalizedRecipient),
                normalizedSubject.length()
        );

        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        try {
            MimeMessageHelper message = new MimeMessageHelper(
                    mimeMessage,
                    isMultipart,
                    StandardCharsets.UTF_8.name()
            );
            message.setFrom(normalizedSender);
            message.setTo(normalizedRecipient);
            message.setSubject(normalizedSubject);
            message.setText(normalizedContent, isHtml);
            javaMailSender.send(mimeMessage);
            log.info("{} email sent successfully recipient={}", contentType, maskEmail(normalizedRecipient));
        } catch (MailAuthenticationException e) {
            log.warn("{} email authentication failed recipient={}", contentType, maskEmail(normalizedRecipient));
            throw new MailDeliveryException(
                    "MAIL_AUTH_FAILED",
                    "Không thể xác thực với máy chủ email. Vui lòng kiểm tra App Password.",
                    e
            );
        } catch (MailSendException e) {
            log.warn("{} email send failed recipient={}", contentType, maskEmail(normalizedRecipient));
            throw new MailDeliveryException(
                    "MAIL_SEND_FAILED",
                    "Không thể gửi email lúc này. Vui lòng thử lại sau ít phút.",
                    e
            );
        } catch (MailException | MessagingException e) {
            log.warn("{} email delivery error recipient={}", contentType, maskEmail(normalizedRecipient));
            throw new MailDeliveryException(
                    "MAIL_SEND_FAILED",
                    "Không thể gửi email lúc này. Vui lòng thử lại sau ít phút.",
                    e
            );
        }
    }

    private JavaMailSender ensureMailServiceReady() throws MailDeliveryException {
        if (!this.mailSenderProperties.isEnabled()) {
            throw new MailDeliveryException(
                    "MAIL_NOT_CONFIGURED",
                    "Dịch vụ email đang tắt. Vui lòng bật cấu hình mail để sử dụng."
            );
        }

        if (!StringUtils.hasText(normalizeValue(this.mailProperties.getUsername()))
                || !StringUtils.hasText(normalizeValue(this.mailProperties.getPassword()))) {
            throw new MailDeliveryException(
                    "MAIL_NOT_CONFIGURED",
                    "Dịch vụ email chưa sẵn sàng. Vui lòng cấu hình spring.mail.username/spring.mail.password (thường qua MAIL_USERNAME và MAIL_PASSWORD) rồi khởi động lại backend."
            );
        }

        if (!StringUtils.hasText(resolveSenderAddress())) {
            throw new MailDeliveryException(
                    "MAIL_NOT_CONFIGURED",
                    "Dịch vụ email chưa có địa chỉ người gửi mặc định."
            );
        }

        JavaMailSender javaMailSender = this.javaMailSenderProvider.getIfAvailable();
        if (javaMailSender == null) {
            throw new MailDeliveryException(
                    "MAIL_NOT_CONFIGURED",
                    "Không tìm thấy cấu hình JavaMailSender. Vui lòng kiểm tra spring.mail."
            );
        }
        return javaMailSender;
    }

    private String resolveSenderAddress() {
        String explicitSender = normalizeValue(this.mailSenderProperties.getFrom());
        if (StringUtils.hasText(explicitSender)) {
            return explicitSender;
        }
        return normalizeValue(this.mailProperties.getUsername());
    }

    private Map<String, Object> buildTemplateVariables(Map<String, Object> customVariables) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("appName", normalizeText(this.mailTemplateProperties.getAppName()));
        variables.put("portalUrl", normalizeText(this.mailTemplateProperties.getPortalUrl()));
        variables.put("supportEmail", normalizeText(this.mailTemplateProperties.getSupportEmail()));
        variables.put("currentYear", Year.now().getValue());

        if (customVariables != null && !customVariables.isEmpty()) {
            variables.putAll(customVariables);
        }
        return variables;
    }

    private String normalizeTemplateName(String templateName) throws MailDeliveryException {
        String normalized = normalizeText(templateName).replace("\\", "/");
        if (!StringUtils.hasText(normalized)) {
            throw new MailDeliveryException("MAIL_TEMPLATE_INVALID", "Tên template email không hợp lệ.");
        }
        if (normalized.contains("..")) {
            throw new MailDeliveryException("MAIL_TEMPLATE_INVALID", "Tên template email không hợp lệ.");
        }
        if (normalized.endsWith(".html")) {
            normalized = normalized.substring(0, normalized.length() - 5);
        }
        return normalized;
    }

    private String normalizeAndValidateEmail(
            String candidate,
            String role,
            String errorCode
    ) throws MailDeliveryException {
        String normalized = normalizeValue(candidate).toLowerCase(Locale.ROOT);
        if (!StringUtils.hasText(normalized)) {
            throw new MailDeliveryException(errorCode, "Email " + role + " không hợp lệ.");
        }

        try {
            InternetAddress address = new InternetAddress(normalized, false);
            address.validate();
            return address.getAddress();
        } catch (Exception ex) {
            throw new MailDeliveryException(errorCode, "Email " + role + " không hợp lệ.", ex);
        }
    }

    private String normalizeText(String value) {
        return normalizeValue(value);
    }

    private String normalizeValue(String value) {
        return value == null ? "" : value.trim();
    }

    private String maskEmail(String email) {
        String normalized = normalizeValue(email).toLowerCase(Locale.ROOT);
        int atIndex = normalized.indexOf('@');
        if (atIndex <= 1 || atIndex == normalized.length() - 1) {
            return "***";
        }

        String localPart = normalized.substring(0, atIndex);
        String domainPart = normalized.substring(atIndex + 1);
        return localPart.substring(0, 1) + "***@" + domainPart;
    }
}
