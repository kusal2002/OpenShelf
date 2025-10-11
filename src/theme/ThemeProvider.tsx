/**
 * Theme Provider for OpenShelf
 * Provides light/dark theme support with system preference detection and manual override
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { themeStorage, ThemeMode } from '../utils/storage/theme';

// Theme Colors
export const lightTheme = {
  background: '#F6F9FB',
  surface: '#FFFFFF',
  primary: '#2563EB',
  secondary: '#FF8A65',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  text: '#0B1220',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  outline: '#E2E8F0',
  shadow: 'rgba(0, 0, 0, 0.1)',
  
  // Interactive states
  pressed: 'rgba(37, 99, 235, 0.12)',
  hover: 'rgba(37, 99, 235, 0.08)',
  disabled: 'rgba(0, 0, 0, 0.12)',
  
  // Legacy compatibility with existing THEME_COLORS
  primaryLight: '#60A5FA',
  primaryDark: '#1D4ED8',
  secondaryLight: '#FFAB91',
  secondaryDark: '#FF5722',
  successLight: '#4ADE80',
  errorLight: '#F87171',
  warningLight: '#FBBF24',
  infoLight: '#38BDF8',
  surfaceVariant: '#F1F5F9',
  outlineVariant: '#E2E8F0',
  book: '#8B5CF6',
  document: '#6366F1',
  video: '#EF4444',
  audio: '#F97316',
  image: '#10B981',
  mathematics: '#6366F1',
  science: '#14B8A6',
  literature: '#A3A3A3',
  history: '#FB7185',
  arts: '#EC4899',
  technology: '#64748B',
  focused: 'rgba(37, 99, 235, 0.16)',
  disabledText: 'rgba(0, 0, 0, 0.38)',
  shadowDark: 'rgba(0, 0, 0, 0.24)',
  white: '#FFFFFF',
  info: '#3B82F6',
  light: '#F8FAFC',
  dark: '#1E293B',
  border: '#E2E8F0',
};

export const darkTheme = {
  background: '#0B1220',
  surface: '#1E293B',
  primary: '#22C55E',
  secondary: '#FF8A65',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  text: '#E6EEF2',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#0B1220',
  outline: '#334155',
  shadow: 'rgba(0, 0, 0, 0.3)',
  
  // Interactive states
  pressed: 'rgba(34, 197, 94, 0.12)',
  hover: 'rgba(34, 197, 94, 0.08)',
  disabled: 'rgba(255, 255, 255, 0.12)',
  
  // Legacy compatibility with existing THEME_COLORS
  primaryLight: '#4ADE80',
  primaryDark: '#16A34A',
  secondaryLight: '#FFAB91',
  secondaryDark: '#FF5722',
  successLight: '#4ADE80',
  errorLight: '#F87171',
  warningLight: '#FBBF24',
  infoLight: '#38BDF8',
  surfaceVariant: '#334155',
  outlineVariant: '#475569',
  book: '#A855F7',
  document: '#7C3AED',
  video: '#F87171',
  audio: '#FB923C',
  image: '#34D399',
  mathematics: '#818CF8',
  science: '#2DD4BF',
  literature: '#D1D5DB',
  history: '#FB7185',
  arts: '#F472B6',
  technology: '#94A3B8',
  focused: 'rgba(34, 197, 94, 0.16)',
  disabledText: 'rgba(255, 255, 255, 0.38)',
  shadowDark: 'rgba(0, 0, 0, 0.5)',
  white: '#FFFFFF',
  info: '#60A5FA',
  light: '#475569',
  dark: '#0F172A',
  border: '#334155',
};

export type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isInitialized, setIsInitialized] = useState(false);

  // Determine if we should use dark theme
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  
  // Select theme based on isDark
  const theme = isDark ? darkTheme : lightTheme;

  // Load saved theme mode on startup
  useEffect(() => {
    const loadThemeMode = async () => {
      const savedMode = await themeStorage.getThemeMode();
      setThemeModeState(savedMode);
      setIsInitialized(true);
    };
    loadThemeMode();
  }, []);

  // Save theme mode when it changes
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await themeStorage.setThemeMode(mode);
  };

  // Toggle between light and dark (not system)
  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  // Don't render until we've loaded the saved theme
  if (!isInitialized) {
    return null;
  }

  const contextValue: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useThemeMode = () => {
  const { themeMode, setThemeMode } = useTheme();
  return { themeMode, setThemeMode };
};