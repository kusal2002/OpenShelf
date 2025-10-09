/**
 * Utility functions for the OpenShelf University Library App
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { downloadFile } from './download';
import { Alert, Platform } from 'react-native';
import { Material, MaterialCategory, ValidationError, FormErrors, SubCategory } from '../types';

// Storage Keys
export const STORAGE_KEYS = {
  MATERIALS_CACHE: 'materials_cache',
  USER_PROFILE: 'user_profile',
  READING_PROGRESS: 'reading_progress',
  OFFLINE_QUEUE: 'offline_queue',
  AUTH_TOKEN: 'auth_token',
  SETTINGS: 'app_settings',
} as const;

// Cache Management
export class CacheManager {
  /**
   * Cache materials for offline access
   */
  static async cacheMaterials(materials: Material[]): Promise<void> {
    try {
      const cacheData = {
        materials,
        timestamp: Date.now(),
        version: '1.0',
      };
      await AsyncStorage.setItem(STORAGE_KEYS.MATERIALS_CACHE, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to cache materials:', error);
    }
  }

  /**
   * Get cached materials
   */
  static async getCachedMaterials(): Promise<Material[]> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.MATERIALS_CACHE);
      if (cached) {
        const cacheData = JSON.parse(cached);
        // Check if cache is still valid (e.g., within 24 hours)
        const isValid = Date.now() - cacheData.timestamp < 24 * 60 * 60 * 1000;
        if (isValid) {
          return cacheData.materials;
        }
      }
      return [];
    } catch (error) {
      console.error('Failed to get cached materials:', error);
      return [];
    }
  }

  /**
   * Clear all cached data
   */
  static async clearCache(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }


static async handleDownload(material: any) {
  const result = await downloadFile(material.file_path, `${material.title}.pdf`, 'study-materials', { share: false });
  if (result.success) {
    // Show success toast / alert
    console.log('Saved to', result.localPath);
  } else {
    console.warn('Download failed:', result.error);
  }
}

  /**
   * Get cache size in bytes
   */
  static async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
      return 0;
    }
  }

  /**
   * Get cached user profile
   */
  static async getCachedProfile(userId: string): Promise<any> {
    try {
      const cached = await AsyncStorage.getItem(`${STORAGE_KEYS.USER_PROFILE}_${userId}`);
      if (cached) {
        const profileData = JSON.parse(cached);
        // Check if cache is still valid (e.g., within 1 hour)
        const isValid = Date.now() - profileData.timestamp < 60 * 60 * 1000;
        if (isValid) {
          return profileData.profile;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get cached profile:', error);
      return null;
    }
  }

  /**
   * Cache user profile
   */
  static async cacheProfile(userId: string, profile: any): Promise<void> {
    try {
      const cacheData = {
        profile,
        timestamp: Date.now(),
        version: '1.0',
      };
      await AsyncStorage.setItem(`${STORAGE_KEYS.USER_PROFILE}_${userId}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to cache profile:', error);
    }
  }

  /**
   * Get app settings
   */
  static async getAppSettings(): Promise<any> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Failed to get app settings:', error);
      return {};
    }
  }

  /**
   * Save app settings
   */
  static async saveAppSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save app settings:', error);
    }
  }
}

// Network Utilities
export class NetworkUtils {
  /**
   * Check if device is online
   */
  static async isOnline(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected === true && netInfo.isInternetReachable === true;
    } catch (error) {
      console.error('Failed to check network status:', error);
      return false;
    }
  }

  /**
   * Subscribe to network status changes
   */
  static subscribeToNetworkStatus(callback: (isOnline: boolean) => void) {
    return NetInfo.addEventListener(state => {
      const isOnline = state.isConnected === true && state.isInternetReachable === true;
      callback(isOnline);
    });
  }
}

// File Utilities
export class FileUtils {
  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Check if file type is supported
   */
  static isSupportedFileType(filename: string): boolean {
    const supportedTypes = ['pdf', 'doc', 'docx'];
    const extension = this.getFileExtension(filename);
    return supportedTypes.includes(extension);
  }

  /**
   * Generate unique filename
   */
  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = this.getFileExtension(originalName);
    return `${timestamp}_${random}.${extension}`;
  }

  /**
   * Validate file for upload
   */
  static validateFile(file: { name: string; size: number; type: string }): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check file type
    if (!this.isSupportedFileType(file.name)) {
      errors.push({
        field: 'file',
        message: 'Only PDF, DOC, and DOCX files are supported',
      });
    }
    
    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      errors.push({
        field: 'file',
        message: `File size must be less than ${this.formatFileSize(maxSize)}`,
      });
    }
    
    // Check filename length
    if (file.name.length > 255) {
      errors.push({
        field: 'file',
        message: 'Filename is too long',
      });
    }
    
    return errors;
  }
}

// Form Validation
export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (password.length < 8) {
      errors.push({
        field: 'password',
        message: 'Password must be at least 8 characters long',
      });
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one lowercase letter',
      });
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one uppercase letter',
      });
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one number',
      });
    }
    
    return errors;
  }

  /**
   * Validate material title
   */
  static validateMaterialTitle(title: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!title.trim()) {
      errors.push({
        field: 'title',
        message: 'Title is required',
      });
    } else if (title.length < 3) {
      errors.push({
        field: 'title',
        message: 'Title must be at least 3 characters long',
      });
    } else if (title.length > 200) {
      errors.push({
        field: 'title',
        message: 'Title must be less than 200 characters',
      });
    }
    
    return errors;
  }

  /**
   * Validate form and return consolidated errors
   */
  static validateForm(fields: { [key: string]: any }, rules: { [key: string]: (value: any) => ValidationError[] }): FormErrors {
    const errors: FormErrors = {};
    
    Object.keys(rules).forEach(fieldName => {
      const fieldErrors = rules[fieldName](fields[fieldName]);
      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors[0].message; // Show first error only
      }
    });
    
    return errors;
  }

  /**
   * Validate user profile data
   */
  static validateProfile(profile: Partial<any>): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (profile.full_name && profile.full_name.length < 2) {
      errors.push({
        field: 'full_name',
        message: 'Full name must be at least 2 characters long',
      });
    }
    
    if (profile.email && !this.isValidEmail(profile.email)) {
      errors.push({
        field: 'email',
        message: 'Please enter a valid email address',
      });
    }
    
    if (profile.bio && profile.bio.length > 500) {
      errors.push({
        field: 'bio',
        message: 'Bio must be less than 500 characters',
      });
    }
    
    return errors;
  }
}

// Date Utilities
export class DateUtils {
  /**
   * Format date for display
   */
  static formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format date with time
   */
  static formatDateTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get relative time (e.g., "2 hours ago")
   */
  static getRelativeTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    } else {
      return this.formatDate(dateObj);
    }
  }
}

// UI Utilities
export class UIUtils {
  /**
   * Show alert with error message
   */
  static showAlert(title: string, message: string, onOk?: () => void): void {
    Alert.alert(
      title,
      message,
      [{ text: 'OK', onPress: onOk }],
      { cancelable: false }
    );
  }

  /**
   * Show confirmation dialog
   */
  static showConfirmation(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'OK', onPress: onConfirm },
      ],
      { cancelable: false }
    );
  }

  /**
   * Truncate text with ellipsis
   */
  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Generate avatar color based on name
   */
  static getAvatarColor(name: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }
}

// Constants
export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Literature',
  'History',
  'Economics',
  'Psychology',
  'Engineering',
  'Medicine',
  'Other',
];

export const SUB_CATEGORIES: SubCategory[] = [
  'Textbook',
  'Notes',
  'Presentation',
  'Assignment',
  'Research',
  'Thesis',
  'Reference',
  'Other',
];

export const FILE_ICONS = {
  pdf: '📄',
  doc: '📝',
  docx: '📝',
  default: '📁',
};

export const THEME_COLORS = {
  // Primary brand colors - Academic Blue theme
  primary: '#1565C0',        // Deep blue
  primaryLight: '#42A5F5',   // Light blue  
  primaryDark: '#0D47A1',    // Dark blue
  secondary: '#FF8A65',      // Warm coral
  secondaryLight: '#FFAB91', // Light coral
  secondaryDark: '#FF5722',  // Deep coral
  
  // Status colors
  success: '#2E7D32',        // Forest green
  successLight: '#66BB6A',   // Light green
  error: '#C62828',          // Deep red
  errorLight: '#EF5350',     // Light red
  warning: '#EF6C00',        // Orange
  warningLight: '#FF9800',   // Light orange
  info: '#0277BD',           // Info blue
  infoLight: '#29B6F6',      // Light info blue
  
  // Neutral colors
  background: '#FAFAFA',     // Off-white background
  surface: '#FFFFFF',        // White surface
  white: '#FFFFFF',          // Pure white
  surfaceVariant: '#F5F5F5', // Light gray surface
  outline: '#E0E0E0',        // Light border
  outlineVariant: '#EEEEEE', // Very light border
  
  // Text colors  
  text: '#1A1A1A',           // Almost black
  textSecondary: '#616161',  // Medium gray
  textTertiary: '#9E9E9E',   // Light gray
  textInverse: '#FFFFFF',    // White text
  
  // Semantic colors for library app
  book: '#8E24AA',           // Purple for books
  document: '#5E35B1',       // Indigo for documents  
  video: '#E53935',          // Red for videos
  audio: '#FB8C00',          // Orange for audio
  image: '#43A047',          // Green for images
  
  // Academic categories
  mathematics: '#3F51B5',    // Indigo
  science: '#009688',        // Teal
  literature: '#795548',     // Brown  
  history: '#FF7043',        // Deep orange
  arts: '#E91E63',          // Pink
  technology: '#607D8B',     // Blue gray
  
  // Interactive states
  pressed: 'rgba(21, 101, 192, 0.12)',      // Primary with opacity
  hover: 'rgba(21, 101, 192, 0.08)',        // Primary with light opacity
  focused: 'rgba(21, 101, 192, 0.16)',      // Primary with medium opacity
  disabled: 'rgba(0, 0, 0, 0.12)',          // Disabled state
  disabledText: 'rgba(0, 0, 0, 0.38)',      // Disabled text
  
  // Shadows and elevation
  shadow: 'rgba(0, 0, 0, 0.12)',
  shadowDark: 'rgba(0, 0, 0, 0.24)',
  
  // Legacy compatibility
  light: '#F5F5F5',
  dark: '#212121',
  border: '#E0E0E0',
};

// UI Constants and Design System
export const UI_CONSTANTS = {
  // Spacing scale (4pt grid system)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius scale
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 50,
  },
  
  // Typography scale
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold' as const, lineHeight: 40 },
    h2: { fontSize: 28, fontWeight: 'bold' as const, lineHeight: 36 },
    h3: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
    h4: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
    h5: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
    h6: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
    body1: { fontSize: 16, fontWeight: 'normal' as const, lineHeight: 24 },
    body2: { fontSize: 14, fontWeight: 'normal' as const, lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: 'normal' as const, lineHeight: 16 },
    overline: { fontSize: 10, fontWeight: '500' as const, lineHeight: 16, letterSpacing: 1.5 },
  },
  
  // Elevation/Shadow system
  elevation: {
    0: { elevation: 0, shadowOpacity: 0 },
    1: { 
      elevation: 1,
      shadowColor: THEME_COLORS.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
    2: {
      elevation: 2,
      shadowColor: THEME_COLORS.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    3: {
      elevation: 3,
      shadowColor: THEME_COLORS.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.27,
      shadowRadius: 4.65,
    },
    4: {
      elevation: 4,
      shadowColor: THEME_COLORS.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6.27,
    },
  },
  
  // Animation durations
  animation: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
};

// Enhanced UI Components Utilities
export class UIComponents {
  /**
   * Get consistent card styles
   */
  static getCardStyle(elevation: keyof typeof UI_CONSTANTS.elevation = 2) {
    return {
      backgroundColor: THEME_COLORS.surface,
      borderRadius: UI_CONSTANTS.borderRadius.md,
      padding: UI_CONSTANTS.spacing.md,
      ...UI_CONSTANTS.elevation[elevation],
    };
  }

  /**
   * Get button styles by variant
   */
  static getButtonStyle(variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary') {
    const base = {
      borderRadius: UI_CONSTANTS.borderRadius.md,
      paddingVertical: UI_CONSTANTS.spacing.sm,
      paddingHorizontal: UI_CONSTANTS.spacing.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 48,
    };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          backgroundColor: THEME_COLORS.primary,
        };
      case 'secondary':
        return {
          ...base,
          backgroundColor: THEME_COLORS.secondary,
        };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: THEME_COLORS.primary,
        };
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
        };
    }
  }

  /**
   * Get input field styles
   */
  static getInputStyle(state: 'default' | 'focused' | 'error' = 'default') {
    const base = {
      borderRadius: UI_CONSTANTS.borderRadius.sm,
      paddingHorizontal: UI_CONSTANTS.spacing.md,
      paddingVertical: UI_CONSTANTS.spacing.sm,
      fontSize: 16,
      backgroundColor: THEME_COLORS.surface,
      borderWidth: 1,
      minHeight: 48,
    };

    switch (state) {
      case 'focused':
        return {
          ...base,
          borderColor: THEME_COLORS.primary,
        };
      case 'error':
        return {
          ...base,
          borderColor: THEME_COLORS.error,
        };
      default:
        return {
          ...base,
          borderColor: THEME_COLORS.outline,
        };
    }
  }
}

// Error Handler
export class ErrorHandler {
  /**
   * Handle and log errors consistently
   */
  static handle(error: any, context?: string): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
    
    console.error(fullMessage, error);
    
    // In production, you might want to send errors to a logging service
    // like Sentry, Crashlytics, etc.
    if (__DEV__) {
      console.error('Full error object:', error);
    }
  }

  /**
   * Handle API errors and show user-friendly messages
   */
  static handleApiError(error: any, defaultMessage: string = 'Something went wrong'): string {
    if (error?.message) {
      // Handle specific Supabase errors
      if (error.message.includes('Invalid login credentials')) {
        return 'Invalid email or password';
      }
      if (error.message.includes('Email not confirmed')) {
        return 'Please check your email and confirm your account';
      }
      if (error.message.includes('network')) {
        return 'Network error. Please check your connection';
      }
      return error.message;
    }
    
    return defaultMessage;
  }
}

export { downloadFile } from './download';
export type { DownloadResult } from './download';

export default {
  CacheManager,
  NetworkUtils,
  FileUtils,
  ValidationUtils,
  DateUtils,
  UIUtils,
  UIComponents,
  ErrorHandler,
  STORAGE_KEYS,
  MATERIAL_CATEGORIES,
  FILE_ICONS,
  THEME_COLORS,
  UI_CONSTANTS,
};
