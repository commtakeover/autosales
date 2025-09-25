import { Router, type Request, type Response } from 'express';
import { DashboardUserRepository } from '../../db/repositories/DashboardUserRepository.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefresh,
  revokeRefreshToken,
  isRefreshValid
} from '../auth/tokens.js';

const router = Router();

function setRefreshCookie(res: any, refreshToken: string) {
  const name = process.env.REFRESH_COOKIE_NAME || 'rt';
  const secure = String(process.env.REFRESH_COOKIE_SECURE) === 'true';
  const sameSite = (process.env.REFRESH_COOKIE_SAME_SITE || 'lax') as 'lax'|'strict'|'none';

  const { exp } = JSON.parse(Buffer.from(refreshToken.split('.')[1]!, 'base64url').toString());
  const expires = new Date(exp * 1000);

  res.cookie(name, refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    expires,
    path: '/auth'
  });
}

router.post('/login', async (req: Request, res: Response) => {
  const { login, password } = req.body || {};
  if (typeof login !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Login and password required' });
    return;
  }

  // TODO: Change to proper credentials check with database users
  // Demo credentials for testing - remove in production
  if (login === 'admin' && password === 'password') {
    const demoUser = { id: 'demo-user-1', login: 'admin' };
    const accessToken = signAccessToken({ id: demoUser.id, login: demoUser.login });
    const refreshToken = signRefreshToken({ id: demoUser.id });
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ user: demoUser, accessToken });
    return;
  }

  const user = await DashboardUserRepository.verifyCredentials(login, password);
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const accessToken = signAccessToken({ id: user.id, login: user.login });
  const refreshToken = signRefreshToken({ id: user.id });
  setRefreshCookie(res, refreshToken);

  res.status(200).json({ user: { id: user.id, login: user.login }, accessToken });
});

router.post('/refresh', (req: Request, res: Response) => {
  const cookieName = process.env.REFRESH_COOKIE_NAME || 'rt';
  const token = req.cookies?.[cookieName];
  if (!token) {
    res.status(401).json({ error: 'Missing refresh token' });
    return;
  }

  try {
    const payload = verifyRefresh(token); // { sub, jti, ... }
    if (!isRefreshValid(String(payload.jti), String(payload.sub))) {
      res.status(401).json({ error: 'Refresh token invalidated' });
      return;
    }
    revokeRefreshToken(String(payload.jti));
    const accessToken = signAccessToken({ id: String(payload.sub), login: 'masked' });
    const nextRefresh = signRefreshToken({ id: String(payload.sub) });
    setRefreshCookie(res, nextRefresh);
    res.status(200).json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }
});

router.post('/logout', (req: Request, res: Response) => {
  const cookieName = process.env.REFRESH_COOKIE_NAME || 'rt';
  const token = req.cookies?.[cookieName];
  if (token) {
    try {
      const payload: any = verifyRefresh(token);
      if (payload?.jti) revokeRefreshToken(String(payload.jti));
    } catch { /* ignore */ }
  }
  res.clearCookie(cookieName, { path: '/auth' });
  res.status(200).json({ success: true });
});

export default router;
