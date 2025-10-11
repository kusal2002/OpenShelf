/**
 * Search Screen Component
 * AI-powered semantic search with history and trending searches
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseService } from '../services/supabase';
import { MainTabParamList, Material, MaterialCategory } from '../types';
import { THEME_COLORS, UI_CONSTANTS } from '../utils';

type Props = NativeStackScreenProps<MainTabParamList, 'Search'>;

export const SearchScreen = ({ navigation }: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Material[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // AI Enhancement States
  const [aiEnhanced, setAiEnhanced] = useState(true);
  const [expandedQuery, setExpandedQuery] = useState('');
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | ''>('');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'rating' | 'downloads'>('relevance');
  const [fileTypes, setFileTypes] = useState<string[]>([]);
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([]);
  
  // Available categories and file types
  const categories: MaterialCategory[] = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Engineering', 'Literature', 'History', 'Other'];
  const availableFileTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'epub'];

  useEffect(() => {
    loadSearchHistory();
    loadTrendingSearches();
  }, []);

  // Refresh trending searches when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTrendingSearches();
    });
    
    return unsubscribe;
  }, [navigation]);

  // Debounced search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        // Show search suggestions first
        updateSearchSuggestions(searchQuery);
        // Then perform the actual search
        performSemanticSearch(searchQuery);
      } else {
        setSearchResults([]);
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce delay

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, updateSearchSuggestions, performSemanticSearch]);

  // Re-search when filters change
  useEffect(() => {
    if (searchQuery.trim()) {
      performSemanticSearch(searchQuery);
    }
  }, [selectedCategory, selectedFileTypes, sortBy, performSemanticSearch, searchQuery]);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveSearchHistory = useCallback(async (query: string) => {
    try {
      const updatedHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
      setSearchHistory(updatedHistory);
      await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }, [searchHistory]);

    const loadTrendingSearches = async () => {
    try {
      console.log('Loading trending searches...');
      const response = await supabaseService.getTrendingSearches(10);
      console.log('Trending searches response:', response);
      if (response.success && response.data && response.data.length > 0) {
        console.log('Setting trending searches:', response.data);
        setTrendingSearches(response.data);
      } else {
        console.log('Using fallback trending searches - no data or empty response');
        // Fallback to default trending searches
        setTrendingSearches(['Machine Learning', 'Data Structures', 'React Native', 'Algorithms', 'Database Design']);
      }
    } catch (error) {
      console.error('Error loading trending searches:', error);
      // Fallback to default trending searches
      setTrendingSearches(['Machine Learning', 'Data Structures', 'React Native', 'Algorithms', 'Database Design']);
    }
  };

  const updateSearchSuggestions = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setExpandedQuery('');
      setSearchKeywords([]);
      return;
    }

    // AI-powered query expansion
    if (aiEnhanced) {
      expandSearchQuery(query);
    }

    // Get suggestions from trending searches that match the query
    const matchingSuggestions = trendingSearches
      .filter(trend => trend.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5); // Limit to 5 suggestions

    // Also include recent searches that match
    const matchingHistory = searchHistory
      .filter(history => history.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3); // Limit to 3 history items

    // Combine and deduplicate
    const allSuggestions = [...matchingSuggestions, ...matchingHistory];
    const uniqueSuggestions = allSuggestions.filter((item, index) => allSuggestions.indexOf(item) === index);

    setSearchSuggestions(uniqueSuggestions);
    setShowSuggestions(uniqueSuggestions.length > 0);
  }, [trendingSearches, searchHistory, aiEnhanced, expandSearchQuery]);

  const extractKeywords = useCallback((query: string): string[] => {
    // Simple keyword extraction - can be enhanced with NLP
    return query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['and', 'or', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word));
  }, []);

  const generateExpandedQuery = useCallback((original: string, keywords: string[]): string => {
    // Simple synonym mapping - can be enhanced with AI models
    const synonymMap: { [key: string]: string[] } = {
      'machine': ['artificial', 'computer', 'automated'],
      'learning': ['study', 'education', 'training', 'knowledge'],
      'algorithm': ['method', 'procedure', 'technique', 'approach'],
      'data': ['information', 'dataset', 'statistics', 'facts'],
      'programming': ['coding', 'development', 'software'],
      'database': ['data storage', 'repository', 'databank'],
      'network': ['connection', 'internet', 'web', 'system'],
      'structure': ['organization', 'framework', 'architecture'],
    };

    let expanded = original;
    keywords.forEach(keyword => {
      if (synonymMap[keyword]) {
        expanded += ' ' + synonymMap[keyword].join(' ');
      }
    });

    return expanded;
  }, []);

  // AI-powered query expansion
  const expandSearchQuery = useCallback((query: string) => {
    const keywords = extractKeywords(query);
    setSearchKeywords(keywords);
    
    // Generate expanded query with synonyms and related terms
    const expanded = generateExpandedQuery(query, keywords);
    setExpandedQuery(expanded);
  }, [extractKeywords, generateExpandedQuery]);

  const performSemanticSearch = useCallback(async (query: string, saveToHistory: boolean = false) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      // Use expanded query if AI enhancement is enabled
      const finalQuery = aiEnhanced && expandedQuery ? expandedQuery : query;
      
      // Build search options with filters
      const searchOptions: any = { 
        limit: 50,
        category: selectedCategory || undefined,
      };
      
      // Use AI-powered semantic search (falls back to basic search if HF key missing)
      const response = await supabaseService.semanticSearchMaterials(finalQuery, searchOptions);
      
      if (response.success && response.data) {
        let results = response.data;
        
        // Apply additional filters
        if (selectedFileTypes.length > 0) {
          results = results.filter(material => 
            selectedFileTypes.some(type => 
              material.file_type?.toLowerCase().includes(type.toLowerCase()) ||
              material.file_name?.toLowerCase().endsWith(`.${type.toLowerCase()}`)
            )
          );
        }
        
        // Apply sorting
        results = sortSearchResults(results, sortBy);
        
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
      
      if (saveToHistory) {
        saveSearchHistory(query);
        // Also save to global search analytics
        try {
          const { session } = await supabaseService.getCurrentSession();
          await supabaseService.saveSearchQuery(query, session?.user?.id);
        } catch (error) {
          // Silently fail if search tracking fails
          console.warn('Failed to save search query for analytics:', error);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Failed to perform search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [aiEnhanced, expandedQuery, selectedCategory, selectedFileTypes, sortBy, saveSearchHistory]);

  const sortSearchResults = (results: Material[], sortType: string): Material[] => {
    switch (sortType) {
      case 'date':
        return [...results].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
      case 'rating':
        return [...results].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      case 'downloads':
        return [...results].sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
      case 'relevance':
      default:
        return results; // Already sorted by relevance from semantic search
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      performSemanticSearch(searchQuery, true);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    performSemanticSearch(suggestion, true);
  };

  const handleHistoryItemPress = (query: string) => {
    setSearchQuery(query);
    performSemanticSearch(query, true);
  };

  const clearHistory = async () => {
    setSearchHistory([]);
    await AsyncStorage.removeItem('searchHistory');
  };

  const renderSearchResult = ({ item }: { item: Material }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => (navigation as any).navigate('MaterialDetails', { material: item })}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.resultMeta}>
          <Text style={styles.resultFileType}>{item.file_type?.toUpperCase() || 'PDF'}</Text>
          {item.average_rating && (
            <Text style={styles.resultRating}>⭐ {item.average_rating.toFixed(1)}</Text>
          )}
        </View>
      </View>
      <Text style={styles.resultDescription} numberOfLines={3}>
        {item.description || 'No description available'}
      </Text>
      <View style={styles.resultFooter}>
        <Text style={styles.resultCategory}>{item.category}</Text>
        <Text style={styles.resultDate}>
          {new Date(item.created_at || '').toLocaleDateString()}
        </Text>
        <Text style={styles.resultDownloads}>
          {item.download_count || 0} downloads
        </Text>
      </View>
      {/* Highlight matching keywords */}
      {searchKeywords.length > 0 && (
        <View style={styles.keywordContainer}>
          {searchKeywords.slice(0, 3).map((keyword, index) => (
            <Text key={index} style={styles.keyword}>#{keyword}</Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleHistoryItemPress(item)}
    >
      <Text style={styles.historyText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderTrendingItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.trendingItem}
      onPress={() => handleHistoryItemPress(item)}
    >
      <Text style={styles.trendingText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={aiEnhanced ? "AI-powered search for study materials..." : "Search for study materials..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setSearchSuggestions([]);
                setShowSuggestions(false);
                setExpandedQuery('');
                setSearchKeywords([]);
              }}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>
            {isLoading ? 'Searching...' : 'Search'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* AI Enhancement and Filter Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.aiToggleContainer}>
          <Text style={styles.aiToggleLabel}>AI Enhanced</Text>
          <Switch
            value={aiEnhanced}
            onValueChange={setAiEnhanced}
            trackColor={{ false: THEME_COLORS.surfaceVariant, true: THEME_COLORS.primary }}
            thumbColor={aiEnhanced ? THEME_COLORS.background : THEME_COLORS.textSecondary}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterButtonText}>Filters</Text>
          {(selectedCategory || selectedFileTypes.length > 0) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {String((selectedCategory ? 1 : 0) + selectedFileTypes.length)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* AI Query Expansion Display */}
      {aiEnhanced && expandedQuery && expandedQuery !== searchQuery && (
        <View style={styles.expansionContainer}>
          <Text style={styles.expansionLabel}>AI Expanded Query:</Text>
          <Text style={styles.expansionText} numberOfLines={2}>{expandedQuery}</Text>
        </View>
      )}

      {/* Search Suggestions Dropdown */}
      {showSuggestions && searchSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {searchSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={`${suggestion}-${index}`}
              style={styles.suggestionItem}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView style={styles.content}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME_COLORS.primary} />
            <Text style={styles.loadingText}>
              {aiEnhanced ? 'AI is analyzing your search...' : 'Searching materials...'}
            </Text>
          </View>
        )}

        {searchResults.length > 0 && !isLoading && (
          <View style={styles.section}>
            <View style={styles.resultHeaderContainer}>
              <Text style={styles.sectionTitle}>
                Search Results ({searchResults.length})
              </Text>
              <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>Sort:</Text>
                <TouchableOpacity
                  style={[styles.sortButton, sortBy === 'relevance' && styles.sortButtonActive]}
                  onPress={() => setSortBy('relevance')}
                >
                  <Text style={[styles.sortButtonText, sortBy === 'relevance' && styles.sortButtonTextActive]}>
                    Relevance
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
                  onPress={() => setSortBy('date')}
                >
                  <Text style={[styles.sortButtonText, sortBy === 'date' && styles.sortButtonTextActive]}>
                    Date
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
                  onPress={() => setSortBy('rating')}
                >
                  <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.sortButtonTextActive]}>
                    Rating
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}

        {searchQuery && !isLoading && searchResults.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No materials found for "{searchQuery}"</Text>
            <Text style={styles.noResultsSubtext}>
              Try adjusting your search terms or using different keywords
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            {searchHistory.length > 0 && (
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          {searchHistory.length > 0 ? (
            <FlatList
              data={searchHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item, index) => `${item}-${index}`}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>No recent searches</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Searches</Text>
          {trendingSearches.length > 0 ? (
            <FlatList
              data={trendingSearches}
              renderItem={renderTrendingItem}
              keyExtractor={(item, index) => `${item}-${index}`}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>No trending searches yet. Start searching to see trends!</Text>
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Filters</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Category</Text>
              <View style={styles.categoryGrid}>
                <TouchableOpacity
                  style={[styles.categoryItem, !selectedCategory && styles.categoryItemActive]}
                  onPress={() => setSelectedCategory('')}
                >
                  <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
                    All Categories
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryItem, selectedCategory === category && styles.categoryItemActive]}
                    onPress={() => setSelectedCategory(selectedCategory === category ? '' : category)}
                  >
                    <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* File Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>File Types</Text>
              <View style={styles.fileTypeGrid}>
                {availableFileTypes.map((fileType) => (
                  <TouchableOpacity
                    key={fileType}
                    style={[
                      styles.fileTypeItem,
                      selectedFileTypes.includes(fileType) && styles.fileTypeItemActive
                    ]}
                    onPress={() => {
                      if (selectedFileTypes.includes(fileType)) {
                        setSelectedFileTypes(selectedFileTypes.filter(t => t !== fileType));
                      } else {
                        setSelectedFileTypes([...selectedFileTypes, fileType]);
                      }
                    }}
                  >
                    <Text style={[
                      styles.fileTypeText,
                      selectedFileTypes.includes(fileType) && styles.fileTypeTextActive
                    ]}>
                      {fileType.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Clear Filters */}
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSelectedCategory('');
                setSelectedFileTypes([]);
              }}
            >
              <Text style={styles.clearFiltersText}>Clear All Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: UI_CONSTANTS.spacing.md,
    backgroundColor: THEME_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
  },
  searchInputContainer: {
    flex: 1,
    position: 'relative',
    marginRight: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
    borderRadius: 8,
    padding: 12,
    paddingRight: 40, // Make room for clear button
    backgroundColor: THEME_COLORS.background,
    color: THEME_COLORS.text,
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    top: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME_COLORS.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: THEME_COLORS.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchButton: {
    backgroundColor: THEME_COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: THEME_COLORS.background,
    fontWeight: 'bold',
    fontSize: 14,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.spacing.md,
    paddingVertical: UI_CONSTANTS.spacing.sm,
    backgroundColor: THEME_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
  },
  aiToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiToggleLabel: {
    color: THEME_COLORS.text,
    marginRight: 8,
    fontWeight: '500',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    position: 'relative',
  },
  filterButtonText: {
    color: THEME_COLORS.background,
    fontSize: 12,
    fontWeight: '600',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: THEME_COLORS.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: THEME_COLORS.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  expansionContainer: {
    backgroundColor: THEME_COLORS.surfaceVariant,
    paddingHorizontal: UI_CONSTANTS.spacing.md,
    paddingVertical: UI_CONSTANTS.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
  },
  expansionLabel: {
    color: THEME_COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  expansionText: {
    color: THEME_COLORS.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: UI_CONSTANTS.spacing.xl,
  },
  loadingText: {
    color: THEME_COLORS.textSecondary,
    marginTop: UI_CONSTANTS.spacing.sm,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  suggestionsContainer: {
    backgroundColor: THEME_COLORS.surface,
    borderRadius: 8,
    marginHorizontal: UI_CONSTANTS.spacing.md,
    marginTop: 5,
    elevation: 3,
    shadowColor: THEME_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
  },
  suggestionText: {
    fontSize: 16,
    color: THEME_COLORS.text,
  },
  section: {
    margin: UI_CONSTANTS.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
  },
  clearText: {
    color: THEME_COLORS.primary,
    fontSize: 14,
  },
  resultHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    color: THEME_COLORS.textSecondary,
    fontSize: 12,
    marginRight: 8,
  },
  sortButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 2,
    backgroundColor: THEME_COLORS.surfaceVariant,
  },
  sortButtonActive: {
    backgroundColor: THEME_COLORS.primary,
  },
  sortButtonText: {
    fontSize: 10,
    color: THEME_COLORS.textSecondary,
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: THEME_COLORS.background,
    fontWeight: '600',
  },
  resultItem: {
    padding: 16,
    backgroundColor: THEME_COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
    ...UI_CONSTANTS.elevation[1],
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  resultMeta: {
    alignItems: 'flex-end',
  },
  resultFileType: {
    fontSize: 10,
    color: THEME_COLORS.primary,
    fontWeight: '700',
    backgroundColor: THEME_COLORS.surfaceVariant,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  resultRating: {
    fontSize: 12,
    color: THEME_COLORS.secondary,
    fontWeight: '500',
  },
  resultDescription: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  resultCategory: {
    fontSize: 12,
    color: THEME_COLORS.primary,
    fontWeight: '500',
    backgroundColor: THEME_COLORS.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  resultDate: {
    fontSize: 11,
    color: THEME_COLORS.textSecondary,
  },
  resultDownloads: {
    fontSize: 11,
    color: THEME_COLORS.textSecondary,
    fontWeight: '500',
  },
  keywordContainer: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  keyword: {
    fontSize: 10,
    color: THEME_COLORS.secondary,
    backgroundColor: THEME_COLORS.surfaceVariant,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 2,
    fontWeight: '500',
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: UI_CONSTANTS.spacing.xl,
  },
  noResultsText: {
    fontSize: 16,
    color: THEME_COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  historyItem: {
    padding: 12,
    backgroundColor: THEME_COLORS.surface,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
  },
  historyText: {
    fontSize: 16,
    color: THEME_COLORS.text,
  },
  trendingItem: {
    padding: 12,
    backgroundColor: THEME_COLORS.surface,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
  },
  trendingText: {
    fontSize: 16,
    color: THEME_COLORS.text,
  },
  emptyText: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI_CONSTANTS.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
    backgroundColor: THEME_COLORS.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
  },
  modalCloseButton: {
    backgroundColor: THEME_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  modalCloseText: {
    color: THEME_COLORS.background,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: UI_CONSTANTS.spacing.md,
  },
  filterSection: {
    marginBottom: UI_CONSTANTS.spacing.lg,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.text,
    marginBottom: UI_CONSTANTS.spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    backgroundColor: THEME_COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
    marginBottom: 8,
  },
  categoryItemActive: {
    backgroundColor: THEME_COLORS.primary,
    borderColor: THEME_COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    color: THEME_COLORS.text,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: THEME_COLORS.background,
    fontWeight: '600',
  },
  fileTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fileTypeItem: {
    backgroundColor: THEME_COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
    marginBottom: 8,
  },
  fileTypeItemActive: {
    backgroundColor: THEME_COLORS.secondary,
    borderColor: THEME_COLORS.secondary,
  },
  fileTypeText: {
    fontSize: 12,
    color: THEME_COLORS.text,
    fontWeight: '600',
  },
  fileTypeTextActive: {
    color: THEME_COLORS.background,
  },
  clearFiltersButton: {
    backgroundColor: THEME_COLORS.error,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: UI_CONSTANTS.spacing.lg,
  },
  clearFiltersText: {
    color: THEME_COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SearchScreen;