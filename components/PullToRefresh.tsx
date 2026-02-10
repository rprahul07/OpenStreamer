import React from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  ScrollViewProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useBranding } from '@/contexts/BrandingContext';
import * as Haptics from 'expo-haptics';

interface PullToRefreshProps {
  onRefresh: () => void;
  refreshing: boolean;
  children: React.ReactNode;
  scrollViewProps?: Partial<ScrollViewProps>;
  tintColor?: string;
}

export function PullToRefresh({
  onRefresh,
  refreshing,
  children,
  scrollViewProps,
  tintColor,
}: PullToRefreshProps) {
  const { branding } = useBranding();
  const pullProgress = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const iconScale = useSharedValue(1);

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    iconRotation.value = withSpring(360, { damping: 15 });
    onRefresh();
  };

  const iconAnimatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      pullProgress.value,
      [0, 1],
      [0, 180],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      pullProgress.value,
      [0, 0.8, 1],
      [1, 1.2, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { rotate: `${rotation}deg` },
        { scale },
      ],
    };
  });

  const refreshIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      pullProgress.value,
      [0, 0.5, 1],
      [0, 1, 1],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      pullProgress.value,
      [0, 1],
      [-20, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const CustomRefreshControl = () => (
    <Animated.View style={[styles.refreshIndicator, refreshIndicatorStyle]}>
      <Animated.View style={iconAnimatedStyle}>
        <Ionicons
          name="refresh"
          size={24}
          color={tintColor || branding.accentColor}
        />
      </Animated.View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={[{ key: 'refresh-spacer' }]}
        renderItem={() => (
          <View style={styles.spacer}>
            <CustomRefreshControl />
          </View>
        )}
        ListHeaderComponent={() => (
          <View style={styles.content}>
            {children}
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tintColor || branding.accentColor}
            colors={[tintColor || branding.accentColor]}
            progressViewOffset={60}
          />
        }
        {...scrollViewProps}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  spacer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIndicator: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
});
