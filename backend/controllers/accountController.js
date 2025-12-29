// backend/controllers/accountController.js
const db = require('../config/db');

const checkUserRestrictions = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.query(
      `SELECT u.id, u.email, u.user_type, 
              s.verification_status, s.email_verified, s.account_status
       FROM user u
       LEFT JOIN students s ON u.id = s.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const restrictions = [];

    if (user.account_status === 'permanently_suspended') {
      restrictions.push({
        type: 'permanently_suspended',
        message: 'Your account has been permanently suspended due to violation of platform rules.',
        canBuy: false,
        canSell: false
      });
    }

    if (user.account_status === 'suspended') {
      restrictions.push({
        type: 'suspended',
        message: 'Your account is temporarily suspended due to investigation.',
        canBuy: false,
        canSell: false
      });
    }

    if (user.account_status === 'restricted') {
      const [reports] = await db.query(
        `SELECT COUNT(*) as report_count 
         FROM user_reports 
         WHERE reported_user_id = ?`,
        [userId]
      );

      const isReported = reports[0].report_count > 0;
      const isUnverified = !user.email_verified || user.verification_status !== 'verified';

      if (isReported && isUnverified) {
        restrictions.push({
          type: 'restricted_reported_unverified',
          message: 'Your account is restricted due to reports and unverified status.',
          canBuy: false,
          canSell: false
        });
      } else if (isReported) {
        restrictions.push({
          type: 'restricted_reported',
          message: 'Your account is restricted due to reports and is under investigation.',
          canBuy: false,
          canSell: false
        });
      } else if (isUnverified) {
        restrictions.push({
          type: 'restricted_unverified',
          message: 'Please verify your account to perform transactions.',
          canBuy: false,
          canSell: false,
          action: 'verify_account'
        });
      }
    }

    if (!user.email_verified && user.account_status !== 'restricted') {
      restrictions.push({
        type: 'email_unverified',
        message: 'Please verify your email before performing this action.',
        canBuy: false,
        canSell: false,
        action: 'resend_verification'
      });
    }

    const canTransact = restrictions.length === 0;

    res.json({
      canTransact,
      restrictions,
      accountStatus: user.account_status || 'active',
      emailVerified: user.email_verified
    });

  } catch (error) {
    console.error('Check restrictions error:', error);
    res.status(500).json({ error: 'Failed to check user restrictions' });
  }
};

// ============================================
// AUTO-RESTRICT: Report submission endpoint
// ============================================
const submitUserReport = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      reportedUserId, 
      reason, 
      description,
      evidencePath,
      evidenceType 
    } = req.body;
    const reporterId = req.user.id;

    console.log('\n=== SUBMITTING REPORT ===');
    console.log('Reporter ID:', reporterId);
    console.log('Reported User ID:', reportedUserId);
    console.log('Reason:', reason);

    // Get reporter matric
    const [reporter] = await connection.query(
      'SELECT matric FROM students WHERE user_id = ?',
      [reporterId]
    );

    // Get reported user matric
    const [reported] = await connection.query(
      'SELECT matric, account_status FROM students WHERE user_id = ?',
      [reportedUserId]
    );

    if (reported.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Reported user not found' });
    }

    console.log('Current account status:', reported[0].account_status);

    // Insert the report
    const [result] = await connection.query(
      `INSERT INTO user_reports 
       (reporter_id, reporter_matric, reported_user_id, reported_matric, 
        reason, description, evidence_path, evidence_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reporterId,
        reporter[0]?.matric,
        reportedUserId,
        reported[0]?.matric,
        reason,
        description,
        evidencePath || null,
        evidenceType || null
      ]
    );

    console.log('Report inserted with ID:', result.insertId);

    // AUTO-RESTRICT: Only if user is currently 'active'
    if (reported[0].account_status === 'active') {
      await connection.query(
        `UPDATE students 
         SET account_status = 'restricted'
         WHERE user_id = ?`,
        [reportedUserId]
      );
      console.log('✅ User automatically restricted');
    } else {
      console.log('⚠️ User already has status:', reported[0].account_status);
    }

    await connection.commit();
    console.log('=== REPORT SUBMITTED SUCCESSFULLY ===\n');

    res.json({
      success: true,
      message: 'Report submitted successfully',
      reportId: result.insertId,
      userRestricted: reported[0].account_status === 'active'
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Submit report error:', error);
    res.status(500).json({ 
      error: 'Failed to submit report',
      message: error.message 
    });
  } finally {
    connection.release();
  }
};

const suspendUserTemporarily = async (req, res) => {
  try {
    const { userId } = req.body;

    console.log('\n=== SUSPEND TEMPORARILY ===');
    console.log('User ID to suspend:', userId);

    const [users] = await db.query(
      'SELECT account_status FROM students WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (users[0].account_status === 'permanently_suspended') {
      return res.status(400).json({ error: 'User is already permanently suspended' });
    }

    await db.query(
      `UPDATE students SET account_status = 'suspended' WHERE user_id = ?`,
      [userId]
    );

    console.log('✅ User suspended temporarily');
    console.log('=== END SUSPEND ===\n');

    res.json({
      success: true,
      message: 'User account temporarily suspended',
      userId,
      status: 'suspended'
    });

  } catch (error) {
    console.error('❌ Suspend user error:', error);
    res.status(500).json({ error: 'Failed to suspend account' });
  }
};

const suspendUserPermanently = async (req, res) => {
  try {
    const { userId } = req.body;

    console.log('\n=== SUSPEND PERMANENTLY ===');
    console.log('User ID to ban:', userId);

    const [users] = await db.query(
      'SELECT account_status FROM students WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.query(
      `UPDATE students SET account_status = 'permanently_suspended' WHERE user_id = ?`,
      [userId]
    );

    console.log('✅ User permanently suspended');
    console.log('=== END PERMANENT SUSPEND ===\n');

    res.json({
      success: true,
      message: 'User account permanently suspended',
      userId,
      status: 'permanently_suspended'
    });

  } catch (error) {
    console.error('❌ Permanent suspend error:', error);
    res.status(500).json({ error: 'Failed to permanently suspend account' });
  }
};

const reinstateUser = async (req, res) => {
  try {
    const { userId } = req.body;

    console.log('\n=== REINSTATE USER ===');
    console.log('User ID to reinstate:', userId);

    const [users] = await db.query(
      'SELECT account_status FROM students WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentStatus = users[0].account_status;
    console.log('Current status:', currentStatus);

    // Allow reinstate for 'suspended' AND 'restricted'
    if (currentStatus !== 'suspended' && currentStatus !== 'restricted') {
      return res.status(400).json({ 
        error: `Cannot reinstate. Current status: ${currentStatus}`
      });
    }

    await db.query(
      `UPDATE students SET account_status = 'active' WHERE user_id = ?`,
      [userId]
    );

    console.log('✅ User reinstated to active');
    console.log('=== END REINSTATE ===\n');

    res.json({
      success: true,
      message: 'User reinstated to active status',
      userId,
      status: 'active'
    });

  } catch (error) {
    console.error('❌ Reinstate error:', error);
    res.status(500).json({ error: 'Failed to reinstate account' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    console.log('\n=== GET ALL USERS ===');
    
    const query = `
      SELECT 
        u.id, 
        u.email, 
        s.name, 
        s.matric, 
        s.account_status, 
        s.email_verified,
        s.verification_status,
        s.profile_image,
        (SELECT COUNT(*) FROM user_reports WHERE reported_user_id = u.id) as report_count,
        (SELECT MAX(created_at) FROM user_reports WHERE reported_user_id = u.id) as last_reported,
        (SELECT reason FROM user_reports WHERE reported_user_id = u.id ORDER BY created_at DESC LIMIT 1) as latest_reason
      FROM user u
      JOIN students s ON u.id = s.user_id
      WHERE u.user_type = 'student'
      ORDER BY 
        CASE 
          WHEN s.account_status = 'permanently_suspended' THEN 1
          WHEN s.account_status = 'suspended' THEN 2
          WHEN s.account_status = 'restricted' THEN 3
          WHEN s.account_status = 'active' THEN 4
          ELSE 5
        END,
        COALESCE(last_reported, u.id) DESC
    `;

    const [users] = await db.query(query);
    console.log(`Found ${users.length} total users`);

    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name || 'No Name',
      matric: u.matric,
      accountStatus: u.account_status || 'active',
      emailVerified: Boolean(u.email_verified),
      verificationStatus: u.verification_status || 'pending',
      profilePicture: u.profile_image,
      reportCount: parseInt(u.report_count) || 0,
      lastReported: u.last_reported,
      reportReason: u.latest_reason || 'No reason provided'
    }));

    console.log(`Returning ${formattedUsers.length} users`);
    console.log('=== END GET ALL USERS ===\n');

    res.json({
      users: formattedUsers,
      total: formattedUsers.length
    });

  } catch (error) {
    console.error('❌ Get users error:', error);
    console.error('Error message:', error.message);
    res.status(500).json({ 
      error: 'Failed to load users',
      message: error.message 
    });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('\n=== GET USER DETAILS ===');
    console.log('User ID:', userId);

    const [users] = await db.query(
      `SELECT u.id, u.email, u.user_type, u.created_at,
              s.name, s.matric, s.account_status, s.email_verified,
              s.verification_status, s.phone, s.address
       FROM user u
       LEFT JOIN students s ON u.id = s.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User found:', users[0]);
    console.log('=== END GET USER DETAILS ===\n');

    res.json({
      ...users[0],
      accountStatus: users[0].account_status || 'active'
    });
  } catch (error) {
    console.error('❌ Get user details error:', error);
    res.status(500).json({ error: 'Failed to load user details' });
  }
};

const getUserReports = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('\n=== GET USER REPORTS ===');
    console.log('User ID:', userId);

    // First check if user exists
    const [userCheck] = await db.query(
      'SELECT id FROM user WHERE id = ?',
      [userId]
    );

    if (userCheck.length === 0) {
      console.log('❌ User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    const [reports] = await db.query(
      `SELECT r.*, 
              reporter.email as reporterEmail,
              s.name as reporterName,
              s.matric as reporterMatric
       FROM user_reports r
       JOIN user reporter ON r.reporter_id = reporter.id
       LEFT JOIN students s ON reporter.id = s.user_id
       WHERE r.reported_user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    console.log(`Found ${reports.length} reports for user ${userId}`);

    if (reports.length === 0) {
      console.log('✅ No reports found for this user');
      console.log('=== END GET USER REPORTS ===\n');
      return res.json({ reports: [] });
    }

    const formattedReports = reports.map(report => {
      const formatted = {
        id: report.id,
        reason: report.reason,
        description: report.description,
        createdAt: report.created_at,
        reporterEmail: report.reporterEmail,
        reporterName: report.reporterName || 'Unknown',
        reporterMatric: report.reporterMatric || report.reporter_matric || 'N/A',
        evidence: []
      };

      // Add evidence if exists
      if (report.evidence_path) {
        formatted.evidence.push({
          filePath: report.evidence_path,
          fileType: report.evidence_type
        });
      }

      console.log(`Report ${report.id}:`, {
        reason: report.reason,
        reporter: report.reporterEmail,
        hasEvidence: !!report.evidence_path
      });

      return formatted;
    });

    console.log(`Returning ${formattedReports.length} formatted reports`);
    console.log('=== END GET USER REPORTS ===\n');

    res.json({ 
      reports: formattedReports,
      total: formattedReports.length
    });
  } catch (error) {
    console.error('❌ Get user reports error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: 'Failed to load reports',
      message: error.message 
    });
  }
};

const getReportDetails = async (req, res) => {
  try {
    const { reportId } = req.params;

    const [reports] = await db.query(
      `SELECT r.*, 
              reporter.email as reporter_email,
              reported.email as reported_email,
              s.name as reported_name,
              s.matric, s.account_status
       FROM user_reports r
       JOIN user reporter ON r.reporter_id = reporter.id
       JOIN user reported ON r.reported_user_id = reported.id
       LEFT JOIN students s ON reported.id = s.user_id
       WHERE r.id = ?`,
      [reportId]
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reports[0];

    res.json({
      report: {
        id: report.id,
        reason: report.reason,
        description: report.description,
        createdAt: report.created_at,
        reporter: {
          email: report.reporter_email,
          matric: report.reporter_matric
        },
        reportedUser: {
          id: report.reported_user_id,
          email: report.reported_email,
          name: report.reported_name,
          matric: report.matric,
          accountStatus: report.account_status
        }
      },
      evidence: report.evidence_path ? [{
        filePath: report.evidence_path,
        fileType: report.evidence_type
      }] : []
    });

  } catch (error) {
    console.error('Get report details error:', error);
    res.status(500).json({ error: 'Failed to load report details' });
  }
};

module.exports = {
  checkUserRestrictions,
  submitUserReport,  // NEW: Auto-restrict endpoint
  suspendUserTemporarily,
  suspendUserPermanently,
  reinstateUser,
  getReportDetails,
  getAllUsers,
  getUserDetails,
  getUserReports
};