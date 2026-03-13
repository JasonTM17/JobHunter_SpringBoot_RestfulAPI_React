package com.vn.son.jobhunter.controller;

import com.vn.son.jobhunter.domain.Role;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.res.email.LogCleanupTriggerResponse;
import com.vn.son.jobhunter.domain.res.email.SchedulerTriggerResponse;
import com.vn.son.jobhunter.domain.res.email.WeeklyRecommendationTriggerResponse;
import com.vn.son.jobhunter.service.EmailService;
import com.vn.son.jobhunter.service.LogCleanupSchedulerService;
import com.vn.son.jobhunter.service.MailSchedulerService;
import com.vn.son.jobhunter.service.SubscriberService;
import com.vn.son.jobhunter.service.UserService;
import com.vn.son.jobhunter.service.WeeklyRecommendationSchedulerService;
import com.vn.son.jobhunter.util.error.GlobalException;
import com.vn.son.jobhunter.util.error.MailDeliveryException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class EmailControllerTest {

    @Mock
    private SubscriberService subscriberService;

    @Mock
    private EmailService emailService;

    @Mock
    private MailSchedulerService mailSchedulerService;

    @Mock
    private LogCleanupSchedulerService logCleanupSchedulerService;

    @Mock
    private WeeklyRecommendationSchedulerService weeklyRecommendationSchedulerService;

    @Mock
    private UserService userService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        User adminUser = new User();
        Role role = new Role();
        role.setName("ADMIN");
        adminUser.setRole(role);
        lenient().when(userService.getCurrentAuthenticatedUserOrThrow()).thenReturn(adminUser);

        EmailController emailController = new EmailController(
                subscriberService,
                emailService,
                logCleanupSchedulerService,
                mailSchedulerService,
                weeklyRecommendationSchedulerService,
                userService
        );

        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        this.mockMvc = MockMvcBuilders.standaloneSetup(emailController)
                .setControllerAdvice(new GlobalException())
                .setValidator(validator)
                .addPlaceholderValue("apiPrefix", "/api/v1")
                .build();
    }

    @Test
    void sendTestEmailShouldReturnBadRequestWhenPayloadInvalid() throws Exception {
        String invalidPayload = """
                {
                  "recipient": "",
                  "subject": "",
                  "body": ""
                }
                """;

        mockMvc.perform(post("/api/v1/email/test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));
    }

    @Test
    void sendTestEmailShouldReturnServiceUnavailableWhenMailNotConfigured() throws Exception {
        doThrow(new MailDeliveryException("MAIL_NOT_CONFIGURED", "Mail not ready"))
                .when(emailService)
                .sendTextEmail(anyString(), anyString(), anyString());

        String payload = """
                {
                  "recipient": "candidate01@jobhunter.local",
                  "subject": "Test mail",
                  "body": "Mail content",
                  "html": false
                }
                """;

        mockMvc.perform(post("/api/v1/email/test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("MAIL_NOT_CONFIGURED"));
    }

    @Test
    void sendTestEmailShouldReturnRecipientAndSenderWhenSuccess() throws Exception {
        when(emailService.getDefaultSenderAddress()).thenReturn("xiaozhongli1710@gmail.com");

        String payload = """
                {
                  "recipient": "candidate01@jobhunter.local",
                  "subject": "Test mail",
                  "body": "Mail content",
                  "html": false
                }
                """;

        mockMvc.perform(post("/api/v1/email/test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recipient").value("candidate01@jobhunter.local"))
                .andExpect(jsonPath("$.sender").value("xiaozhongli1710@gmail.com"))
                .andExpect(jsonPath("$.subject").value("Test mail"));
    }

    @Test
    void sendTestTemplateEmailShouldReturnBadRequestWhenPayloadInvalid() throws Exception {
        String invalidPayload = """
                {
                  "recipient": "invalid-email",
                  "subject": "",
                  "message": ""
                }
                """;

        mockMvc.perform(post("/api/v1/email/test-template")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));
    }

    @Test
    void sendTestTemplateEmailShouldReturnServiceUnavailableWhenMailNotConfigured() throws Exception {
        doThrow(new MailDeliveryException("MAIL_NOT_CONFIGURED", "Mail not ready"))
                .when(emailService)
                .sendTemplateEmail(anyString(), anyString(), anyString(), anyMap());

        String payload = """
                {
                  "recipient": "candidate01@jobhunter.local",
                  "recipientName": "Ung vien A",
                  "subject": "Kiem tra template",
                  "title": "Email thong bao tu Jobhunter",
                  "message": "Noi dung kiem tra template",
                  "actionText": "Mo Jobhunter",
                  "actionUrl": "http://localhost:3000"
                }
                """;

        mockMvc.perform(post("/api/v1/email/test-template")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("MAIL_NOT_CONFIGURED"));
    }

    @Test
    void sendTestTemplateEmailShouldReturnTemplateMetadataWhenSuccess() throws Exception {
        when(emailService.getDefaultSenderAddress()).thenReturn("xiaozhongli1710@gmail.com");

        String payload = """
                {
                  "recipient": "candidate01@jobhunter.local",
                  "recipientName": "Ung vien A",
                  "subject": "Kiem tra template",
                  "title": "Email thong bao tu Jobhunter",
                  "message": "Noi dung kiem tra template",
                  "actionText": "Mo Jobhunter",
                  "actionUrl": "http://localhost:3000"
                }
                """;

        mockMvc.perform(post("/api/v1/email/test-template")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recipient").value("candidate01@jobhunter.local"))
                .andExpect(jsonPath("$.sender").value("xiaozhongli1710@gmail.com"))
                .andExpect(jsonPath("$.subject").value("Kiem tra template"))
                .andExpect(jsonPath("$.templateName").value("mail/test-notification"));
    }

    @Test
    void triggerSchedulerMailHeartbeatShouldReturnExecutionState() throws Exception {
        SchedulerTriggerResponse response = new SchedulerTriggerResponse();
        response.setStatus("SKIPPED");
        response.setCode("MAIL_CRON_DISABLED");
        response.setMessage("Scheduler disabled");
        when(mailSchedulerService.triggerHeartbeatManually()).thenReturn(response);

        mockMvc.perform(post("/api/v1/email/scheduler/trigger"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SKIPPED"))
                .andExpect(jsonPath("$.code").value("MAIL_CRON_DISABLED"));
    }

    @Test
    void triggerWeeklyRecommendationShouldReturnExecutionState() throws Exception {
        WeeklyRecommendationTriggerResponse response = new WeeklyRecommendationTriggerResponse();
        response.setStatus("SUCCESS");
        response.setCode("WEEKLY_RECOMMENDATION_COMPLETED");
        response.setMessage("Done");
        when(weeklyRecommendationSchedulerService.triggerManually()).thenReturn(response);

        mockMvc.perform(post("/api/v1/email/recommendations/weekly/trigger"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.code").value("WEEKLY_RECOMMENDATION_COMPLETED"));
    }

    @Test
    void triggerLogCleanupShouldReturnExecutionState() throws Exception {
        LogCleanupTriggerResponse response = new LogCleanupTriggerResponse();
        response.setStatus("SUCCESS");
        response.setCode("LOG_CLEANUP_COMPLETED");
        response.setMessage("Done");
        when(logCleanupSchedulerService.triggerManually()).thenReturn(response);

        mockMvc.perform(post("/api/v1/email/logs/cleanup/trigger"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.code").value("LOG_CLEANUP_COMPLETED"));
    }

    @Test
    void triggerWeeklyRecommendationShouldReturnForbiddenForNonAdminRole() throws Exception {
        User candidate = new User();
        Role role = new Role();
        role.setName("USER");
        candidate.setRole(role);
        when(userService.getCurrentAuthenticatedUserOrThrow()).thenReturn(candidate);

        mockMvc.perform(post("/api/v1/email/recommendations/weekly/trigger"))
                .andExpect(status().isForbidden());
    }
}
