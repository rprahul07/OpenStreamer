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
CREATE INDEX IF NOT EXISTS idx_users_academic_year ON users(academic_year);
CREATE INDEX IF NOT EXISTS idx_users_class_section ON users(class_section);

CREATE INDEX IF NOT EXISTS idx_playlists_visibility ON playlists(visibility);
CREATE INDEX IF NOT EXISTS idx_playlists_status ON playlists(status);
CREATE INDEX IF NOT EXISTS idx_playlists_department ON playlists(department);
CREATE INDEX IF NOT EXISTS idx_playlists_academic_year ON playlists(academic_year);
CREATE INDEX IF NOT EXISTS idx_playlists_class_section ON playlists(class_section);

-- Update existing creator users to TEACHER role
UPDATE users SET academic_role = 'TEACHER' WHERE role = 'creator';
UPDATE users SET academic_role = 'STUDENT' WHERE role = 'listener';

-- Update existing playlists to be published and public
UPDATE playlists SET status = 'PUBLISHED' WHERE status IS NULL;
UPDATE playlists SET visibility = 'PUBLIC' WHERE visibility IS NULL;
