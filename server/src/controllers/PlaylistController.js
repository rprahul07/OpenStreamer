const s3Service = require('../config/s3');
const Playlist = require('../models/Playlist');
const PlaylistTrack = require('../models/PlaylistTrack');
const Track = require('../models/Track');

class PlaylistController {
  static async getPublicPlaylists(req, res) {
    try {
      // Public endpoint - show all approved playlists without authentication
      const playlists = await Playlist.findAllApproved();
      res.json(playlists);
    } catch (error) {
      console.error('Get public playlists error:', error);
      res.status(500).json({ error: 'Failed to get public playlists' });
    }
  }

  static async getAll(req, res) {
    try {
      let playlists;
      
      console.log('=== PLAYLIST GET DEBUG ===');
      console.log('User present:', !!req.user);
      
      // If no user, return only public playlists
      if (!req.user) {
        console.log('No user detected, returning public playlists only');
        playlists = await Playlist.findPublic();
      } else if (req.user && (req.user.academic_role === 'STUDENT' || req.user.role === 'listener')) {
        console.log('User role:', req.user.role);
        console.log('User academic_role:', req.user.academic_role);
        console.log('User department:', req.user.department);
        console.log('User academic_year:', req.user.academic_year);
        console.log('User class_section:', req.user.class_section);
        
        const studentInfo = {
          department: req.user.department,
          academic_year: req.user.academic_year,
          class_section: req.user.class_section
        };
        console.log('Student user detected:', studentInfo);
        playlists = await Playlist.findForStudent(studentInfo);
      } else {
        // For teachers, admins, or unauthenticated users, show all approved playlists (public + approved class)
        console.log('Non-student user detected, showing all approved playlists');
        playlists = await Playlist.findAllApproved();
      }
      
      console.log('Final playlist count:', playlists?.length || 0);
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

      // Handle visibility and approval logic
      const userRole = req.user.academic_role || req.user.role;
      
      if (playlistData.visibility === 'CLASS') {
        // Validate academic fields for class-specific playlists
        if (!playlistData.department || !playlistData.academicYear || !playlistData.classSection) {
          return res.status(400).json({ 
            error: 'Department, academic year, and class section are required for class-specific playlists' 
          });
        }
        
        // Class playlists require teacher approval for students
        if (userRole !== 'TEACHER' && userRole !== 'creator' && userRole !== 'admin') {
          playlistData.status = 'DRAFT';
          playlistData.moderation_status = 'PENDING';
          console.log('Student creating class playlist - marked for teacher approval');
        } else {
          // Teachers can publish class playlists directly
          playlistData.status = 'PUBLISHED';
          playlistData.moderation_status = 'APPROVED';
          console.log('Teacher creating class playlist - published directly');
        }
      } else if (playlistData.visibility === 'PUBLIC') {
        // Public playlists can be published directly by all users (no approval needed)
        playlistData.status = 'PUBLISHED';
        playlistData.moderation_status = 'APPROVED';
        console.log('Creating public playlist - published directly for all users');
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
        status: playlistData.status || 'PUBLISHED', // Default to PUBLISHED for public
        moderation_status: playlistData.moderation_status || 'APPROVED', // Default to APPROVED for public
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
      console.log('=== GET PLAYLIST TRACKS DEBUG ===');
      console.log('Playlist ID:', id);
      console.log('Playlist ID type:', typeof id);
      console.log('Playlist ID length:', id ? id.length : 'undefined');
      
      const tracks = await PlaylistTrack.findByPlaylist(id);
      console.log('Tracks found:', tracks?.length || 0);
      
      if (tracks && tracks.length > 0) {
        console.log('First track:', tracks[0].title);
      }
      
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
      // Safety check - ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const userRole = req.user.academic_role || req.user.role;
      const userDepartment = req.user.department;
      
      console.log('Get pending approval - User role:', userRole, 'Department:', userDepartment);
      
      // Only teachers can view pending playlists
      if (userRole !== 'TEACHER' && userRole !== 'creator' && userRole !== 'admin') {
        return res.status(403).json({ error: 'Teacher access required.' });
      }
      
      let playlists;
      if (userRole === 'admin') {
        // Admin can see all pending playlists
        console.log('Admin user - fetching all pending playlists');
        playlists = await Playlist.findPendingApproval();
      } else if (userDepartment) {
        // Teachers can only see pending playlists for their department
        console.log('Teacher with department - fetching playlists for department:', userDepartment);
        playlists = await Playlist.findPendingApprovalByDepartment(userDepartment);
      } else {
        // Teacher with no department - show all pending playlists for testing
        console.log('Teacher with no department - fetching all pending playlists for testing');
        playlists = await Playlist.findPendingApproval();
      }
      
      console.log('Found pending playlists:', playlists.length);
      if (playlists.length > 0) {
        console.log('First playlist:', playlists[0].name, 'Department:', playlists[0].department);
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
      
      // Teachers can only approve playlists for their department (unless admin or no department)
      if (userRole !== 'admin' && userDepartment && playlist.department !== userDepartment) {
        console.log('Department mismatch: Teacher department =', userDepartment, 'Playlist department =', playlist.department);
        return res.status(403).json({ error: 'You can only approve playlists for your department.' });
      }
      
      // Approve the playlist
      console.log('Approving playlist:', id);
      console.log('Current moderation_status:', playlist.moderation_status);
      
      const updatedPlaylist = await Playlist.update(id, {
        status: 'PUBLISHED',
        moderation_status: 'APPROVED',
        moderated_by: req.user.id,
        moderated_at: new Date().toISOString()
      });
      
      console.log('Updated playlist moderation_status:', updatedPlaylist?.moderation_status);
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
      
      // Teachers can only reject playlists for their department (unless admin or no department)
      if (userRole !== 'admin' && userDepartment && playlist.department !== userDepartment) {
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
