import { useState } from 'react';
import { api } from './api.js';

const DEMO = [
  { email: 'student@uni.edu', pass: '1234', label: '🎓 Student — Omar Khaled' },
  { email: 'staff@uni.edu', pass: '1234', label: '👩‍🏫 Teaching staff — Dr. Layla Hassan' },
];

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const res = await api.login(email.trim().toLowerCase(), password);
      onLogin(res);
    } catch (e) {
      setErr(e.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-left">
          <div className="eyebrow">Making student life easier</div>
          <h1>University<br />Online<span className="dot">.</span></h1>
          <p className="login-sub">
            Sign in to view your college, GPA and academic progress, then register for this term's classes.
          </p>
          <form onSubmit={submit}>
            <div className="field">
              <label>Email address</label>
              <input type="email" value={email} placeholder="you@uni.edu"
                autoComplete="username" onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} placeholder="••••••"
                autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button className="btn block" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Log In'}
            </button>
            <div className="login-err">{err}</div>
          </form>
        </div>

        <div className="login-right">
          <div>
            <h3>Demo accounts</h3>
            {DEMO.map((d) => (
              <div key={d.email} className="demo-acct"
                onClick={() => { setEmail(d.email); setPassword(d.pass); setErr(''); }}>
                <div className="r">{d.label}</div>
                <div className="c">{d.email} · {d.pass}</div>
              </div>
            ))}
          </div>
          <div className="demo-note">
            Tap a card to autofill, then press Log In. Sample data only — no real accounts are created.
          </div>
        </div>
      </div>
    </div>
  );
}
