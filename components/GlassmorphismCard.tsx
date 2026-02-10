import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useBranding } from '@/contexts/BrandingContext';
import Colors from '@/constants/colors';

interface GlassmorphismCardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  intensity?: number;
  gradientColors?: readonly [string, string, ...string[]];
  borderRadius?: number;
  padding?: number;
}

export function GlassmorphismCard({
  children,
  style,
  onPress,
  intensity = 20,
  gradientColors,
  borderRadius = 16,
  padding = 16,
}: GlassmorphismCardProps) {
  const { branding } = useBranding();
  
  const defaultGradientColors: readonly [string, string, ...string[]] = gradientColors || [
    branding.accentColor + '15',
    branding.accentColor + '05',
  ];

  const CardContent = (
    <View style={[styles.container, { borderRadius }, style]}>
      {/* Glassmorphism background */}
      <BlurView
        intensity={intensity}
        tint="light"
        style={[styles.blur, { borderRadius }]}
      >
        <LinearGradient
          colors={defaultGradientColors}
          style={[styles.gradient, { borderRadius }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </BlurView>
      
      {/* Content */}
      <View style={[styles.content, { padding }]}>
        {children}
      </View>
      
      {/* Subtle border */}
      <View style={[styles.border, { borderRadius }]} />
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  touchable: {
    width: '100%',
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
  },
});
