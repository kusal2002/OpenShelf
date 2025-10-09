import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME_COLORS, UI_CONSTANTS, UIComponents, DateUtils, FileUtils, UIUtils, ErrorHandler, downloadFile } from '../utils';
import { supabaseService } from '../services/supabase';

// Add this interface for Review type
interface Review {
  id?: number;
  user_id: string;
  material_id: string;
  rating: number;
  comment: string | null;
  created_at?: string;
  user?: {
    full_name?: string;
    email?: string;
  };
}

// Keep props untyped to avoid strict param coupling in refactor
export default function MaterialDetailsScreen({ route, navigation }: any) {
  const material = useMemo(() => route?.params?.material || {}, [route?.params?.material]);

  const [isBookmarked, setIsBookmarked] = useState<boolean>(!!material.is_bookmarked);
  const [busy, setBusy] = useState<{ bookmark?: boolean; download?: boolean; review?: boolean }>({});
  
  // New state for review form
  const [userRating, setUserRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');

  // Add state for reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);

  useEffect(() => {
    setIsBookmarked(!!material.is_bookmarked);
  }, [material]);

  // Add useEffect to fetch reviews when screen loads
  useEffect(() => {
    fetchReviews();
  }, [material.id]);

  const fetchReviews = async () => {
    if (!material.id) return;
    
    try {
      setLoadingReviews(true);
      const { data, error } = await supabaseService.getReviewsForMaterial(material.id);
      
      if (error) throw error;
      
      if (data) {
        console.log('Fetched reviews count:', data.length);
        console.log('Reviews data:', JSON.stringify(data, null, 2));
        setReviews(data);
      }
    } catch (err) {
      ErrorHandler.handle(err, 'Error fetching reviews');
    } finally {
      setLoadingReviews(false);
    }
  };
  
  const onBookmark = async () => {
    try {
      setBusy(prev => ({ ...prev, bookmark: true }));
      const { session } = await supabaseService.getCurrentSession();
      if (!session) {
        Alert.alert('Sign In Required', 'Please sign in to bookmark materials.');
        return;
      }
      const userId = session.user.id;

      if (isBookmarked) {
        const res = await supabaseService.removeBookmark(userId, material.id);
        if (res && res.success !== false) {
          setIsBookmarked(false);
          UIUtils.showAlert('Bookmark Removed', `"${material.title}" has been removed from your bookmarks.`);
        } else {
          throw res?.error || new Error('Failed to remove bookmark');
        }
      } else {
        const res = await supabaseService.addBookmark(userId, material.id);
        if (res && res.success) {
          setIsBookmarked(true);
          Alert.alert(
            'Bookmark Added',
            `"${material.title}" has been added to your bookmarks.`,
            [
              { text: 'OK' },
              {
                text: 'View in Library',
                onPress: () => navigation.navigate('Library', { initialTab: 'bookmarks', refreshBookmarks: true, bookmarkedMaterialId: material.id } as any),
              },
            ]
          );
        } else {
          throw res?.error || new Error('Failed to add bookmark');
        }
      }
    } catch (err) {
      ErrorHandler.handle(err, 'Bookmark toggle error');
      UIUtils.showAlert('Error', 'Unable to update bookmark. Please try again.');
    } finally {
      setBusy(prev => ({ ...prev, bookmark: false }));
    }
  };

  const onDownload = async () => {
    try {
      if (!material) return;
      setBusy(prev => ({ ...prev, download: true }));

      Alert.alert(
        'Download Material',
        `Do you want to download "${material.title}" to your device for offline access?`,
        [
          { text: 'No', style: 'cancel', onPress: () => setBusy(prev => ({ ...prev, download: false })) },
          {
            text: 'Yes',
            onPress: async () => {
              try {
                // Confirm storing locally
                Alert.alert(
                  'Confirm Download',
                  'This file will be saved on your device storage. Continue?',
                  [
                    { text: 'Cancel', style: 'cancel', onPress: () => setBusy(prev => ({ ...prev, download: false })) },
                    {
                      text: 'Download',
                      onPress: async () => {
                        try {
                          // Build a sensible filename
                          const rawName = material.file_name || material.title || `material-${material.id}`;
                          const desiredName = rawName.includes('.') ? rawName : `${rawName}.${material.file_type || 'pdf'}`;

                          // Try to derive a path from material.file_url if available
                          let source = material.file_url || material.storage_path || '';

                          const res = await downloadFile(source, desiredName);

                          if (res && res.success) {
                            // update download count in backend
                            try {
                              await supabaseService.updateDownloadCount(material.id);
                            } catch (e) {
                              // non-fatal
                              console.warn('Failed to update download count', e);
                            }
                            UIUtils.showAlert('Download Complete', `Saved to: ${res.localPath}`);
                          } else {
                            UIUtils.showAlert('Download Failed', res?.error || 'Unknown error occurred while downloading.');
                          }
                        } catch (err) {
                          ErrorHandler.handle(err, 'Download error');
                          UIUtils.showAlert('Error', 'Failed to download material. Please try again.');
                        } finally {
                          setBusy(prev => ({ ...prev, download: false }));
                        }
                      },
                    },
                  ]
                );
              } catch (err) {
                setBusy(prev => ({ ...prev, download: false }));
                ErrorHandler.handle(err, 'Download confirmation error');
              }
            },
          },
        ]
      );
    } catch (err) {
      setBusy(prev => ({ ...prev, download: false }));
      ErrorHandler.handle(err, 'Download flow error');
    }
  };

  const onRead = () => {
    // If PDF (or supported previewable type) navigate to in-app preview
    const fileUrl = material.file_url || '';
    const ext = (material.file_type || FileUtils.getFileExtension(fileUrl) || '').toLowerCase();

    if (ext === 'pdf' || fileUrl.toLowerCase().endsWith('.pdf')) {
      navigation.navigate('MaterialPreview' as any, { material } as any);
      return;
    }

    // fallback: if it's a common document we can still attempt preview screen with URL
    if (fileUrl) {
      navigation.navigate('MaterialPreview' as any, { material } as any);
      return;
    }

    Alert.alert('Preview Unavailable', 'A preview is not available for this material.');
  };

  const onSubmitReview = async () => {
    if (userRating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting your review.');
      return;
    }
    
    try {
      setBusy(prev => ({ ...prev, review: true }));
      
      const { session } = await supabaseService.getCurrentSession();
      if (!session) {
        Alert.alert('Sign In Required', 'Please sign in to submit reviews.');
        return;
      }
      
      const userId = session.user.id;
      
      // Add review to database
      const res = await supabaseService.addReview({
        user_id: userId,
        material_id: material.id,
        rating: userRating,
        comment: reviewText.trim() || null
      });
      
      // Modify the success block to refresh reviews after submission
      if (res && res.success) {
        Alert.alert('Review Submitted', 'Thank you for your feedback!');
        // Reset form
        setUserRating(0);
        setReviewText('');
        
        // Refresh reviews
        fetchReviews();
      } else {
        throw res?.error || new Error('Failed to submit review');
      }
    } catch (err) {
      ErrorHandler.handle(err, 'Review submission error');
      UIUtils.showAlert('Error', 'Unable to submit your review. Please try again.');
    } finally {
      setBusy(prev => ({ ...prev, review: false }));
    }
  };

  // Add a helper function to render stars for a rating
  const renderRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={{ color: i <= rating ? THEME_COLORS.secondary : THEME_COLORS.textSecondary }}>
          {i <= rating ? '★' : '☆'}
        </Text>
      );
    }
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };
  
  // Add a helper function to render a review item
  const renderReviewItem = (review: Review, index: number) => {
    return (
      <View key={review.id || index} style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewAuthor}>
            {review.user?.full_name || 'Anonymous User'}
          </Text>
          <Text style={styles.reviewDate}>
            {review.created_at ? DateUtils.formatDate(review.created_at) : ''}
          </Text>
        </View>
        {renderRatingStars(review.rating)}
        {review.comment ? (
          <Text style={styles.reviewComment}>{review.comment}</Text>
        ) : null}
      </View>
    );
  };
  
  const renderStarRating = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity 
          key={i} 
          onPress={() => setUserRating(i)}
          style={styles.starButton}
        >
          <Text style={[styles.starIcon, i <= userRating ? styles.starSelected : null]}>
            {i <= userRating ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.coverContainer}>
          {material.cover_url ? (
            <Image source={{ uri: material.cover_url }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverPlaceholderText}>📘</Text>
            </View>
          )}
        </View>

        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>{material.title || 'Untitled'}</Text>
          {material.author && <Text style={styles.author}>by {material.author}</Text>}
        </View>

        <View style={styles.ratingCard}>
          <View style={styles.ratingLeft}>
            <Text style={styles.ratingNumber}>{(material.average_rating || 0).toFixed(1)}</Text>
            <Text style={styles.ratingStars}>⭐⭐⭐⭐⭐</Text>
            <Text style={styles.reviewsCount}>{material.reviews_count || 0} reviews</Text>
          </View>
          <View style={styles.ratingBars}>
            <Text style={styles.ratingBarText}>Ratings breakdown not available in this demo</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synopsis</Text>
          <Text style={styles.sectionBody}>
            {material.description || 'No description available.'}
          </Text>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.primaryButton, busy.download ? { opacity: 0.8 } : null]}
            onPress={onDownload}
            disabled={!!busy.download}
          >
            {busy.download ? (
              <ActivityIndicator color={THEME_COLORS.textInverse} />
            ) : (
              <Text style={styles.primaryButtonText}>Download</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostButton} onPress={onRead}>
            <Text style={styles.ghostButtonText}>Read</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.wishlistButton, { marginTop: UI_CONSTANTS.spacing.md }]}
          onPress={onBookmark}
          disabled={!!busy.bookmark}
        >
          {busy.bookmark ? (
            <ActivityIndicator color={THEME_COLORS.primary} />
          ) : (
            <Text style={styles.wishlistText}>{isBookmarked ? 'Bookmarked' : 'Add to Bookmark'}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Category</Text>
          <Text style={styles.metaValue}>{material.category || '—'}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Size</Text>
          <Text style={styles.metaValue}>{material.file_size ? `${(material.file_size / (1024*1024)).toFixed(2)} MB` : '—'}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Uploaded</Text>
          <Text style={styles.metaValue}>{material.created_at ? DateUtils.formatDate(material.created_at) : '—'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          
          <View style={styles.reviewFormContainer}>
            <Text style={styles.reviewFormTitle}>Write a Review</Text>
            
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>Your Rating:</Text>
              <View style={styles.starsContainer}>
                {renderStarRating()}
              </View>
            </View>
            
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your thoughts about this material (optional)"
              placeholderTextColor={THEME_COLORS.textSecondary}
              multiline={true}
              value={reviewText}
              onChangeText={setReviewText}
              maxLength={500}
            />
            
            <TouchableOpacity
              style={[styles.submitReviewButton, busy.review ? { opacity: 0.8 } : null]}
              onPress={onSubmitReview}
              disabled={busy.review || userRating === 0}
            >
              {busy.review ? (
                <ActivityIndicator color={THEME_COLORS.textInverse} />
              ) : (
                <Text style={styles.submitReviewText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.reviewsList}>
            <Text style={styles.reviewsListTitle}>
              {reviews.length > 0 ? `All Reviews (${reviews.length})` : 'No reviews yet. Be the first to review!'}
            </Text>
            
            {loadingReviews ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={THEME_COLORS.primary} />
                <Text style={styles.loadingText}>Loading reviews...</Text>
              </View>
            ) : reviews.length > 0 ? (
              <>
                {reviews.map((review, index) => renderReviewItem(review, index))}
              </>
            ) : (
              <View style={styles.emptyReviewsContainer}>
                <Text style={styles.emptyReviewsText}>
                  No reviews yet. Share your thoughts and be the first to review this material!
                </Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME_COLORS.background },
  container: {
    flexGrow: 1,
    padding: UI_CONSTANTS.spacing.lg,
    paddingBottom: 64,
  },
  coverContainer: {
    margin: UI_CONSTANTS.spacing.lg,
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.spacing.lg,
  },
  coverImage: {
    width: 160,
    height: 220,
    borderRadius: UI_CONSTANTS.borderRadius.md,
    resizeMode: 'cover',
    ...UI_CONSTANTS.elevation[2],
  },
  coverPlaceholder: {
    width: 160,
    height: 220,
    borderRadius: UI_CONSTANTS.borderRadius.md,
    backgroundColor: THEME_COLORS.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: { fontSize: 48 },
  header: {
    marginBottom: UI_CONSTANTS.spacing.md,
    alignItems: 'center',
  },
  title: {
    color: THEME_COLORS.text,
    ...UI_CONSTANTS.typography.h4,
    textAlign: 'center',
  },
  author: {
    color: THEME_COLORS.textSecondary,
    ...UI_CONSTANTS.typography.body2,
    marginTop: UI_CONSTANTS.spacing.xs,
  },
  ratingCard: {
    flexDirection: 'row',
    backgroundColor: THEME_COLORS.surface,
    borderRadius: UI_CONSTANTS.borderRadius.md,
    padding: UI_CONSTANTS.spacing.md,
    marginBottom: UI_CONSTANTS.spacing.md,
    ...UI_CONSTANTS.elevation[1],
  },
  ratingLeft: {
    width: 100,
    alignItems: 'center',
  },
  ratingNumber: {
    fontWeight: '700',
    fontSize: 28,
    color: THEME_COLORS.primary,
  },
  ratingStars: {
    marginTop: UI_CONSTANTS.spacing.xs,
    color: THEME_COLORS.secondary,
  },
  reviewsCount: {
    color: THEME_COLORS.textSecondary,
    ...UI_CONSTANTS.typography.caption,
    marginTop: UI_CONSTANTS.spacing.xs,
  },
  ratingBars: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: UI_CONSTANTS.spacing.md,
  },
  ratingBarText: {
    color: THEME_COLORS.textSecondary,
    ...UI_CONSTANTS.typography.body2,
  },
  section: {
    marginTop: UI_CONSTANTS.spacing.md,
  },
  sectionTitle: {
    color: THEME_COLORS.text,
    ...UI_CONSTANTS.typography.h6,
    marginBottom: UI_CONSTANTS.spacing.sm,
  },
  sectionBody: {
    color: THEME_COLORS.textSecondary,
    ...UI_CONSTANTS.typography.body2,
    lineHeight: 20,
  },
  buttonsRow: {
    marginTop: UI_CONSTANTS.spacing.lg,
    flexDirection: 'row',
    marginTop: UI_CONSTANTS.spacing.lg,
    gap: UI_CONSTANTS.spacing.md,
  },
  primaryButton: {
    flex: 1,
    ...UIComponents.getButtonStyle('primary'),
  },
  primaryButtonText: {
    color: THEME_COLORS.textInverse,
    fontWeight: '700',
  },
  ghostButton: {
    flex: 1,
    ...UIComponents.getButtonStyle('ghost'),
    borderColor: THEME_COLORS.outline,
  },
  ghostButtonText: {
    color: THEME_COLORS.primary,
    fontWeight: '700',
  },
  wishlistButton: {
    marginTop: UI_CONSTANTS.spacing.md,
    alignItems: 'center',
  },
  wishlistText: {
    color: THEME_COLORS.primary,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: UI_CONSTANTS.spacing.sm,
    borderBottomWidth: 1,
    paddingVertical: UI_CONSTANTS.spacing.xs,
    borderBottomColor: THEME_COLORS.surfaceVariant,
  },
  metaLabel: {
    color: THEME_COLORS.textSecondary,
    ...UI_CONSTANTS.typography.caption,
  },
  metaValue: {
    color: THEME_COLORS.text,
    ...UI_CONSTANTS.typography.body2,
    fontWeight: '600',
  },
  reviewFormContainer: {
    backgroundColor: THEME_COLORS.surface,
    borderRadius: UI_CONSTANTS.borderRadius.md,
    padding: UI_CONSTANTS.spacing.md,
    marginTop: UI_CONSTANTS.spacing.sm,
    ...UI_CONSTANTS.elevation[1],
  },
  reviewFormTitle: {
    color: THEME_COLORS.text,
    ...UI_CONSTANTS.typography.subtitle1,
    marginBottom: UI_CONSTANTS.spacing.sm,
  },
  ratingContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: UI_CONSTANTS.spacing.md,
  },
  ratingLabel: {
    color: THEME_COLORS.text,
    ...UI_CONSTANTS.typography.body2,
    marginRight: UI_CONSTANTS.spacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starButton: {
    padding: UI_CONSTANTS.spacing.xs,
  },
  starIcon: {
    fontSize: 24,
    color: THEME_COLORS.textSecondary,
  },
  starSelected: {
    color: THEME_COLORS.secondary,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: THEME_COLORS.outline,
    borderRadius: UI_CONSTANTS.borderRadius.sm,
    padding: UI_CONSTANTS.spacing.md,
    minHeight: 100,
    ...UI_CONSTANTS.typography.body2,
    textAlignVertical: 'top',
  },
  submitReviewButton: {
    ...UIComponents.getButtonStyle('primary'),
    marginTop: UI_CONSTANTS.spacing.md,
  },
  submitReviewText: {
    color: THEME_COLORS.textInverse,
    fontWeight: '700',
  },
  reviewsList: {
    marginTop: UI_CONSTANTS.spacing.lg,
  },
  reviewsListTitle: {
    color: THEME_COLORS.text,
    ...UI_CONSTANTS.typography.subtitle1,
    marginBottom: UI_CONSTANTS.spacing.sm,
    fontWeight: '600',
  },
  reviewItem: {
    backgroundColor: THEME_COLORS.surface,
    borderRadius: UI_CONSTANTS.borderRadius.md,
    padding: UI_CONSTANTS.spacing.md,
    marginBottom: UI_CONSTANTS.spacing.md,
    ...UI_CONSTANTS.elevation[1],
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: UI_CONSTANTS.spacing.xs,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAuthor: {
    color: THEME_COLORS.text,
    ...UI_CONSTANTS.typography.subtitle2,
    fontWeight: '600',
  },
  reviewDate: {
    color: THEME_COLORS.textSecondary,
    ...UI_CONSTANTS.typography.caption,
  },
  reviewComment: {
    color: THEME_COLORS.text,
    ...UI_CONSTANTS.typography.body2,
    marginTop: UI_CONSTANTS.spacing.sm,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONSTANTS.spacing.lg,
  },
  loadingText: {
    color: THEME_COLORS.textSecondary,
    ...UI_CONSTANTS.typography.body2,
    marginLeft: UI_CONSTANTS.spacing.sm,
  },
  emptyReviewsContainer: {
    padding: UI_CONSTANTS.spacing.lg,
    alignItems: 'center',
  },
  emptyReviewsText: {
    color: THEME_COLORS.textSecondary,
    ...UI_CONSTANTS.typography.body2,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});