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

        await prisma.user.delete({
            where: { id }
        });

        res.status(200).json({ success: true, message: 'User removed successfully' });
    } catch (error: any) {
        console.error('Delete User Error:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
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

    if (admin.status === 'SUSPENDED') {
        return res.status(403).json({ message: 'Your admin account has been suspended' })
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
    try {
        const admins = await prisma.admin.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        })

        const mappedAdmins = admins.map(a => {
            const isSuperAdmin = getSuperAdmin(a.email)
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

// Update admin details by super admin
export const updateAdmin = async (req: Request & { userId?: string }, res: Response) => {
    try {
        const { id, name, status } = req.body

        if (!id) {
            return res.status(400).json({ message: 'Admin ID is required' })
        }

        const data: any = {}
        if (name) data.name = name.trim()
        if (status) {
            data.status = status === 'Active' || status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED'
        }

        const updated = await prisma.admin.update({
            where: { id },
            data
        })

        const isSuperAdmin = getSuperAdmin(updated.email)
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

// Delete admin account by super admin
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

        // Prevent deleting the super admin
        if (getSuperAdmin(existing.email)) {
            return res.status(403).json({ message: 'Cannot delete super admin account' })
        }

        await prisma.admin.delete({
            where: { id }
        })

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

        const dbStatus = status === 'Active' || status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED';

        const updated = await prisma.user.update({
            where: { id },
            data: { status: dbStatus }
        });

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
