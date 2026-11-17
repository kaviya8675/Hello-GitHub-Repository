-- =========================================================================
-- AI-Powered Context-Aware Meeting Intelligence
-- Relational Database Schema (MySQL Compatible)
-- =========================================================================

CREATE DATABASE IF NOT EXISTS meeting_intelligence_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE meeting_intelligence_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'USER',
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INT DEFAULT 30,
    agenda TEXT,
    location_or_link VARCHAR(255),
    status VARCHAR(50) DEFAULT 'COMPLETED', -- SCHEDULED, IN_PROGRESS, COMPLETED, ANALYZED
    audio_file_url VARCHAR(255),
    created_by_user_id BIGINT,
    summary TEXT,
    executive_overview TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Participants Table
CREATE TABLE IF NOT EXISTS participants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    meeting_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role_in_meeting VARCHAR(50) DEFAULT 'Attendee', -- Host, Speaker, Attendee, Scribe
    department VARCHAR(100),
    attended BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Transcripts Table
CREATE TABLE IF NOT EXISTS transcripts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    meeting_id BIGINT NOT NULL UNIQUE,
    raw_text LONGTEXT NOT NULL,
    diarized_json LONGTEXT, -- Stores segments with speaker, timestamp, text
    confidence_score DECIMAL(4, 2) DEFAULT 0.95,
    language VARCHAR(10) DEFAULT 'en-US',
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_code VARCHAR(50) UNIQUE, -- e.g. TSK-101
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_person VARCHAR(100) NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    status VARCHAR(30) DEFAULT 'PENDING',  -- PENDING, IN_PROGRESS, COMPLETED, OVERDUE, CARRIED_FORWARD, CANCELLED
    created_date DATE NOT NULL,
    original_deadline DATE NOT NULL,
    current_deadline DATE NOT NULL,
    source_meeting_id BIGINT NOT NULL,
    last_discussed_meeting_id BIGINT,
    progress_percentage INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (source_meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (last_discussed_meeting_id) REFERENCES meetings(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Task History / Evolution Timeline Table
CREATE TABLE IF NOT EXISTS task_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT NOT NULL,
    meeting_id BIGINT,
    action_type VARCHAR(50) NOT NULL, -- CREATED, STATUS_CHANGED, DEADLINE_EXTENDED, ASSIGNEE_CHANGED, PROGRESS_UPDATED, COMPLETED
    previous_status VARCHAR(30),
    new_status VARCHAR(30),
    previous_deadline DATE,
    new_deadline DATE,
    previous_assignee VARCHAR(100),
    new_assignee VARCHAR(100),
    progress_note TEXT,
    discussed_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Decisions Table
CREATE TABLE IF NOT EXISTS decisions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    meeting_id BIGINT NOT NULL,
    decision_text TEXT NOT NULL,
    topic VARCHAR(150),
    people_involved VARCHAR(255),
    rationale TEXT,
    impact_level VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH
    status VARCHAR(30) DEFAULT 'ACTIVE', -- ACTIVE, SUPERSEDED, CANCELLED
    decided_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Action Items Table
CREATE TABLE IF NOT EXISTS action_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    meeting_id BIGINT NOT NULL,
    item_description TEXT NOT NULL,
    assigned_to VARCHAR(100),
    due_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Unresolved Issues / Blockers Table
CREATE TABLE IF NOT EXISTS unresolved_issues (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    meeting_id BIGINT NOT NULL,
    issue_description TEXT NOT NULL,
    raised_by VARCHAR(100),
    status VARCHAR(30) DEFAULT 'OPEN', -- OPEN, RESOLVED, ESCALATED
    resolved_in_meeting_id BIGINT,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_in_meeting_id) REFERENCES meetings(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Meeting Context Relationships (Memory Engine Links)
CREATE TABLE IF NOT EXISTS meeting_context (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    current_meeting_id BIGINT NOT NULL,
    previous_meeting_id BIGINT NOT NULL,
    continuity_summary TEXT,
    carried_forward_tasks_count INT DEFAULT 0,
    resolved_issues_count INT DEFAULT 0,
    context_similarity_score DECIMAL(4, 2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (previous_meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes for Fast Context Search and Retrieval
CREATE INDEX idx_meetings_date ON meetings(meeting_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assigned_person);
CREATE INDEX idx_decisions_topic ON decisions(topic);
CREATE INDEX idx_task_history_task_id ON task_history(task_id);
