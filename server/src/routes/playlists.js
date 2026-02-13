const express = require('express');
const multer = require('multer');
const PlaylistController = require('../controllers/PlaylistController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

console.log('=== PLAYLIST ROUTES INITIALIZED ===');

// Add JSON body parser middleware
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Configure multer for memory storage (for S3 upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for cover images
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Public routes
router.get('/', PlaylistController.getAll);
router.get('/:id', PlaylistController.getById);
router.get('/:id/tracks', PlaylistController.getTracks);

// Protected routes
router.use(authMiddleware);

// User's playlists
router.get('/user/my', PlaylistController.getByUser);
router.get('/drafts/my', roleMiddleware.requireTeacher, PlaylistController.getDrafts);

// Create playlist (with cover image support)
router.post('/', upload.single('coverImage'), (req, res) => {
  console.log('=== PLAYLIST CREATE ROUTE HIT ===');
  console.log('Request method:', req.method);
  console.log('Request path:', req.path);
  console.log('Request body:', req.body);
  console.log('Request file:', req.file ? 'File present' : 'No file');
  PlaylistController.create(req, res);
});

// Update playlist
router.put('/:id', upload.single('coverImage'), PlaylistController.update);

// Add/remove tracks
router.post('/:id/tracks', PlaylistController.addTrack);
router.delete('/:id/tracks/:trackId', PlaylistController.removeTrack);

// Teacher-only routes
router.patch('/:id/publish', roleMiddleware.requireTeacher, PlaylistController.publish);

// Teacher approval routes
router.get('/pending-approval', roleMiddleware.requireTeacher, PlaylistController.getPendingApproval);
router.patch('/:id/approve', roleMiddleware.requireTeacher, PlaylistController.approvePlaylist);
router.patch('/:id/reject', roleMiddleware.requireTeacher, PlaylistController.rejectPlaylist);

module.exports = router;
