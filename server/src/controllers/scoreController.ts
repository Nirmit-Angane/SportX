import { Request, Response } from 'express';
import { query } from '../db';
import { sendSuccess, sendError } from '../utils/helpers';

export const getScore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM match_scores WHERE match_id = $1', [id]);
    if (result.rows.length === 0) return sendError(res, 'Score not found for this match', 404);
    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const updateScore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { home_score, away_score, timer } = req.body;
    
    const result = await query(
      `UPDATE match_scores SET 
       home_score = COALESCE($1, home_score), 
       away_score = COALESCE($2, away_score), 
       timer = COALESCE($3, timer),
       updated_at = CURRENT_TIMESTAMP
       WHERE match_id = $4 RETURNING *`,
      [home_score, away_score, timer, id]
    );
    if (result.rows.length === 0) {
      // If it doesn't exist, insert it (fallback)
      const insertResult = await query(
        `INSERT INTO match_scores (match_id, home_score, away_score, timer) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [id, home_score || 0, away_score || 0, timer || '00:00']
      );
      return sendSuccess(res, insertResult.rows[0]);
    }
    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};
