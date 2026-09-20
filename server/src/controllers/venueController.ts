import { Request, Response } from 'express';
import { query } from '../db';
import { sendSuccess, sendError } from '../utils/helpers';

export const getAllVenues = async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM venues ORDER BY name ASC');
    sendSuccess(res, result.rows);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const createVenue = async (req: Request, res: Response) => {
  try {
    const { name, address, city, capacity, sport, status } = req.body;
    const result = await query(
      `INSERT INTO venues (name, address, city, capacity, sport, status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, address, city, capacity, sport, status || 'ACTIVE']
    );
    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const updateVenue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, city, capacity, sport, status } = req.body;
    const result = await query(
      `UPDATE venues SET 
       name = COALESCE($1, name), 
       address = COALESCE($2, address), 
       city = COALESCE($3, city), 
       capacity = COALESCE($4, capacity), 
       sport = COALESCE($5, sport), 
       status = COALESCE($6, status)
       WHERE id = $7 RETURNING *`,
      [name, address, city, capacity, sport, status, id]
    );
    if (result.rows.length === 0) return sendError(res, 'Venue not found', 404);
    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const deleteVenue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM venues WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return sendError(res, 'Venue not found', 404);
    sendSuccess(res, { deleted: true });
  } catch (err: any) {
    sendError(res, err.message);
  }
};
