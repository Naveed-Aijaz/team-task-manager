require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./config/db');
require('./config/passport');

const isProd = process.env.NODE_ENV === 'production';
if (isProd && !process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is required in production.');

const app = express();
if (isProd) app.set('trust proxy', 1); // Cloud Run / load balancer terminates TLS

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'style-src': ["'self'", 'https:', "'unsafe-inline'"],
      'font-src': ["'self'", 'https:', 'data:'],
    },
  },
}));
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(','), credentials: true }));
app.use(express.json({ limit: '100kb' }));

// Sessions: PostgreSQL store in production, in-memory fallback for local dev (SESSION_STORE=memory).
let store;
if (isProd || process.env.SESSION_STORE !== 'memory') {
  const PgStore = require('connect-pg-simple')(session);
  store = new PgStore({ pool, tableName: 'session' });
} else {
  console.warn('Using in-memory session store (development only).');
}
app.use(session({
  store,
  name: 'tt.sid',
  secret: process.env.SESSION_SECRET || 'dev-only-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found.' }));

// Serve the built React app when present (single-container deployment).
const dist = path.join(__dirname, '../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Try again.' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on :${port}`));
