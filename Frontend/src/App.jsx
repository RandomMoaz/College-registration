import { useState, useEffect } from 'react';
import { api, setToken, getToken } from './api.js';
import Login from './Login.jsx';
import { Overview, Register, Schedule, Exams } from './panels/Student.jsx';
import { StaffCourses, StaffRoster, StaffExams } from './panels/Staff.jsx';

const STUDENT_TABS = [
  ['overview', 'Overview'],
  ['register', 'Register'],
  ['schedule', 'My Schedule'],
  ['exams', 'Exams'],
];
const STAFF_TABS = [
  ['teaching', 'My Courses'],
  ['roster', 'Class Rosters'],
  ['exams', 'Exam Duties'],
];

const initials = (n) => n.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();

export default function App() {
  const [user, setUser] = useState(null);     // {name, role, id}
  const [tab, setTab] = useState('overview');
  const [booting, setBooting] = useState(true);

  // restore session on reload
  useEffect(() => {
    const t = getToken();
    if (!t) { setBooting(false); return; }
    api.me()
      .then((me) => { setUser({ name: me.name, role: 'student', id: me.id }); setTab('overview'); })
      .catch(() => api.staffCourses()
        .then(() => { /* token belongs to staff */ })
        .catch(() => setToken(null)))
      .finally(() => setBooting(false));
  }, []);

  function onLogin(res) {
    setToken(res.token);
    setUser(res.user);
    setTab(res.user.role === 'student' ? 'overview' : 'teaching');
  }
  function logout() {
    setToken(null);
    setUser(null);
  }

  if (booting) {
    return (
      <>
        <Brand />
        <div className="center-load">Loading…</div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Brand />
        <Login onLogin={onLogin} />
      </>
    );
  }

  const tabs = user.role === 'student' ? STUDENT_TABS : STAFF_TABS;

  return (
    <>
      <Brand />
      <div className="app">
        <div className="topnav">
          <div className="left">
            <span className="logo">University<span className="dot">.</span></span>
            <span className="pill">{user.role === 'student' ? 'Student' : 'Teaching staff'}</span>
          </div>
          <div className="right">
            <div className="who">
              <div className="n">{user.name}</div>
              <div className="m">{user.id}</div>
            </div>
            <div className="avatar">{initials(user.name)}</div>
            <button className="btn soft" style={{ padding: '9px 16px' }} onClick={logout}>Log out</button>
          </div>
        </div>

        <div className="tabs">
          {tabs.map(([k, label]) => (
            <button key={k} className={'tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </div>

        <Panel role={user.role} tab={tab} goTab={setTab} />
      </div>
    </>
  );
}

function Panel({ role, tab, goTab }) {
  if (role === 'student') {
    if (tab === 'overview') return <Overview goTab={goTab} />;
    if (tab === 'register') return <Register goTab={goTab} />;
    if (tab === 'schedule') return <Schedule goTab={goTab} />;
    if (tab === 'exams') return <Exams />;
  } else {
    if (tab === 'teaching') return <StaffCourses />;
    if (tab === 'roster') return <StaffRoster />;
    if (tab === 'exams') return <StaffExams />;
  }
  return null;
}

function Brand() {
  return (
    <div className="brandbar">
      <div className="k">UNIVERSITY ONLINE</div>
      <div className="s">Student &amp; Faculty Registration Portal</div>
    </div>
  );
}
