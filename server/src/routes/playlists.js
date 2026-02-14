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

// Public routes (that don't need authentication)
router.get('/public', PlaylistController.getPublicPlaylists);
router.get('/', PlaylistController.getAll); // Main playlist endpoint - works with/without auth
router.get('/:id/tracks', PlaylistController.getTracks); // Tracks should be public for public playlists

// Apply authentication middleware to all subsequent routes
router.use(authMiddleware);

// Teacher approval routes (must come before :id routes to avoid conflicts)
router.get('/pending-approval', (req, res, next) => {
  console.log('=== PENDING APPROVAL ROUTE HIT ===');
  console.log('Req.user before auth:', req.user);
  next();
}, roleMiddleware.requireTeacher, (req, res, next) => {
  console.log('Req.user after role middleware:', req.user);
  next();
}, PlaylistController.getPendingApproval);

// Protected routes
router.get('/', PlaylistController.getAll);
router.get('/user/my', PlaylistController.getByUser);
router.get('/drafts/my', roleMiddleware.requireTeacher, PlaylistController.getDrafts);

// Specific playlist routes (must come before generic :id routes)
router.get('/:id', (req, res, next) => {
  console.log('=== GET BY ID ROUTE HIT ===');
  console.log('Requested ID:', req.params.id);
  if (req.params.id === 'pending-approval') {
    console.log('WARNING: pending-approval is being caught by :id route!');
  }
  next();
}, PlaylistController.getById);
router.get('/:id/tracks', PlaylistController.getTracks);

// Teacher approval action routes
router.patch('/:id/approve', (req, res, next) => {
  console.log('=== APPROVE ROUTE HIT ===');
  console.log('Playlist ID to approve:', req.params.id);
  next();
}, roleMiddleware.requireTeacher, PlaylistController.approvePlaylist);
router.patch('/:id/reject', roleMiddleware.requireTeacher, PlaylistController.rejectPlaylist);

// Teacher-only routes
router.patch('/:id/publish', roleMiddleware.requireTeacher, PlaylistController.publish);

// Alternative route to avoid :id conflicts
router.get('/teacher/pending', roleMiddleware.requireTeacher, PlaylistController.getPendingApproval);

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

// Teacher approval action routes
router.patch('/:id/approve', (req, res, next) => {
  console.log('=== APPROVE ROUTE HIT ===');
  console.log('Playlist ID to approve:', req.params.id);
  next();
}, roleMiddleware.requireTeacher, PlaylistController.approvePlaylist);
router.patch('/:id/reject', roleMiddleware.requireTeacher, PlaylistController.rejectPlaylist);

// Teacher-only routes
router.patch('/:id/publish', roleMiddleware.requireTeacher, PlaylistController.publish);

module.exports = router;
