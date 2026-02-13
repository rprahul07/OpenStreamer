-- Insert sample academic data for testing
-- This creates test users and playlists with standardized academic values

-- Sample Students
INSERT INTO users (id, username, password, display_name, role, academic_role, department, academic_year, class_section, created_at, updated_at) VALUES
('student_cse_1a_01', 'student_cse_1a_01', '$2b$10$hashed_password_here', 'Alice Johnson', 'listener', 'STUDENT', 'CSE', 1, 'A', NOW(), NOW()),
('student_cse_1a_02', 'student_cse_1a_02', '$2b$10$hashed_password_here', 'Bob Smith', 'listener', 'STUDENT', 'CSE', 1, 'A', NOW(), NOW()),
('student_cse_2b_01', 'student_cse_2b_01', '$2b$10$hashed_password_here', 'Charlie Brown', 'listener', 'STUDENT', 'CSE', 2, 'B', NOW(), NOW()),
('student_ece_1a_01', 'student_ece_1a_01', '$2b$10$hashed_password_here', 'Diana Prince', 'listener', 'STUDENT', 'ECE', 1, 'A', NOW(), NOW()),
('student_eee_3c_01', 'student_eee_3c_01', '$2b$10$hashed_password_here', 'Eve Wilson', 'listener', 'STUDENT', 'EEE', 3, 'C', NOW(), NOW()),
('student_mech_2a_01', 'student_mech_2a_01', '$2b$10$hashed_password_here', 'Frank Miller', 'listener', 'STUDENT', 'MECH', 2, 'A', NOW(), NOW()),
('student_civil_4b_01', 'student_civil_4b_01', '$2b$10$hashed_password_here', 'Grace Lee', 'listener', 'STUDENT', 'CIVIL', 4, 'B', NOW(), NOW()),
('student_it_1c_01', 'student_it_1c_01', '$2b$10$hashed_password_here', 'Henry Ford', 'listener', 'STUDENT', 'IT', 1, 'C', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample Teachers
INSERT INTO users (id, username, password, display_name, role, academic_role, department, created_at, updated_at) VALUES
('teacher_cse_01', 'teacher_cse_01', '$2b$10$hashed_password_here', 'Prof. Robert Anderson', 'creator', 'TEACHER', 'CSE', NOW(), NOW()),
('teacher_ece_01', 'teacher_ece_01', '$2b$10$hashed_password_here', 'Prof. Sarah Davis', 'creator', 'TEACHER', 'ECE', NOW(), NOW()),
('teacher_eee_01', 'teacher_eee_01', '$2b$10$hashed_password_here', 'Prof. Michael Chen', 'creator', 'TEACHER', 'EEE', NOW(), NOW()),
('teacher_mech_01', 'teacher_mech_01', '$2b$10$hashed_password_here', 'Prof. Lisa Wang', 'creator', 'TEACHER', 'MECH', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample Public Playlists (visible to everyone)
INSERT INTO playlists (id, name, description, subject, user_id, is_public, visibility, status, cover_url, created_at, updated_at) VALUES
('public_playlist_01', 'Introduction to Programming', 'Basic programming concepts for beginners', 'Programming Fundamentals', 'teacher_cse_01', 'true', 'PUBLIC', 'PUBLISHED', 'https://picsum.photos/seed/public1/400/400', NOW(), NOW()),
('public_playlist_02', 'Mathematics Essentials', 'Core mathematical concepts', 'Mathematics', 'teacher_cse_01', 'true', 'PUBLIC', 'PUBLISHED', 'https://picsum.photos/seed/public2/400/400', NOW(), NOW()),
('public_playlist_03', 'Physics Fundamentals', 'Introduction to physics', 'Physics', 'teacher_ece_01', 'true', 'PUBLIC', 'PUBLISHED', 'https://picsum.photos/seed/public3/400/400', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample Class-Specific Playlists (visible only to matching students)
INSERT INTO playlists (id, name, description, subject, department, academic_year, class_section, user_id, is_public, visibility, status, cover_url, created_at, updated_at) VALUES
('cse_1a_playlist_01', 'CSE 1A - Data Structures', 'Data structures for CSE 1A students', 'Data Structures', 'CSE', 1, 'A', 'teacher_cse_01', 'false', 'CLASS', 'PUBLISHED', 'https://picsum.photos/seed/cse1a/400/400', NOW(), NOW()),
('cse_1a_playlist_02', 'CSE 1A - Algorithms', 'Algorithms for CSE 1A students', 'Algorithms', 'CSE', 1, 'A', 'teacher_cse_01', 'false', 'CLASS', 'PUBLISHED', 'https://picsum.photos/seed/cse1a2/400/400', NOW(), NOW()),
('cse_2b_playlist_01', 'CSE 2B - Database Systems', 'Database concepts for CSE 2B', 'Database Systems', 'CSE', 2, 'B', 'teacher_cse_01', 'false', 'CLASS', 'PUBLISHED', 'https://picsum.photos/seed/cse2b/400/400', NOW(), NOW()),
('ece_1a_playlist_01', 'ECE 1A - Digital Electronics', 'Digital electronics for ECE 1A', 'Digital Electronics', 'ECE', 1, 'A', 'teacher_ece_01', 'false', 'CLASS', 'PUBLISHED', 'https://picsum.photos/seed/ece1a/400/400', NOW(), NOW()),
('eee_3c_playlist_01', 'EEE 3C - Power Systems', 'Power systems for EEE 3C', 'Power Systems', 'EEE', 3, 'C', 'teacher_eee_01', 'false', 'CLASS', 'PUBLISHED', 'https://picsum.photos/seed/eee3c/400/400', NOW(), NOW()),
('mech_2a_playlist_01', 'MECH 2A - Thermodynamics', 'Thermodynamics for MECH 2A', 'Thermodynamics', 'MECH', 2, 'A', 'teacher_mech_01', 'false', 'CLASS', 'PUBLISHED', 'https://picsum.photos/seed/mech2a/400/400', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample Draft Playlists (teacher drafts, not visible to students)
INSERT INTO playlists (id, name, description, subject, department, academic_year, class_section, user_id, is_public, visibility, status, cover_url, created_at, updated_at) VALUES
('draft_cse_01', 'CSE Advanced Topics', 'Advanced CSE topics (draft)', 'Machine Learning', 'CSE', 3, 'A', 'teacher_cse_01', 'false', 'CLASS', 'DRAFT', 'https://picsum.photos/seed/draft1/400/400', NOW(), NOW()),
('draft_ece_01', 'ECE Lab Sessions', 'ECE laboratory sessions (draft)', 'Circuit Theory', 'ECE', 2, 'B', 'teacher_ece_01', 'false', 'CLASS', 'DRAFT', 'https://picsum.photos/seed/draft2/400/400', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample Tracks for Playlists
INSERT INTO tracks (id, title, artist, album, duration, file_url, cover_url, uploaded_by, is_public, play_count, created_at, updated_at) VALUES
('track_001', 'Introduction to Variables', 'Prof. Anderson', 'Programming Basics', 300, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://picsum.photos/seed/track1/400/400', 'teacher_cse_01', 'true', '0', NOW(), NOW()),
('track_002', 'Data Types Explained', 'Prof. Anderson', 'Programming Basics', 420, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://picsum.photos/seed/track2/400/400', 'teacher_cse_01', 'true', '0', NOW(), NOW()),
('track_003', 'Control Structures', 'Prof. Anderson', 'Programming Basics', 360, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'https://picsum.photos/seed/track3/400/400', 'teacher_cse_01', 'true', '0', NOW(), NOW()),
('track_004', 'Arrays and Lists', 'Prof. Anderson', 'Data Structures', 480, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://picsum.photos/seed/track4/400/400', 'teacher_cse_01', 'true', '0', NOW(), NOW()),
('track_005', 'Stack and Queue', 'Prof. Anderson', 'Data Structures', 390, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://picsum.photos/seed/track5/400/400', 'teacher_cse_01', 'true', '0', NOW(), NOW()),
('track_006', 'Binary Search', 'Prof. Anderson', 'Algorithms', 330, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'https://picsum.photos/seed/track6/400/400', 'teacher_cse_01', 'true', '0', NOW(), NOW()),
('track_007', 'Sorting Algorithms', 'Prof. Anderson', 'Algorithms', 510, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://picsum.photos/seed/track7/400/400', 'teacher_cse_01', 'true', '0', NOW(), NOW()),
('track_008', 'Digital Logic Gates', 'Prof. Davis', 'Digital Electronics', 450, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://picsum.photos/seed/track8/400/400', 'teacher_ece_01', 'true', '0', NOW(), NOW()),
('track_009', 'Boolean Algebra', 'Prof. Davis', 'Digital Electronics', 380, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'https://picsum.photos/seed/track9/400/400', 'teacher_ece_01', 'true', '0', NOW(), NOW()),
('track_010', 'Power Generation', 'Prof. Chen', 'Power Systems', 520, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://picsum.photos/seed/track10/400/400', 'teacher_eee_01', 'true', '0', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Add tracks to playlists
INSERT INTO playlist_tracks (id, playlist_id, track_id, position, added_at) VALUES
-- Public Playlist 1 tracks
('pt_001', 'public_playlist_01', 'track_001', 0, NOW()),
('pt_002', 'public_playlist_01', 'track_002', 1, NOW()),
('pt_003', 'public_playlist_01', 'track_003', 2, NOW()),

-- CSE 1A Data Structures tracks
('pt_004', 'cse_1a_playlist_01', 'track_004', 0, NOW()),
('pt_005', 'cse_1a_playlist_01', 'track_005', 1, NOW()),

-- CSE 1A Algorithms tracks
('pt_006', 'cse_1a_playlist_02', 'track_006', 0, NOW()),
('pt_007', 'cse_1a_playlist_02', 'track_007', 1, NOW()),

-- CSE 2B Database tracks
('pt_008', 'cse_2b_playlist_01', 'track_001', 0, NOW()), -- Reusing track for demo

-- ECE 1A Digital Electronics tracks
('pt_009', 'ece_1a_playlist_01', 'track_008', 0, NOW()),
('pt_010', 'ece_1a_playlist_01', 'track_009', 1, NOW()),

-- EEE 3C Power Systems tracks
('pt_011', 'eee_3c_playlist_01', 'track_010', 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- Verification queries to check the data
-- SELECT * FROM users WHERE academic_role = 'STUDENT' ORDER BY department, academic_year, class_section;
-- SELECT * FROM users WHERE academic_role = 'TEACHER' ORDER BY department;
-- SELECT * FROM playlists ORDER BY visibility, status, department, academic_year, class_section;
-- SELECT p.name, p.department, p.academic_year, p.class_section, p.visibility, p.status, 
--        COUNT(pt.track_id) as track_count
-- FROM playlists p 
-- LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id 
-- GROUP BY p.id, p.name, p.department, p.academic_year, p.class_section, p.visibility, p.status 
-- ORDER BY p.visibility, p.status, p.department, p.academic_year, p.class_section;
