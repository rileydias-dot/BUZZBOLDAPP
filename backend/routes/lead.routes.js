const express = require('express');
const router = express.Router();
const {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  getLeadForms,
  createLeadForm,
} = require('../controllers/lead.controller');
const { auth } = require('../middleware/auth.middleware');

router.get('/', auth, getLeads);
router.post('/', auth, createLead);
router.put('/:leadId', auth, updateLead);
router.delete('/:leadId', auth, deleteLead);

router.get('/forms', auth, getLeadForms);
router.post('/forms', auth, createLeadForm);

module.exports = router;
