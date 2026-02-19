import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePlayer } from '@/contexts/PlayerContext';
import { useBranding } from '@/contexts/BrandingContext';
import Colors from '@/constants/colors';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

export default function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlayPause, playNext, position, duration } = usePlayer();
  const { branding } = useBranding();

  const progress = duration > 0 ? position / duration : 0;

  // BUG FIX: Stop event propagation so play/pause tap doesn't also
  // navigate to the now-playing screen via the outer Pressable.
  const handlePlayPause = useCallback((e: any) => {
    e.stopPropagation?.();
    togglePlayPause();
  }, [togglePlayPause]);

  const handleNext = useCallback((e: any) => {
    e.stopPropagation?.();
    playNext();
  }, [playNext]);

  if (!currentTrack) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(250).springify()}
      exiting={FadeOutDown.duration(200)}
      style={styles.container}
    >
      {/* Progress bar at top */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: branding.accentColor },
          ]}
        />
      </View>

      <Pressable
        style={styles.content}
        onPress={() => router.push('/now-playing')}
        android_ripple={{ color: 'rgba(255,255,255,0.05)' }}
      >
        {/* Artwork */}
        <Image
          source={{ uri: currentTrack.coverUrl }}
          style={styles.cover}
          contentFit="cover"
          recyclingKey={currentTrack.id}
        />

        {/* Track info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            onPress={handlePlayPause}
            style={styles.controlBtn}
            hitSlop={8}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={22}
              color={Colors.dark.text}
            />
          </Pressable>
          <Pressable
            onPress={handleNext}
            style={styles.controlBtn}
            hitSlop={8}
          >
            <Ionicons name="play-skip-forward" size={20} color={Colors.dark.textSecondary} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    marginHorizontal: 8,
    marginBottom: 4,
    overflow: 'hidden',
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  progressTrack: {
    height: 2,
    backgroundColor: Colors.dark.surface,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  progressFill: {
    height: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 10,
    paddingTop: 11, // extra top to clear progress bar
  },
  cover: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.dark.surface,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: Colors.dark.text,
    letterSpacing: -0.1,
  },
  artist: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
