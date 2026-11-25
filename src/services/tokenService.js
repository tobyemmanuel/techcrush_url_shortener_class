import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/** Session token stored in the auth cookie. */
export const signAuthToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: `${env.jwt.expiresInDays}d`,
  });

export const verifyAuthToken = (token) =>
  jwt.verify(token, env.jwt.secret, { algorithms: ['HS256'] });

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * One-time tokens for email verification and password reset.
 * The raw token goes in the email. Only its hash is stored, so a database leak
 * does not give an attacker working reset links.
 */
export const generateOneTimeToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: hashToken(token) };
};
