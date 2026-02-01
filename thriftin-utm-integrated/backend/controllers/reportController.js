// backend/controllers/reportController.js
const db = require('../config/db');
const path = require('path');
const fs = require('fs');

const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) {
        console.error('❌ Database Error:', err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Test endpoint to verify server is working
exports.testEndpoint = async (req, res) => {
  console.log('🧪 Test endpoint hit!');
  res.json({ 
    success: true, 
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
};

// Submit a new report with optional evidence
exports.submitReport = async (req, res) => {
  console.log('📥 Report submission request received');
  console.log('📋 Request body:', req.body);
  console.log('📎 File attached:', !!req.file);
  
  try {
    const { 
      reporter_id, 
      reporter_matric,
      reported_user_id, 
      reported_matric,
      reason, 
      description 
    } = req.body;

    console.log('🔍 Receiving report submission:', {
      reporter_id,
      reported_user_id,
      reason,
      description_length: description?.length,
      has_evidence: !!req.file
    });

    // Validation
    if (!reporter_id || !reported_user_id || !reason || !description) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'reporter_id, reported_user_id, reason, and description are required',
        received: {
          reporter_id: !!reporter_id,
          reported_user_id: !!reported_user_id,
          reason: !!reason,
          description: !!description
        }
      });
    }

    if (parseInt(reporter_id) === parseInt(reported_user_id)) {
      console.log('❌ User trying to report themselves');
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
      console.log('📸 Evidence uploaded:', {
        path: evidencePath,
        type: evidenceType,
        size: req.file.size,
        url: evidenceUrl
      });
    }

    // Insert report into database
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

    // Check total reports for this user
    const reportCount = await query(`
      SELECT COUNT(*) as count 
      FROM user_reports 
      WHERE reported_user_id = ?
    `, [reported_user_id]);

    const totalReports = reportCount[0].count;
    console.log(`📊 Total reports for user ${reported_user_id}: ${totalReports}`);

    // Auto-restrict if 2 or more reports
    if (totalReports >= 2) {
      await query(`
        UPDATE students 
        SET account_status = 'restricted' 
        WHERE user_id = ?
      `, [reported_user_id]);
      
      console.log(`⚠️ User ${reported_user_id} auto-restricted (${totalReports} reports)`);
    }

    console.log('📤 Preparing to send response...');
console.log('📤 Response data:', {
  success: true,
  report_id: result.insertId,
  total_reports: totalReports,
  has_evidence: !!evidenceUrl
});

    res.status(200).json({ 
      success: true, 
      message: 'Report submitted successfully',
      report_id: result.insertId,
      total_reports: totalReports,
      evidenceUrl: evidenceUrl,
      user_restricted: totalReports >= 2
    });

  } catch (error) {
    console.error('❌ Error submitting report:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to submit report',
      details: error.message 
    });
  }
};

// Report a user (simpler version without evidence)
exports.reportUser = async (req, res) => {
  try {
    const { reporter_id, reported_id, conversation_id, message_id, reason, additional_details } = req.body;
    
    console.log('📝 Report user request:', { reporter_id, reported_id, reason });

    if (!reporter_id || !reported_id) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'reporter_id and reported_id are required'
      });
    }
    
    const result = await query(`
      INSERT INTO user_reports (reporter_id, reported_id, conversation_id, message_id, reason, additional_details)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [reporter_id, reported_id, conversation_id || null, message_id || null, reason, additional_details || '']);
    
    console.log('✅ User reported, ID:', result.insertId);
    res.status(200).json({ success: true, message: "User reported successfully" });
  } catch (error) {
    console.error('❌ Error reporting user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Block a user
exports.blockUser = async (req, res) => {
  try {
    const { blocker_id, blocked_id, reason, additional_details } = req.body;
    
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
      console.log('⚠️ User already blocked');
      return res.status(400).json({ 
        error: 'User already blocked',
        block_id: existing[0].block_id
      });
    }
    
    // Insert block
    const result = await query(`
      INSERT INTO blocked_users (blocker_id, blocked_id, reason, block_status)
      VALUES (?, ?, ?, 'active')
    `, [blocker_id, blocked_id, reason || 'No reason provided']);
    
    console.log('✅ User blocked successfully, ID:', result.insertId);

    res.status(200).json({ 
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

// Get list of blocked users
exports.getBlockedUsers = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('📋 Fetching blocked users for:', userId);
    
    const blocks = await query(`
      SELECT b.*, u.email, s.name as blocked_username,
             s.profile_image as blocked_profile_picture,
             s.matric as blocked_matric
      FROM blocked_users b
      JOIN user u ON b.blocked_id = u.id
      LEFT JOIN students s ON b.blocked_id = s.user_id
      WHERE b.blocker_id = ? AND b.block_status = 'active'
      ORDER BY b.blocked_at DESC
    `, [userId]);
    
    console.log(`✅ Found ${blocks.length} blocked users`);
    res.json(blocks);
  } catch (error) {
    console.error('❌ Error fetching blocked users:', error);
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
  try {
    const { blockId } = req.params;
    
    console.log('🔓 Unblocking user, block ID:', blockId);
    
    await query(`
      UPDATE blocked_users 
      SET block_status = 'inactive'
      WHERE block_id = ?
    `, [blockId]);
    
    console.log('✅ User unblocked successfully');
    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    console.error('❌ Error unblocking user:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
};

// Get user's submitted reports
exports.getUserReports = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('📋 Fetching reports for user:', userId);

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
      reported_user_id: r.reported_user_id,
      reported_username: r.reported_username,
      reported_matric: r.reported_matric,
      reason: r.reason,
      description: r.description,
      status: r.status,
      created_at: r.created_at,
      hasEvidence: !!r.evidence_path,
      evidenceUrl: r.evidence_path
        ? `${req.protocol}://${req.get('host')}/${r.evidence_path.replace(/\\/g, '/')}`
        : null
    }));

    console.log(`✅ Found ${reports.length} reports for user ${userId}`);
    res.json(formattedReports);
  } catch (error) {
    console.error('❌ Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// Update report status (admin function)
exports.updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, admin_notes } = req.body;
    
    console.log('🔄 Updating report status:', { reportId, status });
    
    await query(`
      UPDATE user_reports
      SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, admin_notes || null, reportId]);
    
    console.log('✅ Report status updated');
    res.json({ success: true, message: 'Report status updated' });
  } catch (error) {
    console.error('❌ Error updating report status:', error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
};