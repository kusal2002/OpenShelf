// src/screens/MaterialPreviewScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// runtime import so missing package doesn't break the bundle at build time
let WebView: any = null;
try {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  WebView = require('react-native-webview').WebView;
} catch (e) {
  WebView = null;
}

import { THEME_COLORS, UI_CONSTANTS, UIComponents, FileUtils } from '../utils';

// Keep props untyped to avoid strict param coupling in refactor
export default function MaterialPreviewScreen({ route, navigation }: any) {
  const material = useMemo(() => route?.params?.material || {}, [route?.params?.material]);
  const localPath = material.localPath || material.local_path || material.file_local_path;
  const remoteUrl = material.file_url || material.url || material.source;
  const fileName = material.file_name || material.title || `material-${material.id || Date.now()}`;

  const [loading, setLoading] = useState(true);

  const sourceUrl = localPath || remoteUrl || null;

  const isPdf = useMemo(() => {
    const ext = (material.file_type || FileUtils.getFileExtension(sourceUrl || '') || '').toLowerCase();
    if (ext === 'pdf') return true;
    return !!(sourceUrl && sourceUrl.toLowerCase().endsWith('.pdf'));
  }, [material, sourceUrl]);

  if (!sourceUrl) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No preview available for this material.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // For remote PDFs on Android, use Google Docs viewer to render in WebView.
  // For iOS, WebView can often load a remote pdf directly.
  const webViewSource = useMemo(() => {
    if (isPdf && remoteUrl && !localPath) {
      if (Platform.OS === 'android') {
        return { uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(remoteUrl)}` };
      }
      return { uri: remoteUrl };
    }

    // local file or non-pdf remote: try to load directly
    return { uri: sourceUrl };
  }, [isPdf, remoteUrl, localPath, sourceUrl]);

  const openExternal = async () => {
    try {
      const ok = await Linking.canOpenURL(sourceUrl);
      if (!ok) {
        Alert.alert('Unable to open', 'This file cannot be opened externally on your device.');
        return;
      }
      await Linking.openURL(sourceUrl);
    } catch (err) {
      Alert.alert('Open failed', 'Could not open the file externally.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Using navigator header (title: "Preview") to avoid duplicate back controls */}
      <View style={styles.body}>
        {WebView ? (
          <WebView
            originWhitelist={['*', 'https://*', 'http://*', 'file://*']}
            source={webViewSource}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              Alert.alert('Preview Error', 'Unable to load preview. You can download the file to view it.');
            }}
            startInLoadingState
          />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Preview component not available.</Text>
            <Text style={styles.emptyText}>Install react-native-webview and rebuild the app to enable in‑app previews.</Text>
          </View>
        )}

        {loading && WebView && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={THEME_COLORS.primary} />
            <Text style={styles.loadingText}>Preparing preview…</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME_COLORS.background },
  body: {
    flex: 1,
    backgroundColor: THEME_COLORS.surface,
  },
  loadingOverlay: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: THEME_COLORS.textSecondary,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: UI_CONSTANTS.spacing.lg,
  },
  emptyText: {
    ...UI_CONSTANTS.typography.body1,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
  },
});