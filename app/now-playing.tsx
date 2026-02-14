import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import { usePlayer } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';
import { formatDurationMs } from '@/lib/data';
import { addToRecentlyPlayed } from '@/lib/storage';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ARTWORK_SIZE = SCREEN_WIDTH - 80;

export default function NowPlayingScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { branding } = useBranding();
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    isShuffled,
    repeatMode,
    isLoading,
    togglePlayPause,
    seekTo,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
  } = usePlayer();

  const scale = useSharedValue(1);

  useEffect(() => {
    if (isPlaying) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1, { duration: 300 });
    }
  }, [isPlaying]);

  useEffect(() => {
    if (currentTrack && user) {
      addToRecentlyPlayed(user.id, currentTrack);
    }
  }, [currentTrack?.id]);

  const artworkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!currentTrack) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="chevron-down" size={28} color={Colors.dark.text} />
        </Pressable>
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes-outline" size={64} color={Colors.dark.textMuted} />
          <Text style={styles.emptyText}>No track playing</Text>
        </View>
      </View>
    );
  }

  const progress = duration > 0 ? position / duration : 0;

  function handleSeek(evt: any) {
    const x = evt.nativeEvent.locationX;
    const barWidth = SCREEN_WIDTH - 80;
    const pct = Math.max(0, Math.min(1, x / barWidth));
    seekTo(pct * duration);
  }

  return (
    <LinearGradient
      colors={[Colors.dark.surface, Colors.dark.background, '#050810']}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 4 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="chevron-down" size={28} color={Colors.dark.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>NOW PLAYING</Text>
          <Text style={styles.headerAlbum} numberOfLines={1}>{currentTrack.album}</Text>
        </View>
        <Pressable style={styles.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color={Colors.dark.text} />
        </Pressable>
      </View>

      <View style={styles.artworkContainer}>
        <Animated.View style={[styles.artworkWrapper, artworkStyle]}>
          {currentTrack.coverUrl ? (
            <>
              <Image
                source={{ uri: currentTrack.coverUrl }}
                style={[styles.artwork, { width: ARTWORK_SIZE, height: ARTWORK_SIZE }]}
                contentFit="cover"
                onError={(error) => console.log('Cover image error:', error)}
                onLoad={() => console.log('Cover image loaded for:', currentTrack.title)}
              />
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={branding?.accentColor || '#007AFF'} />
              </View>
            </>
          ) : (
            <View style={[styles.artwork, { width: ARTWORK_SIZE, height: ARTWORK_SIZE, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="musical-notes-outline" size={32} color={Colors.dark.textMuted} />
            </View>
          )}
        </Animated.View>
      </View>

      <View style={styles.trackInfo}>
        <View style={styles.trackText}>
          <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <Pressable style={styles.progressBar} onPress={handleSeek}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%`, backgroundColor: branding?.accentColor || '#007AFF' },
              ]}
            />
            <View
              style={[
                styles.progressThumb,
                {
                  left: `${progress * 100}%`,
                  backgroundColor: branding?.accentColor || '#007AFF',
                },
              ]}
            />
          </View>
        </Pressable>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatDurationMs(position)}</Text>
          <Text style={styles.timeText}>{formatDurationMs(duration)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleShuffle(); }}
          style={styles.controlBtn}
        >
          <Ionicons
            name="shuffle"
            size={22}
            color={isShuffled ? branding?.accentColor || '#007AFF' : Colors.dark.textSecondary}
          />
        </Pressable>

        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); playPrevious(); }}
          style={styles.controlBtn}
        >
          <Ionicons name="play-skip-back" size={28} color={Colors.dark.text} />
        </Pressable>

        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); togglePlayPause(); }}
          style={[styles.playBtn, { backgroundColor: branding?.accentColor || '#007AFF' }]}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={32}
            color={Colors.dark.background}
            style={isPlaying ? {} : { marginLeft: 3 }}
          />
        </Pressable>

        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); playNext(); }}
          style={styles.controlBtn}
        >
          <Ionicons name="play-skip-forward" size={28} color={Colors.dark.text} />
        </Pressable>

        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleRepeat(); }}
          style={styles.controlBtn}
        >
          <Ionicons
            name={repeatMode === 'one' ? 'repeat' : 'repeat'}
            size={22}
            color={repeatMode !== 'off' ? branding?.accentColor || '#007AFF' : Colors.dark.textSecondary}
          />
          {repeatMode === 'one' && (
            <View style={[styles.repeatOneBadge, { backgroundColor: branding?.accentColor || '#007AFF' }]}>
              <Text style={styles.repeatOneText}>1</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 16 }]}>
        <Pressable style={styles.bottomAction}>
          <Ionicons name="share-outline" size={20} color={Colors.dark.textSecondary} />
        </Pressable>
        <Pressable style={styles.bottomAction}>
          <Ionicons name="list" size={20} color={Colors.dark.textSecondary} />
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: Colors.dark.textMuted,
    letterSpacing: 1.5,
  },
  headerAlbum: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  moreBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  artworkWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  artwork: {
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
  },
  trackInfo: {
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  trackText: {
    gap: 4,
  },
  trackTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: Colors.dark.text,
    letterSpacing: -0.3,
  },
  trackArtist: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  progressSection: {
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  progressBar: {
    paddingVertical: 10,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.dark.card,
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 30,
    marginBottom: 16,
  },
  controlBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatOneBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatOneText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 8,
    color: Colors.dark.background,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 60,
  },
  bottomAction: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: Colors.dark.textMuted,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
