const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcrypt');
const pool = require('./db');

passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      const user = rows[0];
      // Same message for unknown email and wrong password to avoid account enumeration.
      const ok = user && (await bcrypt.compare(password, user.password_hash));
      if (!ok) return done(null, false, { message: 'Incorrect email or password.' });
      return done(null, { id: user.id, username: user.username, email: user.email, created_at: user.created_at });
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [id]);
    done(null, rows[0] || false);
  } catch (err) {
    done(err);
  }
});
