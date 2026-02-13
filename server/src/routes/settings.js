const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireTeacher } = require('../middleware/roleMiddleware');
const SettingsController = require('../controllers/SettingsController');

// All routes require authentication
router.use(authMiddleware);

// Branding Settings Routes
router.get('/branding', SettingsController.getBrandingSettings);
router.put('/branding', SettingsController.updateBrandingSettings);

// User Preferences Routes
router.get('/preferences', SettingsController.getUserPreferences);
router.put('/preferences', SettingsController.updateUserPreferences);

// App Settings Routes (Admin only)
router.get('/app', SettingsController.getAppSettings);
router.put('/app', SettingsController.updateAppSettings);

module.exports = router;
