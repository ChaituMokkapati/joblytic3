import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import { isMongoReady } from '../config/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'amb_saas_super_secret_jwt_key_2026';

// In-memory fallback users array
let memoryUsers = [];

// OTP store: { email: { otp, expiry } }
const otpStore = {};

/**
 * POST /api/signup or POST /api/auth/signup
 */
const handleSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const userName = name || cleanEmail.split('@')[0] || 'User';
    const hashedPassword = await bcrypt.hash(password, 10);

    if (isMongoReady()) {
      let user = await User.findOne({ email: cleanEmail });
      if (!user) {
        user = await User.create({ name: userName, email: cleanEmail, password: hashedPassword });
      }
      const token = jwt.sign(
        { id: user._id, name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    }

    // In-memory Fallback
    let user = memoryUsers.find((u) => u.email === cleanEmail);
    if (!user) {
      user = { id: Date.now(), name: userName, email: cleanEmail, password: hashedPassword };
      memoryUsers.push(user);
    }
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Signup error', message: error.message });
  }
};

/**
 * POST /api/login or POST /api/auth/login
 */
const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isMongoReady()) {
      let user = await User.findOne({ email: cleanEmail });

      if (!user) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await User.create({
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          password: hashedPassword
        });
      } else {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      }

      const token = jwt.sign(
        { id: user._id, name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    }

    // In-memory fallback
    let user = memoryUsers.find((u) => u.email === cleanEmail);
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = { id: Date.now(), name: cleanEmail.split('@')[0], email: cleanEmail, password: hashedPassword };
      memoryUsers.push(user);
    } else {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Login error', message: error.message });
  }
};

/**
 * POST /api/forgot-password
 * Accept: { email }
 * Generates a 6-digit OTP, stores it with a 10-minute expiry, logs it to console.
 */
const handleForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists (MongoDB or in-memory)
    let userExists = false;
    if (isMongoReady()) {
      const user = await User.findOne({ email: cleanEmail });
      userExists = Boolean(user);
    } else {
      userExists = memoryUsers.some((u) => u.email === cleanEmail);
    }

    if (!userExists) {
      // Return generic message to avoid user enumeration
      return res.json({ message: 'If this email is registered, an OTP will be sent.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    otpStore[cleanEmail] = { otp, expiry };

    // TODO: Replace with real email service (Nodemailer / SendGrid)
    console.log(`\n🔐 OTP for ${cleanEmail} is: ${otp} (expires in 10 minutes)\n`);

    return res.json({ message: 'OTP sent to email. Check your inbox.' });
  } catch (error) {
    res.status(500).json({ error: 'Forgot password error', message: error.message });
  }
};

/**
 * POST /api/reset-password
 * Accept: { email, otp, newPassword }
 * Verifies OTP, hashes new password, updates user.
 */
const handleResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are all required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const stored = otpStore[cleanEmail];

    if (!stored) {
      return res.status(400).json({ error: 'No OTP was requested for this email.' });
    }
    if (Date.now() > stored.expiry) {
      delete otpStore[cleanEmail];
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    if (stored.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }

    // OTP valid — hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (isMongoReady()) {
      await User.findOneAndUpdate({ email: cleanEmail }, { password: hashedPassword });
    } else {
      const user = memoryUsers.find((u) => u.email === cleanEmail);
      if (user) user.password = hashedPassword;
    }

    // Clear OTP after successful reset
    delete otpStore[cleanEmail];

    console.log(`✅ Password reset successful for ${cleanEmail}`);
    return res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    res.status(500).json({ error: 'Reset password error', message: error.message });
  }
};

// Route Definitions
router.post('/signup', handleSignup);
router.post('/login', handleLogin);
router.post('/forgot-password', handleForgotPassword);
router.post('/reset-password', handleResetPassword);

/**
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

export { handleSignup, handleLogin, handleForgotPassword, handleResetPassword, memoryUsers as users };
export default router;
