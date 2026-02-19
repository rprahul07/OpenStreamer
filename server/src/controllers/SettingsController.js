const database = require('../config/database');
const s3Service = require('../config/s3');

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
      const body = req.body;

      // Accept BOTH snake_case (sent by client) AND camelCase field names.
      const get = (snake, camel) => body[snake] !== undefined ? body[snake] : body[camel];

      const userId = req.user.id;

      // ── Step 1: Check if a row already exists for this user ──────────────────
      const { data: existing, error: fetchError } = await database.supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('Update user preferences fetch error:', fetchError);
        return res.status(500).json({ error: 'Failed to update user preferences' });
      }

      const preferencesData = {
        user_id: userId,
        theme: get('theme', 'theme'),
        language: get('language', 'language'),
        notifications_enabled: get('notifications_enabled', 'notificationsEnabled'),
        email_notifications: get('email_notifications', 'emailNotifications'),
        push_notifications: get('push_notifications', 'pushNotifications'),
        auto_play: get('auto_play', 'autoPlay'),
        high_quality_audio: get('high_quality_audio', 'highQualityAudio'),
        download_over_wifi_only: get('download_over_wifi_only', 'downloadOverWifiOnly'),
        show_lyrics: get('show_lyrics', 'showLyrics'),
        show_album_art: get('show_album_art', 'showAlbumArt'),
        crossfade_enabled: get('crossfade_enabled', 'crossfadeEnabled'),
        crossfade_duration: get('crossfade_duration', 'crossfadeDuration'),
        equalizer_settings: get('equalizer_settings', 'equalizerSettings'),
        playback_speed: get('playback_speed', 'playbackSpeed'),
        sleep_timer: get('sleep_timer', 'sleepTimer'),
        recently_played_limit: get('recently_played_limit', 'recentlyPlayedLimit'),
        favorite_genres: get('favorite_genres', 'favoriteGenres'),
        blocked_artists: get('blocked_artists', 'blockedArtists'),
        privacy_settings: get('privacy_settings', 'privacySettings'),
        accessibility_settings: get('accessibility_settings', 'accessibilitySettings'),
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values so we only touch fields actually sent by client.
      Object.keys(preferencesData).forEach(k => {
        if (preferencesData[k] === undefined) delete preferencesData[k];
      });

      let data, error;

      if (existing) {
        // ── Step 2a: Row exists → UPDATE by known id ─────────────────────────
        ({ data, error } = await database.supabase
          .from('user_preferences')
          .update(preferencesData)
          .eq('id', existing.id)
          .select()
          .single());
      } else {
        // ── Step 2b: No row yet → INSERT (Supabase generates id via DEFAULT) ─
        ({ data, error } = await database.supabase
          .from('user_preferences')
          .insert(preferencesData)
          .select()
          .single());
      }

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

  // Get user branding settings
  static async getUserBrandingSettings(req, res) {
    try {
      const { data, error } = await database.supabase
        .from('user_branding_settings')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Get user branding settings error:', error);
        return res.status(500).json({ error: 'Failed to get user branding settings' });
      }

      // Return default branding if none found
      const branding = data || {
        app_name: 'Academic Audio Platform',
        primary_color: '#4F46E5',
        secondary_color: '#10B981',
        accent_color: '#F59E0B',
        background_color: '#FFFFFF',
        text_color: '#1F2937',
        theme_mode: 'light',
        footer_text: '2024 Academic Audio Platform',
        social_links: {}
      };

      res.json(branding);
    } catch (error) {
      console.error('Get user branding settings error:', error);
      res.status(500).json({ error: 'Failed to get user branding settings' });
    }
  }

  // Update user branding settings
  static async updateUserBrandingSettings(req, res) {
    try {
      const {
        appName, appLogoUrl,
        primaryColor, accentColor
      } = req.body;

      const brandingData = {
        user_id: req.user.id,
        app_name: appName,
        app_logo_url: appLogoUrl,
        primary_color: primaryColor,
        accent_color: accentColor,
        updated_at: new Date().toISOString()
      };

      console.log('Updating user branding with data:', brandingData);

      const { data, error } = await database.supabase
        .from('user_branding_settings')
        .upsert(brandingData, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Update user branding settings error:', error);
        return res.status(500).json({ error: 'Failed to update user branding settings' });
      }

      console.log('User branding updated successfully:', data);
      res.json(data);
    } catch (error) {
      console.error('Update user branding settings error:', error);
      res.status(500).json({ error: 'Failed to update user branding settings' });
    }
  }

  // Upload branding asset (logo, icon, splash screen)
  static async uploadBrandingAsset(req, res) {
    try {
      console.log('Upload request received:', {
        type: req.params.type,
        file: req.file ? 'present' : 'missing',
        user: req.user?.id
      });

      const { type } = req.params; // 'logo', 'icon', or 'splash'
      const file = req.file;

      if (!file) {
        console.error('No file uploaded in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (!['logo', 'icon', 'splash'].includes(type)) {
        console.error('Invalid asset type:', type);
        return res.status(400).json({ error: 'Invalid asset type. Must be logo, icon, or splash' });
      }

      // Generate S3 key
      const key = s3Service.generateBrandingUploadPath(req.user.id, type, file.originalname);
      console.log('Generated S3 key:', key);

      // Upload to S3
      const fileUrl = await s3Service.uploadFile(file.buffer, key, file.mimetype);
      console.log('File uploaded to S3:', fileUrl);

      const response = {
        url: fileUrl,
        type: type,
        key: key
      };

      console.log('Sending response:', response);
      res.json(response);
    } catch (error) {
      console.error('Upload branding asset error:', error);
      res.status(500).json({ error: 'Failed to upload branding asset' });
    }
  }

  // Delete branding asset
  static async deleteBrandingAsset(req, res) {
    try {
      const { type } = req.params;
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'No URL provided' });
      }

      // Extract key from URL and delete from S3
      const key = s3Service.extractKeyFromUrl(url);
      await s3Service.deleteFile(key);

      res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
      console.error('Delete branding asset error:', error);
      res.status(500).json({ error: 'Failed to delete branding asset' });
    }
  }
}

module.exports = SettingsController;
