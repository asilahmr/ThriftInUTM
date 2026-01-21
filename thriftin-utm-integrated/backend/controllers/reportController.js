// backend/controllers/reportController.js
const db = require('../config/db');

const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) {
        console.error('Database Error:', err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

const path = require('path');
const fs = require('fs');

exports.submitReport = async (req, res) => {
  try {
    const { 
      reporter_id, 
      reporter_matric,
      reported_user_id, 
      reported_matric,
      reason, 
      description 
    } = req.body;

    console.log('📝 Receiving report submission:', {
      reporter_id,
      reported_user_id,
      reason,
      has_evidence: !!req.file
    });

    if (!reporter_id || !reported_user_id || !reason || !description) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'reporter_id, reported_user_id, reason, and description are required'
      });
    }

    if (parseInt(reporter_id) === parseInt(reported_user_id)) {
      return res.status(400).json({ 
        error: 'Cannot report yourself' 
      });
    }

    let evidencePath = null;
    let evidenceType = null;
    let evidenceUrl = null;

    if (req.file) {
      evidencePath = req.file.path;  
      evidenceType = req.file.mimetype;
      evidenceUrl = `${req.protocol}://${req.get('host')}/uploads/evidence/${req.file.filename}`;
      console.log('📎 Evidence uploaded:', evidencePath, 'URL:', evidenceUrl);
    }

    const result = await query(`
      INSERT INTO user_reports (
        reporter_id, 
        reporter_matric,
        reported_user_id, 
        reported_matric,
        reason, 
        description,
        evidence_path,
        evidence_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      reporter_id,
      reporter_matric,
      reported_user_id,
      reported_matric,
      reason,
      description,
      evidencePath,
      evidenceType
    ]);

    console.log('✅ Report submitted successfully, ID:', result.insertId);

    const reportCount = await query(`
      SELECT COUNT(*) as count 
      FROM user_reports 
      WHERE reported_user_id = ?
    `, [reported_user_id]);

    if (reportCount[0].count >= 2) {
      await query(`
        UPDATE students 
        SET account_status = 'restricted' 
        WHERE user_id = ?
      `, [reported_user_id]);
      
      console.log(`⚠️ User ${reported_user_id} auto-restricted (${reportCount[0].count} reports)`);
    }

    res.json({ 
      success: true, 
      message: 'Report submitted successfully',
      report_id: result.insertId,
      total_reports: reportCount[0].count,
      evidenceUrl: evidenceUrl 
    });
  } catch (error) {
    console.error('❌ Error submitting report:', error);
    res.status(500).json({ 
      error: 'Failed to submit report',
      details: error.message 
    });
  }
};

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
    
    console.log('🚫 Block request:', { blocker_id, blocked_id, reason });

    // Validation
    if (!blocker_id || !blocked_id) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'blocker_id and blocked_id are required'
      });
    }

    if (parseInt(blocker_id) === parseInt(blocked_id)) {
      return res.status(400).json({ 
        error: 'Cannot block yourself' 
      });
    }

    // Check if already blocked
    const existing = await query(`
      SELECT * FROM blocked_users 
      WHERE blocker_id = ? AND blocked_id = ? AND block_status = 'active'
    `, [blocker_id, blocked_id]);

    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'User already blocked',
        block_id: existing[0].block_id
      });
    }
    
    const result = await query(`
      INSERT INTO blocked_users (blocker_id, blocked_id, reason, block_status)
      VALUES (?, ?, ?, 'active')
    `, [blocker_id, blocked_id, reason || 'No reason provided']);
    
    console.log('✅ User blocked successfully, ID:', result.insertId);

    res.json({ 
      success: true, 
      message: 'User blocked successfully',
      block_id: result.insertId 
    });
  } catch (error) {
    console.error('❌ Error blocking user:', error);
    res.status(500).json({ 
      error: 'Failed to block user',
      details: error.message 
    });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const blocks = await query(`
      SELECT b.*, u.email, s.name as blocked_username,
             s.profile_image as blocked_profile_picture
      FROM blocked_users b
      JOIN user u ON b.blocked_id = u.id
      LEFT JOIN students s ON b.blocked_id = s.user_id
      WHERE b.blocker_id = ? AND b.block_status = 'active'
      ORDER BY b.blocked_at DESC
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
      SET block_status = 'inactive'
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
      SELECT r.*, 
             u.email as reported_email,
             s.name as reported_username,
             s.matric as reported_matric,
             r.evidence_path
      FROM user_reports r
      JOIN user u ON r.reported_user_id = u.id
      LEFT JOIN students s ON r.reported_user_id = s.user_id
      WHERE r.reporter_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);

    const formattedReports = reports.map(r => ({
      id: r.id,
      reason: r.reason,
      description: r.description,
      status: r.status,
      created_at: r.created_at,
      hasEvidence: !!r.evidence_path,
      evidenceUrl: r.evidence_path
        ? `${req.protocol}://${req.get('host')}/${r.evidence_path.replace(/\\/g, '/')}`
        : null
    }));

    console.log(`Found ${reports.length} reports for user ${userId}`);

    res.json(formattedReports);
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
      SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, admin_notes, reportId]);
    
    res.json({ success: true, message: 'Report status updated' });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
};