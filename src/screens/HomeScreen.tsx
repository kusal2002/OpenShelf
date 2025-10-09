/**
 * Enhanced Home Screen Component  
 * Modern UI showing public study materials with advanced filtering
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { downloadFile } from '../utils';
import { supabaseService } from '../services/supabase';
import { 
  Material, 
  MainTabParamList, 
  MaterialCategory, 
  LoadingState 
} from '../types';
import {
  CacheManager,
  NetworkUtils,
  DateUtils,
  FileUtils,
  UIUtils,
  UIComponents,
  ErrorHandler,
  THEME_COLORS,
  UI_CONSTANTS,
  MATERIAL_CATEGORIES,
  FILE_ICONS,
} from '../utils';
import { FloatingAction } from "react-native-floating-action";

const { width: screenWidth } = Dimensions.get('window');

type Props = NativeStackScreenProps<MainTabParamList, 'Home'>;

export const HomeScreen = ({ navigation }: Props) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFiltereredMaterials] = useState<Material[]>([]);
  const [userBookmarks, setUserBookmarks] = useState<Record<string, boolean>>({});
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    const unsubscribe = NetworkUtils.subscribeToNetworkStatus(setIsOnline);
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadMaterials(true);
    loadUserBookmarks();
  }, []);
  
  // Add focus listener to refresh bookmark status
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Just refresh bookmark status when returning to this screen
      loadUserBookmarks();
    });
    
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchQuery, selectedCategory]);
  
  // Load the user's bookmarks
  const loadUserBookmarks = useCallback(async () => {
    try {
      const { session } = await supabaseService.getCurrentSession();
      if (!session) return;
      
      const userId = session.user.id;
      const { data: bookmarkedMaterials } = await supabaseService.getBookmarkedMaterials(userId);
      
      if (bookmarkedMaterials) {
        // Create a lookup object for O(1) access to bookmark status
        const bookmarkMap: Record<string, boolean> = {};
        bookmarkedMaterials.forEach(material => {
          bookmarkMap[material.id] = true;
        });
        setUserBookmarks(bookmarkMap);
        
        // Update materials in state if they exist
        setMaterials(prev => prev.map(material => ({
          ...material,
          is_bookmarked: !!bookmarkMap[material.id]
        })));
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  }, []);

  const loadMaterials = async (isInitialLoad: boolean = false) => {
    try {
      if (isInitialLoad) {
        setLoadingState('loading');
        setPage(0);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }

      const currentPage = isInitialLoad ? 0 : page;
      
      if (isOnline) {
        const response = await supabaseService.getMaterials(currentPage, 20);
        
        if (response.success && response.data) {
          const newMaterials = response.data;
          
          if (isInitialLoad) {
            setMaterials(newMaterials);
            await CacheManager.cacheMaterials(newMaterials);
          } else {
            setMaterials(prev => [...prev, ...newMaterials]);
          }
          
          setHasMore(newMaterials.length === 20);
          setPage(currentPage + 1);
          setLoadingState('success');
        } else {
          if (isInitialLoad) {
            const cachedMaterials = await CacheManager.getCachedMaterials();
            setMaterials(cachedMaterials);
            setLoadingState(cachedMaterials.length > 0 ? 'success' : 'error');
          }
        }
      } else {
        if (isInitialLoad) {
          const cachedMaterials = await CacheManager.getCachedMaterials();
          setMaterials(cachedMaterials);
          setLoadingState(cachedMaterials.length > 0 ? 'success' : 'error');
        }
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Load materials error');
      if (isInitialLoad) {
        setLoadingState('error');
      }
    } finally {
      if (!isInitialLoad) {
        setIsLoadingMore(false);
      }
    }
  };

  const filterMaterials = () => {
    let filtered = [...materials];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(material =>
        material.title.toLowerCase().includes(query) ||
        material.description?.toLowerCase().includes(query) ||
        material.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(material => material.category === selectedCategory);
    }

    setFiltereredMaterials(filtered);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMaterials(true).finally(() => setRefreshing(false));
  }, []);

  const loadMore = () => {
    if (hasMore && !isLoadingMore && isOnline) {
      loadMaterials(false);
    }
  };

  // Toggle bookmark status
  const toggleBookmark = async (material: Material) => {
    try {
      const { session } = await supabaseService.getCurrentSession();
      if (!session) {
        Alert.alert('Sign In Required', 'Please sign in to bookmark materials.');
        return;
      }

      const userId = session.user.id;
      const isCurrentlyBookmarked = material.is_bookmarked;

      // Optimistically update the UI
      setMaterials(prev => 
        prev.map(m => m.id === material.id 
          ? {...m, is_bookmarked: !isCurrentlyBookmarked} 
          : m
        )
      );

      // Update bookmarks map
      setUserBookmarks(prev => ({
        ...prev,
        [material.id]: !isCurrentlyBookmarked
      }));

      // Make API call based on current bookmark status
      if (isCurrentlyBookmarked) {
        await supabaseService.removeBookmark(userId, material.id);
        Alert.alert('Bookmark Removed', `"${material.title}" has been removed from your bookmarks.`);
      } else {
        const response = await supabaseService.addBookmark(userId, material.id);
        if (response.success) {
          console.log('Successfully added bookmark for material:', material.id);
          Alert.alert(
            'Bookmark Added',
            `"${material.title}" has been added to your bookmarks.`,
            [
              { text: 'OK', style: 'default' },
              { 
                text: 'View in Library', 
                onPress: () => {
                  // Ensure the bookmark is visible when navigating
                  navigation.navigate('Library', { 
                    initialTab: 'bookmarks',
                    refreshBookmarks: true,
                    bookmarkedMaterialId: material.id
                  } as any);
                }
              }
            ]
          );
        } else {
          console.error('Failed to add bookmark:', response.error);
          Alert.alert('Error', 'Failed to add bookmark. Please try again.');
        }
      }
      
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert optimistic update if there's an error
      loadUserBookmarks();
    }
  };

  const downloadMaterial = async (material: Material) => {
    try {
      if (!isOnline) {
        UIUtils.showAlert('Offline Mode', 'Downloads are not available while offline.');
        return;
      }

      // First confirmation
      Alert.alert(
        'Download Material',
        `Do you want to download "${material.title}" to your device for offline access?`,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            onPress: () => {
              // Second confirmation (explicit consent to store locally)
              Alert.alert(
                'Confirm Download',
                'This file will be saved on your device storage. Continue?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Download',
                    onPress: async () => {
                      try {
                        // Derive a path inside bucket from material.file_url if possible
                        // Assuming file_url might be a public URL or signed; try to extract last segment
                        const rawName = material.file_name || material.title;
                        let storagePath = '';
                        if (material.file_url) {
                          const parts = material.file_url.split('?')[0].split('/');
                          storagePath = parts.slice(-1)[0];
                        }
                        const desiredName = rawName.includes('.') ? rawName : `${rawName}.${material.file_type}`;

                        // Start download
                        const res = await downloadFile(storagePath || material.file_url, desiredName);

                        if (res.success) {
                          await supabaseService.updateDownloadCount(material.id);
                          UIUtils.showAlert('Download Complete', `Saved to: ${res.localPath}`);
                        } else {
                          UIUtils.showAlert('Download Failed', res.error || 'Unknown error');
                        }
                      } catch (err) {
                        ErrorHandler.handle(err, 'Download error');
                        UIUtils.showAlert('Error', 'Failed to download material. Please try again.');
                      }
                    }
                  }
                ]
              );
            }
          }
        ]
      );
    } catch (error) {
      ErrorHandler.handle(error, 'Download material error');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>🏠 OpenShelf Library</Text>
      <Text style={styles.subtitle}>
        Discover and download study materials shared by the university community
      </Text>
      
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            📱 You're browsing offline content
          </Text>
        </View>
      )}
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search materials, topics, or tags..."
          placeholderTextColor={THEME_COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderCategoryFilters = () => (
    <View style={styles.categoriesContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[
            styles.categoryChipText, 
            !selectedCategory && styles.categoryChipTextActive
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        {MATERIAL_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip, 
              selectedCategory === category && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(
              selectedCategory === category ? null : category
            )}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category && styles.categoryChipTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderMaterialCard = ({ item }: { item: Material }) => (
    <TouchableOpacity
      style={styles.materialCard}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('MaterialDetails' as any, { material: item } as any)}
    >
      <View style={styles.materialHeader}>
        <View style={styles.materialIcon}>
          <Text style={styles.materialIconText}>
            {FILE_ICONS[item.file_type as keyof typeof FILE_ICONS] || '📄'}
          </Text>
          {item.is_bookmarked && (
            <View style={styles.bookmarkIconContainer}>
              <Text style={styles.bookmarkIconText}>🔖</Text>
            </View>
          )}
        </View>
        <View style={styles.materialInfo}>
          <Text style={styles.materialTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.materialMeta}>
            <Text style={styles.materialCategory}>{item.category}</Text>
            <Text style={styles.materialSize}>
              {FileUtils.formatFileSize(item.file_size)}
            </Text>
            {item.is_bookmarked && (
              <Text style={styles.bookmarkText}>Bookmarked</Text>
            )}
          </View>
        </View>
      </View>

      {item.description && (
        <Text style={styles.materialDescription} numberOfLines={3}>
          {item.description}
        </Text>
      )}

      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {item.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{item.tags.length - 3} more</Text>
          )}
        </View>
      )}

      <View style={styles.materialFooter}>
        <View style={styles.leftActions}>
          <Text style={styles.materialDate}>
            {DateUtils.getRelativeTime(item.created_at)}
          </Text>
          <TouchableOpacity 
            style={[
              styles.bookmarkButton,
              item.is_bookmarked ? styles.bookmarkButtonActive : {}
            ]} 
            onPress={() => toggleBookmark(item)}
          >
            <Text style={styles.bookmarkButtonIcon}>
              {item.is_bookmarked ? '🔖' : '📑'}
            </Text>
            <Text style={styles.bookmarkButtonText}>
              {item.is_bookmarked ? 'Bookmarked' : 'Bookmark'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.downloadInfo}>
          <Text style={styles.downloadCount}>📥 {item.download_count || 0}</Text>
          <TouchableOpacity style={styles.downloadButton} onPress={() => downloadMaterial(item)}>
            <Text style={styles.downloadButtonText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📚</Text>
      <Text style={styles.emptyStateTitle}>
        {searchQuery || selectedCategory 
          ? 'No materials found' 
          : 'No materials available'
        }
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery || selectedCategory
          ? 'Try adjusting your search or filters'
          : isOnline 
            ? 'Be the first to share study materials!'
            : 'Connect to the internet to see available materials'
        }
      </Text>
      {!isOnline && (
        <TouchableOpacity style={styles.retryButton} onPress={() => loadMaterials(true)}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoadingMore = () => (
    isLoadingMore && (
      <View style={styles.loadingMore}>
        <ActivityIndicator color={THEME_COLORS.primary} />
        <Text style={styles.loadingMoreText}>Loading more materials...</Text>
      </View>
    )
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{filteredMaterials.length}</Text>
        <Text style={styles.statLabel}>Materials</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {filteredMaterials.reduce((sum, material) => sum + (material.download_count || 0), 0)}
        </Text>
        <Text style={styles.statLabel}>Downloads</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {new Set(filteredMaterials.map(m => m.category)).size}
        </Text>
        <Text style={styles.statLabel}>Categories</Text>
      </View>
    </View>
  );

  if (loadingState === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLORS.primary} />
          <Text style={styles.loadingText}>Loading study materials...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadingState === 'error' && materials.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to load materials</Text>
          <Text style={styles.errorSubtitle}>
            {isOnline 
              ? 'There was a problem loading the study materials. Please try again.'
              : 'You appear to be offline. Please check your internet connection.'
            }
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadMaterials(true)}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredMaterials}
        keyExtractor={(item) => item.id}
        renderItem={renderMaterialCard}
        ListHeaderComponent={
          <View>
            {renderHeader()}
            {renderSearchBar()}
            {renderCategoryFilters()}
            {renderStats()}
          </View>
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderLoadingMore}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[THEME_COLORS.primary]}
            tintColor={THEME_COLORS.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* floating action button for uploading new materials */}

      <FloatingAction
        actions={[]}
        onPressMain={() => navigation.navigate('Upload')}
        color={THEME_COLORS.primary}
        floatingIcon={<Text style={{ color: THEME_COLORS.white, fontSize: 24 }}>+</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  listContent: {
    flexGrow: 1,
  },
  header: {
    padding: UI_CONSTANTS.spacing.lg,
    paddingBottom: UI_CONSTANTS.spacing.md,
  },
  title: {
    ...UI_CONSTANTS.typography.h2,
    color: THEME_COLORS.text,
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  subtitle: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
    lineHeight: 22,
  },
  offlineBanner: {
    backgroundColor: THEME_COLORS.warningLight,
    padding: UI_CONSTANTS.spacing.sm,
    borderRadius: UI_CONSTANTS.borderRadius.sm,
    marginTop: UI_CONSTANTS.spacing.md,
  },
  offlineBannerText: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.text,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: UI_CONSTANTS.spacing.lg,
    paddingBottom: UI_CONSTANTS.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.surface,
    borderRadius: UI_CONSTANTS.borderRadius.lg,
    paddingHorizontal: UI_CONSTANTS.spacing.md,
    ...UI_CONSTANTS.elevation[1],
  },
  searchIcon: {
    fontSize: 18,
    marginRight: UI_CONSTANTS.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...UI_CONSTANTS.typography.body1,
    color: THEME_COLORS.text,
    paddingVertical: UI_CONSTANTS.spacing.md,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME_COLORS.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  categoriesContainer: {
    paddingBottom: UI_CONSTANTS.spacing.md,
  },
  categoriesContent: {
    paddingHorizontal: UI_CONSTANTS.spacing.lg,
    gap: UI_CONSTANTS.spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: UI_CONSTANTS.spacing.md,
    paddingVertical: UI_CONSTANTS.spacing.sm,
    backgroundColor: THEME_COLORS.surface,
    borderRadius: UI_CONSTANTS.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME_COLORS.outline,
    ...UI_CONSTANTS.elevation[1],
  },
  categoryChipActive: {
    backgroundColor: THEME_COLORS.primary,
    borderColor: THEME_COLORS.primary,
  },
  categoryChipText: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.text,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: THEME_COLORS.textInverse,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: THEME_COLORS.surface,
    marginHorizontal: UI_CONSTANTS.spacing.lg,
    marginBottom: UI_CONSTANTS.spacing.lg,
    borderRadius: UI_CONSTANTS.borderRadius.md,
    padding: UI_CONSTANTS.spacing.lg,
    ...UI_CONSTANTS.elevation[2],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: THEME_COLORS.outline,
    marginHorizontal: UI_CONSTANTS.spacing.md,
  },
  materialCard: {
    ...UIComponents.getCardStyle(2),
    marginHorizontal: UI_CONSTANTS.spacing.lg,
    marginBottom: UI_CONSTANTS.spacing.md,
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: UI_CONSTANTS.spacing.sm,
  },
  materialIcon: {
    width: 48,
    height: 48,
    borderRadius: UI_CONSTANTS.borderRadius.sm,
    backgroundColor: THEME_COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: UI_CONSTANTS.spacing.md,
  },
  materialIconText: {
    fontSize: 24,
  },
  materialInfo: {
    flex: 1,
  },
  materialTitle: {
    ...UI_CONSTANTS.typography.h6,
    color: THEME_COLORS.text,
    fontWeight: '600',
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  materialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.spacing.sm,
  },
  materialCategory: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.primary,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  materialSize: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textTertiary,
  },
  bookmarkIconContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: THEME_COLORS.background,
    borderRadius: 12,
    padding: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  bookmarkIconText: {
    fontSize: 16,
  },
  bookmarkText: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.warning,
    marginLeft: UI_CONSTANTS.spacing.xs,
    fontWeight: '500',
  },
  materialDescription: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: UI_CONSTANTS.spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.spacing.sm,
    gap: UI_CONSTANTS.spacing.xs,
  },
  tag: {
    backgroundColor: THEME_COLORS.surfaceVariant,
    paddingHorizontal: UI_CONSTANTS.spacing.sm,
    paddingVertical: UI_CONSTANTS.spacing.xs,
    borderRadius: UI_CONSTANTS.borderRadius.sm,
  },
  tagText: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textSecondary,
    fontWeight: '500',
  },
  moreTagsText: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textTertiary,
    fontStyle: 'italic',
  },
  materialFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: UI_CONSTANTS.spacing.xs,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.spacing.sm,
  },
  materialDate: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textTertiary,
  },
  bookmarkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI_CONSTANTS.spacing.xs,
    paddingHorizontal: UI_CONSTANTS.spacing.sm,
    backgroundColor: THEME_COLORS.surfaceVariant,
    borderRadius: UI_CONSTANTS.borderRadius.md,
    gap: 4,
  },
  bookmarkButtonActive: {
    backgroundColor: THEME_COLORS.primary + '20',
  },
  bookmarkButtonIcon: {
    fontSize: 18,
  },
  bookmarkButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME_COLORS.textSecondary,
  },
  downloadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.spacing.sm,
  },
  downloadCount: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textSecondary,
  },
  downloadButton: {
    backgroundColor: THEME_COLORS.primary,
    paddingHorizontal: UI_CONSTANTS.spacing.md,
    paddingVertical: UI_CONSTANTS.spacing.xs,
    borderRadius: UI_CONSTANTS.borderRadius.sm,
  },
  downloadButtonText: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textInverse,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: UI_CONSTANTS.spacing.xxl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: UI_CONSTANTS.spacing.lg,
  },
  emptyStateTitle: {
    ...UI_CONSTANTS.typography.h5,
    color: THEME_COLORS.text,
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.spacing.sm,
  },
  emptyStateSubtitle: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: UI_CONSTANTS.spacing.lg,
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
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: UI_CONSTANTS.spacing.lg,
    gap: UI_CONSTANTS.spacing.sm,
  },
  loadingMoreText: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: UI_CONSTANTS.spacing.lg,
    bottom: UI_CONSTANTS.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...UI_CONSTANTS.elevation[3],
  },
  fabIcon: {
    color: THEME_COLORS.textInverse,
    fontSize: 28,
    lineHeight: 28,
    marginTop: -1,
  },
});
export default HomeScreen;
