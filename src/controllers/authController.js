import { env } from '../config/env.js';
import { authCookieOptions } from '../config/middleware.js';
import * as authService from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';

const setAuthCookie = (res, token) =>
  res.cookie(env.cookie.name, token, { ...authCookieOptions, maxAge: env.cookie.maxAgeMs });

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  const user = await authService.register({ name, email, password });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Registration successful. Please check your email to verify your account.',
    data: { user },
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login({ email, password });

  setAuthCookie(res, token);
  return sendSuccess(res, { message: 'Logged in successfully', data: { user } });
};

export const logout = (req, res) => {
  res.clearCookie(env.cookie.name, authCookieOptions);
  return sendSuccess(res, { message: 'Logged out successfully' });
};

export const me = (req, res) => sendSuccess(res, { message: 'Current user', data: { user: req.user } });

export const verifyEmail = async (req, res) => {
  await authService.verifyEmail(req.query.token);
  return sendSuccess(res, { message: 'Email verified. You can now log in.' });
};

// The next two endpoints always give the same answer, whether or not the email exists.
export const resendVerification = async (req, res) => {
  await authService.resendVerification(req.body.email);
  return sendSuccess(res, { message: 'If that account exists and is not verified, a new email has been sent.' });
};

export const forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.body.email);
  return sendSuccess(res, { message: 'If that account exists, a password reset email has been sent.' });
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPassword({ token, password });
  return sendSuccess(res, { message: 'Password reset successful. You can now log in.' });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const token = await authService.changePassword(req.user, { currentPassword, newPassword });

  setAuthCookie(res, token);
  return sendSuccess(res, { message: 'Password changed successfully' });
};
