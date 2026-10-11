import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { sendSuccess, sendError } from '../utils/helpers';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return sendError(res, 'Username and password are required', 400);
    }

    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const isProd = process.env.NODE_ENV === 'production';
    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    sendSuccess(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const logout = (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax'
  });
  sendSuccess(res, { message: 'Logged out successfully' });
};

export const me = (req: Request, res: Response) => {
  // @ts-ignore
  if (req.user) {
    // @ts-ignore
    sendSuccess(res, { user: req.user });
  } else {
    sendError(res, 'Not authenticated', 401);
  }
};
