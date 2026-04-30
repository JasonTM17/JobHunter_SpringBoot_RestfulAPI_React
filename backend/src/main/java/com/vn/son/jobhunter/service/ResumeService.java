package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.domain.Company;
import com.vn.son.jobhunter.domain.Job;
import com.vn.son.jobhunter.domain.Resume;
import com.vn.son.jobhunter.domain.User;
import com.vn.son.jobhunter.domain.dto.resume.ResumeCreateDTO;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.domain.res.resume.CreatedResumeResponse;
import com.vn.son.jobhunter.domain.res.resume.UpdatedResumeResponse;
import com.vn.son.jobhunter.repository.JobRepository;
import com.vn.son.jobhunter.repository.ResumeRepository;
import com.vn.son.jobhunter.repository.UserRepository;
import com.vn.son.jobhunter.util.constant.ResumeStateEnum;
import com.vn.son.jobhunter.util.convert.ResumeConvert;
import com.vn.son.jobhunter.util.error.BadRequestException;
import com.vn.son.jobhunter.util.error.ConflictException;
import com.vn.son.jobhunter.util.error.ForbiddenException;
import com.vn.son.jobhunter.util.error.ResourceNotFoundException;
import com.vn.son.jobhunter.util.error.UnauthorizedException;
import com.vn.son.jobhunter.util.response.FormatResultPagaination;
import com.vn.son.jobhunter.util.security.SecurityUtils;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Objects;

@RequiredArgsConstructor
@Service
public class ResumeService {
    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;

    @Transactional
    public CreatedResumeResponse create(ResumeCreateDTO request) throws Exception {
        User currentUser = getCurrentAuthenticatedUserOrThrow();
        Job job = this.jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        String url = normalizeUrl(request.getUrl());

        if (this.resumeRepository.existsByUser_IdAndJob_Id(currentUser.getId(), job.getId())) {
            throw new ConflictException("Bạn đã ứng tuyển công việc này.");
        }

        Resume resume = new Resume();
        resume.setEmail(currentUser.getEmail());
        resume.setUrl(url);
        resume.setStatus(ResumeStateEnum.PENDING);
        resume.setUser(currentUser);
        resume.setJob(job);

        return ResumeConvert.convertToResCreatedResumeRes(this.resumeRepository.save(resume));
    }

    @Transactional(readOnly = true)
    public Resume fetchResumelById(Long id) throws Exception {
        User currentUser = getCurrentAuthenticatedUserOrThrow();
        Resume resume = findResumeByIdOrThrow(id);
        ensureCanAccessResume(currentUser, resume);
        return resume;
    }

    @Transactional
    public UpdatedResumeResponse update(Resume resume) throws Exception {
        if (resume == null || resume.getId() <= 0) {
            throw new BadRequestException("Resume ID is required");
        }
        return updateStatus(resume.getId(), resume.getStatus());
    }

    @Transactional
    public UpdatedResumeResponse updateStatus(Long id, ResumeStateEnum status) throws Exception {
        if (status == null) {
            throw new BadRequestException("Status is required");
        }

        User currentUser = getCurrentAuthenticatedUserOrThrow();
        Resume currentResume = findResumeByIdOrThrow(id);
        ensureCanManageResume(currentUser, currentResume);
        currentResume.setStatus(status);
        return ResumeConvert.convertToResUpdatedResumeRes(this.resumeRepository.save(currentResume));
    }

    @Transactional
    public void delete(Long id) throws Exception {
        User currentUser = getCurrentAuthenticatedUserOrThrow();
        Resume currentResume = findResumeByIdOrThrow(id);
        ensureCanManageResume(currentUser, currentResume);
        this.resumeRepository.deleteById(currentResume.getId());
    }

    @Transactional(readOnly = true)
    public ResultPaginationResponse fetchAllResume(Specification<Resume> spec, Pageable pageable) throws Exception {
        User currentUser = getCurrentAuthenticatedUserOrThrow();
        Specification<Resume> finalSpec = combine(scopedSpecificationFor(currentUser), spec);
        Page<Resume> resumePage = this.resumeRepository.findAll(finalSpec, pageable);
        return FormatResultPagaination.createPaginateResumeRes(resumePage);
    }

    @Transactional(readOnly = true)
    public ResultPaginationResponse fetchResumeByUser(Pageable pageable) throws Exception {
        User currentUser = getCurrentAuthenticatedUserOrThrow();
        Specification<Resume> spec = (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.join("user", JoinType.LEFT).get("id"), currentUser.getId());
        Page<Resume> resumePage = this.resumeRepository.findAll(spec, pageable);
        return FormatResultPagaination.createPaginateResumeRes(resumePage);
    }

    private Resume findResumeByIdOrThrow(Long id) throws ResourceNotFoundException {
        if (id == null || id <= 0) {
            throw new ResourceNotFoundException("Resume not found");
        }
        return this.resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found"));
    }

    private User getCurrentAuthenticatedUserOrThrow() throws UnauthorizedException {
        String email = SecurityUtils.getCurrentUserLogin().orElse("");
        if (email.isBlank()) {
            throw new UnauthorizedException("Access token is not valid");
        }
        return this.userRepository.findOneByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Access token is not valid"));
    }

    private String normalizeUrl(String rawUrl) throws BadRequestException {
        String url = rawUrl == null ? "" : rawUrl.trim();
        if (url.isBlank()) {
            throw new BadRequestException("Url is required");
        }
        if (url.length() > 500) {
            throw new BadRequestException("Url must be at most 500 characters");
        }
        return url;
    }

    private Specification<Resume> scopedSpecificationFor(User user) {
        if (isElevatedAdmin(user)) {
            return null;
        }

        if (isRecruiter(user)) {
            Company company = user.getCompany();
            if (company == null) {
                return emptySpec();
            }
            Long companyId = company.getId();
            return (root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(
                            root.join("job", JoinType.LEFT).join("company", JoinType.LEFT).get("id"),
                            companyId
                    );
        }

        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.join("user", JoinType.LEFT).get("id"), user.getId());
    }

    private Specification<Resume> combine(Specification<Resume> first, Specification<Resume> second) {
        if (first == null) return second;
        if (second == null) return first;
        return first.and(second);
    }

    private Specification<Resume> emptySpec() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.disjunction();
    }

    private void ensureCanAccessResume(User user, Resume resume) throws ForbiddenException {
        if (isElevatedAdmin(user) || isOwner(user, resume) || isRecruiterForResumeCompany(user, resume)) {
            return;
        }
        throw new ForbiddenException("You cannot access this resume");
    }

    private void ensureCanManageResume(User user, Resume resume) throws ForbiddenException {
        if (isElevatedAdmin(user) || isRecruiterForResumeCompany(user, resume)) {
            return;
        }
        throw new ForbiddenException("You cannot update this resume");
    }

    private boolean isOwner(User user, Resume resume) {
        return user != null
                && resume != null
                && resume.getUser() != null
                && Objects.equals(user.getId(), resume.getUser().getId());
    }

    private boolean isRecruiterForResumeCompany(User user, Resume resume) {
        if (!isRecruiter(user) || user.getCompany() == null || resume == null || resume.getJob() == null) {
            return false;
        }
        Company jobCompany = resume.getJob().getCompany();
        return jobCompany != null && Objects.equals(user.getCompany().getId(), jobCompany.getId());
    }

    private boolean isElevatedAdmin(User user) {
        String roleName = roleName(user);
        return "SUPER_ADMIN".equals(roleName) || "ADMIN".equals(roleName);
    }

    private boolean isRecruiter(User user) {
        return "RECRUITER".equals(roleName(user));
    }

    private String roleName(User user) {
        if (user == null || user.getRole() == null || user.getRole().getName() == null) {
            return "";
        }
        return user.getRole().getName().trim().toUpperCase(Locale.ROOT);
    }
}
