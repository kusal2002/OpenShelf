/**
 * Enhanced Profile Screen Component  
 * Modern UI for user profile and settings with existing type structure
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { supabaseService } from '../services/supabase';
import { 
  User, 
  AuthUser, 
  MainTabParamList, 
  LoadingState 
} from '../types';
import {
  CacheManager,
  NetworkUtils,
  UIUtils,
  UIComponents,
  ErrorHandler,
  DateUtils,
  FileUtils,
  THEME_COLORS,
  UI_CONSTANTS,
} from '../utils';
import { useTheme } from '../contexts/ThemeContext';

type Props = NativeStackScreenProps<MainTabParamList, 'Profile'>;

interface ProfileStats {
  totalMaterials: number;
  totalDownloads: number;
}

interface AppSettings {
  darkMode: boolean;
  notifications: boolean;
  autoDownload: boolean;
  offlineMode: boolean;
}

export const ProfileScreen = ({ navigation }: Props) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    totalMaterials: 0,
    totalDownloads: 0,
  });
  const [appSettings, setAppSettings] = useState<AppSettings>({
    darkMode: isDark,
    notifications: true,
    autoDownload: false,
    offlineMode: false,
  });
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [isOnline, setIsOnline] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = NetworkUtils.subscribeToNetworkStatus(setIsOnline);
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadProfileData();
  }, []);

  // Sync dark mode setting with theme context
  useEffect(() => {
    setAppSettings(prev => ({
      ...prev,
      darkMode: isDark,
    }));
  }, [isDark]);

  const loadProfileData = async () => {
    try {
      setLoadingState('loading');

      // Get current user
      const userResponse = await supabaseService.getCurrentUser();
      if (!userResponse.success || !userResponse.data) {
        // Handle logout by showing alert and clearing cache
        await CacheManager.clearCache();
        UIUtils.showAlert('Session Expired', 'Please sign in again to continue.');
        return;
      }

      setCurrentUser(userResponse.data);

      if (isOnline) {
        // Get user materials for statistics
        const materialsResponse = await supabaseService.getUserMaterials(userResponse.data.id);
        if (materialsResponse.success && materialsResponse.data) {
          const materials = materialsResponse.data;
          const totalDownloads = materials.reduce((sum, material) => sum + (material.download_count || 0), 0);
          
          setProfileStats({
            totalMaterials: materials.length,
            totalDownloads: totalDownloads,
          });
        }
      }

      setLoadingState('success');
    } catch (error) {
      ErrorHandler.handle(error, 'Load profile error');
      setLoadingState('error');
    }
  };

  const updateAppSetting = async <K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ) => {
    try {
      const newSettings = { ...appSettings, [key]: value };
      setAppSettings(newSettings);
      
      // Handle dark mode toggle
      if (key === 'darkMode') {
        toggleTheme();
      }
      
      // In a real app, you would save other settings to AsyncStorage
      if (key !== 'darkMode') {
        UIUtils.showAlert('Settings Updated', `${key} setting has been updated.`);
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Update settings error');
    }
  };

  const handleLogout = async () => {
    try {
      const response = await supabaseService.signOut();
      if (response.success) {
        await CacheManager.clearCache();
        UIUtils.showAlert('Success', 'You have been signed out successfully.');
        // In a real app, you would navigate to auth screen
      } else {
        UIUtils.showAlert('Error', response.error || 'Failed to sign out.');
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Logout error');
      UIUtils.showAlert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const clearCache = async () => {
    try {
      await CacheManager.clearCache();
      UIUtils.showAlert('Success', 'App cache has been cleared.');
    } catch (error) {
      ErrorHandler.handle(error, 'Clear cache error');
      UIUtils.showAlert('Error', 'Failed to clear cache.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  // Create dynamic styles based on current theme (MUST be before rendering)
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: UI_CONSTANTS.spacing.lg,
      backgroundColor: colors.surface,
      marginBottom: UI_CONSTANTS.spacing.md,
      ...UI_CONSTANTS.elevation[2],
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      ...UI_CONSTANTS.elevation[3],
    },
    avatarText: {
      ...UI_CONSTANTS.typography.h3,
      color: colors.primary,
      fontWeight: 'bold',
    },
    onlineIndicator: {
      borderColor: colors.surface,
    },
    userName: {
      ...UI_CONSTANTS.typography.h5,
      color: colors.text,
      fontWeight: 'bold',
      marginBottom: UI_CONSTANTS.spacing.xs,
    },
    userEmail: {
      ...UI_CONSTANTS.typography.body2,
      color: colors.textSecondary,
      marginBottom: UI_CONSTANTS.spacing.xs,
    },
    joinDate: {
      ...UI_CONSTANTS.typography.caption,
      color: colors.textTertiary,
    },
    sectionTitle: {
      ...UI_CONSTANTS.typography.h6,
      color: colors.text,
      marginBottom: UI_CONSTANTS.spacing.md,
      fontWeight: '600',
    },
    statsContainer: {
      backgroundColor: colors.surface,
      padding: UI_CONSTANTS.spacing.lg,
      marginBottom: UI_CONSTANTS.spacing.md,
      ...UI_CONSTANTS.elevation[1],
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      padding: UI_CONSTANTS.spacing.md,
      backgroundColor: colors.surfaceVariant,
      borderRadius: UI_CONSTANTS.borderRadius.md,
      ...UI_CONSTANTS.elevation[1],
    },
    statNumber: {
      ...UI_CONSTANTS.typography.h4,
      color: colors.primary,
      fontWeight: 'bold',
      marginBottom: UI_CONSTANTS.spacing.xs,
    },
    statLabel: {
      ...UI_CONSTANTS.typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    settingsContainer: {
      backgroundColor: colors.surface,
      padding: UI_CONSTANTS.spacing.lg,
      marginBottom: UI_CONSTANTS.spacing.md,
      ...UI_CONSTANTS.elevation[1],
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: UI_CONSTANTS.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    settingTitle: {
      ...UI_CONSTANTS.typography.body1,
      color: colors.text,
      fontWeight: '500',
      marginBottom: UI_CONSTANTS.spacing.xs,
    },
    settingSubtitle: {
      ...UI_CONSTANTS.typography.caption,
      color: colors.textSecondary,
    },
    actionsContainer: {
      backgroundColor: colors.surface,
      padding: UI_CONSTANTS.spacing.lg,
      marginBottom: UI_CONSTANTS.spacing.md,
      ...UI_CONSTANTS.elevation[1],
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: UI_CONSTANTS.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    actionTitle: {
      ...UI_CONSTANTS.typography.body1,
      color: colors.text,
      fontWeight: '500',
      marginBottom: UI_CONSTANTS.spacing.xs,
    },
    actionSubtitle: {
      ...UI_CONSTANTS.typography.caption,
      color: colors.textSecondary,
    },
    actionArrow: {
      ...UI_CONSTANTS.typography.h4,
      color: colors.textTertiary,
    },
    dangerButton: {
      backgroundColor: colors.error,
    },
    dangerButtonText: {
      color: colors.white,
    },
    footer: {
      padding: UI_CONSTANTS.spacing.xl,
      alignItems: 'center',
    },
    footerText: {
      ...UI_CONSTANTS.typography.caption,
      color: colors.textTertiary,
      textAlign: 'center',
      marginBottom: UI_CONSTANTS.spacing.xs,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: UI_CONSTANTS.spacing.xl,
    },
    loadingText: {
      ...UI_CONSTANTS.typography.body1,
      color: colors.textSecondary,
      marginTop: UI_CONSTANTS.spacing.md,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: UI_CONSTANTS.spacing.xl,
    },
    errorTitle: {
      ...UI_CONSTANTS.typography.h5,
      color: colors.error,
      textAlign: 'center',
      marginBottom: UI_CONSTANTS.spacing.md,
    },
    errorMessage: {
      ...UI_CONSTANTS.typography.body1,
      color: colors.text,
      textAlign: 'center',
      marginBottom: UI_CONSTANTS.spacing.lg,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: UI_CONSTANTS.spacing.xl,
      paddingVertical: UI_CONSTANTS.spacing.md,
      borderRadius: UI_CONSTANTS.borderRadius.md,
      ...UI_CONSTANTS.elevation[2],
    },
    retryButtonText: {
      ...UI_CONSTANTS.typography.body1,
      color: colors.white,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '85%',
      backgroundColor: colors.surface,
      borderRadius: UI_CONSTANTS.borderRadius.lg,
      padding: UI_CONSTANTS.spacing.xl,
      ...UI_CONSTANTS.elevation[4],
    },
    modalTitle: {
      ...UI_CONSTANTS.typography.h5,
      color: colors.text,
      fontWeight: 'bold',
      marginBottom: UI_CONSTANTS.spacing.md,
      textAlign: 'center',
    },
    modalMessage: {
      ...UI_CONSTANTS.typography.body1,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: UI_CONSTANTS.spacing.xl,
    },
    modalButton: {
      paddingVertical: UI_CONSTANTS.spacing.md,
      paddingHorizontal: UI_CONSTANTS.spacing.xl,
      borderRadius: UI_CONSTANTS.borderRadius.md,
      alignItems: 'center',
      marginBottom: UI_CONSTANTS.spacing.sm,
    },
    confirmButton: {
      backgroundColor: colors.error,
    },
    cancelButton: {
      backgroundColor: colors.outline,
    },
    modalButtonText: {
      ...UI_CONSTANTS.typography.body1,
      fontWeight: '600',
    },
    confirmButtonText: {
      color: colors.white,
    },
    cancelButtonText: {
      color: colors.text,
    },
  });

  // Early returns for loading and error states
  if (loadingState === 'loading') {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={dynamicStyles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadingState === 'error') {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={dynamicStyles.errorTitle}>Unable to load profile</Text>
          <Text style={dynamicStyles.errorMessage}>
            {isOnline 
              ? 'There was a problem loading your profile. Please try again.'
              : 'You appear to be offline. Please check your internet connection.'
            }
          </Text>
          <TouchableOpacity style={dynamicStyles.retryButton} onPress={() => loadProfileData()}>
            <Text style={dynamicStyles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderProfileHeader = () => (
    <View style={dynamicStyles.profileHeader}>
      <View style={styles.avatarContainer}>
        <View style={dynamicStyles.avatar}>
          <Text style={dynamicStyles.avatarText}>
            {currentUser?.email?.charAt(0).toUpperCase() || '👤'}
          </Text>
        </View>
        <View style={[styles.onlineIndicator, dynamicStyles.onlineIndicator, { backgroundColor: isOnline ? colors.success : colors.warning }]} />
      </View>

      <View style={styles.profileInfo}>
        <Text style={dynamicStyles.userName}>
          {currentUser?.name || currentUser?.email || 'User'}
        </Text>
        <Text style={dynamicStyles.userEmail}>{currentUser?.email}</Text>
        <Text style={dynamicStyles.joinDate}>
          Member since {DateUtils.formatDate(currentUser?.created_at || new Date().toISOString())}
        </Text>
      </View>
    </View>
  );

  const renderProfileStats = () => (
    <View style={dynamicStyles.statsContainer}>
      <Text style={dynamicStyles.sectionTitle}>📊 Your Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={dynamicStyles.statCard}>
          <Text style={dynamicStyles.statNumber}>{profileStats.totalMaterials}</Text>
          <Text style={dynamicStyles.statLabel}>Materials Shared</Text>
        </View>
        
        <View style={dynamicStyles.statCard}>
          <Text style={dynamicStyles.statNumber}>{profileStats.totalDownloads}</Text>
          <Text style={dynamicStyles.statLabel}>Total Downloads</Text>
        </View>
        
        <View style={dynamicStyles.statCard}>
          <Text style={dynamicStyles.statNumber}>{isOnline ? '🌐' : '📱'}</Text>
          <Text style={dynamicStyles.statLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
        
        <View style={dynamicStyles.statCard}>
          <Text style={dynamicStyles.statNumber}>
            {profileStats.totalMaterials > 0 
              ? Math.round(profileStats.totalDownloads / profileStats.totalMaterials) 
              : 0
            }
          </Text>
          <Text style={dynamicStyles.statLabel}>Avg Downloads</Text>
        </View>
      </View>
    </View>
  );

  const renderAppSettings = () => (
    <View style={dynamicStyles.settingsContainer}>
      <Text style={dynamicStyles.sectionTitle}>⚙️ App Settings</Text>
      
      <View style={dynamicStyles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={dynamicStyles.settingTitle}>🌙 Dark Mode</Text>
          <Text style={dynamicStyles.settingSubtitle}>Use dark theme throughout the app</Text>
        </View>
        <Switch
          value={appSettings.darkMode}
          onValueChange={(value) => updateAppSetting('darkMode', value)}
          trackColor={{ false: colors.outline, true: colors.primaryLight }}
          thumbColor={appSettings.darkMode ? colors.primary : colors.surface}
        />
      </View>

      <View style={dynamicStyles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={dynamicStyles.settingTitle}>🔔 Push Notifications</Text>
          <Text style={dynamicStyles.settingSubtitle}>Get notified about new materials and updates</Text>
        </View>
        <Switch
          value={appSettings.notifications}
          onValueChange={(value) => updateAppSetting('notifications', value)}
          trackColor={{ false: colors.outline, true: colors.primaryLight }}
          thumbColor={appSettings.notifications ? colors.primary : colors.surface}
        />
      </View>

      <View style={dynamicStyles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={dynamicStyles.settingTitle}>📥 Auto Download</Text>
          <Text style={dynamicStyles.settingSubtitle}>Automatically download materials for offline use</Text>
        </View>
        <Switch
          value={appSettings.autoDownload}
          onValueChange={(value) => updateAppSetting('autoDownload', value)}
          trackColor={{ false: colors.outline, true: colors.primaryLight }}
          thumbColor={appSettings.autoDownload ? colors.primary : colors.surface}
        />
      </View>

      <View style={dynamicStyles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={dynamicStyles.settingTitle}>📱 Offline Mode</Text>
          <Text style={dynamicStyles.settingSubtitle}>Prioritize offline functionality</Text>
        </View>
        <Switch
          value={appSettings.offlineMode}
          onValueChange={(value) => updateAppSetting('offlineMode', value)}
          trackColor={{ false: colors.outline, true: colors.primaryLight }}
          thumbColor={appSettings.offlineMode ? colors.primary : colors.surface}
        />
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={dynamicStyles.actionsContainer}>
      <Text style={dynamicStyles.sectionTitle}>🛠️ Account Actions</Text>
      
      <TouchableOpacity style={dynamicStyles.actionButton} onPress={() => navigation.navigate('Library')}>
        <Text style={styles.actionIcon}>📚</Text>
        <View style={styles.actionInfo}>
          <Text style={dynamicStyles.actionTitle}>My Library</Text>
          <Text style={dynamicStyles.actionSubtitle}>View and manage your materials</Text>
        </View>
        <Text style={dynamicStyles.actionArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={dynamicStyles.actionButton} onPress={() => navigation.navigate('Upload')}>
        <Text style={styles.actionIcon}>📤</Text>
        <View style={styles.actionInfo}>
          <Text style={dynamicStyles.actionTitle}>Upload Material</Text>
          <Text style={dynamicStyles.actionSubtitle}>Share study materials with others</Text>
        </View>
        <Text style={dynamicStyles.actionArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={dynamicStyles.actionButton} onPress={clearCache}>
        <Text style={styles.actionIcon}>🗑️</Text>
        <View style={styles.actionInfo}>
          <Text style={dynamicStyles.actionTitle}>Clear Cache</Text>
          <Text style={dynamicStyles.actionSubtitle}>Free up storage space</Text>
        </View>
        <Text style={dynamicStyles.actionArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={dynamicStyles.actionButton}
        onPress={() => UIUtils.showAlert('Help & Support', 'Contact support at help@openshelf.edu or visit our FAQ section in the app.')}
      >
        <Text style={styles.actionIcon}>❓</Text>
        <View style={styles.actionInfo}>
          <Text style={dynamicStyles.actionTitle}>Help & Support</Text>
          <Text style={dynamicStyles.actionSubtitle}>Get help or contact support</Text>
        </View>
        <Text style={dynamicStyles.actionArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[dynamicStyles.actionButton, styles.logoutButton]}
        onPress={() => setShowLogoutModal(true)}
      >
        <Text style={styles.actionIcon}>🚪</Text>
        <View style={styles.actionInfo}>
          <Text style={[dynamicStyles.actionTitle, styles.logoutTitle]}>Sign Out</Text>
          <Text style={dynamicStyles.actionSubtitle}>Sign out of your account</Text>
        </View>
        <Text style={dynamicStyles.actionArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLogoutModal = () => (
    <Modal
      visible={showLogoutModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowLogoutModal(false)}
    >
      <View style={dynamicStyles.modalOverlay}>
        <View style={dynamicStyles.modalContent}>
          <Text style={styles.logoutModalIcon}>👋</Text>
          <Text style={dynamicStyles.modalTitle}>Sign Out</Text>
          <Text style={dynamicStyles.modalMessage}>
            Are you sure you want to sign out? You'll need to sign in again to access your materials.
          </Text>
          
          <View style={styles.logoutModalActions}>
            <TouchableOpacity
              style={[dynamicStyles.modalButton, dynamicStyles.cancelButton]}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={[dynamicStyles.modalButtonText, dynamicStyles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[dynamicStyles.modalButton, dynamicStyles.confirmButton]}
              onPress={() => {
                setShowLogoutModal(false);
                handleLogout();
              }}
            >
              <Text style={[dynamicStyles.modalButtonText, dynamicStyles.confirmButtonText]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loadingState === 'loading') {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={dynamicStyles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadingState === 'error') {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={dynamicStyles.errorTitle}>Unable to load profile</Text>
          <Text style={dynamicStyles.errorMessage}>
            {isOnline 
              ? 'There was a problem loading your profile. Please try again.'
              : 'You appear to be offline. Please check your internet connection.'
            }
          </Text>
          <TouchableOpacity style={dynamicStyles.retryButton} onPress={() => loadProfileData()}>
            <Text style={dynamicStyles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderProfileHeader()}
        {renderProfileStats()}
        {renderAppSettings()}
        {renderActions()}
        
        <View style={dynamicStyles.footer}>
          <Text style={dynamicStyles.footerText}>
            OpenShelf University Library v1.0.0
          </Text>
          <Text style={dynamicStyles.footerText}>
            Made with ❤️ for students
          </Text>
        </View>
      </ScrollView>
      
      {renderLogoutModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI_CONSTANTS.spacing.lg,
    backgroundColor: THEME_COLORS.surface,
    marginBottom: UI_CONSTANTS.spacing.md,
    ...UI_CONSTANTS.elevation[2],
  },
  avatarContainer: {
    position: 'relative',
    marginRight: UI_CONSTANTS.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME_COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...UI_CONSTANTS.elevation[3],
  },
  avatarText: {
    ...UI_CONSTANTS.typography.h3,
    color: THEME_COLORS.primary,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: THEME_COLORS.surface,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    ...UI_CONSTANTS.typography.h5,
    color: THEME_COLORS.text,
    fontWeight: '600',
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  userEmail: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  joinDate: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textTertiary,
  },
  sectionTitle: {
    ...UI_CONSTANTS.typography.h5,
    color: THEME_COLORS.text,
    fontWeight: '600',
    marginBottom: UI_CONSTANTS.spacing.md,
  },
  statsContainer: {
    padding: UI_CONSTANTS.spacing.lg,
    backgroundColor: THEME_COLORS.surface,
    marginBottom: UI_CONSTANTS.spacing.md,
    ...UI_CONSTANTS.elevation[1],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: THEME_COLORS.background,
    borderRadius: UI_CONSTANTS.borderRadius.md,
    padding: UI_CONSTANTS.spacing.md,
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.spacing.sm,
    ...UI_CONSTANTS.elevation[1],
  },
  statNumber: {
    ...UI_CONSTANTS.typography.h4,
    color: THEME_COLORS.primary,
    fontWeight: 'bold',
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  statLabel: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  settingsContainer: {
    padding: UI_CONSTANTS.spacing.lg,
    backgroundColor: THEME_COLORS.surface,
    marginBottom: UI_CONSTANTS.spacing.md,
    ...UI_CONSTANTS.elevation[1],
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.outline,
    marginBottom: UI_CONSTANTS.spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: UI_CONSTANTS.spacing.md,
  },
  settingTitle: {
    ...UI_CONSTANTS.typography.body1,
    color: THEME_COLORS.text,
    fontWeight: '500',
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  settingSubtitle: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textSecondary,
    lineHeight: 16,
  },
  actionsContainer: {
    padding: UI_CONSTANTS.spacing.lg,
    backgroundColor: THEME_COLORS.surface,
    marginBottom: UI_CONSTANTS.spacing.md,
    ...UI_CONSTANTS.elevation[1],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.outline,
    marginBottom: UI_CONSTANTS.spacing.sm,
  },
  logoutButton: {
    borderBottomWidth: 0,
    backgroundColor: THEME_COLORS.errorLight,
    borderRadius: UI_CONSTANTS.borderRadius.sm,
    paddingHorizontal: UI_CONSTANTS.spacing.sm,
    marginTop: UI_CONSTANTS.spacing.sm,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: UI_CONSTANTS.spacing.md,
    width: 32,
    textAlign: 'center',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    ...UI_CONSTANTS.typography.body1,
    color: THEME_COLORS.text,
    fontWeight: '500',
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  logoutTitle: {
    color: THEME_COLORS.error,
  },
  actionSubtitle: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textSecondary,
    lineHeight: 16,
  },
  actionArrow: {
    fontSize: 24,
    color: THEME_COLORS.textTertiary,
  },
  footer: {
    alignItems: 'center',
    padding: UI_CONSTANTS.spacing.xl,
    marginTop: UI_CONSTANTS.spacing.lg,
  },
  footerText: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: UI_CONSTANTS.spacing.xxl,
  },
  loadingText: {
    ...UI_CONSTANTS.typography.body1,
    color: THEME_COLORS.textSecondary,
    marginTop: UI_CONSTANTS.spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: UI_CONSTANTS.spacing.xxl,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: UI_CONSTANTS.spacing.lg,
  },
  errorTitle: {
    ...UI_CONSTANTS.typography.h5,
    color: THEME_COLORS.text,
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.spacing.sm,
  },
  errorSubtitle: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: UI_CONSTANTS.spacing.lg,
  },
  retryButton: {
    ...UIComponents.getButtonStyle('primary'),
    backgroundColor: THEME_COLORS.primary,
    paddingHorizontal: UI_CONSTANTS.spacing.xl,
  },
  retryButtonText: {
    ...UI_CONSTANTS.typography.body1,
    color: THEME_COLORS.textInverse,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutModal: {
    backgroundColor: THEME_COLORS.surface,
    borderRadius: UI_CONSTANTS.borderRadius.lg,
    padding: UI_CONSTANTS.spacing.xl,
    margin: UI_CONSTANTS.spacing.lg,
    maxWidth: '90%',
    alignItems: 'center',
    ...UI_CONSTANTS.elevation[3],
  },
  logoutModalIcon: {
    fontSize: 64,
    marginBottom: UI_CONSTANTS.spacing.lg,
  },
  logoutModalTitle: {
    ...UI_CONSTANTS.typography.h5,
    color: THEME_COLORS.text,
    fontWeight: '600',
    marginBottom: UI_CONSTANTS.spacing.sm,
    textAlign: 'center',
  },
  logoutModalSubtitle: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: UI_CONSTANTS.spacing.xl,
  },
  logoutModalActions: {
    flexDirection: 'row',
    gap: UI_CONSTANTS.spacing.md,
  },
  logoutModalCancel: {
    ...UIComponents.getButtonStyle('secondary'),
    backgroundColor: THEME_COLORS.surfaceVariant,
    flex: 1,
  },
  logoutModalCancelText: {
    ...UI_CONSTANTS.typography.body1,
    color: THEME_COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutModalConfirm: {
    ...UIComponents.getButtonStyle('primary'),
    backgroundColor: THEME_COLORS.error,
    flex: 1,
  },
  logoutModalConfirmText: {
    ...UI_CONSTANTS.typography.body1,
    color: THEME_COLORS.textInverse,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ProfileScreen;
