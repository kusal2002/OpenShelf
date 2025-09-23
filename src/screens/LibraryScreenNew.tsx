// /**
//  * Enhanced Library Screen Component  
//  * Modern UI for user's personal study materials with advanced management
//  */

// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   RefreshControl,
//   ActivityIndicator,
//   TextInput,
//   Alert,
//   Dimensions,
//   ScrollView,
//   Modal,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { NativeStackScreenProps } from '@react-navigation/native-stack';

// import { supabaseService } from '../services/supabase';
// import { 
//   Material, 
//   MainTabParamList, 
//   MaterialCategory, 
//   LoadingState,
//   AuthUser 
// } from '../types';
// import {
//   CacheManager,
//   NetworkUtils,
//   DateUtils,
//   FileUtils,
//   UIUtils,
//   UIComponents,
//   ErrorHandler,
//   THEME_COLORS,
//   UI_CONSTANTS,
//   MATERIAL_CATEGORIES,
//   FILE_ICONS,
// } from '../utils';

// const { width: screenWidth } = Dimensions.get('window');

// type Props = NativeStackScreenProps<MainTabParamList, 'Library'>;

// interface SortOption {
//   key: 'created_at' | 'title' | 'download_count' | 'file_size';
//   label: string;
//   icon: string;
// }

// const SORT_OPTIONS: SortOption[] = [
//   { key: 'created_at', label: 'Recently Added', icon: '📅' },
//   { key: 'title', label: 'Alphabetical', icon: '🔤' },
//   { key: 'download_count', label: 'Most Popular', icon: '📊' },
//   { key: 'file_size', label: 'File Size', icon: '📏' },
// ];

// export const LibraryScreen: React.FC<Props> = ({ navigation }) => {
//   const [materials, setMaterials] = useState<Material[]>([]);
//   const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
//   const [loadingState, setLoadingState] = useState<LoadingState>('loading');
//   const [refreshing, setRefreshing] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | null>(null);
//   const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
//   const [isOnline, setIsOnline] = useState(true);
//   const [sortBy, setSortBy] = useState<SortOption['key']>('created_at');
//   const [sortAscending, setSortAscending] = useState(false);
//   const [showSortModal, setShowSortModal] = useState(false);
//   const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
//   const [showActionModal, setShowActionModal] = useState(false);

//   useEffect(() => {
//     const unsubscribe = NetworkUtils.subscribeToNetworkStatus(setIsOnline);
//     return unsubscribe;
//   }, []);

//   useEffect(() => {
//     getCurrentUser();
//     loadUserMaterials(true);
//   }, []);

//   useEffect(() => {
//     filterAndSortMaterials();
//   }, [materials, searchQuery, selectedCategory, sortBy, sortAscending]);

//   const getCurrentUser = async () => {
//     try {
//       const response = await supabaseService.getCurrentUser();
//       if (response.success && response.data) {
//         setCurrentUser(response.data);
//       }
//     } catch (error) {
//       ErrorHandler.handle(error, 'Get current user error');
//     }
//   };

//   const loadUserMaterials = async (isInitialLoad: boolean = false) => {
//     if (!currentUser) return;

//     try {
//       if (isInitialLoad) {
//         setLoadingState('loading');
//       }

//       if (isOnline) {
//         const response = await supabaseService.getUserMaterials(currentUser.id);
        
//         if (response.success && response.data) {
//           setMaterials(response.data);
//           await CacheManager.cacheMaterials(response.data);
//           setLoadingState('success');
//         } else {
//           const cachedMaterials = await CacheManager.getCachedMaterials();
//           setMaterials(cachedMaterials);
//           setLoadingState(cachedMaterials.length > 0 ? 'success' : 'error');
//         }
//       } else {
//         const cachedMaterials = await CacheManager.getCachedMaterials();
//         setMaterials(cachedMaterials);
//         setLoadingState(cachedMaterials.length > 0 ? 'success' : 'error');
//       }
//     } catch (error) {
//       ErrorHandler.handle(error, 'Load user materials error');
//       setLoadingState('error');
//     }
//   };

//   const filterAndSortMaterials = () => {
//     let filtered = [...materials];

//     // Apply search filter
//     if (searchQuery.trim()) {
//       const query = searchQuery.toLowerCase();
//       filtered = filtered.filter(material =>
//         material.title.toLowerCase().includes(query) ||
//         material.description?.toLowerCase().includes(query) ||
//         material.tags?.some(tag => tag.toLowerCase().includes(query))
//       );
//     }

//     // Apply category filter
//     if (selectedCategory) {
//       filtered = filtered.filter(material => material.category === selectedCategory);
//     }

//     // Apply sorting
//     filtered.sort((a, b) => {
//       let aValue = a[sortBy];
//       let bValue = b[sortBy];

//       // Handle different data types
//       if (sortBy === 'created_at') {
//         aValue = new Date(aValue as string).getTime();
//         bValue = new Date(bValue as string).getTime();
//       } else if (typeof aValue === 'string' && typeof bValue === 'string') {
//         aValue = aValue.toLowerCase();
//         bValue = bValue.toLowerCase();
//       }

//       if (aValue < bValue) return sortAscending ? -1 : 1;
//       if (aValue > bValue) return sortAscending ? 1 : -1;
//       return 0;
//     });

//     setFilteredMaterials(filtered);
//   };

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     loadUserMaterials(true).finally(() => setRefreshing(false));
//   }, [currentUser]);

//   const deleteMaterial = async (material: Material) => {
//     try {
//       if (!isOnline) {
//         UIUtils.showAlert('Offline Mode', 'Cannot delete materials while offline.');
//         return;
//       }

//       Alert.alert(
//         '🗑️ Delete Material',
//         `Are you sure you want to delete "${material.title}"? This action cannot be undone.`,
//         [
//           { text: 'Cancel', style: 'cancel' },
//           {
//             text: 'Delete',
//             style: 'destructive',
//             onPress: async () => {
//               try {
//                 const response = await supabaseService.deleteMaterial(material.id, currentUser!.id);
//                 if (response.success) {
//                   setMaterials(prev => prev.filter(m => m.id !== material.id));
//                   UIUtils.showAlert('✅ Success', 'Material deleted successfully.');
//                 } else {
//                   UIUtils.showAlert('Error', response.error || 'Failed to delete material.');
//                 }
//               } catch (error) {
//                 ErrorHandler.handle(error, 'Delete material error');
//                 UIUtils.showAlert('Error', 'Failed to delete material. Please try again.');
//               }
//             },
//           },
//         ]
//       );
//     } catch (error) {
//       ErrorHandler.handle(error, 'Delete material error');
//     }
//   };

//   const editMaterial = (material: Material) => {
//     // Navigate to edit screen (you can implement this later)
//     UIUtils.showAlert(
//       '✏️ Edit Material',
//       'Material editing feature will be available in a future update.'
//     );
//   };

//   const shareMaterial = async (material: Material) => {
//     try {
//       // In a real app, you would implement actual sharing
//       UIUtils.showAlert(
//         '📤 Share Material',
//         `Share link for "${material.title}" copied to clipboard.`
//       );
//     } catch (error) {
//       ErrorHandler.handle(error, 'Share material error');
//     }
//   };

//   const renderHeader = () => (
//     <View style={styles.header}>
//       <Text style={styles.title}>📚 My Library</Text>
//       <Text style={styles.subtitle}>
//         Manage your uploaded study materials and track their performance
//       </Text>
      
//       {!isOnline && (
//         <View style={styles.offlineBanner}>
//           <Text style={styles.offlineBannerText}>
//             📱 Viewing offline content - some features unavailable
//           </Text>
//         </View>
//       )}
//     </View>
//   );

//   const renderSearchAndSort = () => (
//     <View style={styles.controlsContainer}>
//       <View style={styles.searchBar}>
//         <Text style={styles.searchIcon}>🔍</Text>
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search your materials..."
//           placeholderTextColor={THEME_COLORS.textTertiary}
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//         />
//         {searchQuery.length > 0 && (
//           <TouchableOpacity
//             style={styles.clearButton}
//             onPress={() => setSearchQuery('')}
//           >
//             <Text style={styles.clearButtonText}>✕</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       <TouchableOpacity
//         style={styles.sortButton}
//         onPress={() => setShowSortModal(true)}
//       >
//         <Text style={styles.sortButtonIcon}>⚡</Text>
//         <Text style={styles.sortButtonText}>
//           {SORT_OPTIONS.find(option => option.key === sortBy)?.label}
//         </Text>
//         <Text style={styles.sortButtonArrow}>
//           {sortAscending ? '↑' : '↓'}
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );

//   const renderCategoryFilters = () => (
//     <View style={styles.categoriesContainer}>
//       <ScrollView 
//         horizontal 
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={styles.categoriesContent}
//       >
//         <TouchableOpacity
//           style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
//           onPress={() => setSelectedCategory(null)}
//         >
//           <Text style={[
//             styles.categoryChipText, 
//             !selectedCategory && styles.categoryChipTextActive
//           ]}>
//             All ({materials.length})
//           </Text>
//         </TouchableOpacity>
        
//         {MATERIAL_CATEGORIES.map((category) => {
//           const count = materials.filter(m => m.category === category).length;
//           if (count === 0) return null;
          
//           return (
//             <TouchableOpacity
//               key={category}
//               style={[
//                 styles.categoryChip, 
//                 selectedCategory === category && styles.categoryChipActive
//               ]}
//               onPress={() => setSelectedCategory(
//                 selectedCategory === category ? null : category
//               )}
//             >
//               <Text style={[
//                 styles.categoryChipText,
//                 selectedCategory === category && styles.categoryChipTextActive
//               ]}>
//                 {category} ({count})
//               </Text>
//             </TouchableOpacity>
//           );
//         })}
//       </ScrollView>
//     </View>
//   );

//   const renderStats = () => {
//     const totalDownloads = materials.reduce((sum, material) => sum + (material.download_count || 0), 0);
//     const totalSize = materials.reduce((sum, material) => sum + (material.file_size || 0), 0);

//     return (
//       <View style={styles.statsContainer}>
//         <View style={styles.statItem}>
//           <Text style={styles.statNumber}>{filteredMaterials.length}</Text>
//           <Text style={styles.statLabel}>Materials</Text>
//         </View>
//         <View style={styles.statDivider} />
//         <View style={styles.statItem}>
//           <Text style={styles.statNumber}>{totalDownloads}</Text>
//           <Text style={styles.statLabel}>Downloads</Text>
//         </View>
//         <View style={styles.statDivider} />
//         <View style={styles.statItem}>
//           <Text style={styles.statNumber}>{FileUtils.formatFileSize(totalSize)}</Text>
//           <Text style={styles.statLabel}>Total Size</Text>
//         </View>
//       </View>
//     );
//   };

//   const renderMaterialCard = ({ item }: { item: Material }) => (
//     <TouchableOpacity
//       style={styles.materialCard}
//       onPress={() => {
//         setSelectedMaterial(item);
//         setShowActionModal(true);
//       }}
//       activeOpacity={0.7}
//     >
//       <View style={styles.materialHeader}>
//         <View style={styles.materialIcon}>
//           <Text style={styles.materialIconText}>
//             {FILE_ICONS[item.file_type as keyof typeof FILE_ICONS] || '📄'}
//           </Text>
//         </View>
//         <View style={styles.materialInfo}>
//           <Text style={styles.materialTitle} numberOfLines={2}>
//             {item.title}
//           </Text>
//           <View style={styles.materialMeta}>
//             <Text style={styles.materialCategory}>{item.category}</Text>
//             <Text style={styles.materialSize}>
//               {FileUtils.formatFileSize(item.file_size)}
//             </Text>
//           </View>
//         </View>
//         <TouchableOpacity
//           style={styles.menuButton}
//           onPress={() => {
//             setSelectedMaterial(item);
//             setShowActionModal(true);
//           }}
//         >
//           <Text style={styles.menuButtonText}>⋯</Text>
//         </TouchableOpacity>
//       </View>

//       {item.description && (
//         <Text style={styles.materialDescription} numberOfLines={2}>
//           {item.description}
//         </Text>
//       )}

//       {item.tags && item.tags.length > 0 && (
//         <View style={styles.tagsContainer}>
//           {item.tags.slice(0, 2).map((tag, index) => (
//             <View key={index} style={styles.tag}>
//               <Text style={styles.tagText}>{tag}</Text>
//             </View>
//           ))}
//           {item.tags.length > 2 && (
//             <Text style={styles.moreTagsText}>+{item.tags.length - 2} more</Text>
//           )}
//         </View>
//       )}

//       <View style={styles.materialFooter}>
//         <Text style={styles.materialDate}>
//           Added {DateUtils.getRelativeTime(item.created_at)}
//         </Text>
//         <View style={styles.performanceInfo}>
//           <Text style={styles.downloadCount}>
//             📥 {item.download_count || 0}
//           </Text>
//           <View style={[
//             styles.statusBadge,
//             item.download_count && item.download_count > 10 
//               ? styles.statusBadgePopular 
//               : styles.statusBadgeNormal
//           ]}>
//             <Text style={[
//               styles.statusBadgeText,
//               item.download_count && item.download_count > 10 
//                 ? styles.statusBadgeTextPopular 
//                 : styles.statusBadgeTextNormal
//             ]}>
//               {item.download_count && item.download_count > 10 ? 'Popular' : 'Active'}
//             </Text>
//           </View>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );

//   const renderEmptyState = () => (
//     <View style={styles.emptyState}>
//       <Text style={styles.emptyStateIcon}>📖</Text>
//       <Text style={styles.emptyStateTitle}>
//         {searchQuery || selectedCategory 
//           ? 'No materials found' 
//           : 'Your library is empty'
//         }
//       </Text>
//       <Text style={styles.emptyStateSubtitle}>
//         {searchQuery || selectedCategory
//           ? 'Try adjusting your search or filters'
//           : 'Start building your digital library by uploading study materials to share with the university community'
//         }
//       </Text>
//       {!searchQuery && !selectedCategory && (
//         <TouchableOpacity 
//           style={styles.uploadButton}
//           onPress={() => navigation.navigate('Upload')}
//         >
//           <Text style={styles.uploadButtonText}>📤 Upload Material</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );

//   const renderSortModal = () => (
//     <Modal
//       visible={showSortModal}
//       transparent={true}
//       animationType="slide"
//       onRequestClose={() => setShowSortModal(false)}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={styles.sortModal}>
//           <Text style={styles.sortModalTitle}>Sort Materials</Text>
          
//           {SORT_OPTIONS.map((option) => (
//             <TouchableOpacity
//               key={option.key}
//               style={[
//                 styles.sortOption,
//                 sortBy === option.key && styles.sortOptionActive
//               ]}
//               onPress={() => {
//                 if (sortBy === option.key) {
//                   setSortAscending(!sortAscending);
//                 } else {
//                   setSortBy(option.key);
//                   setSortAscending(false);
//                 }
//               }}
//             >
//               <Text style={styles.sortOptionIcon}>{option.icon}</Text>
//               <Text style={[
//                 styles.sortOptionText,
//                 sortBy === option.key && styles.sortOptionTextActive
//               ]}>
//                 {option.label}
//               </Text>
//               {sortBy === option.key && (
//                 <Text style={styles.sortOptionArrow}>
//                   {sortAscending ? '↑' : '↓'}
//                 </Text>
//               )}
//             </TouchableOpacity>
//           ))}
          
//           <TouchableOpacity
//             style={styles.sortModalButton}
//             onPress={() => setShowSortModal(false)}
//           >
//             <Text style={styles.sortModalButtonText}>Done</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );

//   const renderActionModal = () => (
//     <Modal
//       visible={showActionModal}
//       transparent={true}
//       animationType="slide"
//       onRequestClose={() => setShowActionModal(false)}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={styles.actionModal}>
//           {selectedMaterial && (
//             <>
//               <Text style={styles.actionModalTitle}>
//                 {selectedMaterial.title}
//               </Text>
              
//               <TouchableOpacity
//                 style={styles.actionOption}
//                 onPress={() => {
//                   setShowActionModal(false);
//                   editMaterial(selectedMaterial);
//                 }}
//               >
//                 <Text style={styles.actionOptionIcon}>✏️</Text>
//                 <Text style={styles.actionOptionText}>Edit Material</Text>
//               </TouchableOpacity>
              
//               <TouchableOpacity
//                 style={styles.actionOption}
//                 onPress={() => {
//                   setShowActionModal(false);
//                   shareMaterial(selectedMaterial);
//                 }}
//               >
//                 <Text style={styles.actionOptionIcon}>📤</Text>
//                 <Text style={styles.actionOptionText}>Share Material</Text>
//               </TouchableOpacity>
              
//               <TouchableOpacity
//                 style={[styles.actionOption, styles.actionOptionDanger]}
//                 onPress={() => {
//                   setShowActionModal(false);
//                   deleteMaterial(selectedMaterial);
//                 }}
//               >
//                 <Text style={styles.actionOptionIcon}>🗑️</Text>
//                 <Text style={styles.actionOptionText}>Delete Material</Text>
//               </TouchableOpacity>
              
//               <TouchableOpacity
//                 style={styles.actionModalButton}
//                 onPress={() => setShowActionModal(false)}
//               >
//                 <Text style={styles.actionModalButtonText}>Cancel</Text>
//               </TouchableOpacity>
//             </>
//           )}
//         </View>
//       </View>
//     </Modal>
//   );

//   if (loadingState === 'loading') {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={THEME_COLORS.primary} />
//           <Text style={styles.loadingText}>Loading your library...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (loadingState === 'error' && materials.length === 0) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorIcon}>⚠️</Text>
//           <Text style={styles.errorTitle}>Unable to load library</Text>
//           <Text style={styles.errorSubtitle}>
//             {isOnline 
//               ? 'There was a problem loading your materials. Please try again.'
//               : 'You appear to be offline. Please check your internet connection.'
//             }
//           </Text>
//           <TouchableOpacity style={styles.retryButton} onPress={() => loadUserMaterials(true)}>
//             <Text style={styles.retryButtonText}>Try Again</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <FlatList
//         data={filteredMaterials}
//         keyExtractor={(item) => item.id}
//         renderItem={renderMaterialCard}
//         ListHeaderComponent={
//           <View>
//             {renderHeader()}
//             {renderSearchAndSort()}
//             {renderCategoryFilters()}
//             {renderStats()}
//           </View>
//         }
//         ListEmptyComponent={renderEmptyState}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={[THEME_COLORS.primary]}
//             tintColor={THEME_COLORS.primary}
//           />
//         }
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.listContent}
//       />
      
//       {renderSortModal()}
//       {renderActionModal()}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: THEME_COLORS.background,
//   },
//   listContent: {
//     flexGrow: 1,
//   },
//   header: {
//     padding: UI_CONSTANTS.spacing.lg,
//     paddingBottom: UI_CONSTANTS.spacing.md,
//   },
//   title: {
//     ...UI_CONSTANTS.typography.h2,
//     color: THEME_COLORS.text,
//     marginBottom: UI_CONSTANTS.spacing.xs,
//   },
//   subtitle: {
//     ...UI_CONSTANTS.typography.body2,
//     color: THEME_COLORS.textSecondary,
//     lineHeight: 22,
//   },
//   offlineBanner: {
//     backgroundColor: THEME_COLORS.warningLight,
//     padding: UI_CONSTANTS.spacing.sm,
//     borderRadius: UI_CONSTANTS.borderRadius.sm,
//     marginTop: UI_CONSTANTS.spacing.md,
//   },
//   offlineBannerText: {
//     ...UI_CONSTANTS.typography.body2,
//     color: THEME_COLORS.text,
//     textAlign: 'center',
//   },
//   controlsContainer: {
//     flexDirection: 'row',
//     paddingHorizontal: UI_CONSTANTS.spacing.lg,
//     paddingBottom: UI_CONSTANTS.spacing.md,
//     gap: UI_CONSTANTS.spacing.sm,
//   },
//   searchBar: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: THEME_COLORS.surface,
//     borderRadius: UI_CONSTANTS.borderRadius.lg,
//     paddingHorizontal: UI_CONSTANTS.spacing.md,
//     ...UI_CONSTANTS.elevation[1],
//   },
//   searchIcon: {
//     fontSize: 18,
//     marginRight: UI_CONSTANTS.spacing.sm,
//   },
//   searchInput: {
//     flex: 1,
//     ...UI_CONSTANTS.typography.body1,
//     color: THEME_COLORS.text,
//     paddingVertical: UI_CONSTANTS.spacing.md,
//   },
//   clearButton: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: THEME_COLORS.outline,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   clearButtonText: {
//     fontSize: 14,
//     color: THEME_COLORS.textSecondary,
//   },
//   sortButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: THEME_COLORS.surface,
//     borderRadius: UI_CONSTANTS.borderRadius.lg,
//     paddingHorizontal: UI_CONSTANTS.spacing.md,
//     paddingVertical: UI_CONSTANTS.spacing.md,
//     ...UI_CONSTANTS.elevation[1],
//     gap: UI_CONSTANTS.spacing.xs,
//   },
//   sortButtonIcon: {
//     fontSize: 16,
//   },
//   sortButtonText: {
//     ...UI_CONSTANTS.typography.body2,
//     color: THEME_COLORS.text,
//     fontWeight: '500',
//   },
//   sortButtonArrow: {
//     fontSize: 14,
//     color: THEME_COLORS.primary,
//   },
//   categoriesContainer: {
//     paddingBottom: UI_CONSTANTS.spacing.md,
//   },
//   categoriesContent: {
//     paddingHorizontal: UI_CONSTANTS.spacing.lg,
//     gap: UI_CONSTANTS.spacing.sm,
//   },
//   categoryChip: {
//     paddingHorizontal: UI_CONSTANTS.spacing.md,
//     paddingVertical: UI_CONSTANTS.spacing.sm,
//     backgroundColor: THEME_COLORS.surface,
//     borderRadius: UI_CONSTANTS.borderRadius.lg,
//     borderWidth: 1,
//     borderColor: THEME_COLORS.outline,
//     ...UI_CONSTANTS.elevation[1],
//   },
//   categoryChipActive: {
//     backgroundColor: THEME_COLORS.primary,
//     borderColor: THEME_COLORS.primary,
//   },
//   categoryChipText: {
//     ...UI_CONSTANTS.typography.body2,
//     color: THEME_COLORS.text,
//     fontWeight: '500',
//   },
//   categoryChipTextActive: {
//     color: THEME_COLORS.textInverse,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     backgroundColor: THEME_COLORS.surface,
//     marginHorizontal: UI_CONSTANTS.spacing.lg,
//     marginBottom: UI_CONSTANTS.spacing.lg,
//     borderRadius: UI_CONSTANTS.borderRadius.md,
//     padding: UI_CONSTANTS.spacing.lg,
//     ...UI_CONSTANTS.elevation[2],
//   },
//   statItem: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   statNumber: {
//     ...UI_CONSTANTS.typography.h4,
//     color: THEME_COLORS.primary,
//     fontWeight: 'bold',
//     marginBottom: UI_CONSTANTS.spacing.xs,
//   },
//   statLabel: {
//     ...UI_CONSTANTS.typography.caption,
//     color: THEME_COLORS.textSecondary,
//     textTransform: 'uppercase',
//     fontWeight: '500',
//   },
//   statDivider: {
//     width: 1,
//     backgroundColor: THEME_COLORS.outline,
//     marginHorizontal: UI_CONSTANTS.spacing.md,
//   },
//   materialCard: {
//     ...UIComponents.getCardStyle(2),
//     marginHorizontal: UI_CONSTANTS.spacing.lg,
//     marginBottom: UI_CONSTANTS.spacing.md,
//   },
//   materialHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: UI_CONSTANTS.spacing.sm,
//   },
//   materialIcon: {
//     width: 48,
//     height: 48,
//     borderRadius: UI_CONSTANTS.borderRadius.sm,
//     backgroundColor: THEME_COLORS.primaryLight,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: UI_CONSTANTS.spacing.md,
//   },
//   materialIconText: {
//     fontSize: 24,
//   },
//   materialInfo: {
//     flex: 1,
//   },
//   materialTitle: {
//     ...UI_CONSTANTS.typography.h6,
//     color: THEME_COLORS.text,
//     fontWeight: '600',
//     marginBottom: UI_CONSTANTS.spacing.xs,
//   },
//   materialMeta: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: UI_CONSTANTS.spacing.sm,
//   },
//   materialCategory: {
//     ...UI_CONSTANTS.typography.caption,
//     color: THEME_COLORS.primary,
//     fontWeight: '500',
//     textTransform: 'uppercase',
//   },
//   materialSize: {
//     ...UI_CONSTANTS.typography.caption,
//     color: THEME_COLORS.textTertiary,
//   },
//   menuButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: THEME_COLORS.surfaceVariant,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   menuButtonText: {
//     fontSize: 18,
//     color: THEME_COLORS.text,
//   },
//   materialDescription: {
//     ...UI_CONSTANTS.typography.body2,
//     color: THEME_COLORS.textSecondary,
//     lineHeight: 20,
//     marginBottom: UI_CONSTANTS.spacing.sm,
//   },
//   tagsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     alignItems: 'center',
//     marginBottom: UI_CONSTANTS.spacing.sm,
//     gap: UI_CONSTANTS.spacing.xs,
//   },
//   tag: {
//     backgroundColor: THEME_COLORS.surfaceVariant,
//     paddingHorizontal: UI_CONSTANTS.spacing.sm,
//     paddingVertical: UI_CONSTANTS.spacing.xs,
//     borderRadius: UI_CONSTANTS.borderRadius.sm,
//   },
//   tagText: {
//     ...UI_CONSTANTS.typography.caption,
//     color: THEME_COLORS.textSecondary,
//     fontWeight: '500',
//   },
//   moreTagsText: {
//     ...UI_CONSTANTS.typography.caption,
//     color: THEME_COLORS.textTertiary,
//     fontStyle: 'italic',
//   },
//   materialFooter: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginTop: UI_CONSTANTS.spacing.xs,
//   },
//   materialDate: {
//     ...UI_CONSTANTS.typography.caption,
//     color: THEME_COLORS.textTertiary,
//   },
//   performanceInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: UI_CONSTANTS.spacing.sm,
//   },
//   downloadCount: {
//     ...UI_CONSTANTS.typography.caption,
//     color: THEME_COLORS.textSecondary,
//   },
//   statusBadge: {
//     paddingHorizontal: UI_CONSTANTS.spacing.sm,
//     paddingVertical: UI_CONSTANTS.spacing.xs,
//     borderRadius: UI_CONSTANTS.borderRadius.sm,
//   },
//   statusBadgeNormal: {
//     backgroundColor: THEME_COLORS.surfaceVariant,
//   },
//   statusBadgePopular: {
//     backgroundColor: THEME_COLORS.successLight,
//   },
//   statusBadgeText: {
//     ...UI_CONSTANTS.typography.caption,
//     fontWeight: '600',
//   },
//   statusBadgeTextNormal: {
//     color: THEME_COLORS.textSecondary,
//   },
//   statusBadgeTextPopular: {
//     color: THEME_COLORS.success,
//   },
//   emptyState: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: UI_CONSTANTS.spacing.xxl,
//   },
//   emptyStateIcon: {
//     fontSize: 64,
//     marginBottom: UI_CONSTANTS.spacing.lg,
//   },
//   emptyStateTitle: {
//     ...UI_CONSTANTS.typography.h5,
//     color: THEME_COLORS.text,
//     textAlign: 'center',
//     marginBottom: UI_CONSTANTS.spacing.sm,
//   },
//   emptyStateSubtitle: {
//     ...UI_CONSTANTS.typography.body2,
//     color: THEME_COLORS.textSecondary,
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: UI_CONSTANTS.spacing.lg,
//   },
//   uploadButton: {
//     ...UIComponents.getButtonStyle('primary'),
//     backgroundColor: THEME_COLORS.primary,
//     paddingHorizontal: UI_CONSTANTS.spacing.xl,
//   },
//   uploadButtonText: {
//     ...UI_CONSTANTS.typography.body1,
//     color: THEME_COLORS.textInverse,
//     fontWeight: '600',
//   },
//   loadingContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: UI_CONSTANTS.spacing.xxl,
//   },
//   loadingText: {
//     ...UI_CONSTANTS.typography.body1,
//     color: THEME_COLORS.textSecondary,
//     marginTop: UI_CONSTANTS.spacing.md,
//   },
//   errorContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: UI_CONSTANTS.spacing.xxl,
//   },
//   errorIcon: {
//     fontSize: 64,
//     marginBottom: UI_CONSTANTS.spacing.lg,
//   },
//   errorTitle: {
//     ...UI_CONSTANTS.typography.h5,
//     color: THEME_COLORS.text,
//     textAlign: 'center',
//     marginBottom: UI_CONSTANTS.spacing.sm,
//   },
//   errorSubtitle: {
//     ...UI_CONSTANTS.typography.body2,
//     color: THEME_COLORS.textSecondary,
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: UI_CONSTANTS.spacing.lg,
//   },
//   retryButton: {
//     ...UIComponents.getButtonStyle('primary'),
//     backgroundColor: THEME_COLORS.primary,
//     paddingHorizontal: UI_CONSTANTS.spacing.xl,
//   },
//   retryButtonText: {
//     ...UI_CONSTANTS.typography.body1,
//     color: THEME_COLORS.textInverse,
//     fontWeight: '600',
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'flex-end',
//   },
//   sortModal: {
//     backgroundColor: THEME_COLORS.surface,
//     borderTopLeftRadius: UI_CONSTANTS.borderRadius.lg,
//     borderTopRightRadius: UI_CONSTANTS.borderRadius.lg,
//     padding: UI_CONSTANTS.spacing.lg,
//     maxHeight: screenWidth * 0.8,
//   },
//   sortModalTitle: {
//     ...UI_CONSTANTS.typography.h5,
//     color: THEME_COLORS.text,
//     textAlign: 'center',
//     marginBottom: UI_CONSTANTS.spacing.lg,
//   },
//   sortOption: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: UI_CONSTANTS.spacing.md,
//     paddingHorizontal: UI_CONSTANTS.spacing.sm,
//     borderRadius: UI_CONSTANTS.borderRadius.sm,
//     marginBottom: UI_CONSTANTS.spacing.xs,
//   },
//   sortOptionActive: {
//     backgroundColor: THEME_COLORS.primaryLight,
//   },
//   sortOptionIcon: {
//     fontSize: 18,
//     marginRight: UI_CONSTANTS.spacing.md,
//     width: 24,
//   },
//   sortOptionText: {
//     flex: 1,
//     ...UI_CONSTANTS.typography.body1,
//     color: THEME_COLORS.text,
//   },
//   sortOptionTextActive: {
//     color: THEME_COLORS.primary,
//     fontWeight: '600',
//   },
//   sortOptionArrow: {
//     fontSize: 16,
//     color: THEME_COLORS.primary,
//   },
//   sortModalButton: {
//     ...UIComponents.getButtonStyle('primary'),
//     backgroundColor: THEME_COLORS.primary,
//     marginTop: UI_CONSTANTS.spacing.lg,
//   },
//   sortModalButtonText: {
//     ...UI_CONSTANTS.typography.body1,
//     color: THEME_COLORS.textInverse,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   actionModal: {
//     backgroundColor: THEME_COLORS.surface,
//     borderTopLeftRadius: UI_CONSTANTS.borderRadius.lg,
//     borderTopRightRadius: UI_CONSTANTS.borderRadius.lg,
//     padding: UI_CONSTANTS.spacing.lg,
//     maxHeight: screenWidth * 0.7,
//   },
//   actionModalTitle: {
//     ...UI_CONSTANTS.typography.h6,
//     color: THEME_COLORS.text,
//     textAlign: 'center',
//     marginBottom: UI_CONSTANTS.spacing.lg,
//   },
//   actionOption: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: UI_CONSTANTS.spacing.md,
//     paddingHorizontal: UI_CONSTANTS.spacing.sm,
//     borderRadius: UI_CONSTANTS.borderRadius.sm,
//     marginBottom: UI_CONSTANTS.spacing.xs,
//   },
//   actionOptionDanger: {
//     backgroundColor: THEME_COLORS.errorLight,
//   },
//   actionOptionIcon: {
//     fontSize: 18,
//     marginRight: UI_CONSTANTS.spacing.md,
//     width: 24,
//   },
//   actionOptionText: {
//     flex: 1,
//     ...UI_CONSTANTS.typography.body1,
//     color: THEME_COLORS.text,
//   },
//   actionModalButton: {
//     ...UIComponents.getButtonStyle('secondary'),
//     backgroundColor: THEME_COLORS.surfaceVariant,
//     marginTop: UI_CONSTANTS.spacing.lg,
//   },
//   actionModalButtonText: {
//     ...UI_CONSTANTS.typography.body1,
//     color: THEME_COLORS.text,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
// });

// export default LibraryScreen;
