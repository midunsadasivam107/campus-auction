const nodemailer = require('nodemailer');
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  NODE_ENV,
} = require('../config/env');

let transporter = null;

// Initialize transporter if SMTP credentials are provided
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    console.log(`✉️ Email service initialized with host: ${SMTP_HOST}`);
  } catch (err) {
    console.warn('⚠️ Failed to initialize email transporter:', err.message);
  }
}

/**
 * Send OTP verification email
 *
 * @param {string} email - Recipient student email
 * @param {string} otp - 6-digit verification code
 * @returns {Promise<{ sent: boolean, dev: boolean }>}
 */
const sendOtpEmail = async (email, otp) => {
  const subject = `🎓 Your Campus Auction Verification Code: ${otp}`;
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

  // Always log clearly to console in non-production
  if (NODE_ENV !== 'production' || !transporter) {
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('📨 [CAMPUS AUCTION OTP EMAIL]');
    console.log(`To      : ${email}`);
    console.log(`OTP Code: ${otp}`);
    console.log('Validity: 10 minutes');
    console.log('────────────────────────────────────────────────────────────\n');
  }

  // Attempt sending live email if transporter is configured
  if (transporter) {
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject,
        html: htmlContent,
        text: `Your Campus Auction verification code is: ${otp}. Valid for 10 minutes.`,
      });
      return { sent: true, dev: false };
    } catch (err) {
      console.warn(`⚠️ Failed to send live email to ${email}:`, err.message);
      return { sent: false, dev: true };
    }
  }

  return { sent: true, dev: true };
};

module.exports = {
  sendOtpEmail,
};
