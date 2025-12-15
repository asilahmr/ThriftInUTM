const nodemailer = require('nodemailer');
const mysql = require('mysql2');

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "admin123",
  database: "thriftin_utm",
  waitForConnections: true, 
  connectionLimit: 10,  
  queueLimit: 0        
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'angiewongsiaw@graduate.utm.my',
    pass: 'ojit yekm jlpr jeit'
  }
});

exports.sendVerificationEmail = async (email, token) => {
  const verificationLink = `http://10.198.209.113:3000/api/email/verify?token=${token}`;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #c85959;">Welcome to Thriftin UTM!</h2>
      <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
      <a href="${verificationLink}" 
         style="display: inline-block; background-color: #c85959; color: white; 
                padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Verify Email
      </a>
      <p>Or copy this link: <br><a href="${verificationLink}">${verificationLink}</a></p>
      <p style="color: #666; font-size: 12px;">This link will expire in 1 hour.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"Thriftin UTM" <angiewongsiaw@graduate.utm.my>',
      to: email,
      subject: 'Verify Your Email - Thriftin UTM',
      html: emailHtml
    });
    console.log('Verification email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    console.log('=== EMAIL VERIFICATION REQUEST ===');
    console.log('Token received:', token);

    if (!token) {
      console.log('No token provided');
      return res.status(400).send(`
        <html><body style="text-align:center; padding:50px; font-family: Arial;">
          <h2>Invalid verification link</h2>
          <p>No verification token provided.</p>
        </body></html>
      `);
    }

    db.query(
      `SELECT s.user_id, s.email_verified, s.email_code_expiry, u.email 
       FROM students s
       JOIN user u ON s.user_id = u.id
       WHERE s.email_verification_code = ?`,
      [token],
      (err, students) => {
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).send(`
            <html><body style="text-align:center; padding:50px; font-family: Arial;">
              <h2>Verification failed</h2>
              <p>Database error occurred.</p>
            </body></html>
          `);
        }

        console.log('Query result:', students);

        if (students.length === 0) {
          console.log('Token not found in database');
          return res.status(400).send(`
            <html><body style="text-align:center; padding:50px; font-family: Arial;">
              <h2>Invalid verification link</h2>
              <p>This verification link is invalid or has already been used.</p>
            </body></html>
          `);
        }

        const student = students[0];
        console.log('Student found:', student.email);
        console.log('Already verified:', student.email_verified);
        console.log('Expiry time:', student.email_code_expiry);
        console.log('Current time:', new Date());

        if (student.email_verified === 1) {
          console.log('Email already verified');
          return res.status(400).send(`
            <html><body style="text-align:center; padding:50px; font-family: Arial;">
              <h2>Email already verified</h2>
              <p>Your email has already been verified. You can login now.</p>
            </body></html>
          `);
        }

        if (new Date(student.email_code_expiry) < new Date()) {
          console.log('Token expired');
          return res.status(400).send(`
            <html><body style="text-align:center; padding:50px; font-family: Arial;">
              <h2>Verification link expired</h2>
              <p>This link has expired (valid for 1 hour). Please register again or request a new verification email.</p>
            </body></html>
          `);
        }

        db.query(
          `UPDATE students 
           SET email_verified = 1, 
               email_verification_code = NULL,
               email_code_expiry = NULL
           WHERE user_id = ?`,
          [student.user_id],
          (updateErr) => {
            if (updateErr) {
              console.error('Update error:', updateErr);
              return res.status(500).send(`
                <html><body style="text-align:center; padding:50px; font-family: Arial;">
                  <h2>Verification failed</h2>
                  <p>Failed to update verification status.</p>
                </body></html>
              `);
            }

            console.log('Email verified successfully for:', student.email);

            res.send(`
              <html><body style="text-align:center; padding:50px; font-family: Arial;">
                <h2 style="color: #4CAF50;">✅ Email verified successfully!</h2>
                <p>Your email <strong>${student.email}</strong> has been verified.</p>
                <p>You can now login to your account.</p>
              </body></html>
            `);
          }
        );
      }
    );

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).send(`
      <html><body style="text-align:center; padding:50px; font-family: Arial;">
        <h2>Verification failed</h2>
        <p>An error occurred during verification. Please try again later.</p>
        <p>Error: ${error.message}</p>
      </body></html>
    `);
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('=== RESEND VERIFICATION REQUEST ===');
    console.log('Email:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    db.query(
      `SELECT u.id, u.email, s.email_verified 
       FROM user u
       JOIN students s ON u.id = s.user_id
       WHERE u.email = ? AND u.user_type = 'student'`,
      [email],
      async (err, users) => {
        if (err) {
          console.error('❌ Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Server error'
          });
        }

        if (users.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Email not found. Please register first.'
          });
        }

        const user = users[0];

        if (user.email_verified === 1) {
          return res.status(400).json({
            success: false,
            message: 'Email already verified. You can login now.'
          });
        }

        const newToken = Math.floor(100000 + Math.random() * 900000).toString();

        db.query(
          `UPDATE students 
           SET email_verification_code = ?, 
               email_code_expiry = DATE_ADD(NOW(), INTERVAL 1 HOUR)
           WHERE user_id = ?`,
          [newToken, user.id],
          async (updateErr) => {
            if (updateErr) {
              console.error('Update token error:', updateErr);
              return res.status(500).json({
                success: false,
                message: 'Failed to generate new verification link'
              });
            }

            try {
              await exports.sendVerificationEmail(email, newToken);
              console.log('Verification email resent to:', email);
              
              res.json({
                success: true,
                message: 'Verification email sent! Please check your inbox.'
              });
            } catch (emailErr) {
              console.error('Email sending error:', emailErr);
              res.status(500).json({
                success: false,
                message: 'Failed to send verification email'
              });
            }
          }
        );
      }
    );

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};