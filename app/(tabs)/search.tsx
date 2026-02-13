import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Playlist, DEFAULT_PLAYLISTS, DEFAULT_TRACKS, Track } from '@/lib/data';
import { searchPlaylists } from '@/lib/storage';
import { usePlayer } from '@/contexts/PlayerContext';
import { useBranding } from '@/contexts/BrandingContext';
import MiniPlayer from '@/components/MiniPlayer';
import Colors from '@/constants/colors';
import { Image } from 'expo-image';

const GENRES = ['All', 'Ambient', 'Electronic', 'Lo-Fi', 'Rock', 'Jazz', 'Classical', 'Hip Hop'];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { currentTrack, playTrack } = usePlayer();
  const { branding } = useBranding();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Playlist[]>([]);
  const [trackResults, setTrackResults] = useState<Track[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      setTrackResults([]);
      setHasSearched(false);
      return;
    }
    setSearching(true);
    setHasSearched(true);
    const playlists = await searchPlaylists(text.trim());
    setResults(playlists);
    const q = text.toLowerCase();
    const tracks = DEFAULT_TRACKS.filter(
      t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );
    setTrackResults(tracks);
    setSearching(false);
  }, []);

  const filteredTracks = selectedGenre === 'All'
    ? DEFAULT_TRACKS
    : DEFAULT_TRACKS.filter(t => t.genre === selectedGenre);

  function renderPlaylistResult({ item }: { item: Playlist }) {
    return (
      <Pressable
        style={({ pressed }) => [styles.resultItem, pressed && { opacity: 0.7 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: '/playlist/[id]', params: { id: item.id } });
        }}
      >
        <Image source={{ uri: item.coverUrl }} style={styles.resultCover} contentFit="cover" />
        <View style={styles.resultInfo}>
          <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.resultMeta} numberOfLines={1}>
            {item.tracks.length} tracks  {item.creatorName}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
      </Pressable>
    );
  }

  function renderTrackResult({ item }: { item: Track }) {
    return (
      <Pressable
        style={({ pressed }) => [styles.resultItem, pressed && { opacity: 0.7 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          playTrack(item, DEFAULT_TRACKS);
        }}
      >
        <Image source={{ uri: item.coverUrl }} style={styles.resultCover} contentFit="cover" />
        <View style={styles.resultInfo}>
          <Text style={styles.resultName} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.resultMeta} numberOfLines={1}>{item.artist}</Text>
        </View>
        <Ionicons name="play-circle-outline" size={24} color={Colors.dark.textSecondary} />
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.searchHeader, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 8 }]}>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.dark.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search playlists, tracks, artists..."
            placeholderTextColor={Colors.dark.textMuted}
            value={query}
            onChangeText={handleSearch}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.dark.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {hasSearched ? (
        <FlatList
          data={[...results.map(r => ({ type: 'playlist' as const, item: r })), ...trackResults.map(t => ({ type: 'track' as const, item: t }))]}
          renderItem={({ item: wrapper }) =>
            wrapper.type === 'playlist'
              ? renderPlaylistResult({ item: wrapper.item as Playlist })
              : renderTrackResult({ item: wrapper.item as Track })
          }
          keyExtractor={(item, idx) => `${item.type}_${idx}`}
          contentContainerStyle={{
            paddingBottom: (currentTrack ? 130 : 90) + (Platform.OS === 'web' ? 34 : 0),
          }}
          ListEmptyComponent={
            searching ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color={branding.accentColor} />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={Colors.dark.textMuted} />
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            )
          }
          scrollEnabled={results.length > 0 || trackResults.length > 0}
        />
      ) : (
        <FlatList
          data={filteredTracks}
          renderItem={renderTrackResult}
          keyExtractor={item => item.id}
          contentContainerStyle={{
            paddingBottom: (currentTrack ? 130 : 90) + (Platform.OS === 'web' ? 34 : 0),
          }}
          ListHeaderComponent={
            <View>
              <FlatList
                horizontal
                data={GENRES}
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.genreChip,
                      selectedGenre === item && { backgroundColor: branding.accentColor },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedGenre(item);
                    }}
                  >
                    <Text
                      style={[
                        styles.genreText,
                        selectedGenre === item && { color: Colors.dark.background },
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                )}
                keyExtractor={item => item}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.genreList}
              />
              <Text style={styles.browseTitle}>Browse Tracks</Text>
            </View>
          }
          scrollEnabled={filteredTracks.length > 0}
        />
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
  searchHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: Colors.dark.text,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: Colors.dark.text,
    height: '100%',
  },
  genreList: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  genreChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.card,
    marginRight: 8,
  },
  genreText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: Colors.dark.text,
  },
  browseTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: Colors.dark.text,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  resultCover: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: Colors.dark.surface,
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: Colors.dark.text,
  },
  resultMeta: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.dark.textMuted,
    textAlign: 'center',
  },
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
  },
});
