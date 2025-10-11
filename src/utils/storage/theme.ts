/**
 * Theme Storage Utilities
 * Handles persistence of theme preferences using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@openshelf_theme_mode';

export type ThemeMode = 'light' | 'dark' | 'system';

export const themeStorage = {
  /**
   * Get the stored theme mode
   */
  async getThemeMode(): Promise<ThemeMode> {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored as ThemeMode;
      }
      return 'system'; // Default to system
    } catch (error) {
      console.warn('Failed to load theme mode from storage:', error);
      return 'system';
    }
  },

  /**
   * Store the theme mode
   */
  async setThemeMode(mode: ThemeMode): Promise<void> {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save theme mode to storage:', error);
    }
  },

  /**
   * Clear stored theme mode (reset to system default)
   */
  async clearThemeMode(): Promise<void> {
    try {
      await AsyncStorage.removeItem(THEME_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear theme mode from storage:', error);
    }
  },
};