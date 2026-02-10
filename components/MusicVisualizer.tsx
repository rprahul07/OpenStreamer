import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useBranding } from '@/contexts/BrandingContext';

const { width, height } = Dimensions.get('window');

interface MusicVisualizerProps {
  isPlaying?: boolean;
  type?: 'bars' | 'wave' | 'circular' | 'dots';
  color?: string;
  barCount?: number;
  sensitivity?: number;
}

export function MusicVisualizer({
  isPlaying = false,
  type = 'bars',
  color,
  barCount = 20,
  sensitivity = 1,
}: MusicVisualizerProps) {
  const { branding } = useBranding();
  const visualizerColor = color || branding.accentColor;
  
  // Create animation values for each bar/dot
  const animationValues = useRef(
    Array.from({ length: barCount }, () => useSharedValue(0))
  ).current;

  useEffect(() => {
    if (isPlaying) {
      // Start animations for all bars
      animationValues.forEach((value, index) => {
        value.value = withRepeat(
          withTiming(Math.random() * sensitivity, { duration: 500 + Math.random() * 1000 }),
          -1,
          true
        );
      });
    } else {
      // Stop animations and reset to 0
      animationValues.forEach((value) => {
        cancelAnimation(value);
        value.value = withTiming(0, { duration: 300 });
      });
    }

    return () => {
      // Cleanup animations
      animationValues.forEach((value) => {
        cancelAnimation(value);
      });
    };
  }, [isPlaying, sensitivity]);

  const renderBars = () => {
    const barWidth = (width - 40) / barCount;
    
    return (
      <View style={styles.barsContainer}>
        {animationValues.map((value, index) => {
          const animatedStyle = useAnimatedStyle(() => {
            const height = interpolate(
              value.value,
              [0, 1],
              [20, 150 * sensitivity],
              Extrapolate.CLAMP
            );

            return {
              height,
              transform: [{ scaleY: value.value }],
            };
          });

          return (
            <Animated.View
              key={index}
                style={[
                  styles.bar,
                  animatedStyle,
                  {
                    width: barWidth - 2,
                    marginLeft: index === 0 ? 0 : 2,
                  },
                ]}
            >
              <LinearGradient
                colors={[visualizerColor, visualizerColor + '80', visualizerColor + '40']}
                style={styles.barGradient}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
              />
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const renderWave = () => {
    return (
      <View style={styles.waveContainer}>
        {animationValues.map((value, index) => {
          const animatedStyle = useAnimatedStyle(() => {
            const scale = interpolate(
              value.value,
              [0, 1],
              [0.5, 2 * sensitivity],
              Extrapolate.CLAMP
            );

            const opacity = interpolate(
              value.value,
              [0, 1],
              [0.3, 1],
              Extrapolate.CLAMP
            );

            return {
              transform: [{ scale }],
              opacity,
            };
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.waveDot,
                animatedStyle,
                {
                  left: (width / barCount) * index,
                },
              ]}
            >
              <View
                style={[
                  styles.waveDotInner,
                  { backgroundColor: visualizerColor + '60' },
                ]}
              />
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const renderCircular = () => {
    const radius = Math.min(width, height) * 0.3;
    const centerX = width / 2;
    const centerY = height / 2;

    return (
      <View style={styles.circularContainer}>
        {animationValues.map((value, index) => {
          const angle = (360 / barCount) * index;
          const radian = (angle * Math.PI) / 180;

          const animatedStyle = useAnimatedStyle(() => {
            const barHeight = interpolate(
              value.value,
              [0, 1],
              [20, 80 * sensitivity],
              Extrapolate.CLAMP
            );

            return {
              height: barHeight,
              transform: [
                {
                  translateY: -barHeight / 2,
                },
              ],
            };
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.circularBar,
                animatedStyle,
                {
                  position: 'absolute',
                  left: centerX + Math.cos(radian) * radius - 2,
                  top: centerY + Math.sin(radian) * radius,
                  transform: [
                    {
                      rotate: `${angle + 90}deg`,
                    },
                    {
                      translateY: interpolate(
                        value.value,
                        [0, 1],
                        [0, -40 * sensitivity],
                        Extrapolate.CLAMP
                      ),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[visualizerColor, visualizerColor + '40']}
                style={styles.circularBarGradient}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
              />
            </Animated.View>
          );
        })}
        <View style={[styles.centerDot, { backgroundColor: visualizerColor }]} />
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {animationValues.map((value, index) => {
          const animatedStyle = useAnimatedStyle(() => {
            const scale = interpolate(
              value.value,
              [0, 1],
              [0.5, 1.5 * sensitivity],
              Extrapolate.CLAMP
            );

            const opacity = interpolate(
              value.value,
              [0, 1],
              [0.4, 1],
              Extrapolate.CLAMP
            );

            return {
              transform: [{ scale }],
              opacity,
            };
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                animatedStyle,
                {
                  marginLeft: index % 5 === 0 ? 0 : 15,
                  marginTop: index < 5 ? 0 : 15,
                },
              ]}
            >
              <LinearGradient
                colors={[visualizerColor, visualizerColor + '60']}
                style={styles.dotGradient}
              />
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const renderVisualizer = () => {
    switch (type) {
      case 'wave':
        return renderWave();
      case 'circular':
        return renderCircular();
      case 'dots':
        return renderDots();
      default:
        return renderBars();
    }
  };

  return <View style={styles.container}>{renderVisualizer()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 200,
    paddingHorizontal: 20,
  },
  bar: {
    backgroundColor: '#fff',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barGradient: {
    flex: 1,
    width: '100%',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 100,
    width: '100%',
    paddingHorizontal: 20,
  },
  waveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
  },
  waveDotInner: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  circularContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
    width: 300,
  },
  circularBar: {
    width: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
    overflow: 'hidden',
  },
  circularBarGradient: {
    flex: 1,
    width: '100%',
  },
  centerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  dotGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
