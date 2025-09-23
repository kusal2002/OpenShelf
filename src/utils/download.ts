import { supabase } from '../services/supabase';
import RNFS from 'react-native-fs';
import { Platform, Share, PermissionsAndroid } from 'react-native';

export interface DownloadResult {
  success: boolean;
  localPath?: string;
  fileName?: string;
  mimeType?: string;
  error?: string;
  signedUrl?: string;
  savedInPublicDir?: boolean; // indicates if file placed in public Downloads folder (Android)
}

/**
 * Ask for storage permission on Android (needed for Download folder)
 */
async function requestStoragePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'We need access to your storage to save study materials',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Permission error', err);
    return false;
  }
}

export async function downloadFile(
  filePath: string,
  fileName: string,
  bucket: string = 'study-materials',
  options: {
    share?: boolean;
    view?: boolean;
    onProgress?: (progress: { bytesWritten: number; contentLength: number; percentage: number }) => void;
  } = {}
): Promise<DownloadResult> {
  try {
    if (!filePath) throw new Error('Missing file path');

    const isFullUrl = /^https?:\/\//i.test(filePath);
    let signedUrl: string | undefined;

    // Only create signed URL if not already a full URL
    if (!isFullUrl) {
      const { data: signedData, error: signedError } = await supabase
        .storage
        .from(bucket)
        .createSignedUrl(filePath, 60 * 60);
      if (signedError || !signedData?.signedUrl) {
        throw new Error(signedError?.message || 'Failed to create signed URL');
      }
      signedUrl = signedData.signedUrl;
    } else {
      signedUrl = filePath;
    }

    // ✅ Handle Android storage permissions (fallback silently to app directory if denied)
    let permissionGranted = true;
    if (Platform.OS === 'android') {
      permissionGranted = await requestStoragePermission();
    }

// Choose directory
let dir: string;

let savedInPublicDir = false;
if (Platform.OS === 'ios') {
  dir = RNFS.DocumentDirectoryPath; // iOS sandbox docs
} else {
  if (Platform.OS === 'android' && RNFS.DownloadDirectoryPath) {
  // Force use of system Downloads folder
  dir = RNFS.DownloadDirectoryPath;
  try { await RNFS.mkdir(dir); } catch {}
  savedInPublicDir = true;
} else {
  dir = RNFS.DocumentDirectoryPath;
}
}

// Final path
const targetPath = `${dir}/${fileName}`.replace(/\\+/g, '/');

    // Download
    const download = RNFS.downloadFile({
      fromUrl: signedUrl,
      toFile: targetPath,
      discretionary: true,
      cacheable: false,
      progressDivider: 5,
      begin: (res) => {
        console.log('Download started. Content length:', res.contentLength);
      },
      progress: (res) => {
        if (options.onProgress) {
          const percentage =
            res.contentLength > 0 ? (res.bytesWritten / res.contentLength) * 100 : 0;
          options.onProgress({
            bytesWritten: res.bytesWritten,
            contentLength: res.contentLength,
            percentage,
          });
        }
      },
    });

    const { statusCode, bytesWritten } = await download.promise;
    if (statusCode && statusCode >= 400) {
      throw new Error(`Download failed with status ${statusCode}`);
    }
    if (!bytesWritten || bytesWritten === 0) {
      throw new Error('Downloaded file is empty');
    }

    // Optionally share file
    if (options.share) {
      try {
        await Share.share({
          url: Platform.OS === 'ios' ? targetPath : 'file://' + targetPath,
          message: `Study material: ${fileName}`,
        });
      } catch (shareErr) {
        console.warn('Share failed', shareErr);
      }
    }

    return {
      success: true,
      localPath: targetPath,
      fileName,
      mimeType: undefined,
      signedUrl,
      savedInPublicDir,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown download error';
    console.error('[downloadFile] Error:', message);
    return { success: false, error: message };
  }
}

export default downloadFile;