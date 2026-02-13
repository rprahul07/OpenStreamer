-- Add academic information validation for users
-- Ensure students have department, year, and section for proper playlist filtering

-- Add check constraint to ensure students have required academic info
ALTER TABLE users ADD CONSTRAINT check_student_academic_info 
CHECK (
  academic_role != 'STUDENT' OR 
  (department IS NOT NULL AND academic_year IS NOT NULL AND class_section IS NOT NULL)
);

-- Update existing student users to have default academic info if missing
UPDATE users 
SET 
  department = 'General',
  academic_year = 1,
  class_section = 'A'
WHERE academic_role = 'STUDENT' AND (
  department IS NULL OR 
  academic_year IS NULL OR 
  class_section IS NULL
);

-- Add validation function for playlist access
CREATE OR REPLACE FUNCTION can_access_playlist(
  user_department TEXT,
  user_academic_year INTEGER,
  user_class_section TEXT,
  playlist_department TEXT,
  playlist_academic_year INTEGER,
  playlist_class_section TEXT,
  playlist_visibility TEXT,
  playlist_status TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Can access if playlist is published and public
  IF playlist_status = 'PUBLISHED' AND playlist_visibility = 'PUBLIC' THEN
    RETURN TRUE;
  END IF;
  
  -- Can access if playlist is published, class-specific, and user matches
  IF playlist_status = 'PUBLISHED' 
     AND playlist_visibility = 'CLASS'
     AND user_department = playlist_department
     AND user_academic_year = playlist_academic_year
     AND user_class_section = playlist_class_section THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
