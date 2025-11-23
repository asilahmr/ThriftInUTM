const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database connection
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "thriftin_utm",
  waitForConnections: true, 
  connectionLimit: 10,  
  queueLimit: 0        
});

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: 'angiewongsiaw@graduate.utm.my', 
    pass: 'ojit yekm jlpr jeit' 
  }
});

// Helper function: parse matric number
function parseMatricNumber(matric) {
  let regex;
  let degreeCode, yearCode, facultyCode, studentNumber;

  // Foundation: F23SP1234
  if (matric.startsWith('F')) {
    regex = /^(F)(\d{2})SP(\d{4})$/i;
    const match = matric.toUpperCase().match(regex);
    if (!match) return null;
    
    [, degreeCode, yearCode, , studentNumber] = match;
    facultyCode = 'SP'; // Foundation special code
  }
  // Bachelor/Degree: A23CS1234
  else if (matric.startsWith('A')) {
    regex = /^(A)(\d{2})([A-Z]{2})(\d{4})$/i;
    const match = matric.toUpperCase().match(regex);
    if (!match) return null;
    
    [, degreeCode, yearCode, facultyCode, studentNumber] = match;
  }
  // Master: MCS221234
  else if (matric.startsWith('M')) {
    regex = /^(M)([A-Z]{2})(\d{2})(\d{4})$/i;
    const match = matric.toUpperCase().match(regex);
    if (!match) return null;
    
    [, degreeCode, facultyCode, yearCode, studentNumber] = match;
  }
  // PhD: PCS221234
  else if (matric.startsWith('P')) {
    regex = /^(P)([A-Z]{2})(\d{2})(\d{4})$/i;
    const match = matric.toUpperCase().match(regex);
    if (!match) return null;
    
    [, degreeCode, facultyCode, yearCode, studentNumber] = match;

  }
  else {
    return null;
  }

  let enrollmentYear = parseInt(yearCode);
  enrollmentYear = (enrollmentYear >= 0 && enrollmentYear <= 50) ? enrollmentYear + 2000 : enrollmentYear + 1900;

  let degreeType, studyDuration;
  switch(degreeCode) {
    case 'F': degreeType = 'Foundation'; studyDuration = 1; break;
    case 'A': degreeType = 'Bachelor'; studyDuration = 4; break;
    case 'M': degreeType = 'Master'; studyDuration = 2; break;
    case 'P': degreeType = 'PhD'; studyDuration = 5; break;
    default: return null;
  }

  return { degreeType, enrollmentYear, studyDuration, facultyCode, studentNumber };
}

// Helper function: validate student status
function validateStudentStatus(matricInfo) {
  const currentYear = new Date().getFullYear();
  const estimatedGraduationYear = matricInfo.enrollmentYear + matricInfo.studyDuration;
  return currentYear <= estimatedGraduationYear + 1;
}

// Helper function: validate password strength
function validatePassword(password) {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

// Helper function: validate UTM email
function validateUTMEmail(email) {
  const utmEmailRegex = /^[a-zA-Z0-9._%+-]+@graduate\.utm\.my$/i;
  return utmEmailRegex.test(email);
}

// Helper function: check if account is locked
function isAccountLocked(user) {
  if (!user.locked_until) return false;
  const now = new Date();
  return new Date(user.locked_until) > now;
}

// Helper function: send email
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: '"Thriftin UTM" <your-email@gmail.com>',
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

// UC001: Register Account
app.post("/register", async (req, res) => {
  const { email, matric, password } = req.body;

  if (email.endsWith("@gmail.com")) {
    return res.status(400).json({ message: "Please use a valid UTM student email (@graduate.utm.my). Admin accounts cannot register." });
  }

  // Step 1: Validate email format
  if (!validateUTMEmail(email)) {
    return res.status(400).json({ message: "Invalid email format. Please enter a valid UTM email." });
  }

  // Step 2: Parse matric number and validate format
  const matricInfo = parseMatricNumber(matric);
  if (!matricInfo) {
    return res.status(400).json({ message: "Invalid matric number format. Please enter a valid matric number." });
  }

  // Step 3: Validate password format
  if (!validatePassword(password)) {
    return res.status(400).json({ message: "Password must be at least 8 characters long and contain letters and numbers." });
  }

  // Step 4: Validate student status
  if (!validateStudentStatus(matricInfo)) {
    return res.status(403).json({ message: "Your student status cannot be verified. Only current UTM students or graduates within one year are allowed to register." });
  }

  // Step 5: Check if email or matric number is already registered
  const checkEmailSql = "SELECT * FROM user WHERE email = ?";
  const checkMatricSql = "SELECT * FROM students WHERE matric = ?";
  
  db.query(checkEmailSql, [email], async (err, emailResults) => {
    if (err) {
      console.error('Database error during registration check:', err);
      return res.status(500).json({ message: "Database error occurred during registration check." });
    }

    if (emailResults.length > 0) {
      return res.status(400).json({ message: "This email or matric number is already registered. Please log in." });
    }

    db.query(checkMatricSql, [matric], async (err, matricResults) => {
      if (err) {
        console.error('Database error during registration check:', err);
        return res.status(500).json({ message: "Database error occurred during registration check." });
      }

      if (matricResults.length > 0) {
        return res.status(400).json({ message: "This email or matric number is already registered. Please log in." });
      }

      // Step 6: Hash password and store user in database
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const estimatedGraduationYear = matricInfo.enrollmentYear + matricInfo.studyDuration;

        const insertUserSql = `
          INSERT INTO user 
          (email, password, user_type) 
          VALUES (?, ?, 'student')
        `;
        
        db.query(insertUserSql, [email, hashedPassword], (err, userResult) => {
          if (err) {
            console.error('Database error during registration insert:', err);
            return res.status(500).json({ message: "Registration failed. Please try again." });
          }
          
          const userId = userResult.insertId;

          const insertStudentSql = `
            INSERT INTO students 
            (user_id, matric, degree_type, faculty_code, enrollment_year, estimated_graduation_year) 
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          
          db.query(insertStudentSql, [
            userId,
            matric,
            matricInfo.degreeType,
            matricInfo.facultyCode,
            matricInfo.enrollmentYear,
            estimatedGraduationYear
          ], (err) => {
            if (err) {
              console.error('Database error during registration insert:', err);
              db.query("DELETE FROM user WHERE id = ?", [userId]);
              return res.status(500).json({ message: "Registration failed. Please try again." });
            }
            
            res.json({ message: "Your account has been created successfully. You can now log in." });
          });
        });
      } catch (error) {
        console.error('Error hashing password or inserting user:', error);
        return res.status(500).json({ message: "An unexpected error occurred during registration. Please try again." });
      }
    });
  });
});

// UC002: Login Account - Unified for Admin and Student
app.post("/login", async (req, res) => {
  console.log("\n=== LOGIN REQUEST RECEIVED ===");
  console.log("Time:", new Date().toISOString());
  console.log("IP:", req.ip);
  console.log("Body:", { email: req.body.email, password: "***" });
  
  const { email, password } = req.body;

  if (!email || !password) {
    console.log("❌ Missing email or password");
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Query user table and join with students table if user is a student
  const sql = `
    SELECT 
      u.*,
      s.matric,
      s.degree_type,
      s.faculty_code,
      s.enrollment_year,
      s.estimated_graduation_year
    FROM user u
    LEFT JOIN students s ON u.id = s.user_id
    WHERE u.email = ?
  `;
  
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("❌ Database error during login:", err);
      return res.status(500).json({ message: "Server error. Please try again later." });
    }

    console.log(`Database query executed for: ${email}`);
    console.log(`Results found: ${results.length}`);

    if (results.length === 0) {
      console.log(`❌ User not found: ${email}`);
      
      // Log failed attempt (no user_id available)
      const logSql = "INSERT INTO login_attempts (email, success, ip_address) VALUES (?, false, ?)";
      db.query(logSql, [email, req.ip], (logErr) => {
        if (logErr) console.error("Error logging attempt:", logErr);
      });
      
      return res.status(400).json({ message: "Incorrect email or password." });
    }

    const user = results[0];
    console.log(`✓ User found: ${user.email}`);
    console.log(`User type: ${user.user_type}`);
    console.log(`Failed attempts: ${user.failed_login_attempts}`);

    // Check if account is locked
    if (isAccountLocked(user)) {
      console.log(`🔒 Account locked: ${user.email}`);
      const lockExpiry = new Date(user.locked_until);
      const remainingMinutes = Math.ceil((lockExpiry - new Date()) / 60000);
      
      return res.status(423).json({
        message: `Your account is temporarily locked. Please try again in ${remainingMinutes} minute(s).`
      });
    }

    // Compare password
    console.log("Comparing password...");
    try {
      const match = await bcrypt.compare(password, user.password);
      console.log(`Password match: ${match}`);

      if (!match) {
        console.log(`❌ Password mismatch for: ${user.email}`);
        
        // Update failed attempts and last_failed_login
        const updateAttemptsSql = `
          UPDATE user 
          SET failed_login_attempts = failed_login_attempts + 1, 
              last_failed_login = NOW()
          WHERE id = ?`;
        db.query(updateAttemptsSql, [user.id]);

        // Log failed attempt
        const logSql = "INSERT INTO login_attempts (email, user_id, success, ip_address) VALUES (?, ?, false, ?)";
        db.query(logSql, [email, user.id, req.ip]);

        const newAttemptCount = user.failed_login_attempts + 1;
        console.log(`New attempt count: ${newAttemptCount}`);

        if (newAttemptCount >= 5) {
          console.log(`🔒 Locking account after ${newAttemptCount} attempts`);
          const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
          
          const lockSql = `
            UPDATE user 
            SET locked_until = ?, failed_login_attempts = 0
            WHERE id = ?`;
          db.query(lockSql, [lockUntil, user.id]);

          const emailHtml = `
            <h2>Account Temporarily Locked</h2>
            <p>Your account has been temporarily locked for 30 minutes due to multiple failed login attempts.</p>
            <p>If this wasn't you, please contact support immediately.</p>
            <p><strong>Account will be unlocked at:</strong> ${lockUntil.toLocaleString()}</p>`;
          
          await sendEmail(user.email, 'Account Temporarily Locked - Thriftin UTM', emailHtml);

          return res.status(423).json({
            message: "Your account has been temporarily locked for 30 minutes. Please check your email."
          });
        }

        return res.status(401).json({ message: "Incorrect email or password." });
      }

      // Password correct - reset failed attempts and update last_login
      console.log(`✓ Password correct for: ${user.email}`);
      
      const resetSql = `
        UPDATE user 
        SET failed_login_attempts = 0, 
            locked_until = NULL, 
            last_login = NOW()
        WHERE id = ?`;
      db.query(resetSql, [user.id]);

      // Log successful attempt
      const logSql = "INSERT INTO login_attempts (email, user_id, success, ip_address) VALUES (?, ?, true, ?)";
      db.query(logSql, [email, user.id, req.ip]);

      // Prepare response based on user type
      let responseData;
      
      if (user.user_type === 'student') {
        console.log(`✓ Student login successful: ${user.email}`);
        responseData = {
          message: "Student login successful",
          user: {
            id: user.id,
            email: user.email,
            matric: user.matric,
            userType: user.user_type,
            degreeType: user.degree_type,
            enrollmentYear: user.enrollment_year,
            facultyCode: user.faculty_code,
            estimatedGraduationYear: user.estimated_graduation_year
          }
        };
      } else if (user.user_type === 'admin') {
        console.log(`✓ Admin login successful: ${user.email}`);
        responseData = {
          message: "Admin login successful",
          user: {
            id: user.id,
            email: user.email,
            userType: user.user_type
          }
        };
      } else {
        console.log(`❌ Unknown user type: ${user.user_type}`);
        return res.status(400).json({ message: "Invalid user type" });
      }

      console.log("Sending response:", JSON.stringify(responseData, null, 2));
      console.log("=== LOGIN REQUEST END ===\n");
      
      return res.json(responseData);
      
    } catch (bcryptError) {
      console.error("❌ Bcrypt error:", bcryptError);
      return res.status(500).json({ message: "Authentication error" });
    }
  });
});


// UC003: Recover Password - Request Reset （send code）
app.post("/recover-password", async (req, res) => {
  const { email } = req.body;

  if (email.endsWith("@gmail.com")) {
    return res.status(400).json({ message: "Admin accounts cannot use the Forgot Password feature." });
  }

  // Step 1: Validate email format
  if (!validateUTMEmail(email)) {
    return res.status(400).json({ message: "Invalid email format. Please enter a valid UTM email." });
  }

  // Step 2: Check if email exists and get user record
  const sql = `
    SELECT u.*
    FROM user u
    INNER JOIN students s ON u.id = s.user_id
    WHERE u.email = ? AND u.user_type = 'student'
  `;
  
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Database error during password recovery:", err);
      return res.status(500).json({ message: "Server error. Please try again later." });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "The email entered is not registered." });
    }

    const user = results[0];
    
    // Step 3: Generate 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // Valid for 1 hour

    console.log(`📧 Generated reset code for ${email}: ${resetCode}`);

    // Step 4: Store reset code in students table using user_id
    const updateSql = `
      UPDATE students
      SET reset_token = ?, reset_token_expiry = ?
      WHERE user_id = ?
    `;
    
    db.query(updateSql, [resetCode, resetTokenExpiry, user.id], async (err) => {
      if (err) {
        console.error("Error storing reset code:", err);
        return res.status(500).json({ message: "Failed to generate reset code" });
      }

      // Step 5: Send verification code email
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B1A1A; margin: 0;">THRIFTIN UTM</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #666; line-height: 1.6;">
              Hello,
            </p>
            <p style="color: #666; line-height: 1.6;">
              You requested to reset your password for your Thriftin UTM account.
            </p>
            <p style="color: #666; line-height: 1.6;">
              Your verification code is:
            </p>
            
            <div style="background-color: white; padding: 20px; text-align: center; 
                        border-radius: 8px; margin: 25px 0; border: 2px dashed #8B1A1A;">
              <div style="font-size: 42px; font-weight: bold; color: #8B1A1A; 
                          letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${resetCode}
              </div>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              <strong>This code will expire in 1 hour.</strong>
            </p>
            <p style="color: #666; line-height: 1.6;">
              If you didn't request this, please ignore this email and your password will remain unchanged.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; 
                      text-align: center; color: #999; font-size: 12px;">
            <p>Thriftin UTM - UTM Student Marketplace</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      `;
      
      try {
        const emailSent = await sendEmail(email, 'Password Reset Code - Thriftin UTM', emailHtml);
        
        if (!emailSent) {
          return res.status(500).json({ message: "Failed to send reset email. Please try again." });
        }

        console.log(`Reset code sent successfully to ${email}`);
        res.json({ message: "A 6-digit verification code has been sent to your email." });
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        return res.status(500).json({ message: "Failed to send reset email. Please check your email configuration." });
      }
    });
  });
});

// UC003: Reset Password - Confirm New Password
app.post("/reset-password", async (req, res) => {
  const { email, token, newPassword } = req.body;

  // Step 1: Validate password strength
  if (!validatePassword(newPassword)) {
    return res.status(400).json({ message: "Password must be at least 8 characters long and contain letters and numbers." });
  }

  // Step 2: Check if token is valid and not expired in students table
  const sql = `
    SELECT u.*
    FROM user u
    INNER JOIN students s ON u.id = s.user_id
    WHERE u.email = ? 
    AND s.reset_token = ? 
    AND s.reset_token_expiry > NOW()
    AND u.user_type = 'student'
  `;
  
  db.query(sql, [email, token], async (err, results) => {
    if (err) {
      console.error("Database error during password reset:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
    }

    const user = results[0];

    // Step 3: Hash the new password
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Step 4: Update the user's password in user table
      const updateUserSql = `
        UPDATE user 
        SET password = ?, 
            updated_at = NOW()
        WHERE id = ?
      `;
      
      db.query(updateUserSql, [hashedPassword, user.id], (err) => {
        if (err) {
          console.error("Error updating password:", err);
          return res.status(500).json({ message: "Failed to reset password" });
        }

        // Step 5: Clear the reset token in students table using user_id
        const clearTokenSql = `
          UPDATE students
          SET reset_token = NULL, 
              reset_token_expiry = NULL
          WHERE user_id = ?
        `;
        
        db.query(clearTokenSql, [user.id], (err) => {
          if (err) {
            console.error("Error clearing reset token:", err);
            return res.status(500).json({ message: "Failed to reset password" });
          }

          console.log(`Password reset successful for user: ${email}`);
          res.json({ message: "Your password has been reset successfully. You can now log in with your new password." });
        });
      });
    } catch (hashError) {
      console.error("Error hashing new password:", hashError);
      return res.status(500).json({ message: "Failed to process new password" });
    }
  });
});

// Start the server
app.listen(3000, () => console.log("Server running on port 3000"));