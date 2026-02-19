import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  Modal,
  Linking,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { usePlayer } from '@/contexts/PlayerContext';
import MiniPlayer from '@/components/MiniPlayer';
import Colors from '@/constants/colors';
import { apiClient } from '@/lib/api';

const ACCENT_COLORS = [
  '#00E5CC', '#FF6B6B', '#6C63FF', '#FFB347',
  '#4ECDC4', '#FF69B4', '#45B7D1', '#96CEB4',
];

const PRIMARY_COLORS = [
  '#4F46E5', '#DC2626', '#059669', '#D97706',
  '#7C3AED', '#DB2777', '#0891B2', '#6366F1',
];

// ─── Reusable Row Components ──────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  accentColor,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  accentColor: string;
}) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.info}>
        <Text style={rowStyles.label}>{label}</Text>
        {description ? <Text style={rowStyles.desc}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onValueChange(v);
        }}
        trackColor={{ false: Colors.dark.border, true: accentColor }}
        thumbColor={Colors.dark.text}
      />
    </View>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <View style={rowStyles.sectionDivider}>
      <Text style={rowStyles.sectionDividerText}>{title}</Text>
    </View>
  );
}

// ─── Modal Wrapper ────────────────────────────────────────────────────────────

// Pixel height constants — avoids flex collapsing on Android
const WIN_H = Dimensions.get('window').height;
const SCROLL_MAX_H = Math.round(WIN_H * 0.72); // ~72 % of screen for content

function BottomSheetModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Full-screen Pressable = backdrop tap-to-close */}
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        {/* Inner Pressable stops tap from bubbling to backdrop */}
        <Pressable style={modalStyles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={modalStyles.handle} />
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12} style={modalStyles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.dark.text} />
            </Pressable>
          </View>
          {/* Explicit maxHeight in pixels — no flex dependency on parent */}
          <ScrollView
            style={{ maxHeight: SCROLL_MAX_H }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Settings Screen ─────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { branding, updateBranding, resetBranding } = useBranding();
  const { preferences, updatePreferences, isLoading: prefsLoading } = useUserPreferences();
  const { currentTrack } = usePlayer();

  const [appName, setAppName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4F46E5');
  const [accentColor, setAccentColor] = useState('#F59E0B');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);

  const [showBranding, setShowBranding] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Modals
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);

  useEffect(() => {
    if (branding.appName) setAppName(branding.appName);
    if (branding.primaryColor) setPrimaryColor(branding.primaryColor);
    if (branding.accentColor) setAccentColor(branding.accentColor);
  }, [branding]);

  const ac = branding.accentColor;

  async function handleLogout() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  async function handleSaveBranding() {
    try {
      setSavingBranding(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await updateBranding({
        appName: appName.trim() || branding.appName || 'Academic Audio Platform',
        primaryColor: primaryColor || branding.primaryColor,
        accentColor: accentColor || branding.accentColor,
      });
      Alert.alert('Saved ✓', 'Branding updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to save branding. Please try again.');
    } finally {
      setSavingBranding(false);
    }
  }

  async function handlePickLogo(type: 'logo' | 'icon' | 'splash') {
    try {
      setUploadingLogo(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: type === 'logo' ? [1, 1] : [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const formData = new FormData();
        formData.append('file', {
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType || 'image/jpeg',
          name: result.assets[0].fileName || 'logo.jpg',
        } as any);
        const response = await apiClient.upload(`/api/settings/user/branding/upload/${type}`, formData);
        if (response.success && response.data?.url) {
          const urlField = type === 'logo' ? 'appLogoUrl' : 'appIconUrl';
          await updateBranding({ [urlField]: response.data.url });
          Alert.alert('Uploaded ✓', `${type} updated successfully`);
        } else {
          throw new Error(response.error || 'Upload failed');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleResetBranding() {
    Alert.alert('Reset Branding', 'Reset all branding to defaults?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await resetBranding();
          setAppName('Academic Audio Platform');
          setPrimaryColor('#4F46E5');
          setAccentColor('#F59E0B');
        },
      },
    ]);
  }

  const pref = preferences;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 12,
          paddingBottom: (currentTrack ? 150 : 110) + (Platform.OS === 'web' ? 34 : 0),
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Settings</Text>

        {/* Profile Card */}
        <View style={[styles.profileCard, { borderColor: ac + '30' }]}>
          <View style={[styles.profileAvatar, { backgroundColor: ac + '20' }]}>
            <Ionicons name="person" size={28} color={ac} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName}</Text>
            <Text style={styles.profileUsername}>@{user?.username}</Text>
            <View style={[styles.roleBadge, { backgroundColor: ac + '15', borderColor: ac + '40' }]}>
              <Text style={[styles.roleText, { color: ac }]}>{user?.role || 'listener'}</Text>
            </View>
          </View>
          {user?.department && (
            <View style={styles.deptBadge}>
              <Text style={styles.deptText}>{user.department}</Text>
            </View>
          )}
        </View>

        {/* Section: Appearance */}
        <Text style={styles.sectionLabel}>APPEARANCE</Text>

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuPressed]}
          onPress={() => setShowBranding(!showBranding)}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#6C63FF20' }]}>
            <Ionicons name="color-palette" size={20} color="#6C63FF" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>White Label Branding</Text>
            <Text style={styles.menuSub}>Customize app colors and logo</Text>
          </View>
          <Ionicons name={showBranding ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.dark.textMuted} />
        </Pressable>

        {showBranding && (
          <View style={styles.expandPanel}>
            <View style={styles.brandingRow}>
              <Text style={styles.brandingLabel}>App Name</Text>
              <TextInput
                style={styles.brandingInput}
                value={appName}
                onChangeText={setAppName}
                placeholder="App Name"
                placeholderTextColor={Colors.dark.textMuted}
              />
            </View>

            <View style={styles.brandingRow}>
              <Text style={styles.brandingLabel}>Primary Color</Text>
              <View style={styles.colorGrid}>
                {PRIMARY_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[styles.colorSwatch, { backgroundColor: color },
                    primaryColor === color && styles.colorSwatchActive]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPrimaryColor(color); }}
                  >
                    {primaryColor === color && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.brandingRow}>
              <Text style={styles.brandingLabel}>Accent Color</Text>
              <View style={styles.colorGrid}>
                {ACCENT_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[styles.colorSwatch, { backgroundColor: color },
                    accentColor === color && styles.colorSwatchActive]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAccentColor(color); }}
                  >
                    {accentColor === color && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.brandingRow}>
              <Text style={styles.brandingLabel}>App Logo</Text>
              <Pressable
                style={styles.logoPicker}
                onPress={() => handlePickLogo('logo')}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? (
                  <ActivityIndicator color={ac} />
                ) : branding.appLogoUrl ? (
                  <Image source={{ uri: branding.appLogoUrl }} style={styles.logoImage} contentFit="cover" />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Ionicons name="image-outline" size={24} color={Colors.dark.textMuted} />
                    <Text style={styles.logoPlaceholderText}>Tap to upload</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Live Preview */}
            <View style={[styles.previewChip, { backgroundColor: accentColor }]}>
              <Text style={styles.previewChipText}>{appName || 'App Name'} — Preview</Text>
            </View>

            <View style={styles.brandingActions}>
              <Pressable
                style={({ pressed }) => [styles.saveBtn, { backgroundColor: accentColor, opacity: pressed ? 0.8 : 1 }]}
                onPress={handleSaveBranding}
                disabled={savingBranding}
              >
                {savingBranding
                  ? <ActivityIndicator color="#000" size="small" />
                  : <Text style={styles.saveBtnText}>Save Changes</Text>
                }
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.resetBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={handleResetBranding}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Section: Preferences */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuPressed]}
          onPress={() => setShowPreferences(!showPreferences)}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#FFB34720' }]}>
            <Ionicons name="settings-outline" size={20} color="#FFB347" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Playback & Display</Text>
            <Text style={styles.menuSub}>Audio, lyrics, album art</Text>
          </View>
          <Ionicons name={showPreferences ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.dark.textMuted} />
        </Pressable>

        {showPreferences && (
          <View style={styles.expandPanel}>
            <ToggleRow
              label="High Quality Audio"
              description="Use more data for better sound"
              value={pref.highQualityAudio}
              onValueChange={(v) => updatePreferences({ highQualityAudio: v })}
              accentColor={ac}
            />
            <ToggleRow
              label="Auto Play"
              description="Start playing when you open a playlist"
              value={pref.autoPlay}
              onValueChange={(v) => updatePreferences({ autoPlay: v })}
              accentColor={ac}
            />
            <ToggleRow
              label="Show Lyrics"
              description="Display lyrics when available"
              value={pref.showLyrics}
              onValueChange={(v) => updatePreferences({ showLyrics: v })}
              accentColor={ac}
            />
            <ToggleRow
              label="Show Album Art"
              description="Display cover art in player"
              value={pref.showAlbumArt}
              onValueChange={(v) => updatePreferences({ showAlbumArt: v })}
              accentColor={ac}
            />
            <ToggleRow
              label="Crossfade"
              description={`Smooth transition between tracks (${pref.crossfadeDuration}s)`}
              value={pref.crossfadeEnabled}
              onValueChange={(v) => updatePreferences({ crossfadeEnabled: v })}
              accentColor={ac}
            />
            <ToggleRow
              label="Download over WiFi only"
              description="Save mobile data"
              value={pref.downloadOverWifiOnly}
              onValueChange={(v) => updatePreferences({ downloadOverWifiOnly: v })}
              accentColor={ac}
            />
            {/* Playback speed selector — stacked layout so chips don't overflow */}
            <View style={styles.speedBlock}>
              <View style={styles.speedBlockHeader}>
                <Text style={rowStyles.label}>Playback Speed</Text>
                <Text style={[rowStyles.desc, { marginTop: 0 }]}>Current: {pref.playbackSpeed}×</Text>
              </View>
              <View style={styles.speedChipsWrap}>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                  <Pressable
                    key={speed}
                    style={[styles.speedChip, pref.playbackSpeed === speed && { backgroundColor: ac }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updatePreferences({ playbackSpeed: speed }); }}
                  >
                    <Text style={[styles.speedChipText, pref.playbackSpeed === speed && { color: '#000' }]}>
                      {speed}×
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Section: More */}
        <Text style={styles.sectionLabel}>MORE</Text>

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuPressed]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAudioModal(true); }}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#4ECDC420' }]}>
            <Ionicons name="musical-note-outline" size={20} color="#4ECDC4" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Audio Session</Text>
            <Text style={styles.menuSub}>Background play, interruptions</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuPressed]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowNotifModal(true); }}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#FFB34720' }]}>
            <Ionicons name="notifications-outline" size={20} color="#FFB347" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Notifications</Text>
            <Text style={styles.menuSub}>
              {pref.pushNotifications ? 'On' : 'Off'} · {pref.notificationsEnabled ? 'Media alerts on' : 'Media alerts off'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuPressed]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPrivacyModal(true); }}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#4ECDC420' }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#4ECDC4" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Privacy & Security</Text>
            <Text style={styles.menuSub}>Control your data</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuPressed]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAboutModal(true); }}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#00E5CC20' }]}>
            <Ionicons name="information-circle-outline" size={20} color="#00E5CC" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>About</Text>
            <Text style={styles.menuSub}>Version {Constants.expoConfig?.version || '1.0.0'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.dark.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.miniPlayerContainer}>
        <MiniPlayer />
      </View>

      {/* ── Notifications Modal ── */}
      <BottomSheetModal
        visible={showNotifModal}
        title="Notifications"
        onClose={() => setShowNotifModal(false)}
      >
        <ToggleRow
          label="Push Notifications"
          description="Receive alerts on your device"
          value={pref.pushNotifications}
          onValueChange={(v) => updatePreferences({ pushNotifications: v })}
          accentColor={ac}
        />
        <ToggleRow
          label="Email Notifications"
          description="Receive email updates and newsletters"
          value={pref.emailNotifications}
          onValueChange={(v) => updatePreferences({ emailNotifications: v })}
          accentColor={ac}
        />
        <ToggleRow
          label="Now Playing Notification"
          description="Show media controls in notification shade"
          value={pref.notificationsEnabled}
          onValueChange={(v) => updatePreferences({ notificationsEnabled: v })}
          accentColor={ac}
        />
        {!pref.pushNotifications && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.dark.textMuted} />
            <Text style={styles.infoBoxText}>
              Enable Push Notifications to receive alerts when new playlists are shared with you.
            </Text>
          </View>
        )}
        <Pressable
          style={styles.systemSettingsBtn}
          onPress={() => Linking.openSettings()}
        >
          <Ionicons name="settings-outline" size={16} color={ac} />
          <Text style={[styles.systemSettingsBtnText, { color: ac }]}>Open System Notification Settings</Text>
        </Pressable>
      </BottomSheetModal>

      {/* ── Audio Session Modal ── */}
      <BottomSheetModal
        visible={showAudioModal}
        title="Audio Session"
        onClose={() => setShowAudioModal(false)}
      >
        <View style={styles.infoBox}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.dark.success} />
          <Text style={styles.infoBoxText}>
            Audio is configured to play in the background and duck during phone calls.
          </Text>
        </View>
        <ToggleRow
          label="Crossfade between tracks"
          description={`Blend tracks smoothly — ${pref.crossfadeDuration}s transition`}
          value={pref.crossfadeEnabled}
          onValueChange={(v) => updatePreferences({ crossfadeEnabled: v })}
          accentColor={ac}
        />
        {pref.crossfadeEnabled && (
          <View style={styles.speedBlock}>
            <View style={styles.speedBlockHeader}>
              <Text style={rowStyles.label}>Crossfade Duration</Text>
            </View>
            <View style={styles.speedChipsWrap}>
              {[1, 2, 3, 5, 8].map(s => (
                <Pressable
                  key={s}
                  style={[styles.speedChip, pref.crossfadeDuration === s && { backgroundColor: ac }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updatePreferences({ crossfadeDuration: s }); }}
                >
                  <Text style={[styles.speedChipText, pref.crossfadeDuration === s && { color: '#000' }]}>{s}s</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        <ToggleRow
          label="High Quality Audio"
          description="Uses more data — recommended on WiFi"
          value={pref.highQualityAudio}
          onValueChange={(v) => updatePreferences({ highQualityAudio: v })}
          accentColor={ac}
        />
        <View style={styles.speedBlock}>
          <View style={styles.speedBlockHeader}>
            <Text style={rowStyles.label}>Sleep Timer</Text>
            <Text style={rowStyles.desc}>
              {pref.sleepTimer > 0 ? `Stops in ${pref.sleepTimer} min` : 'Disabled'}
            </Text>
          </View>
          <View style={styles.speedChipsWrap}>
            {[0, 15, 30, 45, 60].map(mins => (
              <Pressable
                key={mins}
                style={[styles.speedChip, pref.sleepTimer === mins && { backgroundColor: ac }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updatePreferences({ sleepTimer: mins }); }}
              >
                <Text style={[styles.speedChipText, pref.sleepTimer === mins && { color: '#000' }]}>
                  {mins === 0 ? 'Off' : `${mins}m`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </BottomSheetModal>

      {/* ── Privacy Modal ── */}
      <BottomSheetModal
        visible={showPrivacyModal}
        title="Privacy & Security"
        onClose={() => setShowPrivacyModal(false)}
      >
        <ToggleRow
          label="Activity Tracking"
          description="Save your listening history for recommendations"
          value={pref.privacySettings?.activityTracking !== false}
          onValueChange={(v) => updatePreferences({ privacySettings: { ...pref.privacySettings, activityTracking: v } })}
          accentColor={ac}
        />
        <ToggleRow
          label="Data Collection"
          description="Share anonymous analytics to improve the app"
          value={pref.privacySettings?.dataCollection !== false}
          onValueChange={(v) => updatePreferences({ privacySettings: { ...pref.privacySettings, dataCollection: v } })}
          accentColor={ac}
        />
        <ToggleRow
          label="Show Profile Publicly"
          description="Other users can see your playlists"
          value={pref.privacySettings?.profilePublic !== false}
          onValueChange={(v) => updatePreferences({ privacySettings: { ...pref.privacySettings, profilePublic: v } })}
          accentColor={ac}
        />
        <View style={styles.divider} />
        {/* Privacy Policy link */}
        <Pressable
          style={styles.policyLink}
          onPress={() => { setShowPrivacyModal(false); router.push('/privacy-policy'); }}
        >
          <Ionicons name="document-text-outline" size={18} color={ac} />
          <Text style={[styles.policyLinkText, { color: ac }]}>View Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={16} color={ac} />
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          style={styles.dangerButton}
          onPress={() =>
            Alert.alert(
              'Delete Account',
              'This will permanently delete your account and all your data. This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever', style: 'destructive',
                  onPress: () => Alert.alert('Not Available', 'Please contact support to delete your account.'),
                },
              ]
            )
          }
        >
          <Ionicons name="trash-outline" size={18} color={Colors.dark.danger} />
          <Text style={styles.dangerButtonText}>Delete Account</Text>
        </Pressable>
      </BottomSheetModal>

      {/* ── About Modal ── */}
      <BottomSheetModal
        visible={showAboutModal}
        title="About"
        onClose={() => setShowAboutModal(false)}
      >
        <View style={styles.aboutContent}>
          <View style={[styles.aboutLogo, { backgroundColor: ac + '20' }]}>
            {branding.appLogoUrl ? (
              <Image source={{ uri: branding.appLogoUrl }} style={styles.aboutLogoImage} contentFit="contain" />
            ) : (
              <Ionicons name="musical-notes" size={48} color={ac} />
            )}
          </View>
          <Text style={styles.aboutAppName}>{branding.appName || 'Academic Audio Platform'}</Text>
          <Text style={styles.aboutVersion}>Version {Constants.expoConfig?.version || '1.0.0'}</Text>
          <Text style={styles.aboutDescription}>
            A modern audio streaming platform for academic institutions. Stream, create, and share playlists with your community.
          </Text>
        </View>

        <View style={styles.aboutInfoCard}>
          <View style={styles.aboutInfoRow}>
            <Text style={styles.aboutInfoLabel}>Username</Text>
            <Text style={styles.aboutInfoValue}>@{user?.username}</Text>
          </View>
          <View style={styles.aboutInfoRow}>
            <Text style={styles.aboutInfoLabel}>Role</Text>
            <Text style={styles.aboutInfoValue}>{user?.role || 'User'}</Text>
          </View>
          {user?.department && (
            <View style={styles.aboutInfoRow}>
              <Text style={styles.aboutInfoLabel}>Department</Text>
              <Text style={styles.aboutInfoValue}>{user.department}</Text>
            </View>
          )}
          {user?.classSection && (
            <View style={styles.aboutInfoRow}>
              <Text style={styles.aboutInfoLabel}>Section</Text>
              <Text style={styles.aboutInfoValue}>{user.classSection}</Text>
            </View>
          )}
          <View style={styles.aboutInfoRow}>
            <Text style={styles.aboutInfoLabel}>Platform</Text>
            <Text style={styles.aboutInfoValue}>{Platform.OS}</Text>
          </View>
          <View style={styles.aboutInfoRow}>
            <Text style={styles.aboutInfoLabel}>SDK</Text>
            <Text style={styles.aboutInfoValue}>{Constants.expoConfig?.sdkVersion || 'N/A'}</Text>
          </View>
        </View>

        {branding.contactEmail && (
          <Pressable
            style={[styles.contactButton, { backgroundColor: ac + '15', borderColor: ac + '30' }]}
            onPress={() => Linking.openURL(`mailto:${branding.contactEmail}`)}
          >
            <Ionicons name="mail-outline" size={18} color={ac} />
            <Text style={[styles.contactButtonText, { color: ac }]}>Contact Support</Text>
          </Pressable>
        )}
      </BottomSheetModal>
    </View>
  );
}

// ─── Shared row styles ────────────────────────────────────────────────────────
const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.dark.border + '60',
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: Colors.dark.text,
  },
  desc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  sectionDivider: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionDividerText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: Colors.dark.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

// ─── Modal styles ─────────────────────────────────────────────────────────────
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.dark.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: Colors.dark.border + '60',
    // No flex or maxHeight here — content drives height, ScrollView caps it
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.dark.border,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: Colors.dark.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
  },
});

// ─── Screen styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scroll: { flex: 1 },

  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: Colors.dark.text,
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    marginBottom: 24,
    borderWidth: 1,
  },
  profileAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: { flex: 1, gap: 2 },
  profileName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: Colors.dark.text,
  },
  profileUsername: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
  },
  roleText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  deptBadge: {
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deptText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },

  // Section labels
  sectionLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: Colors.dark.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 6,
    marginTop: 16,
  },

  // Menu items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  menuPressed: {
    opacity: 0.75,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuInfo: { flex: 1, gap: 2 },
  menuTitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: Colors.dark.text,
  },
  menuSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },

  // Expand panels
  expandPanel: {
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 20,
    borderRadius: 14,
    marginBottom: 8,
    overflow: 'hidden',
  },

  // Branding
  brandingRow: {
    padding: 16,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.dark.border + '50',
  },
  brandingLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  brandingInput: {
    backgroundColor: Colors.dark.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: Colors.dark.text,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  logoPicker: {
    width: 70,
    height: 70,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed',
  },
  logoImage: { width: '100%', height: '100%' },
  logoPlaceholder: { alignItems: 'center', gap: 4 },
  logoPlaceholderText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: Colors.dark.textMuted,
  },
  previewChip: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  previewChipText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#000',
  },
  brandingActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#000',
  },
  resetBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
  },
  resetBtnText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },

  // Speed chips — stacked block layout
  speedBlock: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.dark.border + '60',
  },
  speedBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  speedChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // Legacy (used in Audio modal)
  speedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
    flex: 1,
  },
  speedChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  speedChipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: Colors.dark.text,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.dark.border,
    marginHorizontal: 20,
    marginVertical: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 16,
    marginTop: 8,
    backgroundColor: Colors.dark.danger + '12',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.danger + '25',
  },
  logoutText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: Colors.dark.danger,
  },
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
  },

  // Modal inner content
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 12,
    padding: 14,
  },
  infoBoxText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 19,
  },
  systemSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 20,
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
  },
  systemSettingsBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },
  policyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginVertical: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
  },
  policyLinkText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.dark.danger + '12',
    borderWidth: 1,
    borderColor: Colors.dark.danger + '25',
  },
  dangerButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.dark.danger,
  },

  // About
  aboutContent: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  aboutLogo: {
    width: 90,
    height: 90,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  aboutLogoImage: { width: '100%', height: '100%' },
  aboutAppName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  aboutVersion: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: 12,
  },
  aboutDescription: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  aboutInfoCard: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  aboutInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.dark.border + '40',
  },
  aboutInfoLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  aboutInfoValue: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.dark.text,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 20,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  contactButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
});
