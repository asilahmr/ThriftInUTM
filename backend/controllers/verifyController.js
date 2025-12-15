const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const {Jimp} = require('jimp');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/matric-cards';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'matric-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PNG, JPG, JPEG, and PDF are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
});

exports.uploadMatricCard = upload.single('matricCard');

//Preprocess image for better OCR results
async function preprocessImage(imagePath, strategy = 'default') {
  const image = await Jimp.read(imagePath);
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  
  // Resize if too large
  const maxDimension = 2400;
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    await image.scale(scale);
    console.log(`Resized from ${width}x${height} to ${image.bitmap.width}x${image.bitmap.height}`);
  }
  
  const tempPath = imagePath.replace(path.extname(imagePath), `_${strategy}${path.extname(imagePath)}`);
  
  switch(strategy) {
    case 'original':
      await image.write(tempPath);
      break;
      
    case 'grayscale_only':
      await image
        .greyscale()
        .write(tempPath);
      break;
      
    case 'light':
      await image
        .greyscale()
        .contrast(0.3)
        .write(tempPath);
      break;
      
    case 'balanced':
      await image
        .greyscale()
        .normalize()
        .contrast(0.4)
        .write(tempPath);
      break;
      
    case 'enhanced':
      await image
        .greyscale()
        .normalize()
        .contrast(0.6)
        .brightness(0.05)
        .write(tempPath);
      break;
      
    case 'high_contrast':
      await image
        .greyscale()
        .normalize()
        .contrast(0.8)
        .brightness(0.1)
        .write(tempPath);
      break;
      
    case 'sharp':
      await image
        .greyscale()
        .normalize()
        .convolute([
          [-1, -1, -1],
          [-1, 9, -1],
          [-1, -1, -1]
        ])
        .write(tempPath);
      break;
      
    default:
      await image
        .greyscale()
        .normalize()
        .write(tempPath);
  }
  
  return tempPath;
}

async function performOCR(imagePath) {
  try {
    console.log('\n=== MULTI-STRATEGY OCR ===');
    console.log('Processing:', imagePath);
    
    //multiple preprocessing strategies
    const strategies = [
      { name: 'grayscale_only', psm: '6' },
      { name: 'balanced', psm: '6' },
      { name: 'enhanced', psm: '6' },
      { name: 'balanced', psm: '11' },
      { name: 'enhanced', psm: '11' },
      { name: 'high_contrast', psm: '6' },
      { name: 'sharp', psm: '6' },
    ];
    
    const allTexts = [];
    
    for (let i = 0; i < strategies.length; i++) {
      const { name, psm } = strategies[i];
      try {
        console.log(`\n[${i+1}/${strategies.length}] Strategy: ${name}, PSM: ${psm}`);
        
        const processedPath = await preprocessImage(imagePath, name);
        
        const { data: { text, confidence } } = await Tesseract.recognize(
          processedPath,
          'eng',
          {
            logger: (m) => {
              if (m.status === 'recognizing text' && m.progress === 1) {
                console.log(`  ✓ OCR Complete (${name}-${psm})`);
              }
            },
            tessedit_pageseg_mode: psm,
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
          }
        );
        
        if (fs.existsSync(processedPath)) {
          fs.unlinkSync(processedPath);
        }
        
        if (text && text.trim().length > 10) {
          allTexts.push({
            strategy: `${name}-${psm}`,
            text: text.trim(),
            confidence: confidence || 0
          });
          console.log(`  Text length: ${text.trim().length} chars, Confidence: ${confidence?.toFixed(1) || 'N/A'}%`);
        }
      } catch (error) {
        console.error(`  ✗ Strategy ${name}-${psm} failed:`, error.message);
      }
    }
    
    console.log(`\n=== Collected ${allTexts.length} text results ===`);
    return allTexts;
  } catch (error) {
    console.error('OCR Error:', error);
    return [];
  }
}

function extractMatricFromText(text) {
  if (!text) return null;
  
  const cleanText = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  
  // UTM Matric patterns
  const patterns = [
    // Foundation: F23SP1234
    { 
      regex: /F\d{2}SP\d{4}/gi, 
      name: 'Foundation',
      length: 9
    },
    
    // Bachelor: A23CS1234 
    { 
      regex: /A\d{2}[A-Z]{2}\d{4}/gi, 
      name: 'Bachelor',
      length: 9
    },
    
    // Master: MCS221234
    { 
      regex: /M[A-Z]{2}\d{6}/gi, 
      name: 'Master',
      length: 9
    },
    
    // PhD: PCS221234
    { 
      regex: /P[A-Z]{2}\d{6}/gi, 
      name: 'PhD',
      length: 9
    },
  ];
  
  // match against patterns
  for (const pattern of patterns) {
    const matches = cleanText.match(pattern.regex);
    if (matches && matches.length > 0) {
      for (let match of matches) {
        match = match.toUpperCase();
        
        if (pattern.clean) {
          match = pattern.clean(match);
        }

        if (pattern.length && match.length !== pattern.length) {
          continue;
        }
        
        if (isValidMatricFormat(match)) {
          console.log(`  ✓ Found: ${match} (${pattern.name})`);
          return match;
        }
      }
    }
  }
  
  return null;
}

function isValidMatricFormat(matric) {
  if (!matric || matric.length !== 9) return false;
  
  const patterns = [
    /^F\d{2}SP\d{4}$/i,
    /^A\d{2}[A-Z]{2}\d{4}$/i,
    /^M[A-Z]{2}\d{6}$/i,
    /^P[A-Z]{2}\d{6}$/i,
  ];
  
  return patterns.some(pattern => pattern.test(matric));
}

exports.extractMatricNumber = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image provided'
      });
    }

    const filePath = req.file.path;
    let extractedMatric = null;

    console.log('\n========================================');
    console.log('MATRIC NUMBER EXTRACTION');
    console.log('========================================');
    console.log('File:', filePath);

    if (req.file.mimetype.startsWith('image/')) {
      const allTexts = await performOCR(filePath);
      
      if (allTexts.length === 0) {
        console.log('\n✗ OCR failed to extract any text');
      } else {
        console.log('\n=== ANALYZING RESULTS ===');
        
        // for each OCR result, try to extract matric
        for (let i = 0; i < allTexts.length; i++) {
          const { strategy, text } = allTexts[i];
          console.log(`\n[Result ${i+1}/${allTexts.length}] Strategy: ${strategy}`);
          
          const matric = extractMatricFromText(text);
          if (matric) {
            extractedMatric = matric;
            console.log(`✓✓✓ SUCCESS! Extracted: ${matric}`);
            break;
          }
        }
        
        // combined text attempt
        if (!extractedMatric) {
          console.log('\n=== TRYING COMBINED TEXT ===');
          const combinedText = allTexts.map(t => t.text).join(' ');
          extractedMatric = extractMatricFromText(combinedText);
          
          if (extractedMatric) {
            console.log(`✓ Found in combined text: ${extractedMatric}`);
          }
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'PDF extraction not supported. Please upload JPG/PNG image.'
      });
    }

    console.log('\n========================================');
    console.log('FINAL RESULT:', extractedMatric || 'NONE');
    console.log('Valid:', extractedMatric ? '✓' : '✗');
    console.log('========================================\n');

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      extractedMatric: extractedMatric,
      isValid: extractedMatric ? isValidMatricFormat(extractedMatric) : false,
      message: extractedMatric 
        ? 'Matric number extracted successfully' 
        : 'Could not extract matric number. Please ensure: (1) Image is clear and well-lit, (2) Matric number is clearly visible, (3) No glare or shadows on the card'
    });

  } catch (error) {
    console.error('Extract matric error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to extract matric number'
    });
  }
};

exports.submitVerification = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No matric card image provided'
      });
    }

    const filePath = req.file.path;
    const fileStats = fs.statSync(filePath);
    const fileSizeInKB = fileStats.size / 1024;

    let status = 'pending';
    let flagReason = null;

    console.log('\n========================================');
    console.log('VERIFICATION SUBMISSION');
    console.log('========================================');
    console.log('User ID:', userId);
    console.log('File size:', fileSizeInKB.toFixed(2), 'KB');

    const [existingSubmissions] = await db.query(
      `SELECT * FROM verification_submissions 
       WHERE user_id = ? AND status IN ('pending', 'flagged')`,
      [userId]
    );

    if (existingSubmissions.length > 0) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      return res.status(400).json({
        success: false,
        message: 'You already have a pending verification request'
      });
    }

    // get registered matric
    const [students] = await db.query(
      'SELECT matric FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(404).json({
        success: false,
        message: 'Student record not found'
      });
    }

    const registeredMatric = students[0].matric;
    console.log('Registered Matric:', registeredMatric);

    let extractedMatric = null;
    
    if (req.file.mimetype.startsWith('image/')) {
      const allTexts = await performOCR(filePath);
      
      for (const { strategy, text } of allTexts) {
        const matric = extractMatricFromText(text);
        if (matric) {
          extractedMatric = matric;
          console.log(`✓ Extracted: ${matric} (${strategy})`);
          break;
        }
      }
      
      if (!extractedMatric && allTexts.length > 0) {
        const combinedText = allTexts.map(t => t.text).join(' ');
        extractedMatric = extractMatricFromText(combinedText);
      }
    } else {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(400).json({
        success: false,
        message: 'PDF files not supported. Please upload JPG/PNG.'
      });
    }

    console.log('\n=== VALIDATION ===');
    console.log('Extracted:', extractedMatric || 'NONE');

    let autoMatchSuccess = false; 

    if (fileSizeInKB < 50) {
      status = 'flagged';
      flagReason = 'File too small (< 50KB)';
      console.log('⚠ FLAGGED: Small file');
    }

    if (!extractedMatric) {
      status = 'flagged';
      flagReason = flagReason 
        ? `${flagReason}; Cannot extract matric` 
        : 'Cannot extract matric number';
      console.log('⚠ FLAGGED: No extraction');
    } else {
      if (!isValidMatricFormat(extractedMatric)) {
        status = 'flagged';
        flagReason = flagReason 
          ? `${flagReason}; Invalid format: ${extractedMatric}`
          : `Invalid format: ${extractedMatric}`;
        console.log('⚠ FLAGGED: Invalid format');
      } else {
        const cleanExtracted = extractedMatric.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        const cleanRegistered = registeredMatric.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        
        if (cleanExtracted !== cleanRegistered) {
          status = 'flagged';
          flagReason = `Mismatch: Registered=${registeredMatric}, Extracted=${extractedMatric}`;
          console.log('⚠ FLAGGED: Mismatch');
          console.log('  Registered:', cleanRegistered);
          console.log('  Extracted:', cleanExtracted);
        } else {
          autoMatchSuccess = true;
          console.log('✓ AUTO-MATCH SUCCESS - Pending manual review');
        }
      }
    }

    // Insert into database with auto_match_success field
    await db.query(
      `INSERT INTO verification_submissions 
       (user_id, file_path, extracted_matric, status, reason, auto_match_success, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, filePath, extractedMatric, status, flagReason, autoMatchSuccess ? 1 : 0]
    );

    await db.query(
      `UPDATE students 
       SET matric_card_path = ?, verification_status = ? 
       WHERE user_id = ?`,
      [filePath, status, userId]
    );

    console.log('\n========================================');
    console.log('SUBMISSION RESULT');
    console.log('Status:', status);
    console.log('Auto-match:', autoMatchSuccess ? 'YES' : 'NO');
    console.log('Reason:', flagReason || 'None');
    console.log('========================================\n');

    res.json({
      success: true,
      message: autoMatchSuccess
        ? 'Matric matched! Submitted for verification.'
        : status === 'flagged' 
          ? 'Flagged for manual review' 
          : 'Verification submitted successfully',
      data: {
        status: status,
        reason: flagReason,
        extractedMatric: extractedMatric,
        autoMatchSuccess: autoMatchSuccess,
        matricCardPath: filePath
      }
    });

  } catch (error) {
    console.error('Submit verification error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to submit verification'
    });
  }
};

exports.getPendingVerifications = async (req, res) => {
  try {
    const [verifications] = await db.query(
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

    const stats = {
      total: verifications.length,
      auto_matched: verifications.filter(v => v.auto_match_success === 1).length,
      flagged: verifications.filter(v => v.status === 'flagged').length,
      pending_other: verifications.filter(v => v.status === 'pending' && v.auto_match_success === 0).length
    };

    res.json({
      success: true,
      data: verifications,
      stats: stats  
    });

  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verifications'
    });
  }
};

exports.flagVerification = async (req, res) => {
  try {
    const { submissionId, reason } = req.body;
    const adminId = req.user.id;

    await db.query(
      `UPDATE verification_submissions 
       SET status = 'flagged', 
           reason = ?,
           reviewed_by = ?,
           reviewed_at = NOW()
       WHERE id = ?`,
      [reason, adminId, submissionId]
    );

    res.json({
      success: true,
      message: 'Verification flagged'
    });

  } catch (error) {
    console.error('Flag verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to flag verification'
    });
  }
};

exports.approveVerification = async (req, res) => {
  try {
    const { submissionId } = req.body;
    const adminId = req.user.id;

    const [submissions] = await db.query(
      'SELECT user_id FROM verification_submissions WHERE id = ?',
      [submissionId]
    );

    if (submissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Verification submission not found'
      });
    }

    const userId = submissions[0].user_id;

    await db.query(
      `UPDATE verification_submissions 
       SET status = 'verified',
           reviewed_by = ?,
           reviewed_at = NOW()
       WHERE id = ?`,
      [adminId, submissionId]
    );

    await db.query(
      `UPDATE students 
       SET verification_status = 'verified' 
       WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Verification approved'
    });

  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve verification'
    });
  }
};

exports.rejectVerification = async (req, res) => {
  try {
    const { submissionId, reason } = req.body;
    const adminId = req.user.id;

    const [submissions] = await db.query(
      'SELECT user_id FROM verification_submissions WHERE id = ?',
      [submissionId]
    );

    if (submissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Verification submission not found'
      });
    }

    const userId = submissions[0].user_id;

    await db.query(
      `UPDATE verification_submissions 
       SET status = 'rejected',
           reason = ?,
           reviewed_by = ?,
           reviewed_at = NOW()
       WHERE id = ?`,
      [reason, adminId, submissionId]
    );

    await db.query(
      `UPDATE students 
       SET verification_status = 'rejected' 
       WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Verification rejected'
    });

  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject verification'
    });
  }
};