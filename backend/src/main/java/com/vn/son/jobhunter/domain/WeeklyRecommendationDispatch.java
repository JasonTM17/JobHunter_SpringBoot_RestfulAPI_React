package com.vn.son.jobhunter.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(
        name = "weekly_recommendation_dispatches",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_weekly_reco_email_week_key", columnNames = {"email", "week_key"})
        }
)
@Getter
@Setter
public class WeeklyRecommendationDispatch extends AbstractAuditingEntity<Long> {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", length = 255, nullable = false)
    private String email;

    @Column(name = "week_key", length = 16, nullable = false)
    private String weekKey;

    @Column(name = "trigger_source", length = 32, nullable = false)
    private String triggerSource;

    @Column(name = "job_count", nullable = false)
    private int jobCount;

    @Column(name = "sent_at", nullable = false)
    private Instant sentAt;
}
