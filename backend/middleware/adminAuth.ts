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

		// Super admin tokens may have role 'superadmin'
		if (decoded.role === 'superadmin') {
			req.admin = { id: decoded.id, email: decoded.email, isSuperAdmin: true }
			return next()
		}

		if (!decoded.id) return res.status(401).json({ message: 'Unauthorized' })

		const admin = await prisma.admin.findUnique({ where: { id: decoded.id } })
		if (!admin) return res.status(401).json({ message: 'Unauthorized' })

		const safeAdmin: any = { ...admin }
		delete safeAdmin.password
		safeAdmin.isSuperAdmin = (process.env.SUPER_ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase()).includes((safeAdmin.email || '').toLowerCase())

		req.admin = safeAdmin
		next()
	} catch (err) {
		return res.status(401).json({ message: 'Invalid token' })
	}
}
