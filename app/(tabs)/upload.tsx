import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { Playlist, Track, DEFAULT_TRACKS } from '@/lib/data';
import { savePlaylist } from '@/lib/storage';
import { createPlaylist, addTrackToPlaylist, type CreatePlaylistRequest } from '@/lib/playlist-api';
import { uploadTrack } from '@/lib/track-api';
import { API_CONFIG } from '@/lib/config';
import Dropdown from '@/components/Dropdown';
import { ACADEMIC_CONFIG } from '@/lib/academic-config';
import MiniPlayer from '@/components/MiniPlayer';
import Colors from '@/constants/colors';

type SourceTab = 'upload' | 'library';
type VisibilityType = 'PUBLIC' | 'CLASS';

export default function UploadScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { branding } = useBranding();
  const { currentTrack } = usePlayer();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState<number | null>(null);
  const [classSection, setClassSection] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<VisibilityType>('PUBLIC');
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<Track[]>([]);
  const [sourceTab, setSourceTab] = useState<SourceTab>('upload');
  const [showTrackPicker, setShowTrackPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  async function pickCover() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
    }
  }

  async function pickAudioFiles() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const newTracks: Track[] = result.assets.map((asset) => {
        const fileName = asset.name || 'Unknown Track';
        const cleanName = fileName.replace(/\.[^/.]+$/, '');
        const id = 'uploaded_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);

        return {
          id,
          title: cleanName,
          artist: user?.displayName || 'Unknown Artist',
          album: name.trim() || 'My Upload',
          duration: 0,
          uri: asset.uri,
          coverUrl: coverUri || 'https://picsum.photos/seed/' + id + '/400/400',
          genre: 'Uploaded',
        };
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedTracks(prev => [...prev, ...newTracks]);
    } catch (err) {
      console.error('Error picking audio:', err);
      Alert.alert('Error', 'Could not pick audio files. Please try again.');
    }
  }

  function toggleTrack(track: Track) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTracks(prev => {
      const exists = prev.find(t => t.id === track.id);
      if (exists) return prev.filter(t => t.id !== track.id);
      return [...prev, track];
    });
  }

  function removeTrack(trackId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTracks(prev => prev.filter(t => t.id !== trackId));
  }

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Missing Info', 'Please enter a playlist name');
      return;
    }
    if (selectedTracks.length === 0) {
      Alert.alert('No Tracks', 'Please add at least one track');
      return;
    }
    if (visibility === 'CLASS' && (!department || !academicYear || !classSection)) {
      Alert.alert('Missing Info', 'Please select department, academic year, and class section for class-specific playlists');
      return;
    }
    if (!user) return;

    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // First upload tracks that need uploading
      const uploadedTrackIds: string[] = [];
      for (const track of selectedTracks) {
        if (track.id.startsWith('uploaded_') && track.uri) {
          const uploadedTrack = await uploadTrack({
            title: track.title,
            artist: track.artist,
            album: track.album,
            fileUri: track.uri,
            uploadedBy: user.id,
            isPublic: visibility === 'PUBLIC' ? 'true' : 'false',
            department: visibility === 'CLASS' ? (department || undefined) : undefined,
            academicYear: visibility === 'CLASS' ? (academicYear || undefined) : undefined,
            classSection: visibility === 'CLASS' ? (classSection || undefined) : undefined,
            playlistId: 'temp', // Will be updated after playlist creation
          });
          
          if (uploadedTrack) {
            uploadedTrackIds.push(uploadedTrack.id);
          }
        } else {
          uploadedTrackIds.push(track.id);
        }
      }

      // Create playlist with cover image (if any)
      // Create FormData for playlist creation (to handle cover image)
      const formData = new FormData();
      
      // Add all playlist data as form fields
      const playlistDataForForm = {
        name: name.trim(),
        description: description.trim(),
        subject: subject || undefined,
        department: visibility === 'CLASS' ? (department || undefined) : undefined,
        academicYear: visibility === 'CLASS' ? (academicYear || undefined) : undefined,
        classSection: visibility === 'CLASS' ? (classSection || undefined) : undefined,
        visibility,
        status: 'DRAFT', // Always create as draft first
        isPublic: visibility === 'PUBLIC' ? 'true' : 'false',
        coverUrl: coverUri || 'https://picsum.photos/seed/playlist/400/400',
        userId: user.id,
      };

      // Type-safe iteration over object keys
      (Object.keys(playlistDataForForm) as Array<keyof typeof playlistDataForForm>).forEach(key => {
        const value = playlistDataForForm[key];
        if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      // Add cover image if selected
      if (coverUri && coverUri.startsWith('file://')) {
        const coverFile = {
          uri: coverUri,
          type: 'image/jpeg',
          name: `cover_${Date.now()}.jpg`,
        };
        formData.append('coverImage', coverFile as any);
      }

      // Create playlist with FormData (handles both cover upload and playlist creation)
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('@openstream_token')}`,
          // Don't set Content-Type for FormData - let fetch set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create playlist');
      }

      const newPlaylist = await response.json();
      
      if (newPlaylist) {
        // Add selected tracks to the playlist
        if (uploadedTrackIds.length > 0) {
          for (let i = 0; i < uploadedTrackIds.length; i++) {
            const trackId = uploadedTrackIds[i];
            await addTrackToPlaylist(newPlaylist.id, {
              trackId,
              position: i
            });
          }
        }
        
        Alert.alert('Success', 'Playlist created successfully as draft!');
        // Reset form
        setName('');
        setDescription('');
        setSubject(null);
        setDepartment(null);
        setAcademicYear(null);
        setClassSection(null);
        setVisibility('PUBLIC');
        setCoverUri(null);
        setSelectedTracks([]);
        setShowTrackPicker(false);
      } else {
        Alert.alert('Error', 'Failed to create playlist. Please try again.');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      Alert.alert('Error', 'Failed to create playlist. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const uploadedCount = selectedTracks.filter(t => t.id.startsWith('uploaded_')).length;
  const libraryCount = selectedTracks.filter(t => !t.id.startsWith('uploaded_')).length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 12,
          paddingBottom: (currentTrack ? 150 : 110) + (Platform.OS === 'web' ? 34 : 0),
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Create Playlist</Text>
        <Text style={styles.headerSub} numberOfLines={2}>Upload audio or pick from the library</Text>

        <Pressable style={styles.coverPicker} onPress={pickCover}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.coverImage} contentFit="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={36} color={Colors.dark.textMuted} />
              <Text style={styles.coverText}>Add Cover</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Playlist Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter playlist name"
            placeholderTextColor={Colors.dark.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your playlist"
            placeholderTextColor={Colors.dark.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.formGroup}>
          <Dropdown
            label="Subject (Optional)"
            value={subject}
            items={ACADEMIC_CONFIG.SUBJECTS.map(item => ({ value: item, label: item }))}
            onSelect={(value) => setSubject(value as string)}
            placeholder="Select Subject"
            icon="book-outline"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Visibility</Text>
          <View style={styles.visibilityRow}>
            <Pressable
              style={[styles.visibilityOption, visibility === 'PUBLIC' && { backgroundColor: branding.accentColor }]}
              onPress={() => setVisibility('PUBLIC')}
            >
              <Ionicons 
                name="globe" 
                size={20} 
                color={visibility === 'PUBLIC' ? '#fff' : Colors.dark.textSecondary} 
              />
              <Text style={[styles.visibilityText, visibility === 'PUBLIC' && { color: '#fff' }]}>
                Public
              </Text>
            </Pressable>
            <Pressable
              style={[styles.visibilityOption, visibility === 'CLASS' && { backgroundColor: branding.accentColor }]}
              onPress={() => setVisibility('CLASS')}
            >
              <Ionicons 
                name="people" 
                size={20} 
                color={visibility === 'CLASS' ? '#fff' : Colors.dark.textSecondary} 
              />
              <Text style={[styles.visibilityText, visibility === 'CLASS' && { color: '#fff' }]}>
                Class
              </Text>
            </Pressable>
          </View>
        </View>

        {visibility === 'CLASS' && (
          <>
            <Dropdown
              label="Department"
              value={department}
              items={ACADEMIC_CONFIG.DEPARTMENTS}
              onSelect={(value) => setDepartment(value as string)}
              placeholder="Select Department"
              icon="business-outline"
            />

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Dropdown
                  label="Academic Year"
                  value={academicYear}
                  items={ACADEMIC_CONFIG.YEARS}
                  onSelect={(value) => setAcademicYear(value as number)}
                  placeholder="Select Year"
                  icon="calendar-outline"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Dropdown
                  label="Class Section"
                  value={classSection}
                  items={ACADEMIC_CONFIG.DIVISIONS}
                  onSelect={(value) => setClassSection(value as string)}
                  placeholder="Select Section"
                  icon="people-outline"
                />
              </View>
            </View>
          </>
        )}

        <View style={styles.tracksSection}>
          <Text style={styles.label}>
            Tracks ({selectedTracks.length})
            {uploadedCount > 0 && libraryCount > 0 && (
              <Text style={styles.trackCountDetail}>
                {' '}{uploadedCount} uploaded, {libraryCount} from library
              </Text>
            )}
          </Text>

          {selectedTracks.length > 0 && (
            <View style={styles.selectedList}>
              {selectedTracks.map((track) => (
                <View key={track.id} style={styles.selectedItem}>
                  <View style={[
                    styles.selectedIconBg,
                    { backgroundColor: track.id.startsWith('uploaded_') ? branding.accentColor + '20' : Colors.dark.surface }
                  ]}>
                    <Ionicons
                      name={track.id.startsWith('uploaded_') ? 'cloud-upload' : 'musical-note'}
                      size={18}
                      color={track.id.startsWith('uploaded_') ? branding.accentColor : Colors.dark.textSecondary}
                    />
                  </View>
                  <View style={styles.selectedInfo}>
                    <Text style={styles.selectedTitle} numberOfLines={1}>{track.title}</Text>
                    <Text style={styles.selectedArtist} numberOfLines={1}>
                      {track.artist}
                      {track.id.startsWith('uploaded_') ? ' (uploaded)' : ''}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeTrack(track.id)} hitSlop={8}>
                    <Ionicons name="close-circle" size={22} color={Colors.dark.danger} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <View style={styles.sourceTabBar}>
            <Pressable
              style={[styles.sourceTab, sourceTab === 'upload' && { backgroundColor: branding.accentColor }]}
              onPress={() => setSourceTab('upload')}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={16}
                color={sourceTab === 'upload' ? Colors.dark.background : Colors.dark.text}
              />
              <Text style={[
                styles.sourceTabText,
                sourceTab === 'upload' && { color: Colors.dark.background }
              ]}>
                Upload Files
              </Text>
            </Pressable>
            <Pressable
              style={[styles.sourceTab, sourceTab === 'library' && { backgroundColor: branding.accentColor }]}
              onPress={() => setSourceTab('library')}
            >
              <Ionicons
                name="musical-notes-outline"
                size={16}
                color={sourceTab === 'library' ? Colors.dark.background : Colors.dark.text}
              />
              <Text style={[
                styles.sourceTabText,
                sourceTab === 'library' && { color: Colors.dark.background }
              ]}>
                From Library
              </Text>
            </Pressable>
          </View>

          {sourceTab === 'upload' && (
            <View style={styles.uploadSection}>
              <Pressable
                style={({ pressed }) => [
                  styles.uploadArea,
                  { borderColor: branding.accentColor + '60', opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={pickAudioFiles}
              >
                <View style={[styles.uploadIconCircle, { backgroundColor: branding.accentColor + '15' }]}>
                  <Ionicons name="cloud-upload" size={32} color={branding.accentColor} />
                </View>
                <Text style={styles.uploadTitle}>Upload Audio Files</Text>
                <Text style={styles.uploadSubtext}>
                  Tap to select MP3, WAV, AAC, or other audio files from your device
                </Text>
                <View style={[styles.uploadBtn, { backgroundColor: branding.accentColor + '20' }]}>
                  <Ionicons name="add" size={18} color={branding.accentColor} />
                  <Text style={[styles.uploadBtnText, { color: branding.accentColor }]}>Choose Files</Text>
                </View>
              </Pressable>

              <View style={styles.uploadTips}>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.dark.success} />
                  <Text style={styles.tipText}>Supports multiple file selection</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.dark.success} />
                  <Text style={styles.tipText}>MP3, WAV, AAC, M4A, OGG, FLAC</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.dark.success} />
                  <Text style={styles.tipText}>Files stored locally on device</Text>
                </View>
              </View>
            </View>
          )}

          {sourceTab === 'library' && (
            <View style={styles.trackPicker}>
              <Text style={styles.pickerTitle}>Available Tracks</Text>
              {DEFAULT_TRACKS.map(track => {
                const isSelected = selectedTracks.some(t => t.id === track.id);
                return (
                  <Pressable
                    key={track.id}
                    style={({ pressed }) => [
                      styles.pickerItem,
                      isSelected && styles.pickerItemSelected,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => toggleTrack(track)}
                  >
                    <Image source={{ uri: track.coverUrl }} style={styles.pickerCover} contentFit="cover" />
                    <View style={styles.pickerInfo}>
                      <Text style={styles.pickerName} numberOfLines={1}>{track.title}</Text>
                      <Text style={styles.pickerArtist} numberOfLines={1}>{track.artist}</Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                      size={24}
                      color={isSelected ? branding.accentColor : Colors.dark.textMuted}
                    />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.createBtn,
            { backgroundColor: branding.accentColor, opacity: pressed || saving ? 0.8 : 1 },
          ]}
          onPress={handleCreate}
          disabled={saving}
        >
          <Ionicons name="checkmark-circle" size={20} color={Colors.dark.background} />
          <Text style={styles.createBtnText}>{saving ? 'Creating...' : 'Create Playlist'}</Text>
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
  },
  headerSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.dark.textSecondary,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 24,
  },
  coverPicker: {
    alignSelf: 'center',
    width: 160,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 28,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  coverText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  formGroup: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  trackCountDetail: {
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  tracksSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  selectedList: {
    gap: 8,
    marginBottom: 16,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    padding: 10,
  },
  selectedIconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedInfo: {
    flex: 1,
    gap: 1,
  },
  selectedTitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: Colors.dark.text,
  },
  selectedArtist: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  sourceTabBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  sourceTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.dark.card,
  },
  sourceTabText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: Colors.dark.text,
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.dark.card,
  },
  visibilityText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: Colors.dark.text,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  uploadSection: {
    gap: 16,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
  },
  uploadIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  uploadTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: Colors.dark.text,
  },
  uploadSubtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  uploadBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  uploadTips: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  trackPicker: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  pickerTitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  pickerItemSelected: {
    backgroundColor: Colors.dark.card,
  },
  pickerCover: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: Colors.dark.card,
  },
  pickerInfo: {
    flex: 1,
    gap: 1,
  },
  pickerName: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: Colors.dark.text,
  },
  pickerArtist: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  createBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    height: 54,
    borderRadius: 14,
    marginBottom: 20,
  },
  createBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: Colors.dark.background,
  },
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
  },
});
