import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Playlist } from '@/lib/data';
import Colors from '@/constants/colors';

interface PlaylistCardProps {
  playlist: Playlist;
  size?: 'small' | 'large';
}

export default function PlaylistCard({ playlist, size = 'small' }: PlaylistCardProps) {
  const isLarge = size === 'large';

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/playlist/[id]', params: { id: playlist.id } });
  }

  return (
    <Pressable
      style={({ pressed }) => [
        isLarge ? styles.largeContainer : styles.container,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
    >
      <Image
        source={{ uri: playlist.coverUrl }}
        style={isLarge ? styles.largeCover : styles.cover}
        contentFit="cover"
      />
      <View style={isLarge ? styles.largeInfo : styles.info}>
        <Text style={isLarge ? styles.largeName : styles.name} numberOfLines={1}>
          {playlist.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {playlist.tracks?.length || 0} tracks
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 150,
    marginRight: 14,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  cover: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    marginBottom: 8,
  },
  info: {
    gap: 2,
  },
  name: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.dark.text,
  },
  meta: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  largeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    height: 64,
  },
  largeCover: {
    width: 64,
    height: 64,
    backgroundColor: Colors.dark.surface,
  },
  largeInfo: {
    flex: 1,
    paddingHorizontal: 14,
    gap: 2,
  },
  largeName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.dark.text,
  },
});
