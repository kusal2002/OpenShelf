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
  SubCategory,
  LoadingState,
  AuthUser 
} from '../types';
import { SUB_CATEGORIES } from '../utils';
import UploadMaterialModal from '../components/UploadMaterialModal';
import { downloadFile } from '../utils/download';
import { UIUtils, ErrorHandler, FileUtils } from '../utils';

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
// selectedSubCat should be inside the component; declared below with other hooks

const { width, height } = Dimensions.get('window');

// Define route params interface
interface LibraryScreenRouteParams {
  initialTab?: 'all' | 'bookmarks' | MaterialCategory;
  refreshBookmarks?: boolean;
  bookmarkedMaterialId?: string;
}

// Augment the navigation types
declare global {
  namespace ReactNavigation {
    interface RootParamList {
      Library: LibraryScreenRouteParams | undefined;
      Upload: { editMaterial?: Material } | undefined;
      MaterialPreview: { material: Material };
      MaterialDetails: { material: Material };
      Login: undefined;
      SignUp: undefined;
    }
  }
}

// Define the root stack param list for this app
type RootStackParamList = {
  Library: LibraryScreenRouteParams | undefined;
  Upload: { editMaterial?: Material } | undefined;
  MaterialPreview: { material: Material };
  MaterialDetails: { material: Material };
  Login: undefined;
  SignUp: undefined;
};

// Ensure proper typing for the route params
type LibraryScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Library'
>;

interface SortOption {
  key: string;
  label: string;
  icon: string;
}

// Keeping this for future use
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
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [bookmarkedMaterials, setBookmarkedMaterials] = useState<Material[]>([]);

  // selectedSubCat moved here to ensure hooks run inside component scope
  const [selectedSubCat, setSelectedSubCat] = useState<SubCategory | 'All'>('All');

  // Add selectedCategory state (fixes ReferenceError: selectedCategory doesn't exist)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'bookmarks' | MaterialCategory>('all');

  // Enhanced UI state
  const [searchQuery, setSearchQuery] = useState('');
  // (selectedCategory declared above)
  const [sortBy, setSortBy] = useState<'title' | 'date' | 'category' | 'downloads'>('date');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isGridView, setIsGridView] = useState(false);

  // Enhanced filtering and sorting options
  const sortOptions: SortOption[] = [
    { key: 'date', label: 'Most Recent', icon: '📅' },
    { key: 'title', label: 'Alphabetical', icon: '🔤' },
    { key: 'category', label: 'By Category', icon: '📁' },
    { key: 'downloads', label: 'Most Downloaded', icon: '⬇️' },
  ];

  // Simplified category chips: only the top doc categories the user wanted
  const categories = [
    { key: 'all', label: 'All Materials', icon: '📚' },
    { key: 'textbook', label: 'Textbooks', icon: '📖' },
    { key: 'notes', label: 'Notes', icon: '📝' },
    { key: 'presentation', label: 'Presentations', icon: '🎭' },
    { key: 'assignment', label: 'Assignments', icon: '📋' },
    { key: 'research', label: 'Research', icon: '🔬' },
    { key: 'thesis', label: 'Theses', icon: '🎓' },
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
        // Normalize materials so `sub_category` is always present
        const normalized = (response.data || []).map((m: any) => {
          const sub = m.sub_category || m.subcategory || m.subCategory || 'Other';
          return { ...m, sub_category: sub } as Material;
        });
        setMaterials(normalized);
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

  // Fetch bookmarked materials
  const fetchBookmarkedMaterials = useCallback(async () => {
    if (!user?.id) return;
    setLoading(prev => ({ ...prev, action: true }));
    try {
      console.log('Fetching bookmarks for user:', user.id);
      const response = await supabaseService.getBookmarkedMaterials(user.id);
      if (response.success && response.data) {
        console.log('Bookmarked materials fetched:', response.data.length);
        setBookmarkedMaterials(response.data);
        
        // Also update any matching materials in the main list to show bookmark status
        setMaterials(prevMaterials => {
          return prevMaterials.map(material => {
            const isBookmarked = response.data.some(bm => bm.id === material.id);
            return isBookmarked ? { ...material, is_bookmarked: true } : material;
          });
        });
      } else {
        console.error('Failed to fetch bookmarked materials:', response.error);
      }
    } catch (error) {
      console.error('Unexpected error fetching bookmarks:', error);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, [user?.id]);

  // Toggle bookmark status
  const toggleBookmark = useCallback(async (material: Material) => {
    if (!user?.id) return;
    
    try {
      setLoading(prev => ({ ...prev, action: true }));
      
      // Check if material is bookmarked
      const isCurrentlyBookmarked = bookmarkedMaterials.some(m => m.id === material.id);
      
      if (isCurrentlyBookmarked) {
        // Remove bookmark
        const response = await supabaseService.removeBookmark(user.id, material.id);
        if (response.success) {
          // Remove from bookmarked materials
          setBookmarkedMaterials(prev => prev.filter(m => m.id !== material.id));
          
          // Different message when removing from the bookmarks view
          Alert.alert('Success', 'Bookmark removed');
          
          // Update material in the main materials list to reflect bookmark status
          setMaterials(prev => prev.map(m => 
            m.id === material.id ? { ...m, is_bookmarked: false } : m
          ));
        }
      } else {
        // Add bookmark
        const response = await supabaseService.addBookmark(user.id, material.id);
        if (response.success) {
          const updatedMaterial = { ...material, is_bookmarked: true };
          setBookmarkedMaterials(prev => [...prev, updatedMaterial]);
          Alert.alert('Success', 'Material bookmarked');
          
          // Update material in the main materials list to reflect bookmark status
          setMaterials(prev => prev.map(m => 
            m.id === material.id ? { ...m, is_bookmarked: true } : m
          ));
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, [user?.id, bookmarkedMaterials, selectedCategory]);// Advanced search and filtering
  const applyFiltersAndSearch = useCallback(() => {
    let result = [...materials]; // Create a copy to avoid reference issues

      // Apply category filter
      if (selectedCategory && selectedCategory !== 'all') {
        const selectedKey = String(selectedCategory).toLowerCase();
        result = result.filter(material => {
          const cat = String(material.category || '').toLowerCase();
          const m: any = material as any;
          const sub = String(m.sub_category || m.subcategory || m.subCategory || '').toLowerCase();
          return cat === selectedKey || sub === selectedKey;
        });
      }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(material =>
        material.title.toLowerCase().includes(query) ||
        material.description?.toLowerCase().includes(query) ||
        material.category.toLowerCase().includes(query)
      );
    }
    
    // Note: Category filter for non-bookmarks is already applied above

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
          case 'date':
          default:
            result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            break;
        }

    setFilteredMaterials(result);
  }, [materials, bookmarkedMaterials, searchQuery, selectedCategory, sortBy]);
  const handleMaterialAction = useCallback((action: string, material: Material) => {
    setShowActionsModal(false);
    setSelectedMaterial(null);

    switch (action) {
      case 'view':
        navigation.navigate('MaterialPreview' as any, { material } as any);
        break;
      case 'edit':
        navigation.navigate('Upload', { editMaterial: material } as any);
        break;
      case 'download':
        handleDownloadMaterial(material);
        break;
      case 'bookmark':
        toggleBookmark(material);
        // Apply filters after bookmark changes
        setTimeout(() => applyFiltersAndSearch(), 500);
        break;
      case 'share':
        handleShareMaterial(material);
        break;
      case 'delete':
        handleDeleteMaterial(material);
        break;
      default:
        break;
    }
  }, [navigation, toggleBookmark, applyFiltersAndSearch]);

  const handleDownloadMaterial = async (material: any) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));

      const rawName = material.file_name || material.title;
      let storagePath = '';
      if (material.file_url) {
        const parts = material.file_url.split('?')[0].split('/');
        storagePath = parts.slice(-1)[0];
      }
      const desiredName = rawName.includes('.') ? rawName : `${rawName}.${material.file_type}`;

      const result = await downloadFile(storagePath || material.file_url, desiredName);

      if (result.success) {
        await supabaseService.updateDownloadCount(material.id);

        // mark as downloaded in local state so UI updates to "Downloaded"
        setMaterials(prev => prev.map(m => m.id === material.id ? { ...m, is_downloaded: true, local_path: result.localPath } : m));
        setFilteredMaterials(prev => prev.map(m => m.id === material.id ? { ...m, is_downloaded: true, local_path: result.localPath } : m));

        Alert.alert('Download Complete', `File saved to: ${result.localPath}`);
      } else {
        Alert.alert('Download Failed', result.error || 'An unknown error occurred.');
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Download error');
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

  // Load initial data when user is set
  useEffect(() => {
    if (user?.id) {
      fetchUserMaterials();
      fetchBookmarkedMaterials();
    }
  }, [user, fetchUserMaterials, fetchBookmarkedMaterials]);
  
  // Refresh bookmarks when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Library screen focused, refreshing bookmarks');
      if (user?.id) {
        fetchBookmarkedMaterials();
      }
    });
    
    return unsubscribe;
  }, [navigation, fetchBookmarkedMaterials, user?.id]);

  // Handle navigation params - check if we should show bookmarks
  useEffect(() => {
    const params = route.params;
    if (params) {
      // If caller asked to open bookmarks tab directly, navigate to the dedicated screen
      if (params.initialTab === 'bookmarks') {
        console.log('Navigating to Bookmarks screen based on navigation params');
        navigation.navigate('Bookmarks' as any);
        return;
      }

      // If params request refreshBookmarks, refresh bookmarks
      if (params.refreshBookmarks) {
        console.log('Refreshing bookmarks based on navigation params');
        if (user?.id) {
          fetchBookmarkedMaterials();
        }
      }
      
      // If a specific bookmarked material ID was provided, highlight it somehow
      if (params.bookmarkedMaterialId) {
        console.log('Bookmarked material ID from navigation:', params.bookmarkedMaterialId);
        // Could implement highlighting for the specific item here
      }
    }
  }, [route.params, fetchBookmarkedMaterials, user?.id]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [materials, searchQuery, selectedCategory, sortBy, applyFiltersAndSearch]);

  // ---------- ADDED: Header, search, quick-links, categories, and material card ----------
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>My Library</Text>
          <Text style={styles.headerSubtitle}>Manage and access your study materials</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' }}>
            <Text>👩‍🎓</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search your library"
            placeholderTextColor={colors.gray500}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Text style={styles.sortButtonText}>⋯</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setIsGridView(prev => !prev)}
        >
          <Text style={styles.viewToggleText}>{isGridView ? '◻︎' : '◼︎'}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick links row */}
      <View style={styles.quickLinksColumn}>
        <TouchableOpacity style={styles.quickLinkRow} onPress={() => navigation.navigate('Downloads' as any)}>
          <View style={styles.quickLinkIconBox}><Text style={styles.quickLinkIcon}>⬇️</Text></View>
          <View style={styles.quickLinkTextWrap}>
            <Text style={styles.quickLinkTitle}>Downloads</Text>
            <Text style={styles.quickLinkSubtitle}>{/* show count if available */} {materials.filter(m => m.local_path || m.is_downloaded).length} items</Text>
          </View>
          <Text style={styles.quickLinkChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickLinkRow} onPress={() => navigation.navigate('Bookmarks' as any)}>
          <View style={styles.quickLinkIconBox}><Text style={styles.quickLinkIcon}>🔖</Text></View>
          <View style={styles.quickLinkTextWrap}>
            <Text style={styles.quickLinkTitle}>Bookmarks</Text>
            <Text style={styles.quickLinkSubtitle}>{bookmarkedMaterials.length} items</Text>
          </View>
          <Text style={styles.quickLinkChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickLinkRow} onPress={() => navigation.navigate('ReadingList' as any)}>
          <View style={styles.quickLinkIconBox}><Text style={styles.quickLinkIcon}>📖</Text></View>
          <View style={styles.quickLinkTextWrap}>
            <Text style={styles.quickLinkTitle}>Reading List</Text>
            <Text style={styles.quickLinkSubtitle}>{materials.filter(m => m.is_in_reading_list || m.reading_list).length} items</Text>
          </View>
          <Text style={styles.quickLinkChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* My Documents + category chips */}
      <View style={styles.myDocsHeader}>
        <Text style={styles.myDocsTitle}>My Documents</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subCatScroll} contentContainerStyle={styles.subCatContent}>
          {categories.map(cat => {
            const active = String(selectedCategory).toLowerCase() === String(cat.key).toLowerCase() || (selectedCategory === 'all' && cat.key === 'all');
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.subCatChip, active && styles.subCatChipActive]}
                onPress={() => {
                  // toggle between 'all' and category
                  if (cat.key === 'all') {
                    setSelectedCategory('all');
                  } else {
                    setSelectedCategory(prev => (String(prev).toLowerCase() === cat.key ? 'all' : (cat.key as MaterialCategory)));
                  }
                }}
              >
                <Text style={[styles.subCatText, active && styles.subCatTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  const renderMaterialCard = ({ item }: { item: Material }) => {
    // small utility for emoji file icon (keeps file icon logic local to this file)
    const getFileIcon = (fileType?: string) => {
      const t = (fileType || '').toLowerCase();
      if (t.includes('pdf')) return '📄';
      if (t.includes('doc') || t.includes('docx') || t.includes('word')) return '📝';
      if (t.includes('ppt') || t.includes('pptx')) return '📊';
      if (t.includes('xls') || t.includes('xlsx')) return '📈';
      return '📁';
    };

    const isBookmarked = bookmarkedMaterials.some(b => b.id === item.id) || !!(item as any).is_bookmarked;
    const isDownloaded = !!item.local_path || !!(item as any).is_downloaded;

    return (
      <View
        style={[styles.materialCard, isGridView && styles.materialCardGrid]}
      >
        {/* Card header (menu / category) - separate from main touchable so menu works reliably */}
        <View style={[styles.cardHeader, { position: 'relative' }]}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.categoryBadge}>{item.category || (item.sub_category || 'Other')}</Text>
          </View>

          {/* absolutely positioned menu so it's never overlapped by the main touchable */}
          <TouchableOpacity
            onPress={() => {
              console.log('menu pressed for material:', item.id);
              setSelectedMaterial(item);
              setShowActionsModal(true);
            }}
            style={[styles.cardMenu, styles.cardMenuAbsolute]}
            accessibilityLabel="Open actions"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.cardMenuIcon}>⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Main tappable area (navigates to details) */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => navigation.navigate('MaterialDetails' as any, { material: item } as any)}
        >
          <View style={styles.cardRow}>
            <View style={[styles.cardThumbnail, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 28 }}>{getFileIcon(item.file_type)}</Text>
            </View>

            <View style={styles.cardContentRow}>
              <Text style={styles.materialTitle} numberOfLines={2}>{item.title}</Text>

              {item.description ? (
                <Text style={styles.materialDescription} numberOfLines={2}>{item.description}</Text>
              ) : null}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                <View>
                  <Text style={styles.uploadDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                  <Text style={styles.statText}>{(item.download_count || 0)} downloads</Text>
                </View>

                {/* Inline action buttons with text states */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => handleDownloadMaterial(item)}
                    style={[styles.inlineButton, isDownloaded ? styles.inlineButtonSecondary : styles.inlineButtonPrimary]}
                    disabled={isDownloaded || loading.action}
                    accessibilityLabel={isDownloaded ? 'Downloaded' : 'Download'}
                  >
                    <Text style={[styles.inlineButtonText, isDownloaded ? styles.inlineButtonTextSecondary : styles.inlineButtonTextPrimary]}>
                      {isDownloaded ? 'Downloaded' : 'Download'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => toggleBookmark(item)}
                    style={[styles.inlineButton, isBookmarked ? styles.inlineButtonSecondary : styles.inlineButtonPrimary, { marginLeft: 8 }]}
                    disabled={loading.action}
                    accessibilityLabel={isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  >
                    <Text style={[styles.inlineButtonText, isBookmarked ? styles.inlineButtonTextSecondary : styles.inlineButtonTextPrimary]}>
                      {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  // ---------- END ADDED ----------

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
            { 
              key: 'bookmark', 
              label: bookmarkedMaterials.some(m => m.id === selectedMaterial?.id) 
                ? 'Remove Bookmark' 
                : 'Add to Bookmarks', 
              icon: bookmarkedMaterials.some(m => m.id === selectedMaterial?.id) ? '🗑️🔖' : '🔖' 
            },
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

  const renderPreviewModal = () => (
    <Modal
      visible={showPreviewModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPreviewModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle} numberOfLines={2}>
            {previewMaterial?.title || 'Material Preview'}
          </Text>
          <View style={styles.divider} />
          <ScrollView style={styles.previewScrollContent}>
            {previewMaterial?.description && (
              <Text style={[styles.optionText, styles.previewDescription]}>
                {previewMaterial.description}
              </Text>
            )}
            {previewMaterial?.download_count != null && (
              <Text style={styles.optionText}>
                Downloads: {previewMaterial.download_count}
              </Text>
            )}
          </ScrollView>
          <View style={styles.previewActionContainer}>
            {/* View button: open full-screen preview and close modal */}
            <TouchableOpacity
              style={[styles.actionButton, styles.viewButton]}
              onPress={() => {
                if (!previewMaterial) return;
                const mat = previewMaterial;
                setShowPreviewModal(false);
                setPreviewMaterial(null);
                navigation.navigate('MaterialPreview' as any, { material: mat } as any);
              }}
            >
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => {
                if (previewMaterial) handleDownloadMaterial(previewMaterial);
              }}
            >
              <Text style={styles.primaryButtonText}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => {
                if (previewMaterial) handleShareMaterial(previewMaterial);
              }}
            >
              <Text style={styles.secondaryButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              setShowPreviewModal(false);
              setPreviewMaterial(null);
            }}
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Loading your materials...</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📂</Text>
      <Text style={styles.emptyTitle}>No materials found</Text>
      <Text style={styles.emptyMessage}>
        {searchQuery
          ? 'Try adjusting your search or filters.'
          : 'Upload your first study material to get started.'}
      </Text>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => setShowUploadModal(true)}
      >
        <Text style={styles.uploadButtonText}>Upload Material</Text>
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
      <FlatList
        data={filteredMaterials}
        keyExtractor={(item) => item.id}
        renderItem={renderMaterialCard}
        ListHeaderComponent={() => (
          <View>
            {renderHeader()}
            {renderSearchAndFilters()}
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading.refresh}
            onRefresh={() => {
              fetchUserMaterials(true);
              fetchBookmarkedMaterials();
            }}
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
  {renderPreviewModal()}
      
            {/* Floating Action Button */}
            <TouchableOpacity
              style={styles.fab}
              onPress={() => navigation.navigate('Upload' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
      <UploadMaterialModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        userId={user?.id || ''}
        category={selectedCategory === 'all' || selectedCategory === 'bookmarks' ? 'Other' : selectedCategory as MaterialCategory}
        onUploaded={() => {
          setShowUploadModal(false);
          fetchUserMaterials();
          fetchBookmarkedMaterials();
        }}
      />
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
    marginTop: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
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
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
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
    marginBottom: 4,
  },
  bookmarkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkBadge: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.warning700,
    backgroundColor: colors.warning100,
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
  warningButton: {
    backgroundColor: colors.warning100,
    borderWidth: 1,
    borderColor: colors.warning300,
  },
  warningButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning700,
  },
  viewButton: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
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
  
  // Preview modal styles
  previewScrollContent: {
    maxHeight: height * 0.4, 
    paddingHorizontal: 20, 
    paddingTop: 12
  },
  previewDescription: {
    marginBottom: 12
  },
  previewActionContainer: {
    flexDirection: 'row', 
    padding: 20, 
    paddingTop: 8
  }
  ,
  // Quick links row (downloads/bookmarks/reading list)
  quickLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  quickLinksColumn: {
    marginTop: 12,
    flexDirection: 'column',
    paddingHorizontal: 0,
  },
  quickLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    width: '100%',
  },
  quickLinkIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickLinkIcon: {
    fontSize: 20,
  },
  quickLinkTextWrap: {
    flex: 1,
  },
  quickLinkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
  },
  quickLinkSubtitle: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 2,
  },
  quickLinkChevron: {
    fontSize: 18,
    color: colors.gray400,
    marginLeft: 8,
  },

  // "My Documents" header and sub-category chips
  myDocsHeader: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  myDocsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 8,
  },
  subCatScroll: {
    paddingVertical: 4,
  },
  subCatContent: {
    paddingRight: 16,
  },
  subCatChip: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  subCatChipActive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  subCatText: {
    fontSize: 14,
    color: colors.gray700,
    fontWeight: '600',
  },
  subCatTextActive: {
    color: colors.primary,
  },

  // Thumbnail left layout for material card
  cardThumbnail: {
    width: 56,
    height: 72,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    marginRight: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  cardContentRow: {
    flex: 1,
    flexDirection: 'column',
  },
  // Inline small text buttons
  inlineButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  inlineButtonPrimary: {
    backgroundColor: colors.primary,
  },
  inlineButtonSecondary: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  inlineButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inlineButtonTextPrimary: {
    color: colors.white,
  },
  inlineButtonTextSecondary: {
    color: colors.gray700,
  },
  metaRowInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    alignItems: 'center',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default LibraryScreen;


