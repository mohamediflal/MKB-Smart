import { Request, Response } from 'express';
import { prisma } from '../configs/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cloudinary from '../configs/cloudinary';
import nodemailer from 'nodemailer';
import { handleAdminRegistration } from '../services/notificationService.js';

const otpStore = new Map<string, { otp: string; expiresAt: number }>();

const createMailTransporter = async () => {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }
    return null;
};

const sendApprovalEmail = async (email: string, name: string) => {
    try {
        const transporter = await createMailTransporter();
        if (!transporter) {
            console.warn('[EMAIL] SMTP transporter not configured. Cannot send approval email.');
            return;
        }

        const mailOptions = {
            from: `"MKB-SMART Support" <${process.env.EMAIL_USER || 'no-reply@mkb-smart.com'}>`,
            to: email,
            subject: 'MKB-SMART Admin Account Approved',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #006d37; text-align: center;">Account Approved</h2>
                    <p>Dear ${name},</p>
                    <p>We are pleased to inform you that your request to register as an Admin on MKB-SMART has been approved by the Super Admin.</p>
                    <p>You can now log in to the admin panel using your registered email and password.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.ADMIN_FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #006d37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Admin Panel</a>
                    </div>
                    <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">This is an automated message. Please do not reply directly to this email.</p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Approval email sent to ${email}`);
    } catch (error) {
        console.error('Error sending approval email:', error);
    }
};

const sendRejectionEmail = async (email: string, name: string) => {
    try {
        const transporter = await createMailTransporter();
        if (!transporter) {
            console.warn('[EMAIL] SMTP transporter not configured. Cannot send rejection email.');
            return;
        }

        const mailOptions = {
            from: `"MKB-SMART Support" <${process.env.EMAIL_USER || 'no-reply@mkb-smart.com'}>`,
            to: email,
            subject: 'MKB-SMART Admin Registration Request Status',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #d32f2f; text-align: center;">Registration Request Status</h2>
                    <p>Dear ${name},</p>
                    <p>Thank you for your interest in registering as an Admin on MKB-SMART.</p>
                    <p>We regret to inform you that your registration request has been declined by the Super Admin.</p>
                    <p>If you believe this was in error, please contact the Super Admin or support team.</p>
                    <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">This is an automated message. Please do not reply directly to this email.</p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Rejection email sent to ${email}`);
    } catch (error) {
        console.error('Error sending rejection email:', error);
    }
};

const sendUserSuspensionEmail = async (email: string, name: string, status: string) => {
    try {
        const transporter = await createMailTransporter();
        if (!transporter) {
            console.warn('[EMAIL] SMTP transporter not configured. Cannot send user status update email.');
            return;
        }

        const isSuspended = status === 'SUSPENDED';
        const subject = isSuspended ? 'MKB-SMART Customer Account Suspended' : 'MKB-SMART Customer Account Reinstated';
        const title = isSuspended ? 'Account Suspended' : 'Account Reinstated';
        const color = isSuspended ? '#d32f2f' : '#006d37';
        const messageHtml = isSuspended
            ? `<p>We regret to inform you that your customer account has been suspended by the Super Admin.</p>
               <p>If you believe this was a mistake, or wish to inquire about the suspension, please contact support.</p>`
            : `<p>We are pleased to inform you that your customer account has been reinstated by the Super Admin.</p>
               <p>You can now log in and continue shopping with MKB-SMART.</p>`;

        const mailOptions = {
            from: `"MKB-SMART Support" <${process.env.EMAIL_USER || 'no-reply@mkb-smart.com'}>`,
            to: email,
            subject,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: ${color}; text-align: center;">${title}</h2>
                    <p>Dear ${name},</p>
                    ${messageHtml}
                    <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">This is an automated message. Please do not reply directly to this email.</p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] User status email sent to ${email} (status: ${status})`);
    } catch (error) {
        console.error('Error sending user status update email:', error);
    }
};

const sendUserRemovalEmail = async (email: string, name: string) => {
    try {
        const transporter = await createMailTransporter();
        if (!transporter) {
            console.warn('[EMAIL] SMTP transporter not configured. Cannot send user removal email.');
            return;
        }

        const mailOptions = {
            from: `"MKB-SMART Support" <${process.env.EMAIL_USER || 'no-reply@mkb-smart.com'}>`,
            to: email,
            subject: 'MKB-SMART Customer Account Removed',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #d32f2f; text-align: center;">Account Removed</h2>
                    <p>Dear ${name},</p>
                    <p>Your customer account has been removed/deleted from the MKB-SMART system by the Super Admin.</p>
                    <p>Thank you for the time you spent with us. If you have any remaining questions, please contact support.</p>
                    <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">This is an automated message. Please do not reply directly to this email.</p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] User removal email sent to ${email}`);
    } catch (error) {
        console.error('Error sending user removal email:', error);
    }
};

const sendAdminSuspensionEmail = async (email: string, name: string, status: string) => {
    try {
        const transporter = await createMailTransporter();
        if (!transporter) {
            console.warn('[EMAIL] SMTP transporter not configured. Cannot send admin status update email.');
            return;
        }

        const isSuspended = status === 'SUSPENDED';
        const subject = isSuspended ? 'MKB-SMART Admin Account Suspended' : 'MKB-SMART Admin Account Reinstated';
        const title = isSuspended ? 'Admin Account Suspended' : 'Admin Account Reinstated';
        const color = isSuspended ? '#d32f2f' : '#006d37';
        const messageHtml = isSuspended
            ? `<p>We regret to inform you that your admin account has been suspended by the Super Admin.</p>
               <p>Your access to the admin dashboard has been temporarily revoked. Please contact the Super Admin for clarification.</p>`
            : `<p>We are pleased to inform you that your admin account has been reinstated by the Super Admin.</p>
               <p>You can now log back into the admin dashboard using your credentials.</p>`;

        const mailOptions = {
            from: `"MKB-SMART Support" <${process.env.EMAIL_USER || 'no-reply@mkb-smart.com'}>`,
            to: email,
            subject,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: ${color}; text-align: center;">${title}</h2>
                    <p>Dear ${name},</p>
                    ${messageHtml}
                    <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">This is an automated message. Please do not reply directly to this email.</p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Admin status email sent to ${email} (status: ${status})`);
    } catch (error) {
        console.error('Error sending admin status update email:', error);
    }
};

const sendAdminRemovalEmail = async (email: string, name: string) => {
    try {
        const transporter = await createMailTransporter();
        if (!transporter) {
            console.warn('[EMAIL] SMTP transporter not configured. Cannot send admin removal email.');
            return;
        }

        const mailOptions = {
            from: `"MKB-SMART Support" <${process.env.EMAIL_USER || 'no-reply@mkb-smart.com'}>`,
            to: email,
            subject: 'MKB-SMART Admin Account Removed',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #d32f2f; text-align: center;">Admin Account Removed</h2>
                    <p>Dear ${name},</p>
                    <p>Your admin account has been removed/deleted from the MKB-SMART system by the Super Admin.</p>
                    <p>If you believe this was in error, please contact the Super Admin.</p>
                    <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">This is an automated message. Please do not reply directly to this email.</p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Admin removal email sent to ${email}`);
    } catch (error) {
        console.error('Error sending admin removal email:', error);
    }
};

const sendAdminRoleChangeEmail = async (email: string, name: string, newRole: string) => {
    try {
        const transporter = await createMailTransporter();
        if (!transporter) {
            console.warn('[EMAIL] SMTP transporter not configured. Cannot send admin role update email.');
            return;
        }

        const roleString = newRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin';

        const mailOptions = {
            from: `"MKB-SMART Support" <${process.env.EMAIL_USER || 'no-reply@mkb-smart.com'}>`,
            to: email,
            subject: 'MKB-SMART Admin Account Role Update',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #006d37; text-align: center;">Role Updated</h2>
                    <p>Dear ${name},</p>
                    <p>We want to inform you that your administrative role on the MKB-SMART system has been updated by the Super Admin.</p>
                    <p>Your new role is: <strong>${roleString}</strong>.</p>
                    <p>Your active session has been invalidated for security reasons. Please log in again to apply the changes and access the dashboard corresponding to your updated role.</p>
                    <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">This is an automated message. Please do not reply directly to this email.</p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Admin role change email sent to ${email} (new role: ${newRole})`);
    } catch (error) {
        console.error('Error sending admin role update email:', error);
    }
};

// Generate JWT token (accepts either id string or object payload)
const generateToken = (payload: string | object) => {
    const data = typeof payload === 'string' ? { id: payload } : payload
    return jwt.sign(data, process.env.JWT_SECRET as string, { expiresIn: '30d' })
}

//Check if admin is super admin
const getSuperAdmin = (email: string | null | undefined): boolean => {
    if (!email) return false;
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ? process.env.SUPER_ADMIN_EMAIL.split(',').map(e => e.trim().toLowerCase()) : [];
    return superAdminEmail.includes(email.toLowerCase());
}

//Register for User
//POST /api/auth/register
export const register = async (req: Request, res: Response) => {
    const { name, email, password, role, isAdmin, otp } = req.body;

    // Reject admin account creation through the public user register route.
    if (role === 'admin' || role === 'superadmin' || isAdmin === true) {
        return res.status(400).json({ message: 'Use the admin registration endpoint for admin accounts' });
    }

    // Validate input
    if (!name || !email || !password || !otp) {
        return res.status(400).json({ message: "Please provide all fields including verification OTP" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Prevent user registration using super admin email
    const superAdminEmails = process.env.SUPER_ADMIN_EMAIL
        ? process.env.SUPER_ADMIN_EMAIL.split(',').map((e) => e.trim().toLowerCase())
        : [];

    if (superAdminEmails.includes(normalizedEmail)) {
        return res.status(400).json({ message: 'Cannot register super admin email through user registration' });
    }

    // Verify OTP first
    const record = otpStore.get(normalizedEmail);
    if (!record) {
        return res.status(400).json({ message: "Verification OTP not requested or expired. Please request a new OTP." });
    }

    if (Date.now() > record.expiresAt) {
        otpStore.delete(normalizedEmail);
        return res.status(400).json({ message: "Verification OTP has expired. Please request a new OTP." });
    }

    if (record.otp !== otp.trim()) {
        return res.status(400).json({ message: "Invalid verification OTP. Please check and try again." });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingUser) {
        otpStore.delete(normalizedEmail);
        return res.status(400).json({ message: "Email already in use" });
    }

    // OTP verified, remove it
    otpStore.delete(normalizedEmail);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email: normalizedEmail,
            password: hashedPassword,
        },
    });

    const token = generateToken(user.id);

    const { password: _password, ...safeUser } = user;

    res.status(201).json({ message: "User created successfully", user: safeUser, token });

}

// Send OTP to email address for registration verification
// POST /api/auth/send-otp
export const sendOtp = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if user or admin already exists
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        const existingAdmin = await prisma.admin.findUnique({ where: { email: normalizedEmail } });
        if (existingUser || existingAdmin) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

        // Store OTP
        otpStore.set(normalizedEmail, { otp, expiresAt });

        console.log(`\n====================================`);
        console.log(`[OTP VERIFICATION]`);
        console.log(`Email: ${normalizedEmail}`);
        console.log(`OTP Code: ${otp}`);
        console.log(`Expires At: ${new Date(expiresAt).toLocaleTimeString()}`);
        console.log(`====================================\n`);

        // Send Email
        const transporter = await createMailTransporter();
        if (transporter) {
            const mailOptions = {
                from: `"MKB-SMART Support" <${process.env.EMAIL_USER || 'no-reply@mkb-smart.com'}>`,
                to: normalizedEmail,
                subject: 'MKB-SMART Registration Verification Code',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #006d37; text-align: center;">MKB-SMART Verification Code</h2>
                        <p>Thank you for signing up with MKB-SMART! Please verify your email address by entering the verification code below:</p>
                        <div style="background-color: #f3fcf1; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                            <span style="font-size: 24px; font-weight: bold; color: #006d37; letter-spacing: 4px;">${otp}</span>
                        </div>
                        <p style="font-size: 12px; color: #666; text-align: center;">This code is valid for 5 minutes. If you did not request this code, please ignore this email.</p>
                    </div>
                `,
            };

            const info = await transporter.sendMail(mailOptions);

            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`[Ethereal Email Sent] Preview URL: ${previewUrl}`);
                return res.status(200).json({
                    success: true,
                    message: 'OTP sent to email address.',
                    previewUrl,
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully (please check your console logs or inbox).',
        });
    } catch (error: any) {
        console.error('Send OTP Error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};

// Request password reset OTP
// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email, role } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (role === 'admin') {
            const admin = await prisma.admin.findUnique({ where: { email: normalizedEmail } });
            if (!admin) {
                return res.status(404).json({ success: false, message: 'Invalid admin email address' });
            }
        } else {
            const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
            if (!user) {
                return res.status(404).json({ success: false, message: 'Invalid user email address' });
            }
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

        // Store OTP
        otpStore.set(normalizedEmail, { otp, expiresAt });

        console.log(`\n====================================`);
        console.log(`[PASSWORD RESET OTP]`);
        console.log(`Email: ${normalizedEmail}`);
        console.log(`OTP Code: ${otp}`);
        console.log(`Expires At: ${new Date(expiresAt).toLocaleTimeString()}`);
        console.log(`====================================\n`);

        // Send Email
        const transporter = await createMailTransporter();
        if (transporter) {
            const mailOptions = {
                from: `"MKB-SMART Support" <${process.env.EMAIL_USER || 'no-reply@mkb-smart.com'}>`,
                to: normalizedEmail,
                subject: 'MKB-SMART Password Reset Verification Code',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #006d37; text-align: center;">MKB-SMART Reset Code</h2>
                        <p>You requested a password reset for your MKB-SMART account. Please use the verification code below to set a new password:</p>
                        <div style="background-color: #f3fcf1; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                            <span style="font-size: 24px; font-weight: bold; color: #006d37; letter-spacing: 4px;">${otp}</span>
                        </div>
                        <p style="font-size: 12px; color: #666; text-align: center;">This code is valid for 5 minutes. If you did not request this password reset, please ignore this email.</p>
                    </div>
                `,
            };

            const info = await transporter.sendMail(mailOptions);

            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`[Ethereal Email Sent] Preview URL: ${previewUrl}`);
                return res.status(200).json({
                    success: true,
                    message: 'OTP sent to email address.',
                    previewUrl,
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully (please check your console logs or inbox).',
        });
    } catch (error: any) {
        console.error('Forgot Password OTP Error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};

// Verify OTP (Generic verification for forgot password screen)
// POST /api/auth/verify-otp
export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const record = otpStore.get(normalizedEmail);
        if (!record) {
            return res.status(400).json({ success: false, message: 'OTP has expired or has not been requested.' });
        }

        if (Date.now() > record.expiresAt) {
            otpStore.delete(normalizedEmail);
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
        }

        if (record.otp !== otp.trim()) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
        }

        return res.status(200).json({ success: true, message: 'OTP verified successfully.' });
    } catch (error: any) {
        console.error('Verify OTP Error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};

// Reset Password
// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, otp, newPassword, role } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Verify OTP again to ensure authorization
        const record = otpStore.get(normalizedEmail);
        if (!record) {
            return res.status(400).json({ success: false, message: 'Session expired. Please request a new OTP.' });
        }

        if (Date.now() > record.expiresAt) {
            otpStore.delete(normalizedEmail);
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
        }

        if (record.otp !== otp.trim()) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please verify again.' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update database based on role
        if (role === 'admin') {
            const isAdmin = await prisma.admin.findUnique({ where: { email: normalizedEmail } });
            if (isAdmin) {
                await prisma.admin.update({
                    where: { email: normalizedEmail },
                    data: { password: hashedPassword }
                });
            } else {
                return res.status(404).json({ success: false, message: 'Admin account not found.' });
            }
        } else {
            const isUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
            if (isUser) {
                await prisma.user.update({
                    where: { email: normalizedEmail },
                    data: { password: hashedPassword }
                });
            } else {
                return res.status(404).json({ success: false, message: 'User account not found.' });
            }
        }

        // OTP is valid and database update succeeded, clear it
        otpStore.delete(normalizedEmail);

        return res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
    } catch (error: any) {
        console.error('Reset Password Error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};

//Login for User
//POST /api/auth/login
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ message: "Please provide all fields" });
    }

    const normalizedEmail = email.toLowerCase();
    const superAdminEmails = process.env.SUPER_ADMIN_EMAIL
        ? process.env.SUPER_ADMIN_EMAIL.split(',').map((e) => e.trim().toLowerCase())
        : [];

    if (superAdminEmails.includes(normalizedEmail)) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail }, include: { addresses: true } });

    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status === 'SUSPENDED') {
        return res.status(403).json({ message: "Your account has been suspended. If you believe this is an error or require further assistance, please contact MKB Support at mkbsmart30@gmail.com." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Wrong password" });
    }

    const token = generateToken(user.id);

    const { password: _password, ...safeUser } = user;

    res.status(201).json({ message: "Login successful", user: safeUser, token });

}

// show all users for super admin only
export const listUsers = async (req: Request & { userId?: string }, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                orders: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const mappedUsers = users.map(u => {
            const totalSpent = u.orders.reduce((sum, o) => sum + (o.total || 0), 0);
            return {
                id: u.id,
                name: u.name,
                email: u.email,
                orders: u.orders.length,
                spent: totalSpent,
                joined: u.createdAt.toISOString().slice(0, 10),
                createdAt: u.createdAt,
                status: u.status === 'ACTIVE' ? 'Active' : 'Suspended'
            };
        });

        res.status(200).json(mappedUsers);
    } catch (error: any) {
        console.error('List Users Error:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
}

// update user details by user themselves
export const updateUser = async (req: Request & { userId?: string }, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized. Please login again.' });
        }

        const existing = await prisma.user.findUnique({ where: { id: userId } });

        if (!existing) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const { name, imageBase64, imageMimeType } = req.body;
        console.log('[DEBUG Backend] updateUser called with keys:', Object.keys(req.body));
        console.log('[DEBUG Backend] name:', name);
        console.log('[DEBUG Backend] imageBase64 length:', imageBase64 ? imageBase64.length : 'null/undefined');
        console.log('[DEBUG Backend] imageMimeType:', imageMimeType);

        const updateData: { name?: string; avatar?: string } = {};

        // Update name if provided
        if (name && name.trim()) {
            updateData.name = name.trim();
        }

        // Upload avatar to Cloudinary if base64 image was sent
        if (imageBase64) {
            const mime = imageMimeType || 'image/jpeg';
            const dataUri = `data:${mime};base64,${imageBase64}`;
            console.log('[DEBUG Backend] Uploading to Cloudinary...');

            const uploadResult = await cloudinary.uploader.upload(dataUri, {
                folder: 'mkb-smart/avatars',
                transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
            });

            console.log('[DEBUG Backend] Cloudinary upload success url:', uploadResult.secure_url);
            updateData.avatar = uploadResult.secure_url;
        } else {
            console.log('[DEBUG Backend] No imageBase64 provided, skipping Cloudinary upload');
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided to update.' });
        }

        console.log('[DEBUG Backend] Updating database with data:', updateData);
        const updated = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        const { password: _password, ...safeUser } = updated;
        console.log('[DEBUG Backend] Database update success, updated user:', safeUser);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            user: safeUser,
        });

    } catch (error: any) {
        console.error('Update User Error:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
}

// delete user account by super admin or by user themselves
export const deleteUser = async (req: Request & { userId?: string }, res: Response) => {
    try {
        const id = req.body.id || req.query.id || req.userId;

        if (!id) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const existing = await prisma.user.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isSelfDelete = req.userId === id;

        await prisma.user.delete({
            where: { id }
        });

        if (!isSelfDelete) {
            sendUserRemovalEmail(existing.email, existing.name);
        }

        res.status(200).json({ success: true, message: 'User removed successfully' });
    } catch (error: any) {
        console.error('Delete User Error:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
}



//Register for admin
//POST /api/auth/adminRegister
export const adminRegister = async (req: Request, res: Response) => {
    const { name, email, password, otp } = req.body

    // Validate input
    if (!name || !email || !password || !otp) {
        return res.status(400).json({ message: 'Please provide all fields including verification OTP' })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Verify OTP first
    const record = otpStore.get(normalizedEmail);
    if (!record) {
        return res.status(400).json({ message: "Verification OTP not requested or expired. Please request a new OTP." });
    }

    if (Date.now() > record.expiresAt) {
        otpStore.delete(normalizedEmail);
        return res.status(400).json({ message: "Verification OTP has expired. Please request a new OTP." });
    }

    if (record.otp !== otp.trim()) {
        return res.status(400).json({ message: "Invalid verification OTP. Please check and try again." });
    }

    // OTP verified, remove it
    otpStore.delete(normalizedEmail);

    // Prevent registering the super admin via this route
    const superAdminEmails = process.env.SUPER_ADMIN_EMAIL
        ? process.env.SUPER_ADMIN_EMAIL.split(',').map((e) => e.trim().toLowerCase())
        : []
    if (superAdminEmails.includes(normalizedEmail)) {
        return res.status(403).json({ message: 'Cannot register super admin via this endpoint' })
    }

    const existingAdmin = await prisma.admin.findUnique({ where: { email: normalizedEmail } })

    if (existingAdmin) {
        return res.status(400).json({ message: 'Email already in use' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    let initialStatus: 'PENDING' | 'ACTIVE' | 'SUSPENDED' = 'PENDING'
    if (req.body.status === 'Active' || req.body.status === 'ACTIVE') {
        initialStatus = 'ACTIVE'
    } else if (req.body.status === 'Suspended' || req.body.status === 'SUSPENDED' || req.body.status === 'Inactive') {
        initialStatus = 'SUSPENDED'
    }

    const admin = await prisma.admin.create({
        data: {
            name,
            email: normalizedEmail,
            password: hashedPassword,
            status: initialStatus,
        },
    })

    // Send push and db notification to super admins
    await handleAdminRegistration(admin.id);

    const token = generateToken({ id: admin.id, email: admin.email })

    const adminData: any = { ...admin }
    delete adminData.password
    adminData.isSuperAdmin = getSuperAdmin(adminData.email)

    res.status(201).json({ message: 'Admin created successfully', admin: adminData, token })
}

//Login for Admin
//POST /api/auth/admin/login
export const adminLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide all fields' })
    }

    const normalizedEmail = email.toLowerCase()

    const admin = await prisma.admin.findUnique({ where: { email: normalizedEmail } })

    if (!admin) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    if (admin.status === 'SUSPENDED') {
        return res.status(403).json({ message: "Your account has been suspended. If you believe this is an error or require further assistance, please contact MKB Support at mkbsmart30@gmail.com." })
    }

    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
        return res.status(401).json({ message: 'Wrong password' })
    }

    const isSuperAdmin = admin.role === 'SUPER_ADMIN'
    const token = generateToken({ id: admin.id, email: admin.email, role: isSuperAdmin ? 'superadmin' : 'admin' })

    const adminData: any = { ...admin }
    delete adminData.password
    adminData.isSuperAdmin = isSuperAdmin

    res.status(200).json({ message: 'Admin login successful', admin: adminData, token })
}

// show all admins for super admin only
export const listAdmins = async (req: Request & { userId?: string }, res: Response) => {
    try {
        const admins = await prisma.admin.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        })

        const mappedAdmins = admins.map(a => {
            const isSuperAdmin = a.role === 'SUPER_ADMIN' || getSuperAdmin(a.email)
            return {
                id: a.id,
                name: a.name,
                email: a.email,
                role: isSuperAdmin ? 'super_admin' : 'admin',
                lastActive: a.updatedAt.toISOString().slice(0, 16).replace('T', ' '),
                status: a.status === 'ACTIVE' ? 'Active' : a.status === 'PENDING' ? 'Pending' : 'Suspended',
            }
        })

        res.status(200).json(mappedAdmins)
    } catch (error: any) {
        console.error('List Admins Error:', error)
        res.status(500).json({ message: error.message || 'Internal server error' })
    }
}

// add new admins or super admins by super admin
export const createAdmin = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role, status } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields (name, email, password)' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if admin already exists
        const existingAdmin = await prisma.admin.findUnique({ where: { email: normalizedEmail } });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const adminRole = role === 'super_admin' ? 'SUPER_ADMIN' : 'ADMIN';
        const adminStatus = status === 'Active' || status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED';

        const admin = await prisma.admin.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                role: adminRole,
                status: adminStatus,
            },
        });

        const adminData: any = { ...admin };
        delete adminData.password;
        adminData.isSuperAdmin = admin.role === 'SUPER_ADMIN';

        res.status(201).json({ success: true, message: 'Admin account created successfully', admin: adminData });
    } catch (error: any) {
        console.error('Create Admin Error:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};


// Update admin or super admin details by super admin
export const updateAdmin = async (req: Request & { userId?: string }, res: Response) => {
    try {
        const { id, name, status, role } = req.body

        if (!id) {
            return res.status(400).json({ message: 'Admin ID is required' })
        }

        // Get logged in admin ID from token
        const authHeader = req.headers.authorization;
        let loggedInAdminId: string | undefined;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
                loggedInAdminId = decoded.id;
            } catch (e) {
                // Ignore decoding error
            }
        }

        if (loggedInAdminId === id) {
            return res.status(400).json({ message: 'You cannot modify your own admin account.' });
        }

        const existing = await prisma.admin.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const data: any = {}
        if (name) data.name = name.trim()
        if (status) {
            data.status = status === 'Active' || status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED'
        }
        if (role) {
            data.role = role === 'super_admin' || role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN'
        }

        const updated = await prisma.admin.update({
            where: { id },
            data
        })

        if (existing.status === 'PENDING' && updated.status === 'ACTIVE') {
            sendApprovalEmail(updated.email, updated.name);
        } else if (existing.status !== updated.status) {
            sendAdminSuspensionEmail(updated.email, updated.name, updated.status);
        }

        if (role && existing.role !== updated.role) {
            sendAdminRoleChangeEmail(updated.email, updated.name, updated.role);
        }

        const isSuperAdmin = updated.role === 'SUPER_ADMIN' || getSuperAdmin(updated.email)
        const safeAdmin = {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            role: isSuperAdmin ? 'super_admin' : 'admin',
            lastActive: updated.updatedAt.toISOString().slice(0, 16).replace('T', ' '),
            status: updated.status === 'ACTIVE' ? 'Active' : updated.status === 'PENDING' ? 'Pending' : 'Suspended',
        }

        res.status(200).json({ success: true, message: 'Admin updated successfully', admin: safeAdmin })
    } catch (error: any) {
        console.error('Update Admin Error:', error)
        res.status(500).json({ message: error.message || 'Internal server error' })
    }
}

// Delete admin or super admin account by super admin
export const deleteAdmin = async (req: Request & { userId?: string }, res: Response) => {
    try {
        // Support both request body and query param
        const id = req.body.id || req.query.id || req.body.productId // fallback

        if (!id) {
            return res.status(400).json({ message: 'Admin ID is required' })
        }

        const existing = await prisma.admin.findUnique({
            where: { id }
        })

        if (!existing) {
            return res.status(404).json({ message: 'Admin not found' })
        }

        // Get logged in admin ID from token
        const authHeader = req.headers.authorization;
        let loggedInAdminId: string | undefined;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
                loggedInAdminId = decoded.id;
            } catch (e) {
                // Ignore decoding error
            }
        }

        if (loggedInAdminId === id) {
            return res.status(400).json({ message: 'You cannot delete your own admin account.' });
        }

        // Prevent deleting the super admin
        if (getSuperAdmin(existing.email)) {
            return res.status(403).json({ message: 'Cannot delete super admin account' })
        }

        await prisma.admin.delete({
            where: { id }
        })

        if (existing.status === 'PENDING') {
            sendRejectionEmail(existing.email, existing.name);
        } else {
            sendAdminRemovalEmail(existing.email, existing.name);
        }

        res.status(200).json({ success: true, message: 'Admin removed successfully' })
    } catch (error: any) {
        console.error('Delete Admin Error:', error)
        res.status(500).json({ message: error.message || 'Internal server error' })
    }
}

// Login for Super Admin
// POST /api/auth/superadmin/login
export const superAdminLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide all fields' })
    }

    const normalizedEmail = email.toLowerCase()
    const superAdminEmails = process.env.SUPER_ADMIN_EMAIL
        ? process.env.SUPER_ADMIN_EMAIL.split(',').map((e) => e.trim().toLowerCase())
        : []

    if (!superAdminEmails.includes(normalizedEmail)) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || ''
    if (password !== superAdminPassword) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Ensure Super Admin exists in the database so that foreign keys and device tokens work
    let dbSuperAdmin = await prisma.admin.findUnique({ where: { email: normalizedEmail } });
    if (!dbSuperAdmin) {
        dbSuperAdmin = await prisma.admin.create({
            data: {
                id: `superadmin-${normalizedEmail}`,
                name: 'Super Admin',
                email: normalizedEmail,
                password: await bcrypt.hash(superAdminPassword, 10),
                role: 'SUPER_ADMIN',
                status: 'ACTIVE'
            }
        });
    }

    const adminData = {
        id: `superadmin-${normalizedEmail}`,
        name: 'Super Admin',
        email: normalizedEmail,
        isSuperAdmin: true,
    }

    const token = generateToken({ id: adminData.id, email: adminData.email, role: 'superadmin' })

    return res.status(200).json({ message: 'Super admin login successful', admin: adminData, token })
}

// Get logged in admin profile
export const getAdminProfile = async (req: Request & { admin?: any }, res: Response) => {
    try {
        if (!req.admin) {
            return res.status(401).json({ message: 'Unauthorized' })
        }
        res.status(200).json(req.admin)
    } catch (error: any) {
        console.error('Get Admin Profile Error:', error)
        res.status(500).json({ message: error.message || 'Internal server error' })
    }
}

// Update user status by super admin
export const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const { id, status } = req.body;

        if (!id) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const existing = await prisma.user.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({ message: 'User not found' });
        }

        const dbStatus = status === 'Active' || status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED';

        const updated = await prisma.user.update({
            where: { id },
            data: { status: dbStatus }
        });

        if (existing.status !== updated.status) {
            sendUserSuspensionEmail(updated.email, updated.name, updated.status);
        }

        res.status(200).json({
            success: true,
            message: 'User status updated successfully',
            user: {
                id: updated.id,
                name: updated.name,
                email: updated.email,
                status: updated.status === 'ACTIVE' ? 'Active' : 'Suspended'
            }
        });
    } catch (error: any) {
        console.error('Update User Status Error:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
}
