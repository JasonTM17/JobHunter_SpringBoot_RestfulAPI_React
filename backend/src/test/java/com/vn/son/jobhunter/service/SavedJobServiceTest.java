package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.domain.Company;
import com.vn.son.jobhunter.domain.Job;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.repository.JobRepository;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.util.constant.GenderEnum;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SavedJobServiceTest {
    @Mock
    private UserRepository userRepository;

    @Mock
    private JobRepository jobRepository;

    @InjectMocks
    private SavedJobService savedJobService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void saveJobShouldAttachJobToCurrentAccountOnlyOnce() throws Exception {
        String email = "candidate@jobhunter.local";
        authenticate(email);
        User user = buildUser(7L, email);
        Job job = buildJob(48L);

        when(userRepository.findOneByEmail(email)).thenReturn(Optional.of(user));
        when(jobRepository.findById(48L)).thenReturn(Optional.of(job));
        when(userRepository.save(user)).thenReturn(user);

        savedJobService.saveJob(48L);
        savedJobService.saveJob(48L);

        assertEquals(1, user.getSavedJobs().size());
        assertEquals(48L, user.getSavedJobs().get(0).getId());
        verify(userRepository).save(user);
    }

    @Test
    void removeJobShouldDetachSavedJobFromCurrentAccount() throws Exception {
        String email = "candidate@jobhunter.local";
        authenticate(email);
        User user = buildUser(7L, email);
        Job job = buildJob(48L);
        user.getSavedJobs().add(job);

        when(userRepository.findOneByEmail(email)).thenReturn(Optional.of(user));
        when(jobRepository.findById(48L)).thenReturn(Optional.of(job));
        when(userRepository.save(user)).thenReturn(user);

        savedJobService.removeJob(48L);

        assertEquals(0, user.getSavedJobs().size());
        verify(userRepository).save(user);
    }

    private static void authenticate(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, "n/a", new ArrayList<>())
        );
    }

    private static User buildUser(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setName("Test User");
        user.setPassword("password");
        user.setAge(25);
        user.setGender(GenderEnum.MALE);
        user.setSavedJobs(new ArrayList<>());
        return user;
    }

    private static Job buildJob(Long id) {
        Company company = new Company();
        company.setId(3L);
        company.setName("Company 3");

        Job job = new Job();
        job.setId(id);
        job.setName("Backend Engineer");
        job.setLocation("HANOI");
        job.setQuantity(1);
        job.setCompany(company);
        job.setSkills(new ArrayList<>());
        return job;
    }
}
