import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { branding, updateBranding, resetBranding, isLoading: brandingLoading } = useBranding();
  const { preferences, updatePreferences } = useUserPreferences();
  const { currentTrack } = usePlayer();
  
  // Initialize state with current branding values
  const [appName, setAppName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4F46E5');
  const [accentColor, setAccentColor] = useState('#F59E0B');
  
  const [showBranding, setShowBranding] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Update state when branding changes from context
  useEffect(() => {
    console.log('Branding from context:', branding);
    if (branding.appName) setAppName(branding.appName);
    if (branding.primaryColor) setPrimaryColor(branding.primaryColor);
    if (branding.accentColor) setAccentColor(branding.accentColor);
  }, [branding]);

  async function handleLogout() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
    router.replace('/(auth)/login');
  }

  async function handleSaveBranding() {
    console.log('Saving branding with state values:', {
      appName,
      primaryColor,
      accentColor
    });
    
    // Only save if we have actual values (not all undefined)
    if (!appName && !primaryColor && !accentColor) {
      console.log('Skipping save - no branding values to save');
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateBranding({
      appName: appName.trim() || 'Academic Audio Platform',
      primaryColor,
      accentColor,
    });
    Alert.alert('Saved', 'Your branding has been updated successfully');
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
        console.log('Selected asset:', result.assets[0]);
        
        const formData = new FormData();
        formData.append('file', {
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType || 'image/jpeg',
          name: result.assets[0].fileName || 'logo.jpg',
        } as any);
        
        console.log('FormData created, uploading...');
        const response = await apiClient.upload(`/api/settings/user/branding/upload/${type}`, formData);
        
        console.log('Upload response:', response);
        
        if (response.success && response.data?.url) {
          const urlField = type === 'logo' ? 'appLogoUrl' : 'appIconUrl';
          await updateBranding({ [urlField]: response.data.url });
          
          console.log('Logo uploaded, URL:', response.data.url);
          Alert.alert('Success', `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
        } else {
          throw new Error(response.error || 'Upload failed');
        }
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      Alert.alert('Error', 'Failed to upload logo. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleResetBranding() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await resetBranding();
    setAppName('Academic Audio Platform');
    setPrimaryColor('#4F46E5');
    setAccentColor('#F59E0B');
  }

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

        <View style={styles.profileCard}>
          <View style={[styles.profileAvatar, { backgroundColor: branding.accentColor + '30' }]}>
            <Ionicons name="person" size={28} color={branding.accentColor} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName}</Text>
            <Text style={styles.profileUsername}>@{user?.username}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role || 'Creator'}</Text>
            </View>
          </View>
        </View>

        {/* White Label Branding */}
        <Pressable
          style={styles.menuItem}
          onPress={() => setShowBranding(!showBranding)}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#6C63FF20' }]}>
            <Ionicons name="color-palette" size={20} color="#6C63FF" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>White Label Branding</Text>
            <Text style={styles.menuSub}>Customize app appearance</Text>
          </View>
          <Ionicons name={showBranding ? 'chevron-up' : 'chevron-forward'} size={18} color={Colors.dark.textMuted} />
        </Pressable>

        {showBranding && (
          <View style={styles.brandingPanel}>
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
                {PRIMARY_COLORS.map((color, index) => (
                  <Pressable
                    key={`primary-${color}-${index}`}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      primaryColor === color && styles.colorSwatchActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPrimaryColor(color);
                    }}
                  >
                    {primaryColor === color && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.brandingRow}>
              <Text style={styles.brandingLabel}>Accent Color</Text>
              <View style={styles.colorGrid}>
                {ACCENT_COLORS.map((color, index) => (
                  <Pressable
                    key={`accent-${color}-${index}`}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      accentColor === color && styles.colorSwatchActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setAccentColor(color);
                    }}
                  >
                    {accentColor === color && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.brandingRow}>
              <Text style={styles.brandingLabel}>App Logo</Text>
              <Pressable style={styles.logoPicker} onPress={() => handlePickLogo('logo')}>
                {branding.appLogoUrl ? (
                  <Image source={{ uri: branding.appLogoUrl }} style={styles.logoImage} contentFit="cover" />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Ionicons name="image-outline" size={24} color={Colors.dark.textMuted} />
                  </View>
                )}
              </Pressable>
            </View>

            <View style={styles.brandingActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.brandingSaveBtn,
                  { backgroundColor: accentColor, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={handleSaveBranding}
              >
                <Text style={styles.brandingSaveBtnText}>Save Changes</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.brandingResetBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={handleResetBranding}
              >
                <Text style={styles.brandingResetText}>Reset to Default</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* User Preferences */}
        <Pressable
          style={styles.menuItem}
          onPress={() => setShowPreferences(!showPreferences)}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#FFB34720' }]}>
            <Ionicons name="settings-outline" size={20} color="#FFB347" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>User Preferences</Text>
            <Text style={styles.menuSub}>Audio, notifications, and more</Text>
          </View>
          <Ionicons name={showPreferences ? 'chevron-up' : 'chevron-forward'} size={18} color={Colors.dark.textMuted} />
        </Pressable>

        {showPreferences && (
          <View style={styles.preferencesPanel}>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>High Quality Audio</Text>
              <Switch
                value={preferences.highQualityAudio}
                onValueChange={(value) => updatePreferences({ highQualityAudio: value })}
                trackColor={{ false: Colors.dark.border, true: branding.accentColor }}
              />
            </View>

            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Auto Play</Text>
              <Switch
                value={preferences.autoPlay}
                onValueChange={(value) => updatePreferences({ autoPlay: value })}
                trackColor={{ false: Colors.dark.border, true: branding.accentColor }}
              />
            </View>

            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Show Lyrics</Text>
              <Switch
                value={preferences.showLyrics}
                onValueChange={(value) => updatePreferences({ showLyrics: value })}
                trackColor={{ false: Colors.dark.border, true: branding.accentColor }}
              />
            </View>

            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Push Notifications</Text>
              <Switch
                value={preferences.pushNotifications}
                onValueChange={(value) => updatePreferences({ pushNotifications: value })}
                trackColor={{ false: Colors.dark.border, true: branding.accentColor }}
              />
            </View>

            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Download over WiFi only</Text>
              <Switch
                value={preferences.downloadOverWifiOnly}
                onValueChange={(value) => updatePreferences({ downloadOverWifiOnly: value })}
                trackColor={{ false: Colors.dark.border, true: branding.accentColor }}
              />
            </View>
          </View>
        )}

        <View style={styles.divider} />

        <Pressable style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: '#FFB34720' }]}>
            <Ionicons name="notifications-outline" size={20} color="#FFB347" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Notifications</Text>
            <Text style={styles.menuSub}>Manage notification preferences</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
        </Pressable>

        <Pressable style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: '#4ECDC420' }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#4ECDC4" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Privacy & Security</Text>
            <Text style={styles.menuSub}>Control your data and security</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
        </Pressable>

        <Pressable style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: '#00E5CC20' }]}>
            <Ionicons name="information-circle-outline" size={20} color="#00E5CC" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>About</Text>
            <Text style={styles.menuSub}>Version 1.0.0</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scroll: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: Colors.dark.text,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    gap: 16,
    marginBottom: 24,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: Colors.dark.text,
  },
  profileUsername: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  roleBadge: {
    backgroundColor: Colors.dark.surface,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  roleText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: Colors.dark.textSecondary,
    textTransform: 'capitalize',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuInfo: {
    flex: 1,
    gap: 2,
  },
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
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginHorizontal: 20,
    marginVertical: 8,
  },
  brandingPanel: {
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 18,
    gap: 18,
    marginBottom: 8,
  },
  brandingRow: {
    gap: 8,
  },
  brandingLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: Colors.dark.textSecondary,
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
  },
  logoPicker: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  brandingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  brandingSaveBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandingSaveBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.dark.background,
  },
  brandingResetBtn: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
  },
  brandingResetText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: Colors.dark.danger,
  },
  preferencesPanel: {
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 18,
    gap: 16,
    marginBottom: 8,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: Colors.dark.text,
    flex: 1,
  },
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
  },
});
