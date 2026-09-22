import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/global_gold_live',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  goldApi: {
    provider: process.env.GOLD_API_PROVIDER || 'goldprice-dev',
    baseUrl: process.env.GOLD_API_BASE_URL || 'https://api.goldprice.dev/v1',
    apiKey: process.env.GOLD_API_KEY || '',
    refreshInterval: parseInt(process.env.GOLD_API_REFRESH_INTERVAL || '60000', 10),
  },
  fastForex: {
    apiKey: process.env.FASTFOREX_API_KEY || 'ed1ebbd296-f60d61f339-tllrbu',
    baseUrl: process.env.FASTFOREX_BASE_URL || 'https://api.fastforex.io',
    cacheTtlMs: parseInt(process.env.FASTFOREX_CACHE_TTL_MS || '60000', 10),
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE !== 'false', // true for 465, false for 587
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '"Gold Live" <noreply@goldlive.app>',
  },
};
