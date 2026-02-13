const database = require('../config/database');

class PlaylistModel {
  static async findById(id) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('playlists')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error finding playlist by ID:', error);
      return null;
    }
  }

  static async findByUser(userId) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('playlists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error finding playlists by user:', error);
      return [];
    }
  }

  static async findPublic() {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('playlists')
        .select('*')
        .eq('is_public', 'true')
        .eq('status', 'PUBLISHED')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error finding public playlists:', error);
      return [];
    }
  }

  static async findForStudent(studentInfo) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('playlists')
        .select('*')
        .or(`and(status.eq.PUBLISHED,visibility.eq.PUBLIC),and(status.eq.PUBLISHED,visibility.eq.CLASS,department.eq.${studentInfo.department},academic_year.eq.${studentInfo.academic_year},class_section.eq.${studentInfo.class_section})`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error finding playlists for student:', error);
      return [];
    }
  }

  static async findDrafts(userId) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('playlists')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'DRAFT')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error finding draft playlists:', error);
      return [];
    }
  }

  static async create(playlistData) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('playlists')
        .insert({
          ...playlistData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('playlists')
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
      console.error('Error updating playlist:', error);
      throw error;
    }
  }

  static async publish(id) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('playlists')
        .update({
          status: 'PUBLISHED',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error publishing playlist:', error);
      throw error;
    }
  }
}

module.exports = PlaylistModel;
