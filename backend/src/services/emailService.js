const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@smartnutritrack.com';
  }

  // Send verification email
  async sendVerificationEmail(email, verificationCode, firstName) {
    try {
      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: 'SmartNutritrack'
        },
        subject: 'Verify Your Email - SmartNutritrack',
        html: this.getVerificationEmailTemplate(firstName, verificationCode),
        text: this.getVerificationEmailText(firstName, verificationCode)
      };

      const result = await sgMail.send(msg);
      console.log('Verification email sent successfully to:', email);
      return { success: true, messageId: result[0]?.headers?.['x-message-id'] };
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, resetToken, firstName) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: 'SmartNutritrack'
        },
        subject: 'Reset Your Password - SmartNutritrack',
        html: this.getPasswordResetEmailTemplate(firstName, resetUrl),
        text: this.getPasswordResetEmailText(firstName, resetUrl)
      };

      const result = await sgMail.send(msg);
      console.log('Password reset email sent successfully to:', email);
      return { success: true, messageId: result[0]?.headers?.['x-message-id'] };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  // Send welcome email after verification
  async sendWelcomeEmail(email, firstName) {
    try {
      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: 'SmartNutritrack'
        },
        subject: 'Welcome to SmartNutritrack!',
        html: this.getWelcomeEmailTemplate(firstName),
        text: this.getWelcomeEmailText(firstName)
      };

      const result = await sgMail.send(msg);
      console.log('Welcome email sent successfully to:', email);
      return { success: true, messageId: result[0]?.headers?.['x-message-id'] };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  // HTML template for verification email
  getVerificationEmailTemplate(firstName, code) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code { background: #fff; border: 2px solid #4CAF50; border-radius: 5px; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .button { background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🍎 Welcome to SmartNutritrack!</h1>
            <p>Verify your email to get started</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName}!</h2>
            <p>Thank you for joining SmartNutritrack. To complete your registration and start your nutrition journey, please verify your email address.</p>

            <p>Here's your verification code:</p>

            <div class="code">${code}</div>

            <p><strong>This code will expire in 24 hours.</strong></p>

            <p>If you didn't create an account with SmartNutritrack, please ignore this email.</p>

            <p>Best regards,<br>The SmartNutritrack Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to you because you registered for an account at SmartNutritrack.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </body>
      </html>
    `;
  }

  // Text template for verification email
  getVerificationEmailText(firstName, code) {
    return `
      Welcome to SmartNutritrack!

      Hi ${firstName}!

      Thank you for joining SmartNutritrack. To complete your registration and start your nutrition journey, please verify your email address.

      Your verification code is: ${code}

      This code will expire in 24 hours.

      If you didn't create an account with SmartNutritrack, please ignore this email.

      Best regards,
      The SmartNutritrack Team
    `;
  }

  // HTML template for password reset email
  getPasswordResetEmailTemplate(firstName, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FF9800, #F57C00); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { background: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Password Reset</h1>
            <p>Reset your SmartNutritrack password</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName}!</h2>
            <p>You requested to reset your password for your SmartNutritrack account.</p>

            <p>Please click the button below to reset your password:</p>

            <a href="${resetUrl}" class="button">Reset Password</a>

            <p><strong>This link will expire in 1 hour.</strong></p>

            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>

            <p>Best regards,<br>The SmartNutritrack Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to you because a password reset was requested for your SmartNutritrack account.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </body>
      </html>
    `;
  }

  // Text template for password reset email
  getPasswordResetEmailText(firstName, resetUrl) {
    return `
      Password Reset - SmartNutritrack

      Hi ${firstName}!

      You requested to reset your password for your SmartNutritrack account.

      Please visit this link to reset your password: ${resetUrl}

      This link will expire in 1 hour.

      If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

      Best regards,
      The SmartNutritrack Team
    `;
  }

  // HTML template for welcome email
  getWelcomeEmailTemplate(firstName) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to SmartNutritrack!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome to SmartNutritrack!</h1>
            <p>Your nutrition journey starts now</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName}!</h2>
            <p>Welcome to SmartNutritrack! Your email has been successfully verified and your account is now active.</p>

            <p>Here's what you can do next:</p>
            <ul>
              <li>Complete your onboarding to get personalized nutrition recommendations</li>
              <li>Start tracking your meals and nutrition intake</li>
              <li>Set your health and fitness goals</li>
              <li>Explore our meal planning features</li>
              <li>Use our AI-powered food scanning</li>
            </ul>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">Get Started</a>

            <p>We're excited to help you achieve your nutrition and health goals!</p>

            <p>Best regards,<br>The SmartNutritrack Team</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing SmartNutritrack for your nutrition journey.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </body>
      </html>
    `;
  }

  // Text template for welcome email
  getWelcomeEmailText(firstName) {
    return `
      Welcome to SmartNutritrack!

      Hi ${firstName}!

      Welcome to SmartNutritrack! Your email has been successfully verified and your account is now active.

      Here's what you can do next:
      - Complete your onboarding to get personalized nutrition recommendations
      - Start tracking your meals and nutrition intake
      - Set your health and fitness goals
      - Explore our meal planning features
      - Use our AI-powered food scanning

      Get started: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard

      We're excited to help you achieve your nutrition and health goals!

      Best regards,
      The SmartNutritrack Team
    `;
  }
}

module.exports = new EmailService();
