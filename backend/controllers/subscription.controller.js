const { query } = require('../config/database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const getPlans = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM subscription_plans WHERE active = true ORDER BY price ASC'
    );

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get subscription plans',
    });
  }
};

const getCurrentSubscription = async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, p.plan_name, p.price, p.features
       FROM user_subscriptions s
       JOIN subscription_plans p ON s.plan_id = p.id
       WHERE s.user_id = $1 AND s.status = 'active'`,
      [req.user.id]
    );

    res.status(200).json({
      status: 'success',
      data: result.rows[0] || null,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get subscription',
    });
  }
};

const createSubscription = async (req, res) => {
  try {
    const { plan_id, payment_method_id } = req.body;

    const planResult = await query(
      'SELECT * FROM subscription_plans WHERE id = $1',
      [plan_id]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Plan not found',
      });
    }

    const plan = planResult.rows[0];

    let stripeCustomerId;
    const existingSubscription = await query(
      'SELECT stripe_customer_id FROM user_subscriptions WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );

    if (existingSubscription.rows.length > 0 && existingSubscription.rows[0].stripe_customer_id) {
      stripeCustomerId = existingSubscription.rows[0].stripe_customer_id;
    } else {
      const userResult = await query('SELECT email FROM users WHERE id = $1', [req.user.id]);
      const customer = await stripe.customers.create({
        email: userResult.rows[0].email,
        payment_method: payment_method_id,
        invoice_settings: {
          default_payment_method: payment_method_id,
        },
      });
      stripeCustomerId = customer.id;
    }

    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: plan.stripe_price_id }],
      expand: ['latest_invoice.payment_intent'],
    });

    await query(
      `INSERT INTO user_subscriptions (user_id, plan_id, stripe_subscription_id, stripe_customer_id, status, current_period_start, current_period_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
       plan_id = $2,
       stripe_subscription_id = $3,
       status = $5,
       current_period_start = $6,
       current_period_end = $7`,
      [
        req.user.id,
        plan_id,
        subscription.id,
        stripeCustomerId,
        'active',
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
      ]
    );

    res.status(201).json({
      status: 'success',
      message: 'Subscription created successfully',
      data: subscription,
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create subscription',
    });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const result = await query(
      'SELECT stripe_subscription_id FROM user_subscriptions WHERE user_id = $1 AND status = $2',
      [req.user.id, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No active subscription found',
      });
    }

    await stripe.subscriptions.cancel(result.rows[0].stripe_subscription_id);

    await query(
      'UPDATE user_subscriptions SET status = $1 WHERE user_id = $2',
      ['cancelled', req.user.id]
    );

    res.status(200).json({
      status: 'success',
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel subscription',
    });
  }
};

module.exports = {
  getPlans,
  getCurrentSubscription,
  createSubscription,
  cancelSubscription,
};
