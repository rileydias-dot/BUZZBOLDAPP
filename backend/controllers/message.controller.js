const { query } = require('../config/database');

const getMessages = async (req, res) => {
  try {
    const { platform, read, archived } = req.query;

    let queryText = 'SELECT * FROM messages WHERE user_id = $1';
    const params = [req.user.id];

    if (platform) {
      params.push(platform);
      queryText += ` AND platform = $${params.length}`;
    }

    if (read !== undefined) {
      params.push(read === 'true');
      queryText += ` AND read = $${params.length}`;
    }

    if (archived !== undefined) {
      params.push(archived === 'true');
      queryText += ` AND archived = $${params.length}`;
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get messages',
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const result = await query(
      'UPDATE messages SET read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [messageId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark message as read',
    });
  }
};

const archiveMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const result = await query(
      'UPDATE messages SET archived = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [messageId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Archive message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to archive message',
    });
  }
};

const starMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { starred } = req.body;

    const result = await query(
      'UPDATE messages SET starred = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [starred, messageId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Star message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update message',
    });
  }
};

module.exports = {
  getMessages,
  markAsRead,
  archiveMessage,
  starMessage,
};
