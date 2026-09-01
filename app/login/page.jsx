'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import './login.css';
import { api, ApiError } from '@/lib/admin-client.js';
import { IconAlert } from '../admin/icons.jsx';

const ROLES = [
  { key: 'student', label: 'Student', blurb: 'Track the jobs you applied to and your counselling updates.' },
  { key: 'employer', label: 'Employer', blurb: 'Post vacancies and move candidates through your hiring pipeline.' },
  { key: 'admin', label: 'Admin', blurb: 'Manage every posting, candidate and counselling lead across DCW.' }
];

function LoginForm() {
  const params0 = useSearchParams();
  // The utility bar sends people here already knowing which door they picked,
  // so honour ?role= rather than dropping them on the student tab.
  const asked = params0.get('role');
  const [role, setRole] = useState(ROLES.some(r => r.key === asked) ? asked : 'student');
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState([]);
  const router = useRouter();
  const params = params0;
  const next = params.get('next') || '/admin';

  useEffect(() => {
    api('/auth/login')
      .then(d => {
        const list = d.accounts || d.users || [];
        setDemo(list);
        const acc = list.find(a => a.role === role);
        if (acc) setUsername(u => u || acc.username);
      })
      .catch(() => {});
    // Only ever runs once — `role` is read for the initial prefill, not tracked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switching the tab pre-fills that role's demo account, so the reviewer can
  // sign in as any of the three without hunting for credentials.
  function pick(next) {
    setRole(next);
    setError(null);
    const acc = demo.find(a => a.role === next);
    if (acc) { setUsername(acc.username); setPasscode(''); }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const d = await api('/auth/login', { method: 'POST', body: { username, passcode } });
      // A student who arrives with ?next=/admin must not be bounced into a
      // console they cannot read — send them to the site instead.
      router.replace(d.role === 'student' && next.startsWith('/admin') ? '/' : next);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401
        ? 'That username and passcode do not match an account.'
        : 'Could not sign you in. Check your connection and try again.');
      setBusy(false);
    }
  }

  const active = ROLES.find(r => r.key === role);

  return (
    <div className="lg">
      <aside className="lg-aside">
        <img src="/distance-lockup.png" alt="Distance Courses Wala" />
        <div>
          <h2>One account for every side of DCW.</h2>
          <p>Courses, colleges and jobs run on the same verified data. Sign in to the side you work on.</p>
          <div className="lg-roles">
            {ROLES.map(r => (
              <div key={r.key}>
                <span>{r.label[0]}</span>
                <div><b>{r.label}</b><small>{r.blurb}</small></div>
              </div>
            ))}
          </div>
        </div>
        <p className="lg-legal">© {new Date().getFullYear()} Distance Courses Wala · Berojgar Bharat · Colleges Wala</p>
      </aside>

      <main className="lg-main">
        <form className="lg-form" onSubmit={submit}>
          <h1>Sign in</h1>
          <p>{active.blurb}</p>

          <div className="lg-tabs" role="group" aria-label="Account type">
            {ROLES.map(r => (
              <button key={r.key} type="button" aria-pressed={role === r.key} onClick={() => pick(r.key)}>
                {r.label}
              </button>
            ))}
          </div>

          {error && <div className="lg-err" role="alert"><IconAlert />{error}</div>}

          <label className="lg-field">
            <span>Username</span>
            <input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username"
              required autoCapitalize="none" spellCheck="false" placeholder={`e.g. ${role}`} />
          </label>
          <label className="lg-field">
            <span>Passcode</span>
            <input type="password" value={passcode} onChange={e => setPasscode(e.target.value)}
              autoComplete="current-password" required placeholder="Enter your passcode" />
          </label>

          <button className="lg-go" type="submit" disabled={busy || !username || !passcode}>
            {busy ? 'Signing in…' : `Sign in as ${active.label}`}
          </button>

          {demo.length > 0 && (
            <div className="lg-demo">
              <b>Demo accounts — one tap to fill</b>
              {demo.map(a => (
                <button key={a.username} type="button"
                  onClick={() => { setRole(a.role); setUsername(a.username); setPasscode(a.passcode); setError(null); }}>
                  <span><b>{a.name}</b><small>{a.username} · {a.passcode}</small></span>
                  <span>Use</span>
                </button>
              ))}
              <div className="lg-warn">
                <IconAlert />
                Demo sign-in only. Passcodes are published in this build and there is no
                password hashing — replace this before any real candidate data is stored.
              </div>
            </div>
          )}

          <Link className="lg-back" href="/">← Back to the site</Link>
        </form>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
