# API Configuration

This document explains how to configure the API base URL for the Stream Curator app.

## Current Configuration

The app is configured to use the following IP address:
- **Default IP**: `http://192.168.0.119:5000`
- **Environment Variable**: `EXPO_PUBLIC_API_URL`

## How to Change the API URL

### Option 1: Environment Variable (Recommended)
Set the `EXPO_PUBLIC_API_URL` environment variable:

```bash
# For development
export EXPO_PUBLIC_API_URL=http://your-ip:5000

# For production
export EXPO_PUBLIC_API_URL=https://your-domain.com
```

### Option 2: Update Configuration File
Edit `lib/config.ts` and change the `BASE_URL` value:

```typescript
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://your-new-ip:5000',
  // ... rest of config
};
```

## Finding Your IP Address

### Windows
```cmd
ipconfig | findstr "IPv4"
```

### macOS/Linux
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## Network Requirements

1. **Server must be running**: Ensure the backend server is running on port 5000
2. **Firewall**: Make sure port 5000 is open on the server machine
3. **Same network**: Mobile device and server must be on the same network for local development

## Testing the Connection

You can test the API endpoints with curl:

```bash
# Test login
curl -X POST http://192.168.0.119:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'

# Test registration
curl -X POST http://192.168.0.119:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123","displayName":"Test User"}'
```

## Available Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Tracks
- `GET /api/tracks` - Get all public tracks
- `GET /api/tracks/:id` - Get specific track
- `GET /api/tracks/user/:userId` - Get tracks by user
- `POST /api/tracks/upload` - Upload new track
- `POST /api/tracks/:id/play` - Update play count

### Playlists
- `GET /api/playlists` - Get all public playlists
- `GET /api/playlists/:id` - Get specific playlist
- `GET /api/playlists/user/:userId` - Get playlists by user
- `POST /api/playlists` - Create new playlist
- `GET /api/playlists/:id/tracks` - Get playlist tracks

## Troubleshooting

### Connection Refused
- Check if the server is running on port 5000
- Verify the IP address is correct
- Ensure both devices are on the same network

### Timeout Issues
- Check network connectivity
- Verify firewall settings
- Try using a different IP address

### CORS Issues
The server is configured to handle CORS for local development. If you encounter CORS issues, check the server configuration in `server/index.ts`.
