const database = require('../config/database');

class TrackModel {
  static async findById(id) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('tracks')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error finding track by ID:', error);
      return null;
    }
  }

  static async findByUser(userId) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('tracks')
        .select('*')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error finding tracks by user:', error);
      return [];
    }
  }

  static async findPublic() {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('tracks')
        .select('*')
        .eq('is_public', 'true')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error finding public tracks:', error);
      return [];
    }
  }

  static async create(trackData) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('tracks')
        .insert({
          ...trackData,
          play_count: '0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating track:', error);
      throw error;
    }
  }

  static async updatePlayCount(id) {
    try {
      // First get current play count
      const { data: currentTrack, error: fetchError } = await database.getSupabaseClient()
        .from('tracks')
        .select('play_count')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentCount = parseInt(currentTrack.play_count || '0');
      const newCount = (currentCount + 1).toString();
      
      const { data, error } = await database.getSupabaseClient()
        .from('tracks')
        .update({
          play_count: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating play count:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('tracks')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating track:', error);
      throw error;
    }
  }
}

module.exports = TrackModel;
