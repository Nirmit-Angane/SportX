import { Request, Response } from 'express';
import { query } from '../db';
import { sendSuccess, sendError } from '../utils/helpers';

export const getAllTeams = async (req: Request, res: Response) => {
  try {
    const eventId = req.query.event_id;
    let result;
    if (eventId) {
      result = await query('SELECT * FROM teams WHERE event_id = $1 ORDER BY name ASC', [eventId]);
    } else {
      result = await query('SELECT * FROM teams ORDER BY name ASC');
    }
    sendSuccess(res, result.rows);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, short_name, captain, coach, logo, event_id } = req.body;
    const result = await query(
      `INSERT INTO teams (name, short_name, captain, coach, logo, event_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, short_name, captain, coach, logo, event_id]
    );
    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const updateTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, short_name, captain, coach, logo, event_id } = req.body;
    const result = await query(
      `UPDATE teams SET 
       name = COALESCE($1, name), 
       short_name = COALESCE($2, short_name), 
       captain = COALESCE($3, captain), 
       coach = COALESCE($4, coach), 
       logo = COALESCE($5, logo), 
       event_id = COALESCE($6, event_id)
       WHERE id = $7 RETURNING *`,
      [name, short_name, captain, coach, logo, event_id, id]
    );
    if (result.rows.length === 0) return sendError(res, 'Team not found', 404);
    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM teams WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return sendError(res, 'Team not found', 404);
    sendSuccess(res, { deleted: true });
  } catch (err: any) {
    sendError(res, err.message);
  }
};
