package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.domain.Company;
import com.vn.son.jobhunter.domain.Job;
import com.vn.son.jobhunter.domain.Resume;
import com.vn.son.jobhunter.domain.Role;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.dto.resume.ResumeCreateDTO;
import com.vn.son.jobhunter.repository.JobRepository;
import com.vn.son.jobhunter.repository.ResumeRepository;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.util.constant.GenderEnum;
import com.vn.son.jobhunter.util.constant.ResumeStateEnum;
import com.vn.son.jobhunter.util.error.ConflictException;
import com.vn.son.jobhunter.util.error.ForbiddenException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResumeServiceTest {
    @Mock
    private ResumeRepository resumeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JobRepository jobRepository;

    @InjectMocks
    private ResumeService resumeService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createShouldUseAuthenticatedUserAndDefaultPendingStatus() throws Exception {
        String email = "candidate@jobhunter.local";
        authenticate(email);

        User currentUser = buildUser(7L, email, "USER", null);
        Job job = buildJob(11L, buildCompany(3L));

        ResumeCreateDTO request = new ResumeCreateDTO();
        request.setJobId(job.getId());
        request.setUrl(" https://example.com/cv.pdf ");

        when(userRepository.findOneByEmail(email)).thenReturn(Optional.of(currentUser));
        when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));
        when(resumeRepository.existsByUser_IdAndJob_Id(currentUser.getId(), job.getId())).thenReturn(false);
        when(resumeRepository.save(any(Resume.class))).thenAnswer(invocation -> {
            Resume saved = invocation.getArgument(0);
            saved.setId(99L);
            return saved;
        });

        resumeService.create(request);

        ArgumentCaptor<Resume> captor = ArgumentCaptor.forClass(Resume.class);
        verify(resumeRepository).save(captor.capture());
        Resume saved = captor.getValue();
        assertEquals(email, saved.getEmail());
        assertEquals("https://example.com/cv.pdf", saved.getUrl());
        assertEquals(ResumeStateEnum.PENDING, saved.getStatus());
        assertSame(currentUser, saved.getUser());
        assertSame(job, saved.getJob());
    }

    @Test
    void createShouldRejectDuplicateApplicationForSameUserAndJob() {
        String email = "candidate@jobhunter.local";
        authenticate(email);

        User currentUser = buildUser(7L, email, "USER", null);
        Job job = buildJob(11L, buildCompany(3L));

        ResumeCreateDTO request = new ResumeCreateDTO();
        request.setJobId(job.getId());
        request.setUrl("https://example.com/cv.pdf");

        when(userRepository.findOneByEmail(email)).thenReturn(Optional.of(currentUser));
        when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));
        when(resumeRepository.existsByUser_IdAndJob_Id(currentUser.getId(), job.getId())).thenReturn(true);

        assertThrows(ConflictException.class, () -> resumeService.create(request));
    }

    @Test
    void updateStatusShouldRejectCandidateEvenForOwnResume() {
        String email = "candidate@jobhunter.local";
        authenticate(email);

        Company company = buildCompany(3L);
        User currentUser = buildUser(7L, email, "USER", null);
        Resume resume = buildResume(99L, currentUser, buildJob(11L, company));

        when(userRepository.findOneByEmail(email)).thenReturn(Optional.of(currentUser));
        when(resumeRepository.findById(99L)).thenReturn(Optional.of(resume));

        assertThrows(ForbiddenException.class, () -> resumeService.updateStatus(99L, ResumeStateEnum.APPROVED));
    }

    private static void authenticate(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, "n/a", new ArrayList<>())
        );
    }

    private static User buildUser(Long id, String email, String roleName, Company company) {
        Role role = new Role();
        role.setId(id == null ? 1L : id);
        role.setName(roleName);

        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setName("Test User");
        user.setPassword("password");
        user.setAge(25);
        user.setGender(GenderEnum.MALE);
        user.setRole(role);
        user.setCompany(company);
        return user;
    }

    private static Company buildCompany(long id) {
        Company company = new Company();
        company.setId(id);
        company.setName("Company " + id);
        return company;
    }

    private static Job buildJob(Long id, Company company) {
        Job job = new Job();
        job.setId(id);
        job.setName("Backend Engineer");
        job.setLocation("HANOI");
        job.setQuantity(1);
        job.setCompany(company);
        return job;
    }

    private static Resume buildResume(long id, User user, Job job) {
        Resume resume = new Resume();
        resume.setId(id);
        resume.setEmail(user.getEmail());
        resume.setUrl("https://example.com/cv.pdf");
        resume.setStatus(ResumeStateEnum.PENDING);
        resume.setUser(user);
        resume.setJob(job);
        return resume;
    }
}
