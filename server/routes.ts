import type { Express } from "express";
import { createServer, type Server } from "node:http";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { storage } from "./storage";
import { insertUserSchema, insertTrackSchema, insertPlaylistSchema, insertPlaylistTrackSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') // 50MB default
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid input', details: result.error });
      }

      const existingUser = await storage.getUserByUsername(result.data.username);
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      const user = await storage.createUser({
        ...result.data,
        role: result.data.role || 'creator'
      });
      res.json({ id: user.id, username: user.username, displayName: user.displayName, role: user.role });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json({ id: user.id, username: user.username, displayName: user.displayName, role: user.role });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Track routes
  app.get('/api/tracks', async (req, res) => {
    try {
      const tracks = await storage.getPublicTracks();
      res.json(tracks);
    } catch (error) {
      console.error('Get tracks error:', error);
      res.status(500).json({ error: 'Failed to get tracks' });
    }
  });

  app.get('/api/tracks/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const tracks = await storage.getTracksByUser(userId);
      res.json(tracks);
    } catch (error) {
      console.error('Get user tracks error:', error);
      res.status(500).json({ error: 'Failed to get user tracks' });
    }
  });

  app.get('/api/tracks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const track = await storage.getTrack(id);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      res.json(track);
    } catch (error) {
      console.error('Get track error:', error);
      res.status(500).json({ error: 'Failed to get track' });
    }
  });

  app.post('/api/tracks/upload', upload.single('audioFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file required' });
      }

      const { title, artist, album, uploadedBy, isPublic } = req.body;
      if (!title || !artist || !uploadedBy) {
        return res.status(400).json({ error: 'Title, artist, and uploadedBy required' });
      }

      // For now, we'll use a placeholder duration
      const duration = 180; // 3 minutes default

      const trackData = {
        title,
        artist,
        album: album || null,
        duration: duration.toString(),
        fileUrl: `/uploads/${req.file.filename}`,
        uploadedBy,
        isPublic: isPublic === 'true' ? 'true' as const : 'false' as const
      };

      const track = await storage.createTrack(trackData);
      res.json(track);
    } catch (error) {
      console.error('Upload track error:', error);
      res.status(500).json({ error: 'Failed to upload track' });
    }
  });

  app.post('/api/tracks/:id/play', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateTrackPlayCount(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Update play count error:', error);
      res.status(500).json({ error: 'Failed to update play count' });
    }
  });

  // Playlist routes
  app.get('/api/playlists', async (req, res) => {
    try {
      const playlists = await storage.getPublicPlaylists();
      res.json(playlists);
    } catch (error) {
      console.error('Get playlists error:', error);
      res.status(500).json({ error: 'Failed to get playlists' });
    }
  });

  app.get('/api/playlists/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const playlists = await storage.getPlaylistsByUser(userId);
      res.json(playlists);
    } catch (error) {
      console.error('Get user playlists error:', error);
      res.status(500).json({ error: 'Failed to get user playlists' });
    }
  });

  app.get('/api/playlists/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const playlist = await storage.getPlaylist(id);
      if (!playlist) {
        return res.status(404).json({ error: 'Playlist not found' });
      }
      res.json(playlist);
    } catch (error) {
      console.error('Get playlist error:', error);
      res.status(500).json({ error: 'Failed to get playlist' });
    }
  });

  app.post('/api/playlists', async (req, res) => {
    try {
      const result = insertPlaylistSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid input', details: result.error });
      }

      const playlist = await storage.createPlaylist(result.data);
      res.json(playlist);
    } catch (error) {
      console.error('Create playlist error:', error);
      res.status(500).json({ error: 'Failed to create playlist' });
    }
  });

  app.get('/api/playlists/:id/tracks', async (req, res) => {
    try {
      const { id } = req.params;
      const tracks = await storage.getPlaylistTracks(id);
      res.json(tracks);
    } catch (error) {
      console.error('Get playlist tracks error:', error);
      res.status(500).json({ error: 'Failed to get playlist tracks' });
    }
  });

  app.post('/api/playlists/:id/tracks', async (req, res) => {
    try {
      const { id } = req.params;
      const { trackId, position } = req.body;

      if (!trackId || position === undefined) {
        return res.status(400).json({ error: 'Track ID and position required' });
      }

      await storage.addTrackToPlaylist({
        playlistId: id,
        trackId,
        position
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Add track to playlist error:', error);
      res.status(500).json({ error: 'Failed to add track to playlist' });
    }
  });

  app.delete('/api/playlists/:id/tracks/:trackId', async (req, res) => {
    try {
      const { id, trackId } = req.params;
      await storage.removeTrackFromPlaylist(id, trackId);
      res.json({ success: true });
    } catch (error) {
      console.error('Remove track from playlist error:', error);
      res.status(500).json({ error: 'Failed to remove track from playlist' });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  const httpServer = createServer(app);
  return httpServer;
}
