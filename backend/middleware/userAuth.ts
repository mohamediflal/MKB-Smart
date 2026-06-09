import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface JwtPayload {
	id?: string
	iat?: number
	exp?: number
}

export default function userAuth(req: Request & { userId?: string }, res: Response, next: NextFunction) {
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

		// Attach user ID to request for use in controllers
		req.userId = decoded.id
		next()
	} catch (error: any) {
		return res.status(401).json({ success: false, message: 'Invalid token' })
	}
}
