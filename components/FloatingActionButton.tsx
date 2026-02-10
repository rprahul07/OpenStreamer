import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useBranding } from '@/contexts/BrandingContext';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface ActionItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions: ActionItem[];
  position?: 'bottom-right' | 'bottom-left' | 'center-right';
  size?: 'small' | 'medium' | 'large';
}

export function FloatingActionButton({
  actions,
  position = 'bottom-right',
  size = 'medium',
}: FloatingActionButtonProps) {
  const { branding } = useBranding();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const fabSize = size === 'small' ? 48 : size === 'large' ? 64 : 56;
  const actionSize = fabSize * 0.8;

  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-left':
        return {
          left: 20,
          bottom: 100,
        };
      case 'center-right':
        return {
          right: 20,
          top: height / 2 - fabSize / 2,
        };
      default: // bottom-right
        return {
          right: 20,
          bottom: 100,
        };
    }
  };

  const handleMainPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsOpen(!isOpen);
  };

  const handleActionPress = (action: ActionItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAction(action.id);
    setIsOpen(false);
    
    // Add a small delay for visual feedback
    setTimeout(() => {
      action.onPress();
      setSelectedAction(null);
    }, 200);
  };

  const renderActionItem = (action: ActionItem, index: number) => {
    const animationDelay = index * 50;
    const translateY = isOpen ? -(index + 1) * (actionSize + 15) : 0;
    const scale = isOpen ? 1 : 0;
    const opacity = isOpen ? 1 : 0;

    return (
      <Animated.View
        key={action.id}
        style={[
          styles.actionItem,
          {
            transform: [
              {
                translateY: Animated.multiply(translateY, isOpen ? 1 : 0),
              },
              { scale },
            ],
            opacity,
          },
          getPositionStyles(),
        ]}
      >
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              width: actionSize,
              height: actionSize,
              borderRadius: actionSize / 2,
              backgroundColor: action.color || branding.accentColor,
            },
          ]}
          onPress={() => handleActionPress(action)}
          activeOpacity={0.8}
        >
          <BlurView intensity={20} style={styles.actionBlur}>
            <Ionicons
              name={action.icon}
              size={actionSize * 0.4}
              color="#fff"
            />
          </BlurView>
        </TouchableOpacity>
        
        {isOpen && (
          <Animated.View
            style={[
              styles.actionLabel,
              {
                opacity,
                transform: [
                  {
                    translateX: position === 'bottom-right' ? -10 : 10,
                  },
                ],
              },
            ]}
          >
            <Text style={styles.actionLabelText}>{action.label}</Text>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  const mainRotation = isOpen ? '45deg' : '0deg';
  const mainScale = selectedAction ? 0.9 : 1;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Render action items */}
      {actions.map((action, index) => renderActionItem(action, index))}
      
      {/* Main FAB */}
      <Animated.View
        style={[
          styles.fabContainer,
          getPositionStyles(),
          {
            width: fabSize,
            height: fabSize,
            borderRadius: fabSize / 2,
            transform: [
              { rotate: mainRotation },
              { scale: mainScale },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.fabButton,
            {
              width: fabSize,
              height: fabSize,
              borderRadius: fabSize / 2,
            },
          ]}
          onPress={handleMainPress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[branding.accentColor, branding.accentColor + 'CC']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <BlurView intensity={30} style={styles.fabBlur}>
              <Ionicons
                name={isOpen ? 'add' : 'create'}
                size={fabSize * 0.4}
                color="#fff"
              />
            </BlurView>
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Ripple effect */}
        {isOpen && (
          <Animated.View
            style={[
              styles.ripple,
              {
                width: fabSize * 2,
                height: fabSize * 2,
                borderRadius: fabSize,
                backgroundColor: branding.accentColor + '20',
              },
            ]}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabButton: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fabGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabBlur: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  actionItem: {
    position: 'absolute',
    alignItems: 'center',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  actionBlur: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  actionLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 60,
  },
  actionLabelText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },
  ripple: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -56,
    marginLeft: -56,
  },
});
