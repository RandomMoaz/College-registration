import { useState, useEffect } from 'react';
import { api } from '../api.js';

function Loading() { return <div className="card"><div className="center-load">Loading…</div></div>; }
function ErrorCard({ msg }) { return <div className="card"><div className="empty">⚠️ {msg}</div></div>; }

/* ---------------------------- MY COURSES ---------------------------- */
export function StaffCourses() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.staffCourses().then(setData).catch((e) => setErr(e.message)); }, []);
  if (err) return <ErrorCard msg={err} />;
  if (!data) return <Loading />;

  return (
    <>
      <div className="section-head"><div><h2>My courses</h2><p>{data.dept} · {data.courses.length} courses this term</p></div></div>
      <div className="grid cards-3">
        {data.courses.map((c) => (
          <div className="card" key={c.code}>
            <span className="tag teal">{c.role}</span>
            <h2 style={{ marginTop: 10 }}>{c.code} — {c.name}</h2>
            <p className="lead">{c.credits} credit hours</p>
            <div className="summary">
              <div className="row"><span>Enrolled students</span><b>{c.students}</b></div>
              <div className="row"><span>Meeting</span><b>{c.slot}</b></div>
              <div className="row"><span>Room</span><b>{c.room}</b></div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------------------------- CLASS ROSTERS ------------------------- */
export function StaffRoster() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.staffRoster().then(setData).catch((e) => setErr(e.message)); }, []);
  if (err) return <ErrorCard msg={err} />;
  if (!data) return <Loading />;

  return (
    <>
      <div className="section-head"><div><h2>Class rosters</h2><p>Students enrolled in your sections</p></div></div>
      {data.rosters.map((r) => (
        <div className="card" key={r.code} style={{ marginBottom: 14 }}>
          <h2>{r.code} — {r.name}</h2>
          <p className="lead">{r.enrolled} enrolled · {r.slot} · {r.room}</p>
          <table>
            <thead><tr><th>Student ID</th><th>Name</th><th className="num">GPA</th><th>Status</th></tr></thead>
            <tbody>
              {r.students.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.id}</b></td><td>{s.name}</td><td className="num">{s.gpa.toFixed(2)}</td>
                  <td><span className={'tag ' + (s.status === 'Registered' ? 'good' : 'warn')}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}

/* ----------------------------- EXAM DUTIES -------------------------- */
export function StaffExams() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const load = () => api.staffExams().then(setData).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  async function toggleExam() {
    await api.setExamPeriod(!data.examPeriod);
    load();
  }
  if (err) return <ErrorCard msg={err} />;
  if (!data) return <Loading />;

  const head = (
    <div className="section-head">
      <div><h2>Exam duties</h2><p>Your invigilation assignments during the exam period.</p></div>
      <button className={'toggle' + (data.examPeriod ? ' on' : '')} onClick={toggleExam}>
        <span>Exam period</span><span className="switch"><i /></span>
      </button>
    </div>
  );

  if (!data.examPeriod) {
    return <>{head}<div className="card"><div className="empty">
      📘 Exam period hasn't started.<br /><br />Toggle it above to preview your invigilation duties.
    </div></div></>;
  }
  return (
    <>
      {head}
      <div className="banner warn">⚠️ You are the responsible invigilator for the courses below.</div>
      <div className="card">
        <h2>Your exams</h2>
        <table>
          <thead><tr><th>Code</th><th>Subject</th><th>Date</th><th>Time</th><th>Hall</th><th>Students</th></tr></thead>
          <tbody>
            {data.exams.map((e) => (
              <tr key={e.code}>
                <td><b>{e.code}</b></td><td>{e.name}</td><td>{e.date}</td><td>{e.time}</td><td>{e.hall}</td><td>{e.students}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
