const { query } = require('../config/database');

const getTasks = async (req, res) => {
  try {
    const { status, priority } = req.query;

    let queryText = 'SELECT * FROM tasks WHERE user_id = $1';
    const params = [req.user.id];

    if (status) {
      params.push(status);
      queryText += ` AND status = $${params.length}`;
    }

    if (priority) {
      params.push(priority);
      queryText += ` AND priority = $${params.length}`;
    }

    queryText += ' ORDER BY due_date ASC, created_at DESC';

    const result = await query(queryText, params);

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get tasks',
    });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, due_date, priority, status, related_to_type, related_to_id } = req.body;

    const result = await query(
      `INSERT INTO tasks (user_id, title, description, due_date, priority, status, assigned_to, related_to_type, related_to_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.id, title, description, due_date, priority || 'medium', status || 'pending', req.user.id, related_to_type, related_to_id]
    );

    res.status(201).json({
      status: 'success',
      message: 'Task created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create task',
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, due_date, priority, status } = req.body;

    const result = await query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        due_date = COALESCE($3, due_date),
        priority = COALESCE($4, priority),
        status = COALESCE($5, status),
        completed_at = CASE WHEN $5 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [title, description, due_date, priority, status, taskId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Task updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update task',
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const result = await query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [taskId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete task',
    });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
