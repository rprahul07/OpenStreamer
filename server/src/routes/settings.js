const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const { requireTeacher } = require('../middleware/roleMiddleware');
const SettingsController = require('../controllers/SettingsController');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for logos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// All routes require authentication
router.use(authMiddleware);

// Branding Settings Routes
router.get('/branding', SettingsController.getBrandingSettings);
router.put('/branding', SettingsController.updateBrandingSettings);

// User Branding Settings Routes
router.get('/user/branding', SettingsController.getUserBrandingSettings);
router.put('/user/branding', SettingsController.updateUserBrandingSettings);
router.post('/user/branding/upload/:type', upload.single('file'), SettingsController.uploadBrandingAsset);
router.delete('/user/branding/:type', SettingsController.deleteBrandingAsset);

// User Preferences Routes
router.get('/preferences', SettingsController.getUserPreferences);
router.put('/preferences', SettingsController.updateUserPreferences);

// App Settings Routes (Admin only)
router.get('/app', SettingsController.getAppSettings);
router.put('/app', SettingsController.updateAppSettings);

module.exports = router;
