const Database = require('better-sqlite3');
const path = require('path');

const sqlite = new Database(path.join(__dirname, 'college.db'));
sqlite.pragma('journal_mode = WAL');

// ─── Schema ───────────────────────────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email                 TEXT PRIMARY KEY,
    password              TEXT NOT NULL,
    role                  TEXT NOT NULL,
    name                  TEXT NOT NULL,
    user_id               TEXT NOT NULL,
    college               TEXT,
    dept                  TEXT,
    gpa                   REAL,
    total_program_credits INTEGER
  );

  CREATE TABLE IF NOT EXISTS completed_courses (
    email       TEXT NOT NULL,
    course_code TEXT NOT NULL,
    grade       TEXT,
    pts         REAL,
    PRIMARY KEY (email, course_code)
  );

  CREATE TABLE IF NOT EXISTS remaining_courses (
    email       TEXT NOT NULL,
    course_code TEXT NOT NULL,
    is_open     INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (email, course_code)
  );

  CREATE TABLE IF NOT EXISTS staff_teaching (
    email       TEXT NOT NULL,
    course_code TEXT NOT NULL,
    role        TEXT,
    students    INTEGER,
    slot        TEXT,
    room        TEXT,
    PRIMARY KEY (email, course_code)
  );

  CREATE TABLE IF NOT EXISTS courses (
    code    TEXT PRIMARY KEY,
    name    TEXT NOT NULL,
    credits INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS course_prereqs (
    course_code TEXT NOT NULL,
    prereq_code TEXT NOT NULL,
    PRIMARY KEY (course_code, prereq_code)
  );

  CREATE TABLE IF NOT EXISTS offerings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    course_code TEXT NOT NULL,
    type        TEXT,
    day         TEXT,
    time        TEXT,
    room        TEXT,
    staff       TEXT
  );

  CREATE TABLE IF NOT EXISTS exams (
    course_code TEXT PRIMARY KEY,
    date        TEXT,
    time        TEXT,
    hall        TEXT,
    seat        TEXT
  );

  CREATE TABLE IF NOT EXISTS registrations (
    email       TEXT NOT NULL,
    course_code TEXT NOT NULL,
    PRIMARY KEY (email, course_code)
  );

  CREATE TABLE IF NOT EXISTS roster (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    course_code TEXT NOT NULL,
    student_id  TEXT NOT NULL,
    name        TEXT NOT NULL,
    gpa         REAL,
    status      TEXT
  );

  CREATE TABLE IF NOT EXISTS term (
    id          INTEGER PRIMARY KEY DEFAULT 1,
    name        TEXT NOT NULL,
    exam_period INTEGER NOT NULL DEFAULT 0
  );
`);

// ─── Seed (runs once on first launch) ─────────────────────────────────────────
function seed() {
  const already = sqlite.prepare('SELECT COUNT(*) as n FROM courses').get();
  if (already.n > 0) return;

  const ins = {
    user:      sqlite.prepare('INSERT INTO users (email,password,role,name,user_id,college,dept,gpa,total_program_credits) VALUES (?,?,?,?,?,?,?,?,?)'),
    completed: sqlite.prepare('INSERT INTO completed_courses VALUES (?,?,?,?)'),
    remaining: sqlite.prepare('INSERT INTO remaining_courses VALUES (?,?,?)'),
    teaching:  sqlite.prepare('INSERT INTO staff_teaching (email,course_code,role,students,slot,room) VALUES (?,?,?,?,?,?)'),
    course:    sqlite.prepare('INSERT INTO courses VALUES (?,?,?)'),
    prereq:    sqlite.prepare('INSERT INTO course_prereqs VALUES (?,?)'),
    offering:  sqlite.prepare('INSERT INTO offerings (course_code,type,day,time,room,staff) VALUES (?,?,?,?,?,?)'),
    exam:      sqlite.prepare('INSERT INTO exams VALUES (?,?,?,?,?)'),
    roster:    sqlite.prepare('INSERT INTO roster (course_code,student_id,name,gpa,status) VALUES (?,?,?,?,?)'),
    term:      sqlite.prepare("INSERT OR IGNORE INTO term (id,name,exam_period) VALUES (1,'Spring 2026',0)"),
  };

  sqlite.transaction(() => {
    // Student account
    ins.user.run('student@uni.edu', '1234', 'student', 'Omar Khaled', 'ENG-2021-0457', 'ENG', null, 3.42, 132);
    for (const r of [
      ['student@uni.edu', 'MATH101', 'A',  4.0],
      ['student@uni.edu', 'PHYS101', 'B+', 3.3],
      ['student@uni.edu', 'CS101',   'A',  4.0],
      ['student@uni.edu', 'ENG101',  'A-', 3.7],
      ['student@uni.edu', 'CS102',   'B',  3.0],
      ['student@uni.edu', 'EE201',   'B+', 3.3],
    ]) ins.completed.run(...r);
    for (const [code, open] of [
      ['MATH201', 1], ['CS201', 1], ['CS210', 1], ['CS220', 1],
      ['EE301', 1],   ['EE302', 1], ['STAT201', 1], ['HUM201', 1],
    ]) ins.remaining.run('student@uni.edu', code, open);

    // Staff account
    ins.user.run('staff@uni.edu', '1234', 'staff', 'Dr. Layla Hassan', 'FAC-2014-0098', null, 'Dept. of Mathematics & CS', null, null);
    ins.teaching.run('staff@uni.edu', 'MATH201', 'Lecturer', 64, 'Sun/Tue 09:00', 'Hall B-2');
    ins.teaching.run('staff@uni.edu', 'CS201',   'Lecturer', 48, 'Sun/Tue 10:45', 'Hall A-1');

    // Courses
    for (const r of [
      ['MATH101', 'Calculus I',                   3],
      ['PHYS101', 'Physics I',                    4],
      ['CS101',   'Intro to Programming',         3],
      ['ENG101',  'English Composition',          2],
      ['CS102',   'Data Structures',              3],
      ['EE201',   'Electric Circuits',            4],
      ['MATH201', 'Calculus II',                  3],
      ['CS201',   'Algorithms',                   3],
      ['CS210',   'Database Systems',             3],
      ['CS220',   'Operating Systems',            4],
      ['EE301',   'Digital Logic Design',         3],
      ['EE302',   'Signals & Systems',            3],
      ['STAT201', 'Probability & Statistics',     3],
      ['HUM201',  'Technical Writing',            2],
    ]) ins.course.run(...r);

    for (const r of [
      ['CS102',   'CS101'],
      ['EE201',   'PHYS101'],
      ['MATH201', 'MATH101'],
      ['CS201',   'CS102'],
      ['CS210',   'CS102'],
      ['CS220',   'CS102'],
      ['EE301',   'EE201'],
      ['EE302',   'MATH101'],
      ['EE302',   'EE201'],
      ['STAT201', 'MATH101'],
      ['HUM201',  'ENG101'],
    ]) ins.prereq.run(...r);

    // Offerings
    for (const r of [
      ['MATH201', 'lecture', 'Sun / Tue', '09:00–10:30', 'Hall B-2',   'Dr. Layla Hassan'],
      ['MATH201', 'section', 'Thu',       '11:00–12:00', 'Room 214',   'TA Mona Adel'],
      ['CS201',   'lecture', 'Sun / Tue', '10:45–12:15', 'Hall A-1',   'Dr. Layla Hassan'],
      ['CS201',   'section', 'Wed',       '09:00–10:00', 'Room 118',   'TA Karim Saad'],
      ['CS210',   'lecture', 'Mon / Wed', '09:00–10:30', 'Hall A-3',   'Dr. Tarek Nour'],
      ['CS210',   'lab',     'Mon',       '13:00–15:00', 'DB Lab 2',   'Eng. Sara Fouad'],
      ['CS220',   'lecture', 'Sun / Tue', '13:00–14:30', 'Hall A-2',   'Dr. Tarek Nour'],
      ['CS220',   'lab',     'Wed',       '13:00–15:00', 'Sys Lab 1',  'Eng. Yousef Ali'],
      ['CS220',   'section', 'Thu',       '09:00–10:00', 'Room 120',   'TA Karim Saad'],
      ['EE301',   'lecture', 'Mon / Wed', '11:00–12:30', 'Hall C-1',   'Dr. Hossam Diab'],
      ['EE301',   'lab',     'Tue',       '10:00–13:00', 'Logic Lab',  'Eng. Nada Samir'],
      ['EE302',   'lecture', 'Sun / Tue', '08:00–09:30', 'Hall C-2',   'Dr. Hossam Diab'],
      ['EE302',   'section', 'Wed',       '11:00–12:00', 'Room 305',   'TA Omar Fathy'],
      ['STAT201', 'lecture', 'Mon / Wed', '13:00–14:30', 'Hall B-1',   'Dr. Amani Rashed'],
      ['STAT201', 'section', 'Thu',       '12:00–13:00', 'Room 210',   'TA Mona Adel'],
      ['HUM201',  'lecture', 'Thu',       '09:00–11:00', 'Hall D-4',   'Dr. Faten Aziz'],
    ]) ins.offering.run(...r);

    // Exams
    for (const r of [
      ['MATH201', 'Sun 18 Jan', '09:00–11:00', 'Main Hall — Sec A', 'R4-S12'],
      ['CS201',   'Tue 20 Jan', '09:00–11:00', 'CS Building — H2',  'R2-S07'],
      ['CS210',   'Wed 21 Jan', '12:00–14:00', 'CS Building — H1',  'R6-S22'],
      ['CS220',   'Thu 22 Jan', '09:00–11:30', 'Main Hall — Sec C', 'R1-S03'],
      ['EE301',   'Sun 25 Jan', '12:00–14:00', 'EE Building — H3',  'R3-S15'],
      ['EE302',   'Mon 26 Jan', '09:00–11:00', 'EE Building — H2',  'R5-S09'],
      ['STAT201', 'Wed 28 Jan', '09:00–11:00', 'Main Hall — Sec B', 'R2-S18'],
      ['HUM201',  'Thu 29 Jan', '11:00–12:30', 'Hum Building — H1', 'R1-S11'],
    ]) ins.exam.run(...r);

    // Roster (per course, for staff view)
    for (const r of [
      ['MATH201', 'ENG-2021-0457', 'Omar Khaled',  3.42, 'Registered'],
      ['MATH201', 'ENG-2021-0631', 'Sara Mostafa', 3.81, 'Registered'],
      ['MATH201', 'ENG-2022-0102', 'Youssef Adel', 2.74, 'Registered'],
      ['MATH201', 'ENG-2021-0588', 'Mariam Tarek', 3.10, 'Waitlist'],
      ['CS201',   'ENG-2021-0457', 'Omar Khaled',  3.42, 'Registered'],
      ['CS201',   'ENG-2021-0631', 'Sara Mostafa', 3.81, 'Registered'],
      ['CS201',   'ENG-2022-0102', 'Youssef Adel', 2.74, 'Registered'],
      ['CS201',   'ENG-2021-0588', 'Mariam Tarek', 3.10, 'Waitlist'],
    ]) ins.roster.run(...r);

    ins.term.run();
  })();

  console.log('✅ Database seeded');
}

seed();

// ─── Prepared statements ──────────────────────────────────────────────────────
const q = {
  getUser:        sqlite.prepare('SELECT email, password as pass, role, name, user_id as id, college, dept, gpa, total_program_credits as totalProgramCredits FROM users WHERE email = ?'),
  getCompleted:   sqlite.prepare('SELECT course_code as code, grade, pts FROM completed_courses WHERE email = ?'),
  getRemaining:   sqlite.prepare('SELECT course_code, is_open FROM remaining_courses WHERE email = ?'),
  getTeaching:    sqlite.prepare('SELECT course_code as code, role, students, slot, room FROM staff_teaching WHERE email = ?'),
  getCourse:      sqlite.prepare('SELECT code, name, credits FROM courses WHERE code = ?'),
  getPrereqs:     sqlite.prepare('SELECT prereq_code FROM course_prereqs WHERE course_code = ?'),
  getOfferings:   sqlite.prepare('SELECT type, day, time, room, staff FROM offerings WHERE course_code = ?'),
  getExam:        sqlite.prepare('SELECT date, time, hall, seat FROM exams WHERE course_code = ?'),
  getRegs:        sqlite.prepare('SELECT course_code FROM registrations WHERE email = ?'),
  delRegs:        sqlite.prepare('DELETE FROM registrations WHERE email = ?'),
  addReg:         sqlite.prepare('INSERT INTO registrations (email, course_code) VALUES (?, ?)'),
  getTerm:        sqlite.prepare('SELECT name, exam_period FROM term WHERE id = 1'),
  setExamPeriod:  sqlite.prepare('UPDATE term SET exam_period = ? WHERE id = 1'),
  getRoster:      sqlite.prepare('SELECT student_id as id, name, gpa, status FROM roster WHERE course_code = ?'),
};

// ─── Public API ───────────────────────────────────────────────────────────────
const PRICE_PER_CREDIT = 312;

function creditLimitForGPA(gpa) {
  if (gpa >= 3.5) return 21;
  if (gpa >= 3.0) return 18;
  if (gpa >= 2.0) return 15;
  return 12;
}

const COLLEGES = {
  ENG: { name: 'College of Engineering', components: ['lecture', 'lab', 'section'] },
};

function getFullUser(email) {
  const user = q.getUser.get(email);
  if (!user) return null;
  user.completed = q.getCompleted.all(email);
  if (user.role === 'student') {
    const rows = q.getRemaining.all(email);
    user.remaining = rows.map(r => r.course_code);
    user.open = rows.filter(r => r.is_open).map(r => r.course_code);
  }
  if (user.role === 'staff') {
    user.teaching = q.getTeaching.all(email);
  }
  return user;
}

function getCourse(code) {
  const course = q.getCourse.get(code);
  if (!course) return null;
  course.prereqs = q.getPrereqs.all(code).map(r => r.prereq_code);
  return course;
}

function getOfferings(code) { return q.getOfferings.all(code); }

function getExam(code) { return q.getExam.get(code); }

function getRegistrations(email) { return q.getRegs.all(email).map(r => r.course_code); }

function saveRegistration(email, codes) {
  sqlite.transaction(() => {
    q.delRegs.run(email);
    for (const code of codes) q.addReg.run(email, code);
  })();
}

function getTerm() {
  const row = q.getTerm.get();
  return { name: row.name, examPeriod: !!row.exam_period };
}

function setExamPeriod(on) {
  q.setExamPeriod.run(on ? 1 : 0);
  return getTerm();
}

function getRoster(courseCode) { return q.getRoster.all(courseCode); }

module.exports = {
  PRICE_PER_CREDIT, creditLimitForGPA, COLLEGES,
  getFullUser, getCourse, getOfferings, getExam,
  getRegistrations, saveRegistration,
  getTerm, setExamPeriod, getRoster,
};
