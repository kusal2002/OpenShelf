/**
 * SectionHeader Component
 * Section title with optional action button
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  showAction?: boolean;
  actionText?: string;
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  showAction = true,
  actionText = '···',
  onActionPress,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.titleSection}>
        <Text style={[styles.title, { color: theme.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>

      {showAction && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.surfaceVariant }]}
          onPress={onActionPress}
          accessible={true}
          accessibilityLabel={`${title} section actions`}
          accessibilityRole="button"
        >
          <Text style={[styles.actionText, { color: theme.textSecondary }]}>
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
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
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 18,
    fontWeight: '600',
  },
});