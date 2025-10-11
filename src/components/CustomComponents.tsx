/**
 * OpenShelf Custom Components
 * Modern UI components using React Native
 */

import React, { ReactNode } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Pressable,
  Platform,
} from 'react-native';

// Colors and Theme
const COLORS = {
  primary: '#2563eb',
  primary50: '#eff6ff',
  primary100: '#dbeafe',
  primary500: '#3b82f6',
  primary600: '#2563eb',
  primary700: '#1d4ed8',
  secondary: '#64748b',
  success: '#2563eb',
  warning: '#f59e0b',
  error: '#ef4444',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  white: '#ffffff',
  black: '#000000',
};

// Types
interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  showCloseButton?: boolean;
}

export function CustomModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  showCloseButton = true 
}: CustomModalProps) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            {showCloseButton && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
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
}

// Confirmation Modal
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary'
}: ConfirmationModalProps) {
  const getVariantColor = () => {
    switch (variant) {
      case 'danger':
        return COLORS.error;
      case 'warning':
        return COLORS.warning;
      default:
        return COLORS.primary600;
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.confirmationModalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: getVariantColor() }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: getVariantColor() }]} 
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Progress Modal
interface ProgressModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  progress: number;
  showCancel?: boolean;
  onCancel?: () => void;
}

export function ProgressModal({
  isOpen,
  title,
  message,
  progress,
  showCancel = false,
  onCancel
}: ProgressModalProps) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.progressModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={styles.messageText}>{message}</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(progress)}% Complete
              </Text>
            </View>
            
            <View style={styles.spinnerContainer}>
              <ActivityIndicator size="large" color={COLORS.primary500} />
            </View>
          </View>
          
          {showCancel && onCancel && (
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// Material Card Component
interface MaterialCardProps {
  title: string;
  author: string;
  subject: string;
  type: 'PDF' | 'DOC' | 'PPT' | 'VIDEO' | 'IMAGE';
  uploadDate: string;
  downloadCount: number;
  rating?: number;
  thumbnail?: string;
  onView: () => void;
  onDownload: () => void;
  onShare?: () => void;
}

export function MaterialCard({
  title,
  author,
  subject,
  type,
  uploadDate,
  downloadCount,
  rating,
  thumbnail,
  onView,
  onDownload,
  onShare
}: MaterialCardProps) {
  const getFileTypeColor = () => {
    switch (type) {
      case 'PDF':
        return COLORS.error;
      case 'DOC':
        return COLORS.primary600;
      case 'PPT':
        return COLORS.warning;
      case 'VIDEO':
        return COLORS.success;
      default:
        return COLORS.gray500;
    }
  };

  return (
    <View style={styles.materialCard}>
      {/* Header Row */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, styles.subjectBadge]}>
              <Text style={styles.subjectBadgeText}>{subject}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getFileTypeColor() }]}>
              <Text style={styles.typeBadgeText}>{type}</Text>
            </View>
          </View>
        </View>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {author.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Author and Date */}
      <View style={styles.cardMetadata}>
        <Text style={styles.authorText}>By {author}</Text>
        <Text style={styles.dateText}>
          {new Date(uploadDate).toLocaleDateString()}
        </Text>
      </View>

      {/* Stats Row */}
      <View style={styles.cardStats}>
        <Text style={styles.statsText}>
          📥 {downloadCount} downloads
        </Text>
        {rating && (
          <Text style={styles.ratingText}>
            ⭐ {rating.toFixed(1)}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.viewButton]} 
          onPress={onView}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.downloadButton]} 
          onPress={onDownload}
        >
          <Text style={styles.downloadButtonText}>Download</Text>
        </TouchableOpacity>
        {onShare && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.shareButton]} 
            onPress={onShare}
          >
            <Text style={styles.shareButtonText}>📤</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// User Stats Card
interface UserStatsProps {
  stats: Array<{
    icon: string;
    value: number;
    label: string;
    color: string;
  }>;
}

export function UserStats({ stats }: UserStatsProps) {
  return (
    <View style={styles.statsCard}>
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
    </View>
  );
}

// Modern Input Component
interface ModernInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  type?: 'text' | 'email' | 'password' | 'phone';
  isRequired?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function ModernInput({
  label,
  placeholder,
  value,
  onChangeText,
  type = 'text',
  isRequired = false,
  isInvalid = false,
  errorMessage,
  leftIcon,
  rightIcon
}: ModernInputProps) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label} {isRequired && <Text style={styles.requiredMark}>*</Text>}
      </Text>
      <View style={[
        styles.inputWrapper,
        isInvalid && styles.inputError
      ]}>
        {leftIcon && <View style={styles.inputIcon}>{leftIcon}</View>}
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray400}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={type === 'password'}
          keyboardType={type === 'email' ? 'email-address' : 'default'}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          autoCorrect={type !== 'email'}
        />
        {rightIcon && <View style={styles.inputIcon}>{rightIcon}</View>}
      </View>
      {isInvalid && errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
    </View>
  );
}

// Action Button
interface ActionButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function ActionButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon
}: ActionButtonProps) {
  const getBackgroundColor = () => {
    if (isDisabled || isLoading) return COLORS.gray300;
    switch (variant) {
      case 'secondary':
        return COLORS.gray600;
      case 'success':
        return COLORS.success;
      case 'warning':
        return COLORS.warning;
      case 'danger':
        return COLORS.error;
      default:
        return COLORS.primary600;
    }
  };

  const getTextColor = () => {
    return variant === 'secondary' ? COLORS.gray100 : COLORS.white;
  };

  const buttonStyle = [
    styles.actionButtonBase,
    { backgroundColor: getBackgroundColor() },
    size === 'small' && styles.actionButtonSmall,
    size === 'large' && styles.actionButtonLarge,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <View style={styles.buttonContent}>
          {leftIcon && <View style={styles.buttonIcon}>{leftIcon}</View>}
          <Text style={[styles.actionButtonText, { color: getTextColor() }]}>
            {title}
          </Text>
          {rightIcon && <View style={styles.buttonIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

// Styles
const styles = StyleSheet.create({
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    minWidth: 300,
    maxWidth: '90%',
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  confirmationModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    width: '85%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  progressModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    width: '80%',
    maxWidth: 350,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray900,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.gray400,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.gray700,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Button Styles
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  cancelButtonText: {
    color: COLORS.gray600,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Progress Styles
  progressContainer: {
    marginVertical: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary500,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.gray600,
    textAlign: 'center',
    marginTop: 8,
  },
  spinnerContainer: {
    alignItems: 'center',
    marginTop: 16,
  },

  // Material Card Styles
  materialCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray900,
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  subjectBadge: {
    backgroundColor: COLORS.primary100,
  },
  subjectBadgeText: {
    color: COLORS.primary700,
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray600,
  },
  cardMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorText: {
    fontSize: 14,
    color: COLORS.gray600,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: COLORS.gray600,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.warning,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary600,
  },
  viewButtonText: {
    color: COLORS.primary600,
    fontSize: 14,
    fontWeight: '600',
  },
  downloadButton: {
    backgroundColor: COLORS.primary500,
  },
  downloadButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: COLORS.gray100,
    flex: 0,
    minWidth: 40,
  },
  shareButtonText: {
    fontSize: 16,
  },

  // Stats Card Styles
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray900,
    textAlign: 'center',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray600,
    textAlign: 'center',
  },

  // Input Styles
  inputContainer: {
    marginVertical: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray700,
    marginBottom: 8,
  },
  requiredMark: {
    color: COLORS.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.gray900,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },

  // Action Button Styles
  actionButtonBase: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionButtonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionButtonLarge: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default {
  CustomModal,
  ConfirmationModal,
  ProgressModal,
  MaterialCard,
  UserStats,
  ModernInput,
  ActionButton,
};
