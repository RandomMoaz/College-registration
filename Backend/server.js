// server.js — University Online registration API
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 4000;
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

app.use(cors());
app.use(express.json());

/* ---------- tiny signed-token helper (no external deps) ---------- */
function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${mac}`;
}
function verify(token) {
  if (!token || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (mac !== expected) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()); }
  catch { return null; }
}

/* ---------- auth middleware ---------- */
function auth(roles) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const claims = verify(token);
    const user = claims && db.getFullUser(claims.email);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    if (roles && !roles.includes(user.role)) return res.status(403).json({ error: 'Forbidden for your role' });
    req.user = { ...user, email: claims.email };
    next();
  };
}

const credits = (code) => db.getCourse(code)?.credits || 0;
const cost = (code) => credits(code) * db.PRICE_PER_CREDIT;
const passedCodes = (u) => new Set(u.completed.map((c) => c.code));

/* ============================ AUTH ============================ */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  const key = String(email || '').toLowerCase();
  const u = db.getFullUser(key);
  if (!u || u.pass !== password) return res.status(401).json({ error: 'Invalid email or password' });
  const token = sign({ email: key, role: u.role, iat: Date.now() });
  res.json({ token, user: { name: u.name, role: u.role, id: u.id } });
});

/* ====================== STUDENT ENDPOINTS ====================== */
app.get('/api/me', auth(['student']), (req, res) => {
  const u = req.user;
  const earned = u.completed.reduce((s, c) => s + credits(c.code), 0);
  res.json({
    name: u.name, id: u.id, role: u.role,
    college: db.COLLEGES[u.college],
    gpa: u.gpa,
    creditLimit: db.creditLimitForGPA(u.gpa),
    earnedCredits: earned,
    totalProgramCredits: u.totalProgramCredits,
    completed: u.completed.map((c) => ({ ...db.getCourse(c.code), grade: c.grade, pts: c.pts })),
    remaining: u.remaining.map((code) => ({ ...db.getCourse(code), open: u.open.includes(code) })),
    pricePerCredit: db.PRICE_PER_CREDIT,
  });
});

// open courses the student is eligible for (prereqs satisfied, not already passed)
app.get('/api/courses/open', auth(['student']), (req, res) => {
  const u = req.user;
  const passed = passedCodes(u);
  const list = u.open
    .filter((code) => !passed.has(code))
    .filter((code) => db.getCourse(code).prereqs.every((p) => passed.has(p)))
    .map((code) => ({ ...db.getCourse(code), cost: cost(code) }));
  res.json({ courses: list, creditLimit: db.creditLimitForGPA(u.gpa), pricePerCredit: db.PRICE_PER_CREDIT });
});

app.post('/api/register', auth(['student']), (req, res) => {
  const u = req.user;
  const codes = Array.isArray(req.body?.codes) ? req.body.codes : [];
  const passed = passedCodes(u);
  const limit = db.creditLimitForGPA(u.gpa);

  for (const code of codes) {
    const c = db.getCourse(code);
    if (!c || !u.open.includes(code)) return res.status(400).json({ error: `${code} is not open for registration` });
    if (!c.prereqs.every((p) => passed.has(p))) return res.status(400).json({ error: `Prerequisites not met for ${code}` });
  }
  const total = codes.reduce((s, c) => s + credits(c), 0);
  if (total > limit) return res.status(400).json({ error: `Selection (${total} cr) exceeds your ${limit}-credit limit` });

  db.saveRegistration(u.email, codes);
  res.json({ registered: codes, creditHours: total, totalCost: codes.reduce((s, c) => s + cost(c), 0) });
});

app.get('/api/schedule', auth(['student']), (req, res) => {
  const codes = db.getRegistrations(req.user.email);
  const subjects = codes.map((code) => ({
    ...db.getCourse(code),
    cost: cost(code),
    sessions: db.getOfferings(code),
  }));
  res.json({
    college: db.COLLEGES[req.user.college],
    subjects,
    creditHours: codes.reduce((s, c) => s + credits(c), 0),
    totalCost: codes.reduce((s, c) => s + cost(c), 0),
    pricePerCredit: db.PRICE_PER_CREDIT,
  });
});

app.get('/api/exams', auth(['student']), (req, res) => {
  const term = db.getTerm();
  if (!term.examPeriod) return res.json({ examPeriod: false, term: term.name, exams: [] });
  const codes = db.getRegistrations(req.user.email);
  const exams = codes.map((code) => ({ ...db.getCourse(code), ...db.getExam(code) }));
  res.json({ examPeriod: true, term: term.name, studentId: req.user.id, exams });
});

/* ======================= STAFF ENDPOINTS ====================== */
app.get('/api/staff/courses', auth(['staff']), (req, res) => {
  const courses = req.user.teaching.map((t) => ({ ...t, ...db.getCourse(t.code) }));
  res.json({ dept: req.user.dept, courses });
});

app.get('/api/staff/roster', auth(['staff']), (req, res) => {
  const rosters = req.user.teaching.map((t) => ({
    ...db.getCourse(t.code), slot: t.slot, room: t.room, enrolled: t.students,
    students: db.getRoster(t.code),
  }));
  res.json({ rosters });
});

app.get('/api/staff/exams', auth(['staff']), (req, res) => {
  const term = db.getTerm();
  if (!term.examPeriod) return res.json({ examPeriod: false, exams: [] });
  const exams = req.user.teaching.map((t) => ({ ...db.getCourse(t.code), students: t.students, ...db.getExam(t.code) }));
  res.json({ examPeriod: true, exams });
});

/* ======================= TERM (demo) ========================= */
app.get('/api/term', auth(), (req, res) => res.json(db.getTerm()));
app.post('/api/term/exam-period', auth(), (req, res) => res.json(db.setExamPeriod(!!req.body?.on)));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`✅ API running on http://localhost:${PORT}`));
