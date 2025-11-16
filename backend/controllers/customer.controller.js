const { query } = require('../config/database');

// Get all customers
const getCustomers = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM customers WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get customers',
    });
  }
};

// Get customer by ID
const getCustomerById = async (req, res) => {
  try {
    const { customerId } = req.params;

    const result = await query(
      'SELECT * FROM customers WHERE id = $1 AND user_id = $2',
      [customerId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get customer',
    });
  }
};

// Create customer
const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, company, address, city, state, zip, country, notes, tags } = req.body;

    const result = await query(
      `INSERT INTO customers (user_id, name, email, phone, company, address, city, state, zip, country, notes, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [req.user.id, name, email, phone, company, address, city, state, zip, country, notes, tags || []]
    );

    res.status(201).json({
      status: 'success',
      message: 'Customer created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create customer',
    });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { name, email, phone, company, address, city, state, zip, country, notes, tags } = req.body;

    const result = await query(
      `UPDATE customers SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        company = COALESCE($4, company),
        address = COALESCE($5, address),
        city = COALESCE($6, city),
        state = COALESCE($7, state),
        zip = COALESCE($8, zip),
        country = COALESCE($9, country),
        notes = COALESCE($10, notes),
        tags = COALESCE($11, tags)
       WHERE id = $12 AND user_id = $13
       RETURNING *`,
      [name, email, phone, company, address, city, state, zip, country, notes, tags, customerId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Customer updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update customer',
    });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const result = await query(
      'DELETE FROM customers WHERE id = $1 AND user_id = $2 RETURNING id',
      [customerId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete customer',
    });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
