-- V1__init_schema.sql
-- Jobhunter full application schema (MySQL 8.4+)
-- This script creates all tables, indexes, and constraints in the correct order.

-- =============================================================================
-- 1. ENUM TYPE SIMULATION (MySQL uses TINYINT for enum-like columns)
-- =============================================================================

-- The application uses JPA-enumerated strings; we use VARCHAR in migrations
-- for portability. JPA handles the enum-to-string conversion at the ORM layer.

-- =============================================================================
-- 2. companies  (must exist before users and jobs reference it)
-- =============================================================================
CREATE TABLE IF NOT EXISTS companies (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_by      VARCHAR(50)  NULL,
    created_date    DATETIME(6)  NULL,
    last_modified_by VARCHAR(50)  NULL,
    last_modified_date DATETIME(6) NULL,
    name            VARCHAR(100) NOT NULL,
    description     MEDIUMTEXT   NULL,
    address         VARCHAR(255) NULL,
    logo            VARCHAR(500) NULL,
    INDEX idx_companies_name (name),
    INDEX idx_companies_address (address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. permissions
-- =============================================================================
CREATE TABLE IF NOT EXISTS permissions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_by      VARCHAR(50)  NULL,
    created_date    DATETIME(6)  NULL,
    last_modified_by VARCHAR(50)  NULL,
    last_modified_date DATETIME(6) NULL,
    name            VARCHAR(255) NOT NULL,
    api_path        VARCHAR(255) NOT NULL,
    method          VARCHAR(20)  NOT NULL,
    module          VARCHAR(100) NOT NULL,
    UNIQUE INDEX idx_permissions_name_method_path (name, api_path, method),
    INDEX idx_permissions_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. roles
-- =============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_by      VARCHAR(50)  NULL,
    created_date    DATETIME(6)  NULL,
    last_modified_by VARCHAR(50)  NULL,
    last_modified_date DATETIME(6) NULL,
    name            VARCHAR(100) NOT NULL,
    description     TEXT         NULL,
    active          TINYINT(1)   NOT NULL DEFAULT 1,
    UNIQUE INDEX idx_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. permission_role  (join table for many-to-many)
-- =============================================================================
CREATE TABLE IF NOT EXISTS permission_role (
    role_id       BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_permission_role_role FOREIGN KEY (role_id)       REFERENCES roles(role_id)       ON DELETE CASCADE,
    CONSTRAINT fk_permission_role_perm  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. users
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id                              BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_by                      VARCHAR(50)  NULL,
    created_date                    DATETIME(6)  NULL,
    last_modified_by                VARCHAR(50)  NULL,
    last_modified_date              DATETIME(6)  NULL,
    name                            VARCHAR(100) NOT NULL,
    age                             TINYINT      NULL,
    email                           VARCHAR(50)  NOT NULL,
    address                         VARCHAR(200) NULL,
    password                        VARCHAR(200) NULL,
    gender                          VARCHAR(20)  NULL,
    company_id                      BIGINT       NULL,
    role_id                         BIGINT       NULL,
    refresh_token                   MEDIUMTEXT   NULL,
    weekly_job_recommendation_enabled TINYINT(1) NOT NULL DEFAULT 1,
    UNIQUE INDEX idx_users_email (email),
    INDEX idx_users_company (company_id),
    INDEX idx_users_role (role_id),
    CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    CONSTRAINT fk_users_role   FOREIGN KEY (role_id)    REFERENCES roles(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. skills
-- =============================================================================
CREATE TABLE IF NOT EXISTS skills (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_by      VARCHAR(50)  NULL,
    created_date    DATETIME(6)  NULL,
    last_modified_by VARCHAR(50)  NULL,
    last_modified_date DATETIME(6) NULL,
    name            VARCHAR(255) NOT NULL,
    UNIQUE INDEX idx_skills_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. jobs
-- =============================================================================
CREATE TABLE IF NOT EXISTS jobs (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_by      VARCHAR(50)  NULL,
    created_date    DATETIME(6)  NULL,
    last_modified_by VARCHAR(50)  NULL,
    last_modified_date DATETIME(6) NULL,
    name            VARCHAR(255) NOT NULL,
    location        VARCHAR(255) NOT NULL,
    salary          DOUBLE       NOT NULL DEFAULT 0,
    quantity        INT          NOT NULL DEFAULT 1,
    level           VARCHAR(20)  NULL,
    active          TINYINT(1)   NOT NULL DEFAULT 1,
    start_date      DATETIME(6)  NULL,
    end_date        DATETIME(6)  NULL,
    description     MEDIUMTEXT   NULL,
    company_id      BIGINT       NULL,
    INDEX idx_jobs_name (name),
    INDEX idx_jobs_location (location),
    INDEX idx_jobs_company (company_id),
    INDEX idx_jobs_active (active),
    INDEX idx_jobs_level (level),
    INDEX idx_jobs_end_date (end_date),
    CONSTRAINT fk_jobs_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. job_skill  (join table for many-to-many)
-- =============================================================================
CREATE TABLE IF NOT EXISTS job_skill (
    job_id   BIGINT NOT NULL,
    skill_id BIGINT NOT NULL,
    PRIMARY KEY (job_id, skill_id),
    CONSTRAINT fk_job_skill_job   FOREIGN KEY (job_id)   REFERENCES jobs(id)   ON DELETE CASCADE,
    CONSTRAINT fk_job_skill_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 10. resumes
-- =============================================================================
CREATE TABLE IF NOT EXISTS resumes (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_by      VARCHAR(50)  NULL,
    created_date    DATETIME(6)  NULL,
    last_modified_by VARCHAR(50)  NULL,
    last_modified_date DATETIME(6) NULL,
    email           VARCHAR(255) NOT NULL,
    url             VARCHAR(500) NOT NULL,
    status          VARCHAR(20)  NULL,
    user_id         BIGINT       NULL,
    job_id          BIGINT       NULL,
    INDEX idx_resumes_email (email),
    INDEX idx_resumes_status (status),
    INDEX idx_resumes_user (user_id),
    INDEX idx_resumes_job (job_id),
    CONSTRAINT fk_resumes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_resumes_job  FOREIGN KEY (job_id)  REFERENCES jobs(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 11. subscribers
-- =============================================================================
CREATE TABLE IF NOT EXISTS subscribers (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_by      VARCHAR(50)  NULL,
    created_date    DATETIME(6)  NULL,
    last_modified_by VARCHAR(50)  NULL,
    last_modified_date DATETIME(6) NULL,
    email           VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    UNIQUE INDEX idx_subscribers_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 12. subscriber_skill  (join table for many-to-many)
-- =============================================================================
CREATE TABLE IF NOT EXISTS subscriber_skill (
    subscriber_id BIGINT NOT NULL,
    skill_id      BIGINT NOT NULL,
    PRIMARY KEY (subscriber_id, skill_id),
    CONSTRAINT fk_subscriber_skill_sub FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE,
    CONSTRAINT fk_subscriber_skill_skill FOREIGN KEY (skill_id)     REFERENCES skills(id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 13. weekly_recommendation_dispatches
-- =============================================================================
CREATE TABLE IF NOT EXISTS weekly_recommendation_dispatches (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_by      VARCHAR(50)  NULL,
    created_date    DATETIME(6)  NULL,
    last_modified_by VARCHAR(50)  NULL,
    last_modified_date DATETIME(6) NULL,
    email           VARCHAR(255) NOT NULL,
    week_key        VARCHAR(16)  NOT NULL,
    trigger_source  VARCHAR(32)  NOT NULL,
    job_count       INT          NOT NULL DEFAULT 0,
    sent_at         DATETIME(6)  NOT NULL,
    UNIQUE INDEX idx_weekly_dispatch_email_week (email, week_key),
    INDEX idx_weekly_dispatch_week_key (week_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
