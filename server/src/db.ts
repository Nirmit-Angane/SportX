import { newDb } from 'pg-mem';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Create an in-memory database
const memDb = newDb();

// Read schema and seed files
const schemaSql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
const seedSql = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf8');

try {
    // Run schema and seed
    memDb.public.none(schemaSql);
    memDb.public.none(seedSql);
    console.log("In-memory database initialized with schema and seed data!");

    // Restore any custom generated brackets
    const customBracketsPath = path.join(__dirname, '../../database/custom_brackets.sql');
    if (fs.existsSync(customBracketsPath)) {
        const customSql = fs.readFileSync(customBracketsPath, 'utf8');
        if (customSql.trim()) {
            memDb.public.none(customSql);
            console.log("Restored custom brackets from persistent storage.");
        }
    }
} catch (err: any) {
    console.error("Error initializing in-memory DB:", err.message);
}

// Export a connection pool emulator compatible with 'pg'
const { Pool } = memDb.adapters.createPg();
export const pool = new Pool();

// Export the query helper
export const query = (text: string, params?: any[]) => pool.query(text, params);
