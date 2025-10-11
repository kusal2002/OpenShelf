/**
 * Enhanced Home Screen Component  
 * Modern UI showing public study materials with advanced filtering
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Animated,
  TouchableOpacity,
  TextInput,
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
import { useTheme } from '../theme/ThemeProvider';
import {
  HeaderGreeting,
  SearchBar,
  CategoryPill,
  SectionHeader,
  CoverCard,
  StatsBar,
  PromoCard,
} from '../components/ui';

const { width: screenWidth } = Dimensions.get('window');

type Props = NativeStackScreenProps<MainTabParamList, 'Home'>;

export const HomeScreen = ({ navigation }: Props) => {
  const { theme, isDark, toggleTheme } = useTheme();
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
  const [currentUser, setCurrentUser] = useState<{ name: string; avatar_url?: string } | null>(null);
  
  // Sticky header state
  const [currentVisibleCategory, setCurrentVisibleCategory] = useState<string>('');
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const sectionPositions = React.useRef<{ [key: string]: number }>({});
  const stickyHeaderOpacity = React.useRef(new Animated.Value(0)).current;
  const stickyHeaderTranslateY = React.useRef(new Animated.Value(-60)).current;
  const searchInputRef = React.useRef<TextInput>(null);
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const unsubscribe = NetworkUtils.subscribeToNetworkStatus(setIsOnline);
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadMaterials(true);
    loadUserBookmarks();
    loadCurrentUser();
    
    // Start entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
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
  
  // Load current user info
  const loadCurrentUser = useCallback(async () => {
    try {
      const { session } = await supabaseService.getCurrentSession();
      if (session) {
        const userId = session.user.id;
        
        // Fetch user profile from database to get the actual name
        const { data: userProfile } = await supabaseService.getUserProfile(userId);
        
        if (userProfile) {
          setCurrentUser({
            name: userProfile.name || userProfile.full_name || 'Student',
            avatar_url: userProfile.avatar_url || session.user.user_metadata?.avatar_url,
          });
        } else {
          // Fallback to session metadata if profile not found
          setCurrentUser({
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'Student',
            avatar_url: session.user.user_metadata?.avatar_url,
          });
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }, []);

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



  const renderCategoryFilters = () => {
    const categoryConfig = [
      { label: 'All', value: null, icon: '📚' },
      { label: 'CS', value: 'Computer Science' as MaterialCategory, icon: '💻' },
      { label: 'Math', value: 'Mathematics' as MaterialCategory, icon: '📊' },
      { label: 'Physics', value: 'Physics' as MaterialCategory, icon: '⚛️' },
      { label: 'Chemistry', value: 'Chemistry' as MaterialCategory, icon: '🧪' },
      { label: 'Biology', value: 'Biology' as MaterialCategory, icon: '🧬' },
      { label: 'Literature', value: 'Literature' as MaterialCategory, icon: '📖' },
      { label: 'History', value: 'History' as MaterialCategory, icon: '�' },
      { label: 'Economics', value: 'Economics' as MaterialCategory, icon: '📈' },
      { label: 'Psychology', value: 'Psychology' as MaterialCategory, icon: '🧠' },
      { label: 'Engineering', value: 'Engineering' as MaterialCategory, icon: '⚙️' },
      { label: 'Medicine', value: 'Medicine' as MaterialCategory, icon: '⚕️' },
      { label: 'Other', value: 'Other' as MaterialCategory, icon: '�' },
    ];

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
      >
        {categoryConfig.map((cat) => {
          // Calculate count for each category
          const count = cat.value === null 
            ? materials.length 
            : materials.filter(m => m.category === cat.value).length;
          
          return (
            <CategoryPill
              key={cat.label}
              label={cat.label}
              icon={cat.icon}
              isActive={selectedCategory === cat.value}
              count={count}
              onPress={() => setSelectedCategory(
                selectedCategory === cat.value ? null : cat.value
              )}
            />
          );
        })}
      </ScrollView>
    );
  };

  const renderSubjectSections = () => {
    const subjectData = MATERIAL_CATEGORIES.map(category => ({
      name: category,
      materials: filteredMaterials.filter(m => m.category === category)
    })).filter(subject => subject.materials.length > 0);

    return subjectData.map((subject, index) => (
      <View 
        key={subject.name} 
        style={styles.subjectSection}
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          sectionPositions.current[subject.name] = y;
        }}
      >
        <SectionHeader
          title={subject.name}
          subtitle={`${subject.materials.length} materials`}
          onActionPress={() => {
            setSelectedCategory(subject.name as MaterialCategory);
          }}
        />
        
        <FlatList
          data={subject.materials.slice(0, 6)} // Show max 6 items
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <CoverCard
              material={item}
              onPress={() => navigation.navigate('MaterialDetails' as any, { material: item } as any)}
              onBookmarkPress={() => toggleBookmark(item)}
            />
          )}
          getItemLayout={(data, index) => ({
            length: 176, // width + margin
            offset: 176 * index,
            index,
          })}
        />
      </View>
    ));
  };



  // Handle scroll to update sticky header
  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    
    // Show sticky header after scrolling past the main header (approximately 200px)
    const shouldShow = scrollPosition > 200;
    
    if (shouldShow !== showStickyHeader) {
      setShowStickyHeader(shouldShow);
      
      // Animate sticky header appearance
      Animated.parallel([
        Animated.timing(stickyHeaderOpacity, {
          toValue: shouldShow ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(stickyHeaderTranslateY, {
          toValue: shouldShow ? 0 : -60,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    // Find which category section is currently visible
    const positions = Object.entries(sectionPositions.current);
    for (let i = positions.length - 1; i >= 0; i--) {
      const [category, position] = positions[i];
      if (scrollPosition >= position - 100) {
        setCurrentVisibleCategory(category);
        break;
      }
    }
  };

  // Render sticky header
  const renderStickyHeader = () => {
    return (
      <Animated.View 
        style={[
          styles.stickyHeader,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
            shadowColor: theme.shadow,
            opacity: stickyHeaderOpacity,
            transform: [{ translateY: stickyHeaderTranslateY }],
          }
        ]}
        pointerEvents={showStickyHeader ? 'auto' : 'none'}
      >
        <View style={styles.stickyHeaderContent}>
          <Text style={[styles.stickyHeaderTitle, { color: theme.text }]} numberOfLines={1}>
            {currentVisibleCategory || 'Browse Materials'}
          </Text>
          <View style={styles.stickyHeaderActions}>
            <TouchableOpacity
              style={[styles.stickyHeaderButton, { backgroundColor: theme.surfaceVariant }]}
              onPress={() => {
                // Focus on main search input
                if (searchInputRef.current) {
                  searchInputRef.current.focus();
                }
              }}
            >
              <Text style={styles.stickyHeaderIcon}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stickyHeaderButton, { backgroundColor: theme.surfaceVariant }]}
              onPress={() => {
                Alert.alert('Notifications', 'You have no new notifications.');
              }}
            >
              <Text style={styles.stickyHeaderIcon}>🔔</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📚</Text>
      <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
        {searchQuery || selectedCategory 
          ? 'No materials found' 
          : 'No materials available'
        }
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
        {searchQuery || selectedCategory
          ? 'Try adjusting your search or filters'
          : isOnline 
            ? 'Be the first to share study materials!'
            : 'Connect to the internet to see available materials'
        }
      </Text>
      {!isOnline && (
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: theme.primary }]} 
          onPress={() => loadMaterials(true)}
        >
          <Text style={[styles.retryButtonText, { color: theme.textInverse }]}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoadingMore = () => (
    isLoadingMore && (
      <View style={styles.loadingMore}>
        <ActivityIndicator color={theme.primary} />
        <Text style={[styles.loadingMoreText, { color: theme.textSecondary }]}>Loading more materials...</Text>
      </View>
    )
  );



  if (loadingState === 'loading') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading study materials...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadingState === 'error' && materials.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorTitle, { color: theme.text }]}>Unable to load materials</Text>
          <Text style={[styles.errorSubtitle, { color: theme.textSecondary }]}>
            {isOnline 
              ? 'There was a problem loading the study materials. Please try again.'
              : 'You appear to be offline. Please check your internet connection.'
            }
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]} 
            onPress={() => loadMaterials(true)}
          >
            <Text style={[styles.retryButtonText, { color: theme.textInverse }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          {/* Header with greeting and theme toggle */}
          <HeaderGreeting
            userName={currentUser?.name}
            avatarUrl={currentUser?.avatar_url}
            onThemeToggle={toggleTheme}
            onNotificationPress={() => {
              Alert.alert('Notifications', 'You have no new notifications.');
            }}
            onAvatarPress={() => {
              navigation.navigate('Profile' as any);
            }}
            isDark={isDark}
            notificationCount={0}
          />

          {/* Search bar */}
          <SearchBar
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFilterPress={() => {
              Alert.alert('Filters', 'Advanced filtering options coming soon!');
            }}
          />

          {/* New for You promo card */}
          <PromoCard
            onPress={() => {
              Alert.alert('Coming Soon', 'Personalized recommendations are on the way!');
            }}
          />

          {/* Categories */}
          <SectionHeader title="Categories" subtitle="Browse by subject" />
          {renderCategoryFilters()}

          {/* Subject sections */}
          {renderSubjectSections()}

          {/* Empty state for filtered results */}
          {filteredMaterials.length === 0 && !refreshing && loadingState === 'success' && (
            renderEmptyState()
          )}

          {/* Loading more indicator */}
          {renderLoadingMore()}
        </ScrollView>
      </Animated.View>

      {/* Sticky Header */}
      {renderStickyHeader()}

      {/* Floating action button */}
      <FloatingAction
        actions={[]}
        onPressMain={() => navigation.navigate('Upload')}
        color={theme.primary}
        floatingIcon={<Text style={{ color: theme.textInverse, fontSize: 24 }}>+</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  subjectSection: {
    marginBottom: 24,
  },
  horizontalList: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingTop: 18,
    borderBottomWidth: 1,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stickyHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  stickyHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  stickyHeaderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyHeaderIcon: {
    fontSize: 16,
  },
});
export default HomeScreen;
