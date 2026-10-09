import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { pool } from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigin = process.env.FRONTEND_URL || true;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Private-Network', 'true');
  next();
});
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Main router
app.use('/api', routes);

// Database connection test
pool.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database');
  })
  .catch((err: any) => {
    console.error('Database connection error:', err.message);
    console.error('Ensure PostgreSQL is running and credentials are correct.');
  });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
