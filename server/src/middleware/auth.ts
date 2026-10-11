import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/helpers';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const token = req.cookies?.token || bearerToken;

  if (!token) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // @ts-ignore
    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token', 401);
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    // @ts-ignore
    if (req.user && req.user.role === 'ADMIN') {
      next();
    } else {
      return sendError(res, 'Administrator permissions required', 403);
    }
  });
};

export const requireMatchOperator = (req: Request, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    // @ts-ignore
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'MATCH_OPERATOR')) {
      next();
    } else {
      return sendError(res, 'Match Operator permissions required', 403);
    }
  });
};
