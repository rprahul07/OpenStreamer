-- Complete Academic Platform Migration
-- Run this entire script in Supabase SQL Editor
-- This combines all 4 migration files in correct order

-- Migration 1: Extend Academic Schema
-- Extend existing users table with academic fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS academic_role VARCHAR(20) DEFAULT 'STUDENT' CHECK (academic_role IN ('TEACHER', 'STUDENT'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS academic_year INTEGER CHECK (academic_year >= 1 AND academic_year <= 4);
ALTER TABLE users ADD COLUMN IF NOT EXISTS class_section TEXT;

-- Extend existing playlists table with academic fields
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS academic_year INTEGER CHECK (academic_year >= 1 AND academic_year <= 4);
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS class_section TEXT;
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'PUBLIC' CHECK (visibility IN ('CLASS', 'PUBLIC'));
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_academic_role ON users(academic_role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_academic_combo ON users(department, academic_year, class_section);
CREATE INDEX IF NOT EXISTS idx_playlists_visibility ON playlists(visibility);
CREATE INDEX IF NOT EXISTS idx_playlists_status ON playlists(status);
CREATE INDEX IF NOT EXISTS idx_playlists_academic ON playlists(department, academic_year, class_section);
CREATE INDEX IF NOT EXISTS idx_playlists_creator ON playlists(user_id);

-- Migration 2: User Academic Validation
-- Add check constraint to ensure students have required academic info
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS check_student_academic_info 
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

-- Migration 3: Standardize Academic Data
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

-- Add check constraints for data integrity
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

-- Create helper views and functions
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

CREATE OR REPLACE FUNCTION get_department_full_name(dept_code TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT full_name FROM department_lookup 
    WHERE code = dept_code
  );
END;
$$ LANGUAGE plpgsql;

-- Migration 4: Sample Data (Optional - uncomment if you want test data)
/*
-- Sample Students
INSERT INTO users (id, username, password, display_name, role, academic_role, department, academic_year, class_section, created_at, updated_at) VALUES
('student_cse_1a_01', 'student_cse_1a_01', '$2b$10$hashed_password_here', 'Alice Johnson', 'listener', 'STUDENT', 'CSE', 1, 'A', NOW(), NOW()),
('student_cse_1a_02', 'student_cse_1a_02', '$2b$10$hashed_password_here', 'Bob Smith', 'listener', 'STUDENT', 'CSE', 1, 'A', NOW(), NOW()),
('student_ece_1a_01', 'student_ece_1a_01', '$2b$10$hashed_password_here', 'Diana Prince', 'listener', 'STUDENT', 'ECE', 1, 'A', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample Teachers
INSERT INTO users (id, username, password, display_name, role, academic_role, department, created_at, updated_at) VALUES
('teacher_cse_01', 'teacher_cse_01', '$2b$10$hashed_password_here', 'Prof. Robert Anderson', 'creator', 'TEACHER', 'CSE', NOW(), NOW()),
('teacher_ece_01', 'teacher_ece_01', '$2b$10$hashed_password_here', 'Prof. Sarah Davis', 'creator', 'TEACHER', 'ECE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample Playlists
INSERT INTO playlists (id, name, description, subject, department, academic_year, class_section, user_id, is_public, visibility, status, cover_url, created_at, updated_at) VALUES
('public_playlist_01', 'Introduction to Programming', 'Basic programming concepts', 'Programming Fundamentals', NULL, NULL, NULL, 'teacher_cse_01', 'true', 'PUBLIC', 'PUBLISHED', 'https://picsum.photos/seed/public1/400/400', NOW(), NOW()),
('cse_1a_playlist_01', 'CSE 1A - Data Structures', 'Data structures for CSE 1A', 'Data Structures', 'CSE', 1, 'A', 'teacher_cse_01', 'false', 'CLASS', 'PUBLISHED', 'https://picsum.photos/seed/cse1a/400/400', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
*/

-- Success confirmation
SELECT 'Academic Platform Migration Completed Successfully!' as result;
