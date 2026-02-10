import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  GestureHandlerGestureEvent,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useBranding } from '@/contexts/BrandingContext';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  fileUrl: string;
  coverUrl?: string;
  duration: string;
  playCount?: string;
  isPublic: boolean;
}

interface SwipeableTrackCardProps {
  track: Track;
  onPlay: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
  onShare: (track: Track) => void;
  onDelete?: (track: Track) => void;
  showDeleteAction?: boolean;
}

export function SwipeableTrackCard({
  track,
  onPlay,
  onAddToPlaylist,
  onShare,
  onDelete,
  showDeleteAction = false,
}: SwipeableTrackCardProps) {
  const { branding } = useBranding();
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const gestureRef = useRef<PanGestureHandler>(null);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      
      // Add subtle scale effect while swiping
      scale.value = interpolate(
        Math.abs(event.translationX),
        [0, 100],
        [1, 0.95],
        Extrapolate.CLAMP
      );
    },
    onEnd: (event) => {
      const shouldDismissLeft = event.translationX < -100;
      const shouldDismissRight = event.translationX > 100;

      if (shouldDismissLeft) {
        translateX.value = withTiming(-200, { duration: 200 }, () => {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
          runOnJS(onAddToPlaylist)(track);
        });
      } else if (shouldDismissRight && showDeleteAction && onDelete) {
        translateX.value = withTiming(200, { duration: 200 }, () => {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
          runOnJS(onDelete)(track);
        });
      } else {
        // Snap back
        translateX.value = withSpring(0);
        scale.value = withSpring(1);
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value },
      ],
    };
  });

  const leftActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-200, -100, 0],
      [1, 0.8, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [
        {
          translateX: interpolate(
            translateX.value,
            [-200, 0],
            [0, -100],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const rightActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, 100, 200],
      [0, 0.8, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [
        {
          translateX: interpolate(
            translateX.value,
            [0, 200],
            [100, 0],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPlay(track);
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShare(track);
  };

  return (
    <View style={styles.container}>
      {/* Left Action - Add to Playlist */}
      <Animated.View style={[styles.actionLeft, leftActionStyle]}>
        <BlurView intensity={20} style={styles.actionBlur}>
          <View style={styles.actionContent}>
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.actionText}>Add to Playlist</Text>
          </View>
        </BlurView>
      </Animated.View>

      {/* Right Action - Delete (if enabled) */}
      {showDeleteAction && onDelete && (
        <Animated.View style={[styles.actionRight, rightActionStyle]}>
          <BlurView intensity={20} style={[styles.actionBlur, styles.deleteAction]}>
            <View style={styles.actionContent}>
              <Ionicons name="trash" size={24} color="#fff" />
              <Text style={styles.actionText}>Delete</Text>
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* Main Card */}
      <PanGestureHandler
        ref={gestureRef}
        onGestureEvent={gestureHandler}
      >
        <Animated.View style={[styles.card, cardStyle]}>
          <TouchableOpacity
            style={styles.cardContent}
            onPress={handlePlay}
            activeOpacity={0.9}
          >
            {/* Album Art */}
            <View style={styles.artworkContainer}>
              {track.coverUrl ? (
                <Image source={{ uri: track.coverUrl }} style={styles.artwork} />
              ) : (
                <LinearGradient
                  colors={[branding.accentColor, branding.accentColor + '80']}
                  style={styles.artworkPlaceholder}
                >
                  <Ionicons name="musical-notes" size={32} color="#fff" />
                </LinearGradient>
              )}
              
              {/* Play Count Badge */}
              {track.playCount && parseInt(track.playCount) > 0 && (
                <View style={styles.playCountBadge}>
                  <Ionicons name="play" size={8} color="#fff" />
                  <Text style={styles.playCountText}>
                    {parseInt(track.playCount) > 1000 
                      ? `${(parseInt(track.playCount) / 1000).toFixed(1)}k`
                      : track.playCount
                    }
                  </Text>
                </View>
              )}
            </View>

            {/* Track Info */}
            <View style={styles.trackInfo}>
              <Text style={styles.title} numberOfLines={1}>
                {track.title}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {track.artist}
              </Text>
              {track.album && (
                <Text style={styles.album} numberOfLines={1}>
                  {track.album}
                </Text>
              )}
              <View style={styles.metaInfo}>
                <Text style={styles.duration}>{track.duration}</Text>
                {track.isPublic && (
                  <View style={styles.publicBadge}>
                    <Ionicons name="globe" size={10} color={branding.accentColor} />
                    <Text style={styles.publicText}>Public</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handlePlay}
              >
                <Ionicons name="play-circle" size={32} color={branding.accentColor} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
              >
                <Ionicons name="share-social" size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    marginBottom: 12,
    position: 'relative',
  },
  card: {
    height: '100%',
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  artworkContainer: {
    width: 56,
    height: 56,
    marginRight: 12,
    position: 'relative',
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  artworkPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCountBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  playCountText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: 'Poppins_500Medium',
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  artist: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: Colors.dark.textSecondary,
    marginBottom: 2,
  },
  album: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.dark.textMuted,
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  duration: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.dark.textMuted,
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
  },
  publicText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: '#4A90E2',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  actionLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 16,
    zIndex: -1,
  },
  actionRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
    zIndex: -1,
  },
  actionBlur: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  deleteAction: {
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
  },
  actionContent: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },
});
