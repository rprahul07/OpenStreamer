import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './config';

export interface UploadTrackRequest {
  title: string;
  artist: string;
  album?: string;
  fileUri: string;
  uploadedBy: string;
  isPublic: string;
  department?: string;
  academicYear?: number;
  classSection?: string;
  playlistId?: string;
}

export interface TrackResponse {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: string;
  fileUrl: string;
  coverUrl?: string;
  uploadedBy: string;
  isPublic: string;
  playCount: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class TrackApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await AsyncStorage.getItem('@openstream_token');
      const url = `${this.baseURL}${endpoint}`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (!response.ok) {
        return {
          error: data.error || data.message || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}

export const trackApiClient = new TrackApiClient();

// Helper function for upload
export async function uploadTrack(trackData: UploadTrackRequest): Promise<TrackResponse | null> {
  try {
    const token = await AsyncStorage.getItem('@openstream_token');

    const formData = new FormData();

    // Add required fields (these are guaranteed to be defined)
    formData.append('title', trackData.title);
    formData.append('artist', trackData.artist);
    formData.append('album', trackData.album || '');
    formData.append('uploadedBy', trackData.uploadedBy);
    formData.append('isPublic', trackData.isPublic);
    formData.append('playlistId', trackData.playlistId);

    // Add optional fields only if they exist
    if (trackData.department) {
      formData.append('department', trackData.department);
    }
    if (trackData.academicYear !== undefined) {
      formData.append('academicYear', String(trackData.academicYear));
    }
    if (trackData.classSection) {
      formData.append('classSection', trackData.classSection);
    }

    // Add the audio file
    if (trackData.fileUri) {
      const audioFile = {
        uri: trackData.fileUri,
        type: 'audio/mpeg',
        name: `${trackData.title.replace(/\s+/g, '_')}.mp3`,
      };
      formData.append('audioFile', audioFile as any);
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRACKS.UPLOAD}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Upload failed: ${response.status}`);
    }

    const track = await response.json();
    return track;
  } catch (error) {
    console.error('Error uploading track:', error);
    return null;
  }
}
