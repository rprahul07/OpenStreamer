const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

class DatabaseService {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
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
      // Add a delay to ensure Supabase connection is ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // First, ensure demo user exists
      const { data: demoUser, error: userError } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', 'demo-user-id')
        .single();
      
      if (userError || !demoUser) {
        // Create demo user
        const hashedPassword = await bcrypt.hash('demo123', 10);
        const demoUser = {
          id: 'demo-user-id',
          username: 'demo',
          password: hashedPassword,
          display_name: 'Demo User',
          role: 'creator',
          academic_role: 'TEACHER',
          department: 'CSE', 
          academic_year: 3,
          class_section: 'A',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: createUserError } = await this.supabase
          .from('users')
          .insert(demoUser);
        
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
            duration: '195',
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
            title: 'Night Drive',
            artist: 'Synthwave',
            album: 'Retro Future',
            duration: '240',
            file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            cover_url: 'https://picsum.photos/seed/track2/400/400',
            uploaded_by: 'demo-user-id',
            is_public: 'true',
            play_count: '0',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        const { error: insertTracksError } = await this.supabase
          .from('tracks')
          .insert(defaultTracks);
        
        if (insertTracksError) {
          console.error('Error inserting default tracks:', insertTracksError);
        } else {
          console.log('Default tracks created successfully');
        }
        
        // Create default playlists
        const defaultPlaylists = [
          {
            id: 'playlist_1',
            name: 'Chill Vibes',
            description: 'Relaxing music for study sessions',
            user_id: 'demo-user-id',
            is_public: 'true',
            visibility: 'PUBLIC',
            status: 'PUBLISHED',
            subject: 'Music Appreciation',
            department: 'Computer Science',
            academic_year: 3,
            class_section: 'A',
            cover_url: 'https://picsum.photos/seed/playlist1/400/400',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        const { error: insertPlaylistsError } = await this.supabase
          .from('playlists')
          .insert(defaultPlaylists);
        
        if (insertPlaylistsError) {
          console.error('Error inserting default playlists:', insertPlaylistsError);
        } else {
          console.log('Default playlists created successfully');
          
          // Add tracks to playlist
          const playlistTracks = [
            {
              id: 'pt_1',
              playlist_id: 'playlist_1',
              track_id: 'track_1',
              position: '0',
              added_at: new Date().toISOString()
            },
            {
              id: 'pt_2',
              playlist_id: 'playlist_1',
              track_id: 'track_2',
              position: '1',
              added_at: new Date().toISOString()
            }
          ];
          
          const { error: insertPlaylistTracksError } = await this.supabase
            .from('playlist_tracks')
            .insert(playlistTracks);
          
          if (insertPlaylistTracksError) {
            console.error('Error inserting playlist tracks:', insertPlaylistTracksError);
          } else {
            console.log('Default playlist tracks created successfully');
          }
        }
      }
    } catch (error) {
      console.error('Error initializing default data:', error);
    }
  }

  getSupabaseClient() {
    return this.supabase;
  }
}

module.exports = new DatabaseService();
