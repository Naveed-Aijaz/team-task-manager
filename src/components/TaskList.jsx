import { useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import api, { errorMessage } from '../api.js';
import { STATUS, PRIORITY } from './TaskModal.jsx';

const priorityStyle = { high: 'bg-rust/10 text-rust', medium: 'bg-amber-100 text-amber-800', low: 'bg-line text-muted' };
const statusStyle = { todo: 'bg-line text-ink', in_progress: 'bg-sky-100 text-sky-800', done: 'bg-brand-soft text-brand-dark' };

const isOverdue = (t) => t.due_date && t.status !== 'done' && t.due_date < new Date().toLocaleDateString('en-CA');

export default function TaskList({ tasks, teams, filters, setFilters, onNew, onEdit, onChanged, onError }) {
  const assignees = useMemo(() => {
    const pool = filters.teamId ? teams.filter((t) => t.id === Number(filters.teamId)) : teams;
    const map = new Map();
    pool.forEach((t) => t.members.forEach((m) => map.set(m.id, m.username)));
    return [...map].map(([id, username]) => ({ id, username }));
  }, [teams, filters.teamId]);

  const visible = tasks.filter((t) => t.title.toLowerCase().includes(filters.q.toLowerCase()));

  const quickStatus = async (task, status) => {
    try { await api.put(`/api/tasks/${task.id}`, { status }); onChanged(); } catch (err) { onError(errorMessage(err)); }
  };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input aria-label="Search tasks by title" placeholder="Search by title" className="field pl-9" value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        </div>
        <select aria-label="Filter by team" className="field w-auto" value={filters.teamId}
          onChange={(e) => setFilters({ ...filters, teamId: e.target.value, assigneeId: '' })}>
          <option value="">All teams</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select aria-label="Filter by assignee" className="field w-auto" value={filters.assigneeId}
          onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })}>
          <option value="">Anyone</option>
          {assignees.map((a) => <option key={a.id} value={a.id}>{a.username}</option>)}
        </select>
        <button className="btn-primary" onClick={onNew} disabled={!teams.length}><Plus size={16} /> New task</button>
      </div>

      {!teams.length ? (
        <p className="rounded-lg border border-dashed border-line p-8 text-center text-muted">Create a team first, then add tasks to it.</p>
      ) : !visible.length ? (
        <p className="rounded-lg border border-dashed border-line p-8 text-center text-muted">No tasks match these filters. Create a task to get started.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
          {visible.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-paper/60">
              <button className="min-w-[14rem] flex-1 text-left" onClick={() => onEdit(t)}>
                <span className={`block font-medium ${t.status === 'done' ? 'text-muted line-through' : ''}`}>{t.title}</span>
                <span className="text-sm text-muted">
                  {t.team_name} · {t.assignee_name || 'Unassigned'}
                  {t.due_date && <span className={isOverdue(t) ? 'font-medium text-rust'  : ''}> · Due {t.due_date}{isOverdue(t) ? ' (overdue)' : ''}</span>}
                </span>
              </button>
              <span className={`chip ${priorityStyle[t.priority]}`}>{PRIORITY[t.priority]}</span>
              <select aria-label={`Status of ${t.title}`} value={t.status} onChange={(e) => quickStatus(t, e.target.value)}
                className={`chip cursor-pointer border-0 py-1 pr-6 ${statusStyle[t.status]}`}>
                {Object.entries(STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
