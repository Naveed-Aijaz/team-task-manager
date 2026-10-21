const router = require('express').Router();
const wrap = require('../middleware/async');
const requireAuth = require('../middleware/auth');
const v = require('../middleware/validate');
const c = require('../controllers/auth');

router.post('/register', v.registerRules, v.handle, wrap(c.register));
router.post('/login', v.loginRules, v.handle, c.login);
router.post('/logout', c.logout);
router.get('/me', requireAuth, c.me);

module.exports = router;
