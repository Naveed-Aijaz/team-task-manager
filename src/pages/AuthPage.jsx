import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { errorMessage, fieldErrors } from '../api.js';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const switchMode = (m) => { setMode(m); setError(''); setErrors({}); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setErrors({});
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.username, form.email, form.password);
    } catch (err) {
      setError(errorMessage(err));
      setErrors(fieldErrors(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen md:grid-cols-[1.1fr_1fr]">
      <section className="hidden bg-ink p-12 text-white md:flex md:flex-col md:justify-between">
        <h1 className="font-display text-3xl font-bold">Team Task Manager</h1>
        <div className="max-w-md">
          <p className="font-display text-4xl font-semibold leading-tight">Know who is doing what, and by when.</p>
          <p className="mt-4 text-white/70">Create a team, add the people you work with, and assign tasks with a priority and a due date.</p>
        </div>
        <p className="text-sm text-white/50">Your session stays in a secure, HTTP-only cookie.</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div role="tablist" className="mb-6 grid grid-cols-2 rounded-md border border-line bg-white p-1 text-sm font-medium">
            {['login', 'register'].map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}
                className={`rounded px-3 py-1.5 ${mode === m ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {!isLogin && (
              <div>
                <label className="label" htmlFor="username">Username</label>
                <input id="username" className="field" value={form.username} onChange={set('username')} autoComplete="username" />
                {errors.username && <p className="error-text">{errors.username}</p>}
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" className="field" value={form.email} onChange={set('email')} autoComplete="email" />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" className="field" value={form.password} onChange={set('password')}
                autoComplete={isLogin ? 'current-password' : 'new-password'} />
              {!isLogin && <p className="mt-1 text-xs text-muted">At least 8 characters with upper- and lowercase letters and a number.</p>}
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>
            {error && <p role="alert" className="rounded-md bg-rust/10 px-3 py-2 text-sm text-rust">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
