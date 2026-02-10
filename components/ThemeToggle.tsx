import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBranding } from '@/contexts/BrandingContext';
import * as Haptics from 'expo-haptics';
import {
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';

type Theme = 'dark' | 'light' | 'auto';

interface ThemeToggleProps {
  onThemeChange?: (theme: Theme) => void;
  initialTheme?: Theme;
  size?: 'small' | 'medium' | 'large';
}

export function ThemeToggle({
  onThemeChange,
  initialTheme = 'dark',
  size = 'medium',
}: ThemeToggleProps) {
  const { branding } = useBranding();
  const [currentTheme, setCurrentTheme] = useState<Theme>(initialTheme);
  const slideAnimation = useState(new Animated.Value(0))[0];

  const toggleSize = size === 'small' ? 40 : size === 'large' ? 60 : 50;
  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;

  const themes: { value: Theme; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { value: 'dark', icon: 'moon', label: 'Dark' },
    { value: 'light', icon: 'sunny', label: 'Light' },
    { value: 'auto', icon: 'settings', label: 'Auto' },
  ];

  const handleThemeToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const currentIndex = themes.findIndex(t => t.value === currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex].value;
    
    setCurrentTheme(nextTheme);
    onThemeChange?.(nextTheme);

    // Animate the slide
    Animated.timing(slideAnimation, {
      toValue: nextIndex,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const getCurrentThemeInfo = () => {
    return themes.find(t => t.value === currentTheme) || themes[0];
  };

  const slideStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      slideAnimation.value,
      [0, 1, 2],
      [0, toggleSize, toggleSize * 2],
      'clamp'
    );

    return {
      transform: [{ translateX }],
    };
  });

  const currentThemeInfo = getCurrentThemeInfo();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.toggleContainer,
          {
            width: toggleSize * 3 + 4,
            height: toggleSize + 4,
            borderRadius: (toggleSize + 4) / 2,
          },
        ]}
        onPress={handleThemeToggle}
        activeOpacity={0.8}
      >
        {/* Background gradient */}
        <LinearGradient
          colors={[
            branding.accentColor + '20',
            branding.accentColor + '10',
          ]}
          style={[
            styles.backgroundGradient,
            {
              borderRadius: (toggleSize + 4) / 2,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Sliding indicator */}
        <Animated.View
          style={[
            styles.slideIndicator,
            slideStyle,
            {
              width: toggleSize,
              height: toggleSize,
              borderRadius: toggleSize / 2,
              backgroundColor: branding.accentColor,
            },
          ]}
        />

        {/* Theme icons */}
        {themes.map((theme, index) => (
          <View
            key={theme.value}
            style={[
              styles.themeIcon,
              {
                width: toggleSize,
                height: toggleSize,
                left: index * toggleSize + 2,
              },
            ]}
          >
            <Ionicons
              name={theme.icon}
              size={iconSize}
              color={currentTheme === theme.value ? '#fff' : branding.accentColor + '60'}
            />
          </View>
        ))}
      </TouchableOpacity>

      {/* Theme label */}
      <Text style={[styles.themeLabel, { color: branding.accentColor }]}>
        {currentThemeInfo.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  toggleContainer: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  slideIndicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  themeIcon: {
    position: 'absolute',
    top: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
