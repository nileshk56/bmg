import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/index.js';
//import { sendEmail } from '../utils/email.js';

export const signup = async (req, res) => {
    const { firstname, lastname, email, password, gender, dob } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const user = new User({ firstname, lastname, email, password, gender, dob, verifyToken });
    await user.save();

    // send verification email with link
    /*const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}&email=${encodeURIComponent(email)}`;
    await sendEmail({
        to: email,
        subject: 'Verify your email',
        html: `<p>Click to verify: <a href="${verifyUrl}">${verifyUrl}</a></p>`
    });*/

    res.status(201).json({ message: 'User created. Verify email.' });
};

export const verifyEmail = async (req, res) => {
    const { token, email } = req.query;
    const user = await User.findOne({ email, verifyToken: token });
    if (!user) return res.status(400).json({ error: 'Invalid token' });
    user.isVerified = true;
    user.verifyToken = undefined;
    await user.save();
    res.json({ message: 'Email verified' });
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    //if (!user.isVerified) return res.status(403).json({ error: 'Please verify email' });

    const token = jwt.sign({ id: user._id, email: user.email }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.json({ token, expiresIn: config.jwtExpiresIn });
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'If account exists, reset link sent' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + (60 * 60 * 1000); // 1 hour
    await user.save();

    /*const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await sendEmail({
        to: email,
        subject: 'Password reset',
        html: `<p>Reset link: <a href="${resetUrl}">${resetUrl}</a></p>`
    });*/

    res.json({ message: 'If account exists, reset link sent' });
};

export const resetPassword = async (req, res) => {
    const { token, email } = req.query;
    const { password } = req.body;
    const user = await User.findOne({
        email,
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset' });
};
