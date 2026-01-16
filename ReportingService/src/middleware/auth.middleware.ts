import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import jwt from 'jsonwebtoken';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'thIsismysup€rsafes3cretkey123!');
        req.user = decoded as any;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
