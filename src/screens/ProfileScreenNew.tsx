/**
 * Enhanced Profile Screen Component  
 * Modern UI for user profile, statistics, and settings management
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
  TextInput,
  Switch,
  Dimensions,
  Modal,
  RefreshControl,
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
  ValidationUtils,
  THEME_COLORS,
  UI_CONSTANTS,
} from '../utils';

const { width: screenWidth } = Dimensions.get('window');

type Props = NativeStackScreenProps<MainTabParamList, 'Profile'>;

interface ProfileStats {
  totalMaterials: number;
  totalDownloads: number;
  publicMaterials: number;
  joinedDate: string;
  totalSize: number;
  avgDownloads: number;
}

interface AppSettings {
  darkMode: boolean;
  notifications: boolean;
  autoDownload: boolean;
  offlineMode: boolean;
}

export const ProfileScreenNew = ({ navigation }: Props) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    totalMaterials: 0,
    totalDownloads: 0,
    publicMaterials: 0,
    joinedDate: '',
    totalSize: 0,
    avgDownloads: 0,
  });
  const [appSettings, setAppSettings] = useState<AppSettings>({
    darkMode: false,
    notifications: true,
    autoDownload: false,
    offlineMode: false,
  });
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [isOnline, setIsOnline] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<User>>({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = NetworkUtils.subscribeToNetworkStatus(setIsOnline);
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadProfileData();
    loadAppSettings();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoadingState('loading');

      // Get current user
      const userResponse = await supabaseService.getCurrentUser();
      if (!userResponse.success || !userResponse.data) {
        // Handle logout by clearing cache and showing login
        await CacheManager.clearCache();
        return;
      }

      setCurrentUser(userResponse.data);

      if (isOnline) {
        // Get detailed profile
        const profileResponse = await supabaseService.getUserProfile(userResponse.data.id);
        if (profileResponse.success && profileResponse.data) {
          setUserProfile(profileResponse.data);
          setEditedProfile(profileResponse.data);
        }

        // Get user statistics
        const statsResponse = await supabaseService.getUserStats(userResponse.data.id);
        if (statsResponse.success && statsResponse.data) {
          setProfileStats({
            totalMaterials: statsResponse.data.totalMaterials || 0,
            totalDownloads: statsResponse.data.totalDownloads || 0,
            publicMaterials: statsResponse.data.publicMaterials || 0,
            joinedDate: userResponse.data.created_at,
            totalSize: statsResponse.data.totalSize || 0,
            avgDownloads: statsResponse.data.totalMaterials > 0 
              ? Math.round((statsResponse.data.totalDownloads || 0) / statsResponse.data.totalMaterials)
              : 0,
          });
        }

        setLoadingState('success');
      } else {
        // Use cached data when offline
        const cachedProfile = await CacheManager.getCachedProfile(userResponse.data.id);
        if (cachedProfile) {
          setUserProfile(cachedProfile);
          setEditedProfile(cachedProfile);
        }
        setLoadingState('success');
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Load profile error');
      setLoadingState('error');
    }
  };

  const loadAppSettings = async () => {
    try {
      const settings = await CacheManager.getAppSettings();
      if (settings) {
        setAppSettings(settings);
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Load settings error');
    }
  };

  const saveProfile = async () => {
    try {
      if (!currentUser || !isOnline) {
        UIUtils.showAlert('Offline Mode', 'Profile editing is not available while offline.');
        return;
      }

      // Validate profile data
      const validationErrors = ValidationUtils.validateProfile(editedProfile);
      if (validationErrors.length > 0) {
        UIUtils.showAlert('Validation Error', validationErrors.map(error => error.message).join('\n'));
        return;
      }

      setIsSaving(true);

      const response = await supabaseService.updateUserProfile(currentUser.id, editedProfile);
      if (response.success && response.data) {
        setUserProfile(response.data);
        setIsEditing(false);
        UIUtils.showAlert('✅ Success', 'Profile updated successfully.');
      } else {
        UIUtils.showAlert('Error', response.error || 'Failed to update profile.');
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Save profile error');
      UIUtils.showAlert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateAppSetting = async <K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ) => {
    try {
      const newSettings = { ...appSettings, [key]: value };
      setAppSettings(newSettings);
      await CacheManager.saveAppSettings(newSettings);
    } catch (error) {
      ErrorHandler.handle(error, 'Update settings error');
    }
  };

  const handleLogout = async () => {
    try {
      const response = await supabaseService.signOut();
      if (response.success) {
        await CacheManager.clearCache();
        // Instead of navigating, we'll let the auth state change handler in App.tsx handle this
        // The auth listener will detect the sign out and show the login screen
      } else {
        UIUtils.showAlert('Error', response.error || 'Failed to sign out.');
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Logout error');
      UIUtils.showAlert('Error', 'Failed to sign out. Please try again.');
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
        <View style={styles.onlineIndicator} />
      </View>

      <View style={styles.profileInfo}>
        {isEditing ? (
          <TextInput
            style={styles.editInput}
            value={editedProfile.full_name || ''}
            onChangeText={(text) => setEditedProfile({ ...editedProfile, full_name: text })}
            placeholder="Enter your full name"
            placeholderTextColor={THEME_COLORS.textTertiary}
          />
        ) : (
          <Text style={styles.userName}>
            {userProfile?.full_name || currentUser?.email || 'User'}
          </Text>
        )}

        <Text style={styles.userEmail}>{currentUser?.email}</Text>
        
        <Text style={styles.joinDate}>
          Member since {DateUtils.formatDate(profileStats.joinedDate || currentUser?.created_at || new Date().toISOString())}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => {
          if (isEditing) {
            saveProfile();
          } else {
            setIsEditing(true);
          }
        }}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={THEME_COLORS.primary} />
        ) : (
          <Text style={styles.editButtonText}>
            {isEditing ? '💾' : '✏️'}
          </Text>
        )}
      </TouchableOpacity>
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
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profileStats.publicMaterials}</Text>
          <Text style={styles.statLabel}>Public Materials</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{FileUtils.formatFileSize(profileStats.totalSize)}</Text>
          <Text style={styles.statLabel}>Storage Used</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profileStats.avgDownloads}</Text>
          <Text style={styles.statLabel}>Avg Downloads</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{isOnline ? '🌐' : '📱'}</Text>
          <Text style={styles.statLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>
    </View>
  );

  const renderProfileDetails = () => (
    <View style={styles.detailsContainer}>
      <Text style={styles.sectionTitle}>👤 Profile Information</Text>
      
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>University ID</Text>
        {isEditing ? (
          <TextInput
            style={styles.editDetailInput}
            value={editedProfile.university_id || ''}
            onChangeText={(text) => setEditedProfile({ ...editedProfile, university_id: text })}
            placeholder="Enter your university ID"
            placeholderTextColor={THEME_COLORS.textTertiary}
          />
        ) : (
          <Text style={styles.detailValue}>
            {userProfile?.university_id || 'Not provided'}
          </Text>
        )}
      </View>

      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Department</Text>
        {isEditing ? (
          <TextInput
            style={styles.editDetailInput}
            value={editedProfile.department || ''}
            onChangeText={(text) => setEditedProfile({ ...editedProfile, department: text })}
            placeholder="Enter your department"
            placeholderTextColor={THEME_COLORS.textTertiary}
          />
        ) : (
          <Text style={styles.detailValue}>
            {userProfile?.department || 'Not specified'}
          </Text>
        )}
      </View>

      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Year of Study</Text>
        {isEditing ? (
          <TextInput
            style={styles.editDetailInput}
            value={editedProfile.year_of_study || ''}
            onChangeText={(text) => setEditedProfile({ ...editedProfile, year_of_study: text })}
            placeholder="e.g., 3rd Year, Graduate"
            placeholderTextColor={THEME_COLORS.textTertiary}
          />
        ) : (
          <Text style={styles.detailValue}>
            {userProfile?.year_of_study || 'Not specified'}
          </Text>
        )}
      </View>

      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Bio</Text>
        {isEditing ? (
          <TextInput
            style={[styles.editDetailInput, styles.editBioInput]}
            value={editedProfile.bio || ''}
            onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
            placeholder="Tell others about yourself..."
            placeholderTextColor={THEME_COLORS.textTertiary}
            multiline={true}
            numberOfLines={3}
          />
        ) : (
          <Text style={styles.detailValue}>
            {userProfile?.bio || 'No bio provided'}
          </Text>
        )}
      </View>

      {isEditing && (
        <View style={styles.editActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setIsEditing(false);
              setEditedProfile(userProfile || {});
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
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
      
      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionIcon}>🗂️</Text>
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>Export Data</Text>
          <Text style={styles.actionSubtitle}>Download your data and materials</Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionIcon}>🗑️</Text>
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>Clear Cache</Text>
          <Text style={styles.actionSubtitle}>Free up storage space</Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionIcon}>❓</Text>
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>Help & Support</Text>
          <Text style={styles.actionSubtitle}>Get help or contact support</Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionIcon}>📋</Text>
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>Terms & Privacy</Text>
          <Text style={styles.actionSubtitle}>View our policies and terms</Text>
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
        {renderProfileDetails()}
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
    backgroundColor: THEME_COLORS.success,
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
  editInput: {
    ...UI_CONSTANTS.typography.h5,
    color: THEME_COLORS.text,
    borderWidth: 1,
    borderColor: THEME_COLORS.primary,
    borderRadius: UI_CONSTANTS.borderRadius.sm,
    paddingHorizontal: UI_CONSTANTS.spacing.sm,
    paddingVertical: UI_CONSTANTS.spacing.xs,
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME_COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 18,
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
    width: '31%',
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
  detailsContainer: {
    padding: UI_CONSTANTS.spacing.lg,
    backgroundColor: THEME_COLORS.surface,
    marginBottom: UI_CONSTANTS.spacing.md,
    ...UI_CONSTANTS.elevation[1],
  },
  detailItem: {
    marginBottom: UI_CONSTANTS.spacing.md,
  },
  detailLabel: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  detailValue: {
    ...UI_CONSTANTS.typography.body1,
    color: THEME_COLORS.text,
    lineHeight: 22,
  },
  editDetailInput: {
    ...UI_CONSTANTS.typography.body1,
    color: THEME_COLORS.text,
    borderWidth: 1,
    borderColor: THEME_COLORS.outline,
    borderRadius: UI_CONSTANTS.borderRadius.sm,
    paddingHorizontal: UI_CONSTANTS.spacing.sm,
    paddingVertical: UI_CONSTANTS.spacing.sm,
  },
  editBioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: UI_CONSTANTS.spacing.md,
  },
  cancelButton: {
    backgroundColor: THEME_COLORS.surfaceVariant,
    paddingHorizontal: UI_CONSTANTS.spacing.lg,
    paddingVertical: UI_CONSTANTS.spacing.sm,
    borderRadius: UI_CONSTANTS.borderRadius.sm,
  },
  cancelButtonText: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.text,
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
    maxWidth: screenWidth * 0.9,
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

export default ProfileScreenNew;
