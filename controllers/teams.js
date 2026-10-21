const pool = require('../config/db');

const TEAMS_SQL = `
  SELECT t.id, t.name, t.description, t.created_by, t.created_at,
         (t.created_by = $1) AS is_owner,
         json_agg(json_build_object('id', u.id, 'username', u.username, 'email', u.email) ORDER BY u.username) AS members
  FROM teams t
  JOIN team_members m ON m.team_id = t.id
  JOIN users u ON u.id = m.user_id
  WHERE t.id IN (SELECT team_id FROM team_members WHERE user_id = $1) %FILTER%
  GROUP BY t.id
  ORDER BY t.created_at DESC`;

const fetchTeams = (userId, teamId) =>
  teamId
    ? pool.query(TEAMS_SQL.replace('%FILTER%', 'AND t.id = $2'), [userId, teamId])
    : pool.query(TEAMS_SQL.replace('%FILTER%', ''), [userId]);

exports.create = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO teams (name, description, created_by) VALUES ($1, $2, $3) RETURNING id',
      [req.body.name, req.body.description || null, req.user.id]
    );
    await client.query('INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)', [rows[0].id, req.user.id]);
    await client.query('COMMIT');
    const team = (await fetchTeams(req.user.id, rows[0].id)).rows[0];
    res.status(201).json({ team });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.list = async (req, res) => {
  const { rows } = await fetchTeams(req.user.id);
  res.json({ teams: rows });
};

exports.addMember = async (req, res) => {
  const teamId = req.params.id;
  const team = (await pool.query('SELECT created_by FROM teams WHERE id = $1', [teamId])).rows[0];
  if (!team) return res.status(404).json({ error: 'Team not found.' });
  if (team.created_by !== req.user.id) return res.status(403).json({ error: 'Only the team owner can add members.' });

  const ident = req.body.identifier.toLowerCase();
  const found = await pool.query('SELECT id, username, email FROM users WHERE email = $1 OR LOWER(username) = $1', [ident]);
  if (!found.rows.length) return res.status(404).json({ error: 'No user found with that username or email.' });

  const inserted = await pool.query(
    'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING user_id',
    [teamId, found.rows[0].id]
  );
  if (!inserted.rows.length) return res.status(409).json({ error: `${found.rows[0].username} is already on this team.` });
  res.status(201).json({ member: found.rows[0] });
};

exports.remove = async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM teams WHERE id = $1 AND created_by = $2', [req.params.id, req.user.id]);
  if (!rowCount) {
    const exists = await pool.query('SELECT 1 FROM teams WHERE id = $1', [req.params.id]);
    return exists.rows.length
      ? res.status(403).json({ error: 'Only the team owner can delete this team.' })
      : res.status(404).json({ error: 'Team not found.' });
  }
  res.json({ ok: true });
};
