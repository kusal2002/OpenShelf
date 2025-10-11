/**
 * CategoryPill Component
 * Minimal category selector with icon and text
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface CategoryPillProps {
  label: string;
  icon: string;
  isActive: boolean;
  onPress: () => void;
  count?: number;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({
  label,
  icon,
  isActive,
  onPress,
  count,
}) => {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
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
      <Pressable
        style={[
          styles.container,
          {
            backgroundColor: isActive ? theme.primary : theme.surface,
            borderColor: isActive ? theme.primary : theme.outline,
            shadowColor: theme.shadow,
          }
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible={true}
        accessibilityLabel={`${label} category ${isActive ? 'selected' : 'not selected'}${count !== undefined ? `, ${count} materials` : ''}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
      >
        {/* Count badge in top-right */}
        {count !== undefined && count > 0 && (
          <View style={[styles.countBadge, { backgroundColor: isActive ? theme.textInverse : theme.primary }]}>
            {/* If badge is white (textInverse), use theme.primary for number; if badge is primary (blue), use white for number */}
            <Text style={[styles.countText, { color: isActive ? theme.primary : '#FFFFFF' }] }>
              {count}
            </Text>
          </View>
        )}
        
        <Text style={[styles.icon, { color: isActive ? theme.textInverse : theme.text }]}>{icon}</Text>
        <Text style={[
          styles.label,
          {
            color: isActive ? theme.textInverse : theme.text,
          }
        ]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 80,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  countBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});