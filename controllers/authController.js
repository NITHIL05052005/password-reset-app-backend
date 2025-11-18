import crypto from 'crypto';
import User from '../models/User.js';
import transporter from '../utils/mailer.js';
import dotenv from 'dotenv';
dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const TOKEN_EXPIRY_MINUTES = parseInt(process.env.TOKEN_EXPIRY_MINUTES || '15', 10);

/* ------------------------------------------
   1. FORGOT PASSWORD  
------------------------------------------- */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Create reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000;

    user.resetToken = resetToken;
    user.resetTokenExpiry = expiry;
    await user.save();

    const resetLink = `${FRONTEND_URL}/reset-password/${resetToken}`;

    // Email content
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset. Click below to reset it:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in ${TOKEN_EXPIRY_MINUTES} minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Password reset link sent to email' });

  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ------------------------------------------
   2. VERIFY TOKEN (before showing reset form)
------------------------------------------- */
export const verifyToken = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    res.json({ message: 'Valid token' });

  } catch (err) {
    console.error('Verify Token Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ------------------------------------------
   3. RESET PASSWORD  
------------------------------------------- */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = password; // Hashing happens in User model
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({ message: 'Password reset successful' });

  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
