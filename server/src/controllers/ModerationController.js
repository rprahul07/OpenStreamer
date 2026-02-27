const database = require('../config/database');

class ModerationController {
  // Get pending content for teachers to review
  static async getPendingContent(req, res) {
    try {
      const userRole = req.user.academic_role || req.user.role;
      const userDepartment = req.user.department;

      // Strict department check for non-admins
      let filterDepartment = req.query.department;
      if (userRole !== 'admin') {
        if (!userDepartment) {
          return res.status(403).json({ error: 'Your account must be assigned to a department to review content.' });
        }
        filterDepartment = userDepartment; // Always use teacher's department
      }

      const { academicYear, classSection } = req.query;

      let query = `
        SELECT * FROM teacher_pending_content 
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (filterDepartment) {
        query += ` AND department = $${paramIndex++}`;
        params.push(filterDepartment);
      }

      if (academicYear) {
        query += ` AND academic_year = $${paramIndex++}`;
        params.push(academicYear);
      }

      if (classSection) {
        query += ` AND class_section = $${paramIndex++}`;
        params.push(classSection);
      }

      query += ` ORDER BY created_at DESC`;

      const { data, error } = await database.supabase
        .rpc('execute_sql', { sql_query: query, params });

      if (error) {
        console.error('Get pending content error:', error);
        return res.status(500).json({ error: 'Failed to get pending content' });
      }

      res.json(data || []);
    } catch (error) {
      console.error('Get pending content error:', error);
      res.status(500).json({ error: 'Failed to get pending content' });
    }
  }

  // Approve content
  static async approveContent(req, res) {
    try {
      const { contentId } = req.params;
      const { contentType } = req.body; // 'track' or 'playlist'
      const userRole = req.user.academic_role || req.user.role;
      const userDepartment = req.user.department;

      if (!['track', 'playlist'].includes(contentType)) {
        return res.status(400).json({ error: 'Invalid content type' });
      }

      const tableName = contentType === 'track' ? 'tracks' : 'playlists';

      // Verify department match before approving
      if (userRole !== 'admin') {
        const { data: content, error: fetchError } = await database.supabase
          .from(tableName)
          .select('department')
          .eq('id', contentId)
          .single();

        if (fetchError || !content) {
          return res.status(404).json({ error: 'Content not found' });
        }

        if (content.department !== userDepartment) {
          return res.status(403).json({ error: `You can only approve content for the ${userDepartment} department.` });
        }
      }

      const { error } = await database.supabase
        .from(tableName)
        .update({
          moderation_status: 'APPROVED',
          moderated_by: req.user.id,
          moderated_at: new Date().toISOString(),
          moderation_reason: null
        })
        .eq('id', contentId);

      if (error) {
        console.error('Approve content error:', error);
        return res.status(500).json({ error: 'Failed to approve content' });
      }

      res.json({ message: 'Content approved successfully' });
    } catch (error) {
      console.error('Approve content error:', error);
      res.status(500).json({ error: 'Failed to approve content' });
    }
  }

  // Reject content
  static async rejectContent(req, res) {
    try {
      const { contentId } = req.params;
      const { contentType, reason } = req.body; // 'track' or 'playlist'
      const userRole = req.user.academic_role || req.user.role;
      const userDepartment = req.user.department;

      if (!['track', 'playlist'].includes(contentType)) {
        return res.status(400).json({ error: 'Invalid content type' });
      }

      const tableName = contentType === 'track' ? 'tracks' : 'playlists';

      // Verify department match before rejecting
      if (userRole !== 'admin') {
        const { data: content, error: fetchError } = await database.supabase
          .from(tableName)
          .select('department')
          .eq('id', contentId)
          .single();

        if (fetchError || !content) {
          return res.status(404).json({ error: 'Content not found' });
        }

        if (content.department !== userDepartment) {
          return res.status(403).json({ error: `You can only reject content for the ${userDepartment} department.` });
        }
      }

      const { error } = await database.supabase
        .from(tableName)
        .update({
          moderation_status: 'REJECTED',
          moderated_by: req.user.id,
          moderated_at: new Date().toISOString(),
          moderation_reason: reason || 'Content rejected by teacher'
        })
        .eq('id', contentId);

      if (error) {
        console.error('Reject content error:', error);
        return res.status(500).json({ error: 'Failed to reject content' });
      }

      res.json({ message: 'Content rejected successfully' });
    } catch (error) {
      console.error('Reject content error:', error);
      res.status(500).json({ error: 'Failed to reject content' });
    }
  }

  // Get moderation statistics for teachers
  static async getModerationStats(req, res) {
    try {
      const { department, academicYear, classSection } = req.query;

      // Get stats for tracks
      let trackQuery = `
        SELECT 
          moderation_status,
          COUNT(*) as count
        FROM tracks 
        WHERE is_public = 'false'
      `;

      const trackParams = [];
      let paramIndex = 1;

      if (department) {
        trackQuery += ` AND department = $${paramIndex++}`;
        trackParams.push(department);
      }

      if (academicYear) {
        trackQuery += ` AND academic_year = $${paramIndex++}`;
        trackParams.push(academicYear);
      }

      if (classSection) {
        trackQuery += ` AND class_section = $${paramIndex++}`;
        trackParams.push(classSection);
      }

      trackQuery += ` GROUP BY moderation_status`;

      // Get stats for playlists
      let playlistQuery = `
        SELECT 
          moderation_status,
          COUNT(*) as count
        FROM playlists 
        WHERE is_public = 'false'
      `;

      const playlistParams = [];
      paramIndex = 1;

      if (department) {
        playlistQuery += ` AND department = $${paramIndex++}`;
        playlistParams.push(department);
      }

      if (academicYear) {
        playlistQuery += ` AND academic_year = $${paramIndex++}`;
        playlistParams.push(academicYear);
      }

      if (classSection) {
        playlistQuery += ` AND class_section = $${paramIndex++}`;
        playlistParams.push(classSection);
      }

      playlistQuery += ` GROUP BY moderation_status`;

      const [trackStats, playlistStats] = await Promise.all([
        database.supabase.rpc('execute_sql', { sql_query: trackQuery, params: trackParams }),
        database.supabase.rpc('execute_sql', { sql_query: playlistQuery, params: playlistParams })
      ]);

      res.json({
        tracks: trackStats.data || [],
        playlists: playlistStats.data || []
      });
    } catch (error) {
      console.error('Get moderation stats error:', error);
      res.status(500).json({ error: 'Failed to get moderation stats' });
    }
  }
}

module.exports = ModerationController;
