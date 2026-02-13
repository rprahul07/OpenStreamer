const database = require('../config/database');

class UserModel {
  static async findById(id) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  static async findByUsername(username) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error finding user by username:', error);
      return null;
    }
  }

  static async create(userData) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('users')
        .insert({
          ...userData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const { data, error } = await database.getSupabaseClient()
        .from('users')
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
      console.error('Error updating user:', error);
      throw error;
    }
  }
}

module.exports = UserModel;
