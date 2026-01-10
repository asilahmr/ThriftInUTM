const { query } = require('../config/db');

exports.reportUser = async (req, res) => {
  try {
    const { reporter_id, reported_id, conversation_id, message_id, reason, additional_details } = req.body;
    
    const result = await query(`
      INSERT INTO user_reports (reporter_id, reported_id, conversation_id, message_id, reason, additional_details)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [reporter_id, reported_id, conversation_id, message_id, reason, additional_details || '']);
    
    res.json({ 
      success: true, 
      message: 'Report submitted successfully',
      report_id: result.insertId 
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { blocker_id, blocked_id, reason } = req.body;
    
    const result = await query(`
      INSERT INTO blocked_users (blocker_id, blocked_id, reason)
      VALUES (?, ?, ?)
    `, [blocker_id, blocked_id, reason]);
    
    res.json({ 
      success: true, 
      message: 'User blocked successfully',
      block_id: result.insertId 
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const blocks = await query(`
      SELECT b.*, u.username as blocked_username, u.full_name as blocked_full_name,
             u.profile_picture as blocked_profile_picture
      FROM blocked_users b
      JOIN users u ON b.blocked_id = u.user_id
      WHERE b.blocker_id = ? AND b.block_status = 'active'
      ORDER BY b.created_at DESC
    `, [userId]);
    
    res.json(blocks);
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { blockId } = req.params;
    
    await query(`
      UPDATE blocked_users 
      SET block_status = 'removed', removed_at = CURRENT_TIMESTAMP
      WHERE block_id = ?
    `, [blockId]);
    
    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
};

exports.getUserReports = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const reports = await query(`
      SELECT r.*, u.username as reported_username, u.full_name as reported_full_name
      FROM user_reports r
      JOIN users u ON r.reported_id = u.user_id
      WHERE r.reporter_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, admin_notes } = req.body;
    
    await query(`
      UPDATE user_reports
      SET report_status = ?, admin_notes = ?
      WHERE report_id = ?
    `, [status, admin_notes, reportId]);
    
    res.json({ success: true, message: 'Report status updated' });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
};