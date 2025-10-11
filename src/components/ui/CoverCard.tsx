/**
 * CoverCard Component
 * Beautiful material cover card with image, bookmark badge, and interactive states
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Pressable,
  Animated,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Material } from '../../types';

interface CoverCardProps {
  material: Material;
  onPress: () => void;
  onBookmarkPress: () => void;
  width?: number;
}

export const CoverCard: React.FC<CoverCardProps> = ({
  material,
  onPress,
  onBookmarkPress,
  width = 160,
}) => {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getFileIcon = (fileType: string) => {
    const icons: Record<string, string> = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      ppt: '📊',
      pptx: '📊',
      xls: '📈',
      xlsx: '📈',
      txt: '📃',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️',
      mp4: '🎥',
      mp3: '🎵',
      zip: '🗜️',
    };
    return icons[fileType.toLowerCase()] || '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('⭐');
      } else if (i === fullStars && hasHalfStar) {
        stars.push('⭐');
      } else {
        stars.push('☆');
      }
    }
    return stars.join('');
  };

  return (
    <Animated.View style={[
      styles.container,
      { width, transform: [{ scale: scaleAnim }] }
    ]}>
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            shadowColor: theme.shadow,
          }
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible={true}
        accessibilityLabel={`${material.title} by ${material.uploader_name || 'Unknown'}`}
        accessibilityRole="button"
      >
        {/* Cover/Icon area */}
        <View style={[styles.coverContainer, { backgroundColor: theme.surfaceVariant }]}>
          {material.cover_url ? (
            <Image 
              source={{ uri: material.cover_url }} 
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.iconContainer}>
              <Text style={styles.fileIcon}>
                {getFileIcon(material.file_type)}
              </Text>
            </View>
          )}
          
          {/* Bookmark button in top-right */}
          <TouchableOpacity
            style={[
              styles.bookmarkButtonTopRight,
              {
                backgroundColor: material.is_bookmarked 
                  ? theme.primary 
                  : theme.surface + 'DD'
              }
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onBookmarkPress();
            }}
            accessible={true}
            accessibilityLabel={material.is_bookmarked ? 'Remove bookmark' : 'Add bookmark'}
            accessibilityRole="button"
          >
            <Text style={styles.bookmarkIconTopRight}>
              {material.is_bookmarked ? '🔖' : '📑'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text 
            style={[styles.title, { color: theme.text }]}
            numberOfLines={2}
          >
            {material.title}
          </Text>
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Text style={styles.stars}>
              {renderStars(material.average_rating || 0)}
            </Text>
            <Text style={[styles.ratingText, { color: theme.textTertiary }]}>
              {material.average_rating ? material.average_rating.toFixed(1) : '0.0'}
            </Text>
          </View>
          
          {/* Author */}
          <Text style={[styles.uploader, { color: theme.textSecondary }]}>
            by {material.uploader_name || 'Unknown'}
          </Text>
          
          {/* Category */}
          <View style={styles.meta}>
            <Text style={[styles.category, { color: theme.primary }]}>
              {material.category}
            </Text>
            <Text style={[styles.size, { color: theme.textTertiary }]}>
              {formatFileSize(material.file_size)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
  },
  card: {
    borderRadius: 16,
    // enforce fixed size so all cards align uniformly
    height: 260,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  coverContainer: {
    height: 140,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIcon: {
    fontSize: 36,
  },
  bookmarkButtonTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  bookmarkIconTopRight: {
    fontSize: 18,
  },
  content: {
    padding: 12,
    // keep content area fixed so cards are equal height
    minHeight: 116,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stars: {
    fontSize: 10,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
  },
  uploader: {
    fontSize: 11,
    fontWeight: '400',
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  category: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  size: {
    fontSize: 10,
    fontWeight: '400',
  },
});