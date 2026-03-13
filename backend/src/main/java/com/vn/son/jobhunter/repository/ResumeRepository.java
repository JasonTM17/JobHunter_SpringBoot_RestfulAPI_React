package com.vn.son.jobhunter.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.vn.son.jobhunter.domain.Resume;

import java.util.List;

@Repository
public interface ResumeRepository extends
        JpaRepository<Resume, Long>,
        JpaSpecificationExecutor<Resume> {
    @EntityGraph(attributePaths = {"user", "job", "job.company", "job.skills"})
    @Query("select r from Resume r where r.user.id in :userIds")
    List<Resume> findByUserIdsWithJobDetails(@Param("userIds") List<Long> userIds);
}
