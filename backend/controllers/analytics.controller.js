const { query } = require('../config/database');

const getDashboardMetrics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const metrics = await Promise.all([
      query('SELECT COUNT(*) as total_leads FROM leads WHERE user_id = $1', [req.user.id]),
      query('SELECT COUNT(*) as total_customers FROM customers WHERE user_id = $1', [req.user.id]),
      query('SELECT COUNT(*) as total_invoices, SUM(total) as total_revenue FROM invoices WHERE user_id = $1 AND status = $2', [req.user.id, 'paid']),
      query('SELECT COUNT(*) as total_reviews, AVG(rating) as avg_rating FROM reviews WHERE user_id = $1', [req.user.id]),
      query('SELECT COUNT(*) as total_tasks, COUNT(CASE WHEN status = $2 THEN 1 END) as pending_tasks FROM tasks WHERE user_id = $1', [req.user.id, 'pending']),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        leads: parseInt(metrics[0].rows[0].total_leads),
        customers: parseInt(metrics[1].rows[0].total_customers),
        invoices: parseInt(metrics[2].rows[0].total_invoices),
        revenue: parseFloat(metrics[2].rows[0].total_revenue || 0),
        reviews: parseInt(metrics[3].rows[0].total_reviews),
        avg_rating: parseFloat(metrics[3].rows[0].avg_rating || 0),
        total_tasks: parseInt(metrics[4].rows[0].total_tasks),
        pending_tasks: parseInt(metrics[4].rows[0].pending_tasks),
      },
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get dashboard metrics',
    });
  }
};

const getTrafficAnalytics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let queryText = `
      SELECT date, SUM(metric_value) as total_value
      FROM analytics
      WHERE user_id = $1 AND metric_type = 'traffic'
    `;

    const params = [req.user.id];

    if (start_date && end_date) {
      params.push(start_date, end_date);
      queryText += ` AND date BETWEEN $${params.length - 1} AND $${params.length}`;
    }

    queryText += ' GROUP BY date ORDER BY date DESC LIMIT 30';

    const result = await query(queryText, params);

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get traffic analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get traffic analytics',
    });
  }
};

const getSocialAnalytics = async (req, res) => {
  try {
    const result = await query(
      `SELECT platform,
              COUNT(*) as total_posts,
              SUM((analytics->>'reach')::int) as total_reach,
              SUM((analytics->>'clicks')::int) as total_clicks
       FROM social_posts
       WHERE user_id = $1 AND status = 'posted' AND analytics IS NOT NULL
       GROUP BY platform`,
      [req.user.id]
    );

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get social analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get social analytics',
    });
  }
};

const getRevenueAnalytics = async (req, res) => {
  try {
    const result = await query(
      `SELECT
        DATE_TRUNC('month', paid_at) as month,
        SUM(total) as revenue,
        COUNT(*) as invoice_count
       FROM invoices
       WHERE user_id = $1 AND status = 'paid'
       GROUP BY month
       ORDER BY month DESC
       LIMIT 12`,
      [req.user.id]
    );

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get revenue analytics',
    });
  }
};

module.exports = {
  getDashboardMetrics,
  getTrafficAnalytics,
  getSocialAnalytics,
  getRevenueAnalytics,
};
