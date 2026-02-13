const database = require('../config/database');

class EmotionController {
  // Get all available emotions/moods
  static async getAllEmotions(req, res) {
    try {
      const { data, error } = await database.supabase
        .from('emotion_moods')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Get all emotions error:', error);
        return res.status(500).json({ error: 'Failed to get emotions' });
      }
      
      res.json(data || []);
    } catch (error) {
      console.error('Get all emotions error:', error);
      res.status(500).json({ error: 'Failed to get emotions' });
    }
  }

  // Get tracks by emotion
  static async getTracksByEmotion(req, res) {
    try {
      const { emotionId } = req.params;
      const { limit = 20, department, academicYear, classSection } = req.query;
      
      let query = database.supabase
        .from('tracks_with_emotions')
        .select('*');
      
      // Filter by emotion
      query = query.contains('emotions', [{'id': emotionId}]);
      
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
      
      // Only show active tracks for students
      if (req.user && (req.user.academic_role === 'STUDENT' || req.user.role === 'listener')) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query
        .order('likes_count', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Get tracks by emotion error:', error);
        return res.status(500).json({ error: 'Failed to get tracks by emotion' });
      }
      
      res.json(data || []);
    } catch (error) {
      console.error('Get tracks by emotion error:', error);
      res.status(500).json({ error: 'Failed to get tracks by emotion' });
    }
  }

  // Search tracks by emotion keywords
  static async searchByEmotion(req, res) {
    try {
      const { emotion, keywords, limit = 20 } = req.query;
      
      if (!emotion && !keywords) {
        return res.status(400).json({ error: 'Emotion or keywords required' });
      }
      
      let query = database.supabase
        .from('emotion_moods')
        .select('*');
      
      if (emotion) {
        query = query.ilike('name', `%${emotion}%`);
      }
      
      if (keywords) {
        const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
        query = query.contains('keywords', keywordArray);
      }
      
      const { data: emotions, error: emotionError } = await query;
      
      if (emotionError) {
        console.error('Search emotions error:', emotionError);
        return res.status(500).json({ error: 'Failed to search emotions' });
      }
      
      if (!emotions || emotions.length === 0) {
        return res.json([]);
      }
      
      // Get tracks for found emotions
      const emotionIds = emotions.map(e => e.id);
      const { data: tracks, error: trackError } = await database.supabase
        .from('tracks_with_emotions')
        .select('*')
        .contains('emotions', emotionIds.map(id => ({id})))
        .eq('is_active', true)
        .order('likes_count', { ascending: false })
        .limit(limit);
      
      if (trackError) {
        console.error('Get tracks by searched emotions error:', trackError);
        return res.status(500).json({ error: 'Failed to get tracks' });
      }
      
      res.json({
        emotions: emotions || [],
        tracks: tracks || []
      });
    } catch (error) {
      console.error('Search by emotion error:', error);
      res.status(500).json({ error: 'Failed to search by emotion' });
    }
  }

  // Assign emotions to tracks (teacher/admin function)
  static async assignEmotionToTrack(req, res) {
    try {
      const { trackId } = req.params;
      const { emotionId, confidenceScore = 1.0, assignmentType = 'manual' } = req.body;
      
      // Validate confidence score
      if (confidenceScore < 0 || confidenceScore > 1) {
        return res.status(400).json({ error: 'Confidence score must be between 0 and 1' });
      }
      
      const { data, error } = await database.supabase
        .from('track_emotions')
        .upsert({
          id: `${trackId}_${emotionId}`,
          track_id: trackId,
          emotion_id: emotionId,
          confidence_score: confidenceScore,
          assigned_by: req.user.id,
          assignment_type: assignmentType,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Assign emotion to track error:', error);
        return res.status(500).json({ error: 'Failed to assign emotion to track' });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Assign emotion to track error:', error);
      res.status(500).json({ error: 'Failed to assign emotion to track' });
    }
  }

  // Remove emotion from track
  static async removeEmotionFromTrack(req, res) {
    try {
      const { trackId, emotionId } = req.params;
      
      const { error } = await database.supabase
        .from('track_emotions')
        .delete()
        .eq('track_id', trackId)
        .eq('emotion_id', emotionId);
      
      if (error) {
        console.error('Remove emotion from track error:', error);
        return res.status(500).json({ error: 'Failed to remove emotion from track' });
      }
      
      res.json({ message: 'Emotion removed from track successfully' });
    } catch (error) {
      console.error('Remove emotion from track error:', error);
      res.status(500).json({ error: 'Failed to remove emotion from track' });
    }
  }

  // Get emotion-based recommendations for user
  static async getEmotionRecommendations(req, res) {
    try {
      const { emotionId, limit = 10 } = req.query;
      
      if (!emotionId) {
        return res.status(400).json({ error: 'Emotion ID required' });
      }
      
      // Get user's academic info for filtering
      const userAcademicInfo = {
        department: req.user.department,
        academic_year: req.user.academic_year,
        class_section: req.user.class_section
      };
      
      // Get tracks by emotion, filtered by user's academic info
      let query = database.supabase
        .from('tracks_with_emotions')
        .select('*')
        .contains('emotions', [{'id': emotionId}])
        .eq('is_active', true);
      
      // Filter by academic criteria if user is student
      if (req.user.academic_role === 'STUDENT') {
        if (userAcademicInfo.department) {
          query = query.or(`department.eq.${userAcademicInfo.department},is_public.eq.true`);
        }
      }
      
      const { data, error } = await query
        .order('likes_count', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Get emotion recommendations error:', error);
        return res.status(500).json({ error: 'Failed to get emotion recommendations' });
      }
      
      res.json(data || []);
    } catch (error) {
      console.error('Get emotion recommendations error:', error);
      res.status(500).json({ error: 'Failed to get emotion recommendations' });
    }
  }

  // Get emotion statistics for teachers
  static async getEmotionStats(req, res) {
    try {
      const { department, academicYear, classSection } = req.query;
      
      let query = database.supabase
        .from('tracks_with_emotions')
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
        console.error('Get emotion stats error:', error);
        return res.status(500).json({ error: 'Failed to get emotion statistics' });
      }
      
      const tracks = data || [];
      
      // Calculate emotion distribution
      const emotionDistribution = {};
      tracks.forEach(track => {
        if (track.emotions && Array.isArray(track.emotions)) {
          track.emotions.forEach(emotion => {
            const emotionName = emotion.name;
            emotionDistribution[emotionName] = (emotionDistribution[emotionName] || 0) + 1;
          });
        }
      });
      
      // Get all emotions for complete list
      const { data: allEmotions, error: emotionsError } = await database.supabase
        .from('emotion_moods')
        .select('*');
      
      if (emotionsError) {
        console.error('Get all emotions error:', emotionsError);
        return res.status(500).json({ error: 'Failed to get emotions' });
      }
      
      // Complete emotion stats with zero counts
      const completeStats = allEmotions.map(emotion => ({
        id: emotion.id,
        name: emotion.name,
        description: emotion.description,
        color: emotion.color,
        trackCount: emotionDistribution[emotion.name] || 0,
        percentage: tracks.length > 0 ? ((emotionDistribution[emotion.name] || 0) / tracks.length * 100).toFixed(2) : '0.00'
      }));
      
      res.json({
        totalTracks: tracks.length,
        emotionDistribution: completeStats.sort((a, b) => b.trackCount - a.trackCount)
      });
    } catch (error) {
      console.error('Get emotion stats error:', error);
      res.status(500).json({ error: 'Failed to get emotion statistics' });
    }
  }
}

module.exports = EmotionController;
