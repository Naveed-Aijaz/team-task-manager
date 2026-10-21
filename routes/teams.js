const router = require('express').Router();
const wrap = require('../middleware/async');
const requireAuth = require('../middleware/auth');
const v = require('../middleware/validate');
const c = require('../controllers/teams');

router.use(requireAuth);
router.post('/', v.teamRules, v.handle, wrap(c.create));
router.get('/', wrap(c.list));
router.post('/:id/members', v.memberRules, v.handle, wrap(c.addMember));
router.delete('/:id', v.idParam, v.handle, wrap(c.remove));

module.exports = router;
