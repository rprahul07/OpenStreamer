import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';
import { usePlayer } from '@/contexts/PlayerContext';
import MiniPlayer from '@/components/MiniPlayer';
import Colors from '@/constants/colors';
import { API_CONFIG } from '@/lib/config';

type ConvertStatus = 'idle' | 'picking' | 'converting' | 'done' | 'error';

export default function ConverterScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { branding } = useBranding();
  const { currentTrack } = usePlayer();

  const [playlistName, setPlaylistName] = useState('');
  const [videoFile, setVideoFile] = useState<{
    name: string;
    uri: string;
    size: number;
    mimeType?: string;
  } | null>(null);
  const [status, setStatus] = useState<ConvertStatus>('idle');
  const [resultMessage, setResultMessage] = useState('');

  async function pickVideo() {
    try {
      setStatus('picking');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        setStatus('idle');
        return;
      }

      const asset = result.assets[0];
      setVideoFile({
        name: asset.name,
        uri: asset.uri,
        size: asset.size ?? 0,
        mimeType: asset.mimeType ?? 'video/mp4',
      });
      setPlaylistName(prev => prev || asset.name.replace(/\.[^/.]+$/, ''));
      setStatus('idle');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Pick video error:', err);
      setStatus('error');
      setResultMessage('Could not pick video. Please try again.');
    }
  }

  async function handleConvert() {
    if (!videoFile) {
      Alert.alert('No video', 'Please select a video file first.');
      return;
    }
    if (!playlistName.trim()) {
      Alert.alert('Missing name', 'Please enter a playlist name.');
      return;
    }
    if (!user) {
      Alert.alert('Not logged in', 'Please log in first.');
      return;
    }

    try {
      setStatus('converting');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const token = await AsyncStorage.getItem('@openstream_token');
      const formData = new FormData();
      formData.append('playlistName', playlistName.trim());

      if (Platform.OS === 'web') {
        // On web, fetch the blob from the blob URI and append it
        const blobResponse = await fetch(videoFile.uri);
        const blob = await blobResponse.blob();
        formData.append('videoFile', blob, videoFile.name);
      } else {
        formData.append('videoFile', {
          uri: videoFile.uri,
          type: videoFile.mimeType ?? 'video/mp4',
          name: videoFile.name,
        } as any);
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/convert`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type for FormData
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Conversion failed');
      }

      setStatus('done');
      setResultMessage(
        `✅ "${data.track?.title}" published as a public playlist! You can find it in the Home feed.`
      );
      setVideoFile(null);
      setPlaylistName('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('Convert error:', err);
      setStatus('error');
      setResultMessage(err.message || 'Conversion failed. Please try again.');
    }
  }

  function reset() {
    setStatus('idle');
    setResultMessage('');
    setVideoFile(null);
    setPlaylistName('');
  }

  const fileSizeMB = videoFile ? (videoFile.size / (1024 * 1024)).toFixed(1) : null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 16,
          paddingBottom: (currentTrack ? 150 : 110) + (Platform.OS === 'web' ? 34 : 0),
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.headerTitle}>Video Converter</Text>
        <Text style={styles.headerSub}>
          Upload any video — we'll extract the audio and publish it as a public playlist instantly.
        </Text>

        {/* Step 1: Pick Video */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, { backgroundColor: branding.accentColor }]}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Select Video</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.pickArea,
              { borderColor: branding.accentColor + '60', opacity: pressed ? 0.8 : 1 },
              videoFile && styles.pickAreaFilled,
            ]}
            onPress={pickVideo}
            disabled={status === 'converting'}
          >
            {videoFile ? (
              <View style={styles.fileInfo}>
                <View style={[styles.fileIconBg, { backgroundColor: branding.accentColor + '20' }]}>
                  <Ionicons name="videocam" size={28} color={branding.accentColor} />
                </View>
                <View style={styles.fileMeta}>
                  <Text style={styles.fileName} numberOfLines={2}>{videoFile.name}</Text>
                  <Text style={styles.fileSize}>{fileSizeMB} MB</Text>
                </View>
                <Pressable onPress={() => { setVideoFile(null); setStatus('idle'); }} hitSlop={8}>
                  <Ionicons name="close-circle" size={24} color={Colors.dark.danger} />
                </Pressable>
              </View>
            ) : (
              <>
                <View style={[styles.uploadIconCircle, { backgroundColor: branding.accentColor + '15' }]}>
                  <Ionicons name="film-outline" size={36} color={branding.accentColor} />
                </View>
                <Text style={styles.pickTitle}>Tap to choose a video</Text>
                <Text style={styles.pickSub}>MP4, MOV, AVI, MKV, WebM…</Text>
                <View style={[styles.pickBtn, { backgroundColor: branding.accentColor + '20' }]}>
                  <Ionicons name="folder-open-outline" size={16} color={branding.accentColor} />
                  <Text style={[styles.pickBtnText, { color: branding.accentColor }]}>Browse Files</Text>
                </View>
              </>
            )}
          </Pressable>
        </View>

        {/* Step 2: Playlist Name */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, { backgroundColor: branding.accentColor }]}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Playlist Name</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter a name for this playlist"
            placeholderTextColor={Colors.dark.textMuted}
            value={playlistName}
            onChangeText={setPlaylistName}
            editable={status !== 'converting'}
          />
        </View>

        {/* Status / Result */}
        {(status === 'done' || status === 'error') && (
          <View style={[
            styles.resultCard,
            status === 'done' ? styles.resultSuccess : styles.resultError,
          ]}>
            <Ionicons
              name={status === 'done' ? 'checkmark-circle' : 'alert-circle'}
              size={24}
              color={status === 'done' ? Colors.dark.success : Colors.dark.danger}
            />
            <Text style={styles.resultText}>{resultMessage}</Text>
          </View>
        )}

        {/* Convert Button */}
        {status === 'converting' ? (
          <View style={[styles.convertBtn, { backgroundColor: branding.accentColor }]}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.convertBtnText}>Converting… please wait</Text>
          </View>
        ) : status === 'done' ? (
          <Pressable
            style={({ pressed }) => [styles.convertBtn, { backgroundColor: Colors.dark.card, opacity: pressed ? 0.8 : 1 }]}
            onPress={reset}
          >
            <Ionicons name="refresh" size={20} color={branding.accentColor} />
            <Text style={[styles.convertBtnText, { color: branding.accentColor }]}>Convert Another</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.convertBtn,
              { backgroundColor: branding.accentColor, opacity: (pressed || !videoFile || !playlistName.trim()) ? 0.6 : 1 },
            ]}
            onPress={handleConvert}
            disabled={!videoFile || !playlistName.trim()}
          >
            <Ionicons name="musical-notes" size={20} color="#fff" />
            <Text style={styles.convertBtnText}>Convert &amp; Publish</Text>
          </Pressable>
        )}

        {/* Info */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Ionicons name="globe-outline" size={16} color={branding.accentColor} />
            <Text style={styles.infoText}>Published as <Text style={{ color: branding.accentColor }}>Public</Text> — visible to everyone</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="flash-outline" size={16} color={branding.accentColor} />
            <Text style={styles.infoText}>No approval needed — goes live instantly</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="musical-note-outline" size={16} color={branding.accentColor} />
            <Text style={styles.infoText}>Audio extracted at 192kbps MP3</Text>
          </View>
        </View>
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
    marginBottom: 6,
  },
  headerSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 21,
    marginBottom: 28,
  },
  stepCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#fff',
  },
  stepTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: Colors.dark.text,
  },
  pickArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.dark.surface,
  },
  pickAreaFilled: {
    paddingVertical: 16,
    borderStyle: 'solid',
  },
  uploadIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  pickTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: Colors.dark.text,
  },
  pickSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  pickBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  fileIconBg: {
    width: 52,
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileMeta: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: Colors.dark.text,
  },
  fileSize: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  input: {
    backgroundColor: Colors.dark.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: Colors.dark.text,
  },
  convertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  convertBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  resultSuccess: {
    backgroundColor: Colors.dark.success + '20',
    borderWidth: 1,
    borderColor: Colors.dark.success + '40',
  },
  resultError: {
    backgroundColor: Colors.dark.danger + '20',
    borderWidth: 1,
    borderColor: Colors.dark.danger + '40',
  },
  resultText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.dark.text,
    lineHeight: 21,
  },
  infoBox: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
  },
});
