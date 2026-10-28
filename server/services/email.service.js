const nodemailer = require('nodemailer');
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
} = require('../config/env');

/**
 * Dynamically create Nodemailer transporter
 */
const getTransporter = () => {
  // Re-read process.env dynamically in case variables were updated without full restart
  const user = process.env.SMTP_USER || SMTP_USER;
  const pass = process.env.SMTP_PASS || SMTP_PASS;
  const host = process.env.SMTP_HOST || SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || SMTP_PORT, 10) || 587;

  if (!user || !pass) {
    return null;
  }

  // If host is explicitly specified (e.g. SendGrid, Outlook, custom mail server)
  if (host && host !== 'smtp.gmail.com') {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Default: Direct Gmail transport (requires Google App Password)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
};

/**
 * Send OTP verification email to the student's typed email address
 *
 * @param {string} email - Recipient student email
 * @param {string} otp - 6-digit verification code
 * @returns {Promise<void>}
 */
const sendOtpEmail = async (email, otp) => {
  const transporter = getTransporter();

  if (!transporter) {
    throw new Error(
      'Email service is not configured. Please add SMTP_USER and SMTP_PASS (e.g. your Gmail and 16-character App Password) in server/.env to send OTP emails to actual inboxes.'
    );
  }

  const subject = `🎓 Your Campus Auction Verification Code: ${otp}`;
  const fromAddress = process.env.EMAIL_FROM || EMAIL_FROM || `Campus Auction <${process.env.SMTP_USER || SMTP_USER}>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 24px; }
        .card { max-width: 480px; margin: 0 auto; background-color: #121216; border: 1px solid #272730; border-radius: 16px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.5); }
        .header { text-align: center; margin-bottom: 24px; }
        .logo { font-size: 32px; margin-bottom: 8px; }
        .title { color: #ffffff; font-size: 22px; font-weight: bold; margin: 0; }
        .subtitle { color: #a1a1aa; font-size: 13px; margin-top: 4px; }
        .otp-container { text-align: center; margin: 28px 0; }
        .otp-box { display: inline-block; background-color: #1a0808; border: 2px solid #dc2626; border-radius: 12px; padding: 14px 28px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ef4444; font-family: monospace; }
        .info { color: #d1d5db; font-size: 14px; line-height: 1.6; text-align: center; }
        .footer { text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #22222a; color: #71717a; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">🎓</div>
          <h1 class="title">Campus Auction</h1>
          <p class="subtitle">Student-to-Student Marketplace</p>
        </div>
        <p class="info">
          Welcome to Campus Auction! Use the verification code below to verify your email and complete your registration:
        </p>
        <div class="otp-container">
          <div class="otp-box">${otp}</div>
        </div>
        <p class="info" style="font-size: 13px; color: #a1a1aa;">
          ⏱️ This code will expire in <strong>10 minutes</strong>.<br>
          If you did not request this account, please ignore this email.
        </p>
        <div class="footer">
          Campus Auction • Safe Peer-to-Peer Campus Marketplace
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject,
      html: htmlContent,
      text: `Your Campus Auction verification code is: ${otp}. Valid for 10 minutes.`,
    });
    console.log(`✉️ Verification code sent to ${email} (Message ID: ${info.messageId})`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${email}:`, err.message);
    throw new Error(`Failed to send verification email to ${email}: ${err.message}`);
  }
};

module.exports = {
  sendOtpEmail,
  getTransporter,
};
