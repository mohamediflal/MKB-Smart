import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../configs/prisma'

interface JwtPayload {
	id?: string
	iat?: number
	exp?: number
}

export default async function userAuth(req: Request & { userId?: string }, res: Response, next: NextFunction) {
	const auth = req.headers.authorization

	// Check for Bearer token
	if (!auth || !auth.startsWith('Bearer ')) {
		return res.status(401).json({ success: false, message: 'Unauthorized. Login again.' })
	}

	const token = auth.split(' ')[1]

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload

		if (!decoded.id) {
			return res.status(401).json({ success: false, message: 'Unauthorized. Login again.' })
		}

		// Fetch user to verify they still exist and are not suspended
		const user = await prisma.user.findUnique({ where: { id: decoded.id } })
		if (!user) {
			return res.status(401).json({ success: false, message: 'Unauthorized. User not found.' })
		}

		if (user.status === 'SUSPENDED') {
			return res.status(403).json({
				success: false,
				message: 'Your account has been suspended. If you believe this is an error or require further assistance, please contact MKB Support at mkbsmart30@gmail.com.'
			})
		}

		// Attach user ID to request for use in controllers
		req.userId = decoded.id
		next()
	} catch (error: any) {
		return res.status(401).json({ success: false, message: 'Invalid token' })
	}
}
