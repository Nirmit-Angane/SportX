-- Seed data for SportX

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
(1, 1, 1, 2, 1, '2026-10-15', '20:00:00', 'SEMIFINAL', 'LIVE'); -- The LIVE match

-- Match Scores for Completed and Live Matches
INSERT INTO match_scores (match_id, home_score, away_score, timer) VALUES 
(1, 1, 0, '90:00'),
(2, 2, 2, '90:00'),
(3, 0, 1, '90:00'),
(4, 3, 1, '90:00'),
(10, 2, 1, '67:23'); -- VIVA Warriors (1) 2 - 1 Mumbai Titans (2)

-- Update standings for completed matches (matches 1, 2, 3, 4)
-- Match 1: 3(home) vs 4(away), 1-0 -> Team 3 wins, Team 4 loses
INSERT INTO standings (event_id, team_id, played, won, drawn, lost, goals_for, goals_against, goal_difference, points) VALUES 
(1, 3, 2, 2, 0, 0, 4, 1, 3, 6), -- Played 1 and 4
(1, 4, 1, 0, 0, 1, 0, 1, -1, 0),
(1, 5, 2, 0, 1, 1, 3, 5, -2, 1),
(1, 6, 1, 0, 1, 0, 2, 2, 0, 1),
(1, 7, 1, 0, 0, 1, 0, 1, -1, 0),
(1, 8, 1, 1, 0, 0, 1, 0, 1, 3);
