const db = require('../config/db');

exports.getFlaggedSubmissions = async (req, res) => {
  try {
    const [submissions] = await db.query(
      `SELECT 
        vs.id,
        vs.user_id,
        vs.file_path,
        vs.extracted_matric,
        vs.status,
        vs.reason,
        vs.auto_match_success,
        vs.created_at,
        u.email,
        s.matric,
        s.name,
        s.degree_type,
        s.faculty_code
       FROM verification_submissions vs
       JOIN user u ON vs.user_id = u.id
       JOIN students s ON u.id = s.user_id
       WHERE vs.status IN ('pending', 'flagged')
       ORDER BY 
         CASE 
           WHEN vs.auto_match_success = 1 THEN 0
           WHEN vs.status = 'flagged' THEN 1 
           WHEN vs.status = 'pending' THEN 2 
         END,
         vs.created_at ASC`
    );

    res.json(submissions);

  } catch (error) {
    console.error('Get flagged submissions error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get submissions' 
    });
  }
};

exports.approveSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const [submissions] = await db.query(
      'SELECT user_id FROM verification_submissions WHERE id = ?',
      [id]
    );

    if (submissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const userId = submissions[0].user_id;

    await db.query(
      `UPDATE verification_submissions 
       SET status = 'verified',
           reviewed_by = ?,
           reviewed_at = NOW()
       WHERE id = ?`,
      [adminId, id]
    );

    await db.query(
      `UPDATE students 
       SET verification_status = 'verified' 
       WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Submission approved successfully'
    });

  } catch (error) {
    console.error('Approve submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve submission'
    });
  }
};

exports.rejectSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const [submissions] = await db.query(
      'SELECT user_id, reason FROM verification_submissions WHERE id = ?',
      [id]
    );

    if (submissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const userId = submissions[0].user_id;
    const existingReason = submissions[0].reason;

    await db.query(
      `UPDATE verification_submissions 
       SET status = 'rejected',
           reviewed_by = ?,
           reviewed_at = NOW()
       WHERE id = ?`,
      [adminId, id]
    );

    await db.query(
      `UPDATE students 
       SET verification_status = 'rejected' 
       WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Submission rejected'
    });

  } catch (error) {
    console.error('Reject submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject submission'
    });
  }
};

exports.flagSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    await db.query(
      `UPDATE verification_submissions 
       SET status = 'flagged',
           reason = ?,
           reviewed_by = ?,
           reviewed_at = NOW()
       WHERE id = ?`,
      [reason || 'Flagged for review', adminId, id]
    );

    res.json({
      success: true,
      message: 'Submission flagged for review'
    });

  } catch (error) {
    console.error('Flag submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to flag submission'
    });
  }
};

//get all submissions with filtering, searching, pagination, and stats
exports.getAllSubmissions = async (req, res) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;
    
    let whereClause = "vs.status IN ('verified', 'rejected')";
    const params = [];
   
    if (status && status !== 'all') {
      whereClause += ' AND vs.status = ?';
      params.push(status);
    }
    
    if (search) {
      whereClause += ' AND (s.matric LIKE ? OR u.email LIKE ? OR s.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const [submissions] = await db.query(
      `SELECT 
        vs.id,
        vs.user_id,
        vs.file_path,
        vs.extracted_matric,
        vs.status,
        vs.reason,
        vs.auto_match_success,
        vs.created_at,
        vs.reviewed_at,
        vs.reviewed_by,
        u.email,
        s.matric,
        s.name,
        s.degree_type,
        s.faculty_code,
        admin.email as reviewer_email
       FROM verification_submissions vs
       JOIN user u ON vs.user_id = u.id
       JOIN students s ON u.id = s.user_id
       LEFT JOIN user admin ON vs.reviewed_by = admin.id
       WHERE ${whereClause}
       ORDER BY 
         CASE 
           WHEN vs.status = 'pending' THEN 0
           WHEN vs.status = 'flagged' THEN 1
           WHEN vs.status = 'verified' THEN 2
           WHEN vs.status = 'rejected' THEN 3
         END,
         vs.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    let statsWhereClause = status && status !== 'all' 
      ? 'status = ?' 
      : "status IN ('verified', 'rejected')";
    
    let statsParams = status && status !== 'all' ? [status] : [];

    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
       FROM verification_submissions
       WHERE ${statsWhereClause}`,
      statsParams
    );

    res.json({
      success: true,
      data: submissions,
      stats: {
        total: parseInt(stats[0].total) || 0,
        verified: parseInt(stats[0].verified) || 0,
        rejected: parseInt(stats[0].rejected) || 0,
    },
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: submissions.length
      }
    });

  } catch (error) {
    console.error('Get all submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get submissions'
    });
  }
};

// get student verification history
exports.getStudentHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [history] = await db.query(
      `SELECT 
        vs.id,
        vs.file_path,
        vs.extracted_matric,
        vs.status,
        vs.reason,
        vs.auto_match_success,
        vs.created_at,
        vs.reviewed_at,
        admin.email as reviewer_email
       FROM verification_submissions vs
       LEFT JOIN user admin ON vs.reviewed_by = admin.id
       WHERE vs.user_id = ?
       ORDER BY vs.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Get student history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student history'
    });
  }
};