-- Enhanced white labeling system
-- Support for customizable app branding, themes, and settings

-- Create branding_settings table
CREATE TABLE IF NOT EXISTS branding_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  app_name VARCHAR(100) DEFAULT 'Academic Audio Platform',
  app_logo_url TEXT,
  app_icon_url TEXT,
  splash_screen_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#4F46E5',
  secondary_color VARCHAR(7) DEFAULT '#10B981',
  accent_color VARCHAR(7) DEFAULT '#F59E0B',
  background_color VARCHAR(7) DEFAULT '#FFFFFF',
  text_color VARCHAR(7) DEFAULT '#1F2937',
  theme_mode VARCHAR(20) DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'auto')),
  font_family VARCHAR(50) DEFAULT 'System',
  custom_css TEXT,
  custom_javascript TEXT,
  footer_text TEXT DEFAULT '© 2024 Academic Audio Platform',
  contact_email TEXT,
  support_phone TEXT,
  website_url TEXT,
  social_links JSONB DEFAULT '{}',
  enabled_features JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_preferences table for individual user settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language VARCHAR(10) DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  auto_play BOOLEAN DEFAULT false,
  high_quality_audio BOOLEAN DEFAULT true,
  download_over_wifi_only BOOLEAN DEFAULT true,
  show_lyrics BOOLEAN DEFAULT true,
  show_album_art BOOLEAN DEFAULT true,
  crossfade_enabled BOOLEAN DEFAULT false,
  crossfade_duration INTEGER DEFAULT 3,
  equalizer_settings JSONB DEFAULT '{}',
  playback_speed DECIMAL(3,2) DEFAULT 1.0,
  sleep_timer INTEGER DEFAULT 0, -- 0 means disabled
  recently_played_limit INTEGER DEFAULT 50,
  favorite_genres TEXT[],
  blocked_artists TEXT[],
  privacy_settings JSONB DEFAULT '{}',
  accessibility_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create app_settings table for global app configuration
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  app_version VARCHAR(20) DEFAULT '1.0.0',
  maintenance_mode BOOLEAN DEFAULT false,
  registration_enabled BOOLEAN DEFAULT true,
  file_upload_enabled BOOLEAN DEFAULT true,
  max_file_size_mb INTEGER DEFAULT 50,
  supported_audio_formats TEXT[] DEFAULT ARRAY['mp3', 'wav', 'aac', 'm4a', 'flac'],
  supported_image_formats TEXT[] DEFAULT ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp'],
  engagement_threshold INTEGER DEFAULT 5,
  auto_remove_threshold INTEGER DEFAULT -3,
  content_moderation_enabled BOOLEAN DEFAULT true,
  analytics_enabled BOOLEAN DEFAULT true,
  cache_duration_hours INTEGER DEFAULT 24,
  max_playlist_tracks INTEGER DEFAULT 200,
  max_user_playlists INTEGER DEFAULT 50,
  featured_content JSONB DEFAULT '{}',
  announcement_banner TEXT,
  announcement_link TEXT,
  announcement_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create emotion_moods table for emotion-based search
CREATE TABLE IF NOT EXISTS emotion_moods (
  id TEXT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7),
  icon_url TEXT,
  keywords TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create track_emotions table to link tracks with emotions
CREATE TABLE IF NOT EXISTS track_emotions (
  id TEXT PRIMARY KEY,
  track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  emotion_id TEXT NOT NULL REFERENCES emotion_moods(id) ON DELETE CASCADE,
  confidence_score DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  assigned_by TEXT REFERENCES users(id),
  assignment_type VARCHAR(20) DEFAULT 'manual' CHECK (assignment_type IN ('manual', 'auto', 'user')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(track_id, emotion_id)
);

-- Insert default emotion moods
INSERT INTO emotion_moods (id, name, description, color, keywords) VALUES
('happy', 'Happy', 'Upbeat and cheerful content', '#FFD700', ARRAY['happy', 'joyful', 'upbeat', 'cheerful', 'positive']),
('sad', 'Sad', 'Emotional and melancholic content', '#4169E1', ARRAY['sad', 'melancholic', 'emotional', 'somber', 'blue']),
('calm', 'Calm', 'Peaceful and relaxing content', '#90EE90', ARRAY['calm', 'peaceful', 'relaxing', 'soothing', 'serene']),
('energetic', 'Energetic', 'High energy and motivating content', '#FF6347', ARRAY['energetic', 'motivating', 'uplifting', 'powerful', 'intense']),
('romantic', 'Romantic', 'Love and romantic content', '#FF69B4', ARRAY['romantic', 'love', 'passionate', 'heartfelt', 'tender']),
('focused', 'Focused', 'Concentration and study content', '#9370DB', ARRAY['focused', 'study', 'concentration', 'learning', 'productive']),
('angry', 'Angry', 'Intense and aggressive content', '#DC143C', ARRAY['angry', 'intense', 'aggressive', 'powerful', 'fierce']),
('nostalgic', 'Nostalgic', 'Memory and nostalgia content', '#DEB887', ARRAY['nostalgic', 'memory', 'retro', 'classic', 'reminiscent'])
ON CONFLICT (id) DO NOTHING;

-- Insert default branding settings
INSERT INTO branding_settings (id, app_name, primary_color, secondary_color) VALUES
('default', 'Academic Audio Platform', '#4F46E5', '#10B981')
ON CONFLICT (id) DO NOTHING;

-- Insert default app settings
INSERT INTO app_settings (id, app_version) VALUES
('global', '1.0.0')
ON CONFLICT (id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_track_emotions_track_id ON track_emotions(track_id);
CREATE INDEX IF NOT EXISTS idx_track_emotions_emotion_id ON track_emotions(emotion_id);
CREATE INDEX IF NOT EXISTS idx_emotion_moods_name ON emotion_moods(name);

-- Create view for tracks with emotions
CREATE OR REPLACE VIEW tracks_with_emotions AS
SELECT 
    t.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', e.id,
                'name', e.name,
                'description', e.description,
                'color', e.color,
                'confidence', te.confidence_score
            )
        ) FILTER (WHERE e.id IS NOT NULL),
        '[]'::json
    ) as emotions
FROM tracks t
LEFT JOIN track_emotions te ON t.id = te.track_id
LEFT JOIN emotion_moods e ON te.emotion_id = e.id
GROUP BY t.id, t.title, t.artist, t.album, t.duration, t.file_url, t.cover_url, t.play_count, t.uploaded_by, t.is_public, t.moderation_status, t.likes_count, t.dislikes_count, t.engagement_threshold, t.auto_remove_threshold, t.is_active, t.last_engagement_check, t.created_at, t.updated_at;

-- Function to get user preferences
CREATE OR REPLACE FUNCTION get_user_preferences(user_id_param TEXT)
RETURNS TABLE(
    theme VARCHAR(20),
    language VARCHAR(10),
    notifications_enabled BOOLEAN,
    auto_play BOOLEAN,
    high_quality_audio BOOLEAN,
    playback_speed DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT up.theme, up.language, up.notifications_enabled, up.auto_play, 
           up.high_quality_audio, up.playback_speed
    FROM user_preferences up
    WHERE up.user_id = user_id_param;
    
    -- If no preferences found, return defaults
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 'light'::VARCHAR(20), 'en'::VARCHAR(10), true::BOOLEAN, 
               false::BOOLEAN, true::BOOLEAN, 1.0::DECIMAL(3,2);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update user preferences
CREATE OR REPLACE FUNCTION update_user_preferences(
    user_id_param TEXT,
    theme_param VARCHAR(20) DEFAULT NULL,
    language_param VARCHAR(10) DEFAULT NULL,
    notifications_enabled_param BOOLEAN DEFAULT NULL,
    auto_play_param BOOLEAN DEFAULT NULL,
    high_quality_audio_param BOOLEAN DEFAULT NULL,
    playback_speed_param DECIMAL(3,2) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO user_preferences (
        id, user_id, theme, language, notifications_enabled, 
        auto_play, high_quality_audio, playback_speed, updated_at
    ) VALUES (
        user_id_param || '_prefs', user_id_param, 
        COALESCE(theme_param, 'light'),
        COALESCE(language_param, 'en'),
        COALESCE(notifications_enabled_param, true),
        COALESCE(auto_play_param, false),
        COALESCE(high_quality_audio_param, true),
        COALESCE(playback_speed_param, 1.0),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        theme = COALESCE(theme_param, user_preferences.theme),
        language = COALESCE(language_param, user_preferences.language),
        notifications_enabled = COALESCE(notifications_enabled_param, user_preferences.notifications_enabled),
        auto_play = COALESCE(auto_play_param, user_preferences.auto_play),
        high_quality_audio = COALESCE(high_quality_audio_param, user_preferences.high_quality_audio),
        playback_speed = COALESCE(playback_speed_param, user_preferences.playback_speed),
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
