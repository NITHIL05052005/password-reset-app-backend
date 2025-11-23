import User from '../models/User.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

/**
 * Send password reset email
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("[ForgotPassword] Request body:", req.body);

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    console.log("[ForgotPassword] User found:", user);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();
    console.log("[ForgotPassword] Token saved:", token);

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // must be App Password
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: `<p>Hello ${user.name || 'User'},</p>
             <p>Click <a href="${process.env.FRONTEND_URL}/reset-password/${token}">here</a> to reset your password. This link is valid for 15 minutes.</p>`
    };

    await transporter.sendMail(mailOptions);
    console.log("[ForgotPassword] Email sent");

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error("[ForgotPassword] Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Verify if token is valid
 */
export const verifyToken = async (req, res) => {
  try {
    const { token } = req.params;
    console.log("[VerifyToken] Token:", token);

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    res.json({ message: "Token is valid" });
  } catch (err) {
    console.error("[VerifyToken] Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Reset password using token
 */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ message: "Password is required" });

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear token
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();
    console.log("[ResetPassword] Password updated for user:", user.email);

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("[ResetPassword] Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
