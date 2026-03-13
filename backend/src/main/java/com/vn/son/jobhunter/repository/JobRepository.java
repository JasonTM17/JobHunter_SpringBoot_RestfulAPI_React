package com.vn.son.jobhunter.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import com.vn.son.jobhunter.domain.Job;
import com.vn.son.jobhunter.domain.Skill;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends
        JpaRepository<Job, Long>,
        JpaSpecificationExecutor<Job> {
    @EntityGraph(attributePaths = {"company", "skills"})
    Optional<Job> findById(Long id);

    List<Job> findBySkillsIn(List<Skill> skills);
}
