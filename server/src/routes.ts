import { Router } from 'express';
import * as eventController from './controllers/eventController';
import * as teamController from './controllers/teamController';
import * as playerController from './controllers/playerController';
import * as venueController from './controllers/venueController';
import * as matchController from './controllers/matchController';
import * as scoreController from './controllers/scoreController';
import * as qrController from './controllers/qrController';

const router = Router();

// Health check
router.get('/health', (req, res) => res.json({ success: true, message: 'API is running' }));

// Events
router.get('/events', eventController.getAllEvents);
router.get('/events/:id', eventController.getEventById);
router.post('/events', eventController.createEvent);
router.put('/events/:id', eventController.updateEvent);
router.delete('/events/:id', eventController.deleteEvent);
router.get('/events/:id/standings', eventController.getStandings);

// Teams
router.get('/teams', teamController.getAllTeams);
router.post('/teams', teamController.createTeam);
router.put('/teams/:id', teamController.updateTeam);
router.delete('/teams/:id', teamController.deleteTeam);

// Players
router.get('/players', playerController.getAllPlayers);
router.post('/players', playerController.createPlayer);
router.put('/players/:id', playerController.updatePlayer);
router.delete('/players/:id', playerController.deletePlayer);

// Venues
router.get('/venues', venueController.getAllVenues);
router.post('/venues', venueController.createVenue);
router.put('/venues/:id', venueController.updateVenue);
router.delete('/venues/:id', venueController.deleteVenue);

// Matches
router.get('/matches', matchController.getAllMatches);
router.get('/matches/:id', matchController.getMatchById);
router.post('/matches', matchController.createMatch);
router.put('/matches/:id', matchController.updateMatch);
router.delete('/matches/:id', matchController.deleteMatch);
router.post('/matches/:id/start', matchController.startMatch);
router.post('/matches/:id/end', matchController.endMatch);

// Score
router.get('/matches/:id/score', scoreController.getScore);
router.put('/matches/:id/score', scoreController.updateScore);

// QR Codes
router.post('/qr/event/:id', qrController.generateEventQR);
router.post('/qr/match/:id', qrController.generateMatchQR);
router.post('/qr/venue/:id', qrController.generateVenueQR);

export default router;
