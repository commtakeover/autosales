import jwt, { type JwtPayload } from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 24);

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || '7d';

type RefreshEntry = { userId: string; expiresAt: number; revoked: boolean };
const refreshAllowlist = new Map<string, RefreshEntry>(); // jti -> entry

export function signAccessToken(user: { id: string; login: string }) {
  // minimal payload; no PII
  return jwt.sign(
    { sub: user.id, login: user.login },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL, issuer: 'squid-auth' }
  );
}

export function signRefreshToken(user: { id: string }) {
  const jti = nanoid();
  const token = jwt.sign(
    { sub: user.id, jti },
    REFRESH_SECRET,
    { expiresIn: REFRESH_TTL, issuer: 'squid-auth' }
  );
  const { exp } = jwt.decode(token) as JwtPayload;
  refreshAllowlist.set(jti, { userId: user.id, expiresAt: (exp as number) * 1000, revoked: false });
  return token;
}

export function verifyAccess(token: string) {
  // Explicit algorithm allowlist
  return jwt.verify(token, ACCESS_SECRET, { issuer: 'squid-auth', algorithms: ['HS256'] }) as JwtPayload;
}

export function verifyRefresh(token: string) {
  return jwt.verify(token, REFRESH_SECRET, { issuer: 'squid-auth', algorithms: ['HS256'] }) as JwtPayload;
}

export function revokeRefreshToken(jti: string) {
  const entry = refreshAllowlist.get(jti);
  if (entry) entry.revoked = true;
}

export function isRefreshValid(jti: string, userId: string) {
  const entry = refreshAllowlist.get(jti);
  if (!entry) return false;
  if (entry.revoked) return false;
  if (entry.userId !== userId) return false;
  if (Date.now() >= entry.expiresAt) return false;
  return true;
}
