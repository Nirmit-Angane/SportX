import { Response } from 'express';

export const sendSuccess = (res: Response, data: any = {}) => {
  return res.json({
    success: true,
    data
  });
};

export const sendError = (res: Response, message: string, statusCode: number = 500) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};
