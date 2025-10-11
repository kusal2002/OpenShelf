/**
 * PromoCard Component
 * "New for You" promotional card with gradient background
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface PromoCardProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  onPress?: () => void;
}

export const PromoCard: React.FC<PromoCardProps> = ({
  title = 'New for You',
  subtitle = 'Discover fresh study materials tailored to your interests',
  ctaText = 'Explore Now',
  onPress,
}) => {
  const { theme, isDark } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Create gradient-like effect with subtle colors
  const gradientColors = isDark 
    ? { primary: theme.primary + '40', secondary: theme.secondary + '20' }
    : { primary: theme.primary + '15', secondary: theme.secondary + '10' };

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              shadowColor: theme.shadow,
            }
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessible={true}
          accessibilityLabel={`${title}: ${subtitle}`}
          accessibilityRole="button"
        >
          {/* Gradient overlay */}
          <View style={[
            styles.gradientOverlay,
            {
              backgroundColor: gradientColors.primary,
            }
          ]} />
          
          <View style={styles.content}>
            <View style={styles.textSection}>
              <Text style={[styles.title, { color: theme.text }]}>
                ✨ {title}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {subtitle}
              </Text>
            </View>

            {onPress && (
              <TouchableOpacity
                style={[styles.ctaButton, { backgroundColor: theme.primary }]}
                onPress={onPress}
                accessible={true}
                accessibilityLabel={ctaText}
                accessibilityRole="button"
              >
                <Text style={[styles.ctaText, { color: theme.textInverse }]}>
                  {ctaText}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    position: 'relative',
  },
  textSection: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  ctaButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
  },
});