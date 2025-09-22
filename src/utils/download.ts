import { supabase } from '../services/supabase';
import RNFS from 'react-native-fs';
import { Platform, Share } from 'react-native';

/**
 * Result returned by downloadFile
 * success: whether download succeeded
 * localPath: absolute local filesystem path of saved file
 * fileName: the file name used locally
 * mimeType: detected MIME type
 * error: error message if failed
 * signedUrl: temporary signed URL used (for debugging / future revalidation)
 */
export interface DownloadResult {
  success: boolean;
  localPath?: string;
  fileName?: string;
  mimeType?: string;
  error?: string;
  signedUrl?: string;
}

/**
 * downloadFile
 * Downloads a file from Supabase Storage using a signed URL and saves locally.
 *
 * @param filePath Path inside the storage bucket (e.g. "abc/notes.pdf")
 * @param fileName Desired local filename (with extension)
 * @param bucket Storage bucket name (default: 'study-materials')
 * @param options Additional options { share?: boolean; view?: boolean }
 *
 * Example usage:
 *   await downloadFile(material.file_path, `${material.title}.pdf`)
 *
 * Example (Button usage):
 * <Button title="Download" onPress={async () => {
 *    const res = await downloadFile(material.file_path, `${material.title}.pdf`);
 *    if (res.success) {
 *       Alert.alert('Downloaded', `Saved to: ${res.localPath}`);
 *    } else {
 *       Alert.alert('Download failed', res.error || 'Unknown error');
 *    }
 * }} />
 */
export async function downloadFile(
  filePath: string,
  fileName: string,
  bucket: string = 'study-materials',
  options: { share?: boolean; view?: boolean; onProgress?: (progress: { bytesWritten: number; contentLength: number; percentage: number }) => void } = {}
): Promise<DownloadResult> {
  try {
    if (!filePath) throw new Error('Missing file path');

    const isFullUrl = /^https?:\/\//i.test(filePath);
    let signedUrl: string | undefined;

    // Only create signed URL if not already a full URL (assume storage path)
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
      signedUrl = filePath; // already a direct URL
    }

    // Determine directory (use DownloadDirectory if available on Android else Documents)
    const dir = Platform.OS === 'ios' ? RNFS.DocumentDirectoryPath : (RNFS.DownloadDirectoryPath || RNFS.DocumentDirectoryPath);
    const targetPath = `${dir}/${fileName}`.replace(/\\+/g, '/');

    // Start download using RNFS.downloadFile for streaming efficiency
    const download = RNFS.downloadFile({
      fromUrl: signedUrl,
      toFile: targetPath,
      discretionary: true,
      cacheable: false,
      progressDivider: 5,
      begin: (res) => {
        // Could log content length: res.contentLength
      },
      progress: (res) => {
        if (options.onProgress) {
          const percentage = res.contentLength > 0 ? (res.bytesWritten / res.contentLength) * 100 : 0;
          options.onProgress({ bytesWritten: res.bytesWritten, contentLength: res.contentLength, percentage });
        }
      }
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
          message: `Study material: ${fileName}`
        });
      } catch (shareErr) {
        console.warn('Share failed', shareErr);
      }
    }

    // View integration placeholder
    // if (options.view) { openDocumentViewer(targetPath); }

    return { success: true, localPath: targetPath, fileName, mimeType: undefined, signedUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown download error';
    console.error('[downloadFile] Error:', message);
    return { success: false, error: message };
  }
}

export default downloadFile;
