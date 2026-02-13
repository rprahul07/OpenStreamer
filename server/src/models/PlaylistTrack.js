const database = require('../config/database');

class PlaylistTrackModel {
  static async findByPlaylist(playlistId) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('playlist_tracks')
        .select(`
          *,
          tracks(*)
        `)
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });
      
      if (error) throw error;
      
      // Extract track information
      return data.map(item => item.tracks).filter(track => track);
    } catch (error) {
      console.error('Error finding tracks by playlist:', error);
      return [];
    }
  }

  static async create(playlistTrackData) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('playlist_tracks')
        .insert({
          ...playlistTrackData,
          added_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      throw error;
    }
  }

  static async remove(playlistId, trackId) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error removing track from playlist:', error);
      throw error;
    }
  }

  static async updatePositions(playlistId, trackPositions) {
    try {
      const updates = trackPositions.map(({ trackId, position }) => 
        database.getSupabaseClient()
          .from('playlist_tracks')
          .update({ position: position.toString() })
          .eq('playlist_id', playlistId)
          .eq('track_id', trackId)
      );

      await Promise.all(updates);
      return true;
    } catch (error) {
      console.error('Error updating track positions:', error);
      throw error;
    }
  }

  static async getNextPosition(playlistId) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('playlist_tracks')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return '0';
      }
      
      return (parseInt(data[0].position) + 1).toString();
    } catch (error) {
      console.error('Error getting next position:', error);
      return '0';
    }
  }
}

module.exports = PlaylistTrackModel;
