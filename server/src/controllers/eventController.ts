import { Request, Response } from 'express';
import { query } from '../db';
import { sendSuccess, sendError } from '../utils/helpers';

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM events ORDER BY start_date ASC');
    sendSuccess(res, result.rows);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM events WHERE id = $1', [id]);
    if (result.rows.length === 0) return sendError(res, 'Event not found', 404);
    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { name, sport_id, description, start_date, end_date, location, organizer, status, logo } = req.body;
    const result = await query(
      `INSERT INTO events (name, sport_id, description, start_date, end_date, location, organizer, status, logo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, sport_id, description, start_date, end_date, location, organizer, status || 'UPCOMING', logo]
    );
    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, sport_id, description, start_date, end_date, location, organizer, status, logo } = req.body;
    const result = await query(
      `UPDATE events SET 
       name = COALESCE($1, name), 
       sport_id = COALESCE($2, sport_id), 
       description = COALESCE($3, description), 
       start_date = COALESCE($4, start_date), 
       end_date = COALESCE($5, end_date), 
       location = COALESCE($6, location), 
       organizer = COALESCE($7, organizer), 
       status = COALESCE($8, status), 
       logo = COALESCE($9, logo)
       WHERE id = $10 RETURNING *`,
      [name, sport_id, description, start_date, end_date, location, organizer, status, logo, id]
    );
    if (result.rows.length === 0) return sendError(res, 'Event not found', 404);
    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM events WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return sendError(res, 'Event not found', 404);
    sendSuccess(res, { deleted: true });
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const getStandings = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT s.*, t.name as team_name, t.logo as team_logo 
       FROM standings s
       JOIN teams t ON s.team_id = t.id
       WHERE s.event_id = $1
       ORDER BY s.points DESC, s.goal_difference DESC, s.goals_for DESC`,
      [id]
    );
    sendSuccess(res, result.rows);
  } catch (err: any) {
    sendError(res, err.message);
  }
};
