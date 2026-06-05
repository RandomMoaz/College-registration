const PRICE_PER_CREDIT = 312;

// GPA -> maximum credit hours allowed in one term
function creditLimitForGPA(gpa) {
  if (gpa >= 3.5) return 21;
  if (gpa >= 3.0) return 18;
  if (gpa >= 2.0) return 15;
  return 12; // academic probation
}

const COLLEGES = {
  ENG: { name: 'College of Engineering', components: ['lecture', 'lab', 'section'] },
};

const COURSES = {
  MATH101: { code: 'MATH101', name: 'Calculus I', credits: 3, prereqs: [] },
  PHYS101: { code: 'PHYS101', name: 'Physics I', credits: 4, prereqs: [] },
  CS101:   { code: 'CS101',   name: 'Intro to Programming', credits: 3, prereqs: [] },
  ENG101:  { code: 'ENG101',  name: 'English Composition', credits: 2, prereqs: [] },
  CS102:   { code: 'CS102',   name: 'Data Structures', credits: 3, prereqs: ['CS101'] },
  EE201:   { code: 'EE201',   name: 'Electric Circuits', credits: 4, prereqs: ['PHYS101'] },

  MATH201: { code: 'MATH201', name: 'Calculus II', credits: 3, prereqs: ['MATH101'] },
  CS201:   { code: 'CS201',   name: 'Algorithms', credits: 3, prereqs: ['CS102'] },
  CS210:   { code: 'CS210',   name: 'Database Systems', credits: 3, prereqs: ['CS102'] },
  CS220:   { code: 'CS220',   name: 'Operating Systems', credits: 4, prereqs: ['CS102'] },
  EE301:   { code: 'EE301',   name: 'Digital Logic Design', credits: 3, prereqs: ['EE201'] },
  EE302:   { code: 'EE302',   name: 'Signals & Systems', credits: 3, prereqs: ['MATH101', 'EE201'] },
  STAT201: { code: 'STAT201', name: 'Probability & Statistics', credits: 3, prereqs: ['MATH101'] },
  HUM201:  { code: 'HUM201',  name: 'Technical Writing', credits: 2, prereqs: ['ENG101'] },
};

// Schedule components per course (college-specific): lecture | lab | section
const OFFERINGS = {
  MATH201: [
    { type: 'lecture', day: 'Sun / Tue', time: '09:00–10:30', room: 'Hall B-2', staff: 'Dr. Layla Hassan' },
    { type: 'section', day: 'Thu',        time: '11:00–12:00', room: 'Room 214', staff: 'TA Mona Adel' },
  ],
  CS201: [
    { type: 'lecture', day: 'Sun / Tue', time: '10:45–12:15', room: 'Hall A-1', staff: 'Dr. Layla Hassan' },
    { type: 'section', day: 'Wed',        time: '09:00–10:00', room: 'Room 118', staff: 'TA Karim Saad' },
  ],
  CS210: [
    { type: 'lecture', day: 'Mon / Wed', time: '09:00–10:30', room: 'Hall A-3', staff: 'Dr. Tarek Nour' },
    { type: 'lab',     day: 'Mon',        time: '13:00–15:00', room: 'DB Lab 2', staff: 'Eng. Sara Fouad' },
  ],
  CS220: [
    { type: 'lecture', day: 'Sun / Tue', time: '13:00–14:30', room: 'Hall A-2', staff: 'Dr. Tarek Nour' },
    { type: 'lab',     day: 'Wed',        time: '13:00–15:00', room: 'Sys Lab 1', staff: 'Eng. Yousef Ali' },
    { type: 'section', day: 'Thu',        time: '09:00–10:00', room: 'Room 120', staff: 'TA Karim Saad' },
  ],
  EE301: [
    { type: 'lecture', day: 'Mon / Wed', time: '11:00–12:30', room: 'Hall C-1', staff: 'Dr. Hossam Diab' },
    { type: 'lab',     day: 'Tue',        time: '10:00–13:00', room: 'Logic Lab', staff: 'Eng. Nada Samir' },
  ],
  EE302: [
    { type: 'lecture', day: 'Sun / Tue', time: '08:00–09:30', room: 'Hall C-2', staff: 'Dr. Hossam Diab' },
    { type: 'section', day: 'Wed',        time: '11:00–12:00', room: 'Room 305', staff: 'TA Omar Fathy' },
  ],
  STAT201: [
    { type: 'lecture', day: 'Mon / Wed', time: '13:00–14:30', room: 'Hall B-1', staff: 'Dr. Amani Rashed' },
    { type: 'section', day: 'Thu',        time: '12:00–13:00', room: 'Room 210', staff: 'TA Mona Adel' },
  ],
  HUM201: [
    { type: 'lecture', day: 'Thu', time: '09:00–11:00', room: 'Hall D-4', staff: 'Dr. Faten Aziz' },
  ],
};

const EXAMS = {
  MATH201: { date: 'Sun 18 Jan', time: '09:00–11:00', hall: 'Main Hall — Sec A', seat: 'R4-S12' },
  CS201:   { date: 'Tue 20 Jan', time: '09:00–11:00', hall: 'CS Building — H2', seat: 'R2-S07' },
  CS210:   { date: 'Wed 21 Jan', time: '12:00–14:00', hall: 'CS Building — H1', seat: 'R6-S22' },
  CS220:   { date: 'Thu 22 Jan', time: '09:00–11:30', hall: 'Main Hall — Sec C', seat: 'R1-S03' },
  EE301:   { date: 'Sun 25 Jan', time: '12:00–14:00', hall: 'EE Building — H3', seat: 'R3-S15' },
  EE302:   { date: 'Mon 26 Jan', time: '09:00–11:00', hall: 'EE Building — H2', seat: 'R5-S09' },
  STAT201: { date: 'Wed 28 Jan', time: '09:00–11:00', hall: 'Main Hall — Sec B', seat: 'R2-S18' },
  HUM201:  { date: 'Thu 29 Jan', time: '11:00–12:30', hall: 'Hum Building — H1', seat: 'R1-S11' },
};

const USERS = {
  'student@uni.edu': {
    pass: '1234', role: 'student',
    name: 'Omar Khaled', id: 'ENG-2021-0457', college: 'ENG',
    gpa: 3.42,
    completed: [
      { code: 'MATH101', grade: 'A',  pts: 4.0 },
      { code: 'PHYS101', grade: 'B+', pts: 3.3 },
      { code: 'CS101',   grade: 'A',  pts: 4.0 },
      { code: 'ENG101',  grade: 'A-', pts: 3.7 },
      { code: 'CS102',   grade: 'B',  pts: 3.0 },
      { code: 'EE201',   grade: 'B+', pts: 3.3 },
    ],
    remaining: ['MATH201', 'CS201', 'CS210', 'CS220', 'EE301', 'EE302', 'STAT201', 'HUM201'],
    open:      ['MATH201', 'CS201', 'CS210', 'CS220', 'EE301', 'EE302', 'STAT201', 'HUM201'],
    totalProgramCredits: 132,
  },
  'staff@uni.edu': {
    pass: '1234', role: 'staff',
    name: 'Dr. Layla Hassan', id: 'FAC-2014-0098', dept: 'Dept. of Mathematics & CS',
    teaching: [
      { code: 'MATH201', role: 'Lecturer', students: 64, slot: 'Sun/Tue 09:00', room: 'Hall B-2' },
      { code: 'CS201',   role: 'Lecturer', students: 48, slot: 'Sun/Tue 10:45', room: 'Hall A-1' },
    ],
  },
};

// Mutable runtime state (resets on restart). Move to a DB to persist.
const registrations = {};          // { email: [courseCode, ...] }
const term = { name: 'Spring 2026', examPeriod: false };

// sample roster shown to staff
const SAMPLE_ROSTER = [
  { id: 'ENG-2021-0457', name: 'Omar Khaled',  gpa: 3.42, status: 'Registered' },
  { id: 'ENG-2021-0631', name: 'Sara Mostafa',  gpa: 3.81, status: 'Registered' },
  { id: 'ENG-2022-0102', name: 'Youssef Adel',  gpa: 2.74, status: 'Registered' },
  { id: 'ENG-2021-0588', name: 'Mariam Tarek',  gpa: 3.10, status: 'Waitlist' },
];

module.exports = {
  PRICE_PER_CREDIT, creditLimitForGPA,
  COLLEGES, COURSES, OFFERINGS, EXAMS, USERS,
  registrations, term, SAMPLE_ROSTER,
};
