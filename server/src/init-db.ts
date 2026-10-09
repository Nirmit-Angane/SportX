import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function initDB() {
    const defaultDbClient = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: 'postgres' // connect to default db first to create the new one
    });

    try {
        console.log("Connecting to PostgreSQL...");
        await defaultDbClient.connect();
        
        console.log("Creating sportx database if it doesn't exist...");
        // Check if DB exists
        const res = await defaultDbClient.query("SELECT 1 FROM pg_database WHERE datname = 'sportx'");
        if (res.rowCount === 0) {
            await defaultDbClient.query('CREATE DATABASE sportx');
            console.log("Created database 'sportx'.");
        } else {
            console.log("Database 'sportx' already exists.");
        }
    } catch (err: any) {
        console.error("Failed to connect or create database. Is PostgreSQL running?", err.message);
        process.exit(1);
    } finally {
        await defaultDbClient.end();
    }

    // Now connect to the sportx database to run schema and seed
    const sportxClient = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'sportx'
    });

    try {
        await sportxClient.connect();
        
        console.log("Running schema.sql...");
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await sportxClient.query(schemaSql);
        console.log("Schema applied.");

        console.log("Running seed.sql...");
        const seedPath = path.join(__dirname, '../../database/seed.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await sportxClient.query(seedSql);
        console.log("Seed data inserted.");

        console.log("Database initialization complete!");
    } catch (err: any) {
        console.error("Error running scripts:", err.message);
    } finally {
        await sportxClient.end();
    }
}

initDB();
