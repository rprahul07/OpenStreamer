const database = require('../config/database');

class PlaylistModel {
  static async findById(id) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('playlists')
        .select('*')
        .eq('id', id)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no results
      
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
      console.log('=== FIND PUBLIC PLAYLISTS DEBUG ===');
      
      // Get public playlists
      const { data: publicPlaylists, error: publicError } = await database.getSupabaseClient()
        .from('playlists')
        .select('*')
        .eq('visibility', 'PUBLIC')
        .eq('status', 'PUBLISHED');
      
      if (publicError) throw publicError;
      
      console.log('Public playlists found:', publicPlaylists?.length || 0);
      
      // Get approved class playlists
      const { data: classPlaylists, error: classError } = await database.getSupabaseClient()
        .from('playlists')
        .select('*')
        .eq('visibility', 'CLASS')
        .eq('status', 'PUBLISHED')
        .eq('moderation_status', 'APPROVED');
      
      if (classError) throw classError;
      
      console.log('Approved class playlists found:', classPlaylists?.length || 0);
      
      // Combine results
      const allPlaylists = [...(publicPlaylists || []), ...(classPlaylists || [])];
      
      console.log('Total playlists for public access:', allPlaylists.length);
      allPlaylists.forEach((playlist, index) => {
        console.log(`Playlist ${index + 1}: ${playlist.name} | Visibility: ${playlist.visibility} | Status: ${playlist.status}`);
      });
      
      return allPlaylists;
    } catch (error) {
      console.error('Error finding public playlists:', error);
      return [];
    }
  }

  static async findAllApproved() {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('playlists')
        .select('*')
        .eq('status', 'PUBLISHED')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error finding all approved playlists:', error);
      return [];
    }
  }

  static async findForStudent(studentInfo) {
    try {
      console.log('Finding playlists for student:', studentInfo);
      
      // Get public playlists
      const { data: publicPlaylists, error: publicError } = await database.getSupabaseClient()
        .from('playlists')
        .select('*')
        .eq('visibility', 'PUBLIC')
        .eq('status', 'PUBLISHED');
      
      if (publicError) throw publicError;
      
      // Get class-specific playlists for this student
      const { data: classPlaylists, error: classError } = await database.getSupabaseClient()
        .from('playlists')
        .select('*')
        .eq('visibility', 'CLASS')
        .eq('status', 'PUBLISHED')
        .eq('moderation_status', 'APPROVED')
        .eq('department', studentInfo.department)
        .eq('academic_year', studentInfo.academic_year)
        .eq('class_section', studentInfo.class_section);
      
      if (classError) throw classError;
      
      // Combine results
      const allPlaylists = [...(publicPlaylists || []), ...(classPlaylists || [])];
      
      console.log('Student query result count:', allPlaylists.length);
      if (allPlaylists.length > 0) {
        console.log('First playlist for student:', allPlaylists[0].name, 'visibility:', allPlaylists[0].visibility, 'department:', allPlaylists[0].department);
      }
      
      return allPlaylists;
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
      console.log('Updating playlist:', id, 'with data:', updateData);
      
      const { data, error } = await database.getSupabaseClient()
        .from('playlists')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .maybeSingle(); // Use maybeSingle to avoid errors
      
      if (error) {
        console.error('Database update error:', error);
        throw error;
      }
      
      console.log('Update result:', data);
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

  static async findPendingApproval() {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('playlists')
        .select('*')
        .eq('moderation_status', 'PENDING')
        .eq('visibility', 'CLASS')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error finding pending playlists:', error);
      throw error;
    }
  }

  static async findPendingApprovalByDepartment(department) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('playlists')
        .select('*')
        .eq('moderation_status', 'PENDING')
        .eq('visibility', 'CLASS')
        .eq('department', department)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error finding pending playlists by department:', error);
      throw error;
    }
  }
}

module.exports = PlaylistModel;
