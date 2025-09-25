import type { Request, Response, NextFunction } from "express";
import fs from "fs";

export function logRequests(req: Request, res: Response, next: NextFunction) {
    try {
        const method = req.method;
        console.log("🏦 req.originalUrl:", req.originalUrl)
        const url = req.originalUrl;
    
        console.log("🏦 url:", url)

        if (url === '/' && method === 'POST') {
            console.log("🏦 logRequests - if (url === '/' && method === 'POST')")
            const timestamp = new Date().toISOString();
            const logEntry = `\n=== POST / Request ===\nTimestamp: ${timestamp}\nMethod: ${method}\nURL: ${url}\nBody:\n${JSON.stringify(req.body, null, 2)}\n======================\n`;
            fs.appendFile('post_root_requests.log', logEntry, (err) => {
                if (err) {
                    // TODO: Consider better error handling/reporting in production
                    console.error('Failed to write POST / log:', err);
                }
            });
        }
    } catch (error) {
        console.error('Error logging request:\n+ + + + + + + + + + + + + +', error);
    }
    next();
}
