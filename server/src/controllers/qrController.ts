import { Request, Response } from 'express';
import { query } from '../db';
import { sendSuccess, sendError } from '../utils/helpers';

// Helper to generate the URL based on type
const generateQRUrl = (type: string, id: string) => {
  const baseUrl = process.env.WEB_URL || 'http://localhost:3000';
  return `${baseUrl}/${type.toLowerCase()}.html?id=${id}`;
};

const saveQR = async (type: string, id: string, url: string) => {
  const result = await query(
    `INSERT INTO qr_codes (type, target_id, url) VALUES ($1, $2, $3) RETURNING *`,
    [type, id, url]
  );
  return result.rows[0];
};

export const generateEventQR = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const url = generateQRUrl('EVENT', id);
    const qrCode = await saveQR('EVENT', id, url);
    sendSuccess(res, qrCode);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const generateMatchQR = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const url = generateQRUrl('MATCH', id);
    const qrCode = await saveQR('MATCH', id, url);
    sendSuccess(res, qrCode);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const generateVenueQR = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const url = generateQRUrl('VENUE', id);
    const qrCode = await saveQR('VENUE', id, url);
    sendSuccess(res, qrCode);
  } catch (err: any) {
    sendError(res, err.message);
  }
};
