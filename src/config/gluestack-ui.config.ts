/**
 * Gluestack UI Theme Configuration
 * Custom theme configuration for OpenShelf University Library App
 */

import { createConfig } from '@gluestack-ui/themed';

export const gluestackUIConfig = createConfig({
  aliases: {
    bg: 'backgroundColor',
    rounded: 'borderRadius',
    shadow: 'shadowColor',
  },
  tokens: {
    colors: {
      // Primary Brand Colors
      primary50: '#E8F4FD',
      primary100: '#C1E1FA',
      primary200: '#8CC8F5',
      primary300: '#57AFEF',
      primary400: '#2296EA',
      primary500: '#1976D2', // Main primary color
      primary600: '#1565C0',
      primary700: '#1155AA',
      primary800: '#0D4494',
      primary900: '#0A337E',

      // Secondary Academic Colors  
      secondary50: '#FFF3E0',
      secondary100: '#FFE0B2',
      secondary200: '#FFCC80',
      secondary300: '#FFB74D',
      secondary400: '#FFA726',
      secondary500: '#FF9800', // Main secondary color
      secondary600: '#FB8C00',
      secondary700: '#F57C00',
      secondary800: '#EF6C00',
      secondary900: '#E65100',

      // Success Colors
      success50: '#E8F5E8',
      success100: '#C8E6C9',
      success200: '#A5D6A7',
      success300: '#81C784',
      success400: '#66BB6A',
      success500: '#4CAF50',
      success600: '#43A047',
      success700: '#388E3C',
      success800: '#2E7D32',
      success900: '#1B5E20',

      // Error Colors
      error50: '#FFEBEE',
      error100: '#FFCDD2',
      error200: '#EF9A9A',
      error300: '#E57373',
      error400: '#EF5350',
      error500: '#F44336',
      error600: '#E53935',
      error700: '#D32F2F',
      error800: '#C62828',
      error900: '#B71C1C',

      // Warning Colors
      warning50: '#FFF8E1',
      warning100: '#FFECB3',
      warning200: '#FFE082',
      warning300: '#FFD54F',
      warning400: '#FFCA28',
      warning500: '#FFC107',
      warning600: '#FFB300',
      warning700: '#FFA000',
      warning800: '#FF8F00',
      warning900: '#FF6F00',

      // Info Colors
      info50: '#E3F2FD',
      info100: '#BBDEFB',
      info200: '#90CAF9',
      info300: '#64B5F6',
      info400: '#42A5F5',
      info500: '#2196F3',
      info600: '#1E88E5',
      info700: '#1976D2',
      info800: '#1565C0',
      info900: '#0D47A1',

      // Neutral Grays
      coolGray50: '#F9FAFB',
      coolGray100: '#F3F4F6',
      coolGray200: '#E5E7EB',
      coolGray300: '#D1D5DB',
      coolGray400: '#9CA3AF',
      coolGray500: '#6B7280',
      coolGray600: '#4B5563',
      coolGray700: '#374151',
      coolGray800: '#1F2937',
      coolGray900: '#111827',

      // Warm Grays
      warmGray50: '#FAFAF9',
      warmGray100: '#F5F5F4',
      warmGray200: '#E7E5E4',
      warmGray300: '#D6D3D1',
      warmGray400: '#A8A29E',
      warmGray500: '#78716C',
      warmGray600: '#57534E',
      warmGray700: '#44403C',
      warmGray800: '#292524',
      warmGray900: '#1C1917',

      // Academic Subject Colors
      mathematics: '#6366F1',
      science: '#10B981',
      literature: '#8B5CF6',
      history: '#F59E0B',
      arts: '#EF4444',
      technology: '#3B82F6',

      // App Specific Colors
      background: '#FFFFFF',
      surface: '#F8FAFC',
      surfaceVariant: '#F1F5F9',
      onSurface: '#1E293B',
      onSurfaceVariant: '#475569',
      outline: '#CBD5E1',
      outlineVariant: '#E2E8F0',
    },

    space: {
      px: '1px',
      0: '0px',
      0.5: '2px',
      1: '4px',
      1.5: '6px',
      2: '8px',
      2.5: '10px',
      3: '12px',
      3.5: '14px',
      4: '16px',
      5: '20px',
      6: '24px',
      7: '28px',
      8: '32px',
      9: '36px',
      10: '40px',
      12: '48px',
      16: '64px',
      20: '80px',
      24: '96px',
      32: '128px',
    },

    borderWidths: {
      0: '0px',
      1: '1px',
      2: '2px',
      4: '4px',
      8: '8px',
    },

    radii: {
      none: '0px',
      xs: '2px',
      sm: '4px',
      md: '6px',
      lg: '8px',
      xl: '12px',
      '2xl': '16px',
      '3xl': '24px',
      full: '9999px',
    },

    fontSizes: {
      '2xs': '10px',
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
      '6xl': '60px',
    },

    lineHeights: {
      '2xs': '16px',
      xs: '18px',
      sm: '20px',
      md: '22px',
      lg: '28px',
      xl: '28px',
      '2xl': '32px',
      '3xl': '36px',
      '4xl': '40px',
      '5xl': '48px',
      '6xl': '60px',
    },

    fontWeights: {
      hairline: '100',
      thin: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },

    shadows: {
      none: 'none',
      xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },

    opacity: {
      0: '0',
      5: '0.05',
      10: '0.1',
      20: '0.2',
      25: '0.25',
      30: '0.3',
      40: '0.4',
      50: '0.5',
      60: '0.6',
      70: '0.7',
      75: '0.75',
      80: '0.8',
      90: '0.9',
      95: '0.95',
      100: '1',
    },
  },
});

export type Config = typeof gluestackUIConfig;

declare module '@gluestack-ui/themed' {
  interface UIConfig extends Config {}
}
