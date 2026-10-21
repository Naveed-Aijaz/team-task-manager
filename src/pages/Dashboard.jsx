import { useCallback, useEffect, useState } from 'react';
import { CheckSquare, LogOut, User, Users } from 'lucide-react';
import api, { errorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import TaskList from '../components/TaskList.jsx';
import TeamPanel from '../components/TeamPanel.jsx';
import TaskModal from '../components/TaskModal.jsx';

const NAV = [
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [view, setView] = useState('tasks');
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ teamId: '', assigneeId: '', q: '' });
  const [modal, setModal] = useState(undefined); // undefined = closed, null = new task, object = edit task
  const [error, setError] = useState('');

  const loadTeams = useCallback(async () => {
    try { setTeams((await api.get('/api/teams')).data.teams); } catch (err) { setError(errorMessage(err)); }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const params = {};
      if (filters.teamId) params.teamId = filters.teamId;
      if (filters.assigneeId) params.assigneeId = filters.assigneeId;
      setTasks((await api.get('/api/tasks', { params })).data.tasks);
    } catch (err) { setError(errorMessage(err)); }
  }, [filters.teamId, filters.assigneeId]);

  useEffect(() => { loadTeams(); }, [loadTeams]);
  useEffect(() => { loadTasks(); }, [loadTasks]);

  const refreshAll = () => { loadTeams(); loadTasks(); };
  // If the selected filter team was deleted, reset the filter.
  useEffect(() => {
    if (filters.teamId && teams.length && !teams.some((t) => t.id === Number(filters.teamId))) setFilters((f) => ({ ...f, teamId: '', assigneeId: '' }));
  }, [teams, filters.teamId]);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[14rem_1fr]">
      <aside className="flex items-center gap-2 bg-ink p-3 text-white md:flex-col md:items-stretch md:gap-1 md:p-4">
        <p className="mr-auto font-display text-lg font-bold md:mb-6 md:mr-0">Team Task Manager</p>
        <nav className="flex gap-1 md:flex-col" aria-label="Main">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setView(id)} aria-current={view === id ? 'page' : undefined}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${view === id ? 'bg-white/15 font-medium' : 'text-white/70 hover:bg-white/10'}`}>
              <Icon size={16} /> <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>
        <button onClick={logout} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 md:mt-auto">
          <LogOut size={16} /> <span className="hidden sm:inline">Sign out</span>
        </button>
      </aside>

      <main className="p-4 md:p-8">
        <header className="mb-6">
          <h1 className="font-display text-2xl font-bold">{NAV.find((n) => n.id === view).label}</h1>
          <p className="text-sm text-muted">Signed in as {user.username}</p>
        </header>

        {error && (
          <p role="alert" className="mb-4 flex justify-between rounded-md bg-rust/10 px-3 py-2 text-sm text-rust">
            {error} <button onClick={() => setError('')} className="underline">Dismiss</button>
          </p>
        )}

        {view === 'tasks' && (
          <TaskList tasks={tasks} teams={teams} filters={filters} setFilters={setFilters}
            onNew={() => setModal(null)} onEdit={setModal} onChanged={loadTasks} onError={setError} />
        )}
        {view === 'teams' && <TeamPanel teams={teams} onChanged={refreshAll} onError={setError} />}
        {view === 'profile' && (
          <dl className="max-w-md divide-y divide-line rounded-lg border border-line bg-white">
            {[['Username', user.username], ['Email', user.email], ['Member since', new Date(user.created_at).toLocaleDateString()], ['Teams', teams.length]].map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-3 text-sm"><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>
        )}
      </main>

      {modal !== undefined && (
        <TaskModal task={modal} teams={teams} defaultTeamId={filters.teamId ? Number(filters.teamId) : undefined}
          onClose={() => setModal(undefined)} onSaved={() => { setModal(undefined); loadTasks(); }} />
      )}
    </div>
  );
}
