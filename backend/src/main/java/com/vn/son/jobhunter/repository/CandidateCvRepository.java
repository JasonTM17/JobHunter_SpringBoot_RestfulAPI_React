package com.vn.son.jobhunter.repository;

import com.vn.son.jobhunter.domain.CandidateCv;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateCvRepository extends JpaRepository<CandidateCv, Long> {
    List<CandidateCv> findByUser_IdOrderByDefaultCvDescCreatedDateDesc(Long userId);

    Optional<CandidateCv> findByIdAndUser_Id(Long id, Long userId);

    boolean existsByUser_IdAndFileUrl(Long userId, String fileUrl);
}
