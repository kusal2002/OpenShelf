/**
 * ThemeToggle Component
 * Standalone theme toggle button for use in various places
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'medium',
  showLabel = false,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32, borderRadius: 16 };
      case 'large':
        return { width: 48, height: 48, borderRadius: 24 };
      default:
        return { width: 40, height: 40, borderRadius: 20 };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 20;
      default:
        return 16;
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.container,
          getSizeStyles(),
          { backgroundColor: theme.surfaceVariant }
        ]}
        onPress={toggleTheme}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible={true}
        accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        accessibilityRole="button"
      >
        <Text style={[styles.icon, { fontSize: getIconSize() }]}>
          {isDark ? '☀️' : '🌙'}
        </Text>
      </TouchableOpacity>
      
      {showLabel && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {isDark ? 'Light' : 'Dark'}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    // fontSize set dynamically
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
});