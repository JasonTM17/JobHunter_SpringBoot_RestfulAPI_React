package com.vn.son.jobhunter.repository;

import com.vn.son.jobhunter.domain.WeeklyRecommendationDispatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WeeklyRecommendationDispatchRepository extends JpaRepository<WeeklyRecommendationDispatch, Long> {
    boolean existsByEmailAndWeekKey(String email, String weekKey);

    @Query("select d.email from WeeklyRecommendationDispatch d where d.weekKey = :weekKey")
    List<String> findEmailsByWeekKey(@Param("weekKey") String weekKey);
}
