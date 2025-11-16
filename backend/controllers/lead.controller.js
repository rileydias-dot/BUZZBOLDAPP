const { query } = require('../config/database');

const getLeads = async (req, res) => {
  try {
    const { status, pipeline_stage } = req.query;

    let queryText = 'SELECT * FROM leads WHERE user_id = $1';
    const params = [req.user.id];

    if (status) {
      params.push(status);
      queryText += ` AND status = $${params.length}`;
    }

    if (pipeline_stage) {
      params.push(pipeline_stage);
      queryText += ` AND pipeline_stage = $${params.length}`;
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get leads',
    });
  }
};

const createLead = async (req, res) => {
  try {
    const { name, email, phone, company, source, status, pipeline_stage, value, notes } = req.body;

    const result = await query(
      `INSERT INTO leads (user_id, name, email, phone, company, source, status, pipeline_stage, value, notes, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [req.user.id, name, email, phone, company, source, status || 'new', pipeline_stage || 'new', value, notes, req.user.id]
    );

    res.status(201).json({
      status: 'success',
      message: 'Lead created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create lead',
    });
  }
};

const updateLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { name, email, phone, company, source, status, pipeline_stage, value, notes } = req.body;

    const result = await query(
      `UPDATE leads SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        company = COALESCE($4, company),
        source = COALESCE($5, source),
        status = COALESCE($6, status),
        pipeline_stage = COALESCE($7, pipeline_stage),
        value = COALESCE($8, value),
        notes = COALESCE($9, notes)
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [name, email, phone, company, source, status, pipeline_stage, value, notes, leadId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Lead not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Lead updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update lead',
    });
  }
};

const deleteLead = async (req, res) => {
  try {
    const { leadId } = req.params;

    const result = await query(
      'DELETE FROM leads WHERE id = $1 AND user_id = $2 RETURNING id',
      [leadId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Lead not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Lead deleted successfully',
    });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete lead',
    });
  }
};

const getLeadForms = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM lead_forms WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get lead forms error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get lead forms',
    });
  }
};

const createLeadForm = async (req, res) => {
  try {
    const { form_name, form_fields, success_message, redirect_url } = req.body;

    const result = await query(
      `INSERT INTO lead_forms (user_id, form_name, form_fields, success_message, redirect_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, form_name, form_fields, success_message, redirect_url]
    );

    res.status(201).json({
      status: 'success',
      message: 'Lead form created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create lead form error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create lead form',
    });
  }
};

module.exports = {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  getLeadForms,
  createLeadForm,
};
