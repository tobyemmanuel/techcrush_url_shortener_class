import crypto from 'node:crypto';
import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './env.js';
import { httpLogStream } from '../utils/logger.js';

morgan.token('id', (req) => req.id);

/** Registers the middleware that every request passes through, in order. */
export function registerMiddleware(app) {
  app.set('trust proxy', env.trustProxy);

  // Give every request an id so one request can be followed through the logs.
  app.use((req, res, next) => {
    req.id = req.get('x-request-id') || crypto.randomUUID();
    res.set('X-Request-Id', req.id);
    next();
  });

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(morgan(':id :method :url :status :res[content-length] - :response-time ms', { stream: httpLogStream }));

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());
}

/** Options shared by res.cookie and res.clearCookie so the two always match. */
export const authCookieOptions = {
  httpOnly: true,
  secure: env.cookie.secure,
  sameSite: env.cookie.sameSite,
  path: '/',
};
