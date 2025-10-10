import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME_COLORS, UI_CONSTANTS, UIComponents, DateUtils, UIUtils, ErrorHandler } from '../utils';
import { supabaseService } from '../services/supabase';

interface UserProfile {
  id: string;
  name: string;
  email?: string;
  university_id?: string;
  avatar_url?: string;
  created_at?: string;
  followers_count?: number;
  following_count?: number;
}

interface Material {
  id: string;
  title: string;
  category?: string;
  file_type?: string;
  cover_url?: string;
  created_at?: string;
  download_count?: number;
  average_rating?: number;
}

export default function UserProfileScreen({ route, navigation }: any) {
  const { userId, userName } = route?.params || {};
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isOwnProfile, setIsOwnProfile] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [materialsLoading, setMaterialsLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<{ follow?: boolean }>({});
  const [activeTab, setActiveTab] = useState<'materials' | 'about'>('materials');

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserMaterials();
      checkIfOwnProfile();
      checkFollowStatus();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      // TODO: Implement getUserProfile in supabaseService
      // For now, create a basic profile from the passed parameters
      const basicProfile: UserProfile = {
        id: userId,
        name: userName || 'User',
        email: 'Not available',
        university_id: undefined,
        avatar_url: undefined,
        created_at: new Date().toISOString(),
        followers_count: 0,
        following_count: 0,
      };
      
      setProfile(basicProfile);
    } catch (err) {
      ErrorHandler.handle(err, 'Error fetching user profile');
      Alert.alert('Error', 'Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMaterials = async () => {
    try {
      setMaterialsLoading(true);
      
      // Fetch materials uploaded by this user
      const { data, error } = await supabaseService.getMaterialsByUploader(userId);
      
      if (error) {
        console.warn('Error fetching user materials:', error);
        setMaterials([]);
        return;
      }
      
      if (data) {
        setMaterials(data);
      } else {
        setMaterials([]);
      }
    } catch (err) {
      console.warn('Error fetching user materials:', err);
      setMaterials([]);
    } finally {
      setMaterialsLoading(false);
    }
  };

  const checkIfOwnProfile = async () => {
    try {
      const { session } = await supabaseService.getCurrentSession();
      if (session && session.user.id === userId) {
        setIsOwnProfile(true);
      }
    } catch (err) {
      console.warn('Failed to check if own profile:', err);
    }
  };

  const checkFollowStatus = async () => {
    if (isOwnProfile) return;
    
    try {
      const { session } = await supabaseService.getCurrentSession();
      if (!session) return;
      
      const currentUserId = session.user.id;
      if (currentUserId === userId) return;
      
      // TODO: Implement checkFollowStatus in supabaseService
      // For now, default to false
      setIsFollowing(false);
    } catch (err) {
      console.warn('Failed to check follow status:', err);
    }
  };

  const onFollowToggle = async () => {
    try {
      setBusy(prev => ({ ...prev, follow: true }));
      const { session } = await supabaseService.getCurrentSession();
      if (!session) {
        Alert.alert('Sign In Required', 'Please sign in to follow users.');
        return;
      }
      
      const currentUserId = session.user.id;
      if (currentUserId === userId) {
        Alert.alert('Error', 'You cannot follow yourself.');
        return;
      }

      // TODO: Implement follow/unfollow functionality in supabaseService
      Alert.alert(
        'Feature Coming Soon',
        'Follow functionality will be available in a future update. Please implement followUser and unfollowUser methods in your supabaseService.',
        [{ text: 'OK' }]
      );

    } catch (err) {
      ErrorHandler.handle(err, 'Follow toggle error');
      UIUtils.showAlert('Error', 'Unable to update follow status. Please try again.');
    } finally {
      setBusy(prev => ({ ...prev, follow: false }));
    }
  };

  const onMaterialPress = (material: Material) => {
    navigation.navigate('MaterialDetails', { material });
  };

  const renderMaterialItem = ({ item }: { item: Material }) => (
    <TouchableOpacity style={styles.materialCard} onPress={() => onMaterialPress(item)}>
      <View style={styles.materialImageContainer}>
        {item.cover_url ? (
          <Image source={{ uri: item.cover_url }} style={styles.materialImage} />
        ) : (
          <View style={styles.materialImagePlaceholder}>
            <Text style={styles.materialImageText}>📄</Text>
          </View>
        )}
      </View>
      <View style={styles.materialInfo}>
        <Text style={styles.materialTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.materialCategory}>{item.category || 'Uncategorized'}</Text>
        <View style={styles.materialMeta}>
          <Text style={styles.materialMetaText}>
            {item.download_count || 0} downloads
          </Text>
          {item.average_rating ? (
            <Text style={styles.materialMetaText}>
              ⭐ {item.average_rating.toFixed(1)}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(profile?.name || userName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.name || userName || 'Unknown User'}</Text>
            {profile?.university_id && (
              <Text style={styles.profileUniversity}>📚 {profile.university_id}</Text>
            )}
            <Text style={styles.profileJoined}>
              Joined {profile?.created_at ? DateUtils.formatDate(profile.created_at) : 'Recently'}
            </Text>
          </View>

          {!isOwnProfile && (
            <TouchableOpacity
              style={[styles.followButton, isFollowing ? styles.followingButton : null]}
              onPress={onFollowToggle}
              disabled={busy.follow}
            >
              {busy.follow ? (
                <ActivityIndicator size="small" color={isFollowing ? THEME_COLORS.text : THEME_COLORS.textInverse} />
              ) : (
                <Text style={[styles.followButtonText, isFollowing ? styles.followingButtonText : null]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{materials.length}</Text>
            <Text style={styles.statLabel}>Materials</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?.followers_count || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?.following_count || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'materials' ? styles.activeTab : null]}
            onPress={() => setActiveTab('materials')}
          >
            <Text style={[styles.tabText, activeTab === 'materials' ? styles.activeTabText : null]}>
              Materials
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' ? styles.activeTab : null]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabText, activeTab === 'about' ? styles.activeTabText : null]}>
              About
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'materials' ? (
          <View style={styles.tabContent}>
            {materialsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={THEME_COLORS.primary} />
                <Text style={styles.loadingText}>Loading materials...</Text>
              </View>
            ) : materials.length > 0 ? (
              <FlatList
                data={materials}
                keyExtractor={(item) => item.id}
                renderItem={renderMaterialItem}
                numColumns={2}
                columnWrapperStyle={materials.length > 1 ? styles.materialRow : undefined}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {isOwnProfile ? 'You haven\'t uploaded any materials yet.' : 'This user hasn\'t uploaded any materials yet.'}
                </Text>
                {isOwnProfile && (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => navigation.navigate('Upload')}
                  >
                    <Text style={styles.uploadButtonText}>Upload Your First Material</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.tabContent}>
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>Profile Information</Text>
              <View style={styles.aboutItem}>
                <Text style={styles.aboutLabel}>Email:</Text>
                <Text style={styles.aboutValue}>{profile?.email || 'Not provided'}</Text>
              </View>
              {profile?.university_id && (
                <View style={styles.aboutItem}>
                  <Text style={styles.aboutLabel}>University:</Text>
                  <Text style={styles.aboutValue}>{profile.university_id}</Text>
                </View>
              )}
              <View style={styles.aboutItem}>
                <Text style={styles.aboutLabel}>Member since:</Text>
                <Text style={styles.aboutValue}>
                  {profile?.created_at ? DateUtils.formatDate(profile.created_at) : 'Recently'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME_COLORS.background },
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONSTANTS.spacing.lg,
  },
  loadingText: {
    color: THEME_COLORS.textSecondary,
    ...UI_CONSTANTS.typography.body2,
    marginTop: UI_CONSTANTS.spacing.sm,
  },
  profileHeader: {
    flexDirection: 'row',
    padding: UI_CONSTANTS.spacing.lg,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: UI_CONSTANTS.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: THEME_COLORS.textInverse,
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: THEME_COLORS.text,
    ...UI_CONSTANTS.typography.h5,
    fontWeight: 'bold',
  },
  profileUniversity: {
    color: THEME_COLORS.textSecondary,
    ...UI_CONSTANTS.typography.body2,
    marginTop: UI_CONSTANTS.spacing.xs,
  },
  profileJoined: {
    color: THEME_COLORS.textSecondary,
    ...UI_CONSTANTS.typography.caption,
    marginTop: UI_CONSTANTS.spacing.xs,
  },
  followButton: {
    backgroundColor: THEME_COLORS.primary,
    paddingHorizontal: UI_CONSTANTS.spacing.lg,
    paddingVertical: UI_CONSTANTS.spacing.sm,
    borderRadius: UI_CONSTANTS.borderRadius.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: THEME_COLORS.surface,
    borderWidth: 1,
    borderColor: THEME_COLORS.outline,
  },
  followButtonText: {
    color: THEME_COLORS.textInverse,
    ...UI_CONSTANTS.typography.body2,
    fontWeight: '600',
  },
  followingButtonText: {
    color: THEME_COLORS.text,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: UI_CONSTANTS.spacing.lg,
    paddingBottom: UI_CONSTANTS.spacing.lg,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: THEME_COLORS.text,
    ...UI_CONSTANTS.typography.h6,
    fontWeight: 'bold',
  },
  statLabel: {
    color: THEME_COLORS.textSecondary,
    ...UI_CONSTANTS.typography.caption,
    marginTop: UI_CONSTANTS.spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.outline,
    marginHorizontal: UI_CONSTANTS.spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: UI_CONSTANTS.spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: THEME_COLORS.primary,
  },
  tabText: {
    color: THEME_COLORS.textSecondary,
    ...UI_CONSTANTS.typography.body2,
    fontWeight: '500',
  },
  activeTabText: {
    color: THEME_COLORS.primary,
    fontWeight: 'bold',
  },
  tabContent: {
    padding: UI_CONSTANTS.spacing.lg,
  },
  materialRow: {
    justifyContent: 'space-between',
  },
  materialCard: {
    backgroundColor: THEME_COLORS.surface,
    borderRadius: UI_CONSTANTS.borderRadius.md,
    padding: UI_CONSTANTS.spacing.sm,
    marginBottom: UI_CONSTANTS.spacing.md,
    width: '48%',
    ...UI_CONSTANTS.elevation[1],
  },
  materialImageContainer: {
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.spacing.sm,
  },
  materialImage: {
    width: 60,
    height: 80,
    borderRadius: UI_CONSTANTS.borderRadius.sm,
  },
  materialImagePlaceholder: {
    width: 60,
    height: 80,
    backgroundColor: THEME_COLORS.surfaceVariant,
    borderRadius: UI_CONSTANTS.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialImageText: {
    fontSize: 24,
  },
  materialInfo: {
    alignItems: 'center',
  },
  materialTitle: {
    color: THEME_COLORS.text,
    ...UI_CONSTANTS.typography.body2,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  materialCategory: {
    color: THEME_COLORS.textSecondary,
    ...UI_CONSTANTS.typography.caption,
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  materialMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  materialMetaText: {
    color: THEME_COLORS.textSecondary,
    ...UI_CONSTANTS.typography.caption,
    fontSize: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: UI_CONSTANTS.spacing.xl,
  },
  emptyText: {
    color: THEME_COLORS.textSecondary,
    ...UI_CONSTANTS.typography.body2,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptySubtext: {
    color: THEME_COLORS.textSecondary,
    ...UI_CONSTANTS.typography.caption,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: UI_CONSTANTS.spacing.xs,
  },
  uploadButton: {
    backgroundColor: THEME_COLORS.primary,
    paddingHorizontal: UI_CONSTANTS.spacing.lg,
    paddingVertical: UI_CONSTANTS.spacing.sm,
    borderRadius: UI_CONSTANTS.borderRadius.sm,
    marginTop: UI_CONSTANTS.spacing.md,
  },
  uploadButtonText: {
    color: THEME_COLORS.textInverse,
    ...UI_CONSTANTS.typography.body2,
    fontWeight: '600',
    textAlign: 'center',
  },
});
