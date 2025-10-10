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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseService } from '../services/supabase';
import { MainTabParamList, Material } from '../types';
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
  }, [searchQuery]);

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

  const saveSearchHistory = async (query: string) => {
    try {
      const updatedHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
      setSearchHistory(updatedHistory);
      await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

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

  const updateSearchSuggestions = (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
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
  };

  const performSemanticSearch = async (query: string, saveToHistory: boolean = false) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
  // Use AI-powered semantic search (falls back to basic search if HF key missing)
  const response = await supabaseService.semanticSearchMaterials(query, { limit: 50 });
      
      if (response.success && response.data) {
        setSearchResults(response.data);
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
      <Text style={styles.resultTitle}>{item.title}</Text>
      <Text style={styles.resultDescription}>{item.description}</Text>
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
            placeholder="Search for study materials..."
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
              }}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

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
        {searchResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
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
  },
  searchButtonText: {
    color: THEME_COLORS.background,
    fontWeight: 'bold',
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
  resultItem: {
    padding: 15,
    backgroundColor: THEME_COLORS.surface,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
  },
  resultDescription: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginTop: 5,
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
});

export default SearchScreen;