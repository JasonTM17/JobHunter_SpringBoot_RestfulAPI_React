package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.domain.Skill;
import com.vn.son.jobhunter.domain.Subscriber;
import com.vn.son.jobhunter.repository.JobRepository;
import com.vn.son.jobhunter.repository.SkillRepository;
import com.vn.son.jobhunter.repository.SubscriberRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriberServiceTest {
    @Mock
    private SubscriberRepository subscriberRepository;

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private JobRepository jobRepository;

    @InjectMocks
    private SubscriberService subscriberService;

    @Test
    void isExistsByEmailShouldNormalizeBeforeCheckingDuplicate() {
        when(subscriberRepository.existsByEmail("candidate@jobhunter.local")).thenReturn(true);

        boolean exists = subscriberService.isExistsByEmail(" Candidate@Jobhunter.Local ");

        assertEquals(true, exists);
        verify(subscriberRepository).existsByEmail("candidate@jobhunter.local");
    }

    @Test
    void createShouldNormalizeSubscriberAndResolveSkillIds() {
        Skill requestedSkill = new Skill();
        requestedSkill.setId(1L);

        Skill resolvedSkill = new Skill();
        resolvedSkill.setId(1L);
        resolvedSkill.setName("React");

        Subscriber request = new Subscriber();
        request.setEmail(" Candidate@Jobhunter.Local ");
        request.setName(" Candidate One ");
        request.setSkills(List.of(requestedSkill));

        when(skillRepository.findByIdIn(List.of(1L))).thenReturn(List.of(resolvedSkill));
        when(subscriberRepository.save(any(Subscriber.class))).thenAnswer(invocation -> invocation.getArgument(0));

        subscriberService.create(request);

        ArgumentCaptor<Subscriber> captor = ArgumentCaptor.forClass(Subscriber.class);
        verify(subscriberRepository).save(captor.capture());
        Subscriber saved = captor.getValue();

        assertEquals("candidate@jobhunter.local", saved.getEmail());
        assertEquals("Candidate One", saved.getName());
        assertEquals(List.of(resolvedSkill), saved.getSkills());
        assertNotNull(saved.getUnsubscribeToken());
        assertFalse(saved.getUnsubscribeToken().isBlank());
        assertNull(saved.getUnsubscribedAt());
    }

    @Test
    void updateShouldReactivateUnsubscribedSubscriberAndKeepToken() {
        Skill requestedSkill = new Skill();
        requestedSkill.setId(2L);

        Skill resolvedSkill = new Skill();
        resolvedSkill.setId(2L);
        resolvedSkill.setName("Java");

        Subscriber existing = new Subscriber();
        existing.setEmail("candidate@jobhunter.local");
        existing.setName("Old Name");
        existing.setUnsubscribeToken("existing-token");
        existing.setUnsubscribedAt(Instant.parse("2026-04-01T08:00:00Z"));

        Subscriber request = new Subscriber();
        request.setName(" Candidate Updated ");
        request.setSkills(List.of(requestedSkill));

        when(skillRepository.findByIdIn(List.of(2L))).thenReturn(List.of(resolvedSkill));
        when(subscriberRepository.save(any(Subscriber.class))).thenAnswer(invocation -> invocation.getArgument(0));

        subscriberService.update(existing, request);

        ArgumentCaptor<Subscriber> captor = ArgumentCaptor.forClass(Subscriber.class);
        verify(subscriberRepository).save(captor.capture());
        Subscriber saved = captor.getValue();

        assertEquals("Candidate Updated", saved.getName());
        assertEquals("existing-token", saved.getUnsubscribeToken());
        assertNull(saved.getUnsubscribedAt());
        assertEquals(List.of(resolvedSkill), saved.getSkills());
    }

    @Test
    void unsubscribeShouldMarkSubscriberWhenTokenExists() {
        Subscriber existing = new Subscriber();
        existing.setEmail("candidate@jobhunter.local");
        existing.setUnsubscribeToken("token-123");

        when(subscriberRepository.findByUnsubscribeToken("token-123")).thenReturn(Optional.of(existing));
        when(subscriberRepository.save(any(Subscriber.class))).thenAnswer(invocation -> invocation.getArgument(0));

        boolean unsubscribed = subscriberService.unsubscribe(" token-123 ");

        assertTrue(unsubscribed);
        assertNotNull(existing.getUnsubscribedAt());
        verify(subscriberRepository).save(existing);
    }

    @Test
    void unsubscribeShouldReturnFalseForBlankOrUnknownToken() {
        assertFalse(subscriberService.unsubscribe(" "));

        when(subscriberRepository.findByUnsubscribeToken("missing")).thenReturn(Optional.empty());

        assertFalse(subscriberService.unsubscribe("missing"));
    }
}
