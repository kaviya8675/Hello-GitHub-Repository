-- =========================================================================
-- AI-Powered Context-Aware Meeting Intelligence
-- Initial Seed Data: Realistic Multi-Meeting Evolution Scenario
-- =========================================================================

USE meeting_intelligence_db;

-- 1. Insert Default User
INSERT INTO users (id, username, email, password_hash, full_name, role, avatar_url) VALUES
(1, 'admin', 'admin@meetingiq.ai', '$2a$10$7EqJtq98hPqEX7fNZaFWoO...demoHash', 'Dr. Sarah Jenkins', 'ADMIN', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
(2, 'rahul_dev', 'rahul@meetingiq.ai', '$2a$10$7EqJtq98hPqEX7fNZaFWoO...demoHash', 'Rahul Sharma', 'DEVELOPER', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
(3, 'priya_dba', 'priya@meetingiq.ai', '$2a$10$7EqJtq98hPqEX7fNZaFWoO...demoHash', 'Priya Patel', 'DATA_ENGINEER', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
(4, 'arun_lead', 'arun@meetingiq.ai', '$2a$10$7EqJtq98hPqEX7fNZaFWoO...demoHash', 'Arun Kumar', 'TECH_LEAD', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150');

-- 2. Insert Meetings (Meeting 1, 2, and 3)
INSERT INTO meetings (id, title, meeting_date, start_time, duration_minutes, agenda, location_or_link, status, created_by_user_id, summary, executive_overview) VALUES
(1, 'Project Kickoff & Architecture Review', '2026-08-20', '10:00:00', 45, 'Initial architectural breakdown, role assignment, authentication strategy, and database design.', 'Conference Room A / Google Meet', 'ANALYZED', 1, 
 'The team conducted the kickoff session for the new system. Rahul was assigned to lead the Login and Authentication module. Priya took ownership of the relational database schema, and Arun is spearheading backend REST API development. Discussed security protocols and UI library choices.', 
 'High-level architecture approved. Initial milestone set for end of August.'),

(2, 'Sprint 1 Progress & Blocker Sync', '2026-08-28', '11:00:00', 40, 'Review of login module progress, database schema verification, API progress, and blocker resolution.', 'Virtual Meeting Room 3', 'ANALYZED', 1,
 'Priya confirmed the database schema is 100% complete and indexed. Rahul reported the login backend is finished, but UI responsiveness and validation require more time; deadline shifted from Aug 25 to Sep 02. Arun reported 60% completion on REST APIs. Resolved the token refresh mechanism using HTTP-Only cookies.',
 'Sprint 1 is on track with a minor 7-day extension for frontend auth integration. Blockers resolved.'),

(3, 'Pre-Release Sprint Review & Milestone Finalization', '2026-09-05', '14:30:00', 50, 'Verification of completed login module, final API integration testing, and deployment preparation.', 'Main Boardroom / Hybrid', 'ANALYZED', 1,
 'Rahul demoed the completed Login Module with full input validation and biometric fallback. Priya confirmed Role-Based Access Control is enforced. Arun successfully integrated all backend endpoints with Swagger documentation. Decided on the AWS deployment schedule for Sep 10.',
 'All core modules verified. System is ready for final release deployment.');

-- 3. Insert Participants
INSERT INTO participants (meeting_id, name, email, role_in_meeting, department, attended) VALUES
(1, 'Dr. Sarah Jenkins', 'admin@meetingiq.ai', 'Host', 'Product Management', TRUE),
(1, 'Rahul Sharma', 'rahul@meetingiq.ai', 'Speaker', 'Frontend/FullStack', TRUE),
(1, 'Priya Patel', 'priya@meetingiq.ai', 'Speaker', 'Database Engineering', TRUE),
(1, 'Arun Kumar', 'arun@meetingiq.ai', 'Speaker', 'Backend Engineering', TRUE),

(2, 'Dr. Sarah Jenkins', 'admin@meetingiq.ai', 'Host', 'Product Management', TRUE),
(2, 'Rahul Sharma', 'rahul@meetingiq.ai', 'Speaker', 'Frontend/FullStack', TRUE),
(2, 'Priya Patel', 'priya@meetingiq.ai', 'Speaker', 'Database Engineering', TRUE),
(2, 'Arun Kumar', 'arun@meetingiq.ai', 'Speaker', 'Backend Engineering', TRUE),

(3, 'Dr. Sarah Jenkins', 'admin@meetingiq.ai', 'Host', 'Product Management', TRUE),
(3, 'Rahul Sharma', 'rahul@meetingiq.ai', 'Speaker', 'Frontend/FullStack', TRUE),
(3, 'Priya Patel', 'priya@meetingiq.ai', 'Speaker', 'Database Engineering', TRUE),
(3, 'Arun Kumar', 'arun@meetingiq.ai', 'Speaker', 'Backend Engineering', TRUE);

-- 4. Insert Transcripts
INSERT INTO transcripts (id, meeting_id, raw_text, diarized_json, confidence_score) VALUES
(1, 1, 
 'Sarah: Welcome everyone. Today we are launching the Project Development kickoff. Let us distribute key responsibilities.
Rahul: I will take up the complete Login and Authentication module. I estimate finishing by August 25.
Priya: I will finalize the database schema and normalization by August 22.
Arun: I will create the core REST API skeleton and controllers by August 30.
Sarah: Great. Let us make sure we use JWT authentication and standard relational modeling.',
 '[
   {"speaker": "Dr. Sarah Jenkins", "time": "00:05", "text": "Welcome everyone. Today we are launching the Project Development kickoff. Let us distribute key responsibilities."},
   {"speaker": "Rahul Sharma", "time": "02:15", "text": "I will take up the complete Login and Authentication module. I estimate finishing by August 25."},
   {"speaker": "Priya Patel", "time": "05:40", "text": "I will finalize the database schema and normalization by August 22."},
   {"speaker": "Arun Kumar", "time": "08:10", "text": "I will create the core REST API skeleton and controllers by August 30."},
   {"speaker": "Dr. Sarah Jenkins", "time": "12:00", "text": "Great. Let us make sure we use JWT authentication and standard relational modeling."}
 ]', 0.98),

(2, 2,
 'Sarah: Good morning team. Let us review where we stand on previous commitments.
Sarah: Rahul, how is the login module coming along?
Rahul: We completed the backend APIs for login, but frontend form validation and styling are still pending. We will finish it by September 2.
Sarah: Okay, deadline extended to September 2. Priya, what is the status of the database?
Priya: Database schema and indexes are 100% complete and tested with sample data.
Arun: The REST APIs are 60% done. I am currently integrating the participant and task endpoints.
Sarah: Excellent progress. For token refresh, we decided to use secure HTTP-Only cookies.',
 '[
   {"speaker": "Dr. Sarah Jenkins", "time": "00:10", "text": "Good morning team. Let us review where we stand on previous commitments."},
   {"speaker": "Dr. Sarah Jenkins", "time": "01:20", "text": "Rahul, how is the login module coming along?"},
   {"speaker": "Rahul Sharma", "time": "02:05", "text": "We completed the backend APIs for login, but frontend form validation and styling are still pending. We will finish it by September 2."},
   {"speaker": "Dr. Sarah Jenkins", "time": "04:30", "text": "Okay, deadline extended to September 2. Priya, what is the status of the database?"},
   {"speaker": "Priya Patel", "time": "06:10", "text": "Database schema and indexes are 100% complete and tested with sample data."},
   {"speaker": "Arun Kumar", "time": "09:15", "text": "The REST APIs are 60% done. I am currently integrating the participant and task endpoints."},
   {"speaker": "Dr. Sarah Jenkins", "time": "14:00", "text": "Excellent progress. For token refresh, we decided to use secure HTTP-Only cookies."}
 ]', 0.97),

(3, 3,
 'Sarah: Hello everyone, welcome to the final pre-release sprint review.
Sarah: Rahul, please update us on the login module.
Rahul: The login and authentication module is completely finished! All frontend screens, validation, and token handling are verified and merged.
Priya: Role-Based Access Control and permissions verification is also complete.
Arun: All REST API endpoints are fully developed and documented in Swagger.
Sarah: Fantastic work team. Arun, please prepare the cloud deployment pipeline by September 10.',
 '[
   {"speaker": "Dr. Sarah Jenkins", "time": "00:08", "text": "Hello everyone, welcome to the final pre-release sprint review."},
   {"speaker": "Dr. Sarah Jenkins", "time": "01:15", "text": "Rahul, please update us on the login module."},
   {"speaker": "Rahul Sharma", "time": "02:10", "text": "The login and authentication module is completely finished! All frontend screens, validation, and token handling are verified and merged."},
   {"speaker": "Priya Patel", "time": "04:50", "text": "Role-Based Access Control and permissions verification is also complete."},
   {"speaker": "Arun Kumar", "time": "07:30", "text": "All REST API endpoints are fully developed and documented in Swagger."},
   {"speaker": "Dr. Sarah Jenkins", "time": "11:20", "text": "Fantastic work team. Arun, please prepare the cloud deployment pipeline by September 10."}
 ]', 0.99);

-- 5. Insert Tasks (Demonstrating continuous evolution)
INSERT INTO tasks (id, task_code, title, description, assigned_person, priority, status, created_date, original_deadline, current_deadline, source_meeting_id, last_discussed_meeting_id, progress_percentage) VALUES
(1, 'TSK-101', 'Complete Login & Authentication Module', 'Design frontend login/signup screens, integrate JWT token auth, and handle error validations.', 'Rahul Sharma', 'HIGH', 'COMPLETED', '2026-08-20', '2026-08-25', '2026-09-02', 1, 3, 100),
(2, 'TSK-102', 'Create Database Relational Schema', 'Design 3NF normalized tables for meetings, tasks, transcripts, and decisions with indexes.', 'Priya Patel', 'HIGH', 'COMPLETED', '2026-08-20', '2026-08-22', '2026-08-22', 1, 2, 100),
(3, 'TSK-103', 'Develop Core REST APIs & Controllers', 'Build Spring Boot controllers, DTOs, JPA services, and error handling for all entities.', 'Arun Kumar', 'CRITICAL', 'COMPLETED', '2026-08-20', '2026-08-30', '2026-09-05', 1, 3, 100),
(4, 'TSK-104', 'Implement Role-Based Access Control (RBAC)', 'Enforce granular permissions between Admin, Host, and Attendee roles in API routes.', 'Priya Patel', 'MEDIUM', 'COMPLETED', '2026-08-28', '2026-09-05', '2026-09-05', 2, 3, 100),
(5, 'TSK-105', 'Cloud Deployment & CI/CD Pipeline', 'Deploy backend container and frontend build to AWS/Cloud infrastructure.', 'Arun Kumar', 'HIGH', 'IN_PROGRESS', '2026-09-05', '2026-09-10', '2026-09-10', 3, 3, 40);

-- 6. Insert Task History (Full Evolutionary Timeline for Task 1: Complete Login Module)
INSERT INTO task_history (task_id, meeting_id, action_type, previous_status, new_status, previous_deadline, new_deadline, previous_assignee, new_assignee, progress_note, discussed_date) VALUES
(1, 1, 'CREATED', NULL, 'PENDING', NULL, '2026-08-25', NULL, 'Rahul Sharma', 'Task created during Project Kickoff meeting. Initial deadline set to August 25.', '2026-08-20'),
(1, 2, 'PROGRESS_UPDATED', 'PENDING', 'IN_PROGRESS', '2026-08-25', '2026-08-25', 'Rahul Sharma', 'Rahul Sharma', 'Rahul reported backend auth endpoints completed; frontend validation remains in progress.', '2026-08-28'),
(1, 2, 'DEADLINE_EXTENDED', 'IN_PROGRESS', 'IN_PROGRESS', '2026-08-25', '2026-09-02', 'Rahul Sharma', 'Rahul Sharma', 'Deadline officially extended by 8 days to September 2 to accommodate responsive UI polishing.', '2026-08-28'),
(1, 3, 'COMPLETED', 'IN_PROGRESS', 'COMPLETED', '2026-09-02', '2026-09-02', 'Rahul Sharma', 'Rahul Sharma', 'Task fully completed, tested with unit tests and merged into main branch.', '2026-09-05'),

(2, 1, 'CREATED', NULL, 'PENDING', NULL, '2026-08-22', NULL, 'Priya Patel', 'Task created for MySQL schema design and relational constraints.', '2026-08-20'),
(2, 2, 'COMPLETED', 'PENDING', 'COMPLETED', '2026-08-22', '2026-08-22', 'Priya Patel', 'Priya Patel', 'Schema finalized with 10 tables, indexes, and sample seeds.', '2026-08-28'),

(3, 1, 'CREATED', NULL, 'PENDING', NULL, '2026-08-30', NULL, 'Arun Kumar', 'Core REST API development initiated.', '2026-08-20'),
(3, 2, 'PROGRESS_UPDATED', 'PENDING', 'IN_PROGRESS', '2026-08-30', '2026-08-30', 'Arun Kumar', 'Arun Kumar', 'Reached 60% completion. Meeting and Task endpoints ready.', '2026-08-28'),
(3, 3, 'COMPLETED', 'IN_PROGRESS', 'COMPLETED', '2026-08-30', '2026-09-05', 'Arun Kumar', 'Arun Kumar', 'All REST APIs completed, documented with OpenAPI/Swagger.', '2026-09-05'),

(4, 2, 'CREATED', NULL, 'PENDING', NULL, '2026-09-05', NULL, 'Priya Patel', 'RBAC task spawned following security review.', '2026-08-28'),
(4, 3, 'COMPLETED', 'PENDING', 'COMPLETED', '2026-09-05', '2026-09-05', 'Priya Patel', 'Priya Patel', 'RBAC rules verified across all controller endpoints.', '2026-09-05'),

(5, 3, 'CREATED', NULL, 'IN_PROGRESS', NULL, '2026-09-10', NULL, 'Arun Kumar', 'Cloud CI/CD deployment configured for AWS container environment.', '2026-09-05');

-- 7. Insert Decisions
INSERT INTO decisions (id, meeting_id, decision_text, topic, people_involved, rationale, impact_level, status, decided_date) VALUES
(1, 1, 'Adopt JWT (JSON Web Tokens) with stateless Spring Security architecture.', 'Authentication & Security', 'Dr. Sarah Jenkins, Rahul Sharma, Arun Kumar', 'Ensures scalability and seamless integration with modern React single-page frontend.', 'HIGH', 'ACTIVE', '2026-08-20'),
(2, 1, 'Standardize on MySQL 8.0 with InnoDB engine and UTF8MB4 charset.', 'Database Architecture', 'Priya Patel, Arun Kumar', 'Supports multi-lingual transcript characters and strict relational integrity.', 'MEDIUM', 'ACTIVE', '2026-08-20'),
(3, 2, 'Store JWT Refresh Tokens in secure HTTP-Only Cookies to prevent XSS attacks.', 'Security & Storage', 'Dr. Sarah Jenkins, Rahul Sharma', 'Mitigates token theft risks identified during security sync.', 'HIGH', 'ACTIVE', '2026-08-28'),
(4, 3, 'Schedule official production release deployment for September 12, 2026.', 'Release Management', 'All Team Members', 'All primary sprint milestones completed and validated.', 'HIGH', 'ACTIVE', '2026-09-05');

-- 8. Insert Action Items
INSERT INTO action_items (id, meeting_id, item_description, assigned_to, due_date, is_completed) VALUES
(1, 1, 'Draft Swagger/OpenAPI documentation for Auth and Meeting endpoints', 'Arun Kumar', '2026-08-24', TRUE),
(2, 1, 'Setup GitHub repository branching strategy and PR templates', 'Rahul Sharma', '2026-08-21', TRUE),
(3, 2, 'Perform load testing on database queries with 10,000 dummy transcripts', 'Priya Patel', '2026-09-01', TRUE),
(4, 3, 'Configure AWS ECS container cluster and RDS MySQL instance', 'Arun Kumar', '2026-09-08', FALSE),
(5, 3, 'Prepare final presentation deck and system demo video', 'Rahul Sharma', '2026-09-09', FALSE);

-- 9. Insert Unresolved Issues / Blockers
INSERT INTO unresolved_issues (id, meeting_id, issue_description, raised_by, status, resolved_in_meeting_id, resolution_notes) VALUES
(1, 1, 'Determination of optimal token expiration duration vs UX refresh friction.', 'Rahul Sharma', 'RESOLVED', 2, 'Resolved in Meeting 2 by implementing 15-minute access token + 7-day sliding HTTP-Only refresh token.'),
(2, 3, 'Load testing on multi-speaker audio transcription latency under peak load.', 'Arun Kumar', 'OPEN', NULL, 'Under active profiling using Whisper async queue.');

-- 10. Insert Meeting Context Links (Context Engine Memory Map)
INSERT INTO meeting_context (id, current_meeting_id, previous_meeting_id, continuity_summary, carried_forward_tasks_count, resolved_issues_count, context_similarity_score) VALUES
(1, 2, 1, 'Follow-up on Kickoff commitments: Verified database completion, acknowledged login module frontend delay with revised deadline, and resolved authentication token strategy.', 3, 1, 0.92),
(2, 3, 2, 'Final milestone verification: Confirmed completion of Login Module (TSK-101), REST APIs (TSK-103), and RBAC (TSK-104). Transitioned focus to cloud deployment.', 4, 1, 0.95);
