import { useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import api, { errorMessage } from '../api.js';

function TeamCard({ team, onChanged, onError }) {
  const [identifier, setIdentifier] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api.post(`/api/teams/${team.id}/members`, { identifier }); setIdentifier(''); onChanged(); onError(''); }
    catch (err) { onError(errorMessage(err)); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!window.confirm(`Delete "${team.name}" and all of its tasks?`)) return;
    try { await api.delete(`/api/teams/${team.id}`); onChanged(); } catch (err) { onError(errorMessage(err)); }
  };

  return (
    <li className="rounded-lg border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold">{team.name}</h3>
          {team.description && <p className="text-sm text-muted">{team.description}</p>}
        </div>
        {team.is_owner && (
          <button className="btn-danger px-2" onClick={remove} aria-label={`Delete team ${team.name}`}><Trash2 size={16} /></button>
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {team.members.map((m) => (
          <li key={m.id} className="chip bg-brand-soft text-brand-dark" title={m.email}>
            {m.username}{m.id === team.created_by && ' (owner)'}
          </li>
        ))}
      </ul>
      {team.is_owner && (
        <form onSubmit={add} className="mt-3 flex gap-2">
          <input aria-label={`Add member to ${team.name}`} className="field" placeholder="Username or email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          <button className="btn-ghost shrink-0" disabled={busy || !identifier.trim()}><UserPlus size={16} /> Add</button>
        </form>
      )}
    </li>
  );
}

export default function TeamPanel({ teams, onChanged, onError }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [busy, setBusy] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api.post('/api/teams', form); setForm({ name: '', description: '' }); onChanged(); onError(''); }
    catch (err) { onError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <form onSubmit={create} className="h-fit space-y-3 rounded-lg border border-line bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Create a team</h2>
        <div>
          <label className="label" htmlFor="team-name">Team name</label>
          <input id="team-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="team-desc">Description</label>
          <textarea id="team-desc" rows={2} className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button className="btn-primary w-full" disabled={busy || form.name.trim().length < 2}>Create team</button>
      </form>

      {teams.length ? (
        <ul className="grid content-start gap-4 xl:grid-cols-2">
          {teams.map((t) => <TeamCard key={t.id} team={t} onChanged={onChanged} onError={onError} />)}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-line p-8 text-center text-muted">You are not on any team yet. Create one to start assigning tasks.</p>
      )}
    </section>
  );
}
