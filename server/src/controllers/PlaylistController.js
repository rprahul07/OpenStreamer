const s3Service = require('../config/s3');
const Playlist = require('../models/Playlist');
const PlaylistTrack = require('../models/PlaylistTrack');
const Track = require('../models/Track');

class PlaylistController {
  static async getAll(req, res) {
    try {
      let playlists;
      
      // If user is a student, filter based on their academic info
      if (req.user && (req.user.academic_role === 'STUDENT' || req.user.role === 'listener')) {
        playlists = await Playlist.findForStudent({
          department: req.user.department,
          academic_year: req.user.academic_year,
          class_section: req.user.class_section
        });
      } else {
        // For teachers, admins, or unauthenticated users, show all published public playlists
        playlists = await Playlist.findPublic();
      }
      
      res.json(playlists);
    } catch (error) {
      console.error('Get playlists error:', error);
      res.status(500).json({ error: 'Failed to get playlists' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const playlist = await Playlist.findById(id);
      
      if (!playlist) {
        return res.status(404).json({ error: 'Playlist not found' });
      }
      
      res.json(playlist);
    } catch (error) {
      console.error('Get playlist error:', error);
      res.status(500).json({ error: 'Failed to get playlist' });
    }
  }

  static async getByUser(req, res) {
    try {
      const { userId } = req.params;
      const playlists = await Playlist.findByUser(userId);
      res.json(playlists);
    } catch (error) {
      console.error('Get user playlists error:', error);
      res.status(500).json({ error: 'Failed to get user playlists' });
    }
  }

  static async create(req, res) {
    try {
      console.log('Playlist create request received');
      console.log('Content-Type:', req.headers['content-type']);
      console.log('Request body keys:', Object.keys(req.body || {}));
      console.log('Request body:', req.body);
      console.log('Request file:', req.file ? 'File present' : 'No file');
      
      // Handle both JSON and multipart form data
      let playlistData;
      
      // Check if req.body exists and has data
      if (!req.body || Object.keys(req.body).length === 0) {
        console.log('Request body is empty, checking raw body');
        return res.status(400).json({ error: 'Request body is empty' });
      }
      
      if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        // For multipart requests (cover image uploads), get data from req.body
        playlistData = {
          name: req.body.name,
          description: req.body.description,
          subject: req.body.subject,
          department: req.body.department,
          academicYear: req.body.academicYear ? parseInt(req.body.academicYear) : undefined,
          classSection: req.body.classSection,
          visibility: req.body.visibility,
          status: req.body.status,
          isPublic: req.body.isPublic,
          coverUrl: req.body.coverUrl,
          userId: req.body.userId
        };
        console.log('Parsed multipart data:', playlistData);
      } else {
        // For JSON requests - direct destructuring
        const { 
          name, 
          description, 
          subject, 
          department, 
          academicYear, 
          classSection, 
          visibility, 
          status, 
          isPublic, 
          coverUrl,
          userId 
        } = req.body;
        
        playlistData = {
          name, 
          description, 
          subject, 
          department, 
          academicYear, 
          classSection, 
          visibility, 
          status, 
          isPublic, 
          coverUrl,
          userId
        };
        console.log('Parsed JSON data:', playlistData);
      }

      const { name, userId } = playlistData;

      // Validate required fields
      if (!name || !userId) {
        console.log('Validation failed: missing name or userId');
        return res.status(400).json({ error: 'Name and userId are required' });
      }

      // Validate academic fields for class-specific playlists
      if (playlistData.visibility === 'CLASS') {
        if (!playlistData.department || !playlistData.academicYear || !playlistData.classSection) {
          return res.status(400).json({ 
            error: 'Department, academic year, and class section are required for class-specific playlists' 
          });
        }
        
        // Allow students to create class playlists, but mark them for teacher approval
        const userRole = req.user.academic_role || req.user.role;
        if (userRole !== 'TEACHER' && userRole !== 'creator' && userRole !== 'admin') {
          // Student creating class playlist - set moderation_status to PENDING
          playlistData.status = 'DRAFT'; // Keep status as DRAFT
          playlistData.moderation_status = 'PENDING'; // Use moderation_status for approval workflow
          console.log('Student creating class playlist - marked for teacher approval');
        }
      }

      // Handle cover image upload to S3
      let finalCoverUrl = playlistData.coverUrl;
      if (req.file && req.file.buffer) {
        try {
          const coverKey = `covers/${userId}/${Date.now()}-cover.jpg`;
          
          // Upload buffer directly to S3
          const uploadResult = await s3Service.uploadFile(
            req.file.buffer,
            coverKey,
            req.file.mimetype
          );
          finalCoverUrl = uploadResult;
        } catch (uploadError) {
          console.error('Cover upload error:', uploadError);
          // Continue with default cover if upload fails
        }
      }

      const finalPlaylistData = {
        name: playlistData.name,
        description: playlistData.description,
        subject: playlistData.subject,
        department: playlistData.visibility === 'CLASS' ? playlistData.department : null,
        academic_year: playlistData.visibility === 'CLASS' ? playlistData.academicYear : null,
        class_section: playlistData.visibility === 'CLASS' ? playlistData.classSection : null,
        visibility: playlistData.visibility || 'PUBLIC',
        status: playlistData.status || 'DRAFT',
        moderation_status: playlistData.moderation_status || 'PENDING',
        is_public: playlistData.isPublic === 'true',
        cover_url: finalCoverUrl || 'https://picsum.photos/seed/playlist/400/400',
        user_id: playlistData.userId
      };

      console.log('Final playlist data:', finalPlaylistData);
      const playlist = await Playlist.create(finalPlaylistData);
      console.log('Playlist created successfully:', playlist.id);
      res.status(201).json(playlist);
    } catch (error) {
      console.error('Create playlist error:', error);
      res.status(500).json({ error: 'Failed to create playlist' });
    }
  }

  static async getTracks(req, res) {
    try {
      const { id } = req.params;
      const tracks = await PlaylistTrack.findByPlaylist(id);
      res.json(tracks);
    } catch (error) {
      console.error('Get playlist tracks error:', error);
      res.status(500).json({ error: 'Failed to get playlist tracks' });
    }
  }

  static async addTrack(req, res) {
    try {
      const { id } = req.params;
      const { trackId, position } = req.body;

      if (!trackId || position === undefined) {
        return res.status(400).json({ error: 'Track ID and position required' });
      }

      // Get next position if not provided
      const finalPosition = position !== null ? position : await PlaylistTrack.getNextPosition(id);

      await PlaylistTrack.create({
        playlist_id: id,
        track_id: trackId,
        position: finalPosition.toString()
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Add track to playlist error:', error);
      res.status(500).json({ error: 'Failed to add track to playlist' });
    }
  }

  static async removeTrack(req, res) {
    try {
      const { id, trackId } = req.params;
      await PlaylistTrack.remove(id, trackId);
      res.json({ success: true });
    } catch (error) {
      console.error('Remove track from playlist error:', error);
      res.status(500).json({ error: 'Failed to remove track from playlist' });
    }
  }

  static async getDrafts(req, res) {
    try {
      const userId = req.user.id;
      const playlists = await Playlist.findDrafts(userId);
      res.json(playlists);
    } catch (error) {
      console.error('Get draft playlists error:', error);
      res.status(500).json({ error: 'Failed to get draft playlists' });
    }
  }

  static async publish(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // First check if playlist exists and belongs to the user
      const playlist = await Playlist.findById(id);
      if (!playlist) {
        return res.status(404).json({ error: 'Playlist not found' });
      }

      if (playlist.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only the playlist owner can publish it' });
      }

      const updatedPlaylist = await Playlist.publish(id);
      res.json(updatedPlaylist);
    } catch (error) {
      console.error('Publish playlist error:', error);
      res.status(500).json({ error: 'Failed to publish playlist' });
    }
  }

  static async getPendingApproval(req, res) {
    try {
      const userRole = req.user.academic_role || req.user.role;
      const userDepartment = req.user.department;
      
      // Only teachers can view pending playlists
      if (userRole !== 'TEACHER' && userRole !== 'creator' && userRole !== 'admin') {
        return res.status(403).json({ error: 'Teacher access required.' });
      }
      
      let playlists;
      if (userRole === 'admin') {
        // Admin can see all pending playlists
        playlists = await Playlist.findPendingApproval();
      } else {
        // Teachers can only see pending playlists for their department
        playlists = await Playlist.findPendingApprovalByDepartment(userDepartment);
      }
      
      res.json(playlists);
    } catch (error) {
      console.error('Get pending playlists error:', error);
      res.status(500).json({ error: 'Failed to get pending playlists' });
    }
  }

  static async approvePlaylist(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.academic_role || req.user.role;
      const userDepartment = req.user.department;
      
      // Only teachers can approve playlists
      if (userRole !== 'TEACHER' && userRole !== 'creator' && userRole !== 'admin') {
        return res.status(403).json({ error: 'Teacher access required.' });
      }
      
      // Check if playlist exists and is pending
      const playlist = await Playlist.findById(id);
      if (!playlist) {
        return res.status(404).json({ error: 'Playlist not found' });
      }
      
      if (playlist.moderation_status !== 'PENDING') {
        return res.status(400).json({ error: 'Playlist is not pending approval' });
      }
      
      // Teachers can only approve playlists for their department (unless admin)
      if (userRole !== 'admin' && playlist.department !== userDepartment) {
        return res.status(403).json({ error: 'You can only approve playlists for your department.' });
      }
      
      // Approve the playlist
      const updatedPlaylist = await Playlist.update(id, {
        status: 'PUBLISHED',
        moderation_status: 'APPROVED',
        moderated_by: req.user.id,
        moderated_at: new Date().toISOString()
      });
      
      res.json(updatedPlaylist);
    } catch (error) {
      console.error('Approve playlist error:', error);
      res.status(500).json({ error: 'Failed to approve playlist' });
    }
  }

  static async rejectPlaylist(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userRole = req.user.academic_role || req.user.role;
      const userDepartment = req.user.department;
      
      // Only teachers can reject playlists
      if (userRole !== 'TEACHER' && userRole !== 'creator' && userRole !== 'admin') {
        return res.status(403).json({ error: 'Teacher access required.' });
      }
      
      // Check if playlist exists and is pending
      const playlist = await Playlist.findById(id);
      if (!playlist) {
        return res.status(404).json({ error: 'Playlist not found' });
      }
      
      if (playlist.moderation_status !== 'PENDING') {
        return res.status(400).json({ error: 'Playlist is not pending approval' });
      }
      
      // Teachers can only reject playlists for their department (unless admin)
      if (userRole !== 'admin' && playlist.department !== userDepartment) {
        return res.status(403).json({ error: 'You can only reject playlists for your department.' });
      }
      
      // Reject the playlist
      const updatedPlaylist = await Playlist.update(id, {
        status: 'DRAFT',
        moderation_status: 'REJECTED',
        moderation_reason: reason,
        moderated_by: req.user.id,
        moderated_at: new Date().toISOString()
      });
      
      res.json(updatedPlaylist);
    } catch (error) {
      console.error('Reject playlist error:', error);
      res.status(500).json({ error: 'Failed to reject playlist' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      // First check if playlist exists and belongs to the user
      const playlist = await Playlist.findById(id);
      if (!playlist) {
        return res.status(404).json({ error: 'Playlist not found' });
      }

      if (playlist.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only the playlist owner can edit it' });
      }

      // Additional validation for class-specific playlists
      if (updateData.visibility === 'CLASS') {
        if (!updateData.department || !updateData.academicYear || !updateData.classSection) {
          return res.status(400).json({ 
            error: 'Department, academic year, and class section are required for class-specific playlists' 
          });
        }

        if (updateData.academicYear < 1 || updateData.academicYear > 4) {
          return res.status(400).json({ error: 'Academic year must be between 1 and 4' });
        }
      }

      const updatedPlaylist = await Playlist.update(id, updateData);
      res.json(updatedPlaylist);
    } catch (error) {
      console.error('Update playlist error:', error);
      res.status(500).json({ error: 'Failed to update playlist' });
    }
  }
}

module.exports = PlaylistController;
