-- Update database to use standardized academic values from dropdown system
-- This ensures consistency between frontend dropdowns and database storage

-- Update existing user academic information to use standardized department codes
UPDATE users 
SET department = CASE 
  WHEN LOWER(department) LIKE '%computer%' OR LOWER(department) LIKE '%cse%' THEN 'CSE'
  WHEN LOWER(department) LIKE '%electronics%' OR LOWER(department) LIKE '%ece%' THEN 'ECE'
  WHEN LOWER(department) LIKE '%electrical%' OR LOWER(department) LIKE '%eee%' THEN 'EEE'
  WHEN LOWER(department) LIKE '%civil%' THEN 'CIVIL'
  WHEN LOWER(department) LIKE '%mechanical%' OR LOWER(department) LIKE '%mech%' THEN 'MECH'
  WHEN LOWER(department) LIKE '%information%' OR LOWER(department) LIKE '%it%' THEN 'IT'
  WHEN LOWER(department) LIKE '%chemical%' THEN 'CHEMICAL'
  WHEN LOWER(department) LIKE '%aeronautical%' OR LOWER(department) LIKE '%aero%' THEN 'AERO'
  WHEN LOWER(department) LIKE '%biotechnology%' OR LOWER(department) LIKE '%bio%' THEN 'BIO'
  WHEN LOWER(department) LIKE '%automobile%' OR LOWER(department) LIKE '%auto%' THEN 'AUTO'
  ELSE 'CSE' -- Default to CSE if no match
END
WHERE department IS NOT NULL AND department != '';

-- Update existing playlist department information to use standardized codes
UPDATE playlists 
SET department = CASE 
  WHEN LOWER(department) LIKE '%computer%' OR LOWER(department) LIKE '%cse%' THEN 'CSE'
  WHEN LOWER(department) LIKE '%electronics%' OR LOWER(department) LIKE '%ece%' THEN 'ECE'
  WHEN LOWER(department) LIKE '%electrical%' OR LOWER(department) LIKE '%eee%' THEN 'EEE'
  WHEN LOWER(department) LIKE '%civil%' THEN 'CIVIL'
  WHEN LOWER(department) LIKE '%mechanical%' OR LOWER(department) LIKE '%mech%' THEN 'MECH'
  WHEN LOWER(department) LIKE '%information%' OR LOWER(department) LIKE '%it%' THEN 'IT'
  WHEN LOWER(department) LIKE '%chemical%' THEN 'CHEMICAL'
  WHEN LOWER(department) LIKE '%aeronautical%' OR LOWER(department) LIKE '%aero%' THEN 'AERO'
  WHEN LOWER(department) LIKE '%biotechnology%' OR LOWER(department) LIKE '%bio%' THEN 'BIO'
  WHEN LOWER(department) LIKE '%automobile%' OR LOWER(department) LIKE '%auto%' THEN 'AUTO'
  ELSE 'CSE' -- Default to CSE if no match
END
WHERE department IS NOT NULL AND department != '';

-- Standardize class sections to uppercase single letters
UPDATE users 
SET class_section = UPPER(SUBSTRING(TRIM(class_section), 1, 1))
WHERE class_section IS NOT NULL AND class_section != '';

UPDATE playlists 
SET class_section = UPPER(SUBSTRING(TRIM(class_section), 1, 1))
WHERE class_section IS NOT NULL AND class_section != '';

-- Ensure academic years are valid (1-4)
UPDATE users 
SET academic_year = CASE 
  WHEN academic_year < 1 OR academic_year > 4 OR academic_year IS NULL THEN 1
  ELSE academic_year
END;

UPDATE playlists 
SET academic_year = CASE 
  WHEN academic_year < 1 OR academic_year > 4 OR academic_year IS NULL THEN 1
  ELSE academic_year
END;

-- Add check constraints for data integrity (if not already exists)
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS chk_department_code 
CHECK (department IN ('CSE', 'ECE', 'EEE', 'CIVIL', 'MECH', 'IT', 'CHEMICAL', 'AERO', 'BIO', 'AUTO') OR department IS NULL);

ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS chk_class_section 
CHECK (class_section ~ '^[A-F]$' OR class_section IS NULL);

ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS chk_academic_year 
CHECK (academic_year BETWEEN 1 AND 4 OR academic_year IS NULL);

ALTER TABLE playlists 
ADD CONSTRAINT IF NOT EXISTS chk_playlist_department_code 
CHECK (department IN ('CSE', 'ECE', 'EEE', 'CIVIL', 'MECH', 'IT', 'CHEMICAL', 'AERO', 'BIO', 'AUTO') OR department IS NULL);

ALTER TABLE playlists 
ADD CONSTRAINT IF NOT EXISTS chk_playlist_class_section 
CHECK (class_section ~ '^[A-F]$' OR class_section IS NULL);

ALTER TABLE playlists 
ADD CONSTRAINT IF NOT EXISTS chk_playlist_academic_year 
CHECK (academic_year BETWEEN 1 AND 4 OR academic_year IS NULL);

-- Create a view for easy lookup of department full names
CREATE OR REPLACE VIEW department_lookup AS
SELECT 
  'CSE' as code, 'Computer Science Engineering' as full_name
UNION ALL SELECT 'ECE', 'Electronics & Communication Engineering'
UNION ALL SELECT 'EEE', 'Electrical & Electronics Engineering'
UNION ALL SELECT 'CIVIL', 'Civil Engineering'
UNION ALL SELECT 'MECH', 'Mechanical Engineering'
UNION ALL SELECT 'IT', 'Information Technology'
UNION ALL SELECT 'CHEMICAL', 'Chemical Engineering'
UNION ALL SELECT 'AERO', 'Aeronautical Engineering'
UNION ALL SELECT 'BIO', 'Biotechnology'
UNION ALL SELECT 'AUTO', 'Automobile Engineering';

-- Create function to get department full name from code
CREATE OR REPLACE FUNCTION get_department_full_name(dept_code TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT full_name FROM department_lookup 
    WHERE code = dept_code
  );
END;
$$ LANGUAGE plpgsql;

-- Sample data verification queries
-- SELECT department, get_department_full_name(department) as full_name, 
--        academic_year, class_section, COUNT(*) as student_count
-- FROM users 
-- WHERE academic_role = 'STUDENT' 
-- GROUP BY department, academic_year, class_section
-- ORDER BY department, academic_year, class_section;

-- SELECT department, get_department_full_name(department) as full_name,
--        academic_year, class_section, visibility, status, COUNT(*) as playlist_count
-- FROM playlists 
-- GROUP BY department, academic_year, class_section, visibility, status
-- ORDER BY department, academic_year, class_section;
