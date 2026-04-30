package com.vn.son.jobhunter.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.vn.son.jobhunter.domain.Company;
import com.vn.son.jobhunter.domain.Job;
import com.vn.son.jobhunter.domain.Skill;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@Repository
public interface JobRepository extends
        JpaRepository<Job, Long>,
        JpaSpecificationExecutor<Job> {
    @Override
    @EntityGraph(attributePaths = {"company", "skills"})
    Page<Job> findAll(Specification<Job> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"company", "skills"})
    Optional<Job> findById(Long id);

    List<Job> findBySkillsIn(List<Skill> skills);

    long countByCompany(Company company);

    @EntityGraph(attributePaths = {"company", "skills"})
    @Query("""
            select j
            from Job j
            where j.active = true
              and (j.startDate is null or j.startDate <= :now)
              and (j.endDate is null or j.endDate >= :now)
            """)
    List<Job> findOpenJobs(@Param("now") Instant now);
}
