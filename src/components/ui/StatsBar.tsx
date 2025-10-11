/**
 * StatsBar Component
 * Display statistics in a clean bar format
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface StatItem {
  label: string;
  value: number;
  icon?: string;
}

interface StatsBarProps {
  stats: StatItem[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  const { theme } = useTheme();

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.surface,
        shadowColor: theme.shadow,
      }
    ]}>
      {stats.map((stat, index) => (
        <React.Fragment key={stat.label}>
          <View style={styles.statItem}>
            {stat.icon && (
              <Text style={styles.statIcon}>{stat.icon}</Text>
            )}
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {formatNumber(stat.value)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              {stat.label}
            </Text>
          </View>
          
          {/* Divider (not for last item) */}
          {index < stats.length - 1 && (
            <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    marginHorizontal: 16,
  },
});