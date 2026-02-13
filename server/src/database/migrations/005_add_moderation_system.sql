-- Add moderation status for tracks and playlists
-- This enables teacher approval workflow for class-specific content

-- Add moderation status to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'PENDING' CHECK (moderation_status IN ('PENDING', 'APPROVED', 'REJECTED'));
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS moderated_by TEXT REFERENCES users(id);
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS moderation_reason TEXT;

-- Add moderation status to playlists table  
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'PENDING' CHECK (moderation_status IN ('PENDING', 'APPROVED', 'REJECTED'));
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS moderated_by TEXT REFERENCES users(id);
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP;
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS moderation_reason TEXT;

-- Create indexes for moderation queries
CREATE INDEX IF NOT EXISTS idx_tracks_moderation_status ON tracks(moderation_status);
CREATE INDEX IF NOT EXISTS idx_playlists_moderation_status ON playlists(moderation_status);
CREATE INDEX IF NOT EXISTS idx_tracks_moderated_by ON tracks(moderated_by);
CREATE INDEX IF NOT EXISTS idx_playlists_moderated_by ON playlists(moderated_by);

-- Function to automatically approve public content
CREATE OR REPLACE FUNCTION auto_approve_public_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-approve public content
  IF NEW.is_public = 'true' THEN
    NEW.moderation_status = 'APPROVED';
    NEW.moderated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-approve public content
CREATE TRIGGER auto_approve_public_tracks
  BEFORE INSERT ON tracks
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_public_content();

CREATE TRIGGER auto_approve_public_playlists  
  BEFORE INSERT ON playlists
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_public_content();

-- Update existing content
UPDATE tracks SET moderation_status = 'APPROVED', moderated_at = NOW() WHERE is_public = 'true';
UPDATE playlists SET moderation_status = 'APPROVED', moderated_at = NOW() WHERE is_public = 'true';

-- Create view for teachers to see pending content
CREATE OR REPLACE VIEW teacher_pending_content AS
SELECT 
  'track' as content_type,
  t.id,
  t.title,
  t.artist,
  u.department,
  u.academic_year,
  u.class_section,
  t.uploaded_by,
  u.username as uploader_name,
  t.created_at
FROM tracks t
JOIN users u ON t.uploaded_by = u.id
WHERE t.moderation_status = 'PENDING' AND t.is_public = 'false'

UNION ALL

SELECT 
  'playlist' as content_type,
  p.id,
  p.name,
  p.description as artist,
  p.department,
  p.academic_year,
  p.class_section,
  p.user_id as uploaded_by,
  u.username as uploader_name,
  p.created_at
FROM playlists p
JOIN users u ON p.user_id = u.id
WHERE p.moderation_status = 'PENDING' AND p.is_public = 'false';

-- Create view for students to see only approved content
CREATE OR REPLACE VIEW student_available_content AS
SELECT 
  'track' as content_type,
  t.id,
  t.title,
  t.artist,
  t.album,
  t.duration,
  t.file_url,
  t.cover_url,
  t.play_count,
  u.department,
  u.academic_year,
  u.class_section,
  t.uploaded_by,
  t.created_at
FROM tracks t
JOIN users u ON t.uploaded_by = u.id
WHERE t.moderation_status = 'APPROVED' OR t.is_public = 'true'

UNION ALL

SELECT 
  'playlist' as content_type,
  p.id,
  p.name,
  p.description as artist,
  NULL as album,
  NULL as duration,
  NULL as file_url,
  p.cover_url,
  NULL as play_count,
  p.department,
  p.academic_year,
  p.class_section,
  p.user_id as uploaded_by,
  p.created_at
FROM playlists p
WHERE p.moderation_status = 'APPROVED' OR p.is_public = 'true';
