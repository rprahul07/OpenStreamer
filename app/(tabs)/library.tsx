import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { useBranding } from '@/contexts/BrandingContext';
import { Playlist, Track, DEFAULT_TRACKS } from '@/lib/data';
import { getUserPlaylists, getFavorites } from '@/lib/storage';
import { getPlaylists } from '@/lib/playlist-api';
import MiniPlayer from '@/components/MiniPlayer';
import TrackItem from '@/components/TrackItem';
import Colors from '@/constants/colors';

type TabType = 'playlists' | 'favorites';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { currentTrack, playPlaylist } = usePlayer();
  const { branding } = useBranding();
  const [activeTab, setActiveTab] = useState<TabType>('playlists');
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [favTracks, setFavTracks] = useState<Track[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    // Load all playlists from server
    const serverPlaylists = await getPlaylists();

    // Filter playlists based on user role and academic information
    let filteredPlaylists = serverPlaylists.filter(playlist => {
      // Only show published playlists (not drafts)
      if (playlist.status !== 'PUBLISHED') return false;

      // Public playlists are always visible
      if (playlist.isPublic) return true;

      // Class-specific playlists
      if (playlist.visibility === 'CLASS') {
        // Only show if user matches class criteria
        return (
          user.department === playlist.department &&
          user.academicYear === playlist.academicYear &&
          user.classSection === playlist.classSection
        );
      }

      return false;
    });

    setUserPlaylists(filteredPlaylists);

    // Load favorites from local storage
    const favIds = await getFavorites(user.id);

    // Get all tracks from DEFAULT_TRACKS and server playlists
    const defaultTracks = [...DEFAULT_TRACKS];
    const serverTracks = filteredPlaylists.flatMap(playlist => playlist.tracks || []);
    const allTracks = [...defaultTracks, ...serverTracks];

    // Filter for favorites and remove duplicates
    const favs = allTracks.filter(t => favIds.includes(t.id));
    const uniqueFavs = favs.filter((track, index, self) =>
      index === self.findIndex(t => t.id === track.id)
    );
    setFavTracks(uniqueFavs);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [user?.id]); // Reload when user ID changes

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handlePlayFavorites() {
    if (favTracks.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await playPlaylist(favTracks);
  }

  function renderPlaylist({ item }: { item: Playlist }) {
    return (
      <Pressable
        style={({ pressed }) => [styles.playlistItem, pressed && { opacity: 0.7 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: '/playlist/[id]', params: { id: item.id } });
        }}
      >
        <Image source={{ uri: item.coverUrl }} style={styles.playlistCover} contentFit="cover" recyclingKey={item.id} />
        <View style={styles.playlistInfo}>
          <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.playlistMeta}>{item.tracks.length} tracks</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
      </Pressable>
    );
  }

  const allPlaylists = [...userPlaylists];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 8 }]}>
        <Text style={styles.headerTitle}>Your Library</Text>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === 'playlists' && { backgroundColor: branding.accentColor }]}
          onPress={() => setActiveTab('playlists')}
        >
          <Text style={[styles.tabText, activeTab === 'playlists' && { color: Colors.dark.background }]}>
            Playlists
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'favorites' && { backgroundColor: branding.accentColor }]}
          onPress={() => setActiveTab('favorites')}
        >
          <Ionicons
            name="heart"
            size={14}
            color={activeTab === 'favorites' ? Colors.dark.background : Colors.dark.text}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.tabText, activeTab === 'favorites' && { color: Colors.dark.background }]}>
            Favorites
          </Text>
        </Pressable>
      </View>

      {activeTab === 'playlists' ? (
        <FlatList
          data={allPlaylists}
          renderItem={renderPlaylist}
          keyExtractor={item => item.id}
          contentContainerStyle={{
            paddingBottom: (currentTrack ? 130 : 90) + (Platform.OS === 'web' ? 34 : 0),
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={branding.accentColor} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes-outline" size={48} color={Colors.dark.textMuted} />
              <Text style={styles.emptyText}>No playlists available</Text>
              <Text style={styles.emptySubtext}>Create your first playlist in the Upload tab</Text>
            </View>
          }
          removeClippedSubviews
          keyboardShouldPersistTaps="handled"
          maxToRenderPerBatch={8}
        />
      ) : (
        <View style={styles.favContainer}>
          {favTracks.length > 0 && (
            <View style={styles.favHeader}>
              <Pressable
                style={({ pressed }) => [
                  styles.playAllBtn,
                  { backgroundColor: branding.accentColor, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={handlePlayFavorites}
              >
                <Ionicons name="play" size={14} color={Colors.dark.background} />
                <Text style={styles.playAllText}>Play All</Text>
              </Pressable>
              <Text style={styles.favCount}>{favTracks.length} tracks</Text>
            </View>
          )}
          <FlatList
            data={favTracks}
            renderItem={({ item, index }) => (
              <TrackItem track={item} index={index} playlist={favTracks} showFavorite />
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={{
              paddingBottom: (currentTrack ? 130 : 90) + (Platform.OS === 'web' ? 34 : 0),
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={branding.accentColor} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="heart-outline" size={48} color={Colors.dark.textMuted} />
                <Text style={styles.emptyText}>No favorites yet</Text>
                <Text style={styles.emptySubtext}>Tap the heart icon on any track to add it here</Text>
              </View>
            }
            scrollEnabled={favTracks.length > 0}
          />
        </View>
      )}

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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: Colors.dark.text,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
    marginTop: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.card,
  },
  tabText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: Colors.dark.text,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 14,
  },
  playlistCover: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.dark.surface,
  },
  playlistInfo: {
    flex: 1,
    gap: 2,
  },
  playlistName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: Colors.dark.text,
  },
  playlistMeta: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  favContainer: {
    flex: 1,
  },
  favHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  playAllText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.dark.background,
  },
  favCount: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  emptySubtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
  },
});
