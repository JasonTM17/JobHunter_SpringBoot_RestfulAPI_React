ALTER TABLE subscribers
    ADD COLUMN unsubscribe_token VARCHAR(128) NULL,
    ADD COLUMN unsubscribed_at DATETIME(6) NULL;

CREATE UNIQUE INDEX idx_subscribers_unsubscribe_token ON subscribers (unsubscribe_token);
CREATE INDEX idx_subscribers_unsubscribed_at ON subscribers (unsubscribed_at);

CREATE TABLE IF NOT EXISTS candidate_cvs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    is_default BIT(1) NOT NULL DEFAULT b'0',
    created_by VARCHAR(50),
    created_date DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    last_modified_by VARCHAR(50),
    last_modified_date DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE INDEX idx_candidate_cvs_user_url (user_id, file_url),
    INDEX idx_candidate_cvs_user_default (user_id, is_default),
    CONSTRAINT fk_candidate_cvs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
