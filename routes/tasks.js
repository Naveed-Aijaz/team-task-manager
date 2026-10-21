const router = require('express').Router();
const wrap = require('../middleware/async');
const requireAuth = require('../middleware/auth');
const v = require('../middleware/validate');
const c = require('../controllers/tasks');

router.use(requireAuth);
router.post('/', v.createTaskRules, v.handle, wrap(c.create));
router.get('/', v.listTaskRules, v.handle, wrap(c.list));
router.put('/:id', v.updateTaskRules, v.handle, wrap(c.update));
router.delete('/:id', v.idParam, v.handle, wrap(c.remove));

module.exports = router;
