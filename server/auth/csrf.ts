import { type Request, type Response, type NextFunction } from 'express';

// Optional: require X-CSRF-Token header for state-changing routes when SameSite isn't strict.
export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  const token = req.header('X-CSRF-Token');
  if (!token) return res.status(403).json({ error: 'Missing CSRF token' });
  // In a real app, validate token value (e.g., match cookie). Here we just check presence.
  next();
}