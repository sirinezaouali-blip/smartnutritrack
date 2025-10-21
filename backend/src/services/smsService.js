const twilio = require('twilio');

class SmsService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  }

  // Send SMS verification code using Twilio Verify
  async sendVerificationSMS(phoneNumber, countryCode) {
    try {
      // Format phone number with country code
      const fullPhoneNumber = `${countryCode}${phoneNumber}`.replace(/\s+/g, '');

      const verification = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({
          to: fullPhoneNumber,
          channel: 'sms'
        });

      console.log('SMS verification sent successfully to:', fullPhoneNumber);
      return {
        success: true,
        sid: verification.sid,
        status: verification.status
      };
    } catch (error) {
      console.error('Error sending SMS verification:', error);
      throw new Error('Failed to send SMS verification');
    }
  }

  // Verify SMS code using Twilio Verify
  async verifySMSCode(phoneNumber, countryCode, code) {
    try {
      // Format phone number with country code
      const fullPhoneNumber = `${countryCode}${phoneNumber}`.replace(/\s+/g, '');

      const verificationCheck = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({
          to: fullPhoneNumber,
          code: code
        });

      console.log('SMS verification check result:', verificationCheck.status);

      return {
        success: verificationCheck.status === 'approved',
        status: verificationCheck.status
      };
    } catch (error) {
      console.error('Error verifying SMS code:', error);
      throw new Error('Failed to verify SMS code');
    }
  }

  // Send custom SMS message (for welcome messages, etc.)
  async sendSMS(to, message) {
    try {
      const sms = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER, // You'll need to add this to .env
        to: to
      });

      console.log('SMS sent successfully:', sms.sid);
      return {
        success: true,
        sid: sms.sid,
        status: sms.status
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw new Error('Failed to send SMS');
    }
  }

  // Send welcome SMS after verification
  async sendWelcomeSMS(phoneNumber, countryCode, firstName) {
    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`.replace(/\s+/g, '');
      const message = `Welcome to SmartNutritrack, ${firstName}! 🎉 Your phone number has been verified. Start your nutrition journey today!`;

      return await this.sendSMS(fullPhoneNumber, message);
    } catch (error) {
      console.error('Error sending welcome SMS:', error);
      throw new Error('Failed to send welcome SMS');
    }
  }
}

module.exports = new SmsService();
