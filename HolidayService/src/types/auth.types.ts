import { Request } from 'express';

export interface JWTPayload {
    sub: string;      
    id: string;       
    name: string;     
    role: string;     
    iat?: number;     
    exp?: number;     
}

export interface AuthRequest extends Request {
    user?: JWTPayload;
}
