package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.config.properties.SchedulerProperties;
import com.vn.son.jobhunter.domain.res.email.SchedulerTriggerResponse;
import com.vn.son.jobhunter.util.error.MailDeliveryException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MailSchedulerServiceTest {

    @Mock
    private EmailService emailService;

    @Mock
    private Environment environment;

    private SchedulerProperties schedulerProperties;
    private MailSchedulerService mailSchedulerService;

    @BeforeEach
    void setUp() {
        schedulerProperties = new SchedulerProperties();
        schedulerProperties.setEnabled(true);
        schedulerProperties.getMail().setEnabled(true);
        schedulerProperties.getMail().setRecipient("ops@jobhunter.local");
        schedulerProperties.getMail().setTemplate("mail/scheduler-heartbeat");

        mailSchedulerService = new MailSchedulerService(
                schedulerProperties,
                emailService,
                environment
        );
    }

    @Test
    void triggerManuallyShouldSkipWhenMailCronDisabled() throws Exception {
        schedulerProperties.getMail().setEnabled(false);

        SchedulerTriggerResponse response = mailSchedulerService.triggerHeartbeatManually();

        assertEquals("SKIPPED", response.getStatus());
        assertEquals("MAIL_CRON_DISABLED", response.getCode());
        verify(emailService, never()).sendTemplateEmail(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                anyMap()
        );
    }

    @Test
    void triggerManuallyShouldSkipWhenRecipientMissing() {
        schedulerProperties.getMail().setRecipient(" ");

        SchedulerTriggerResponse response = mailSchedulerService.triggerHeartbeatManually();

        assertEquals("SKIPPED", response.getStatus());
        assertEquals("MAIL_CRON_RECIPIENT_MISSING", response.getCode());
    }

    @Test
    void triggerManuallyShouldSkipWhenMailNotConfigured() {
        when(emailService.isMailConfigured()).thenReturn(false);

        SchedulerTriggerResponse response = mailSchedulerService.triggerHeartbeatManually();

        assertEquals("SKIPPED", response.getStatus());
        assertEquals("MAIL_NOT_CONFIGURED", response.getCode());
    }

    @Test
    void triggerManuallyShouldSendTemplateWhenConfigured() throws Exception {
        when(emailService.isMailConfigured()).thenReturn(true);
        when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});

        SchedulerTriggerResponse response = mailSchedulerService.triggerHeartbeatManually();

        assertEquals("SUCCESS", response.getStatus());
        assertEquals("MAIL_SENT", response.getCode());
        verify(emailService).sendTemplateEmail(
                eq("ops@jobhunter.local"),
                org.mockito.ArgumentMatchers.contains("Heartbeat"),
                eq("mail/scheduler-heartbeat"),
                anyMap()
        );
    }

    @Test
    void triggerManuallyShouldReturnFailedWhenMailSendFails() throws Exception {
        when(emailService.isMailConfigured()).thenReturn(true);
        when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});
        doThrow(new MailDeliveryException("MAIL_SEND_FAILED", "failed"))
                .when(emailService)
                .sendTemplateEmail(eq("ops@jobhunter.local"), org.mockito.ArgumentMatchers.anyString(), eq("mail/scheduler-heartbeat"), anyMap());

        SchedulerTriggerResponse response = mailSchedulerService.triggerHeartbeatManually();

        assertEquals("FAILED", response.getStatus());
        assertEquals("MAIL_SEND_FAILED", response.getCode());
        assertTrue(response.getMessage().contains("email scheduler"));
    }
}
