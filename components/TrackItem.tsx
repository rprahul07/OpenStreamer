import React, { useState, useEffect, memo, useCallback } from 'react';
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

const TrackItem = memo(function TrackItem({ track, index, playlist, showFavorite = true }: TrackItemProps) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { user } = useAuth();
  const { branding } = useBranding();
  const [isFav, setIsFav] = useState(false);
  const isActive = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isActive && isPlaying;

  useEffect(() => {
    if (user && showFavorite) {
      getFavorites(user.id).then(favs => setIsFav(favs.includes(track.id)));
    }
  }, [user?.id, track.id, showFavorite]);

  const handlePlay = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playTrack(track, playlist);
  }, [track, playlist, playTrack]);

  const handleFavorite = useCallback(() => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(user.id, track.id).then(result => setIsFav(result));
  }, [user?.id, track.id]);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed, isActive && styles.activeRow]}
      onPress={handlePlay}
      android_ripple={{ color: 'rgba(255,255,255,0.05)' }}
    >
      {index !== undefined && (
        <Text style={[styles.index, isActive && { color: branding.accentColor }]}>
          {isCurrentlyPlaying ? (
            <Ionicons name="volume-high" size={13} color={branding.accentColor} />
          ) : (
            index + 1
          )}
        </Text>
      )}

      <Image
        source={{ uri: track.coverUrl }}
        style={styles.cover}
        contentFit="cover"
        recyclingKey={track.id}
      />

      <View style={styles.info}>
        <Text
          style={[styles.title, isActive && { color: branding.accentColor }]}
          numberOfLines={1}
        >
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
      </View>

      <Text style={styles.duration}>{formatDuration(track.duration)}</Text>

      {/* BUG FIX: heart icon is always shown (not hidden when playing) — 
          the old code rendered BOTH icon and playingIndicator independently,
          causing layout overlap. Now the playing indicator replaces the index,
          not the heart, so both can coexist cleanly. */}
      {showFavorite && (
        <Pressable onPress={handleFavorite} hitSlop={10} style={styles.heartBtn}>
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={20}
            color={isFav ? Colors.dark.coral : Colors.dark.textMuted}
          />
        </Pressable>
      )}
    </Pressable>
  );
});

export default TrackItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  activeRow: {
    backgroundColor: 'rgba(139, 92, 246, 0.06)',
  },
  pressed: {
    opacity: 0.75,
  },
  index: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
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
  },
  heartBtn: {
    padding: 4,
  },
});
