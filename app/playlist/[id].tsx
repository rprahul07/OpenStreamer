import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { usePlayer } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';
import { Playlist, DEFAULT_PLAYLISTS, Track } from '@/lib/data';
import { getPlaylist } from '@/lib/playlist-api';
import TrackItem from '@/components/TrackItem';
import Colors from '@/constants/colors';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { branding } = useBranding();
  const { playPlaylist, isShuffled, toggleShuffle } = usePlayer();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaylist();
  }, [id, user?.id]);

  async function loadPlaylist() {
    setLoading(true);
    
    // First check if it's a default playlist
    const defaultMatch = DEFAULT_PLAYLISTS.find(p => p.id === id);
    if (defaultMatch) {
      setPlaylist(defaultMatch);
      setLoading(false);
      return;
    }
    
    // Otherwise, fetch from API
    const playlist = await getPlaylist(id as string);
    setPlaylist(playlist);
    setLoading(false);
  }

  async function handlePlayAll() {
    if (!playlist) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await playPlaylist(playlist.tracks);
  }

  async function handleShuffle() {
    if (!playlist) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const shuffled = [...playlist.tracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    await playPlaylist(shuffled);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={branding.accentColor} size="large" />
      </View>
    );
  }

  if (!playlist) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.dark.textMuted} />
        <Text style={styles.notFoundText}>Playlist not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: branding.accentColor }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isOwner = user?.id === playlist.creatorId;

  return (
    <View style={styles.container}>
      <FlatList
        data={playlist.tracks}
        renderItem={({ item, index }) => (
          <TrackItem track={item} index={index} playlist={playlist.tracks} showFavorite />
        )}
        keyExtractor={item => item.id}
        scrollEnabled={playlist.tracks.length > 0}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20,
        }}
        ListHeaderComponent={
          <View>
            <LinearGradient
              colors={[Colors.dark.surface, Colors.dark.background]}
              style={styles.headerGradient}
            >
              <View style={[styles.topBar, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 4 }]}>
                <Pressable onPress={() => router.back()} style={styles.navBtn}>
                  <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
                </Pressable>
                {isOwner && (
                  <Pressable style={styles.navBtn}>
                    <Ionicons name="create-outline" size={22} color={Colors.dark.text} />
                  </Pressable>
                )}
              </View>

              <View style={styles.playlistHeader}>
                <Image
                  source={{ uri: playlist.coverUrl || 'https://picsum.photos/seed/playlist/400/400' }}
                  style={styles.coverArt}
                  contentFit="cover"
                />
                <Text style={styles.playlistName}>{playlist.name}</Text>
                {playlist.description ? (
                  <Text style={styles.playlistDesc}>{playlist.description}</Text>
                ) : null}
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{playlist.creatorName}</Text>
                  <View style={styles.metaDot} />
                  <Text style={styles.metaText}>{playlist.tracks.length} tracks</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.shuffleBtn,
                    { borderColor: branding.accentColor, opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={handleShuffle}
                >
                  <Ionicons name="shuffle" size={18} color={branding.accentColor} />
                  <Text style={[styles.shuffleBtnText, { color: branding.accentColor }]}>Shuffle</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.playAllActionBtn,
                    { backgroundColor: branding.accentColor, opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={handlePlayAll}
                >
                  <Ionicons name="play" size={20} color={Colors.dark.background} />
                  <Text style={styles.playAllActionText}>Play All</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyTracks}>
            <Ionicons name="musical-notes-outline" size={40} color={Colors.dark.textMuted} />
            <Text style={styles.emptyTracksText}>No tracks in this playlist</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  notFoundText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: Colors.dark.textMuted,
  },
  backLink: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    marginTop: 8,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  navBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  coverArt: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: Colors.dark.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 6,
  },
  playlistName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: Colors.dark.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  playlistDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.dark.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 20,
    marginTop: 18,
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  shuffleBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  playAllActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  playAllActionText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.dark.background,
  },
  emptyTracks: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 10,
  },
  emptyTracksText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
});
