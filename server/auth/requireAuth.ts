import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyAccess } from './tokens.js';

// Ensures the request is authenticated; attaches user to `req` or responds 401
export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const hdr = req.header('Authorization') || '';
  const [scheme, token] = hdr.split(' ');
  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }
  try {
    const payload = verifyAccess(token);
    (req as any).user = { id: payload.sub as string, login: payload.login as string };
    next();
    return;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
};
