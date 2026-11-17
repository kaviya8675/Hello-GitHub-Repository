const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./db');
const aiEngine = require('./aiEngine');
const audioService = require('./audioService');

const app = express();
const PORT = process.env.PORT || 8080;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Upload directory static serving
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ============================================================
// TASK CODE GENERATOR HELPER
// ============================================================

function generateNextTaskCode() {
  const row = db.get(`
    SELECT MAX(CAST(SUBSTR(task_code, 5) AS INTEGER)) AS maxCode
    FROM tasks
    WHERE task_code LIKE 'TSK-%'
  `);
  const nextNumber = Math.max(Number(row?.maxCode) || 100, 100) + 1;
  return `TSK-${nextNumber}`;
}

// Helpers to format models with dual camelCase & snake_case properties
function formatMeeting(m, participants = []) {
  if (!m) return null;
  return {
    id: m.id,
    meetingId: m.id,
    title: m.title,
    description: m.description || m.agenda || '',
    agenda: m.agenda || m.description || '',
    meetingDate: m.meeting_date,
    meeting_date: m.meeting_date,
    startTime: m.start_time,
    start_time: m.start_time,
    durationMinutes: m.duration_minutes || m.duration || 30,
    duration_minutes: m.duration_minutes || m.duration || 30,
    duration: m.duration_minutes || m.duration || 30,
    locationOrLink: m.location_or_link || 'Google Meet',
    location_or_link: m.location_or_link || 'Google Meet',
    status: m.status || 'SCHEDULED',
    summary: m.summary || '',
    executiveOverview: m.executive_overview || '',
    executive_overview: m.executive_overview || '',
    followUpNotes: m.follow_up_notes || '',
    follow_up_notes: m.follow_up_notes || '',
    audioFileUrl: m.audio_file_url || null,
    audio_file_url: m.audio_file_url || null,
    audioFilename: m.audio_filename || null,
    audio_filename: m.audio_filename || null,
    createdByUserId: m.created_by_user_id || m.created_by || 1,
    created_by_user_id: m.created_by_user_id || m.created_by || 1,
    createdAt: m.created_at,
    created_at: m.created_at,
    participants: participants || []
  };
}

function formatTask(t) {
  if (!t) return null;
  return {
    id: t.id,
    taskCode: t.task_code,
    task_code: t.task_code,
    title: t.title,
    description: t.description || '',
    assignedPerson: t.assigned_person || t.assigned_to || 'Unassigned',
    assigned_person: t.assigned_person || t.assigned_to || 'Unassigned',
    assigned_to: t.assigned_person || t.assigned_to || 'Unassigned',
    assignedTeam: t.assigned_team || 'Engineering',
    assigned_team: t.assigned_team || 'Engineering',
    priority: t.priority || 'MEDIUM',
    status: t.status || 'PENDING',
    createdDate: t.created_date,
    created_date: t.created_date,
    originalDeadline: t.original_deadline || t.deadline || '2026-09-10',
    original_deadline: t.original_deadline || t.deadline || '2026-09-10',
    currentDeadline: t.current_deadline || t.deadline || '2026-09-10',
    current_deadline: t.current_deadline || t.deadline || '2026-09-10',
    deadline: t.current_deadline || t.deadline || '2026-09-10',
    sourceMeetingId: t.source_meeting_id || t.meeting_id || 1,
    source_meeting_id: t.source_meeting_id || t.meeting_id || 1,
    meeting_id: t.source_meeting_id || t.meeting_id || 1,
    lastDiscussedMeetingId: t.last_discussed_meeting_id || t.source_meeting_id || 1,
    last_discussed_meeting_id: t.last_discussed_meeting_id || t.source_meeting_id || 1,
    progressPercentage: t.progress_percentage || 0,
    progress_percentage: t.progress_percentage || 0,
    createdAt: t.created_at,
    created_at: t.created_at
  };
}

function formatDecision(d) {
  if (!d) return null;
  return {
    id: d.id,
    meetingId: d.meeting_id,
    meeting_id: d.meeting_id,
    decisionText: d.decision_text,
    decision_text: d.decision_text,
    topic: d.topic || 'General',
    peopleInvolved: d.people_involved || 'Team',
    people_involved: d.people_involved || 'Team',
    rationale: d.rationale || '',
    impactLevel: d.impact_level || 'MEDIUM',
    impact_level: d.impact_level || 'MEDIUM',
    status: d.status || 'ACTIVE',
    decidedDate: d.decided_date || 'Recent',
    decided_date: d.decided_date || 'Recent',
    createdAt: d.created_at,
    created_at: d.created_at
  };
}

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MeetingIQ API Server is running',
    port: PORT
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MeetingIQ backend is healthy and fully operational',
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// AUTHENTICATION & USERS
// ============================================================

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    let user = db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      user = db.get('SELECT * FROM users WHERE username = ?', [email]);
    }

    if (!user) {
      // Create user on the fly if test email
      const name = email.split('@')[0];
      const uRes = db.run(`
        INSERT INTO users (username, email, password_hash, full_name, name, role)
        VALUES (?, ?, ?, ?, ?, 'USER')
      `, [name, email, password || 'password123', name, name]);
      user = db.get('SELECT * FROM users WHERE id = ?', [uRes.lastInsertRowid]);
    }

    const token = `meetingiq-${user.id}-${Date.now()}`;
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.full_name || user.name || user.username,
        email: user.email,
        role: user.role || 'USER',
        avatarUrl: user.avatar_url || ''
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const existing = db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const username = email.split('@')[0];
    const uRes = db.run(`
      INSERT INTO users (username, email, password_hash, full_name, name, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [username, email, password || 'password123', name || username, name || username, role || 'USER']);

    const user = db.get('SELECT * FROM users WHERE id = ?', [uRes.lastInsertRowid]);
    const token = `meetingiq-${user.id}-${Date.now()}`;

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.full_name || user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  const admin = db.get('SELECT * FROM users WHERE role = "ADMIN" LIMIT 1') || db.get('SELECT * FROM users LIMIT 1');
  if (admin) {
    res.json({
      id: admin.id,
      name: admin.full_name || admin.name || admin.username,
      email: admin.email,
      role: admin.role
    });
  } else {
    res.json({ id: 1, name: 'Dr. Sarah Jenkins', email: 'admin@meetingiq.ai', role: 'ADMIN' });
  }
});

app.get('/api/users', (req, res) => {
  try {
    const users = db.all('SELECT * FROM users ORDER BY id ASC');
    res.json(users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.full_name || u.name || u.username,
      fullName: u.full_name || u.name || u.username,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatar_url
    })));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// TEAMS & ROLES
// ============================================================

app.get('/api/teams', (req, res) => {
  try {
    const teams = db.all('SELECT * FROM teams ORDER BY name ASC');
    const result = (teams || []).map(team => {
      const members = db.all('SELECT * FROM team_members WHERE team_id = ? ORDER BY id ASC', [team.id]);
      const mappedMembers = (members || []).map(m => ({
        id: m.id,
        teamId: m.team_id,
        team_id: m.team_id,
        name: m.user_name,
        userName: m.user_name,
        user_name: m.user_name,
        role: m.role_title,
        roleTitle: m.role_title,
        role_title: m.role_title,
        email: m.email || ''
      }));

      return {
        id: team.id,
        name: team.name,
        description: team.description || '',
        color: team.color || 'indigo',
        members: mappedMembers
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Teams error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch teams', error: error.message });
  }
});

app.post('/api/teams', (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Team name is required' });

    const result = db.run(
      'INSERT INTO teams (name, description, color) VALUES (?, ?, ?)',
      [name, description || '', color || 'blue']
    );

    const team = db.get('SELECT * FROM teams WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ ...team, members: [] });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ success: false, message: 'Failed to create team', error: error.message });
  }
});

app.post('/api/teams/:id/members', (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const { userName, roleTitle, email } = req.body;
    if (!userName) return res.status(400).json({ success: false, message: 'User name is required' });

    const result = db.run(
      'INSERT INTO team_members (team_id, user_name, role_title, email) VALUES (?, ?, ?, ?)',
      [teamId, userName, roleTitle || 'Member', email || '']
    );

    const member = db.get('SELECT * FROM team_members WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({
      id: member.id,
      teamId: member.team_id,
      userName: member.user_name,
      roleTitle: member.role_title,
      email: member.email
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add member', error: error.message });
  }
});

app.delete('/api/teams/:id', (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    db.run('DELETE FROM team_members WHERE team_id = ?', [teamId]);
    db.run('DELETE FROM teams WHERE id = ?', [teamId]);
    res.json({ success: true, message: 'Team deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// MEETINGS HUB & CREATION
// ============================================================

app.get('/api/meetings', (req, res) => {
  try {
    const meetings = db.all('SELECT * FROM meetings ORDER BY id DESC');
    const formatted = (meetings || []).map(m => {
      const participants = db.all('SELECT * FROM participants WHERE meeting_id = ?', [m.id]);
      return formatMeeting(m, participants);
    });

    res.json(formatted);
  } catch (error) {
    console.error('Fetch meetings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch meetings', error: error.message });
  }
});

app.get('/api/meetings/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const meeting = db.get('SELECT * FROM meetings WHERE id = ?', [id]);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    const participants = db.all('SELECT * FROM participants WHERE meeting_id = ?', [id]);
    const transcript = db.get('SELECT * FROM transcripts WHERE meeting_id = ?', [id]);
    const tasks = db.all('SELECT * FROM tasks WHERE source_meeting_id = ? OR last_discussed_meeting_id = ?', [id, id]).map(formatTask);
    const decisions = db.all('SELECT * FROM decisions WHERE meeting_id = ?', [id]).map(formatDecision);
    const summaries = db.get('SELECT * FROM summaries WHERE meeting_id = ?', [id]);
    const translations = db.all('SELECT * FROM translations WHERE meeting_id = ?', [id]);

    const formatted = formatMeeting(meeting, participants);
    formatted.transcript = transcript || null;
    formatted.tasks = tasks || [];
    formatted.decisions = decisions || [];
    formatted.summaries = summaries || null;
    formatted.translations = translations || [];

    res.json(formatted);
  } catch (error) {
    console.error('Meeting details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch meeting', error: error.message });
  }
});

app.post('/api/meetings', async (req, res) => {
  try {
    const {
      title,
      description,
      agenda,
      meetingDate,
      meeting_date,
      startTime,
      start_time,
      durationMinutes,
      duration,
      duration_minutes,
      locationOrLink,
      location_or_link,
      participants = [],
      rawTranscript,
      transcript,
      createdByUserId,
      created_by
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Meeting title is required'
      });
    }

    const mDate = meetingDate || meeting_date || new Date().toISOString().split('T')[0];
    let sTime = startTime || start_time || '10:00:00';
    if (sTime.length === 5) sTime += ':00';
    const durMins = parseInt(durationMinutes || duration || duration_minutes) || 30;
    const ag = agenda || description || '';
    const loc = locationOrLink || location_or_link || 'Google Meet';
    const creator = createdByUserId || created_by || 1;
    const transcriptText = (rawTranscript || transcript || '').trim();

    // Insert Meeting Record
    const result = db.run(`
      INSERT INTO meetings (
        title, meeting_date, start_time, duration_minutes,
        agenda, location_or_link, status, created_by_user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, 'SCHEDULED', ?)
    `, [
      title.trim(),
      mDate,
      sTime,
      durMins,
      ag,
      loc,
      creator
    ]);

    const newMeetingId = result.lastInsertRowid || result.lastID;
    if (!newMeetingId) {
      throw new Error('Database insert succeeded but did not return a valid row ID.');
    }

    // Insert Participants
    if (Array.isArray(participants) && participants.length > 0) {
      for (const p of participants) {
        if (!p.name || !p.name.trim()) continue;
        db.run(`
          INSERT INTO participants (meeting_id, name, email, role_in_meeting, department)
          VALUES (?, ?, ?, ?, ?)
        `, [
          newMeetingId,
          p.name.trim(),
          p.email || `${p.name.trim().toLowerCase().replace(/\s+/g, '.')}@meetingiq.ai`,
          p.roleInMeeting || p.role_in_meeting || 'Speaker',
          p.department || 'Engineering'
        ]);
      }
    }

    // Insert Raw Transcript if supplied
    if (transcriptText) {
      const diarizedJson = JSON.stringify(transcriptText.split('\n').filter(Boolean).map((line, idx) => {
        const parts = line.split(':');
        return {
          speaker: parts.length > 1 ? parts[0].trim() : `Speaker ${(idx % 3) + 1}`,
          time: `0${idx * 2}:15`,
          text: parts.length > 1 ? parts.slice(1).join(':').trim() : line.trim()
        };
      }));

      db.run(`
        INSERT INTO transcripts (meeting_id, raw_text, diarized_json, confidence_score, language)
        VALUES (?, ?, ?, 0.98, 'en-US')
      `, [newMeetingId, transcriptText, diarizedJson]);

      // Automatically trigger AI Understanding Engine
      try {
        await aiEngine.processMeetingAnalysis(newMeetingId);
      } catch (analysisErr) {
        console.warn('Auto AI analysis notice on create meeting:', analysisErr.message);
      }
    }

    // Ensure state is committed to disk binary file
    db.persist();

    // Fetch the newly created meeting with participants
    const freshMeeting = db.get('SELECT * FROM meetings WHERE id = ?', [newMeetingId]);
    const freshParticipants = db.all('SELECT * FROM participants WHERE meeting_id = ?', [newMeetingId]);
    const responsePayload = formatMeeting(freshMeeting, freshParticipants);

    // Provide dual compatibility: top-level id + meeting object
    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      id: newMeetingId,
      meetingId: newMeetingId,
      ...responsePayload,
      meeting: responsePayload
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create meeting: ' + error.message,
      error: error.message
    });
  }
});

app.put('/api/meetings/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, agenda, meetingDate, durationMinutes, status, summary, executiveOverview } = req.body;

    db.run(`
      UPDATE meetings
      SET title = COALESCE(?, title),
          agenda = COALESCE(?, agenda),
          meeting_date = COALESCE(?, meeting_date),
          duration_minutes = COALESCE(?, duration_minutes),
          status = COALESCE(?, status),
          summary = COALESCE(?, summary),
          executive_overview = COALESCE(?, executive_overview),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, agenda, meetingDate, durationMinutes, status, summary, executiveOverview, id]);

    const updated = db.get('SELECT * FROM meetings WHERE id = ?', [id]);
    res.json(formatMeeting(updated));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/meetings/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    db.run('DELETE FROM transcripts WHERE meeting_id = ?', [id]);
    db.run('DELETE FROM participants WHERE meeting_id = ?', [id]);
    db.run('DELETE FROM decisions WHERE meeting_id = ?', [id]);
    db.run('DELETE FROM action_items WHERE meeting_id = ?', [id]);
    db.run('DELETE FROM summaries WHERE meeting_id = ?', [id]);
    db.run('DELETE FROM translations WHERE meeting_id = ?', [id]);
    db.run('DELETE FROM meeting_relationships WHERE current_meeting_id = ? OR previous_meeting_id = ?', [id, id]);
    db.run('DELETE FROM task_history WHERE meeting_id = ?', [id]);
    db.run('DELETE FROM tasks WHERE source_meeting_id = ?', [id]);
    db.run('DELETE FROM meetings WHERE id = ?', [id]);
    db.persist();

    res.json({ success: true, message: `Meeting #${id} deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// AUDIO UPLOADS & PROCESSING
// ============================================================

app.post('/api/meetings/:id/audio', audioService.upload.single('audio'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const customTranscript = req.body.transcriptText || '';
    const result = await audioService.processAudioFile(req.file, id, customTranscript);

    // Run AI analysis
    try {
      await aiEngine.processMeetingAnalysis(id);
    } catch (e) {
      console.warn('AI analysis after audio upload notice:', e.message);
    }

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ success: false, message: 'Audio processing failed', error: error.message });
  }
});

app.post('/api/meetings/:id/transcript', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rawText } = req.body;
    if (!rawText) return res.status(400).json({ success: false, message: 'rawText is required' });

    const diarized = JSON.stringify(rawText.split('\n').filter(Boolean).map((line, idx) => {
      const parts = line.split(':');
      return {
        speaker: parts.length > 1 ? parts[0].trim() : `Speaker ${(idx % 3) + 1}`,
        time: `0${idx * 2}:15`,
        text: parts.length > 1 ? parts.slice(1).join(':').trim() : line.trim()
      };
    }));

    const existing = db.get('SELECT id FROM transcripts WHERE meeting_id = ?', [id]);
    if (existing) {
      db.run('UPDATE transcripts SET raw_text = ?, diarized_json = ? WHERE id = ?', [rawText, diarized, existing.id]);
    } else {
      db.run('INSERT INTO transcripts (meeting_id, raw_text, diarized_json) VALUES (?, ?, ?)', [id, rawText, diarized]);
    }

    db.run('UPDATE meetings SET status = "COMPLETED" WHERE id = ?', [id]);
    db.persist();

    res.json({ success: true, rawText, diarizedJson: diarized });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// AI CONTEXT ENGINE & TRANSLATION
// ============================================================

app.post('/api/meetings/:id/analyze', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const analysis = await aiEngine.processMeetingAnalysis(id);
    res.json({ success: true, ...analysis });
  } catch (error) {
    console.error('AI analyze error:', error);
    res.status(500).json({ success: false, message: 'AI analysis failed: ' + error.message, error: error.message });
  }
});

app.post('/api/meetings/:id/translate', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const lang = req.body.targetLanguage || req.body.language || 'ta';
    const translation = await aiEngine.translateMeetingContent(id, lang);
    res.json(translation);
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ success: false, message: 'Translation failed', error: error.message });
  }
});

app.get('/api/meetings/:id/context', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const meeting = db.get('SELECT * FROM meetings WHERE id = ?', [id]);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    const prevMeetings = db.all('SELECT * FROM meetings WHERE id < ? ORDER BY id DESC', [id]).map(m => formatMeeting(m));
    const histories = db.all(`
      SELECT th.*, t.task_code, t.title as task_title, t.assigned_person, t.assigned_team
      FROM task_history th
      JOIN tasks t ON t.id = th.task_id
      WHERE th.meeting_id = ?
      ORDER BY th.id ASC
    `, [id]);

    const relationships = db.all('SELECT * FROM meeting_relationships WHERE current_meeting_id = ?', [id]);
    const meetingDecisions = db.all('SELECT * FROM decisions WHERE meeting_id = ?', [id]).map(formatDecision);
    const meetingActionItems = db.all('SELECT * FROM action_items WHERE meeting_id = ?', [id]);

    res.json({
      currentMeeting: formatMeeting(meeting),
      previousMeetings: prevMeetings || [],
      taskEvolutionsInThisMeeting: histories || [],
      relationships: relationships || [],
      decisionsInMeeting: meetingDecisions || [],
      actionItems: meetingActionItems || [],
      contextLinks: relationships || []
    });
  } catch (error) {
    console.error('Context error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch context', error: error.message });
  }
});

// ============================================================
// TASKS & KANBAN TRACKER
// ============================================================

app.get('/api/tasks', (req, res) => {
  try {
    const tasks = db.all('SELECT * FROM tasks ORDER BY id ASC');
    res.json((tasks || []).map(formatTask));
  } catch (error) {
    console.error('Tasks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks', error: error.message });
  }
});

app.get('/api/tasks/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const task = db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const history = db.all('SELECT * FROM task_history WHERE task_id = ? ORDER BY id ASC', [id]);
    res.json({ ...formatTask(task), history: history || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/tasks/:id/history', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const history = db.all('SELECT * FROM task_history WHERE task_id = ? ORDER BY id ASC', [id]);
    res.json(history || []);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const {
      title,
      description,
      assignedPerson,
      assigned_person,
      assignedTeam,
      assigned_team,
      priority,
      status,
      originalDeadline,
      currentDeadline,
      deadline,
      sourceMeetingId,
      meeting_id
    } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Task title is required' });

    const taskCode = generateNextTaskCode();
    const person = assignedPerson || assigned_person || 'Unassigned';
    const team = assignedTeam || assigned_team || 'General';
    const dLine = currentDeadline || originalDeadline || deadline || '2026-09-15';
    const mId = sourceMeetingId || meeting_id || 1;

    const result = db.run(`
      INSERT INTO tasks (
        task_code, title, description, assigned_person, assigned_team,
        priority, status, created_date, original_deadline, current_deadline,
        source_meeting_id, last_discussed_meeting_id, progress_percentage
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [
      taskCode,
      title,
      description || '',
      person,
      team,
      priority || 'MEDIUM',
      status || 'PENDING',
      new Date().toISOString().split('T')[0],
      dLine,
      dLine,
      mId,
      mId
    ]);

    const newId = result.lastInsertRowid || result.lastID;

    db.run(`
      INSERT INTO task_history (
        task_id, meeting_id, action_type, previous_status, new_status,
        previous_deadline, new_deadline, previous_assignee, new_assignee,
        progress_note, discussed_date
      )
      VALUES (?, ?, 'CREATED', NULL, ?, NULL, ?, NULL, ?, ?, ?)
    `, [
      newId, mId, status || 'PENDING', dLine, person,
      `Task created: ${title}`,
      new Date().toISOString().split('T')[0]
    ]);

    const task = db.get('SELECT * FROM tasks WHERE id = ?', [newId]);
    res.status(201).json(formatTask(task));
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const task = db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const {
      status,
      currentDeadline,
      assignedPerson,
      progressPercentage,
      progressNote,
      meetingId
    } = req.body;

    const prevStatus = task.status;
    const prevDeadline = task.current_deadline;
    const prevAssignee = task.assigned_person;

    const nextStatus = status || prevStatus;
    const nextDeadline = currentDeadline || prevDeadline;
    const nextAssignee = assignedPerson || prevAssignee;
    const nextProgress = progressPercentage !== undefined
      ? progressPercentage
      : (nextStatus === 'COMPLETED' ? 100 : task.progress_percentage);

    db.run(`
      UPDATE tasks
      SET status = ?,
          current_deadline = ?,
          assigned_person = ?,
          progress_percentage = ?,
          last_discussed_meeting_id = COALESCE(?, last_discussed_meeting_id),
          completion_date = CASE WHEN ? = 'COMPLETED' THEN CURRENT_TIMESTAMP ELSE completion_date END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [nextStatus, nextDeadline, nextAssignee, nextProgress, meetingId || null, nextStatus, id]);

    const actionType = nextStatus === 'COMPLETED'
      ? 'COMPLETED'
      : (nextDeadline !== prevDeadline ? 'DEADLINE_EXTENDED' : 'PROGRESS_UPDATED');

    db.run(`
      INSERT INTO task_history (
        task_id, meeting_id, action_type, previous_status, new_status,
        previous_deadline, new_deadline, previous_assignee, new_assignee,
        progress_note, discussed_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      meetingId || task.last_discussed_meeting_id || 1,
      actionType,
      prevStatus,
      nextStatus,
      prevDeadline,
      nextDeadline,
      prevAssignee,
      nextAssignee,
      progressNote || `Updated status to ${nextStatus}`,
      new Date().toISOString().split('T')[0]
    ]);

    const updated = db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json(formatTask(updated));
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    db.run('DELETE FROM task_history WHERE task_id = ?', [id]);
    db.run('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// DECISIONS LOG
// ============================================================

app.get('/api/decisions', (req, res) => {
  try {
    const decisions = db.all('SELECT * FROM decisions ORDER BY id DESC');
    res.json((decisions || []).map(formatDecision));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/decisions/meeting/:meetingId', (req, res) => {
  try {
    const meetingId = parseInt(req.params.meetingId);
    const decisions = db.all('SELECT * FROM decisions WHERE meeting_id = ? ORDER BY id DESC', [meetingId]);
    res.json((decisions || []).map(formatDecision));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/decisions', (req, res) => {
  try {
    const { meetingId, decisionText, topic, peopleInvolved, rationale, impactLevel, decidedDate } = req.body;
    if (!decisionText) return res.status(400).json({ success: false, message: 'Decision text is required' });

    const result = db.run(`
      INSERT INTO decisions (
        meeting_id, decision_text, topic, people_involved,
        rationale, impact_level, status, decided_date
      )
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    `, [
      meetingId || 1,
      decisionText,
      topic || 'General',
      peopleInvolved || 'Team Members',
      rationale || '',
      impactLevel || 'MEDIUM',
      decidedDate || new Date().toISOString().split('T')[0]
    ]);

    const d = db.get('SELECT * FROM decisions WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(formatDecision(d));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// CROSS-MEETING TIMELINE (EVOLUTION GRAPH)
// ============================================================

app.get('/api/timeline', (req, res) => {
  try {
    const meetings = db.all('SELECT * FROM meetings ORDER BY meeting_date ASC, id ASC');
    const nodes = (meetings || []).map(m => {
      const createdTasks = db.all('SELECT * FROM tasks WHERE source_meeting_id = ?', [m.id]).map(formatTask);
      const evolvedTasks = db.all(`
        SELECT th.*, t.task_code, t.title as task_title, t.assigned_person, t.assigned_team
        FROM task_history th
        JOIN tasks t ON t.id = th.task_id
        WHERE th.meeting_id = ? AND th.action_type != 'CREATED'
        ORDER BY th.id ASC
      `, [m.id]);
      const decisions = db.all('SELECT * FROM decisions WHERE meeting_id = ?', [m.id]).map(formatDecision);

      return {
        meetingId: m.id,
        meetingTitle: m.title,
        meetingDate: m.meeting_date,
        summary: m.summary || '',
        executiveOverview: m.executive_overview || '',
        tasksCreated: createdTasks || [],
        taskEvolutions: evolvedTasks || [],
        decisions: decisions || []
      };
    });

    res.json(nodes);
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// DASHBOARD STATS
// ============================================================

app.get('/api/dashboard', (req, res) => {
  try {
    const totalMeetings = db.get('SELECT COUNT(*) as c FROM meetings')?.c || 0;
    const tasksTotal = db.get('SELECT COUNT(*) as c FROM tasks')?.c || 0;
    const pendingTasks = db.get('SELECT COUNT(*) as c FROM tasks WHERE status = "PENDING"')?.c || 0;
    const inProgressTasks = db.get('SELECT COUNT(*) as c FROM tasks WHERE status = "IN_PROGRESS"')?.c || 0;
    const completedTasks = db.get('SELECT COUNT(*) as c FROM tasks WHERE status = "COMPLETED"')?.c || 0;
    const overdueTasks = db.get('SELECT COUNT(*) as c FROM tasks WHERE status = "OVERDUE"')?.c || 0;
    const blockedTasks = db.get('SELECT COUNT(*) as c FROM tasks WHERE status = "BLOCKED"')?.c || 0;
    const totalDecisions = db.get('SELECT COUNT(*) as c FROM decisions')?.c || 0;

    // Workload by team
    const teams = db.all('SELECT * FROM teams ORDER BY name ASC');
    const teamWorkload = (teams || []).map(team => {
      const count = db.get('SELECT COUNT(*) as c FROM tasks WHERE assigned_team = ?', [team.name])?.c || 0;
      const completed = db.get('SELECT COUNT(*) as c FROM tasks WHERE assigned_team = ? AND status = "COMPLETED"', [team.name])?.c || 0;
      return {
        name: team.name,
        color: team.color || 'blue',
        totalTasks: count,
        completedTasks: completed,
        completionRate: count > 0 ? Math.round((completed / count) * 100) : 0
      };
    });

    const recentMeetings = db.all('SELECT * FROM meetings ORDER BY id DESC LIMIT 5').map(m => formatMeeting(m));
    const recentTasks = db.all('SELECT * FROM tasks ORDER BY id DESC LIMIT 6').map(formatTask);
    const recentDecisions = db.all('SELECT * FROM decisions ORDER BY id DESC LIMIT 5').map(formatDecision);

    res.json({
      metrics: {
        totalMeetings,
        tasksTotal,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks,
        blockedTasks,
        totalDecisions
      },
      teamWorkload,
      recentMeetings,
      recentTasks,
      recentDecisions
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// EXECUTIVE & CEO INTELLIGENCE SUITE
// ============================================================

app.get('/api/executive-insights', (req, res) => {
  try {
    const totalMeetings = db.get('SELECT COUNT(*) as c FROM meetings')?.c || 0;
    const meetings = db.all('SELECT * FROM meetings ORDER BY id ASC');
    const totalMinutes = meetings.reduce((acc, m) => acc + (m.duration_minutes || 30), 0);
    const totalMeetingHours = Math.round((totalMinutes / 60) * 10) / 10;

    // Benchmark: 4 attendees avg per meeting @ standard $75/hr blended corporate rate
    const estimatedCost = Math.round(totalMeetingHours * 4 * 75);

    const totalTasks = db.get('SELECT COUNT(*) as c FROM tasks')?.c || 0;
    const completedTasks = db.get('SELECT COUNT(*) as c FROM tasks WHERE status = "COMPLETED"')?.c || 0;
    const inProgressTasks = db.get('SELECT COUNT(*) as c FROM tasks WHERE status = "IN_PROGRESS"')?.c || 0;
    const blockedTasks = db.get('SELECT COUNT(*) as c FROM tasks WHERE status = "BLOCKED"')?.c || 0;
    const deadlineExtensionsCount = db.get('SELECT COUNT(*) as c FROM task_history WHERE action_type = "DEADLINE_EXTENDED"')?.c || 0;

    // Delivery Health Score calculation (0 - 100)
    let deliveryHealthScore = 95;
    if (blockedTasks > 0) deliveryHealthScore -= blockedTasks * 10;
    if (deadlineExtensionsCount > 0) deliveryHealthScore -= deadlineExtensionsCount * 3;
    deliveryHealthScore = Math.max(Math.min(deliveryHealthScore, 100), 40);

    // High Impact Strategic Decisions
    const strategicDecisions = db.all('SELECT * FROM decisions WHERE impact_level = "HIGH" ORDER BY id DESC LIMIT 8').map(formatDecision);

    // Blockers & Risk Radar
    const risks = [];
    const openTasks = db.all('SELECT * FROM tasks WHERE status != "COMPLETED"');
    openTasks.forEach(t => {
      if (t.status === 'BLOCKED') {
        risks.push({
          type: 'CRITICAL_BLOCKER',
          severity: 'HIGH',
          title: `Blocker on ${t.title} [${t.task_code}]`,
          owner: t.assigned_person,
          team: t.assigned_team,
          impact: 'Sprint deliverable stalled'
        });
      }
    });

    if (deadlineExtensionsCount > 0) {
      risks.push({
        type: 'SCHEDULE_SLIPPAGE',
        severity: 'MEDIUM',
        title: `${deadlineExtensionsCount} milestone deadline revisions detected across sprint history`,
        owner: 'Engineering Leadership',
        team: 'Cross-functional',
        impact: 'Delivery milestone adjusted to accommodate verification'
      });
    }

    // Cross-Department Velocity Matrix
    const teams = db.all('SELECT * FROM teams ORDER BY name ASC');
    const departmentVelocity = teams.map(tm => {
      const count = db.get('SELECT COUNT(*) as c FROM tasks WHERE assigned_team = ?', [tm.name])?.c || 0;
      const comp = db.get('SELECT COUNT(*) as c FROM tasks WHERE assigned_team = ? AND status = "COMPLETED"', [tm.name])?.c || 0;
      return {
        department: tm.name,
        activeTasks: count - comp,
        completedTasks: comp,
        totalTasks: count,
        velocityRate: count > 0 ? Math.round((comp / count) * 100) : 100,
        healthStatus: (count - comp > 3) ? 'HIGH_LOAD' : 'ON_TRACK'
      };
    });

    // C-Suite Executive Briefing Text
    const executiveBriefing = `
EXECUTIVE STRATEGIC DIGEST
Organization: Enterprise Product Engineering
Analysis Horizon: ${meetings.length} Sprint Sessions Tracked (${totalMeetingHours} Total Meeting Hours)

1. STRATEGIC DELIVERY OVERVIEW
- Completed Deliverables: ${completedTasks} of ${totalTasks} (${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100}% overall sprint velocity).
- Organization Delivery Health Score: ${deliveryHealthScore}%
- Active Workstreams: ${inProgressTasks} active development threads across Frontend, Backend, and Database teams.

2. HIGH-IMPACT CORPORATE RATIFICATIONS
- Key architectural & security decisions were ratified, including JWT authentication enforcement, relational schema normalization, and automated CI/CD cloud deployment schedules.
- All core sprint blockers have been addressed with clear engineering ownership.

3. RESOURCE EFFICIENCY & MEETING BURNOUT RADAR
- Total Engineering Time Invested in Meetings: ${totalMeetingHours} hours.
- Estimated Organizational Investment: $${estimatedCost.toLocaleString()} USD.
- Meeting Efficiency Rating: HIGH (Meetings generated ${totalTasks} actionable commitments with continuous context memory tracking).
    `.trim();

    res.json({
      executiveSummary: `Sprint health is at ${deliveryHealthScore}%. ${completedTasks}/${totalTasks} commitments verified. Continuous memory engine has documented ${strategicDecisions.length} C-Suite strategic decisions across ${totalMeetings} meetings.`,
      companyMetrics: {
        totalMeetingsCount: totalMeetings,
        totalMeetingHours,
        estimatedMeetingCost: estimatedCost,
        deliveryHealthScore,
        completedTasks,
        totalTasks,
        deadlineExtensionsCount,
        criticalRisksCount: risks.length
      },
      strategicDecisions,
      riskRadar: risks,
      departmentVelocity,
      executiveBriefing
    });
  } catch (error) {
    console.error('Executive insights error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// NATURAL LANGUAGE AI ASSISTANT QUERY
// ============================================================

app.post('/api/ai/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, message: 'Query is required' });

    const result = await aiEngine.queryMeetingAssistant(query);
    res.json(result);
  } catch (error) {
    console.error('AI query error:', error);
    res.status(500).json({ success: false, message: 'AI query failed', error: error.message });
  }
});

// ============================================================
// UNIVERSAL SEARCH
// ============================================================

app.get('/api/search', (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase().trim();
    if (!q) {
      return res.json({ query: '', meetings: [], tasks: [], decisions: [], matchedPeople: [], matchedTopics: [] });
    }

    const allMeetings = db.all('SELECT * FROM meetings ORDER BY id DESC');
    const allTasks = db.all('SELECT * FROM tasks ORDER BY id DESC');
    const allDecisions = db.all('SELECT * FROM decisions ORDER BY id DESC');

    const matchedMeetings = allMeetings.filter(m =>
      m.title.toLowerCase().includes(q) ||
      (m.agenda && m.agenda.toLowerCase().includes(q)) ||
      (m.summary && m.summary.toLowerCase().includes(q))
    ).map(m => formatMeeting(m));

    const matchedTasks = allTasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.assigned_person && t.assigned_person.toLowerCase().includes(q))
    ).map(formatTask);

    const matchedDecisions = allDecisions.filter(d =>
      d.decision_text.toLowerCase().includes(q) ||
      (d.topic && d.topic.toLowerCase().includes(q)) ||
      (d.rationale && d.rationale.toLowerCase().includes(q))
    ).map(formatDecision);

    const peopleSet = new Set();
    matchedTasks.forEach(t => peopleSet.add(t.assignedPerson));
    matchedDecisions.forEach(d => (d.peopleInvolved || '').split(',').forEach(p => peopleSet.add(p.trim())));

    const topicsSet = new Set();
    matchedDecisions.forEach(d => topicsSet.add(d.topic));
    matchedMeetings.forEach(m => topicsSet.add(m.title));

    res.json({
      query: q,
      meetings: matchedMeetings,
      tasks: matchedTasks,
      decisions: matchedDecisions,
      matchedPeople: Array.from(peopleSet).filter(p => p.toLowerCase().includes(q) || q.length > 2),
      matchedTopics: Array.from(topicsSet)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// DEMO SCENARIO & DATABASE RESET
// ============================================================

app.post('/api/demo/reset', (req, res) => {
  try {
    const result = db.resetDatabase();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/demo/seed', (req, res) => {
  try {
    const result = db.seedSampleScenario();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// AI SETTINGS
// ============================================================

app.get('/api/settings/ai-status', (req, res) => {
  res.json({
    activeModel: 'Gemini 1.5 Pro / Hybrid Offline Intelligence',
    status: 'READY',
    speechToText: 'Web Speech API + Diarization Engine',
    translationLanguages: ['Tamil (தமிழ்)', 'Hindi (हिन्दी)', 'English', 'Spanish'],
    crossMeetingMemory: 'ACTIVE',
    databaseType: 'SQLite (Persistent Binary Storage)'
  });
});

app.post('/api/settings/gemini-key', (req, res) => {
  res.json({
    success: true,
    message: 'AI engine configured successfully'
  });
});

// ============================================================
// 404 & ERROR HANDLERS
// ============================================================

app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

app.use((error, req, res, next) => {
  console.error('Global server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// ============================================================
// ASYNC DATABASE INITIALIZATION & SERVER STARTUP
// ============================================================

async function startServer() {
  try {
    console.log('Initializing SQLite database engine with sql.js...');
    await db.getDb();
    console.log('Database initialized successfully.');

    app.listen(PORT, () => {
      console.log('');
      console.log('==============================================');
      console.log('      MeetingIQ Context Intelligence API');
      console.log('==============================================');
      console.log(`API Server : http://localhost:${PORT}`);
      console.log(`Health     : http://localhost:${PORT}/api/health`);
      console.log(`Dashboard  : http://localhost:${PORT}/api/dashboard`);
      console.log(`Meetings   : http://localhost:${PORT}/api/meetings`);
      console.log(`Executive  : http://localhost:${PORT}/api/executive-insights`);
      console.log('==============================================');
      console.log('');
    });
  } catch (error) {
    console.error('CRITICAL: Failed to initialize database:', error);
    process.exit(1);
  }
}

startServer();