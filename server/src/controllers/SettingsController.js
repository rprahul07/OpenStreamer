const database = require('../config/database');

class SettingsController {
  // Get branding settings
  static async getBrandingSettings(req, res) {
    try {
      const { data, error } = await database.supabase
        .from('branding_settings')
        .select('*')
        .eq('id', 'default')
        .single();
      
      if (error) {
        console.error('Get branding settings error:', error);
        return res.status(500).json({ error: 'Failed to get branding settings' });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Get branding settings error:', error);
      res.status(500).json({ error: 'Failed to get branding settings' });
    }
  }

  // Update branding settings (admin only)
  static async updateBrandingSettings(req, res) {
    try {
      const { 
        appName, appLogoUrl, appIconUrl, splashScreenUrl,
        primaryColor, secondaryColor, accentColor,
        backgroundColor, textColor, themeMode, fontFamily,
        customCss, footerText, contactEmail, supportPhone,
        websiteUrl, socialLinks, enabledFeatures
      } = req.body;
      
      const { data, error } = await database.supabase
        .from('branding_settings')
        .update({
          app_name: appName,
          app_logo_url: appLogoUrl,
          app_icon_url: appIconUrl,
          splash_screen_url: splashScreenUrl,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          accent_color: accentColor,
          background_color: backgroundColor,
          text_color: textColor,
          theme_mode: themeMode,
          font_family: fontFamily,
          custom_css: customCss,
          footer_text: footerText,
          contact_email: contactEmail,
          support_phone: supportPhone,
          website_url: websiteUrl,
          social_links: socialLinks,
          enabled_features: enabledFeatures,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'default')
        .select()
        .single();
      
      if (error) {
        console.error('Update branding settings error:', error);
        return res.status(500).json({ error: 'Failed to update branding settings' });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Update branding settings error:', error);
      res.status(500).json({ error: 'Failed to update branding settings' });
    }
  }

  // Get user preferences
  static async getUserPreferences(req, res) {
    try {
      const { data, error } = await database.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', req.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Get user preferences error:', error);
        return res.status(500).json({ error: 'Failed to get user preferences' });
      }
      
      // Return default preferences if none found
      const preferences = data || {
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
        email_notifications: true,
        push_notifications: true,
        auto_play: false,
        high_quality_audio: true,
        download_over_wifi_only: true,
        show_lyrics: true,
        show_album_art: true,
        crossfade_enabled: false,
        crossfade_duration: 3,
        equalizer_settings: {},
        playback_speed: 1.0,
        sleep_timer: 0,
        recently_played_limit: 50,
        favorite_genres: [],
        blocked_artists: [],
        privacy_settings: {},
        accessibility_settings: {}
      };
      
      res.json(preferences);
    } catch (error) {
      console.error('Get user preferences error:', error);
      res.status(500).json({ error: 'Failed to get user preferences' });
    }
  }

  // Update user preferences
  static async updateUserPreferences(req, res) {
    try {
      const {
        theme, language, notificationsEnabled, emailNotifications,
        pushNotifications, autoPlay, highQualityAudio,
        downloadOverWifiOnly, showLyrics, showAlbumArt,
        crossfadeEnabled, crossfadeDuration, equalizerSettings,
        playbackSpeed, sleepTimer, recentlyPlayedLimit,
        favoriteGenres, blockedArtists, privacySettings,
        accessibilitySettings
      } = req.body;
      
      const preferencesData = {
        user_id: req.user.id,
        theme,
        language,
        notifications_enabled: notificationsEnabled,
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
        auto_play: autoPlay,
        high_quality_audio: highQualityAudio,
        download_over_wifi_only: downloadOverWifiOnly,
        show_lyrics: showLyrics,
        show_album_art: showAlbumArt,
        crossfade_enabled: crossfadeEnabled,
        crossfade_duration: crossfadeDuration,
        equalizer_settings: equalizerSettings,
        playback_speed: playbackSpeed,
        sleep_timer: sleepTimer,
        recently_played_limit: recentlyPlayedLimit,
        favorite_genres: favoriteGenres,
        blocked_artists: blockedArtists,
        privacy_settings: privacySettings,
        accessibility_settings: accessibilitySettings,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await database.supabase
        .from('user_preferences')
        .upsert(preferencesData)
        .select()
        .single();
      
      if (error) {
        console.error('Update user preferences error:', error);
        return res.status(500).json({ error: 'Failed to update user preferences' });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Update user preferences error:', error);
      res.status(500).json({ error: 'Failed to update user preferences' });
    }
  }

  // Get global app settings
  static async getAppSettings(req, res) {
    try {
      const { data, error } = await database.supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'global')
        .single();
      
      if (error) {
        console.error('Get app settings error:', error);
        return res.status(500).json({ error: 'Failed to get app settings' });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Get app settings error:', error);
      res.status(500).json({ error: 'Failed to get app settings' });
    }
  }

  // Update global app settings (admin only)
  static async updateAppSettings(req, res) {
    try {
      const {
        appVersion, maintenanceMode, registrationEnabled,
        fileUploadEnabled, maxFileSizeMb, supportedAudioFormats,
        supportedImageFormats, engagementThreshold, autoRemoveThreshold,
        contentModerationEnabled, analyticsEnabled, cacheDurationHours,
        maxPlaylistTracks, maxUserPlaylists, featuredContent,
        announcementBanner, announcementLink, announcementActive
      } = req.body;
      
      const { data, error } = await database.supabase
        .from('app_settings')
        .update({
          app_version: appVersion,
          maintenance_mode: maintenanceMode,
          registration_enabled: registrationEnabled,
          file_upload_enabled: fileUploadEnabled,
          max_file_size_mb: maxFileSizeMb,
          supported_audio_formats: supportedAudioFormats,
          supported_image_formats: supportedImageFormats,
          engagement_threshold: engagementThreshold,
          auto_remove_threshold: autoRemoveThreshold,
          content_moderation_enabled: contentModerationEnabled,
          analytics_enabled: analyticsEnabled,
          cache_duration_hours: cacheDurationHours,
          max_playlist_tracks: maxPlaylistTracks,
          max_user_playlists: maxUserPlaylists,
          featured_content: featuredContent,
          announcement_banner: announcementBanner,
          announcement_link: announcementLink,
          announcement_active: announcementActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'global')
        .select()
        .single();
      
      if (error) {
        console.error('Update app settings error:', error);
        return res.status(500).json({ error: 'Failed to update app settings' });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Update app settings error:', error);
      res.status(500).json({ error: 'Failed to update app settings' });
    }
  }
}

module.exports = SettingsController;
