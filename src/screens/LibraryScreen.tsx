/**
 * Enhanced Library Screen Component  
 * Modern UI for user's personal study materials with advanced management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { supabaseService } from '../services/supabase';
import { 
  Material, 
  MainTabParamList, 
  MaterialCategory, 
  LoadingState,
  AuthUser 
} from '../types';
// Simple modern color scheme
const colors = {
  primary: '#3B82F6',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  warning: '#F59E0B',
  warning100: '#FEF3C7',
  warning300: '#FCD34D',
  warning700: '#B45309',
  danger: '#EF4444',
};

const { width, height } = Dimensions.get('window');

type LibraryScreenProps = NativeStackScreenProps<MainTabParamList, 'Library'>;

interface SortOption {
  key: string;
  label: string;
  icon: string;
}

interface FilterOption {
  key: string;
  label: string;
  count?: number;
}

function LibraryScreen({ navigation, route }: LibraryScreenProps) {
  console.log('LibraryScreen function executing'); // Debug log
  // Core state management
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState({
    initial: true,
    refresh: false,
    action: false
  });
  const [user, setUser] = useState<AuthUser | null>(null);

  // Enhanced UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'date' | 'category' | 'downloads'>('date');
  const [isGridView, setIsGridView] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Enhanced filtering and sorting options
  const sortOptions: SortOption[] = [
    { key: 'date', label: 'Most Recent', icon: '📅' },
    { key: 'title', label: 'Alphabetical', icon: '🔤' },
    { key: 'category', label: 'By Category', icon: '📁' },
    { key: 'downloads', label: 'Most Downloaded', icon: '⬇️' },
  ];

  const categories = [
    { key: 'all', label: 'All Materials', icon: '📚' },
    { key: 'textbook', label: 'Textbooks', icon: '📖' },
    { key: 'notes', label: 'Notes', icon: '📝' },
    { key: 'presentation', label: 'Presentations', icon: '🎭' },
    { key: 'assignment', label: 'Assignments', icon: '📋' },
    { key: 'research', label: 'Research', icon: '🔬' },
    { key: 'reference', label: 'References', icon: '🔗' },
    { key: 'other', label: 'Other', icon: '📄' },
];

// Performance-optimized data fetching
const fetchUserMaterials = useCallback(async (isRefresh = false) => {
  if (!user?.id) return;
  setLoading(prev => ({
    ...prev,
    initial: prev.initial && !isRefresh,
    refresh: isRefresh,
  }));
  try {
    const response = await supabaseService.getUserMaterials(user.id);
    if (response.success && response.data) {
      setMaterials(response.data);
    } else {
      console.error('Failed to fetch user materials:', response.error);
      Alert.alert('Error', response.error || 'Failed to load materials');
    }
  } catch (error) {
    console.error('Unexpected error fetching materials:', error);
    Alert.alert('Error', 'An unexpected error occurred while loading materials');
  } finally {
    setLoading(prev => ({
      ...prev,
      initial: false,
      refresh: false,
    }));
  }
}, [user?.id]);

// Advanced search and filtering
  const applyFiltersAndSearch = useCallback(() => {
    let result = materials;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(material =>
        material.title.toLowerCase().includes(query) ||
        material.description?.toLowerCase().includes(query) ||
        material.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(material => material.category === selectedCategory);
    }

    // Apply sorting
    switch (sortBy) {
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'category':
        result.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'downloads':
        result.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
        break;
      default: // date
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredMaterials(result);
  }, [materials, searchQuery, selectedCategory, sortBy]);

  // Material actions
  const handleMaterialAction = useCallback((action: string, material: Material) => {
    setShowActionsModal(false);
    setSelectedMaterial(null);

    switch (action) {
      case 'view':
        // Navigate to material detail view
        // navigation.navigate('MaterialDetail', { materialId: material.id });
        Alert.alert('View Material', `Opening: ${material.title}`);
        break;
      case 'download':
        handleDownloadMaterial(material);
        break;
      case 'share':
        handleShareMaterial(material);
        break;
      case 'delete':
        handleDeleteMaterial(material);
        break;
      case 'edit':
        navigation.navigate('Upload', { editMaterial: material } as any);
        break;
    }
  }, [navigation]);

  const handleDownloadMaterial = async (material: any) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      
      Alert.alert('Download', `Downloading: ${material.title}`);
      
    } catch (error) {
      console.error('Error downloading material:', error);
      Alert.alert('Error', 'Failed to download material. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleShareMaterial = async (material: any) => {
    try {
      Alert.alert('Share', `Sharing: ${material.title}`);
    } catch (error) {
      console.error('Error sharing material:', error);
      Alert.alert('Error', 'Failed to share material');
    }
  };

  const handleDeleteMaterial = (material: any) => {
    Alert.alert(
      'Delete Material',
      `Are you sure you want to delete "${material.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(prev => ({ ...prev, action: true }));
              
              // Remove from local state (simulated)
              setMaterials(prev => prev.filter((m: any) => m.id !== material.id));
              
              Alert.alert('Success', 'Material deleted successfully!');
              
            } catch (error) {
              console.error('Error deleting material:', error);
              Alert.alert('Error', 'Failed to delete material. Please try again.');
            } finally {
              setLoading(prev => ({ ...prev, action: false }));
            }
          },
        },
      ]
    );
  };

  // Component lifecycle
useEffect(() => {
  const fetchUser = async () => {
    try {
      const response = await supabaseService.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);  // real Supabase AuthUser with UUID
      } else {
        console.error('No logged-in user:', response.error);
        Alert.alert('Error', 'Please log in to view your library');
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  fetchUser();
}, []);

  useEffect(() => {
    if (user?.id) {
      fetchUserMaterials();
    }
  }, [user, fetchUserMaterials]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [materials, searchQuery, selectedCategory, sortBy, applyFiltersAndSearch]);

  // Custom modal components
  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSortModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Sort Materials</Text>
          <View style={styles.divider} />
          
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.modalOption,
                sortBy === option.key && styles.modalOptionActive
              ]}
              onPress={() => {
                setSortBy(option.key as any);
                setShowSortModal(false);
              }}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <Text style={[
                styles.optionText,
                sortBy === option.key && styles.optionTextActive
              ]}>
                {option.label}
              </Text>
              {sortBy === option.key && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowSortModal(false)}
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderActionsModal = () => (
    <Modal
      visible={showActionsModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowActionsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {selectedMaterial?.title || 'Material Actions'}
          </Text>
          <View style={styles.divider} />
          
          {[
            { key: 'view', label: 'View Details', icon: '👁️' },
            { key: 'download', label: 'Download', icon: '⬇️' },
            { key: 'share', label: 'Share', icon: '📤' },
            { key: 'edit', label: 'Edit', icon: '✏️' },
            { key: 'delete', label: 'Delete', icon: '🗑️', danger: true },
          ].map((action) => (
            <TouchableOpacity
              key={action.key}
              style={[
                styles.modalOption,
                action.danger && styles.modalOptionDanger
              ]}
              onPress={() => handleMaterialAction(action.key, selectedMaterial!)}
            >
              <Text style={styles.optionIcon}>{action.icon}</Text>
              <Text style={[
                styles.optionText,
                action.danger && styles.optionTextDanger
              ]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              setShowActionsModal(false);
              setSelectedMaterial(null);
            }}
          >
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Enhanced UI components
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>My Library</Text>
          <Text style={styles.headerSubtitle}>
            {filteredMaterials.length} material{filteredMaterials.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      
      {materials.length === 0 && !loading.initial && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No materials uploaded yet. Start by uploading your first study material!
          </Text>
        </View>
      )}
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search materials..."
            placeholderTextColor={colors.gray500}
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
        
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Text style={styles.sortButtonText}>⚡</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setIsGridView(!isGridView)}
        >
          <Text style={styles.viewToggleText}>
            {isGridView ? '☰' : '▦'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryChip,
              selectedCategory === category.key && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(category.key as any)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryLabel,
              selectedCategory === category.key && styles.categoryLabelActive
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderMaterialCard = ({ item }: { item: Material }) => (
    <TouchableOpacity
      style={[
        styles.materialCard,
        isGridView && styles.materialCardGrid
      ]}
      onPress={() => {
        setSelectedMaterial(item);
        setShowActionsModal(true);
      }}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.categoryBadge}>
            {categories.find(c => c.key === item.category)?.icon || '📄'} {item.category}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.cardMenu}
          onPress={() => {
            setSelectedMaterial(item);
            setShowActionsModal(true);
          }}
        >
          <Text style={styles.cardMenuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        <Text style={styles.materialTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description && (
          <Text style={styles.materialDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>

      {/* Card Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.cardStats}>
          <Text style={styles.statText}>📥 {item.download_count || 0}</Text>
          <Text style={styles.statText}>📏 {(item.file_size / 1000000).toFixed(1)} MB</Text>
        </View>
        <Text style={styles.uploadDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => handleDownloadMaterial(item)}
        >
          <Text style={styles.primaryButtonText}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => handleShareMaterial(item)}
        >
          <Text style={styles.secondaryButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Loading your materials...</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>No materials found</Text>
      <Text style={styles.emptyMessage}>
        {searchQuery.trim() 
          ? `No materials match "${searchQuery}"`
          : 'Start by uploading your first study material!'
        }
      </Text>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => navigation.navigate('Upload')}
      >
        <Text style={styles.uploadButtonText}>+ Upload Material</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading.initial) {
    return (
      <SafeAreaView style={styles.container}>
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderSearchAndFilters()}
      
      {loading.action && (
        <View style={styles.actionLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.actionLoadingText}>Processing...</Text>
        </View>
      )}

      <FlatList
        data={filteredMaterials}
        keyExtractor={(item) => item.id}
        renderItem={renderMaterialCard}
        refreshControl={
          <RefreshControl
            refreshing={loading.refresh}
            onRefresh={() => fetchUserMaterials(true)}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={[
          styles.listContainer,
          isGridView && styles.gridContainer
        ]}
        numColumns={isGridView ? 2 : 1}
        key={isGridView ? 'grid' : 'list'} // Force re-render when view changes
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState()}
        onEndReachedThreshold={0.3}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        getItemLayout={!isGridView ? (data, index) => ({
          length: 200,
          offset: 200 * index,
          index,
        }) : undefined}
      />

      {renderSortModal()}
      {renderActionsModal()}

      {materials.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('Upload', { defaultCategory: selectedCategory } as any)}
        >
          <Text style={styles.fabIcon}>＋</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  
  // Header Styles
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 2,
  },
  emptyState: {
    backgroundColor: colors.warning100,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning300,
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.warning700,
    textAlign: 'center',
  },

  // Search and Filter Styles
  searchContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    fontSize: 16,
    color: colors.gray500,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.gray800,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.gray500,
  },
  sortButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortButtonText: {
    fontSize: 16,
    color: colors.white,
  },
  viewToggle: {
    width: 40,
    height: 40,
    backgroundColor: colors.gray200,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewToggleText: {
    fontSize: 14,
    color: colors.gray700,
  },

  // Category Filter Styles
  categoryScroll: {
    marginTop: 12,
  },
  categoryScrollContent: {
    paddingRight: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray700,
  },
  categoryLabelActive: {
    color: colors.white,
  },

  // List Styles
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Extra space for tab bar
  },
  gridContainer: {
    paddingHorizontal: 8,
  },

  // Material Card Styles
  materialCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  materialCardGrid: {
    flex: 0.48,
    marginHorizontal: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  cardMenu: {
    padding: 4,
  },
  cardMenuIcon: {
    fontSize: 16,
    color: colors.gray500,
  },
  cardContent: {
    marginBottom: 12,
  },
  materialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 4,
  },
  materialDescription: {
    fontSize: 14,
    color: colors.gray600,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statText: {
    fontSize: 12,
    color: colors.gray500,
  },
  uploadDate: {
    fontSize: 12,
    color: colors.gray500,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray600,
  },
  actionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: colors.primary + '10',
  },
  actionLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.primary,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  uploadButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray800,
    padding: 20,
    paddingBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginHorizontal: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 8,
  },
  modalOptionActive: {
    backgroundColor: colors.primary + '10',
  },
  modalOptionDanger: {
    backgroundColor: colors.danger + '10',
  },
  optionIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: colors.gray800,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  optionTextDanger: {
    color: colors.danger,
  },
  checkmark: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.gray200},
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabIcon: {
    fontSize: 28,
    color: colors.white,
    lineHeight: 28,
  },
});
;

export default LibraryScreen;


