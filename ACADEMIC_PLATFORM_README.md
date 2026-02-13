# Stream Curator - Academic Audio Learning Platform

## 🎓 Academic Platform Extension

The Stream Curator App has been successfully extended into an Academic Audio Learning Platform while preserving all existing music streaming functionality.

## 📚 New Features Added

### **Academic Role System**
- **Teacher Role**: Can create, manage, and publish playlists
- **Student Role**: Can access published playlists based on visibility
- **Role Mapping**: `creator` → `TEACHER`, `listener` → `STUDENT`

### **Smart Playlist Visibility**
- **Public Playlists**: Accessible to all users
- **Class Playlists**: Only accessible to students in specific department/year/section
- **Draft System**: Teachers create playlists as drafts, then publish

### **AWS S3 Integration**
- **Direct S3 Uploads**: Files stored directly in AWS S3
- **Organized Structure**: `audio/department/year/section/playlistId/`
- **Scalable Storage**: No more local file limitations

### **Enhanced Security**
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for secure password storage
- **Role-based Access Control**: Middleware for teacher/student endpoints

## 🏗️ MVC Architecture (JavaScript)

```
server/src/
├── config/
│   ├── database.js     # Supabase configuration
│   └── s3.js          # AWS S3 service
├── controllers/
│   ├── AuthController.js
│   ├── TrackController.js
│   └── PlaylistController.js
├── middleware/
│   ├── authMiddleware.js
│   └── roleMiddleware.js
├── models/
│   ├── User.js
│   ├── Track.js
│   ├── Playlist.js
│   └── PlaylistTrack.js
├── routes/
│   ├── auth.js
│   ├── tracks.js
│   ├── playlists.js
│   └── index.js
└── server.js
```

## 🗄️ Database Extensions

### **Users Table - New Columns**
```sql
academic_role VARCHAR(20) DEFAULT 'STUDENT'
department TEXT
academic_year INTEGER (1-4)
class_section TEXT
```

### **Playlists Table - New Columns**
```sql
subject TEXT
department TEXT
academic_year INTEGER (1-4)
class_section TEXT
visibility VARCHAR(20) DEFAULT 'PUBLIC'
status VARCHAR(20) DEFAULT 'DRAFT'
```

## 🔧 New API Endpoints

### **Teacher-Only Endpoints**
- `GET /api/playlists/drafts/my` - Get teacher's draft playlists
- `PATCH /api/playlists/:id/publish` - Publish a playlist
- `PUT /api/playlists/:id` - Update playlist (teacher only)

### **Enhanced Endpoints**
- `POST /api/tracks/upload` - Now uploads to S3 with academic metadata
- `GET /api/playlists` - Smart filtering based on user role and academic info

## 📱 Frontend Enhancements

### **Upload Screen - New Fields**
- **Subject**: Academic subject (optional)
- **Visibility Selector**: Public/Class toggle
- **Department**: Required for class-specific playlists
- **Academic Year**: 1-4 validation
- **Class Section**: A, B, C, etc.

### **Smart Playlist Creation**
- Creates playlists as **DRAFT** by default
- Teachers can publish later
- Automatic S3 upload integration

## 🚀 Getting Started

### **1. Install Dependencies**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner bcrypt jsonwebtoken cors
```

### **2. Environment Variables**
```env
# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your_bucket_name

# JWT
JWT_SECRET=your_jwt_secret_key

# Existing
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
```

### **3. Run Database Migration**
Execute the SQL in `server/src/database/migrations/001_extend_academic_schema.sql`

### **4. Start Server**
```bash
npm run server:dev
```

## 🎯 Role-Based Access

### **Students Can:**
- View published public playlists
- View class-specific playlists (if matching department/year/section)
- Play music and use all existing player features

### **Teachers Can:**
- Everything students can do
- Create draft playlists
- Upload audio files to S3
- Publish playlists
- Edit their own playlists

### **Admins Can:**
- Everything teachers can do
- Access all user data
- Manage system settings

## 🔄 Backward Compatibility

✅ **All existing features preserved:**
- Music player functionality
- Queue system
- Shuffle/repeat
- Offline caching
- Glassmorphism UI
- WebSocket support
- Existing API endpoints

✅ **Existing users work seamlessly:**
- `creator` role mapped to `TEACHER`
- `listener` role mapped to `STUDENT`
- All existing playlists still accessible

## 📋 Usage Examples

### **Creating a Class-Specific Playlist**
1. Teacher logs in and goes to Upload screen
2. Selects "Class" visibility
3. Fills in: Department="Computer Science", Year=3, Section="A"
4. Uploads audio files (automatically stored in S3)
5. Playlist created as draft
6. Teacher publishes playlist when ready

### **Student Access**
1. Student logs in (assigned to CS Year 3 Section A)
2. Can see all public playlists
3. Can also see class-specific playlists for their department/year/section
4. Cannot see other classes' private playlists

## 🛡️ Security Features

- **JWT Authentication** with 24-hour expiration
- **Password Hashing** with bcrypt (10 rounds)
- **Role-based Middleware** for endpoint protection
- **S3 Secure Uploads** with proper IAM policies
- **Input Validation** for academic data

## 📊 Smart Filtering Logic

When students fetch playlists:
```sql
WHERE (status = 'PUBLISHED' AND visibility = 'PUBLIC')
   OR (status = 'PUBLISHED' AND visibility = 'CLASS' 
       AND department = ? 
       AND academic_year = ? 
       AND class_section = ?)
```

## 🎵 Music Features Preserved

All existing music streaming functionality works exactly as before:
- Full audio playback
- Queue management
- Shuffle and repeat modes
- Mini player
- Now playing screen
- Track uploads
- Playlist management

The academic features are **additive** - they don't replace any existing functionality.
