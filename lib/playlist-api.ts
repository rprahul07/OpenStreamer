import { apiClient, type ApiResponse } from './api';
import { Playlist, Track } from './data';

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  isPublic?: "true" | "false";
  coverUrl?: string;
}

export interface PlaylistResponse {
  id: string;
  name: string;
  description?: string;
  userId: string;
  isPublic: boolean;
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddTrackRequest {
  trackId: string;
  position: number;
}

// Playlist API functions
export async function getPlaylists(): Promise<Playlist[]> {
  try {
    const response = await apiClient.getPlaylists();
    if (response.error) {
      console.error('Failed to fetch playlists:', response.error);
      return [];
    }
    
    const serverPlaylists = response.data || [];
    // Convert each playlist to frontend format with tracks
    const convertedPlaylists = await Promise.all(
      serverPlaylists.map(playlist => convertServerPlaylist(playlist))
    );
    return convertedPlaylists;
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return [];
  }
}

export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
  try {
    const response = await apiClient.getPlaylistsByUser(userId);
    if (response.error) {
      console.error('Failed to fetch user playlists:', response.error);
      return [];
    }
    
    const serverPlaylists = response.data || [];
    // Convert each playlist to frontend format with tracks
    const convertedPlaylists = await Promise.all(
      serverPlaylists.map(playlist => convertServerPlaylist(playlist))
    );
    return convertedPlaylists;
  } catch (error) {
    console.error('Error fetching user playlists:', error);
    return [];
  }
}

export async function getPlaylist(id: string): Promise<Playlist | null> {
  try {
    const response = await apiClient.getPlaylist(id);
    if (response.error) {
      console.error('Failed to fetch playlist:', response.error);
      return null;
    }
    
    if (!response.data) return null;
    
    // Convert playlist to frontend format with tracks
    return await convertServerPlaylist(response.data);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return null;
  }
}

export async function createPlaylist(playlistData: CreatePlaylistRequest & { userId: string }): Promise<Playlist | null> {
  try {
    const response = await apiClient.createPlaylist(playlistData);
    if (response.error) {
      console.error('Failed to create playlist:', response.error);
      return null;
    }
    
    if (!response.data) return null;
    
    // Convert playlist to frontend format with tracks
    return await convertServerPlaylist(response.data);
  } catch (error) {
    console.error('Error creating playlist:', error);
    return null;
  }
}

export async function getPlaylistTracks(playlistId: string): Promise<Track[]> {
  try {
    const response = await apiClient.getPlaylistTracks(playlistId);
    if (response.error) {
      console.error('Failed to fetch playlist tracks:', response.error);
      return [];
    }
    return response.data || [];
  } catch (error) {
    console.error('Error fetching playlist tracks:', error);
    return [];
  }
}

export async function addTrackToPlaylist(
  playlistId: string, 
  trackData: AddTrackRequest
): Promise<boolean> {
  try {
    const response = await apiClient.addTrackToPlaylist(playlistId, trackData);
    if (response.error) {
      console.error('Failed to add track to playlist:', response.error);
      return false;
    }
    // Check for success response (either data or success: true)
    return !!(response.data?.success || response.data);
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    return false;
  }
}

// Helper function to convert server playlist to frontend format
export async function convertServerPlaylist(serverPlaylist: PlaylistResponse): Promise<Playlist> {
  // Fetch tracks for this playlist
  const tracks = await getPlaylistTracks(serverPlaylist.id);
  
  return {
    id: serverPlaylist.id,
    name: serverPlaylist.name,
    description: serverPlaylist.description || '',
    coverUrl: serverPlaylist.coverUrl || 'https://picsum.photos/seed/default/400/400',
    tracks: tracks,
    creatorId: serverPlaylist.userId,
    creatorName: 'User', // Will be updated when we have user data
    isPublic: serverPlaylist.isPublic,
    createdAt: new Date(serverPlaylist.createdAt).getTime(),
  };
}
