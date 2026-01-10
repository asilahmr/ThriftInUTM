const { query } = require('../config/db');

exports.submitFeedback = async (req, res) => {
  try {
    const { user_id, feedback_type, title, description, rating, category, platform, app_version, device_info } = req.body;
    
    let screenshot_url = null;
    if (req.file) {
      screenshot_url = `/uploads/feedback/${req.file.filename}`;
    }
    
    const result = await query(`
      INSERT INTO feedback (user_id, feedback_type, title, description, rating, category, platform, app_version, device_info, screenshot_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [user_id, feedback_type, title, description, rating, category, platform, app_version, device_info, screenshot_url]);
    
    res.json({ 
      success: true, 
      feedback_id: result.insertId,
      message: 'Feedback submitted successfully' 
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

exports.getUserFeedback = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, status } = req.query;
    
    let sql = `SELECT * FROM feedback WHERE user_id = ?`;
    const params = [userId];
    
    if (type) {
      sql += ` AND feedback_type = ?`;
      params.push(type);
    }
    
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    
    sql += ` ORDER BY created_at DESC`;
    
    const feedback = await query(sql, params);
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
};

exports.getFeedbackDetail = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    
    const feedback = await query(`
      SELECT f.*, u.username, u.full_name
      FROM feedback f
      JOIN users u ON f.user_id = u.user_id
      WHERE f.feedback_id = ?
    `, [feedbackId]);
    
    if (feedback.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    const responses = await query(`
      SELECT r.*, u.username as responder_name, u.full_name as responder_full_name
      FROM feedback_responses r
      JOIN users u ON r.responder_id = u.user_id
      WHERE r.feedback_id = ?
      ORDER BY r.created_at ASC
    `, [feedbackId]);
    
    res.json({ ...feedback[0], responses });
  } catch (error) {
    console.error('Error fetching feedback detail:', error);
    res.status(500).json({ error: 'Failed to fetch feedback detail' });
  }
};

exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { status } = req.body;
    
    await query(`UPDATE feedback SET status = ? WHERE feedback_id = ?`, [status, feedbackId]);
    res.json({ success: true, message: 'Feedback status updated' });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({ error: 'Failed to update feedback status' });
  }
};

exports.addResponse = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { responder_id, response_text, is_public = false } = req.body;
    
    const result = await query(`
      INSERT INTO feedback_responses (feedback_id, responder_id, response_text, is_public)
      VALUES (?, ?, ?, ?)
    `, [feedbackId, responder_id, response_text, is_public]);
    
    // Create notification for user
    const feedback = await query(`SELECT user_id FROM feedback WHERE feedback_id = ?`, [feedbackId]);
    if (feedback.length > 0) {
      await query(`
        INSERT INTO notifications (user_id, notification_type, title, message_preview)
        VALUES (?, 'feedback_response', 'Response to Your Feedback', ?)
      `, [feedback[0].user_id, response_text.substring(0, 100)]);
    }
    
    res.json({ success: true, response_id: result.insertId });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ error: 'Failed to add response' });
  }
};

exports.upvoteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    
    await query(`UPDATE feedback SET upvote_count = upvote_count + 1 WHERE feedback_id = ?`, [feedbackId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error upvoting feedback:', error);
    res.status(500).json({ error: 'Failed to upvote feedback' });
  }
};