import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './config';
import { AddTrackRequest } from './playlist-api';

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  displayName: string;
  role?: 'admin' | 'creator' | 'listener';
}

export interface UserResponse {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'creator' | 'listener';
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
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

  async login(credentials: LoginRequest): Promise<ApiResponse<UserResponse>> {
    return this.request<UserResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<UserResponse>> {
    return this.request<UserResponse>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getTracks(): Promise<ApiResponse<any[]>> {
    return this.request(API_CONFIG.ENDPOINTS.TRACKS.GET_ALL);
  }

  async getTracksByUser(userId: string): Promise<ApiResponse<any[]>> {
    return this.request(`${API_CONFIG.ENDPOINTS.TRACKS.GET_BY_USER}/${userId}`);
  }

  async getTrack(id: string): Promise<ApiResponse<any>> {
    return this.request(`${API_CONFIG.ENDPOINTS.TRACKS.GET_BY_ID}/${id}`);
  }

  async getPlaylists(): Promise<ApiResponse<any[]>> {
    return this.request(API_CONFIG.ENDPOINTS.PLAYLISTS.GET_ALL);
  }

  async getPlaylistsByUser(userId: string): Promise<ApiResponse<any[]>> {
    return this.request(`${API_CONFIG.ENDPOINTS.PLAYLISTS.GET_BY_USER}/${userId}`);
  }

  async getPlaylist(id: string): Promise<ApiResponse<any>> {
    return this.request(`${API_CONFIG.ENDPOINTS.PLAYLISTS.GET_BY_ID}/${id}`);
  }

  async createPlaylist(playlistData: any): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.PLAYLISTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(playlistData),
    });
  }

  async getPlaylistTracks(playlistId: string): Promise<ApiResponse<any[]>> {
    return this.request(`${API_CONFIG.ENDPOINTS.PLAYLISTS.GET_TRACKS}/${playlistId}/tracks`);
  }

  async addTrackToPlaylist(playlistId: string, trackData: AddTrackRequest): Promise<ApiResponse<any>> {
    return this.request(`${API_CONFIG.ENDPOINTS.PLAYLISTS.GET_TRACKS}/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify(trackData),
    });
  }

  async updateTrackPlayCount(id: string): Promise<ApiResponse<void>> {
    return this.request(`${API_CONFIG.ENDPOINTS.TRACKS.UPDATE_PLAY_COUNT}/${id}/play`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient();
