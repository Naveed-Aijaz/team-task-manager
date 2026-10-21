const bcrypt = require('bcrypt');
const passport = require('passport');
const pool = require('../config/db');

exports.register = async (req, res, next) => {
  const { username, email, password } = req.body;
  const dup = await pool.query('SELECT username, email FROM users WHERE email = $1 OR LOWER(username) = LOWER($2)', [email, username]);
  if (dup.rows.length) {
    const field = dup.rows[0].email === email ? 'email' : 'username';
    return res.status(409).json({ error: `That ${field} is already registered.`, details: [{ field, message: 'Already in use.' }] });
  }
  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
    [username, email, hash]
  );
  req.login(rows[0], (err) => (err ? next(err) : res.status(201).json({ user: rows[0] })));
};

exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Incorrect email or password.' });
    req.login(user, (e) => (e ? next(e) : res.json({ user })));
  })(req, res, next);
};

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('tt.sid');
      res.json({ ok: true });
    });
  });
};

exports.me = (req, res) => res.json({ user: req.user });
