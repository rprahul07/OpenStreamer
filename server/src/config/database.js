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
      
      // Create user_branding_settings table if it doesn't exist
      await this.createUserBrandingSettingsTable();
      
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

  async createUserBrandingSettingsTable() {
    try {
      // Using raw SQL to create the table since Drizzle isn't set up for this
      const { error } = await this.supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.user_branding_settings (
              id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id TEXT NOT NULL UNIQUE,
              app_name TEXT DEFAULT 'Academic Audio Platform',
              app_logo_url TEXT,
              app_icon_url TEXT,
              splash_screen_url TEXT,
              primary_color TEXT DEFAULT '#4F46E5',
              secondary_color TEXT DEFAULT '#10B981',
              accent_color TEXT DEFAULT '#F59E0B',
              background_color TEXT DEFAULT '#FFFFFF',
              text_color TEXT DEFAULT '#1F2937',
              theme_mode TEXT DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'auto')),
              font_family TEXT,
              custom_css TEXT,
              footer_text TEXT DEFAULT '2024 Academic Audio Platform',
              contact_email TEXT,
              social_links TEXT,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE INDEX IF NOT EXISTS idx_user_branding_settings_user_id ON public.user_branding_settings(user_id);
          
          ALTER TABLE public.user_branding_settings ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Users can view own branding settings" ON public.user_branding_settings;
          CREATE POLICY "Users can view own branding settings" ON public.user_branding_settings
              FOR SELECT USING (auth.uid()::text = user_id);
          
          DROP POLICY IF EXISTS "Users can insert own branding settings" ON public.user_branding_settings;
          CREATE POLICY "Users can insert own branding settings" ON public.user_branding_settings
              FOR INSERT WITH CHECK (auth.uid()::text = user_id);
          
          DROP POLICY IF EXISTS "Users can update own branding settings" ON public.user_branding_settings;
          CREATE POLICY "Users can update own branding settings" ON public.user_branding_settings
              FOR UPDATE USING (auth.uid()::text = user_id);
          
          GRANT SELECT, INSERT, UPDATE ON public.user_branding_settings TO authenticated;
          GRANT SELECT ON public.user_branding_settings TO anon;
        `
      });
      
      if (error) {
        console.error('Error creating user_branding_settings table:', error);
        // Try alternative approach using direct SQL
        await this.createTableWithDirectSQL();
      } else {
        console.log('User branding settings table created successfully');
      }
    } catch (error) {
      console.error('Error in createUserBrandingSettingsTable:', error);
      await this.createTableWithDirectSQL();
    }
  }

  async createTableWithDirectSQL() {
    try {
      console.log('Creating user_branding_settings table using direct approach...');
      
      // Simple table creation without RLS for now
      const { error } = await this.supabase
        .from('user_branding_settings')
        .select('id')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        // Table doesn't exist, we need to create it manually
        console.log('Table does not exist. Please run the SQL script manually:');
        console.log('File: setup-user-branding.sql');
        console.log('Run this in your Supabase SQL editor:');
        console.log(`
          CREATE TABLE IF NOT EXISTS public.user_branding_settings (
              id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id TEXT NOT NULL UNIQUE,
              app_name TEXT DEFAULT 'Academic Audio Platform',
              app_logo_url TEXT,
              app_icon_url TEXT,
              splash_screen_url TEXT,
              primary_color TEXT DEFAULT '#4F46E5',
              secondary_color TEXT DEFAULT '#10B981',
              accent_color TEXT DEFAULT '#F59E0B',
              background_color TEXT DEFAULT '#FFFFFF',
              text_color TEXT DEFAULT '#1F2937',
              theme_mode TEXT DEFAULT 'light',
              font_family TEXT,
              custom_css TEXT,
              footer_text TEXT DEFAULT '2024 Academic Audio Platform',
              contact_email TEXT,
              social_links TEXT,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          );
        `);
      } else {
        console.log('User branding settings table exists');
      }
    } catch (error) {
      console.error('Error in createTableWithDirectSQL:', error);
    }
  }

  getSupabaseClient() {
    return this.supabase;
  }
}

module.exports = new DatabaseService();
