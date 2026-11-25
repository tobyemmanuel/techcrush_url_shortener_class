import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
}

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toBool = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
};

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const port = toInt(process.env.PORT, 3000);

if (isProduction && process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long in production.');
}

export const env = Object.freeze({
  nodeEnv,
  isProduction,
  port,
  // Public base URL used to build short links and email links, without a trailing slash.
  baseUrl: (process.env.BASE_URL || `http://localhost:${port}`).replace(/\/+$/, ''),
  // Where the frontend lives. Password reset emails link here.
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  // Set to 1 when running behind one reverse proxy such as Nginx.
  trustProxy: toInt(process.env.TRUST_PROXY, 0),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  db: {
    url: process.env.DATABASE_URL,
    ssl: toBool(process.env.DB_SSL, false),
    logging: toBool(process.env.DB_LOGGING, false),
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresInDays: toInt(process.env.JWT_EXPIRES_IN_DAYS, 7),
  },

  cookie: {
    name: process.env.COOKIE_NAME || 'token',
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    secure: toBool(process.env.COOKIE_SECURE, isProduction),
    maxAgeMs: toInt(process.env.JWT_EXPIRES_IN_DAYS, 7) * 24 * 60 * 60 * 1000,
  },

  bcryptRounds: toInt(process.env.BCRYPT_ROUNDS, 12),
  requireEmailVerification: toBool(process.env.REQUIRE_EMAIL_VERIFICATION, true),

  cache: {
    ttlMs: toInt(process.env.CACHE_TTL_SECONDS, 300) * 1000,
    negativeTtlMs: toInt(process.env.CACHE_NEGATIVE_TTL_SECONDS, 30) * 1000,
    maxItems: toInt(process.env.CACHE_MAX_ITEMS, 5000),
  },

  rateLimit: {
    enabled: toBool(process.env.RATE_LIMIT_ENABLED, true),
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 15) * 60 * 1000,
    max: toInt(process.env.RATE_LIMIT_MAX, 300),
    authMax: toInt(process.env.RATE_LIMIT_AUTH_MAX, 20),
  },

  email: {
    host: process.env.SMTP_HOST || '',
    port: toInt(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'Short Links <no-reply@localhost>',
  },

  logLevel: process.env.LOG_LEVEL || (isProduction ? 'http' : 'debug'),

  seed: {
    adminName: process.env.ADMIN_NAME || 'Platform Admin',
    adminEmail: (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase(),
    adminPassword: process.env.ADMIN_PASSWORD || 'ChangeMe123',
  },
});
