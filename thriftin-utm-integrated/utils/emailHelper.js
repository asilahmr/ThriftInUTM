const emailHelper = {
  sendEmail: async (to, subject, body) => {
    // In production, use nodemailer or SendGrid
    console.log('Email would be sent:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Body:', body);
    
    // Example with nodemailer (uncomment when configured):
    /*
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: body
    });
    */
  },

  sendWelcomeEmail: async (userEmail, username) => {
    const subject = 'Welcome to ThriftIn!';
    const body = `
      <h1>Welcome to ThriftIn, ${username}!</h1>
      <p>Thank you for joining UTM's premier textbook marketplace.</p>
      <p>Get started by:</p>
      <ul>
        <li>Browsing available textbooks</li>
        <li>Listing your textbooks for sale</li>
        <li>Connecting with other students</li>
      </ul>
      <p>Happy trading!</p>
    `;
    
    await emailHelper.sendEmail(userEmail, subject, body);
  },

  sendNotificationEmail: async (userEmail, notificationTitle, notificationMessage) => {
    const subject = `ThriftIn: ${notificationTitle}`;
    const body = `
      <h2>${notificationTitle}</h2>
      <p>${notificationMessage}</p>
      <p><a href="https://thriftin.utm.my">View in ThriftIn</a></p>
    `;
    
    await emailHelper.sendEmail(userEmail, subject, body);
  },

  sendSupportTicketEmail: async (userEmail, ticketNumber) => {
    const subject = `Support Ticket ${ticketNumber} Created`;
    const body = `
      <h2>Your support ticket has been created</h2>
      <p>Ticket Number: ${ticketNumber}</p>
      <p>We'll respond within 24 hours.</p>
      <p>You can track your ticket in the Help Center.</p>
    `;
    
    await emailHelper.sendEmail(userEmail, subject, body);
  }
};

module.exports = emailHelper;