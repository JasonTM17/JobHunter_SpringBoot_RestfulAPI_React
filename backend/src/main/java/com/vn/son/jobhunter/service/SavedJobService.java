package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.domain.Job;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.repository.JobRepository;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.util.error.ResourceNotFoundException;
import com.vn.son.jobhunter.util.error.UnauthorizedException;
import com.vn.son.jobhunter.util.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class SavedJobService {
    private final UserRepository userRepository;
    private final JobRepository jobRepository;

    @Transactional(readOnly = true)
    public List<Job> getCurrentUserSavedJobs() throws UnauthorizedException {
        User currentUser = getCurrentAuthenticatedUserOrThrow();
        List<Job> savedJobs = currentUser.getSavedJobs() == null ? List.of() : currentUser.getSavedJobs();
        savedJobs.forEach(this::initializePublicJobRelations);
        return savedJobs.stream()
                .sorted(Comparator.comparing(Job::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @Transactional
    public List<Job> saveJob(Long jobId) throws Exception {
        User currentUser = getCurrentAuthenticatedUserOrThrow();
        Job job = findJobOrThrow(jobId);
        List<Job> savedJobs = ensureSavedJobs(currentUser);

        boolean alreadySaved = savedJobs.stream().anyMatch(item -> Objects.equals(item.getId(), job.getId()));
        if (!alreadySaved) {
            savedJobs.add(job);
            this.userRepository.save(currentUser);
        }

        return getCurrentUserSavedJobs();
    }

    @Transactional
    public List<Job> removeJob(Long jobId) throws Exception {
        User currentUser = getCurrentAuthenticatedUserOrThrow();
        findJobOrThrow(jobId);
        List<Job> savedJobs = ensureSavedJobs(currentUser);
        savedJobs.removeIf(item -> Objects.equals(item.getId(), jobId));
        this.userRepository.save(currentUser);
        return getCurrentUserSavedJobs();
    }

    private List<Job> ensureSavedJobs(User user) {
        if (user.getSavedJobs() == null) {
            user.setSavedJobs(new ArrayList<>());
        }
        return user.getSavedJobs();
    }

    private Job findJobOrThrow(Long jobId) throws ResourceNotFoundException {
        if (jobId == null || jobId <= 0) {
            throw new ResourceNotFoundException("Job not found");
        }
        return this.jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
    }

    private User getCurrentAuthenticatedUserOrThrow() throws UnauthorizedException {
        String email = SecurityUtils.getCurrentUserLogin().orElse("");
        if (email.isBlank()) {
            throw new UnauthorizedException("Access token is not valid");
        }
        return this.userRepository.findOneByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Access token is not valid"));
    }

    private void initializePublicJobRelations(Job job) {
        if (job.getCompany() != null) {
            job.getCompany().getName();
        }
        if (job.getSkills() != null) {
            job.getSkills().size();
        }
    }
}
