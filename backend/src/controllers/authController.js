const User = require('../models/User');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, countryCode, password, verificationMethod = 'email' } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      countryCode,
      password,
      verificationCode,
      verificationCodeExpires,
      verificationMethod
    });

    if (user) {
      // Send verification based on method
      if (verificationMethod === 'sms') {
        // Send SMS verification
        try {
          await smsService.sendVerificationSMS(phone, countryCode);
          console.log('Verification SMS sent to:', `${countryCode}${phone}`);
        } catch (smsError) {
          console.error('Failed to send verification SMS:', smsError);
          // Don't fail registration if SMS fails, but log it
        }
      } else {
        // Send email verification (default)
        try {
          await emailService.sendVerificationEmail(email, verificationCode, firstName);
          console.log('Verification email sent to:', email);
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
          // Don't fail registration if email fails, but log it
        }
      }

      res.status(201).json({
        success: true,
        message: `User registered successfully. Please check your ${verificationMethod === 'sms' ? 'SMS' : 'email'} for verification code.`,
        data: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          countryCode: user.countryCode,
          verificationMethod: user.verificationMethod,
          isVerified: user.isVerified
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isVerified: user.isVerified,
        onboardingCompleted: user.onboarding.completed,
        token: token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Verify email with code
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Check verification code
    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Check if code is expired
    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired'
      });
    }

    // Update user as verified
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(email, user.firstName);
      console.log('Welcome email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail verification if welcome email fails
    }

    res.json({
      success: true,
      message: 'Email verified successfully. Welcome to SmartNutritrack!',
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification',
      error: error.message
    });
  }
};

// @desc    Verify SMS with code
// @route   POST /api/auth/verify-sms
// @access  Public
const verifySMS = async (req, res) => {
  try {
    const { phone, countryCode, verificationCode } = req.body;

    // Find user by phone
    const user = await User.findOne({ phone, countryCode });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone already verified'
      });
    }

    // Check if verification method is SMS
    if (user.verificationMethod !== 'sms') {
      return res.status(400).json({
        success: false,
        message: 'This user is not set up for SMS verification'
      });
    }

    // Verify with Twilio
    const verificationResult = await smsService.verifySMSCode(phone, countryCode, verificationCode);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Update user as verified
    user.isVerified = true;
    await user.save();

    // Send welcome SMS
    try {
      await smsService.sendWelcomeSMS(phone, countryCode, user.firstName);
      console.log('Welcome SMS sent to:', `${countryCode}${phone}`);
    } catch (smsError) {
      console.error('Failed to send welcome SMS:', smsError);
      // Don't fail verification if welcome SMS fails
    }

    res.json({
      success: true,
      message: 'Phone verified successfully. Welcome to SmartNutritrack!',
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        countryCode: user.countryCode,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('SMS verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during SMS verification',
      error: error.message
    });
  }
};

// @desc    Resend verification code
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  try {
    const { email, phone, countryCode, verificationMethod } = req.body;

    let user;
    if (verificationMethod === 'sms') {
      if (!phone || !countryCode) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and country code required for SMS resend'
        });
      }
      user = await User.findOne({ phone, countryCode });
    } else {
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email required for email resend'
        });
      }
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: `${verificationMethod === 'sms' ? 'Phone' : 'Email'} already verified`
      });
    }

    // Check if verification method matches
    if (user.verificationMethod !== verificationMethod) {
      return res.status(400).json({
        success: false,
        message: `This user is set up for ${user.verificationMethod} verification, not ${verificationMethod}`
      });
    }

    if (verificationMethod === 'sms') {
      // Resend SMS verification
      try {
        await smsService.sendVerificationSMS(phone, countryCode);
        console.log('Verification SMS resent to:', `${countryCode}${phone}`);
      } catch (smsError) {
        console.error('Failed to resend verification SMS:', smsError);
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification SMS. Please try again later.'
        });
      }
    } else {
      // Resend email verification
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with new code
      user.verificationCode = verificationCode;
      user.verificationCodeExpires = verificationCodeExpires;
      await user.save();

      try {
        await emailService.sendVerificationEmail(email, verificationCode, user.firstName);
        console.log('Verification email resent to:', email);
      } catch (emailError) {
        console.error('Failed to resend verification email:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email. Please try again later.'
        });
      }
    }

    res.json({
      success: true,
      message: `Verification code sent successfully. Please check your ${verificationMethod === 'sms' ? 'SMS' : 'email'}.`
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during resend verification',
      error: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with that email address'
      });
    }

    // Generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetPasswordToken = require('crypto')
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken, user.firstName);
      console.log('Password reset email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request',
      error: error.message
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Hash the token from URL
    const resetPasswordToken = require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by token and check expiration
    const user = await User.findOne({
      resetPasswordToken: resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset',
      error: error.message
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password update',
      error: error.message
    });
  }
};

// @desc    Delete account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during account deletion',
      error: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  verifyEmail,
  verifySMS,
  resendVerification,
  forgotPassword,
  resetPassword,
  updatePassword,
  deleteAccount
};
