import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/lib/api';

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  autoPlay: boolean;
  highQualityAudio: boolean;
  downloadOverWifiOnly: boolean;
  showLyrics: boolean;
  showAlbumArt: boolean;
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
  equalizerSettings: Record<string, any>;
  playbackSpeed: number;
  sleepTimer: number;
  recentlyPlayedLimit: number;
  favoriteGenres: string[];
  blockedArtists: string[];
  privacySettings: Record<string, any>;
  accessibilitySettings: Record<string, any>;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  language: 'en',
  notificationsEnabled: true,
  emailNotifications: true,
  pushNotifications: true,
  autoPlay: false,
  highQualityAudio: true,
  downloadOverWifiOnly: true,
  showLyrics: true,
  showAlbumArt: true,
  crossfadeEnabled: false,
  crossfadeDuration: 3,
  equalizerSettings: {},
  playbackSpeed: 1.0,
  sleepTimer: 0,
  recentlyPlayedLimit: 50,
  favoriteGenres: [],
  blockedArtists: [],
  privacySettings: {},
  accessibilitySettings: {},
};

const UserPreferencesContext = createContext<UserPreferencesContextType | null>(null);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      // Try to load from API first
      const response = await apiClient.get('/api/settings/preferences');
      
      if (response.data) {
        const apiPrefs = response.data as any;
        const mergedPreferences = {
          ...DEFAULT_PREFERENCES,
          ...apiPrefs,
          // Handle field name differences
          notificationsEnabled: (apiPrefs as any).notifications_enabled ?? DEFAULT_PREFERENCES.notificationsEnabled,
          emailNotifications: (apiPrefs as any).email_notifications ?? DEFAULT_PREFERENCES.emailNotifications,
          pushNotifications: (apiPrefs as any).push_notifications ?? DEFAULT_PREFERENCES.pushNotifications,
          autoPlay: (apiPrefs as any).auto_play ?? DEFAULT_PREFERENCES.autoPlay,
          highQualityAudio: (apiPrefs as any).high_quality_audio ?? DEFAULT_PREFERENCES.highQualityAudio,
          downloadOverWifiOnly: (apiPrefs as any).download_over_wifi_only ?? DEFAULT_PREFERENCES.downloadOverWifiOnly,
          showLyrics: (apiPrefs as any).show_lyrics ?? DEFAULT_PREFERENCES.showLyrics,
          showAlbumArt: (apiPrefs as any).show_album_art ?? DEFAULT_PREFERENCES.showAlbumArt,
          crossfadeEnabled: (apiPrefs as any).crossfade_enabled ?? DEFAULT_PREFERENCES.crossfadeEnabled,
          crossfadeDuration: (apiPrefs as any).crossfade_duration ?? DEFAULT_PREFERENCES.crossfadeDuration,
          equalizerSettings: (apiPrefs as any).equalizer_settings ?? DEFAULT_PREFERENCES.equalizerSettings,
          playbackSpeed: (apiPrefs as any).playback_speed ?? DEFAULT_PREFERENCES.playbackSpeed,
          sleepTimer: (apiPrefs as any).sleep_timer ?? DEFAULT_PREFERENCES.sleepTimer,
          recentlyPlayedLimit: (apiPrefs as any).recently_played_limit ?? DEFAULT_PREFERENCES.recentlyPlayedLimit,
          favoriteGenres: (apiPrefs as any).favorite_genres ?? DEFAULT_PREFERENCES.favoriteGenres,
          blockedArtists: (apiPrefs as any).blocked_artists ?? DEFAULT_PREFERENCES.blockedArtists,
          privacySettings: (apiPrefs as any).privacy_settings ?? DEFAULT_PREFERENCES.privacySettings,
          accessibilitySettings: (apiPrefs as any).accessibility_settings ?? DEFAULT_PREFERENCES.accessibilitySettings,
        };
        
        setPreferences(mergedPreferences);
        await AsyncStorage.setItem('@user_preferences', JSON.stringify(mergedPreferences));
      }
    } catch (error) {
      console.log('Failed to load preferences from API, using cache:', error);
      
      // Fallback to cached preferences
      try {
        const cached = await AsyncStorage.getItem('@user_preferences');
        if (cached) {
          setPreferences(JSON.parse(cached));
        }
      } catch (cacheError) {
        console.error('Failed to load cached preferences:', cacheError);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function updatePreferences(updates: Partial<UserPreferences>) {
    try {
      const newPreferences = { ...preferences, ...updates };
      
      // Update locally immediately for responsiveness
      setPreferences(newPreferences);
      await AsyncStorage.setItem('@user_preferences', JSON.stringify(newPreferences));
      
      // Try to update on backend
      try {
        const apiUpdates = {
          theme: newPreferences.theme,
          language: newPreferences.language,
          notifications_enabled: newPreferences.notificationsEnabled,
          email_notifications: newPreferences.emailNotifications,
          push_notifications: newPreferences.pushNotifications,
          auto_play: newPreferences.autoPlay,
          high_quality_audio: newPreferences.highQualityAudio,
          download_over_wifi_only: newPreferences.downloadOverWifiOnly,
          show_lyrics: newPreferences.showLyrics,
          show_album_art: newPreferences.showAlbumArt,
          crossfade_enabled: newPreferences.crossfadeEnabled,
          crossfade_duration: newPreferences.crossfadeDuration,
          equalizer_settings: newPreferences.equalizerSettings,
          playback_speed: newPreferences.playbackSpeed,
          sleep_timer: newPreferences.sleepTimer,
          recently_played_limit: newPreferences.recentlyPlayedLimit,
          favorite_genres: newPreferences.favoriteGenres,
          blocked_artists: newPreferences.blockedArtists,
          privacy_settings: newPreferences.privacySettings,
          accessibility_settings: newPreferences.accessibilitySettings,
        };
        
        await apiClient.put('/api/settings/preferences', apiUpdates);
      } catch (apiError) {
        console.error('Failed to update preferences on backend:', apiError);
        // Continue with local update even if backend fails
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  }

  const value = {
    preferences,
    updatePreferences,
    isLoading,
  };

  return <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>;
}

export function useUserPreferences() {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) throw new Error('useUserPreferences must be used within UserPreferencesProvider');
  return ctx;
}
