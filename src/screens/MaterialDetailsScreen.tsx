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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME_COLORS, UI_CONSTANTS, UIComponents, DateUtils, FileUtils, UIUtils, ErrorHandler, downloadFile } from '../utils';
import { supabaseService } from '../services/supabase';

// Keep props untyped to avoid strict param coupling in refactor
export default function MaterialDetailsScreen({ route, navigation }: any) {
  const material = useMemo(() => route?.params?.material || {}, [route?.params?.material]);

  const [isBookmarked, setIsBookmarked] = useState<boolean>(!!material.is_bookmarked);
  const [busy, setBusy] = useState<{ bookmark?: boolean; download?: boolean }>({});

  useEffect(() => {
    setIsBookmarked(!!material.is_bookmarked);
  }, [material]);

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
          <Text style={styles.sectionBody}>Reviews list not implemented in this demo.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME_COLORS.background },
  container: {
    padding: UI_CONSTANTS.spacing.lg,
    paddingBottom: 64,
  },
  coverContainer: {
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
    ...UI_CONSTANTS.typography.h4,
    color: THEME_COLORS.text,
    textAlign: 'center',
  },
  author: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
    marginTop: UI_CONSTANTS.spacing.xs,
  },
  ratingCard: {
    flexDirection: 'row',
    backgroundColor: THEME_COLORS.surface,
    padding: UI_CONSTANTS.spacing.md,
    borderRadius: UI_CONSTANTS.borderRadius.md,
    marginBottom: UI_CONSTANTS.spacing.md,
    ...UI_CONSTANTS.elevation[1],
  },
  ratingLeft: {
    width: 100,
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME_COLORS.primary,
  },
  ratingStars: {
    color: THEME_COLORS.secondary,
    marginTop: UI_CONSTANTS.spacing.xs,
  },
  reviewsCount: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textSecondary,
    marginTop: UI_CONSTANTS.spacing.xs,
  },
  ratingBars: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: UI_CONSTANTS.spacing.md,
  },
  ratingBarText: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
  },
  section: {
    marginTop: UI_CONSTANTS.spacing.md,
  },
  sectionTitle: {
    ...UI_CONSTANTS.typography.h6,
    color: THEME_COLORS.text,
    marginBottom: UI_CONSTANTS.spacing.sm,
  },
  sectionBody: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
    lineHeight: 20,
  },
  buttonsRow: {
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
    borderWidth: 1,
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
    paddingVertical: UI_CONSTANTS.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.surfaceVariant,
  },
  metaLabel: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textSecondary,
  },
  metaValue: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.text,
    fontWeight: '600',
  },
});