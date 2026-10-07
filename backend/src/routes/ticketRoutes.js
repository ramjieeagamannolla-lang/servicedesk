const express = require('express');
const {
  getTickets,
  getTicketById,
  createTicket,
  updateStatus,
  assignTicket,
  acceptTicket,
  addComment,
  addWorkLog,
  resolveTicket,
  confirmResolution,
  reopenTicket,
} = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

const staff = [ROLES.TECHNICIAN, ROLES.IT_MANAGER, ROLES.SYSTEM_ADMIN];

router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post('/', createTicket);

router.patch('/:id/status', updateStatus);
router.patch('/:id/assign', authorize(ROLES.IT_MANAGER, ROLES.SYSTEM_ADMIN), assignTicket);
router.post('/:id/accept', authorize(ROLES.TECHNICIAN), acceptTicket);

router.post('/:id/comments', addComment);
router.post('/:id/worklogs', authorize(...staff), addWorkLog);
router.post('/:id/resolve', authorize(...staff), resolveTicket);
router.post('/:id/confirm', confirmResolution);
router.post('/:id/reopen', reopenTicket);

module.exports = router;
