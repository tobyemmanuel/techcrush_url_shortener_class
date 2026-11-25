import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import winston from 'winston';
import { env } from '../config/env.js';

const logsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../logs');
fs.mkdirSync(logsDir, { recursive: true });

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: time, stack, ...meta }) => {
    const extra = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${time} ${level}: ${stack || message}${extra}`;
  }),
);

const fileOptions = { maxsize: 5 * 1024 * 1024, maxFiles: 5 };

export const logger = winston.createLogger({
  level: env.logLevel,
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error', ...fileOptions }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log'), ...fileOptions }),
  ],
  exitOnError: false,
});

if (env.nodeEnv !== 'test') {
  logger.add(new winston.transports.Console({ format: consoleFormat }));
}

/** Lets morgan write its request lines through winston. */
export const httpLogStream = {
  write: (message) => logger.http(message.trim()),
};
