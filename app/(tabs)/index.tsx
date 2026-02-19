import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { useBranding } from '@/contexts/BrandingContext';
import { Playlist, Track, DEFAULT_TRACKS } from '@/lib/data';
import { getRecentlyPlayed, addToRecentlyPlayed } from '@/lib/storage';
import { getPlaylists } from '@/lib/playlist-api';
import PlaylistCard from '@/components/PlaylistCard';
import TrackItem from '@/components/TrackItem';
import MiniPlayer from '@/components/MiniPlayer';
import Colors from '@/constants/colors';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { branding } = useBranding();
  const { playPlaylist, currentTrack } = usePlayer();
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [serverPlaylists, setServerPlaylists] = useState<Playlist[]>([]);

  const loadRecent = useCallback(async () => {
    if (user) {
      const recent = await getRecentlyPlayed(user.id);
      setRecentTracks(recent);

      // Load playlists from server
      const playlists = await getPlaylists();
      setServerPlaylists(playlists);
    }
  }, [user]);

  useEffect(() => {
    loadRecent();
  }, [user?.id]); // Reload when user ID changes

  async function onRefresh() {
    setRefreshing(true);
    await loadRecent();
    setRefreshing(false);
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  async function handlePlayAll() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await playPlaylist(DEFAULT_TRACKS);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 12,
          paddingBottom: (currentTrack ? 130 : 90) + (Platform.OS === 'web' ? 34 : 0),
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={branding.accentColor}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.displayName}>{user?.displayName || 'Listener'}</Text>
          </View>
          <View style={[styles.avatarCircle, { backgroundColor: branding.accentColor + '30' }]}>
            <Ionicons name="person" size={20} color={branding.accentColor} />
          </View>
        </View>

        <View style={styles.quickPlaySection}>
          {serverPlaylists.slice(0, 4).map((playlist: Playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} size="large" />
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Playlists</Text>
          </View>
          <FlatList
            horizontal
            data={serverPlaylists}
            renderItem={({ item }) => <PlaylistCard playlist={item} />}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            removeClippedSubviews
            maxToRenderPerBatch={6}
            initialNumToRender={4}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Tracks</Text>
            <Pressable
              onPress={handlePlayAll}
              style={({ pressed }) => [
                styles.playAllBtn,
                { backgroundColor: branding.accentColor, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="play" size={14} color={Colors.dark.background} />
              <Text style={styles.playAllText}>Play All</Text>
            </Pressable>
          </View>
          {DEFAULT_TRACKS.slice(0, 6).map((track, idx) => (
            <TrackItem
              key={track.id}
              track={track}
              index={idx}
              playlist={DEFAULT_TRACKS}
            />
          ))}
        </View>

        {recentTracks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recently Played</Text>
            {recentTracks.slice(0, 5).map((track, idx) => (
              <TrackItem key={track.id} track={track} playlist={recentTracks} />
            ))}
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  displayName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: Colors.dark.text,
    letterSpacing: -0.3,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickPlaySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: Colors.dark.text,
    // BUG FIX: removed paddingHorizontal/marginBottom that was doubling
    // the indent when sectionTitle sits inside sectionHeader (which already
    // has paddingHorizontal: 20).
  },
  horizontalList: {
    paddingHorizontal: 20,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  playAllText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: Colors.dark.background,
  },
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
  },
});
