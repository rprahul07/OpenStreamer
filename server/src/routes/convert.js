const express = require('express');
const ConvertController = require('../controllers/ConvertController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/convert  — any authenticated user can convert a video
router.post(
  '/',
  authMiddleware,
  ConvertController.getUploadMiddleware(),
  ConvertController.convert
);

module.exports = router;
