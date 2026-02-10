import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePlayer } from '@/contexts/PlayerContext';
import { useBranding } from '@/contexts/BrandingContext';
import Colors from '@/constants/colors';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlayPause, position, duration } = usePlayer();
  const { branding } = useBranding();

  if (!currentTrack) return null;

  const progress = duration > 0 ? position / duration : 0;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <View style={[styles.progressBar, { width: `${progress * 100}%`, backgroundColor: branding.accentColor }]} />
      <Pressable style={styles.content} onPress={() => router.push('/now-playing')}>
        <Image source={{ uri: currentTrack.coverUrl }} style={styles.cover} contentFit="cover" />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>
        <Pressable onPress={togglePlayPause} style={styles.playBtn}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={Colors.dark.text} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: 2,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
  },
  cover: {
    width: 42,
    height: 42,
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
  },
  artist: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  playBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
