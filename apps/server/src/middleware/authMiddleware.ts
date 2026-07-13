import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({
            message: 'unauthorized'
        });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!token) {
        return res.status(500).json({
            message: 'token not found'
        });
    }

    if (!secret) {
        return res.status(401).json({
            message: 'jwt_secret not configured'
        });
    }

    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded as AuthUser;
        next();
    } catch (err) {
        console.log('auth middlware error: ', err);
        return res.status(401).json({
            message: 'unauthorized'
        });
    }
}