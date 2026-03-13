package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.config.properties.MailTemplateProperties;
import com.vn.son.jobhunter.config.properties.SchedulerProperties;
import com.vn.son.jobhunter.domain.Company;
import com.vn.son.jobhunter.domain.Job;
import com.vn.son.jobhunter.domain.Resume;
import com.vn.son.jobhunter.domain.Skill;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.res.email.WeeklyRecommendationTriggerResponse;
import com.vn.son.jobhunter.repository.JobRepository;
import com.vn.son.jobhunter.repository.ResumeRepository;
import com.vn.son.jobhunter.repository.SubscriberRepository;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.repository.WeeklyRecommendationDispatchRepository;
import com.vn.son.jobhunter.util.constant.LevelEnum;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WeeklyRecommendationSchedulerServiceTest {

    @Mock
    private EmailService emailService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ResumeRepository resumeRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private SubscriberRepository subscriberRepository;

    @Mock
    private WeeklyRecommendationDispatchRepository dispatchRepository;

    @Mock
    private Environment environment;

    private SchedulerProperties schedulerProperties;
    private WeeklyRecommendationSchedulerService service;

    @BeforeEach
    void setUp() {
        schedulerProperties = new SchedulerProperties();
        schedulerProperties.setEnabled(true);
        schedulerProperties.getWeeklyRecommendation().setEnabled(true);
        schedulerProperties.getWeeklyRecommendation().setMaxJobsPerUser(5);
        schedulerProperties.getWeeklyRecommendation().setRecentApplyDays(180);
        schedulerProperties.getWeeklyRecommendation().setFallbackEnabled(true);
        schedulerProperties.getWeeklyRecommendation().setManualTriggerEnabled(true);
        schedulerProperties.getWeeklyRecommendation().setCandidatePageSize(50);
        schedulerProperties.getWeeklyRecommendation().setMaxCandidatesPerRun(500);

        MailTemplateProperties mailTemplateProperties = new MailTemplateProperties();
        mailTemplateProperties.setPortalUrl("http://localhost:3000");

        service = new WeeklyRecommendationSchedulerService(
                schedulerProperties,
                mailTemplateProperties,
                emailService,
                userRepository,
                resumeRepository,
                jobRepository,
                subscriberRepository,
                dispatchRepository,
                environment
        );
    }

    @Test
    void triggerManuallyShouldSkipWhenWeeklyRecommendationDisabled() throws Exception {
        schedulerProperties.getWeeklyRecommendation().setEnabled(false);

        WeeklyRecommendationTriggerResponse response = service.triggerManually();

        assertEquals("SKIPPED", response.getStatus());
        assertEquals("WEEKLY_RECOMMENDATION_DISABLED", response.getCode());
        verify(emailService, never()).sendTemplateEmail(anyString(), anyString(), anyString(), any());
    }

    @Test
    void triggerManuallyShouldSkipWhenMailNotConfigured() throws Exception {
        when(emailService.isMailConfigured()).thenReturn(false);

        WeeklyRecommendationTriggerResponse response = service.triggerManually();

        assertEquals("SKIPPED", response.getStatus());
        assertEquals("MAIL_NOT_CONFIGURED", response.getCode());
        verify(emailService, never()).sendTemplateEmail(anyString(), anyString(), anyString(), any());
    }

    @Test
    void triggerManuallyShouldSkipWhenManualTriggerNotAllowedForCurrentProfile() {
        schedulerProperties.getWeeklyRecommendation().setManualTriggerEnabled(false);
        schedulerProperties.getWeeklyRecommendation().setManualTriggerAllowedProfiles("dev,local");
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
        when(emailService.isMailConfigured()).thenReturn(true);

        WeeklyRecommendationTriggerResponse response = service.triggerManually();

        assertEquals("SKIPPED", response.getStatus());
        assertEquals("MANUAL_TRIGGER_DISABLED", response.getCode());
    }

    @Test
    void triggerManuallyShouldSendRecommendationForCandidate() throws Exception {
        when(emailService.isMailConfigured()).thenReturn(true);

        User candidate = new User();
        candidate.setId(1L);
        candidate.setName("Nguyen Minh Anh");
        candidate.setEmail("candidate01@jobhunter.local");
        when(userRepository.findByRole_NameIgnoreCaseAndWeeklyJobRecommendationEnabledTrue(eq("USER"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(candidate)));

        Skill javaSkill = new Skill();
        javaSkill.setName("Java");

        Job appliedJob = new Job();
        appliedJob.setId(20L);
        appliedJob.setName("Java Spring Developer");
        appliedJob.setSkills(List.of(javaSkill));

        Resume resume = new Resume();
        resume.setUser(candidate);
        resume.setJob(appliedJob);
        resume.setCreatedDate(Instant.now().minusSeconds(7 * 24L * 3600L));
        when(resumeRepository.findByUserIdsWithJobDetails(List.of(1L))).thenReturn(List.of(resume));

        Company company = new Company();
        company.setName("Acme Technology");

        Job recommendedJob = new Job();
        recommendedJob.setId(10L);
        recommendedJob.setName("Backend Java Developer");
        recommendedJob.setCompany(company);
        recommendedJob.setSkills(List.of(javaSkill));
        recommendedJob.setLocation("HANOI");
        recommendedJob.setLevel(LevelEnum.JUNIOR);
        recommendedJob.setSalary(25000000);
        recommendedJob.setActive(true);
        recommendedJob.setStartDate(Instant.now().minusSeconds(3600));
        recommendedJob.setEndDate(Instant.now().plusSeconds(7 * 24L * 3600L));
        when(jobRepository.findOpenJobs(any(Instant.class))).thenReturn(List.of(recommendedJob));

        when(dispatchRepository.findEmailsByWeekKey(anyString())).thenReturn(List.of());
        when(subscriberRepository.findByEmailIn(List.of("candidate01@jobhunter.local"))).thenReturn(List.of());

        WeeklyRecommendationTriggerResponse response = service.triggerManually();

        assertEquals("SUCCESS", response.getStatus());
        assertEquals("WEEKLY_RECOMMENDATION_COMPLETED", response.getCode());
        assertEquals(1, response.getTotalCandidates());
        assertEquals(1, response.getEvaluatedCandidates());
        assertEquals(1, response.getSentCount());
        verify(emailService).sendTemplateEmail(
                eq("candidate01@jobhunter.local"),
                eq("Gợi ý việc làm dành cho bạn tuần này"),
                eq("mail/weekly-job-recommendation"),
                any()
        );
        verify(dispatchRepository).save(any());
    }

    @Test
    void triggerManuallyShouldSkipWhenCandidateAlreadyDispatchedThisWeek() throws Exception {
        when(emailService.isMailConfigured()).thenReturn(true);

        User candidate = new User();
        candidate.setId(1L);
        candidate.setName("Nguyen Minh Anh");
        candidate.setEmail("candidate01@jobhunter.local");
        when(userRepository.findByRole_NameIgnoreCaseAndWeeklyJobRecommendationEnabledTrue(eq("USER"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(candidate)));

        Job recommendedJob = new Job();
        recommendedJob.setId(10L);
        recommendedJob.setName("Backend Java Developer");
        recommendedJob.setLocation("HANOI");
        recommendedJob.setLevel(LevelEnum.JUNIOR);
        recommendedJob.setSalary(25000000);
        recommendedJob.setActive(true);
        recommendedJob.setStartDate(Instant.now().minusSeconds(3600));
        recommendedJob.setEndDate(Instant.now().plusSeconds(7 * 24L * 3600L));
        when(jobRepository.findOpenJobs(any(Instant.class))).thenReturn(List.of(recommendedJob));

        when(resumeRepository.findByUserIdsWithJobDetails(List.of(1L))).thenReturn(List.of());
        when(subscriberRepository.findByEmailIn(List.of("candidate01@jobhunter.local"))).thenReturn(List.of());
        when(dispatchRepository.findEmailsByWeekKey(anyString())).thenReturn(List.of("candidate01@jobhunter.local"));

        WeeklyRecommendationTriggerResponse response = service.triggerManually();

        assertEquals("SUCCESS", response.getStatus());
        assertEquals(1, response.getTotalCandidates());
        assertEquals(0, response.getEvaluatedCandidates());
        assertEquals(0, response.getSentCount());
        assertEquals(1, response.getSkippedCount());
        verify(emailService, never()).sendTemplateEmail(anyString(), anyString(), anyString(), any());
        verify(dispatchRepository, never()).save(any());
    }
}
