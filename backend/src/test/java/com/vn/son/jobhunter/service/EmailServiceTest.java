package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.config.properties.MailSenderProperties;
import com.vn.son.jobhunter.config.properties.MailTemplateProperties;
import com.vn.son.jobhunter.util.error.MailDeliveryException;
import jakarta.mail.Message;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.mail.autoconfigure.MailProperties;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private ObjectProvider<JavaMailSender> javaMailSenderProvider;

    @Mock
    private SpringTemplateEngine templateEngine;

    @Mock
    private JavaMailSender javaMailSender;

    private MailSenderProperties mailSenderProperties;
    private MailTemplateProperties mailTemplateProperties;
    private MailProperties mailProperties;
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        mailSenderProperties = new MailSenderProperties();
        mailSenderProperties.setEnabled(true);
        mailSenderProperties.setFrom("xiaozhongli1710@gmail.com");

        mailProperties = new MailProperties();
        mailProperties.setUsername("xiaozhongli1710@gmail.com");
        mailProperties.setPassword("app-password");

        mailTemplateProperties = new MailTemplateProperties();
        mailTemplateProperties.setAppName("Jobhunter");
        mailTemplateProperties.setPortalUrl("http://localhost:3000");
        mailTemplateProperties.setSupportEmail("support@jobhunter.local");

        emailService = new EmailService(
                javaMailSenderProvider,
                templateEngine,
                mailProperties,
                mailSenderProperties,
                mailTemplateProperties
        );
    }

    @Test
    void sendTextEmailShouldThrowWhenMailPasswordMissing() {
        mailProperties.setPassword("");

        MailDeliveryException exception = assertThrows(
                MailDeliveryException.class,
                () -> emailService.sendTextEmail("candidate01@jobhunter.local", "Test", "Body")
        );

        assertEquals("MAIL_NOT_CONFIGURED", exception.getErrorCode());
        verifyNoInteractions(javaMailSender);
    }

    @Test
    void sendTextEmailShouldThrowWhenRecipientInvalid() {
        when(javaMailSenderProvider.getIfAvailable()).thenReturn(javaMailSender);

        MailDeliveryException exception = assertThrows(
                MailDeliveryException.class,
                () -> emailService.sendTextEmail("invalid-recipient", "Test", "Body")
        );

        assertEquals("MAIL_INVALID_RECIPIENT", exception.getErrorCode());
        verifyNoInteractions(javaMailSender);
    }

    @Test
    void sendTextEmailShouldSendWithConfiguredSender() throws Exception {
        MimeMessage mimeMessage = new JavaMailSenderImpl().createMimeMessage();

        when(javaMailSenderProvider.getIfAvailable()).thenReturn(javaMailSender);
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendTextEmail("candidate01@jobhunter.local", "Test subject", "Hello from Jobhunter");

        ArgumentCaptor<MimeMessage> messageCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(javaMailSender).send(messageCaptor.capture());

        MimeMessage sent = messageCaptor.getValue();
        assertNotNull(sent);
        assertEquals("Test subject", sent.getSubject());
        assertEquals("xiaozhongli1710@gmail.com", ((InternetAddress) sent.getFrom()[0]).getAddress());
        assertEquals(
                "candidate01@jobhunter.local",
                ((InternetAddress) sent.getRecipients(Message.RecipientType.TO)[0]).getAddress()
        );
    }

    @Test
    void sendTemplateEmailShouldRenderHtmlTemplateAndSend() throws Exception {
        MimeMessage mimeMessage = new JavaMailSenderImpl().createMimeMessage();

        when(javaMailSenderProvider.getIfAvailable()).thenReturn(javaMailSender);
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("mail/test-notification"), any(Context.class)))
                .thenReturn("<html><body><h1>Xin chào</h1></body></html>");

        emailService.sendTemplateEmail(
                "candidate01@jobhunter.local",
                "Thông báo kiểm tra",
                "mail/test-notification",
                Map.of("recipientName", "Ứng viên A")
        );

        verify(templateEngine).process(eq("mail/test-notification"), any(Context.class));
        verify(javaMailSender).send(any(MimeMessage.class));
        assertTrue(String.valueOf(mimeMessage.getContent()).contains("Xin chào"));
    }

    @Test
    void sendTemplateEmailShouldThrowWhenTemplateRenderFails() {
        when(templateEngine.process(eq("mail/test-notification"), any(Context.class)))
                .thenThrow(new RuntimeException("Render failed"));

        MailDeliveryException exception = assertThrows(
                MailDeliveryException.class,
                () -> emailService.sendTemplateEmail(
                        "candidate01@jobhunter.local",
                        "Thông báo kiểm tra",
                        "mail/test-notification",
                        Map.of("recipientName", "Ứng viên A")
                )
        );

        assertEquals("MAIL_TEMPLATE_RENDER_FAILED", exception.getErrorCode());
    }

    @Test
    void getDefaultSenderAddressShouldFallbackToSpringMailUsernameWhenFromIsBlank() {
        mailSenderProperties.setFrom(" ");
        assertEquals("xiaozhongli1710@gmail.com", emailService.getDefaultSenderAddress());
    }
}
