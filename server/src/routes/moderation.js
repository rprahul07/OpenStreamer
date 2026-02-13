const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireTeacher } = require('../middleware/roleMiddleware');
const ModerationController = require('../controllers/ModerationController');

// All moderation routes require authentication and teacher role
router.use(authMiddleware);
router.use(requireTeacher);

// Get pending content for review
router.get('/pending', ModerationController.getPendingContent);

// Get moderation statistics
router.get('/stats', ModerationController.getModerationStats);

// Approve content
router.post('/approve/:contentId', ModerationController.approveContent);

// Reject content
router.post('/reject/:contentId', ModerationController.rejectContent);

module.exports = router;
