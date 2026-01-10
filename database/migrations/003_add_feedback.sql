-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    feedback_type ENUM('bug_report', 'feature_request', 'improvement', 'complaint', 'compliment', 'app_rating') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    category VARCHAR(50),
    platform ENUM('ios', 'android', 'web') NOT NULL,
    app_version VARCHAR(20),
    device_info JSON,
    screenshot_url VARCHAR(255),
    status ENUM('submitted', 'under_review', 'planned', 'in_progress', 'completed', 'rejected') DEFAULT 'submitted',
    priority ENUM('low', 'normal', 'high', 'critical') DEFAULT 'normal',
    admin_notes TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    upvote_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_type (feedback_type),
    INDEX idx_status (status),
    INDEX idx_rating (rating),
    FULLTEXT KEY ft_title_description (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feedback responses table (admin replies)
CREATE TABLE IF NOT EXISTS feedback_responses (
    response_id INT PRIMARY KEY AUTO_INCREMENT,
    feedback_id INT NOT NULL,
    responder_id INT NOT NULL,
    response_text TEXT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES feedback(feedback_id) ON DELETE CASCADE,
    FOREIGN KEY (responder_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_feedback (feedback_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
    ON messages(conversation_id, created_at);
    
CREATE INDEX IF NOT EXISTS idx_messages_conversation_unread 
    ON messages(conversation_id, is_read);
    
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
    ON notifications(user_id, is_read);
    
CREATE INDEX IF NOT EXISTS idx_notifications_user_type 
    ON notifications(user_id, notification_type);

-- Migration complete
SELECT 'Database migrations completed successfully!' AS status;