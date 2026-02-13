const multer = require('multer');
const TrackModel = require('../models/Track');
const s3Service = require('../config/s3');

// Configure multer for memory storage (we'll upload to S3 directly)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB fixed (not using env var)
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (
      file.mimetype === 'audio/mpeg' ||
      file.mimetype === 'audio/wav' ||
      file.mimetype === 'audio/mp3' ||
      file.mimetype === 'audio/m4a' ||
      file.mimetype === 'audio/ogg'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

class TrackController {
  static async getAll(req, res) {
    try {
      let tracks;
      
      // If user is a student, only show approved or public content
      if (req.user && (req.user.academic_role === 'STUDENT' || req.user.role === 'listener')) {
        tracks = await TrackModel.findForStudents({
          department: req.user.department,
          academicYear: req.user.academicYear,
          classSection: req.user.classSection
        });
      } else {
        // Teachers and admins can see all content
        const { department, academicYear, classSection } = req.query;
        tracks = await TrackModel.findAll({
          department,
          academicYear,
          classSection
        });
      }
      
      res.json(tracks);
    } catch (error) {
      console.error('Get tracks error:', error);
      res.status(500).json({ error: 'Failed to get tracks' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const track = await TrackModel.findById(id);
      
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      
      res.json(track);
    } catch (error) {
      console.error('Get track error:', error);
      res.status(500).json({ error: 'Failed to get track' });
    }
  }

  static async getByUser(req, res) {
    try {
      const { userId } = req.params;
      const tracks = await TrackModel.findByUser(userId);
      res.json(tracks);
    } catch (error) {
      console.error('Get user tracks error:', error);
      res.status(500).json({ error: 'Failed to get user tracks' });
    }
  }

  static async upload(req, res) {
    try {
      console.log('=== TRACK UPLOAD DEBUG ===');
      console.log('User:', req.user);
      console.log('User role:', req.user?.academic_role || req.user?.role);
      console.log('Headers:', req.headers);
      
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file required' });
      }

      const { title, artist, album, uploadedBy, isPublic, department, academicYear, classSection, playlistId } = req.body;
      
      if (!title || !artist || !uploadedBy) {
        return res.status(400).json({ error: 'Title, artist, and uploadedBy required' });
      }

      // Remove teacher restrictions for now - allow all authenticated users to upload
      console.log('Upload request:', { title, isPublic, department, academicYear, classSection });

      // Generate S3 upload path
      const uploadPath = s3Service.generateUploadPath(
        department || 'general',
        academicYear || '1',
        classSection || 'A',
        playlistId || 'general',
        req.file.originalname
      );

      // Upload to S3
      const s3Url = await s3Service.uploadFile(
        req.file.buffer,
        uploadPath,
        req.file.mimetype
      );

      // For now, we'll use a placeholder duration (in real app, you'd parse the audio file)
      const duration = 180; // 3 minutes default

      const trackData = {
        title,
        artist,
        album: album || null,
        duration: duration.toString(),
        file_url: s3Url,
        uploaded_by: uploadedBy,
        is_public: isPublic === 'true' ? 'true' : 'false'
      };

      console.log('Creating track with data:', trackData);
      const track = await TrackModel.create(trackData);
      console.log('Track created successfully:', track);
      res.json(track);
    } catch (error) {
      console.error('Upload track error:', error);
      res.status(500).json({ error: 'Failed to upload track' });
    }
  }

  static async updatePlayCount(req, res) {
    try {
      const { id } = req.params;
      await TrackModel.updatePlayCount(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Update play count error:', error);
      res.status(500).json({ error: 'Failed to update play count' });
    }
  }

  // Middleware for handling file upload
  static getUploadMiddleware() {
    return upload.single('audioFile');
  }
}

module.exports = TrackController;
