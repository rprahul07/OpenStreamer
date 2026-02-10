import { type User, type InsertUser, type Track, type InsertTrack, type Playlist, type InsertPlaylist, type PlaylistTrack, type InsertPlaylistTrack } from "@shared/schema";
import { createClient } from '@supabase/supabase-js';

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Track methods
  getTrack(id: string): Promise<Track | undefined>;
  getTracksByUser(userId: string): Promise<Track[]>;
  getPublicTracks(): Promise<Track[]>;
  createTrack(track: InsertTrack): Promise<Track>;
  updateTrackPlayCount(id: string): Promise<void>;
  
  // Playlist methods
  getPlaylist(id: string): Promise<Playlist | undefined>;
  getPlaylistsByUser(userId: string): Promise<Playlist[]>;
  getPublicPlaylists(): Promise<Playlist[]>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  
  // Playlist Track methods
  getPlaylistTracks(playlistId: string): Promise<Track[]>;
  addTrackToPlaylist(playlistTrack: InsertPlaylistTrack): Promise<void>;
  removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void>;
}

export class SupabaseStorage implements IStorage {
  private supabase: any;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async initializeDefaultData() {
    try {
      // First, ensure demo user exists
      const { data: demoUser, error: userError } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', 'demo-user-id')
        .single();
      
      if (userError || !demoUser) {
        // Create demo user
        const { error: createUserError } = await this.supabase
          .from('users')
          .insert({
            id: 'demo-user-id',
            username: 'demo',
            password: 'demo123',
            display_name: 'Demo User',
            role: 'creator',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (createUserError) {
          console.error('Error creating demo user:', createUserError);
          return;
        } else {
          console.log('Demo user created successfully');
        }
      }
      
      // Check if we already have tracks
      const { data: existingTracks, error: tracksError } = await this.supabase
        .from('tracks')
        .select('id')
        .limit(1);
      
      if (!tracksError && (!existingTracks || existingTracks.length === 0)) {
        // Add default tracks
        const defaultTracks = [
          {
            id: 'track_1',
            title: 'Summer Vibes',
            artist: 'DJ Cool',
            album: 'Beach Mix',
            duration: 195,
            file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            cover_url: 'https://picsum.photos/seed/track1/400/400',
            uploaded_by: 'demo-user-id',
            is_public: 'true',
            play_count: '0',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'track_2',
            title: 'Night City',
            artist: 'Urban Lights',
            album: 'City Life',
            duration: 210,
            file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            cover_url: 'https://picsum.photos/seed/track2/400/400',
            uploaded_by: 'demo-user-id',
            is_public: 'true',
            play_count: '0',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'track_3',
            title: 'Mountain Echo',
            artist: 'Nature Sounds',
            album: 'Relaxation',
            duration: 180,
            file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
            cover_url: 'https://picsum.photos/seed/track3/400/400',
            uploaded_by: 'demo-user-id',
            is_public: 'true',
            play_count: '0',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        const { error: insertError } = await this.supabase
          .from('tracks')
          .insert(defaultTracks);
        
        if (insertError) {
          console.error('Error inserting default tracks:', insertError);
        } else {
          console.log('Default tracks initialized successfully');
        }
      }
    } catch (error) {
      console.error('Error initializing default data:', error);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapUserFromDb(data);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) return undefined;
    return this.mapUserFromDb(data);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert({
        username: insertUser.username,
        password: insertUser.password,
        display_name: insertUser.displayName,
        role: insertUser.role || 'listener'
      })
      .select()
      .single();
    
    if (error || !data) throw new Error('Failed to create user');
    return this.mapUserFromDb(data);
  }

  // Track methods
  async getTrack(id: string): Promise<Track | undefined> {
    const { data, error } = await this.supabase
      .from('tracks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapTrackFromDb(data);
  }

  async getTracksByUser(userId: string): Promise<Track[]> {
    const { data, error } = await this.supabase
      .from('tracks')
      .select('*')
      .eq('uploaded_by', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(this.mapTrackFromDb);
  }

  async getPublicTracks(): Promise<Track[]> {
    const { data, error } = await this.supabase
      .from('tracks')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(this.mapTrackFromDb);
  }

  async createTrack(insertTrack: InsertTrack): Promise<Track> {
    const { data, error } = await this.supabase
      .from('tracks')
      .insert({
        title: insertTrack.title,
        artist: insertTrack.artist,
        album: insertTrack.album,
        duration: insertTrack.duration,
        file_url: insertTrack.fileUrl,
        cover_url: insertTrack.coverUrl,
        uploaded_by: insertTrack.uploadedBy,
        is_public: insertTrack.isPublic ?? true
      })
      .select()
      .single();
    
    if (error || !data) throw new Error('Failed to create track');
    return this.mapTrackFromDb(data);
  }

  async updateTrackPlayCount(id: string): Promise<void> {
    // Simple increment without raw SQL for now
    const { data: track } = await this.supabase
      .from('tracks')
      .select('play_count')
      .eq('id', id)
      .single();
    
    if (track) {
      const { error } = await this.supabase
        .from('tracks')
        .update({ play_count: track.play_count + 1 })
        .eq('id', id);
      
      if (error) throw error;
    }
  }

  // Playlist methods
  async getPlaylist(id: string): Promise<Playlist | undefined> {
    const { data, error } = await this.supabase
      .from('playlists')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapPlaylistFromDb(data);
  }

  async getPlaylistsByUser(userId: string): Promise<Playlist[]> {
    const { data, error } = await this.supabase
      .from('playlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(this.mapPlaylistFromDb);
  }

  async getPublicPlaylists(): Promise<Playlist[]> {
    const { data, error } = await this.supabase
      .from('playlists')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(this.mapPlaylistFromDb);
  }

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const { data, error } = await this.supabase
      .from('playlists')
      .insert({
        name: insertPlaylist.name,
        description: insertPlaylist.description,
        user_id: insertPlaylist.userId,
        is_public: insertPlaylist.isPublic ?? false,
        cover_url: insertPlaylist.coverUrl
      })
      .select()
      .single();
    
    if (error || !data) throw new Error('Failed to create playlist');
    return this.mapPlaylistFromDb(data);
  }

  // Playlist Track methods
  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    const { data, error } = await this.supabase
      .from('playlist_tracks')
      .select(`
        track_id,
        position
      `)
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    
    if (!data || data.length === 0) return [];
    
    // Get track details for each track in playlist
    const trackIds = data.map((pt: any) => pt.track_id);
    const { data: tracks, error: tracksError } = await this.supabase
      .from('tracks')
      .select('*')
      .in('id', trackIds);
    
    if (tracksError) throw tracksError;
    
    return tracks.map(this.mapTrackFromDb);
  }

  async addTrackToPlaylist(insertPlaylistTrack: InsertPlaylistTrack): Promise<void> {
    const { data, error } = await this.supabase
      .from('playlist_tracks')
      .insert({
        playlist_id: insertPlaylistTrack.playlistId,
        track_id: insertPlaylistTrack.trackId,
        position: insertPlaylistTrack.position
      })
      .select()
      .single();
    
    if (error || !data) {
      console.error('Storage error adding track to playlist:', error);
      throw new Error('Failed to add track to playlist');
    }
  }

  async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    const { error } = await this.supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId);
    
    if (error) throw error;
  }

  // Helper methods to map database objects to our types
  private mapUserFromDb(data: any): User {
    return {
      id: data.id,
      username: data.username,
      password: data.password,
      displayName: data.display_name,
      role: data.role as 'admin' | 'creator' | 'listener',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapTrackFromDb(data: any): Track {
    return {
      id: data.id,
      title: data.title,
      artist: data.artist,
      album: data.album,
      duration: data.duration,
      fileUrl: data.file_url,
      coverUrl: data.cover_url,
      uploadedBy: data.uploaded_by,
      isPublic: data.is_public,
      playCount: data.play_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapPlaylistFromDb(data: any): Playlist {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      userId: data.user_id,
      isPublic: data.is_public,
      coverUrl: data.cover_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapPlaylistTrackFromDb(data: any): PlaylistTrack {
    return {
      id: data.id,
      playlistId: data.playlist_id,
      trackId: data.track_id,
      position: data.position,
      addedAt: data.added_at
    };
  }
}

export const storage = new SupabaseStorage();
