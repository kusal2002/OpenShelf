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

const { width: screenWidth } = Dimensions.get('window');

type Props = NativeStackScreenProps<MainTabParamList, 'Home'>;

function HomeScreen({ navigation }: Props) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFiltereredMaterials] = useState<Material[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const unsubscribe = NetworkUtils.subscribeToNetworkStatus(setIsOnline);
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadMaterials(true);
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchQuery, selectedCategory]);

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

  const downloadMaterial = async (material: Material) => {
    try {
      if (!isOnline) {
        UIUtils.showAlert('Offline Mode', 'Downloads are not available while offline.');
        return;
      }

      Alert.alert(
        '📥 Download Material',
        `Download "${material.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Download',
            onPress: async () => {
              try {
                // Update download count
                await supabaseService.updateDownloadCount(material.id);
                
                // In a real app, you would implement actual file download
                UIUtils.showAlert(
                  '✅ Download Started',
                  `"${material.title}" is being downloaded to your device.`
                );
              } catch (error) {
                ErrorHandler.handle(error, 'Download error');
                UIUtils.showAlert('Error', 'Failed to download material. Please try again.');
              }
            },
          },
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
      onPress={() => downloadMaterial(item)}
      activeOpacity={0.7}
    >
      <View style={styles.materialHeader}>
        <View style={styles.materialIcon}>
          <Text style={styles.materialIconText}>
            {FILE_ICONS[item.file_type as keyof typeof FILE_ICONS] || '📄'}
          </Text>
        </View>
        <View style={styles.materialInfo}>
          <Text style={styles.materialTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.uploaderName}>
            👤 Uploaded by: {item.uploader_name || 'Unknown'}
          </Text>
          <View style={styles.materialMeta}>
            <Text style={styles.materialCategory}>{item.category}</Text>
            <Text style={styles.materialSize}>
              {FileUtils.formatFileSize(item.file_size)}
            </Text>
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
        <View style={styles.footerInfo}>
          <Text style={styles.materialDate}>
            {DateUtils.getRelativeTime(item.created_at)}
          </Text>
        </View>
        <View style={styles.downloadInfo}>
          <Text style={styles.downloadCount}>
            📥 {item.download_count || 0}
          </Text>
          <TouchableOpacity style={styles.downloadButton}>
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
  }

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
  footerInfo: {
    flexDirection: 'column',
    gap: UI_CONSTANTS.spacing.xs / 2,
  },
  materialDate: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textTertiary,
  },
  uploaderName: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 4,
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
});

export default HomeScreen;
