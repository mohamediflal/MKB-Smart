import { Request, Response } from 'express';
import { prisma } from '../configs/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
    const { name, email, password, role, isAdmin } = req.body;

    // Reject admin account creation through the public user register route.
    if (role === 'admin' || role === 'superadmin' || isAdmin === true) {
        return res.status(400).json({ message: 'Use the admin registration endpoint for admin accounts' });
    }

    // Validate input
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Please provide all fields" });
    }

    const normalizedEmail = email.toLowerCase();

    // Prevent user registration using super admin email
    const superAdminEmails = process.env.SUPER_ADMIN_EMAIL
        ? process.env.SUPER_ADMIN_EMAIL.split(',').map((e) => e.trim().toLowerCase())
        : [];

    if (superAdminEmails.includes(normalizedEmail)) {
        return res.status(400).json({ message: 'Cannot register super admin email through user registration' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
    }

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

}

// update user details by user themselves
export const updateUser = async (req: Request & { userId?: string }, res: Response) => {

}

// delete user account by super admin or by user themselves
export const deleteUser = async (req: Request & { userId?: string }, res: Response) => {

}



//Register for admin
//POST /api/auth/adminRegister
export const adminRegister = async (req: Request, res: Response) => {
    const { name, email, password } = req.body

    // Validate input
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide all fields' })
    }

    const normalizedEmail = email.toLowerCase()

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

    const admin = await prisma.admin.create({
        data: {
            name,
            email: normalizedEmail,
            password: hashedPassword,
        },
    })

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

    const superAdminEmails = process.env.SUPER_ADMIN_EMAIL
        ? process.env.SUPER_ADMIN_EMAIL.split(',').map((e) => e.trim().toLowerCase())
        : []

    if (superAdminEmails.includes(normalizedEmail)) {
        return res.status(403).json({ message: 'Use the super admin login endpoint' })
    }

    const admin = await prisma.admin.findUnique({ where: { email: normalizedEmail } })

    if (!admin) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
        return res.status(401).json({ message: 'Wrong password' })
    }

    const token = generateToken({ id: admin.id, email: admin.email, role: 'admin' })

    const adminData: any = { ...admin }
    delete adminData.password
    adminData.isSuperAdmin = getSuperAdmin(adminData.email)

    res.status(200).json({ message: 'Admin login successful', admin: adminData, token })
}

// show all admins for super admin only
export const listAdmins = async (req: Request & { userId?: string }, res: Response) => {

}

// Update admin details by super admin or by admin themselves
export const updateAdmin = async (req: Request & { userId?: string }, res: Response) => {

}

// Delete admin account by super admin
export const deleteAdmin = async (req: Request & { userId?: string }, res: Response) => {

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

    const adminData = {
        id: `superadmin-${normalizedEmail}`,
        name: 'Super Admin',
        email: normalizedEmail,
        isSuperAdmin: true,
    }

    const token = generateToken({ id: adminData.id, email: adminData.email, role: 'superadmin' })

    return res.status(200).json({ message: 'Super admin login successful', admin: adminData, token })
}
