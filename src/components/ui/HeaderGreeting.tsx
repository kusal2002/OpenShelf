/**
 * HeaderGreeting Component
 * Modern header with avatar, greeting, and action buttons
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface HeaderGreetingProps {
  userName?: string;
  avatarUrl?: string;
  onThemeToggle: () => void;
  onNotificationPress: () => void;
  onAvatarPress: () => void;
  isDark: boolean;
  notificationCount?: number;
}

export const HeaderGreeting: React.FC<HeaderGreetingProps> = ({
  userName = 'Student',
  avatarUrl,
  onThemeToggle,
  onNotificationPress,
  onAvatarPress,
  isDark,
  notificationCount = 0,
}) => {
  const { theme } = useTheme();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.leftSection}>
        {/* Avatar */}
        <TouchableOpacity
          onPress={onAvatarPress}
          accessible={true}
          accessibilityLabel="View profile"
          accessibilityRole="button"
        >
          <View style={[styles.avatarContainer, { backgroundColor: theme.surfaceVariant }]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <Text style={[styles.avatarText, { color: theme.primary }]}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        
        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.welcomeText, { color: theme.text }]}>
            Welcome, {userName}!
          </Text>
        </View>
      </View>

      {/* Right actions */}
      <View style={styles.rightSection}>
        {/* Theme toggle */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.surfaceVariant }]}
          onPress={onThemeToggle}
          accessible={true}
          accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} theme`}
          accessibilityRole="button"
        >
          <Text style={styles.actionIcon}>
            {isDark ? '☀️' : '🌙'}
          </Text>
        </TouchableOpacity>

        {/* Notification icon */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.surfaceVariant }]}
          onPress={onNotificationPress}
          accessible={true}
          accessibilityLabel="View notifications"
          accessibilityRole="button"
        >
          <View>
            <Text style={styles.actionIcon}>🔔</Text>
            {notificationCount > 0 && (
              <View style={[styles.badge, { backgroundColor: '#FF4444' }]}>
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 2,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});