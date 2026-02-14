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
  department?: string;
  academicYear?: number;
  classSection?: string;
}

export interface UserResponse {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'creator' | 'listener';
  academicRole?: 'TEACHER' | 'STUDENT';
  department?: string;
  academicYear?: number;
  classSection?: string;
  token?: string; // Add token field
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
      
      // Get JWT token for authenticated requests
      const token = await AsyncStorage.getItem('@openstream_token');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        headers,
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

  // Generic HTTP methods for white labeling and settings
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Special method for file uploads (multipart/form-data)
  async upload<T = any>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      // Get JWT token for authenticated requests
      const token = await AsyncStorage.getItem('@openstream_token');
      
      const headers: Record<string, string> = {};
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Don't set Content-Type for FormData - let the browser set it with boundary
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
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

export const apiClient = new ApiClient();
