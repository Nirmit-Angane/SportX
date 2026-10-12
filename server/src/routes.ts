import { Router } from 'express';
import * as eventController from './controllers/eventController';
import * as teamController from './controllers/teamController';
import * as playerController from './controllers/playerController';
import * as venueController from './controllers/venueController';
import * as matchController from './controllers/matchController';
import * as scoreController from './controllers/scoreController';
import * as qrController from './controllers/qrController';
import * as authController from './controllers/authController';
import { requireAuth, requireAdmin, requireMatchOperator } from './middleware/auth';

const router = Router();

// Health check
router.get('/health', (req, res) => res.json({ success: true, message: 'API is running' }));

// Auth
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', requireAuth, authController.me);

// Events
router.get('/events', eventController.getAllEvents);
router.get('/events/:id', eventController.getEventById);
router.post('/events', requireAdmin, eventController.createEvent);
router.put('/events/:id', requireAdmin, eventController.updateEvent);
router.delete('/events/:id', requireAdmin, eventController.deleteEvent);
router.get('/events/:id/standings', eventController.getStandings);

// Teams
router.get('/teams', teamController.getAllTeams);
router.post('/teams', teamController.createTeam);
router.put('/teams/:id', requireAdmin, teamController.updateTeam);
router.delete('/teams/:id', requireAdmin, teamController.deleteTeam);

// Players
router.get('/players', playerController.getAllPlayers);
router.post('/players', requireAdmin, playerController.createPlayer);
router.put('/players/:id', requireAdmin, playerController.updatePlayer);
router.delete('/players/:id', requireAdmin, playerController.deletePlayer);

// Venues
router.get('/venues', venueController.getAllVenues);
router.post('/venues', requireAdmin, venueController.createVenue);
router.put('/venues/:id', requireAdmin, venueController.updateVenue);
router.delete('/venues/:id', requireAdmin, venueController.deleteVenue);

// Matches
router.get('/matches', matchController.getAllMatches);
router.get('/matches/:id', matchController.getMatchById);
router.post('/matches', requireAdmin, matchController.createMatch);
router.put('/matches/:id', requireMatchOperator, matchController.updateMatch);
router.delete('/matches/:id', requireAdmin, matchController.deleteMatch);
router.post('/matches/:id/start', requireMatchOperator, matchController.startMatch);
router.post('/matches/:id/break', requireMatchOperator, matchController.breakMatch);
router.post('/matches/:id/end', requireMatchOperator, matchController.endMatch);
router.get('/matches/:id/events', matchController.getMatchEvents);
router.post('/matches/:id/events', requireMatchOperator, matchController.addMatchEvent);
router.post('/matches/generate-bracket', requireAdmin, matchController.generateBracket);


// Score
router.get('/matches/:id/score', scoreController.getScore);
router.put('/matches/:id/score', requireMatchOperator, scoreController.updateScore);

// QR Codes
router.post('/qr/event/:id', requireAuth, qrController.generateEventQR);
router.post('/qr/match/:id', requireAuth, qrController.generateMatchQR);
router.post('/qr/venue/:id', requireAuth, qrController.generateVenueQR);

export default router;
