import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useBranding } from '@/contexts/BrandingContext';

const { width, height } = Dimensions.get('window');

interface AnimatedBackgroundProps {
  children?: React.ReactNode;
  variant?: 'waves' | 'particles' | 'gradient' | 'aurora';
}

export function AnimatedBackground({ children, variant = 'gradient' }: AnimatedBackgroundProps) {
  const { branding } = useBranding();
  
  // Animation values
  const waveOffset = useSharedValue(0);
  const particleX = useSharedValue(0);
  const particleY = useSharedValue(0);
  const gradientRotation = useSharedValue(0);
  const auroraOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Wave animation
    waveOffset.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      true
    );

    // Particle movement
    particleX.value = withRepeat(
      withTiming(width, { duration: 8000 }),
      -1,
      true
    );
    
    particleY.value = withRepeat(
      withTiming(height, { duration: 6000 }),
      -1,
      true
    );

    // Gradient rotation
    gradientRotation.value = withRepeat(
      withTiming(360, { duration: 20000 }),
      -1,
      true
    );

    // Aurora breathing effect
    auroraOpacity.value = withRepeat(
      withTiming(0.8, { duration: 4000 }),
      -1,
      true
    );
  }, []);

  const waveStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      waveOffset.value,
      [0, 1],
      [0, -height / 3],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }],
    };
  });

  const particleStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: particleX.value },
        { translateY: particleY.value },
      ],
    };
  });

  const gradientStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${gradientRotation.value}deg` },
      ],
    };
  });

  const auroraStyle = useAnimatedStyle(() => {
    return {
      opacity: auroraOpacity.value,
    };
  });

  const renderBackground = () => {
    switch (variant) {
      case 'waves':
        return (
          <>
            <Animated.View style={[styles.wave, waveStyle]}>
              <LinearGradient
                colors={[branding.accentColor + '40', branding.accentColor + '10']}
                style={styles.waveGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>
            <Animated.View style={[styles.wave, styles.wave2, waveStyle]}>
              <LinearGradient
                colors={['#4A90E2' + '30', '#4A90E2' + '05']}
                style={styles.waveGradient}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            </Animated.View>
          </>
        );

      case 'particles':
        return (
          <View style={styles.particleContainer}>
            {[...Array(20)].map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  particleStyle,
                  {
                    left: Math.random() * width,
                    top: Math.random() * height,
                    animationDelay: `${index * 0.2}s`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.particleDot,
                    { backgroundColor: branding.accentColor + '60' },
                  ]}
                />
              </Animated.View>
            ))}
          </View>
        );

      case 'aurora':
        return (
          <>
            <Animated.View style={[styles.aurora, auroraStyle]}>
              <LinearGradient
                colors={[
                  branding.accentColor + '40',
                  '#4A90E2' + '30',
                  '#9B59B6' + '40',
                  branding.accentColor + '40',
                ]}
                style={styles.auroraGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>
            <Animated.View style={[styles.aurora, styles.aurora2, auroraStyle]}>
              <LinearGradient
                colors={[
                  '#E74C3C' + '30',
                  '#F39C12' + '30',
                  '#E74C3C' + '30',
                ]}
                style={styles.auroraGradient}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            </Animated.View>
          </>
        );

      default: // gradient
        return (
          <Animated.View style={[styles.gradientContainer, gradientStyle]}>
            <LinearGradient
              colors={[
                branding.accentColor + '20',
                '#4A90E2' + '15',
                '#9B59B6' + '20',
                branding.accentColor + '20',
              ]}
              style={styles.animatedGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderBackground()}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradientContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  animatedGradient: {
    flex: 1,
    width: width * 1.5,
    height: height * 1.5,
  },
  wave: {
    ...StyleSheet.absoluteFillObject,
    height: height * 0.6,
    bottom: -height * 0.3,
  },
  wave2: {
    height: height * 0.4,
    bottom: -height * 0.2,
  },
  waveGradient: {
    flex: 1,
    borderRadius: width,
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
  },
  particleDot: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  aurora: {
    ...StyleSheet.absoluteFillObject,
    height: height * 0.5,
    top: 0,
  },
  aurora2: {
    height: height * 0.4,
    top: height * 0.1,
  },
  auroraGradient: {
    flex: 1,
    borderRadius: width / 2,
  },
});
