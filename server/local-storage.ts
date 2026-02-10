import { type User, type InsertUser, type Track, type InsertTrack, type Playlist, type InsertPlaylist, type PlaylistTrack, type InsertPlaylistTrack } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Track methods
  getTrack(id: string): Promise<Track | undefined>;
  getTracksByUser(userId: string): Promise<Track[]>;
  getPublicTracks(): Promise<Track[]>;
  createTrack(track: InsertTrack): Promise<Track>;
  updateTrackPlayCount(id: string): Promise<void>;
  
  // Playlist methods
  getPlaylist(id: string): Promise<Playlist | undefined>;
  getPlaylistsByUser(userId: string): Promise<Playlist[]>;
  getPublicPlaylists(): Promise<Playlist[]>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  
  // Playlist Track methods
  getPlaylistTracks(playlistId: string): Promise<PlaylistTrack[]>;
  addTrackToPlaylist(playlistTrack: InsertPlaylistTrack): Promise<PlaylistTrack>;
  removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void>;
}

export class LocalStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private tracks: Map<string, Track> = new Map();
  private playlists: Map<string, Playlist> = new Map();
  private playlistTracks: Map<string, PlaylistTrack> = new Map();

  constructor() {
    // Initialize with some demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create demo user
    const demoUser: User = {
      id: 'demo-user-id',
      username: 'demo',
      password: 'demo123',
      displayName: 'Demo User',
      role: 'creator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.set(demoUser.id, demoUser);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      displayName: insertUser.displayName,
      role: insertUser.role || 'creator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.set(id, user);
    return user;
  }

  // Track methods
  async getTrack(id: string): Promise<Track | undefined> {
    return this.tracks.get(id);
  }

  async getTracksByUser(userId: string): Promise<Track[]> {
    const tracks: Track[] = [];
    for (const track of this.tracks.values()) {
      if (track.uploadedBy === userId) {
        tracks.push(track);
      }
    }
    return tracks;
  }

  async getPublicTracks(): Promise<Track[]> {
    const tracks: Track[] = [];
    for (const track of this.tracks.values()) {
      if (track.isPublic) {
        tracks.push(track);
      }
    }
    return tracks;
  }

  async createTrack(insertTrack: InsertTrack): Promise<Track> {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const track: Track = {
      id,
      title: insertTrack.title,
      artist: insertTrack.artist,
      album: insertTrack.album || null,
      duration: insertTrack.duration,
      fileUrl: insertTrack.fileUrl,
      coverUrl: insertTrack.coverUrl || null,
      uploadedBy: insertTrack.uploadedBy,
      isPublic: insertTrack.isPublic ?? 'true',
      playCount: '0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tracks.set(id, track);
    return track;
  }

  async updateTrackPlayCount(id: string): Promise<void> {
    const track = this.tracks.get(id);
    if (track) {
      const currentCount = parseInt(track.playCount || '0') || 0;
      track.playCount = (currentCount + 1).toString();
      track.updatedAt = new Date().toISOString();
    }
  }

  // Playlist methods
  async getPlaylist(id: string): Promise<Playlist | undefined> {
    return this.playlists.get(id);
  }

  async getPlaylistsByUser(userId: string): Promise<Playlist[]> {
    const playlists: Playlist[] = [];
    for (const playlist of this.playlists.values()) {
      if (playlist.userId === userId) {
        playlists.push(playlist);
      }
    }
    return playlists;
  }

  async getPublicPlaylists(): Promise<Playlist[]> {
    const playlists: Playlist[] = [];
    for (const playlist of this.playlists.values()) {
      if (playlist.isPublic) {
        playlists.push(playlist);
      }
    }
    return playlists;
  }

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const playlist: Playlist = {
      id,
      name: insertPlaylist.name,
      description: insertPlaylist.description || null,
      userId: insertPlaylist.userId,
      isPublic: insertPlaylist.isPublic ?? 'false',
      coverUrl: insertPlaylist.coverUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.playlists.set(id, playlist);
    return playlist;
  }

  // Playlist Track methods
  async getPlaylistTracks(playlistId: string): Promise<PlaylistTrack[]> {
    const tracks: PlaylistTrack[] = [];
    for (const track of this.playlistTracks.values()) {
      if (track.playlistId === playlistId) {
        tracks.push(track);
      }
    }
    return tracks.sort((a, b) => parseInt(a.position) - parseInt(b.position));
  }

  async addTrackToPlaylist(insertPlaylistTrack: InsertPlaylistTrack): Promise<PlaylistTrack> {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const playlistTrack: PlaylistTrack = {
      id,
      playlistId: insertPlaylistTrack.playlistId,
      trackId: insertPlaylistTrack.trackId,
      position: insertPlaylistTrack.position.toString(),
      addedAt: new Date().toISOString()
    };
    this.playlistTracks.set(id, playlistTrack);
    return playlistTrack;
  }

  async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    for (const [id, track] of this.playlistTracks.entries()) {
      if (track.playlistId === playlistId && track.trackId === trackId) {
        this.playlistTracks.delete(id);
        break;
      }
    }
  }
}

export const storage = new LocalStorage();
