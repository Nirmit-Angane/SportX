import { Request, Response } from 'express';
import { query } from '../db';
import { sendSuccess, sendError } from '../utils/helpers';

export const getAllMatches = async (req: Request, res: Response) => {
  try {
    const eventId = req.query.event_id;
    let queryStr = `
      SELECT m.*, 
             t1.name as home_team_name, t1.logo as home_team_logo,
             t2.name as away_team_name, t2.logo as away_team_logo,
             v.name as venue_name,
             ms.home_score, ms.away_score, ms.timer
      FROM matches m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      LEFT JOIN venues v ON m.venue_id = v.id
      LEFT JOIN match_scores ms ON m.id = ms.match_id
    `;
    let result;
    if (eventId) {
      queryStr += ' WHERE m.event_id = $1 ORDER BY m.match_date ASC, m.match_time ASC';
      result = await query(queryStr, [eventId]);
    } else {
      queryStr += ' ORDER BY m.match_date ASC, m.match_time ASC';
      result = await query(queryStr);
    }
    sendSuccess(res, result.rows);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const getMatchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const queryStr = `
      SELECT m.*, 
             t1.name as home_team_name, t1.logo as home_team_logo,
             t2.name as away_team_name, t2.logo as away_team_logo,
             v.name as venue_name,
             ms.home_score, ms.away_score, ms.timer
      FROM matches m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      LEFT JOIN venues v ON m.venue_id = v.id
      LEFT JOIN match_scores ms ON m.id = ms.match_id
      WHERE m.id = $1
    `;
    const result = await query(queryStr, [id]);
    if (result.rows.length === 0) return sendError(res, 'Match not found', 404);
    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const createMatch = async (req: Request, res: Response) => {
  try {
    const { event_id, sport_id, home_team_id, away_team_id, venue_id, match_date, match_time, round, status } = req.body;
    if (home_team_id !== undefined && away_team_id !== undefined && home_team_id === away_team_id) {
        return sendError(res, 'Home team cannot be the same as away team', 400);
    }

    const result = await query(
      `INSERT INTO matches (event_id, sport_id, home_team_id, away_team_id, venue_id, match_date, match_time, round, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [event_id, sport_id, home_team_id, away_team_id, venue_id, match_date, match_time, round, status || 'SCHEDULED']
    );
    
    // Create an empty score record
    await query(`INSERT INTO match_scores (match_id) VALUES ($1)`, [result.rows[0].id]);
    
    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const updateMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { event_id, sport_id, home_team_id, away_team_id, venue_id, match_date, match_time, round, status } = req.body;
    
    const result = await query(
      `UPDATE matches SET 
       event_id = COALESCE($1, event_id), 
       sport_id = COALESCE($2, sport_id), 
       home_team_id = COALESCE($3, home_team_id), 
       away_team_id = COALESCE($4, away_team_id), 
       venue_id = COALESCE($5, venue_id), 
       match_date = COALESCE($6, match_date), 
       match_time = COALESCE($7, match_time), 
       round = COALESCE($8, round), 
       status = COALESCE($9, status)
       WHERE id = $10 RETURNING *`,
      [event_id, sport_id, home_team_id, away_team_id, venue_id, match_date, match_time, round, status, id]
    );
    if (result.rows.length === 0) return sendError(res, 'Match not found', 404);
    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const deleteMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM matches WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return sendError(res, 'Match not found', 404);
    sendSuccess(res, { deleted: true });
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const startMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(`UPDATE matches SET status = 'LIVE' WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) return sendError(res, 'Match not found', 404);
    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const endMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(`UPDATE matches SET status = 'COMPLETED' WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) return sendError(res, 'Match not found', 404);
    
    // Also update standings logic here theoretically, but simple version is enough for now.
    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};
