let token = sessionStorage.getItem('uni_token') || null;

export function setToken(t) {
  token = t;
  if (t) sessionStorage.setItem('uni_token', t);
  else sessionStorage.removeItem('uni_token');
}
export function getToken() { return token; }

async function req(path, opts = {}) {
  const res = await fetch('/api' + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (email, password) => req('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => req('/me'),
  openCourses: () => req('/courses/open'),
  register: (codes) => req('/register', { method: 'POST', body: JSON.stringify({ codes }) }),
  schedule: () => req('/schedule'),
  exams: () => req('/exams'),
  term: () => req('/term'),
  setExamPeriod: (on) => req('/term/exam-period', { method: 'POST', body: JSON.stringify({ on }) }),
  staffCourses: () => req('/staff/courses'),
  staffRoster: () => req('/staff/roster'),
  staffExams: () => req('/staff/exams'),
};

export const money = (n) =>
  (n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
