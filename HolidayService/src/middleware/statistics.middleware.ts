import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const STATISTICS_URL = process.env.STATISTICS_URL || 'https://companypoint.onrender.com/stats';
const STATS_API_KEY = process.env.STATS_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

export const statisticsReportingMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.log(`📊 Reporting to statistics service: ${STATISTICS_URL}`);
    
    // Call statistics endpoint in the background (fire and forget)
    // Don't block the request
    callStatisticsService(req).catch(error => {
        // Log error but don't fail the request
        console.error('❌ Failed to report statistics:', error.message);
    });

    next();
};

async function callStatisticsService(req: Request): Promise<void> {
    try {
        const payload = { klicanaStoritev: `${req.method} ${req.originalUrl}` };
        console.log(`📤 Sending to stats: ${STATISTICS_URL}`, payload);
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        // Prefer real JWT if available; fall back to API key
        if (JWT_SECRET) {
            const token = jwt.sign({ service: 'HolidayService' }, JWT_SECRET, {
                expiresIn: '1h'
            });
            headers.Authorization = `Bearer ${token}`;
        } else if (STATS_API_KEY) {
            headers.Authorization = `Bearer ${STATS_API_KEY}`;
        }

        const response = await axios.post(STATISTICS_URL, payload, {
            timeout: 5000, // 5 second timeout
            headers
        });
        
        console.log('✅ Statistics reported successfully:', response.status);
    } catch (error: any) {
        console.error('❌ Statistics error:', error.response?.data || error.message);
        // Silently fail - statistics shouldn't break the main service
        throw error;
    }
}
