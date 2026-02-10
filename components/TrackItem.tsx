import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Track, formatDuration } from '@/lib/data';
import { usePlayer } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';
import { toggleFavorite, getFavorites } from '@/lib/storage';
import Colors from '@/constants/colors';

interface TrackItemProps {
  track: Track;
  index?: number;
  playlist?: Track[];
  showFavorite?: boolean;
}

export default function TrackItem({ track, index, playlist, showFavorite = true }: TrackItemProps) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { user } = useAuth();
  const { branding } = useBranding();
  const [isFav, setIsFav] = useState(false);
  const isActive = currentTrack?.id === track.id;

  useEffect(() => {
    if (user && showFavorite) {
      getFavorites(user.id).then(favs => setIsFav(favs.includes(track.id)));
    }
  }, [user, track.id]);

  async function handlePlay() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await playTrack(track, playlist);
  }

  async function handleFavorite() {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await toggleFavorite(user.id, track.id);
    setIsFav(result);
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePlay}
    >
      {index !== undefined && (
        <Text style={[styles.index, isActive && { color: branding.accentColor }]}>
          {index + 1}
        </Text>
      )}
      <Image source={{ uri: track.coverUrl }} style={styles.cover} contentFit="cover" />
      <View style={styles.info}>
        <Text style={[styles.title, isActive && { color: branding.accentColor }]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
      </View>
      <Text style={styles.duration}>{formatDuration(track.duration)}</Text>
      {showFavorite && (
        <Pressable onPress={handleFavorite} hitSlop={8}>
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={20}
            color={isFav ? Colors.dark.coral : Colors.dark.textMuted}
          />
        </Pressable>
      )}
      {isActive && isPlaying && (
        <View style={styles.playingIndicator}>
          <Ionicons name="volume-high" size={14} color={branding.accentColor} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  index: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: Colors.dark.textMuted,
    width: 22,
    textAlign: 'center',
  },
  cover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.dark.surface,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: Colors.dark.text,
  },
  artist: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  duration: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginRight: 4,
  },
  playingIndicator: {
    marginLeft: 4,
  },
});
