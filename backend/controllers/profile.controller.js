const { query } = require('../config/database');
const { validationResult } = require('express-validator');

const getProfile = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get profile',
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array(),
      });
    }

    const {
      business_name,
      contact_name,
      phone,
      address,
      city,
      state,
      zip,
      country,
      website,
      industry,
      business_hours,
      services,
      notes,
    } = req.body;

    const result = await query(
      `UPDATE profiles SET
        business_name = COALESCE($1, business_name),
        contact_name = COALESCE($2, contact_name),
        phone = COALESCE($3, phone),
        address = COALESCE($4, address),
        city = COALESCE($5, city),
        state = COALESCE($6, state),
        zip = COALESCE($7, zip),
        country = COALESCE($8, country),
        website = COALESCE($9, website),
        industry = COALESCE($10, industry),
        business_hours = COALESCE($11, business_hours),
        services = COALESCE($12, services),
        notes = COALESCE($13, notes)
      WHERE user_id = $14
      RETURNING *`,
      [
        business_name,
        contact_name,
        phone,
        address,
        city,
        state,
        zip,
        country,
        website,
        industry,
        business_hours,
        services,
        notes,
        req.user.id,
      ]
    );

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile',
    });
  }
};

const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    await query(
      'UPDATE profiles SET photo_url = $1 WHERE user_id = $2',
      [photoUrl, req.user.id]
    );

    res.status(200).json({
      status: 'success',
      message: 'Photo uploaded successfully',
      data: { photo_url: photoUrl },
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload photo',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadPhoto,
};
