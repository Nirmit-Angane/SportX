import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { query } from '../db';
import { sendSuccess, sendError } from '../utils/helpers';

export const getAllMatches = async (req: Request, res: Response) => {
  try {
    const eventId = req.query.event_id ? parseInt(req.query.event_id as string, 10) : undefined;
    let queryStr = `
      SELECT m.*, 
             t1.name as home_team_name, t1.short_name as home_team_short, t1.logo as home_team_logo,
             t2.name as away_team_name, t2.short_name as away_team_short, t2.logo as away_team_logo,
             v.name as venue_name,
             e.name as event_name,
             ms.home_score, ms.away_score, ms.timer
      FROM matches m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      LEFT JOIN venues v ON m.venue_id = v.id
      LEFT JOIN events e ON m.event_id = e.id
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
             t1.name as home_team_name, t1.short_name as home_team_short, t1.logo as home_team_logo,
             t2.name as away_team_name, t2.short_name as away_team_short, t2.logo as away_team_logo,
             v.name as venue_name,
             e.name as event_name,
             ms.home_score, ms.away_score, ms.timer
      FROM matches m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      LEFT JOIN venues v ON m.venue_id = v.id
      LEFT JOIN events e ON m.event_id = e.id
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
    
    // Ensure timer is active
    await query(`UPDATE match_scores SET timer = '00:01' WHERE match_id = $1 AND (timer IS NULL OR timer = '00:00')`, [id]);

    // Record kickoff event if none exists
    const eventsCheck = await query(`SELECT id FROM match_events WHERE match_id = $1 AND type = 'KICKOFF'`, [id]);
    if (eventsCheck.rows.length === 0) {
      await query(
        `INSERT INTO match_events (match_id, minute, type, description) VALUES ($1, '00''', 'KICKOFF', 'Match officially kicked off')`,
        [id]
      );
    }

    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const breakMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(`UPDATE matches SET status = 'HALFTIME' WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) return sendError(res, 'Match not found', 404);

    await query(
      `INSERT INTO match_events (match_id, minute, type, description) VALUES ($1, '45''', 'HALFTIME', 'Referee blows whistle for Halftime / Interval break')`,
      [id]
    );

    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const endMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { home_score, away_score, winner_id } = req.body || {};

    // Update scores if provided
    if (home_score !== undefined && away_score !== undefined) {
      await query(
        `UPDATE match_scores SET home_score = $1, away_score = $2, timer = '90:00', updated_at = CURRENT_TIMESTAMP WHERE match_id = $3`,
        [home_score, away_score, id]
      );
    } else {
      await query(`UPDATE match_scores SET timer = '90:00', updated_at = CURRENT_TIMESTAMP WHERE match_id = $1`, [id]);
    }

    const result = await query(`UPDATE matches SET status = 'COMPLETED' WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) return sendError(res, 'Match not found', 404);
    
    const match = result.rows[0];
    let advancedInfo: any = {};
    
    // Auto-advance bracket logic
    if (match.round && match.round.startsWith('Bracket:')) {
        const scoreRes = await query(`SELECT home_score, away_score FROM match_scores WHERE match_id = $1`, [id]);
        if (scoreRes.rows.length > 0) {
            const hScore = scoreRes.rows[0].home_score ?? 0;
            const aScore = scoreRes.rows[0].away_score ?? 0;
            let winnerId = winner_id || null;
            if (!winnerId) {
                if (hScore > aScore) winnerId = match.home_team_id;
                else if (aScore > hScore) winnerId = match.away_team_id;
                else winnerId = match.home_team_id; 
            }
            
            if (winnerId) {
                let nextRound = null;
                let nextSlot = null; // 'home_team_id' or 'away_team_id'
                
                if (match.round === 'Bracket: QF 1') { nextRound = 'Bracket: SF 1'; nextSlot = 'home_team_id'; }
                if (match.round === 'Bracket: QF 2') { nextRound = 'Bracket: SF 1'; nextSlot = 'away_team_id'; }
                if (match.round === 'Bracket: QF 3') { nextRound = 'Bracket: SF 2'; nextSlot = 'home_team_id'; }
                if (match.round === 'Bracket: QF 4') { nextRound = 'Bracket: SF 2'; nextSlot = 'away_team_id'; }
                if (match.round === 'Bracket: SF 1') { nextRound = 'Bracket: Final'; nextSlot = 'home_team_id'; }
                if (match.round === 'Bracket: SF 2') { nextRound = 'Bracket: Final'; nextSlot = 'away_team_id'; }
                
                if (nextRound && nextSlot) {
                    await query(`UPDATE matches SET ${nextSlot} = $1 WHERE event_id = $2 AND round = $3`, [winnerId, match.event_id, nextRound]);
                    
                    const winnerTeamRes = await query(`SELECT name FROM teams WHERE id = $1`, [winnerId]);
                    const winnerName = winnerTeamRes.rows[0]?.name || 'Winner';
                    advancedInfo = {
                        winner_id: winnerId,
                        winner_name: winnerName,
                        advanced_to: nextRound,
                        slot: nextSlot
                    };
                }
            }
        }
    }

    // Record full time event
    await query(
      `INSERT INTO match_events (match_id, minute, type, description) VALUES ($1, '90''', 'FULLTIME', 'Match officially concluded. Full-time whistle blown.')`,
      [id]
    );
    
    sendSuccess(res, { ...match, ...advancedInfo });
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const getMatchEvents = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT me.*, t.name as team_name 
       FROM match_events me
       LEFT JOIN teams t ON me.team_id = t.id
       WHERE me.match_id = $1 
       ORDER BY me.id ASC`,
      [id]
    );
    sendSuccess(res, result.rows);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const addMatchEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { minute, type, team_id, player_name, description } = req.body;
    
    if (!minute || !type) {
      return sendError(res, 'Minute and event type are required', 400);
    }

    const result = await query(
      `INSERT INTO match_events (match_id, minute, type, team_id, player_name, description) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, minute, type, team_id || null, player_name || null, description || '']
    );

    // If event is a GOAL, update the score automatically
    if (type === 'GOAL' && team_id) {
      const matchRes = await query(`SELECT home_team_id, away_team_id FROM matches WHERE id = $1`, [id]);
      if (matchRes.rows.length > 0) {
        const m = matchRes.rows[0];
        if (m.home_team_id == team_id) {
          await query(`UPDATE match_scores SET home_score = home_score + 1, updated_at = CURRENT_TIMESTAMP WHERE match_id = $1`, [id]);
        } else if (m.away_team_id == team_id) {
          await query(`UPDATE match_scores SET away_score = away_score + 1, updated_at = CURRENT_TIMESTAMP WHERE match_id = $1`, [id]);
        }
      }
    }

    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    sendError(res, err.message);
  }
};


export const generateBracket = async (req: Request, res: Response) => {
  try {
    const { event_id } = req.body;
    const eventId = parseInt(event_id, 10);
    if (!eventId || isNaN(eventId)) return sendError(res, 'Valid event_id is required', 400);
    
    let teamsRes = await query(`SELECT id FROM teams WHERE event_id = $1 LIMIT 8`, [eventId]);
    let teams = teamsRes.rows;
    if (teams.length < 8) {
      teamsRes = await query(`SELECT id FROM teams LIMIT 8`);
      teams = teamsRes.rows;
    }
    if (teams.length < 8) return sendError(res, 'Need at least 8 registered teams in the system to generate a QF bracket', 400);

    // Delete existing bracket for this event
    await query(`DELETE FROM matches WHERE event_id = $1 AND round LIKE 'Bracket:%'`, [eventId]);

    let sqlPersist = `DELETE FROM matches WHERE event_id = ${eventId} AND round LIKE 'Bracket:%';\n`;

    const qfRounds = ['Bracket: QF 1', 'Bracket: QF 2', 'Bracket: QF 3', 'Bracket: QF 4'];
    for (let i = 0; i < 4; i++) {
        const m = await query(
            `INSERT INTO matches (event_id, round, status, home_team_id, away_team_id) VALUES ($1, $2, 'SCHEDULED', $3, $4) RETURNING id`,
            [eventId, qfRounds[i], teams[i*2].id, teams[i*2+1].id]
        );
        const matchId = m.rows[0].id;
        await query(`INSERT INTO match_scores (match_id) VALUES ($1)`, [matchId]);
        sqlPersist += `INSERT INTO matches (event_id, round, status, home_team_id, away_team_id) VALUES (${eventId}, '${qfRounds[i]}', 'SCHEDULED', ${teams[i*2].id}, ${teams[i*2+1].id});\n`;
    }

    const sfRounds = ['Bracket: SF 1', 'Bracket: SF 2'];
    for (let i = 0; i < 2; i++) {
        const m = await query(
            `INSERT INTO matches (event_id, round, status, home_team_id, away_team_id) VALUES ($1, $2, 'SCHEDULED', NULL, NULL) RETURNING id`,
            [eventId, sfRounds[i]]
        );
        const matchId = m.rows[0].id;
        await query(`INSERT INTO match_scores (match_id) VALUES ($1)`, [matchId]);
        sqlPersist += `INSERT INTO matches (event_id, round, status, home_team_id, away_team_id) VALUES (${eventId}, '${sfRounds[i]}', 'SCHEDULED', NULL, NULL);\n`;
    }

    const m = await query(
        `INSERT INTO matches (event_id, round, status, home_team_id, away_team_id) VALUES ($1, 'Bracket: Final', 'SCHEDULED', NULL, NULL) RETURNING id`,
        [eventId]
    );
    const finalId = m.rows[0].id;
    await query(`INSERT INTO match_scores (match_id) VALUES ($1)`, [finalId]);
    sqlPersist += `INSERT INTO matches (event_id, round, status, home_team_id, away_team_id) VALUES (${eventId}, 'Bracket: Final', 'SCHEDULED', NULL, NULL);\n`;

    try {
        const customPath = path.join(__dirname, '../../../database/custom_brackets.sql');
        fs.writeFileSync(customPath, sqlPersist, 'utf8');
    } catch (saveErr) {
        console.error('Could not persist custom_brackets.sql:', saveErr);
    }

    sendSuccess(res, { generated: true });
  } catch (err: any) {
    sendError(res, err.message);
  }
};
