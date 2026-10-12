-- Seed data for SportX

-- Default Admin User (password: 'admin123', hashed with bcrypt)
-- Hash generated for 'admin123' is $2a$10$32q375wMv3j9D6QeP/5jJ.Zp.kP9P.rL.m1q9sE25t.mO1gE1hP9W
INSERT INTO users (username, password_hash, role) VALUES 
('admin', '$2b$10$EpI0Mowc66/h1sI1qM9X/evCjHn24ZJcT.w0sN9P/N.j5R8/iXG8K', 'ADMIN'),
('operator', '$2b$10$EpI0Mowc66/h1sI1qM9X/evCjHn24ZJcT.w0sN9P/N.j5R8/iXG8K', 'MATCH_OPERATOR'),
('nirmit', '$2b$10$Tkn7HtGt2IzttAx/tMgmRODguNq43L4/2QHBueH8QFwrheBkVRaam', 'ADMIN');

INSERT INTO sports (name) VALUES 
('Football'), 
('Basketball'), 
('Volleyball');

INSERT INTO events (name, sport_id, description, start_date, end_date, location, organizer, status) VALUES 
('National College Cup', 1, 'Annual football tournament for colleges.', '2026-10-01', '2026-10-31', 'Main City Stadium', 'College Sports Board', 'UPCOMING'),
('Summer Hoops League', 2, 'Regional basketball championship.', '2026-11-05', '2026-12-15', 'Indoor Arena', 'Regional Board', 'UPCOMING'),
('Winter Volley Fest', 3, 'Open volleyball festival.', '2026-12-20', '2026-12-25', 'Beach Court', 'Fest Organizers', 'UPCOMING');

INSERT INTO venues (name, address, city, capacity, sport, status) VALUES 
('Main Stadium', '123 Stadium Road', 'Mumbai', 50000, 'Football', 'ACTIVE'),
('City Indoor Arena', '456 Arena Way', 'Mumbai', 15000, 'Basketball', 'ACTIVE'),
('Beach Court', '789 Coast Line', 'Mumbai', 2000, 'Volleyball', 'ACTIVE'),
('North Campus Field', '101 Campus Drive', 'Pune', 5000, 'Football', 'ACTIVE'),
('South Gym', '202 Campus Drive', 'Pune', 3000, 'Basketball', 'ACTIVE');

-- 8 Teams (Let's make them mostly for Football Event 1 for simplicity of matches)
INSERT INTO teams (name, short_name, captain, coach, event_id) VALUES 
('VIVA Warriors', 'VIVA', 'Raj Patel', 'Coach Smith', 1),
('Mumbai Titans', 'MUM', 'Amit Kumar', 'Coach Johnson', 1),
('Pune Strikers', 'PUN', 'John Doe', 'Coach Williams', 1),
('Delhi Dynamos', 'DEL', 'Rahul Singh', 'Coach Brown', 1),
('Chennai Super Kings', 'CSK', 'MS Dhoni', 'Coach Fleming', 1),
('Bengaluru FC', 'BFC', 'Sunil Chhetri', 'Coach Cuadrat', 1),
('Kerala Blasters', 'KBFC', 'Sahal Abdul', 'Coach Ivan', 1),
('Goa FC', 'FCG', 'Brandon Fernandes', 'Coach Marquez', 1);

-- 20 Players (Assigning mostly to VIVA and MUM for demo)
INSERT INTO players (full_name, jersey_number, team_id, position) VALUES 
('Player A1', 1, 1, 'Goalkeeper'), ('Player A2', 2, 1, 'Defender'), ('Player A3', 3, 1, 'Defender'), ('Player A4', 4, 1, 'Midfielder'), ('Player A5', 5, 1, 'Forward'),
('Player A6', 6, 1, 'Midfielder'), ('Player A7', 7, 1, 'Forward'), ('Player A8', 8, 1, 'Defender'), ('Player A9', 9, 1, 'Forward'), ('Player A10', 10, 1, 'Midfielder'),
('Player B1', 1, 2, 'Goalkeeper'), ('Player B2', 2, 2, 'Defender'), ('Player B3', 3, 2, 'Defender'), ('Player B4', 4, 2, 'Midfielder'), ('Player B5', 5, 2, 'Forward'),
('Player B6', 6, 2, 'Midfielder'), ('Player B7', 7, 2, 'Forward'), ('Player B8', 8, 2, 'Defender'), ('Player B9', 9, 2, 'Forward'), ('Player B10', 10, 2, 'Midfielder');

-- 10 Matches
INSERT INTO matches (event_id, sport_id, home_team_id, away_team_id, venue_id, match_date, match_time, round, status) VALUES 
(1, 1, 3, 4, 4, '2026-10-02', '16:00:00', 'Group Stage', 'COMPLETED'),
(1, 1, 5, 6, 1, '2026-10-03', '18:00:00', 'Group Stage', 'COMPLETED'),
(1, 1, 7, 8, 4, '2026-10-04', '16:00:00', 'Group Stage', 'COMPLETED'),
(1, 1, 3, 5, 1, '2026-10-05', '18:00:00', 'Group Stage', 'COMPLETED'),
(1, 1, 4, 6, 4, '2026-10-06', '16:00:00', 'Group Stage', 'SCHEDULED'),
(1, 1, 7, 3, 1, '2026-10-07', '18:00:00', 'Group Stage', 'SCHEDULED'),
(1, 1, 8, 4, 4, '2026-10-08', '16:00:00', 'Group Stage', 'SCHEDULED'),
(1, 1, 5, 7, 1, '2026-10-09', '18:00:00', 'Group Stage', 'SCHEDULED'),
(1, 1, 6, 8, 4, '2026-10-10', '16:00:00', 'Group Stage', 'SCHEDULED'),
(1, 1, 1, 2, 1, '2026-10-15', '20:00:00', 'SEMIFINAL', 'LIVE'), -- The LIVE match
-- Official Tournament Bracket for Event 1 (National College Cup)
(1, 1, 1, 2, 1, '2026-10-12', '14:00:00', 'Bracket: QF 1', 'COMPLETED'),
(1, 1, 3, 4, 4, '2026-10-12', '16:30:00', 'Bracket: QF 2', 'COMPLETED'),
(1, 1, 5, 6, 1, '2026-10-13', '14:00:00', 'Bracket: QF 3', 'COMPLETED'),
(1, 1, 7, 8, 4, '2026-10-13', '16:30:00', 'Bracket: QF 4', 'COMPLETED'),
(1, 1, 1, 3, 1, '2026-10-14', '17:00:00', 'Bracket: SF 1', 'SCHEDULED'),
(1, 1, 5, 8, 1, '2026-10-14', '19:30:00', 'Bracket: SF 2', 'SCHEDULED'),
(1, 1, NULL, NULL, 1, '2026-10-16', '20:00:00', 'Bracket: Final', 'SCHEDULED');

-- Match Scores for Completed and Live Matches
INSERT INTO match_scores (match_id, home_score, away_score, timer) VALUES 
(1, 1, 0, '90:00'),
(2, 2, 2, '90:00'),
(3, 0, 1, '90:00'),
(4, 3, 1, '90:00'),
(10, 2, 1, '67:23'), -- VIVA Warriors (1) 2 - 1 Mumbai Titans (2)
(11, 2, 1, '90:00'), -- QF 1: VIVA Warriors 2 - 1 Mumbai Titans
(12, 3, 1, '90:00'), -- QF 2: Pune Strikers 3 - 1 Delhi Dynamos
(13, 2, 0, '90:00'), -- QF 3: Chennai Super Kings 2 - 0 Bengaluru FC
(14, 1, 2, '90:00'), -- QF 4: Kerala Blasters 1 - 2 Goa FC
(15, 0, 0, '00:00'), -- SF 1: VIVA Warriors vs Pune Strikers
(16, 0, 0, '00:00'), -- SF 2: Chennai Super Kings vs Goa FC
(17, 0, 0, '00:00'); -- Final: TBD vs TBD

-- Update standings for completed matches (matches 1, 2, 3, 4)
-- Match 1: 3(home) vs 4(away), 1-0 -> Team 3 wins, Team 4 loses
INSERT INTO standings (event_id, team_id, played, won, drawn, lost, goals_for, goals_against, goal_difference, points) VALUES 
(1, 3, 2, 2, 0, 0, 4, 1, 3, 6), -- Played 1 and 4
(1, 4, 1, 0, 0, 1, 0, 1, -1, 0),
(1, 5, 2, 0, 1, 1, 3, 5, -2, 1),
(1, 6, 1, 0, 1, 0, 2, 2, 0, 1),
(1, 7, 1, 0, 0, 1, 0, 1, -1, 0),
(1, 8, 1, 1, 0, 0, 1, 0, 1, 3);

-- Sample Match Events (Timeline for Live and Completed Matches)
INSERT INTO match_events (match_id, minute, type, team_id, player_name, description) VALUES
-- Match 10 (LIVE match: VIVA Warriors 2 - 1 Mumbai Titans)
(10, '00''', 'KICKOFF', NULL, NULL, 'Match kickoff at Main Stadium in front of 48,000 fans'),
(10, '18''', 'GOAL', 1, 'Raj Patel', 'Clinical low drive into the bottom left corner (Assist: Player A4)'),
(10, '34''', 'CARD_YELLOW', 2, 'Amit Kumar', 'Tactical foul breaking up a dangerous counterattack'),
(10, '45''', 'HALFTIME', NULL, NULL, 'First half concludes with VIVA Warriors leading 1 - 0'),
(10, '52''', 'GOAL', 2, 'Player B5', 'Powerful header from a set-piece corner to equalize 1 - 1'),
(10, '64''', 'GOAL', 1, 'Player A9', 'Spectacular chipped finish over the rushing goalkeeper to restore the lead 2 - 1!'),

-- Match 11 (QF 1: VIVA Warriors 2 - 1 Mumbai Titans)
(11, '00''', 'KICKOFF', NULL, NULL, 'Quarter-Final 1 underway under stadium floodlights'),
(11, '29''', 'GOAL', 1, 'Raj Patel', 'Opens the scoring with a volley from edge of the penalty box'),
(11, '45''', 'HALFTIME', NULL, NULL, 'Halftime interval. VIVA Warriors holds a 1 - 0 advantage'),
(11, '61''', 'GOAL', 2, 'Player B7', 'Drilled strike past the goalkeeper to tie the game 1 - 1'),
(11, '84''', 'GOAL', 1, 'Player A7', 'Dramatic late winner into the top corner! VIVA Warriors leads 2 - 1'),
(11, '90''', 'FULLTIME', NULL, NULL, 'Final whistle! VIVA Warriors wins 2 - 1 and advances to Semi-Finals'),

-- Match 12 (QF 2: Pune Strikers 3 - 1 Delhi Dynamos)
(12, '00''', 'KICKOFF', NULL, NULL, 'Quarter-Final 2 kickoff at North Campus Field'),
(12, '14''', 'GOAL', 3, 'John Doe', 'Quick counterattack finish puts Pune Strikers ahead 1 - 0'),
(12, '39''', 'GOAL', 3, 'John Doe', 'Double for John Doe! Taps in a low cross for 2 - 0'),
(12, '65''', 'GOAL', 4, 'Rahul Singh', 'Delhi Dynamos pulls one back with a curled effort (2 - 1)'),
(12, '88''', 'GOAL', 3, 'Player A2', 'Seals the victory with a stoppage time header (3 - 1)'),
(12, '90''', 'FULLTIME', NULL, NULL, 'Final whistle! Pune Strikers triumphs 3 - 1 to book Semi-Final spot'),

-- Match 13 (QF 3: Chennai Super Kings 2 - 0 Bengaluru FC)
(13, '00''', 'KICKOFF', NULL, NULL, 'Quarter-Final 3 kickoff'),
(13, '42''', 'GOAL', 5, 'MS Dhoni', 'Captain leads from the front! Calm finish for 1 - 0'),
(13, '77''', 'GOAL', 5, 'Coach Fleming', 'Insurance goal scored on a rebound (2 - 0)'),
(13, '90''', 'FULLTIME', NULL, NULL, 'Full time! Chennai Super Kings secures clean sheet 2 - 0 win'),

-- Match 14 (QF 4: Kerala Blasters 1 - 2 Goa FC)
(14, '00''', 'KICKOFF', NULL, NULL, 'Quarter-Final 4 kickoff'),
(14, '22''', 'GOAL', 7, 'Sahal Abdul', 'Kerala Blasters takes early 1 - 0 lead'),
(14, '56''', 'GOAL', 8, 'Brandon Fernandes', 'Goa FC equalizes with a direct free kick (1 - 1)'),
(14, '81''', 'GOAL', 8, 'Brandon Fernandes', 'Brace for Fernandes! Completes the comeback for 1 - 2!'),
(14, '90''', 'FULLTIME', NULL, NULL, 'Final whistle! Goa FC clinches 2 - 1 comeback victory to advance');

