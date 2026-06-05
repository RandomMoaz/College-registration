import { useState, useEffect } from 'react';
import { api, money } from '../api.js';

function Loading() { return <div className="card"><div className="center-load">Loading…</div></div>; }
function ErrorCard({ msg }) { return <div className="card"><div className="empty">⚠️ {msg}</div></div>; }

/* ----------------------------- OVERVIEW ----------------------------- */
export function Overview({ goTab }) {
  const [me, setMe] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { api.me().then(setMe).catch((e) => setErr(e.message)); }, []);
  if (err) return <ErrorCard msg={err} />;
  if (!me) return <Loading />;

  const pct = Math.round((me.earnedCredits / me.totalProgramCredits) * 100);

  return (
    <>
      <div className="grid cards-4" style={{ marginBottom: 16 }}>
        <div className="card stat accent">
          <div className="label">Cumulative GPA</div>
          <div className="value">{me.gpa.toFixed(2)}</div>
          <div className="sub">out of 4.00</div>
        </div>
        <div className="card stat">
          <div className="label">College</div>
          <div className="value" style={{ fontSize: 18, lineHeight: 1.15, marginTop: 8 }}>{me.college.name}</div>
          <div className="sub">{me.id}</div>
        </div>
        <div className="card stat">
          <div className="label">Credits earned</div>
          <div className="value">{me.earnedCredits}<span style={{ fontSize: 15, color: 'var(--muted)' }}> / {me.totalProgramCredits}</span></div>
          <div className="progress"><i style={{ width: pct + '%' }} /></div>
          <div className="sub">{pct}% of program complete</div>
        </div>
        <div className="card stat">
          <div className="label">Term registration limit</div>
          <div className="value">{me.creditLimit}<span style={{ fontSize: 15, color: 'var(--muted)' }}> cr</span></div>
          <div className="sub">based on your GPA tier</div>
        </div>
      </div>

      <div className="grid col-2">
        <div className="card">
          <h2>Completed subjects</h2>
          <p className="lead">Your transcript — passed courses count toward your degree.</p>
          <table>
            <thead><tr><th>Code</th><th>Subject</th><th className="num">Cr</th><th>Status</th><th className="num">Grade</th></tr></thead>
            <tbody>
              {me.completed.map((c) => (
                <tr key={c.code}>
                  <td><b>{c.code}</b></td><td>{c.name}</td><td className="num">{c.credits}</td>
                  <td><span className={'tag ' + (c.pts >= 3.7 ? 'good' : c.pts >= 2 ? 'teal' : 'warn')}>Passed</span></td>
                  <td className="num grade">{c.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Uncompleted subjects</h2>
          <p className="lead">{me.remaining.length} subjects remain in your degree plan.</p>
          <table>
            <thead><tr><th>Code</th><th>Subject</th><th className="num">Cr</th><th>Availability</th></tr></thead>
            <tbody>
              {me.remaining.map((c) => (
                <tr key={c.code}>
                  <td><b>{c.code}</b></td><td>{c.name}</td><td className="num">{c.credits}</td>
                  <td>{c.open
                    ? <span className="tag teal">Open this term</span>
                    : <span className="tag gray">Not offered</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="banner info" style={{ marginTop: 14 }}>
            Head to <b style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => goTab('register')}>Register</b> to enroll in this term's open classes.
          </div>
        </div>
      </div>
    </>
  );
}

/* ----------------------------- REGISTER ----------------------------- */
export function Register({ goTab }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [confirmed, setConfirmed] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.openCourses().then(setData).catch((e) => setErr(e.message)); }, []);
  if (err) return <ErrorCard msg={err} />;
  if (!data) return <Loading />;

  const byCode = Object.fromEntries(data.courses.map((c) => [c.code, c]));
  const usedCredits = [...selected].reduce((s, c) => s + byCode[c].credits, 0);
  const usedCost = [...selected].reduce((s, c) => s + byCode[c].cost, 0);
  const over = usedCredits > data.creditLimit;
  const limit = data.creditLimit;

  function toggle(code) {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code); else next.add(code);
    setSelected(next);
  }

  async function confirm() {
    setBusy(true); setErr('');
    try {
      const res = await api.register([...selected]);
      setConfirmed(res);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  if (confirmed) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 36 }}>
        <div style={{ fontSize: 42 }}>✅</div>
        <h2 style={{ fontSize: 22, margin: '10px 0 4px' }}>Registration confirmed</h2>
        <p className="lead" style={{ margin: '0 auto 18px', maxWidth: '46ch' }}>
          You enrolled in {confirmed.registered.length} subjects ({confirmed.creditHours} credit hours),
          total fees {money(confirmed.totalCost)}. Your timetable is ready.
        </p>
        <button className="btn" onClick={() => goTab('schedule')}>View my schedule</button>
        <button className="btn soft" style={{ marginLeft: 8 }} onClick={() => setConfirmed(null)}>Edit selection</button>
      </div>
    );
  }

  return (
    <>
      <div className="section-head">
        <div><h2>Register for classes</h2><p>Pick your subjects, then confirm to lock in your schedule and fees.</p></div>
      </div>
      <div className="grid col-2">
        <div className="card">
          <h2>Open classes</h2>
          <p className="lead">Only subjects whose prerequisites you've passed are shown.</p>
          {data.courses.map((c) => {
            const on = selected.has(c.code);
            const wouldExceed = !on && usedCredits + c.credits > limit;
            return (
              <div key={c.code}
                className={'reg-row' + (on ? ' on' : '') + (wouldExceed ? ' locked' : '')}
                onClick={() => !wouldExceed && toggle(c.code)}
                role={wouldExceed ? undefined : 'button'}>
                <div className="chk">{on ? '✓' : ''}</div>
                <div className="reg-main">
                  <div className="t">{c.code} — {c.name}</div>
                  <div className="meta">
                    {c.credits} credit hours · prereqs: {c.prereqs.length ? c.prereqs.join(', ') : 'none'}
                    {wouldExceed && <b style={{ color: 'var(--bad)' }}> · exceeds your limit</b>}
                  </div>
                </div>
                <div className="reg-cost">{money(c.cost)}
                  <div className="c">{c.credits} × {money(data.pricePerCredit)}</div></div>
              </div>
            );
          })}
        </div>

        <div>
          <div className="card summary">
            <h2>Registration summary</h2>
            <div className="meter"><span>Credit hours used</span><b>{usedCredits} / {limit}</b></div>
            <div className="progress"><i style={{ width: Math.min(100, (usedCredits / limit) * 100) + '%', background: over ? 'var(--bad)' : undefined }} /></div>

            {[...selected].length === 0
              ? <div className="empty" style={{ padding: 18 }}>No subjects selected yet</div>
              : [...selected].map((code) => (
                <div className="row" key={code}>
                  <span>{code} <span style={{ color: 'var(--muted)' }}>· {byCode[code].credits}cr</span></span>
                  <b>{money(byCode[code].cost)}</b>
                </div>
              ))}

            <div className="row total"><span>Total fees</span><span>{money(usedCost)}</span></div>

            {over
              ? <div className="banner bad">You're over your {limit}-credit limit. Remove a subject to continue.</div>
              : selected.size
                ? <div className="banner good">Within your limit. Ready to confirm.</div>
                : <div className="banner info">Your GPA allows up to <b>{limit} credit hours</b> this term.</div>}

            <button className="btn block" disabled={!selected.size || over || busy} onClick={confirm}>
              {busy ? 'Submitting…' : 'Confirm registration'}
            </button>
            {err && <div className="banner bad" style={{ marginBottom: 0 }}>{err}</div>}
          </div>
        </div>
      </div>
    </>
  );
}

/* ----------------------------- SCHEDULE ----------------------------- */
export function Schedule({ goTab }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.schedule().then(setData).catch((e) => setErr(e.message)); }, []);
  if (err) return <ErrorCard msg={err} />;
  if (!data) return <Loading />;

  if (!data.subjects.length) {
    return (
      <div className="card"><div className="empty">
        You haven't confirmed any classes yet.<br /><br />
        <button className="btn" onClick={() => goTab('register')}>Go to registration</button>
      </div></div>
    );
  }

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <>
      <div className="section-head">
        <div><h2>My finalised schedule</h2>
          <p>{data.college.name} · {data.subjects.length} subjects · {data.creditHours} credit hours</p></div>
      </div>
      <div className="legend">
        <span><i className="dot-l" /> Lecture</span>
        <span><i className="dot-lab" /> Lab</span>
        <span><i className="dot-sec" /> Section / Tutorial</span>
      </div>

      {data.subjects.map((s) => (
        <div className="card" key={s.code} style={{ marginBottom: 14 }}>
          <div className="section-head" style={{ marginBottom: 10 }}>
            <div><h2>{s.code} — {s.name}</h2><p>{s.credits} credit hours</p></div>
            <div className="reg-cost">{money(s.cost)}<div className="c">tuition</div></div>
          </div>
          {s.sessions.map((ss, i) => (
            <div className={'session ' + ss.type} key={i}>
              <div className="top"><span className="ttl">{cap(ss.type)}</span><span className="when">{ss.day} · {ss.time}</span></div>
              <div className="det">{ss.room} · {ss.staff}</div>
            </div>
          ))}
        </div>
      ))}

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <b style={{ fontFamily: 'Sora', fontSize: 16 }}>Total tuition this term</b>
          <div className="lead" style={{ margin: '2px 0 0' }}>
            {data.subjects.length} subjects · {data.creditHours} credit hours × {money(data.pricePerCredit)}/cr
          </div>
        </div>
        <div style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 26, color: 'var(--primary-deep)' }}>{money(data.totalCost)}</div>
      </div>
    </>
  );
}

/* ------------------------------- EXAMS ------------------------------ */
export function Exams() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const load = () => api.exams().then(setData).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  async function toggleExam() {
    await api.setExamPeriod(!data.examPeriod);
    load();
  }
  if (err) return <ErrorCard msg={err} />;
  if (!data) return <Loading />;

  const head = (
    <div className="section-head">
      <div><h2>Exam schedule</h2><p>Final exams appear here once the term enters its exam period.</p></div>
      <button className={'toggle' + (data.examPeriod ? ' on' : '')} onClick={toggleExam}>
        <span>Exam period</span><span className="switch"><i /></span>
      </button>
    </div>
  );

  if (!data.examPeriod) {
    return <>{head}<div className="card"><div className="empty">
      📘 It's not exam time yet.<br /><br />
      Classes are in session. Toggle <b>Exam period</b> above to preview your final exam timetable.
    </div></div></>;
  }
  if (!data.exams.length) {
    return <>{head}<div className="card"><div className="empty">No registered subjects to schedule exams for.</div></div></>;
  }
  return (
    <>
      {head}
      <div className="banner warn">⚠️ Exam period is active. Arrive 15 minutes early with your student ID ({data.studentId}).</div>
      <div className="card">
        <h2>Your final exams</h2>
        <p className="lead">{data.exams.length} subjects scheduled</p>
        <table>
          <thead><tr><th>Code</th><th>Subject</th><th>Date</th><th>Time</th><th>Hall</th><th>Seat</th></tr></thead>
          <tbody>
            {data.exams.map((e) => (
              <tr key={e.code}>
                <td><b>{e.code}</b></td><td>{e.name}</td><td>{e.date}</td><td>{e.time}</td><td>{e.hall}</td>
                <td><span className="tag teal">{e.seat}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}