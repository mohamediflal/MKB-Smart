import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../configs/prisma.js'

interface JwtPayload {
	id?: string
	email?: string
	role?: string
	iat?: number
	exp?: number
}

export default async function superAdminAuth(req: Request, res: Response, next: NextFunction) {
	const auth = req.headers.authorization
	if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' })

	const token = auth.split(' ')[1]
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload

		if (decoded.role === 'superadmin') {
			return next()
		}

		if (decoded.id) {
			const admin = await prisma.admin.findUnique({ where: { id: decoded.id } })
			if (admin && admin.role === 'SUPER_ADMIN' && admin.status !== 'SUSPENDED') {
				return next()
			}
		}

		return res.status(403).json({ message: 'Forbidden: requires super admin access' })
	} catch (err) {
		return res.status(401).json({ message: 'Invalid token' })
	}
}
