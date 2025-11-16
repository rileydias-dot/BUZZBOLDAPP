const { query } = require('../config/database');
const axios = require('axios');

// Get all connected social accounts
const getAccounts = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, platform, account_name, account_id, status, connected_at FROM social_accounts WHERE user_id = $1',
      [req.user.id]
    );

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get social accounts',
    });
  }
};

// Instagram OAuth
const instagramAuth = (req, res) => {
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${process.env.INSTAGRAM_REDIRECT_URI}&scope=user_profile,user_media&response_type=code`;
  res.redirect(authUrl);
};

const instagramCallback = async (req, res) => {
  try {
    const { code } = req.query;

    const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', {
      client_id: process.env.INSTAGRAM_APP_ID,
      client_secret: process.env.INSTAGRAM_APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      code,
    });

    const { access_token, user_id } = tokenResponse.data;

    const profileResponse = await axios.get(
      `https://graph.instagram.com/me?fields=id,username&access_token=${access_token}`
    );

    await query(
      `INSERT INTO social_accounts (user_id, platform, account_id, account_name, access_token, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, platform, account_id) DO UPDATE SET
       access_token = $5, account_name = $4, status = $6`,
      [req.user.id, 'instagram', user_id, profileResponse.data.username, access_token, 'active']
    );

    res.redirect(`${process.env.CLIENT_URL}/social?success=instagram`);
  } catch (error) {
    console.error('Instagram callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/social?error=instagram`);
  }
};

// TikTok OAuth
const tiktokAuth = (req, res) => {
  const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${process.env.TIKTOK_REDIRECT_URI}`;
  res.redirect(authUrl);
};

const tiktokCallback = async (req, res) => {
  try {
    const { code } = req.query;

    const tokenResponse = await axios.post('https://open-api.tiktok.com/oauth/access_token/', {
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    });

    const { access_token, open_id } = tokenResponse.data.data;

    const profileResponse = await axios.get(
      `https://open-api.tiktok.com/user/info/?access_token=${access_token}&open_id=${open_id}`
    );

    await query(
      `INSERT INTO social_accounts (user_id, platform, account_id, account_name, access_token, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, platform, account_id) DO UPDATE SET
       access_token = $5, account_name = $4, status = $6`,
      [req.user.id, 'tiktok', open_id, profileResponse.data.data.display_name, access_token, 'active']
    );

    res.redirect(`${process.env.CLIENT_URL}/social?success=tiktok`);
  } catch (error) {
    console.error('TikTok callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/social?error=tiktok`);
  }
};

// LinkedIn OAuth
const linkedinAuth = (req, res) => {
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${process.env.LINKEDIN_REDIRECT_URI}&scope=r_liteprofile%20r_emailaddress%20w_member_social`;
  res.redirect(authUrl);
};

const linkedinCallback = async (req, res) => {
  try {
    const { code } = req.query;

    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      null,
      {
        params: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        },
      }
    );

    const access_token = tokenResponse.data.access_token;

    const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profileName = `${profileResponse.data.localizedFirstName} ${profileResponse.data.localizedLastName}`;

    await query(
      `INSERT INTO social_accounts (user_id, platform, account_id, account_name, access_token, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, platform, account_id) DO UPDATE SET
       access_token = $5, account_name = $4, status = $6`,
      [req.user.id, 'linkedin', profileResponse.data.id, profileName, access_token, 'active']
    );

    res.redirect(`${process.env.CLIENT_URL}/social?success=linkedin`);
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/social?error=linkedin`);
  }
};

// X (Twitter) OAuth
const xAuth = (req, res) => {
  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.X_CLIENT_ID}&redirect_uri=${process.env.X_REDIRECT_URI}&scope=tweet.read%20tweet.write%20users.read&state=state&code_challenge=challenge&code_challenge_method=plain`;
  res.redirect(authUrl);
};

const xCallback = async (req, res) => {
  try {
    const { code } = req.query;

    const tokenResponse = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      {
        code,
        grant_type: 'authorization_code',
        client_id: process.env.X_CLIENT_ID,
        redirect_uri: process.env.X_REDIRECT_URI,
        code_verifier: 'challenge',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    );

    const access_token = tokenResponse.data.access_token;

    const profileResponse = await axios.get('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    await query(
      `INSERT INTO social_accounts (user_id, platform, account_id, account_name, access_token, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, platform, account_id) DO UPDATE SET
       access_token = $5, account_name = $4, status = $6`,
      [req.user.id, 'x', profileResponse.data.data.id, profileResponse.data.data.username, access_token, 'active']
    );

    res.redirect(`${process.env.CLIENT_URL}/social?success=x`);
  } catch (error) {
    console.error('X callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/social?error=x`);
  }
};

// Create a post
const createPost = async (req, res) => {
  try {
    const { social_account_id, content, media_urls, scheduled_for } = req.body;

    const accountResult = await query(
      'SELECT * FROM social_accounts WHERE id = $1 AND user_id = $2',
      [social_account_id, req.user.id]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Social account not found',
      });
    }

    const account = accountResult.rows[0];

    const result = await query(
      `INSERT INTO social_posts (user_id, social_account_id, platform, content, media_urls, scheduled_for, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        social_account_id,
        account.platform,
        content,
        media_urls || [],
        scheduled_for || null,
        scheduled_for ? 'scheduled' : 'draft',
      ]
    );

    res.status(201).json({
      status: 'success',
      message: 'Post created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
};

// Get posts
const getPosts = async (req, res) => {
  try {
    const { platform, status } = req.query;

    let queryText = 'SELECT * FROM social_posts WHERE user_id = $1';
    const params = [req.user.id];

    if (platform) {
      params.push(platform);
      queryText += ` AND platform = $${params.length}`;
    }

    if (status) {
      params.push(status);
      queryText += ` AND status = $${params.length}`;
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get posts',
    });
  }
};

// Get comments for a post
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await query(
      'SELECT * FROM social_comments WHERE post_id = $1 ORDER BY created_at DESC',
      [postId]
    );

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get comments',
    });
  }
};

// Reply to a comment
const replyToComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reply_text } = req.body;

    const result = await query(
      `UPDATE social_comments SET replied = true, reply_text = $1, replied_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [reply_text, commentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Reply sent successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Reply to comment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reply to comment',
    });
  }
};

// Get analytics
const getAnalytics = async (req, res) => {
  try {
    const { platform } = req.query;

    let queryText = `
      SELECT platform,
             COUNT(*) as total_posts,
             SUM((analytics->>'reach')::int) as total_reach,
             SUM((analytics->>'clicks')::int) as total_clicks,
             AVG((analytics->>'reach')::int) as avg_reach
      FROM social_posts
      WHERE user_id = $1 AND status = 'posted' AND analytics IS NOT NULL
    `;

    const params = [req.user.id];

    if (platform) {
      params.push(platform);
      queryText += ` AND platform = $${params.length}`;
    }

    queryText += ' GROUP BY platform';

    const result = await query(queryText, params);

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get analytics',
    });
  }
};

module.exports = {
  getAccounts,
  instagramAuth,
  instagramCallback,
  tiktokAuth,
  tiktokCallback,
  linkedinAuth,
  linkedinCallback,
  xAuth,
  xCallback,
  createPost,
  getPosts,
  getComments,
  replyToComment,
  getAnalytics,
};
