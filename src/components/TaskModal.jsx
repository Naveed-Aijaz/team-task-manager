import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import api, { errorMessage, fieldErrors } from '../api.js';

export const STATUS = { todo: 'To do', in_progress: 'In progress', done: 'Done' };
export const PRIORITY = { low: 'Low', medium: 'Medium', high: 'High' };

export default function TaskModal({ task, teams, defaultTeamId, onClose, onSaved }) {
  const editing = Boolean(task);
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    teamId: task?.team_id || defaultTeamId || teams[0]?.id || '',
    assignedTo: task?.assigned_to || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: task?.due_date || '',
  });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const members = useMemo(() => teams.find((t) => t.id === Number(form.teamId))?.members || [], [teams, form.teamId]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setErrors({});
    const payload = {
      title: form.title,
      description: form.description,
      assignedTo: form.assignedTo ? Number(form.assignedTo) : null,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
    };
    try {
      if (editing) await api.put(`/api/tasks/${task.id}`, payload);
      else await api.post('/api/tasks', { ...payload, teamId: Number(form.teamId) });
      onSaved();
    } catch (err) {
      setError(errorMessage(err)); setErrors(fieldErrors(err));
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    try { await api.delete(`/api/tasks/${task.id}`); onSaved(); } catch (err) { setError(errorMessage(err)); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="task-modal-title" className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="task-modal-title" className="font-display text-xl font-semibold">{editing ? 'Edit task' : 'New task'}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-muted hover:bg-paper"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="t-title">Title</label>
            <input id="t-title" className="field" value={form.title} onChange={set('title')} autoFocus maxLength={200} />
            {errors.title && <p className="error-text">{errors.title}</p>}
          </div>
          <div>
            <label className="label" htmlFor="t-desc">Description</label>
            <textarea id="t-desc" rows={3} className="field" value={form.description} onChange={set('description')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="t-team">Team</label>
              <select id="t-team" className="field" value={form.teamId} disabled={editing}
                onChange={(e) => setForm({ ...form, teamId: e.target.value, assignedTo: '' })}>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="t-assignee">Assignee</label>
              <select id="t-assignee" className="field" value={form.assignedTo} onChange={set('assignedTo')}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.username}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="t-priority">Priority</label>
              <select id="t-priority" className="field" value={form.priority} onChange={set('priority')}>
                {Object.entries(PRIORITY).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="t-status">Status</label>
              <select id="t-status" className="field" value={form.status} onChange={set('status')}>
                {Object.entries(STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="t-due">Due date</label>
              <input id="t-due" type="date" className="field" value={form.dueDate} onChange={set('dueDate')} />
              {errors.dueDate && <p className="error-text">{errors.dueDate}</p>}
            </div>
          </div>

          {error && <p role="alert" className="rounded-md bg-rust/10 px-3 py-2 text-sm text-rust">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            {editing ? <button type="button" className="btn-danger" onClick={remove}>Delete task</button> : <span />}
            <div className="flex gap-2">
              <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn-primary" disabled={busy || !form.teamId}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create task'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
