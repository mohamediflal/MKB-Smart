import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface JwtPayload {
	id?: string
	email?: string
	role?: string
	iat?: number
	exp?: number
}

export default function superAdminAuth(req: Request, res: Response, next: NextFunction) {
	const auth = req.headers.authorization
	if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' })

	const token = auth.split(' ')[1]
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload

		const normalizedEmail = (decoded.email || '').toLowerCase()
		const superAdminEmails = process.env.SUPER_ADMIN_EMAIL
			? process.env.SUPER_ADMIN_EMAIL.split(',').map(e => e.trim().toLowerCase())
			: []

		if (decoded.role === 'superadmin' || superAdminEmails.includes(normalizedEmail)) {
			return next()
		}

		return res.status(403).json({ message: 'Forbidden: requires super admin access' })
	} catch (err) {
		return res.status(401).json({ message: 'Invalid token' })
	}
}
