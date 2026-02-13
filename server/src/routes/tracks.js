const express = require('express');
const TrackController = require('../controllers/TrackController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', TrackController.getAll);
router.get('/:id', TrackController.getById);
router.get('/user/:userId', TrackController.getByUser);

// Protected routes (any authenticated user can upload)
router.post('/:id/play', authMiddleware, TrackController.updatePlayCount);

// Upload route (any authenticated user can upload tracks)
router.post('/upload', 
  authMiddleware, 
  TrackController.getUploadMiddleware(), 
  TrackController.upload
);

module.exports = router;
