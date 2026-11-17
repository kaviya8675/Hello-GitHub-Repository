# AI-Powered Context-Aware Meeting Intelligence

> **Dynamic, User-Input-Driven Meeting Intelligence System**  
> A complete full-stack platform featuring continuous **Cross-Meeting Context Awareness**, live speech-to-text recording, persistent relational database storage, dual-mode AI comprehension (Google Gemini LLM + high-accuracy local semantic NLP), automatic responsibility assignment, evolutionary task tracking, decision continuity, multilingual translation (Tamil, Hindi, Spanish, French, etc.), and a natural language conversational assistant.

---

## 🌟 Key Capabilities

1. **Dynamic Meeting Creation & Live Speech-to-Text Recording**:
   - Create meetings on the fly with custom titles, dates, agendas, and locations.
   - **Live Microphone Recording**: Uses browser Web Speech API (`webkitSpeechRecognition`) + `MediaRecorder` with real-time waveform visualizer to capture live speech and transcribe it directly into diarized dialogue.
   - **Audio File Upload**: Supports uploading `.mp3`, `.wav`, `.m4a`, `.webm`, and `.mp4` recordings via multipart API.
   - **Direct Transcript Editor**: Edit speech-to-text dialogue or type meeting notes directly.

2. **AI Meeting Understanding & Extraction**:
   - Automatically identifies:
     - Executive Overview & Detailed Meeting Summary
     - Key Discussion Points
     - Ratified Decisions (Topic, Rationale, Stakeholders, Impact Level)
     - Action Items & Tasks
     - Deadlines & Priorities (Critical, High, Medium, Low)
     - Follow-up Requirements for subsequent meetings.

3. **Automatic Task Assignment & Team Intelligence**:
   - AI inspects dynamic organizational teams (**Frontend**, **Backend**, **Database**, **Testing / QA**, **DevOps / Cloud**, **ML / AI**, **UI/UX**, or custom user-defined teams).
   - Dynamically analyzes discussion text to automatically assign work to the appropriate team and person based on the meeting context.
   - If ownership is unclear, marks the task as **`Unassigned / Needs Confirmation`** instead of guessing.

4. **Cross-Meeting Intelligence & Decision Continuity**:
   - **Continuous Memory**: Every new meeting automatically retrieves context from earlier meetings.
   - Correlates discussion against existing open commitments (e.g. *“Rahul, how is the login module coming along?”*).
   - Automatically transitions status: **`PENDING` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`**.
   - Detects revised deadlines (e.g. *Aug 25 extended to Sep 02*).
   - Generates a full chronological **Task Evolution Timeline** (`task_history`) preserving every audit event.
   - **Decision Continuity**: Connects previous architectural decisions to current discussions.

5. **Natural Language AI Query Assistant**:
   - Interactive conversational assistant capable of answering questions about your organization's meetings:
     - *"Last meeting-la enna decide pannom?"* (Tamil/Tanglish query about decisions in the last meeting)
     - *"What tasks are pending?"*
     - *"What is the current status of the frontend work?"*
     - *"Show the history of the login module"*
     - *"Which team has overdue tasks?"*
     - *"What did we assign to the backend team?"*
   - Cites referenced meetings, task codes, and decisions.

6. **Multilingual Translation**:
   - Instant dynamic translation of:
     - Meeting Transcripts
     - Executive Summaries
     - Key Discussion Points
     - Ratified Decisions
     - Action Items & Tasks
   - Supported languages include: **Tamil (தமிழ்)**, **Hindi (हिन्दी)**, **Spanish (Español)**, **French (Français)**, **German (Deutsch)**, and **Telugu (తెలుగు)**.
   - Translations are saved persistently in the database.

7. **Dynamic Team & Role Intelligence**:
   - Create custom engineering departments and teams.
   - Add team members with specific job titles and emails.
   - View team workload distribution and active commitments.

8. **Persistent Relational Database (Zero-Config SQLite)**:
   - Uses SQLite (`sql.js`) with persistent disk storage in `backend/database/meeting_intelligence.db`.
   - Enforces foreign keys (`PRAGMA foreign_keys = ON;`), relational integrity, and indexing across 15 tables:
     `users`, `teams`, `team_members`, `meetings`, `participants`, `transcripts`, `summaries`, `decisions`, `tasks`, `task_history`, `action_items`, `unresolved_issues`, `meeting_relationships`, `translations`, and `ai_query_logs`.
   - Data persists completely across backend server restarts.

9. **Dynamic Operating Modes (Clean Slate vs Demo Scenario)**:
   - **Clean Slate by Default**: Starts with 0 meetings and 0 tasks so you can build your own project dynamically.
   - **1-Click Demo Scenario**: Optional button on Dashboard and Settings to load a realistic 3-meeting cross-sprint progression for viva and demonstration.
   - **1-Click Reset Database**: Clears all meetings and tasks back to an empty state at any time.

---

## 🏗️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React Icons, Recharts, React Router DOM, Axios.
- **Backend**: Node.js & Express.js REST API, Multer (audio upload).
- **AI Intelligence Pipeline**:
  - **Google Gemini 1.5/2.0 Flash LLM** (when `GEMINI_API_KEY` is provided).
  - **Local Intelligent Semantic NLP State Machine** (zero-cost, offline fallback).
- **Speech-to-Text**: Browser Web Speech API (`webkitSpeechRecognition`) + MediaRecorder.
- **Database**: Persistent relational SQLite (`meeting_intelligence.db`) with complete DDL schema and foreign keys.

---

## 🚀 Quick Start Guide

### Step 1: Start Backend and Frontend Together (Windows)

Double-click or execute:
```cmd
start-all.bat
```
This starts:
- **Backend API Server** on `http://localhost:8080/api`
- **Frontend Web Application** on `http://localhost:5173`
- Automatically opens your default web browser to `http://localhost:5173`

---

### Step 2: Manual Start (Optional)

#### Terminal 1: Backend
```powershell
cd backend
npm.cmd start
```
*API live at `http://localhost:8080/api`*

#### Terminal 2: Frontend
```powershell
cd frontend
npm.cmd run dev
```
*UI live at `http://localhost:5173`*

---

## 🧪 Automated Verification Test Suite

To run the automated backend test suite verifying dynamic meeting creation, AI task assignment, cross-meeting memory, translation, and natural language query:

```powershell
cd backend
node test_meeting_intelligence.js
```

---

## 🔑 Demo Profiles (Optional 1-Click Login)

| Profile | Email / Username | Password | Role |
| :--- | :--- | :--- | :--- |
| **Dr. Sarah Jenkins** | `admin@meetingiq.ai` or `admin` | `password123` | Administrator |
| **Rahul Sharma** | `rahul@meetingiq.ai` or `rahul_dev` | `password123` | Frontend Lead |
| **Priya Patel** | `priya@meetingiq.ai` or `priya_dba` | `password123` | Database Engineer |
| **Arun Kumar** | `arun@meetingiq.ai` or `arun_lead` | `password123` | Tech Lead |

*(You can also register any new custom user account on the Register page).*
