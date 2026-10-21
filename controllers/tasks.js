const pool = require('../config/db');

const BASE = `
  SELECT t.id, t.title, t.description, t.team_id, t.assigned_to, t.status, t.priority,
         to_char(t.due_date, 'YYYY-MM-DD') AS due_date, t.created_at,
         tm.name AS team_name, u.username AS assignee_name
  FROM tasks t
  JOIN teams tm ON tm.id = t.team_id
  LEFT JOIN users u ON u.id = t.assigned_to
  WHERE t.team_id IN (SELECT team_id FROM team_members WHERE user_id = $1)`;

const isMember = async (teamId, userId) =>
  (await pool.query('SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2', [teamId, userId])).rows.length > 0;

const getOne = async (taskId, userId) => (await pool.query(`${BASE} AND t.id = $2`, [userId, taskId])).rows[0];

exports.create = async (req, res) => {
  const { title, description, teamId, assignedTo, status = 'todo', priority = 'medium', dueDate } = req.body;
  if (!(await isMember(teamId, req.user.id))) return res.status(403).json({ error: 'You are not a member of that team.' });
  if (assignedTo && !(await isMember(teamId, assignedTo))) return res.status(400).json({ error: 'Assignee must be a member of the team.' });

  const { rows } = await pool.query(
    `INSERT INTO tasks (title, description, team_id, assigned_to, status, priority, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [title, description || null, teamId, assignedTo || null, status, priority, dueDate || null]
  );
  res.status(201).json({ task: await getOne(rows[0].id, req.user.id) });
};

exports.list = async (req, res) => {
  const params = [req.user.id];
  let sql = BASE;
  if (req.query.teamId) { params.push(req.query.teamId); sql += ` AND t.team_id = $${params.length}`; }
  if (req.query.assigneeId) { params.push(req.query.assigneeId); sql += ` AND t.assigned_to = $${params.length}`; }
  sql += " ORDER BY (t.status = 'done'), t.due_date NULLS LAST, t.created_at DESC";
  const { rows } = await pool.query(sql, params);
  res.json({ tasks: rows });
};

exports.update = async (req, res) => {
  const existing = await getOne(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Task not found.' });

  const b = req.body;
  if (b.assignedTo && !(await isMember(existing.team_id, b.assignedTo)))
    return res.status(400).json({ error: "Assignee must be a member of the task's team." });

  // Only whitelisted columns can be updated (the team of a task cannot change).
  const map = { title: 'title', description: 'description', assignedTo: 'assigned_to', status: 'status', priority: 'priority', dueDate: 'due_date' };
  const sets = [], vals = [];
  for (const [key, col] of Object.entries(map)) {
    if (b[key] !== undefined) { vals.push(b[key] === '' ? null : b[key]); sets.push(`${col} = $${vals.length}`); }
  }
  if (sets.length) {
    vals.push(req.params.id);
    await pool.query(`UPDATE tasks SET ${sets.join(', ')} WHERE id = $${vals.length}`, vals);
  }
  res.json({ task: await getOne(req.params.id, req.user.id) });
};

exports.remove = async (req, res) => {
  const existing = await getOne(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Task not found.' });
  await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
};
