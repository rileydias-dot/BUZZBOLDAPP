const { query } = require('../config/database');
const axios = require('axios');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Get all review platforms
const getPlatforms = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, platform, location_name, location_id, status, connected_at FROM review_platforms WHERE user_id = $1',
      [req.user.id]
    );

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get platforms error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get review platforms',
    });
  }
};

// Google Business Profile OAuth
const googleAuth = (req, res) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/business.manage&access_type=offline`;
  res.redirect(authUrl);
};

const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token } = tokenResponse.data;

    const accountsResponse = await axios.get(
      'https://mybusinessbusinessinformation.googleapis.com/v1/accounts',
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const account = accountsResponse.data.accounts[0];

    await query(
      `INSERT INTO review_platforms (user_id, platform, location_id, location_name, access_token, refresh_token, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, platform, location_id) DO UPDATE SET
       access_token = $5, refresh_token = $6, status = $7`,
      [req.user.id, 'google', account.name, account.accountName, access_token, refresh_token, 'active']
    );

    res.redirect(`${process.env.CLIENT_URL}/reviews?success=google`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/reviews?error=google`);
  }
};

// Facebook OAuth for reviews
const facebookAuth = (req, res) => {
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&scope=pages_show_list,pages_read_engagement,pages_manage_metadata`;
  res.redirect(authUrl);
};

const facebookCallback = async (req, res) => {
  try {
    const { code } = req.query;

    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`
    );

    const access_token = tokenResponse.data.access_token;

    const pagesResponse = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${access_token}`
    );

    const page = pagesResponse.data.data[0];

    await query(
      `INSERT INTO review_platforms (user_id, platform, location_id, location_name, access_token, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, platform, location_id) DO UPDATE SET
       access_token = $5, status = $6`,
      [req.user.id, 'facebook', page.id, page.name, page.access_token, 'active']
    );

    res.redirect(`${process.env.CLIENT_URL}/reviews?success=facebook`);
  } catch (error) {
    console.error('Facebook callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/reviews?error=facebook`);
  }
};

// Get all reviews
const getReviews = async (req, res) => {
  try {
    const { platform, rating } = req.query;

    let queryText = 'SELECT * FROM reviews WHERE user_id = $1';
    const params = [req.user.id];

    if (platform) {
      params.push(platform);
      queryText += ` AND platform = $${params.length}`;
    }

    if (rating) {
      params.push(rating);
      queryText += ` AND rating = $${params.length}`;
    }

    queryText += ' ORDER BY review_date DESC';

    const result = await query(queryText, params);

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get reviews',
    });
  }
};

// Reply to a review
const replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reply_text } = req.body;

    const result = await query(
      `UPDATE reviews SET replied = true, reply_text = $1, replied_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [reply_text, reviewId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Reply sent successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Reply to review error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reply to review',
    });
  }
};

// Send review request
const sendReviewRequest = async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, platform, sent_via, message_template } = req.body;

    const reviewLink = `https://reviews.buzzbold.com/${platform}/${req.user.id}`;

    const result = await query(
      `INSERT INTO review_requests (user_id, customer_name, customer_email, customer_phone, platform, message_template, review_link, sent_via, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.id, customer_name, customer_email, customer_phone, platform, message_template, reviewLink, sent_via, 'pending']
    );

    const request = result.rows[0];

    if (sent_via === 'email' && customer_email) {
      const mailOptions = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: customer_email,
        subject: 'We\'d love your feedback!',
        html: `
          <p>Hi ${customer_name},</p>
          <p>${message_template}</p>
          <p><a href="${reviewLink}">Leave a Review</a></p>
          <p>Thank you!</p>
        `,
      };

      await transporter.sendMail(mailOptions);

      await query(
        'UPDATE review_requests SET sent_at = CURRENT_TIMESTAMP, status = $1 WHERE id = $2',
        ['sent', request.id]
      );
    } else if (sent_via === 'sms' && customer_phone) {
      await twilioClient.messages.create({
        body: `${message_template} ${reviewLink}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: customer_phone,
      });

      await query(
        'UPDATE review_requests SET sent_at = CURRENT_TIMESTAMP, status = $1 WHERE id = $2',
        ['sent', request.id]
      );
    }

    res.status(201).json({
      status: 'success',
      message: 'Review request sent successfully',
      data: request,
    });
  } catch (error) {
    console.error('Send review request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send review request',
    });
  }
};

// Get review requests
const getReviewRequests = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM review_requests WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get review requests error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get review requests',
    });
  }
};

// Get review analytics
const getReviewAnalytics = async (req, res) => {
  try {
    const result = await query(
      `SELECT
        platform,
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
       FROM reviews
       WHERE user_id = $1
       GROUP BY platform`,
      [req.user.id]
    );

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get review analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get review analytics',
    });
  }
};

module.exports = {
  getPlatforms,
  googleAuth,
  googleCallback,
  facebookAuth,
  facebookCallback,
  getReviews,
  replyToReview,
  sendReviewRequest,
  getReviewRequests,
  getReviewAnalytics,
};
