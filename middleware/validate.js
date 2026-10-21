const { body, param, query, validationResult } = require('express-validator');

const handle = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ error: details[0].message, details });
};

const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];
const id = (name, loc = param) => loc(name).isInt({ min: 1 }).withMessage(`${name} must be a valid id`).toInt();

const registerRules = [
  body('username').trim().matches(/^[A-Za-z0-9_]{3,30}$/).withMessage('Username must be 3-30 letters, numbers or underscores.'),
  body('email').trim().isEmail().withMessage('Enter a valid email address.').isLength({ max: 255 }).normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 72 }).withMessage('Password must be 8-72 characters.')
    .matches(/[a-z]/).withMessage('Password needs a lowercase letter.')
    .matches(/[A-Z]/).withMessage('Password needs an uppercase letter.')
    .matches(/\d/).withMessage('Password needs a number.'),
];
const loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Enter your password.'),
];
const teamRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Team name must be 2-100 characters.'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }).withMessage('Description is too long.'),
];
const memberRules = [
  id('id'),
  body('identifier').trim().notEmpty().withMessage('Enter a username or email.').isLength({ max: 255 }),
];
const taskFields = (creating) => [
  body('title')[creating ? 'exists' : 'optional']().bail().trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 characters).'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 5000 }).withMessage('Description is too long.'),
  body('assignedTo').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('Invalid assignee.').toInt(),
  body('status').optional().isIn(STATUSES).withMessage('Invalid status.'),
  body('priority').optional().isIn(PRIORITIES).withMessage('Invalid priority.'),
  body('dueDate').optional({ values: 'falsy' }).isISO8601({ strict: true }).withMessage('Due date must be YYYY-MM-DD.'),
];
const createTaskRules = [id('teamId', body), ...taskFields(true)];
const updateTaskRules = [id('id'), ...taskFields(false)];
const listTaskRules = [
  query('teamId').optional().isInt({ min: 1 }).toInt(),
  query('assigneeId').optional().isInt({ min: 1 }).toInt(),
];

module.exports = { handle, registerRules, loginRules, teamRules, memberRules, createTaskRules, updateTaskRules, listTaskRules, idParam: [id('id')] };
