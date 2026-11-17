const db = require('./db');
const aiEngine = require('./aiEngine');

async function runVerificationTests() {
  console.log('====================================================');
  console.log('STARTING AI-POWERED MEETING INTELLIGENCE TEST SUITE');
  console.log('====================================================');

  await db.getDb();

  // 1. Reset Database for a clean dynamic test
  console.log('\n[TEST 1] Resetting Database to clean empty state...');
  db.resetDatabase();
  const initialMeetings = db.query('SELECT COUNT(*) as c FROM meetings')[0].c;
  const initialTasks = db.query('SELECT COUNT(*) as c FROM tasks')[0].c;
  console.log(`Initial state verified: ${initialMeetings} meetings, ${initialTasks} tasks.`);
  if (initialMeetings !== 0 || initialTasks !== 0) throw new Error('DB not clean!');

  // 2. Test Dynamic Teams
  console.log('\n[TEST 2] Testing Dynamic Teams and Members...');
  const teams = db.query('SELECT * FROM teams');
  console.log(`Found ${teams.length} pre-configured teams: ${teams.map(t => t.name).join(', ')}`);

  // 3. Create Dynamic Meeting 1: "User Authentication & Database Architecture Kickoff"
  console.log('\n[TEST 3] Creating Dynamic Meeting 1...');
  const m1Res = db.run(`
    INSERT INTO meetings (title, meeting_date, start_time, duration_minutes, agenda, location_or_link, status, created_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, 'SCHEDULED', 1)
  `, [
    'User Authentication & Database Architecture Kickoff',
    '2026-09-01',
    '10:00:00',
    45,
    'Initial architectural review, distribute frontend login and database schema responsibilities.',
    'Room 2B'
  ]);
  const m1Id = m1Res.lastInsertRowid;

  // Add participants
  db.run(`INSERT INTO participants (meeting_id, name, department) VALUES (?, ?, ?)`, [m1Id, 'Rahul Sharma', 'Frontend']);
  db.run(`INSERT INTO participants (meeting_id, name, department) VALUES (?, ?, ?)`, [m1Id, 'Priya Patel', 'Database']);
  db.run(`INSERT INTO participants (meeting_id, name, department) VALUES (?, ?, ?)`, [m1Id, 'Dr. Sarah Jenkins', 'Engineering Lead']);

  // Insert Transcript for Meeting 1
  const t1Text = `Sarah: Welcome team. Today we need to assign key milestones for our new sprint.
Rahul: I will take up the complete Login and Authentication module. Frontend team should finish the login page by Friday September 5.
Priya: Database team will finalize the relational schema and user tables by September 4.
Sarah: Excellent. We decided to use JWT tokens and secure relational modeling.`;
  
  db.run(`
    INSERT INTO transcripts (meeting_id, raw_text, confidence_score, language)
    VALUES (?, ?, 0.98, 'en-US')
  `, [m1Id, t1Text]);

  // Run AI Meeting Understanding & Auto Assignment
  console.log(`Analyzing Meeting 1 (ID: ${m1Id})...`);
  const a1 = await aiEngine.processMeetingAnalysis(m1Id);
  console.log('Meeting 1 Analysis Complete!');

  // Verify Tasks Spawned in Meeting 1
  const m1Tasks = db.query('SELECT * FROM tasks WHERE source_meeting_id = ?', [m1Id]);
  console.log(`Extracted ${m1Tasks.length} tasks:`);
  m1Tasks.forEach(t => {
    console.log(`  - [${t.task_code}] "${t.title}" | Assigned Team: ${t.assigned_team} | Person: ${t.assigned_person} | Status: ${t.status} | Deadline: ${t.current_deadline}`);
  });

  // Verify Decisions in Meeting 1
  const m1Decisions = db.query('SELECT * FROM decisions WHERE meeting_id = ?', [m1Id]);
  console.log(`Extracted ${m1Decisions.length} decisions:`);
  m1Decisions.forEach(d => {
    console.log(`  - Decision: "${d.decision_text}" | Topic: ${d.topic}`);
  });

  if (m1Tasks.length === 0) throw new Error('No tasks extracted from Meeting 1!');
  if (m1Decisions.length === 0) throw new Error('No decisions extracted from Meeting 1!');

  // 4. Create Dynamic Meeting 2: "Sprint Progress Review & Status Sync"
  console.log('\n[TEST 4] Creating Dynamic Meeting 2 (Cross-Meeting Intelligence Test)...');
  const m2Res = db.run(`
    INSERT INTO meetings (title, meeting_date, start_time, duration_minutes, agenda, location_or_link, status, created_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, 'SCHEDULED', 1)
  `, [
    'Sprint Progress Review & Status Sync',
    '2026-09-08',
    '11:00:00',
    30,
    'Review progress on login module and database schema from Kickoff.',
    'Google Meet'
  ]);
  const m2Id = m2Res.lastInsertRowid;

  db.run(`INSERT INTO participants (meeting_id, name, department) VALUES (?, ?, ?)`, [m2Id, 'Rahul Sharma', 'Frontend']);
  db.run(`INSERT INTO participants (meeting_id, name, department) VALUES (?, ?, ?)`, [m2Id, 'Priya Patel', 'Database']);

  // Meeting 2 mentions progress on previous tasks from Meeting 1
  const t2Text = `Sarah: Good morning. Let us review our previous commitments from Kickoff.
Sarah: Rahul, how is the login module coming along?
Rahul: The backend auth is done, but frontend validation and CSS styling are still in progress. We need an extension until September 12.
Sarah: Okay, deadline extended to September 12. Priya, what is the status of the database?
Priya: Database schema and user tables are 100% completed and verified.
Sarah: Great job Priya. For token security, we decided to store JWT refresh tokens in secure HTTP-Only cookies.`;

  db.run(`
    INSERT INTO transcripts (meeting_id, raw_text, confidence_score, language)
    VALUES (?, ?, 0.99, 'en-US')
  `, [m2Id, t2Text]);

  console.log(`Analyzing Meeting 2 (ID: ${m2Id}) with Cross-Meeting Context Engine...`);
  const a2 = await aiEngine.processMeetingAnalysis(m2Id);
  console.log('Meeting 2 Analysis Complete!');

  // Verify Cross-Meeting Task Evolution
  const updatedTasks = db.query('SELECT * FROM tasks WHERE id = 1');
  console.log('\n[CROSS-MEETING VERIFICATION] Task 1 (Login Module) Current State:');
  console.log(`  - Status: ${updatedTasks[0]?.status}`);
  console.log(`  - Original Deadline: ${updatedTasks[0]?.original_deadline} -> Current Deadline: ${updatedTasks[0]?.current_deadline}`);
  console.log(`  - Progress: ${updatedTasks[0]?.progress_percentage}%`);

  const taskHistory = db.query('SELECT * FROM task_history WHERE task_id = 1 ORDER BY id ASC');
  console.log(`Task 1 Audit Trail (${taskHistory.length} events):`);
  taskHistory.forEach(h => {
    console.log(`  - Meeting #${h.meeting_id} [${h.action_type}]: ${h.previous_status || 'NONE'} -> ${h.new_status} | Note: "${h.progress_note}"`);
  });

  const mRel = db.query('SELECT * FROM meeting_relationships WHERE current_meeting_id = ?', [m2Id]);
  console.log(`Cross-Meeting Link:`);
  console.log(`  - Continuity Summary: "${mRel[0]?.continuity_summary}"`);

  // 5. Test Multilingual Translation (Tamil & Hindi)
  console.log('\n[TEST 5] Testing Multilingual Translation...');
  const taTrans = await aiEngine.translateMeetingContent(m1Id, 'ta');
  console.log(`Tamil Summary Translated: "${taTrans.summaryTranslated}"`);
  const hiTrans = await aiEngine.translateMeetingContent(m1Id, 'hi');
  console.log(`Hindi Summary Translated: "${hiTrans.summaryTranslated}"`);

  // 6. Test Natural Language Query Assistant
  console.log('\n[TEST 6] Testing Natural Language AI Query Assistant...');
  const q1 = await aiEngine.queryMeetingAssistant('Last meeting-la enna decide pannom?');
  console.log('\nQ: "Last meeting-la enna decide pannom?"');
  console.log(`A:\n${q1.answer}`);

  const q2 = await aiEngine.queryMeetingAssistant('Show the history of the login module');
  console.log('\nQ: "Show the history of the login module"');
  console.log(`A:\n${q2.answer}`);

  const q3 = await aiEngine.queryMeetingAssistant('What tasks are pending?');
  console.log('\nQ: "What tasks are pending?"');
  console.log(`A:\n${q3.answer}`);

  console.log('\n====================================================');
  console.log('ALL AI-POWERED MEETING INTELLIGENCE TESTS PASSED! ✅');
  console.log('====================================================');
}

runVerificationTests().catch(err => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
