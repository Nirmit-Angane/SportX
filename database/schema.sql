-- SportX Database Schema

-- Sports
CREATE TABLE sports (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Events
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sport_id INTEGER REFERENCES sports(id),
    description TEXT,
    start_date DATE,
    end_date DATE,
    location VARCHAR(255),
    organizer VARCHAR(255),
    status VARCHAR(50) DEFAULT 'UPCOMING',
    logo VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Venues
CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(255),
    capacity INTEGER,
    sport VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE'
);

-- Teams
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    captain VARCHAR(255),
    coach VARCHAR(255),
    logo VARCHAR(512),
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Players
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    jersey_number INTEGER,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    position VARCHAR(100),
    date_of_birth DATE,
    photo VARCHAR(512),
    status VARCHAR(50) DEFAULT 'ACTIVE'
);

-- Matches
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    sport_id INTEGER REFERENCES sports(id),
    home_team_id INTEGER REFERENCES teams(id),
    away_team_id INTEGER REFERENCES teams(id),
    venue_id INTEGER REFERENCES venues(id),
    match_date DATE,
    match_time TIME,
    round VARCHAR(100),
    status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, LIVE, COMPLETED, CANCELLED
    CHECK (home_team_id != away_team_id)
);

-- Match Scores
CREATE TABLE match_scores (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    timer VARCHAR(50) DEFAULT '00:00',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Standings
CREATE TABLE standings (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    drawn INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    UNIQUE(event_id, team_id)
);

-- QR Codes
CREATE TABLE qr_codes (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- EVENT, MATCH, VENUE
    target_id INTEGER NOT NULL,
    url VARCHAR(1024) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
