const database = require('../config/database');

class InteractionController {
  // Like or dislike a track
  static async interactWithTrack(req, res) {
    try {
      const { trackId } = req.params;
      const { interactionType } = req.body; // 'LIKE' or 'DISLIKE'
      
      if (!['LIKE', 'DISLIKE'].includes(interactionType)) {
        return res.status(400).json({ error: 'Invalid interaction type' });
      }
      
      const { data, error } = await database.supabase
        .rpc('handle_track_interaction', {
          track_id_param: trackId,
          user_id_param: req.user.id,
          interaction_type_param: interactionType
        });
      
      if (error) {
        console.error('Track interaction error:', error);
        return res.status(500).json({ error: 'Failed to process interaction' });
      }
      
      const result = data[0];
      res.json({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      console.error('Track interaction error:', error);
      res.status(500).json({ error: 'Failed to process interaction' });
    }
  }

  // Get user's interaction with a track
  static async getUserInteraction(req, res) {
    try {
      const { trackId } = req.params;
      
      const { data, error } = await database.supabase
        .from('track_interactions')
        .select('interaction_type')
        .eq('track_id', trackId)
        .eq('user_id', req.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Get user interaction error:', error);
        return res.status(500).json({ error: 'Failed to get interaction' });
      }
      
      res.json({
        interaction: data ? data.interaction_type : null
      });
    } catch (error) {
      console.error('Get user interaction error:', error);
      res.status(500).json({ error: 'Failed to get interaction' });
    }
  }

  // Get track engagement stats
  static async getTrackEngagement(req, res) {
    try {
      const { trackId } = req.params;
      
      const { data, error } = await database.supabase
        .from('tracks')
        .select('likes_count, dislikes_count, is_active, engagement_threshold, auto_remove_threshold')
        .eq('id', trackId)
        .single();
      
      if (error) {
        console.error('Get track engagement error:', error);
        return res.status(500).json({ error: 'Failed to get engagement stats' });
      }
      
      // Calculate engagement score
      const engagementScore = (data.dislikes_count || 0) - (data.likes_count || 0);
      const totalInteractions = (data.likes_count || 0) + (data.dislikes_count || 0);
      
      res.json({
        likes: data.likes_count || 0,
        dislikes: data.dislikes_count || 0,
        totalInteractions,
        engagementScore,
        isActive: data.is_active,
        engagementThreshold: data.engagement_threshold,
        autoRemoveThreshold: data.auto_remove_threshold,
        status: data.is_active ? 'Active' : 'Inactive'
      });
    } catch (error) {
      console.error('Get track engagement error:', error);
      res.status(500).json({ error: 'Failed to get engagement stats' });
    }
  }

  // Get popular tracks (high engagement)
  static async getPopularTracks(req, res) {
    try {
      const { limit = 20 } = req.query;
      
      const { data, error } = await database.supabase
        .from('active_tracks_with_engagement')
        .select('*')
        .eq('is_active', true)
        .gte('likes_count', 5)
        .order('likes_count', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Get popular tracks error:', error);
        return res.status(500).json({ error: 'Failed to get popular tracks' });
      }
      
      res.json(data || []);
    } catch (error) {
      console.error('Get popular tracks error:', error);
      res.status(500).json({ error: 'Failed to get popular tracks' });
    }
  }

  // Get engagement statistics for teachers
  static async getEngagementStats(req, res) {
    try {
      const { department, academicYear, classSection } = req.query;
      
      let query = database.supabase
        .from('active_tracks_with_engagement')
        .select('*');
      
      // Filter by academic criteria if provided
      if (department) {
        query = query.eq('department', department);
      }
      if (academicYear) {
        query = query.eq('academic_year', academicYear);
      }
      if (classSection) {
        query = query.eq('class_section', classSection);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Get engagement stats error:', error);
        return res.status(500).json({ error: 'Failed to get engagement stats' });
      }
      
      const tracks = data || [];
      
      // Calculate statistics
      const totalTracks = tracks.length;
      const activeTracks = tracks.filter(t => t.is_active).length;
      const totalLikes = tracks.reduce((sum, t) => sum + (t.likes_count || 0), 0);
      const totalDislikes = tracks.reduce((sum, t) => sum + (t.dislikes_count || 0), 0);
      const averageEngagement = totalTracks > 0 ? (totalLikes + totalDislikes) / totalTracks : 0;
      
      // Engagement status breakdown
      const engagementBreakdown = tracks.reduce((acc, track) => {
        const status = track.engagement_status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      res.json({
        summary: {
          totalTracks,
          activeTracks,
          inactiveTracks: totalTracks - activeTracks,
          totalLikes,
          totalDislikes,
          averageEngagement: Math.round(averageEngagement * 100) / 100
        },
        engagementBreakdown,
        tracks: tracks.slice(0, 50) // Return top 50 tracks
      });
    } catch (error) {
      console.error('Get engagement stats error:', error);
      res.status(500).json({ error: 'Failed to get engagement stats' });
    }
  }

  // Manually update engagement for a track (admin function)
  static async updateEngagement(req, res) {
    try {
      const { trackId } = req.params;
      
      const { error } = await database.supabase
        .rpc('update_track_engagement', {
          track_id_param: trackId
        });
      
      if (error) {
        console.error('Update engagement error:', error);
        return res.status(500).json({ error: 'Failed to update engagement' });
      }
      
      res.json({ message: 'Engagement updated successfully' });
    } catch (error) {
      console.error('Update engagement error:', error);
      res.status(500).json({ error: 'Failed to update engagement' });
    }
  }
}

module.exports = InteractionController;
