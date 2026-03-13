package com.vn.son.jobhunter.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.nio.charset.StandardCharsets;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {
    private final ObjectProvider<JavaMailSender> javaMailSenderProvider;
    private final SpringTemplateEngine templateEngine;

    public void sendEmailSync(String to, String subject, String content, boolean isMultipart,
                              boolean isHtml) {
        JavaMailSender javaMailSender = this.javaMailSenderProvider.getIfAvailable();
        if (javaMailSender == null) {
            log.warn("JavaMailSender is not configured. Skip sending email to {}", to);
            return;
        }

        // Prepare message using a Spring helper
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        try {
            MimeMessageHelper message = new MimeMessageHelper(mimeMessage,
                    isMultipart, StandardCharsets.UTF_8.name());
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content, isHtml);
            javaMailSender.send(mimeMessage);
        } catch (MailException | MessagingException e) {
            log.error("Failed to send email to {} with subject '{}': {}", to, subject, e.getMessage());
            log.debug("Email send exception detail", e);
        }
    }

    @Async
    public void sendEmailFromTemplateSync(String to, String subject, String
            templateName, String username, Object value) {
        Context context = new Context();
        context.setVariable("name", username);
        context.setVariable("jobs", value);

        String content = this.templateEngine.process(templateName, context);
        this.sendEmailSync(to, subject, content, false, true);
    }
}
