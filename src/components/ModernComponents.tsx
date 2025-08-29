/**
 * Modern UI Components
 * Simple, elegant components without complex dependencies
 */

import React, { ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { THEME_COLORS, UI_CONSTANTS } from '../utils';

const { width: screenWidth } = Dimensions.get('window');

// Modern Card Component
interface ModernCardProps {
  children: ReactNode;
  style?: any;
  elevated?: boolean;
}

export const ModernCard = ({ 
  children, 
  style, 
  elevated = true 
}) => (
  <View style={[
    styles.card, 
    elevated && styles.cardElevated,
    style
  ]}>
    {children}
  </View>
);

// Modern Button Component
interface ModernButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: string;
  rightIcon?: string;
}

export const ModernButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
}) => {
  const getButtonStyle = () => {
    let combinedStyle = { ...styles.button };
    
    // Add variant style
    switch (variant) {
      case 'primary':
        combinedStyle = { ...combinedStyle, ...styles.buttonPrimary };
        break;
      case 'secondary':
        combinedStyle = { ...combinedStyle, ...styles.buttonSecondary };
        break;
      case 'danger':
        combinedStyle = { ...combinedStyle, ...styles.buttonDanger };
        break;
      case 'success':
        combinedStyle = { ...combinedStyle, ...styles.buttonSuccess };
        break;
    }
    
    // Add size style
    switch (size) {
      case 'sm':
        combinedStyle = { ...combinedStyle, ...styles.buttonSm };
        break;
      case 'md':
        combinedStyle = { ...combinedStyle, ...styles.buttonMd };
        break;
      case 'lg':
        combinedStyle = { ...combinedStyle, ...styles.buttonLg };
        break;
    }
    
    if (fullWidth) {
      combinedStyle = { ...combinedStyle, ...styles.buttonFullWidth };
    }
    
    return combinedStyle;
  };

  const getTextStyle = () => {
    let combinedStyle = { ...styles.buttonText };
    
    switch (variant) {
      case 'primary':
        combinedStyle = { ...combinedStyle, ...styles.buttonTextPrimary };
        break;
      case 'secondary':
        combinedStyle = { ...combinedStyle, ...styles.buttonTextSecondary };
        break;
      case 'danger':
        combinedStyle = { ...combinedStyle, ...styles.buttonTextDanger };
        break;
      case 'success':
        combinedStyle = { ...combinedStyle, ...styles.buttonTextSuccess };
        break;
    }
    
    return combinedStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {leftIcon && <Text style={[getTextStyle(), styles.buttonIcon]}>{leftIcon}</Text>}
        <Text style={getTextStyle()}>{title}</Text>
        {rightIcon && <Text style={[getTextStyle(), styles.buttonIcon]}>{rightIcon}</Text>}
      </View>
    </TouchableOpacity>
  );
};

// Modern Modal Component
interface ModernModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  showCloseButton?: boolean;
}

export const ModernModal = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          {showCloseButton && (
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.modalBody}>
          {children}
        </View>
      </View>
    </View>
  </Modal>
);

// Modern Input Component
interface ModernInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  leftIcon?: string;
  rightIcon?: ReactNode;
  style?: any;
}

export const ModernInput = ({
  value,
  onChangeText,
  placeholder,
  leftIcon,
  rightIcon,
  style,
}) => (
  <View style={[styles.inputContainer, style]}>
    {leftIcon && <Text style={styles.inputIcon}>{leftIcon}</Text>}
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={THEME_COLORS.textTertiary}
      value={value}
      onChangeText={onChangeText}
    />
    {rightIcon && rightIcon}
  </View>
);

// Material Card Component
interface MaterialCardProps {
  id: string;
  title: string;
  subject: string;
  author: string;
  uploadDate: string;
  downloadCount: number;
  fileType: string;
  onPress: () => void;
  onShare?: () => void;
}

export const MaterialCard = ({
  title,
  subject,
  author,
  uploadDate,
  downloadCount,
  fileType,
  onPress,
  onShare,
}) => {
  const getFileTypeColor = () => {
    switch (fileType.toLowerCase()) {
      case 'pdf': return THEME_COLORS.error;
      case 'doc':
      case 'docx': return THEME_COLORS.primary;
      case 'ppt':
      case 'pptx': return THEME_COLORS.warning;
      case 'xls':
      case 'xlsx': return THEME_COLORS.success;
      default: return THEME_COLORS.textSecondary;
    }
  };

  return (
    <TouchableOpacity
      style={styles.materialCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.materialHeader}>
        <View style={[styles.fileTypeIcon, { backgroundColor: getFileTypeColor() }]}>
          <Text style={styles.fileTypeText}>{fileType.toUpperCase()}</Text>
        </View>
        <View style={styles.materialInfo}>
          <Text style={styles.materialTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.materialSubject}>{subject}</Text>
        </View>
        {onShare && (
          <TouchableOpacity
            style={styles.shareButton}
            onPress={onShare}
          >
            <Text style={styles.shareButtonText}>📤</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.materialFooter}>
        <Text style={styles.materialAuthor}>By {author}</Text>
        <Text style={styles.materialStats}>
          📥 {downloadCount} • {new Date(uploadDate).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// User Stats Component
interface UserStatsProps {
  uploads: number;
  downloads: number;
  favorites: number;
  points: number;
}

export const UserStats = ({
  uploads,
  downloads,
  favorites,
  points,
}) => {
  const stats = [
    { label: 'Uploads', value: uploads, icon: '⬆️', color: THEME_COLORS.primary },
    { label: 'Downloads', value: downloads, icon: '📥', color: THEME_COLORS.success },
    { label: 'Favorites', value: favorites, icon: '❤️', color: THEME_COLORS.error },
    { label: 'Points', value: points, icon: '⭐', color: THEME_COLORS.warning },
  ];

  return (
    <ModernCard style={styles.statsCard}>
      <Text style={styles.statsTitle}>Your Activity</Text>
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>
              {stat.value.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </ModernCard>
  );
};

// Loading Component
interface LoadingProps {
  message?: string;
}

export const Loading = ({ message = "Loading..." }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={THEME_COLORS.primary} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// Styles
const styles = StyleSheet.create({
  // Card Styles
  card: {
    backgroundColor: THEME_COLORS.surface,
    borderRadius: UI_CONSTANTS.borderRadius.lg,
    padding: UI_CONSTANTS.spacing.lg,
    marginBottom: UI_CONSTANTS.spacing.md,
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Button Styles
  button: {
    borderRadius: UI_CONSTANTS.borderRadius.lg,
    paddingVertical: UI_CONSTANTS.spacing.md,
    paddingHorizontal: UI_CONSTANTS.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: THEME_COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: THEME_COLORS.surface,
    borderWidth: 1,
    borderColor: THEME_COLORS.outline,
  },
  buttonDanger: {
    backgroundColor: THEME_COLORS.error,
  },
  buttonSuccess: {
    backgroundColor: THEME_COLORS.success,
  },
  buttonSm: {
    paddingVertical: UI_CONSTANTS.spacing.sm,
    paddingHorizontal: UI_CONSTANTS.spacing.md,
  },
  buttonMd: {
    paddingVertical: UI_CONSTANTS.spacing.md,
    paddingHorizontal: UI_CONSTANTS.spacing.lg,
  },
  buttonLg: {
    paddingVertical: UI_CONSTANTS.spacing.lg,
    paddingHorizontal: UI_CONSTANTS.spacing.xl,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  buttonTextPrimary: {
    color: THEME_COLORS.textInverse,
  },
  buttonTextSecondary: {
    color: THEME_COLORS.text,
  },
  buttonTextDanger: {
    color: THEME_COLORS.textInverse,
  },
  buttonTextSuccess: {
    color: THEME_COLORS.textInverse,
  },
  buttonIcon: {
    marginHorizontal: UI_CONSTANTS.spacing.xs,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONSTANTS.spacing.lg,
  },
  modalContent: {
    backgroundColor: THEME_COLORS.surface,
    borderRadius: UI_CONSTANTS.borderRadius.xl,
    width: '100%',
    maxWidth: screenWidth * 0.9,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI_CONSTANTS.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.outline,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME_COLORS.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: THEME_COLORS.textSecondary,
  },
  modalBody: {
    padding: UI_CONSTANTS.spacing.lg,
  },

  // Input Styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.surface,
    borderRadius: UI_CONSTANTS.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME_COLORS.outline,
    paddingHorizontal: UI_CONSTANTS.spacing.md,
    paddingVertical: UI_CONSTANTS.spacing.sm,
  },
  inputIcon: {
    fontSize: 18,
    color: THEME_COLORS.textSecondary,
    marginRight: UI_CONSTANTS.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: THEME_COLORS.text,
    paddingVertical: UI_CONSTANTS.spacing.sm,
  },

  // Material Card Styles
  materialCard: {
    backgroundColor: THEME_COLORS.surface,
    borderRadius: UI_CONSTANTS.borderRadius.lg,
    padding: UI_CONSTANTS.spacing.lg,
    marginHorizontal: UI_CONSTANTS.spacing.lg,
    marginBottom: UI_CONSTANTS.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: UI_CONSTANTS.spacing.md,
  },
  fileTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: UI_CONSTANTS.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: UI_CONSTANTS.spacing.md,
  },
  fileTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: THEME_COLORS.textInverse,
  },
  materialInfo: {
    flex: 1,
  },
  materialTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME_COLORS.text,
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  materialSubject: {
    fontSize: 14,
    color: THEME_COLORS.primary,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  shareButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME_COLORS.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    fontSize: 16,
  },
  materialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  materialAuthor: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  materialStats: {
    fontSize: 14,
    color: THEME_COLORS.textTertiary,
  },

  // Stats Styles
  statsCard: {
    marginHorizontal: UI_CONSTANTS.spacing.lg,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: THEME_COLORS.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '500',
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONSTANTS.spacing.xxl,
  },
  loadingText: {
    fontSize: 16,
    color: THEME_COLORS.textSecondary,
    marginTop: UI_CONSTANTS.spacing.md,
  },
});

export default {
  ModernCard,
  ModernButton,
  ModernModal,
  ModernInput,
  MaterialCard,
  UserStats,
  Loading,
};
