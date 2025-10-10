/**
 * Theme Context Provider
 * Manages dark mode and theme switching across the entire app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'react-native';

const THEME_STORAGE_KEY = 'app_theme_mode';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  // Primary brand colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // Status colors
  success: string;
  successLight: string;
  error: string;
  errorLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
  
  // Neutral colors
  background: string;
  surface: string;
  white: string;
  surfaceVariant: string;
  outline: string;
  outlineVariant: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Semantic colors
  book: string;
  document: string;
  video: string;
  audio: string;
  image: string;
  
  // Academic categories
  mathematics: string;
  science: string;
  literature: string;
  history: string;
  arts: string;
  technology: string;
  
  // Interactive states
  pressed: string;
  hover: string;
  focused: string;
  disabled: string;
  disabledText: string;
  
  // Shadows
  shadow: string;
  shadowDark: string;
  
  // Legacy
  light: string;
  dark: string;
  border: string;
}

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
}

const lightColors: ThemeColors = {
  // Primary brand colors - Academic Blue theme
  primary: '#1565C0',
  primaryLight: '#42A5F5',
  primaryDark: '#0D47A1',
  secondary: '#FF8A65',
  secondaryLight: '#FFAB91',
  secondaryDark: '#FF5722',
  
  // Status colors
  success: '#2E7D32',
  successLight: '#66BB6A',
  error: '#C62828',
  errorLight: '#EF5350',
  warning: '#EF6C00',
  warningLight: '#FF9800',
  info: '#0277BD',
  infoLight: '#29B6F6',
  
  // Neutral colors
  background: '#FAFAFA',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  outline: '#E0E0E0',
  outlineVariant: '#EEEEEE',
  
  // Text colors
  text: '#1A1A1A',
  textSecondary: '#616161',
  textTertiary: '#9E9E9E',
  textInverse: '#FFFFFF',
  
  // Semantic colors
  book: '#8E24AA',
  document: '#5E35B1',
  video: '#E53935',
  audio: '#FB8C00',
  image: '#43A047',
  
  // Academic categories
  mathematics: '#3F51B5',
  science: '#009688',
  literature: '#795548',
  history: '#FF7043',
  arts: '#E91E63',
  technology: '#607D8B',
  
  // Interactive states
  pressed: 'rgba(21, 101, 192, 0.12)',
  hover: 'rgba(21, 101, 192, 0.08)',
  focused: 'rgba(21, 101, 192, 0.16)',
  disabled: 'rgba(0, 0, 0, 0.12)',
  disabledText: 'rgba(0, 0, 0, 0.38)',
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.12)',
  shadowDark: 'rgba(0, 0, 0, 0.24)',
  
  // Legacy
  light: '#F5F5F5',
  dark: '#212121',
  border: '#E0E0E0',
};

const darkColors: ThemeColors = {
  // Primary brand colors - Adjusted for dark mode
  primary: '#42A5F5',        // Lighter blue for better visibility
  primaryLight: '#64B5F6',   // Even lighter
  primaryDark: '#1976D2',    // Medium blue
  secondary: '#FF8A65',      // Warm coral (kept similar)
  secondaryLight: '#FFAB91', // Light coral
  secondaryDark: '#FF5722',  // Deep coral
  
  // Status colors
  success: '#66BB6A',        // Lighter green
  successLight: '#81C784',   // Very light green
  error: '#EF5350',          // Lighter red
  errorLight: '#E57373',     // Very light red
  warning: '#FF9800',        // Lighter orange
  warningLight: '#FFB74D',   // Very light orange
  info: '#29B6F6',           // Lighter info blue
  infoLight: '#4FC3F7',      // Very light info
  
  // Neutral colors - Dark mode palette
  background: '#121212',     // True dark background
  surface: '#1E1E1E',        // Elevated surface
  white: '#FFFFFF',          // Pure white
  surfaceVariant: '#2C2C2C', // Slightly lighter surface
  outline: '#404040',        // Dark border
  outlineVariant: '#303030', // Very dark border
  
  // Text colors - Optimized for dark backgrounds
  text: '#FFFFFF',           // White text
  textSecondary: '#B0B0B0',  // Light gray
  textTertiary: '#808080',   // Medium gray
  textInverse: '#000000',    // Black text
  
  // Semantic colors - Brightened for dark mode
  book: '#AB47BC',           // Lighter purple
  document: '#7E57C2',       // Lighter indigo
  video: '#EF5350',          // Lighter red
  audio: '#FFA726',          // Lighter orange
  image: '#66BB6A',          // Lighter green
  
  // Academic categories - Brightened
  mathematics: '#5C6BC0',    // Lighter indigo
  science: '#26A69A',        // Lighter teal
  literature: '#A1887F',     // Lighter brown
  history: '#FF8A65',        // Lighter deep orange
  arts: '#F06292',           // Lighter pink
  technology: '#78909C',     // Lighter blue gray
  
  // Interactive states - Adjusted for dark mode
  pressed: 'rgba(66, 165, 245, 0.16)',
  hover: 'rgba(66, 165, 245, 0.12)',
  focused: 'rgba(66, 165, 245, 0.24)',
  disabled: 'rgba(255, 255, 255, 0.12)',
  disabledText: 'rgba(255, 255, 255, 0.38)',
  
  // Shadows - Darker for dark mode
  shadow: 'rgba(0, 0, 0, 0.4)',
  shadowDark: 'rgba(0, 0, 0, 0.6)',
  
  // Legacy
  light: '#2C2C2C',
  dark: '#000000',
  border: '#404040',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme on mount
  useEffect(() => {
    loadTheme();
  }, []);

  // Update StatusBar when theme changes
  useEffect(() => {
    StatusBar.setBarStyle(theme === 'dark' ? 'light-content' : 'dark-content', true);
  }, [theme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTheme = async (newTheme: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    saveTheme(mode);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const colors = theme === 'dark' ? darkColors : lightColors;
  const isDark = theme === 'dark';

  const value: ThemeContextType = {
    theme,
    colors,
    toggleTheme,
    setTheme,
    isDark,
  };

  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
