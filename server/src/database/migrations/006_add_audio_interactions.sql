-- Add audio interaction features
-- Likes, dislikes, engagement tracking, and auto-removal system

-- Add interaction tracking to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS dislikes_count INTEGER DEFAULT 0;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS engagement_threshold INTEGER DEFAULT 5;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS auto_remove_threshold INTEGER DEFAULT -3; -- dislikes - likes
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS last_engagement_check TIMESTAMP;

-- Create track_interactions table for individual user interactions
CREATE TABLE IF NOT EXISTS track_interactions (
  id TEXT PRIMARY KEY,
  track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(10) NOT NULL CHECK (interaction_type IN ('LIKE', 'DISLIKE')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(track_id, user_id) -- One interaction per user per track
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_track_interactions_track_id ON track_interactions(track_id);
CREATE INDEX IF NOT EXISTS idx_track_interactions_user_id ON track_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_track_interactions_type ON track_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_tracks_engagement ON tracks(likes_count, dislikes_count, is_active);

-- Function to update track engagement metrics
CREATE OR REPLACE FUNCTION update_track_engagement(track_id_param TEXT)
RETURNS VOID AS $$
DECLARE
    likes_count INTEGER;
    dislikes_count INTEGER;
    engagement_score INTEGER;
    threshold INTEGER;
BEGIN
    -- Count likes and dislikes
    SELECT COUNT(*) FILTER (WHERE interaction_type = 'LIKE'),
           COUNT(*) FILTER (WHERE interaction_type = 'DISLIKE')
    INTO likes_count, dislikes_count
    FROM track_interactions
    WHERE track_id = track_id_param;
    
    -- Calculate engagement score (dislikes - likes)
    engagement_score := dislikes_count - likes_count;
    
    -- Get threshold for this track
    SELECT auto_remove_threshold INTO threshold
    FROM tracks
    WHERE id = track_id_param;
    
    -- Update track counts and status
    UPDATE tracks 
    SET 
        likes_count = likes_count,
        dislikes_count = dislikes_count,
        is_active = CASE 
            WHEN engagement_score <= threshold THEN false
            ELSE true
        END,
        last_engagement_check = NOW()
    WHERE id = track_id_param;
    
    -- Log if track is being deactivated
    IF engagement_score <= threshold THEN
        INSERT INTO system_logs (log_type, message, track_id, created_at)
        VALUES ('ENGAGEMENT', 'Track deactivated due to low engagement', track_id_param, NOW())
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to handle user interaction (like/dislike)
CREATE OR REPLACE FUNCTION handle_track_interaction(
    track_id_param TEXT,
    user_id_param TEXT,
    interaction_type_param VARCHAR(10)
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
    existing_interaction TEXT;
    track_exists BOOLEAN;
BEGIN
    -- Check if track exists and is active
    SELECT EXISTS(SELECT 1 FROM tracks WHERE id = track_id_param AND is_active = true)
    INTO track_exists;
    
    IF NOT track_exists THEN
        RETURN QUERY SELECT false, 'Track not found or inactive'::TEXT;
        RETURN;
    END IF;
    
    -- Check if user already interacted
    SELECT interaction_type INTO existing_interaction
    FROM track_interactions
    WHERE track_id = track_id_param AND user_id = user_id_param;
    
    IF existing_interaction IS NOT NULL THEN
        IF existing_interaction = interaction_type_param THEN
            -- Remove interaction if same type
            DELETE FROM track_interactions
            WHERE track_id = track_id_param AND user_id = user_id_param;
            RETURN QUERY SELECT true, 'Interaction removed'::TEXT;
        ELSE
            -- Update interaction if different type
            UPDATE track_interactions
            SET interaction_type = interaction_type_param, updated_at = NOW()
            WHERE track_id = track_id_param AND user_id = user_id_param;
            RETURN QUERY SELECT true, 'Interaction updated'::TEXT;
        END IF;
    ELSE
        -- Add new interaction
        INSERT INTO track_interactions (id, track_id, user_id, interaction_type)
        VALUES (
            track_id_param || '_' || user_id_param || '_' || EXTRACT(EPOCH FROM NOW()),
            track_id_param,
            user_id_param,
            interaction_type_param
        );
        RETURN QUERY SELECT true, 'Interaction added'::TEXT;
    END IF;
    
    -- Update engagement metrics
    PERFORM update_track_engagement(track_id_param);
END;
$$ LANGUAGE plpgsql;

-- Create system_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_logs (
    id TEXT PRIMARY KEY,
    log_type VARCHAR(20) NOT NULL,
    message TEXT,
    track_id TEXT,
    user_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- View for active tracks with engagement data
CREATE OR REPLACE VIEW active_tracks_with_engagement AS
SELECT 
    t.*,
    CASE 
        WHEN t.is_active = false THEN 'Removed due to low engagement'
        WHEN t.likes_count > t.dislikes_count THEN 'Popular'
        WHEN t.likes_count = t.dislikes_count THEN 'Neutral'
        ELSE 'Controversial'
    END as engagement_status
FROM tracks t
WHERE t.is_active = true OR (t.is_active = false AND t.last_engagement_check > NOW() - INTERVAL '7 days');

-- Update existing tracks with default values
UPDATE tracks 
SET 
    likes_count = 0,
    dislikes_count = 0,
    engagement_threshold = 5,
    auto_remove_threshold = -3,
    is_active = true,
    last_engagement_check = NOW()
WHERE likes_count IS NULL;
