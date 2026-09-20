import { Request, Response } from 'express';
import { query } from '../db';
import { sendSuccess, sendError } from '../utils/helpers';

export const getAllPlayers = async (req: Request, res: Response) => {
  try {
    const teamId = req.query.team_id;
    let result;
    if (teamId) {
      result = await query('SELECT * FROM players WHERE team_id = $1 ORDER BY jersey_number ASC', [teamId]);
    } else {
      result = await query('SELECT * FROM players ORDER BY full_name ASC');
    }
    sendSuccess(res, result.rows);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const createPlayer = async (req: Request, res: Response) => {
  try {
    const { full_name, jersey_number, team_id, position, date_of_birth, photo, status } = req.body;
    const result = await query(
      `INSERT INTO players (full_name, jersey_number, team_id, position, date_of_birth, photo, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [full_name, jersey_number, team_id, position, date_of_birth, photo, status || 'ACTIVE']
    );
    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const updatePlayer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { full_name, jersey_number, team_id, position, date_of_birth, photo, status } = req.body;
    const result = await query(
      `UPDATE players SET 
       full_name = COALESCE($1, full_name), 
       jersey_number = COALESCE($2, jersey_number), 
       team_id = COALESCE($3, team_id), 
       position = COALESCE($4, position), 
       date_of_birth = COALESCE($5, date_of_birth), 
       photo = COALESCE($6, photo),
       status = COALESCE($7, status)
       WHERE id = $8 RETURNING *`,
      [full_name, jersey_number, team_id, position, date_of_birth, photo, status, id]
    );
    if (result.rows.length === 0) return sendError(res, 'Player not found', 404);
    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const deletePlayer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM players WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return sendError(res, 'Player not found', 404);
    sendSuccess(res, { deleted: true });
  } catch (err: any) {
    sendError(res, err.message);
  }
};
