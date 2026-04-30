package com.vn.son.jobhunter.repository;

import com.vn.son.jobhunter.domain.ResumeStatusAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResumeStatusAuditRepository extends JpaRepository<ResumeStatusAudit, Long> {
    List<ResumeStatusAudit> findByResume_IdOrderByCreatedAtDesc(Long resumeId);
}
