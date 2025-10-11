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

type Props = NativeStackScreenProps<MainTabParamList, 'Profile'>;

interface ProfileStats {
  totalMaterials: number;
  totalDownloads: number;
  followersCount: number;
  followingCount: number;
}

interface AppSettings {
  darkMode: boolean;
  notifications: boolean;
  autoDownload: boolean;
  offlineMode: boolean;
}

export const ProfileScreen = ({ navigation }: Props) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    totalMaterials: 0,
    totalDownloads: 0,
    followersCount: 0,
    followingCount: 0,
  });
  const [appSettings, setAppSettings] = useState<AppSettings>({
    darkMode: false,
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

  // Add focus listener to refresh profile data when returning to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Refresh profile data when user returns to this screen
      // This will catch any changes from follow/unfollow actions
      loadProfileData();
    });
    
    return unsubscribe;
  }, [navigation]);

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
        
        // Get followers and following counts - always fetch fresh data
        const followersResponse = await supabaseService.getFollowers(userResponse.data.id);
        const followingResponse = await supabaseService.getFollowing(userResponse.data.id);
        
        if (materialsResponse.success && materialsResponse.data) {
          const materials = materialsResponse.data;
          const totalDownloads = materials.reduce((sum, material) => sum + (material.download_count || 0), 0);
          
          setProfileStats({
            totalMaterials: materials.length,
            totalDownloads: totalDownloads,
            followersCount: followersResponse.data?.length || 0,
            followingCount: followingResponse.data?.length || 0,
          });
        } else {
          // Even if materials fetch fails, still update social counts
          setProfileStats(prev => ({
            ...prev,
            followersCount: followersResponse.data?.length || 0,
            followingCount: followingResponse.data?.length || 0,
          }));
        }
      }

      setLoadingState('success');
    } catch (error) {
      ErrorHandler.handle(error, 'Load profile error');
      setLoadingState('error');
    }
  };

  // Add method to refresh just the social counts (lighter operation)
  const refreshSocialCounts = async () => {
    if (!currentUser || !isOnline) return;
    
    try {
      const followersResponse = await supabaseService.getFollowers(currentUser.id);
      const followingResponse = await supabaseService.getFollowing(currentUser.id);
      
      setProfileStats(prev => ({
        ...prev,
        followersCount: followersResponse.data?.length || 0,
        followingCount: followingResponse.data?.length || 0,
      }));
    } catch (error) {
      console.warn('Failed to refresh social counts:', error);
    }
  };

  const updateAppSetting = async <K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ) => {
    try {
      const newSettings = { ...appSettings, [key]: value };
      setAppSettings(newSettings);
      
      // In a real app, you would save to AsyncStorage
      UIUtils.showAlert('Settings Updated', `${key} setting has been updated.`);
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

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {currentUser?.email?.charAt(0).toUpperCase() || '👤'}
          </Text>
        </View>
        <View style={[styles.onlineIndicator, { backgroundColor: isOnline ? THEME_COLORS.success : THEME_COLORS.warning }]} />
      </View>

      <View style={styles.profileInfo}>
        <Text style={styles.userName}>
          {currentUser?.name || currentUser?.email || 'User'}
        </Text>
        <Text style={styles.userEmail}>{currentUser?.email}</Text>
        <Text style={styles.joinDate}>
          Member since {DateUtils.formatDate(currentUser?.created_at || new Date().toISOString())}
        </Text>
      </View>
    </View>
  );

  const renderProfileStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>📊 Your Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profileStats.totalMaterials}</Text>
          <Text style={styles.statLabel}>Materials Shared</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profileStats.totalDownloads}</Text>
          <Text style={styles.statLabel}>Total Downloads</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.statCard}
          onPress={refreshSocialCounts}
          activeOpacity={0.7}
        >
          <Text style={styles.statNumber}>{profileStats.followersCount}</Text>
          <Text style={styles.statLabel}>Followers</Text>
          <Text style={styles.tapToRefresh}>Tap to refresh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.statCard}
          onPress={refreshSocialCounts}
          activeOpacity={0.7}
        >
          <Text style={styles.statNumber}>{profileStats.followingCount}</Text>
          <Text style={styles.statLabel}>Following</Text>
          <Text style={styles.tapToRefresh}>Tap to refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAppSettings = () => (
    <View style={styles.settingsContainer}>
      <Text style={styles.sectionTitle}>⚙️ App Settings</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>🌙 Dark Mode</Text>
          <Text style={styles.settingSubtitle}>Use dark theme throughout the app</Text>
        </View>
        <Switch
          value={appSettings.darkMode}
          onValueChange={(value) => updateAppSetting('darkMode', value)}
          trackColor={{ false: THEME_COLORS.outline, true: THEME_COLORS.primaryLight }}
          thumbColor={appSettings.darkMode ? THEME_COLORS.primary : THEME_COLORS.surface}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>🔔 Push Notifications</Text>
          <Text style={styles.settingSubtitle}>Get notified about new materials and updates</Text>
        </View>
        <Switch
          value={appSettings.notifications}
          onValueChange={(value) => updateAppSetting('notifications', value)}
          trackColor={{ false: THEME_COLORS.outline, true: THEME_COLORS.primaryLight }}
          thumbColor={appSettings.notifications ? THEME_COLORS.primary : THEME_COLORS.surface}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>📥 Auto Download</Text>
          <Text style={styles.settingSubtitle}>Automatically download materials for offline use</Text>
        </View>
        <Switch
          value={appSettings.autoDownload}
          onValueChange={(value) => updateAppSetting('autoDownload', value)}
          trackColor={{ false: THEME_COLORS.outline, true: THEME_COLORS.primaryLight }}
          thumbColor={appSettings.autoDownload ? THEME_COLORS.primary : THEME_COLORS.surface}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>📱 Offline Mode</Text>
          <Text style={styles.settingSubtitle}>Prioritize offline functionality</Text>
        </View>
        <Switch
          value={appSettings.offlineMode}
          onValueChange={(value) => updateAppSetting('offlineMode', value)}
          trackColor={{ false: THEME_COLORS.outline, true: THEME_COLORS.primaryLight }}
          thumbColor={appSettings.offlineMode ? THEME_COLORS.primary : THEME_COLORS.surface}
        />
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      <Text style={styles.sectionTitle}>🛠️ Account Actions</Text>
      
      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Library')}>
        <Text style={styles.actionIcon}>📚</Text>
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>My Library</Text>
          <Text style={styles.actionSubtitle}>View and manage your materials</Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Upload')}>
        <Text style={styles.actionIcon}>📤</Text>
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>Upload Material</Text>
          <Text style={styles.actionSubtitle}>Share study materials with others</Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={clearCache}>
        <Text style={styles.actionIcon}>🗑️</Text>
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>Clear Cache</Text>
          <Text style={styles.actionSubtitle}>Free up storage space</Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => UIUtils.showAlert('Help & Support', 'Contact support at help@openshelf.edu or visit our FAQ section in the app.')}
      >
        <Text style={styles.actionIcon}>❓</Text>
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>Help & Support</Text>
          <Text style={styles.actionSubtitle}>Get help or contact support</Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, styles.logoutButton]}
        onPress={() => setShowLogoutModal(true)}
      >
        <Text style={styles.actionIcon}>🚪</Text>
        <View style={styles.actionInfo}>
          <Text style={[styles.actionTitle, styles.logoutTitle]}>Sign Out</Text>
          <Text style={styles.actionSubtitle}>Sign out of your account</Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
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
      <View style={styles.modalOverlay}>
        <View style={styles.logoutModal}>
          <Text style={styles.logoutModalIcon}>👋</Text>
          <Text style={styles.logoutModalTitle}>Sign Out</Text>
          <Text style={styles.logoutModalSubtitle}>
            Are you sure you want to sign out? You'll need to sign in again to access your materials.
          </Text>
          
          <View style={styles.logoutModalActions}>
            <TouchableOpacity
              style={styles.logoutModalCancel}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={styles.logoutModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.logoutModalConfirm}
              onPress={() => {
                setShowLogoutModal(false);
                handleLogout();
              }}
            >
              <Text style={styles.logoutModalConfirmText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loadingState === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLORS.primary} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadingState === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to load profile</Text>
          <Text style={styles.errorSubtitle}>
            {isOnline 
              ? 'There was a problem loading your profile. Please try again.'
              : 'You appear to be offline. Please check your internet connection.'
            }
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadProfileData()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[THEME_COLORS.primary]}
            tintColor={THEME_COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderProfileHeader()}
        {renderProfileStats()}
        {renderAppSettings()}
        {renderActions()}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            OpenShelf University Library v1.0.0
          </Text>
          <Text style={styles.footerText}>
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
  tapToRefresh: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textTertiary,
    textAlign: 'center',
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
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
