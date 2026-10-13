import 'dotenv/config';
function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 4000),
  DATABASE_URL: required('DATABASE_URL'),
  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL || '15m',
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL || '30d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
};
