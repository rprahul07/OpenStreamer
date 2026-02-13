const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const InteractionController = require('../controllers/InteractionController');

// All interaction routes require authentication
router.use(authMiddleware);

// Like or dislike a track
router.post('/tracks/:trackId/interact', InteractionController.interactWithTrack);

// Get user's interaction with a track
router.get('/tracks/:trackId/interaction', InteractionController.getUserInteraction);

// Get track engagement statistics
router.get('/tracks/:trackId/engagement', InteractionController.getTrackEngagement);

// Get popular tracks (high engagement)
router.get('/tracks/popular', InteractionController.getPopularTracks);

// Get engagement statistics (for teachers/admins)
router.get('/stats/engagement', InteractionController.getEngagementStats);

// Manually update engagement (admin function)
router.post('/tracks/:trackId/update-engagement', InteractionController.updateEngagement);

module.exports = router;
