package com.vn.son.jobhunter.service;

import com.vn.son.jobhunter.domain.Company;
import com.vn.son.jobhunter.domain.Job;
import com.vn.son.jobhunter.domain.Skill;
import com.vn.son.jobhunter.domain.res.ResultPaginationResponse;
import com.vn.son.jobhunter.domain.res.job.CreatedJobResponse;
import com.vn.son.jobhunter.domain.res.job.UpdatedJobResponse;
import com.vn.son.jobhunter.repository.CompanyRepository;
import com.vn.son.jobhunter.repository.JobRepository;
import com.vn.son.jobhunter.repository.SkillRepository;
import com.vn.son.jobhunter.util.convert.JobConvert;
import com.vn.son.jobhunter.util.error.BadRequestException;
import com.vn.son.jobhunter.util.error.ResourceNotFoundException;
import com.vn.son.jobhunter.util.response.FormatResultPagaination;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.JoinType;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {
    private final JobRepository jobRepository;
    private final SkillRepository skillRepository;
    private final CompanyRepository companyRepository;

    public CreatedJobResponse create(Job job) throws Exception {
        normalizeJobPayload(job, true);
        job.setSkills(resolveSkills(job.getSkills()));
        job.setCompany(resolveCompany(job.getCompany()));

        Job currentJob = this.jobRepository.save(job);
        return JobConvert.convertToResCreatedJobRes(currentJob);
    }

    public UpdatedJobResponse update(Job job) throws Exception {
        if (job == null || job.getId() == null || job.getId() <= 0) {
            throw new BadRequestException("Job ID is required");
        }
        normalizeJobPayload(job, false);
        Job jobInDB = this.fetchJobById(job.getId());

        jobInDB.setName(job.getName());
        jobInDB.setLocation(job.getLocation());
        jobInDB.setSalary(job.getSalary());
        jobInDB.setQuantity(job.getQuantity());
        jobInDB.setLevel(job.getLevel());
        jobInDB.setActive(job.isActive());
        jobInDB.setStartDate(job.getStartDate());
        jobInDB.setEndDate(job.getEndDate());
        jobInDB.setDescription(job.getDescription());
        jobInDB.setSkills(resolveSkills(job.getSkills()));
        jobInDB.setCompany(resolveCompany(job.getCompany()));

        Job currentJob = this.jobRepository.save(jobInDB);
        return JobConvert.convertToResUpdatedJobRes(currentJob);
    }

    public void delete(Long id) throws Exception {
        Job currentJob = fetchJobById(id);
        this.jobRepository.delete(currentJob);
    }

    public Job fetchJobById(Long id) throws Exception {
        if (id == null || id <= 0) {
            throw new ResourceNotFoundException("Job not found");
        }
        return this.jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
    }

    @Transactional(readOnly = true)
    public ResultPaginationResponse fetchAllJob(Specification<Job> spec, Pageable pageable) {
        Page<Job> jobPage = this.jobRepository.findAll(spec, pageable);
        jobPage.getContent().forEach(job -> {
            if (job.getSkills() != null) {
                job.getSkills().size();
            }
        });
        return FormatResultPagaination.createPaginationResponse(jobPage);
    }

    @Transactional(readOnly = true)
    public ResultPaginationResponse searchPublicJobs(
            String keyword,
            String location,
            String level,
            String skill,
            Double salaryMin,
            Double salaryMax,
            String sort,
            Pageable pageable
    ) {
        Pageable resolvedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                resolvePublicSort(sort, pageable.getSort())
        );

        Specification<Job> spec = Specification.where(publiclyVisibleJobs());
        spec = appendSpec(spec, hasLocation(location));
        spec = appendSpec(spec, hasLevel(level));
        spec = appendSpec(spec, hasSkillName(skill));
        spec = appendSpec(spec, hasSalaryMin(salaryMin));
        spec = appendSpec(spec, hasSalaryMax(salaryMax));
        spec = appendSpec(spec, matchesKeyword(keyword));

        Page<Job> jobPage = this.jobRepository.findAll(spec, resolvedPageable);
        return FormatResultPagaination.createPaginationResponse(jobPage);
    }

    private void normalizeJobPayload(Job job, boolean creating) throws BadRequestException {
        if (job == null) {
            throw new BadRequestException("Job payload is required");
        }
        String name = job.getName() == null ? "" : job.getName().trim();
        String location = job.getLocation() == null ? "" : job.getLocation().trim();
        if (name.isBlank()) {
            throw new BadRequestException("Job name is required");
        }
        if (location.isBlank()) {
            throw new BadRequestException("Job location is required");
        }
        if (job.getQuantity() < 1) {
            throw new BadRequestException("Job quantity must be at least 1");
        }
        if (job.getSalary() < 0) {
            throw new BadRequestException("Job salary cannot be negative");
        }
        if (creating && job.getId() != null) {
            job.setId(null);
        }
        job.setName(name);
        job.setLocation(location);
        job.setDescription(job.getDescription() == null ? null : job.getDescription().trim());
    }

    private Company resolveCompany(Company company) throws Exception {
        if (company == null || company.getId() <= 0) {
            throw new BadRequestException("Company ID is required");
        }
        return this.companyRepository.findById(company.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    private List<Skill> resolveSkills(List<Skill> requestedSkills) throws Exception {
        if (requestedSkills == null || requestedSkills.isEmpty()) {
            return List.of();
        }

        Set<Long> requestedIds = new LinkedHashSet<>();
        for (Skill skill : requestedSkills) {
            if (skill == null || skill.getId() == null || skill.getId() <= 0) {
                throw new BadRequestException("Skill ID is invalid");
            }
            requestedIds.add(skill.getId());
        }

        List<Skill> dbSkills = this.skillRepository.findByIdIn(List.copyOf(requestedIds));
        if (dbSkills.size() != requestedIds.size()) {
            throw new ResourceNotFoundException("One or more skills were not found");
        }

        Map<Long, Skill> skillById = dbSkills.stream()
                .collect(Collectors.toMap(Skill::getId, Function.identity()));
        return requestedIds.stream().map(skillById::get).toList();
    }

    private Specification<Job> publiclyVisibleJobs() {
        return (root, query, cb) -> cb.and(
                cb.isTrue(root.get("active")),
                cb.or(cb.isNull(root.get("startDate")), cb.lessThanOrEqualTo(root.get("startDate"), java.time.Instant.now())),
                cb.or(cb.isNull(root.get("endDate")), cb.greaterThanOrEqualTo(root.get("endDate"), java.time.Instant.now()))
        );
    }

    private Specification<Job> hasLocation(String location) {
        if (location == null || location.isBlank() || "ALL".equalsIgnoreCase(location.trim())) {
            return null;
        }
        String normalized = location.trim().toUpperCase(Locale.ROOT);
        return (root, query, cb) -> cb.equal(cb.upper(root.get("location")), normalized);
    }

    private Specification<Job> hasLevel(String level) {
        if (level == null || level.isBlank() || "ALL".equalsIgnoreCase(level.trim())) {
            return null;
        }
        String normalized = level.trim().toUpperCase(Locale.ROOT);
        return (root, query, cb) -> cb.equal(cb.upper(root.get("level").as(String.class)), normalized);
    }

    private Specification<Job> hasSkillName(String skill) {
        if (skill == null || skill.isBlank() || "ALL".equalsIgnoreCase(skill.trim())) {
            return null;
        }
        String normalized = skill.trim().toLowerCase(Locale.ROOT);
        return (root, query, cb) -> {
            query.distinct(true);
            var skillsJoin = root.join("skills", JoinType.LEFT);
            return cb.equal(cb.lower(skillsJoin.get("name")), normalized);
        };
    }

    private Specification<Job> hasSalaryMin(Double salaryMin) {
        if (salaryMin == null) return null;
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("salary"), salaryMin);
    }

    private Specification<Job> hasSalaryMax(Double salaryMax) {
        if (salaryMax == null) return null;
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("salary"), salaryMax);
    }

    private Specification<Job> matchesKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        String normalized = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
        return (root, query, cb) -> {
            query.distinct(true);
            var companyJoin = root.join("company", JoinType.LEFT);
            var skillsJoin = root.join("skills", JoinType.LEFT);
            return cb.or(
                    cb.like(cb.lower(root.get("name")), normalized),
                    cb.like(cb.lower(root.get("location")), normalized),
                    cb.like(cb.lower(root.get("description")), normalized),
                    cb.like(cb.lower(root.get("level").as(String.class)), normalized),
                    cb.like(cb.lower(companyJoin.get("name")), normalized),
                    cb.like(cb.lower(skillsJoin.get("name")), normalized)
            );
        };
    }

    private Sort resolvePublicSort(String sort, Sort fallbackSort) {
        String normalized = sort == null ? "" : sort.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "salary_desc" -> Sort.by(Sort.Order.desc("salary"), Sort.Order.desc("endDate"));
            case "salary_asc" -> Sort.by(Sort.Order.asc("salary"), Sort.Order.desc("endDate"));
            case "deadline_asc" -> Sort.by(Sort.Order.asc("endDate"), Sort.Order.desc("id"));
            case "oldest" -> Sort.by(Sort.Order.asc("id"));
            case "latest", "" -> Sort.by(Sort.Order.desc("endDate"), Sort.Order.desc("id"));
            default -> fallbackSort.isSorted() ? fallbackSort : Sort.by(Sort.Order.desc("endDate"), Sort.Order.desc("id"));
        };
    }

    private Specification<Job> appendSpec(Specification<Job> base, Specification<Job> addition) {
        if (addition == null) {
            return base;
        }
        return base == null ? Specification.where(addition) : base.and(addition);
    }
}
