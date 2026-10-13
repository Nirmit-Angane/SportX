import { Pool } from 'pg';
import path from 'path';
import dotenv from 'dotenv';

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../server/.env') });
dotenv.config();

const DEFAULT_DATABASE_URL = 'postgresql://sportx_jg4g_user:qL7le915KtvQ8N6xNnmKGoRongaCVKdj@dpg-danr8m142hec73feuvcg-a.oregon-postgres.render.com/sportx_jg4g';
const connectionString = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

const isRemote = Boolean(connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));

export const pool = new Pool({
  connectionString,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

