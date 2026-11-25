import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import {
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../helpers/emailHelper.js';
import { generateOneTimeToken, hashToken, signAuthToken } from './tokenService.js';

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// Compared against when the email is unknown, so a missing account takes as long
// to reject as a wrong password. This stops attackers from discovering which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', env.bcryptRounds);

/** Emails are sent in the background. A mail failure must never break the request. */
const sendInBackground = (promise, description, userId) => {
  promise.catch((error) => logger.error(`Failed to send ${description}`, { userId, error: error.message }));
};

export async function register({ name, email, password }) {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  const { token, hash } = generateOneTimeToken();

  const user = await User.create({
    name,
    email,
    passwordHash,
    emailVerifyTokenHash: hash,
    emailVerifyExpires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
  });

  sendInBackground(sendVerificationEmail(user, token), 'verification email', user.id);
  return user;
}

export async function login({ email, password }) {
  const user = await User.findOne({ where: { email } });

  const passwordMatches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !passwordMatches) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated. Please contact support.', 403);
  }

  if (env.requireEmailVerification && !user.isEmailVerified) {
    throw new AppError('Please verify your email address before logging in', 403);
  }

  await user.update({ lastLoginAt: new Date() });
  return { user, token: signAuthToken(user) };
}

export async function verifyEmail(token) {
  const user = await User.findOne({
    where: {
      emailVerifyTokenHash: hashToken(token),
      emailVerifyExpires: { [Op.gt]: new Date() },
    },
  });

  if (!user) {
    throw new AppError('This verification link is invalid or has expired', 400);
  }

  await user.update({
    isEmailVerified: true,
    emailVerifyTokenHash: null,
    emailVerifyExpires: null,
  });
  return user;
}

export async function resendVerification(email) {
  const user = await User.findOne({ where: { email } });
  if (!user || user.isEmailVerified || !user.isActive) return;

  const { token, hash } = generateOneTimeToken();
  await user.update({
    emailVerifyTokenHash: hash,
    emailVerifyExpires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
  });
  sendInBackground(sendVerificationEmail(user, token), 'verification email', user.id);
}

export async function forgotPassword(email) {
  const user = await User.findOne({ where: { email } });
  if (!user || !user.isActive) return;

  const { token, hash } = generateOneTimeToken();
  await user.update({
    passwordResetTokenHash: hash,
    passwordResetExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });
  sendInBackground(sendPasswordResetEmail(user, token), 'password reset email', user.id);
}

export async function resetPassword({ token, password }) {
  const user = await User.findOne({
    where: {
      passwordResetTokenHash: hashToken(token),
      passwordResetExpires: { [Op.gt]: new Date() },
    },
  });

  if (!user) {
    throw new AppError('This reset link is invalid or has expired', 400);
  }

  await user.update({
    passwordHash: await bcrypt.hash(password, env.bcryptRounds),
    passwordResetTokenHash: null,
    passwordResetExpires: null,
    passwordChangedAt: new Date(),
    // Receiving the reset email proves the person owns this inbox.
    isEmailVerified: true,
  });

  sendInBackground(sendPasswordChangedEmail(user), 'password changed email', user.id);
}

export async function changePassword(user, { currentPassword, newPassword }) {
  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    throw new AppError('Current password is incorrect', 400);
  }

  await user.update({
    passwordHash: await bcrypt.hash(newPassword, env.bcryptRounds),
    passwordChangedAt: new Date(),
  });

  sendInBackground(sendPasswordChangedEmail(user), 'password changed email', user.id);
  // A fresh token keeps this device logged in. Older tokens stop working.
  return signAuthToken(user);
}
