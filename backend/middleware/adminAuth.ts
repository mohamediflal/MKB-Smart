import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../configs/prisma'

interface JwtPayload {
	id?: string
	email?: string
	role?: string
	iat?: number
	exp?: number
}

export default async function adminAuth(req: Request & { admin?: any }, res: Response, next: NextFunction) {
	const auth = req.headers.authorization
	if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' })

	const token = auth.split(' ')[1]
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload

		if (!decoded.id) return res.status(401).json({ message: 'Unauthorized' })

		const admin = await prisma.admin.findUnique({ where: { id: decoded.id } })
		if (!admin) return res.status(401).json({ message: 'Unauthorized' })

		if (admin.status === 'SUSPENDED') {
			return res.status(403).json({ message: 'Your account has been suspended. If you believe this is an error or require further assistance, please contact MKB Support at mkbsmart30@gmail.com.' })
		}

		// Verify that token role matches the actual DB role.
		// If they were promoted/demoted, the token role ('admin' or 'superadmin') will mismatch DB role.
		const tokenRole = decoded.role; // 'admin' or 'superadmin'
		const dbRole = admin.role; // 'ADMIN' or 'SUPER_ADMIN'
		const expectedTokenRole = dbRole === 'SUPER_ADMIN' ? 'superadmin' : 'admin';

		if (tokenRole !== expectedTokenRole) {
			return res.status(403).json({ message: 'Your account role has been updated. Please log in again to apply changes.' })
		}

		const safeAdmin: any = { ...admin }
		delete safeAdmin.password
		safeAdmin.isSuperAdmin = admin.role === 'SUPER_ADMIN'

		req.admin = safeAdmin
		next()
	} catch (err) {
		return res.status(401).json({ message: 'Invalid token' })
	}
}
