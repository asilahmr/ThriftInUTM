const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

exports.uploadProfileImage = upload.single('profileImage');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const userRows = await db.query(
      `SELECT u.id, u.email, u.user_type, u.created_at,
              s.matric, s.degree_type, s.faculty_code, s.enrollment_year, 
              s.estimated_graduation_year, s.verification_status,
              s.name, s.phone, s.address, s.matric_card_path, s.profile_image
       FROM user u
       LEFT JOIN students s ON u.id = s.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        name: user.name,
        phone: user.phone,
        address: user.address,
        matric: user.matric,
        degreeType: user.degree_type,
        facultyCode: user.faculty_code,
        enrollmentYear: user.enrollment_year,
        estimatedGraduationYear: user.estimated_graduation_year,
        verificationStatus: user.verification_status,
        matricCardPath: user.matric_card_path,
        profileImage: user.profile_image,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address } = req.body;

    await db.query(
      `UPDATE students 
       SET name = ?, phone = ?, address = ?
       WHERE user_id = ?`,
      [name, phone, address, userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const [oldImage] = await db.query(
      'SELECT profile_image FROM students WHERE user_id = ?',
      [userId]
    );

    if (oldImage.length > 0 && oldImage[0].profile_image) {
      const oldImagePath = oldImage[0].profile_image;
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    const imagePath = req.file.path;
    await db.query(
      'UPDATE students SET profile_image = ? WHERE user_id = ?',
      [imagePath, userId]
    );

    res.json({
      success: true,
      message: 'Profile image updated successfully',
      data: {
        profileImage: imagePath
      }
    });
  } catch (error) {
    console.error('Update profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile image'
    });
  }
};