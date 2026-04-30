-- Account-scoped saved jobs for candidate bookmarks.
CREATE TABLE IF NOT EXISTS saved_jobs (
    user_id      BIGINT NOT NULL,
    job_id       BIGINT NOT NULL,
    saved_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, job_id),
    INDEX idx_saved_jobs_job (job_id),
    CONSTRAINT fk_saved_jobs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_jobs_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
