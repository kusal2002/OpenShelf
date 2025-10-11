/**
 * SearchBar Component
 * Modern search input with leading icon and optional trailing actions
 */

import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress?: () => void;
  placeholder?: string;
  showFilterButton?: boolean;
}

export const SearchBar = React.forwardRef<TextInput, SearchBarProps>(({
  value,
  onChangeText,
  onFilterPress,
  placeholder = 'Search materials, topics, or tags...',
  showFilterButton = true,
}, ref) => {
  const { theme } = useTheme();

  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[
        styles.searchBar,
        {
          backgroundColor: theme.surface,
          shadowColor: theme.shadow,
        }
      ]}>
        {/* Leading search icon */}
        <Text style={styles.searchIcon}>🔍</Text>

        {/* Text input */}
        <TextInput
          ref={ref}
          style={[styles.textInput, { color: theme.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textTertiary}
          accessible={true}
          accessibilityLabel="Search materials"
          accessibilityRole="search"
        />

        {/* Trailing actions */}
        <View style={styles.trailingActions}>
          {/* Clear button (shown when there's text) */}
          {value.length > 0 && (
            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: theme.outline }]}
              onPress={handleClear}
              accessible={true}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <Text style={[styles.clearIcon, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          )}

          {/* Filter button */}
          {showFilterButton && (
            <TouchableOpacity
              style={styles.filterButton}
              onPress={onFilterPress}
              accessible={true}
              accessibilityLabel="Open filters"
              accessibilityRole="button"
            >
              <Text style={styles.filterIcon}>⚙️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    fontWeight: '400',
  },
  trailingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    fontSize: 16,
  },
});