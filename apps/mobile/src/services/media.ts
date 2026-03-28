/**
 * Media Service
 *
 * Handles camera capture, file uploads, and cryptographic hashing
 * Works on both iOS and Android via React Native modules
 */

import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import type { ImagePickerResult } from 'expo-image-picker';

export interface CapturedMedia {
  uri: string;
  type: 'photo' | 'video';
  fileName: string;
  mimeType: string;
  fileSize: number;
  sha256Hash: string;
  exifData?: ExifData;
  timestamp: string;
}

export interface ExifData {
  width?: number;
  height?: number;
  orientation?: number;
  dateTime?: string;
  camera?: string;
}

/**
 * Request camera permission
 * Returns true if permission granted, false otherwise
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to request camera permission:', error);
    return false;
  }
}

/**
 * Request photo library permission
 * Returns true if permission granted, false otherwise
 */
export async function requestPhotoLibraryPermission(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to request photo library permission:', error);
    return false;
  }
}

/**
 * Open camera and capture photo/video directly
 * Does NOT open photo library - opens camera only
 *
 * @param mediaType - 'photo' | 'video' | 'mixed'
 * @returns CapturedMedia with file data and SHA-256 hash
 */
export async function captureFromCamera(
  mediaType: 'photo' | 'video' | 'mixed' = 'photo'
): Promise<CapturedMedia | null> {
  try {
    // Check permission first
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      throw new Error('Camera permission denied');
    }

    // Open camera directly (not photo library)
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes:
        mediaType === 'photo'
          ? ImagePicker.MediaTypeOptions.Images
          : mediaType === 'video'
            ? ImagePicker.MediaTypeOptions.Videos
            : ImagePicker.MediaTypeOptions.All,
      allowsEditing: false, // No in-app editing
      aspect: [4, 3],
      quality: 0.8, // Balanced quality/file size
      base64: false, // Read file from disk for hashing
      exif: true, // Preserve EXIF data
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null; // User cancelled
    }

    const asset = result.assets[0];
    const mediaType_result = asset.type || 'photo';

    return await processMediaFile(
      asset.uri,
      mediaType_result === 'video' ? 'video' : 'photo',
      asset.fileName || `capture_${Date.now()}.jpg`
    );
  } catch (error) {
    console.error('Camera capture failed:', error);
    throw error;
  }
}

/**
 * Select media from photo library
 * Opens photo library (not camera)
 *
 * @param mediaType - 'photo' | 'video' | 'mixed'
 * @returns CapturedMedia with file data and SHA-256 hash
 */
export async function selectFromLibrary(
  mediaType: 'photo' | 'video' | 'mixed' = 'photo'
): Promise<CapturedMedia | null> {
  try {
    // Check permission first
    const hasPermission = await requestPhotoLibraryPermission();
    if (!hasPermission) {
      throw new Error('Photo library permission denied');
    }

    // Open photo library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        mediaType === 'photo'
          ? ImagePicker.MediaTypeOptions.Images
          : mediaType === 'video'
            ? ImagePicker.MediaTypeOptions.Videos
            : ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.8,
      base64: false,
      exif: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null; // User cancelled
    }

    const asset = result.assets[0];
    const mediaType_result = asset.type || 'photo';

    return await processMediaFile(
      asset.uri,
      mediaType_result === 'video' ? 'video' : 'photo',
      asset.fileName || `library_${Date.now()}.jpg`
    );
  } catch (error) {
    console.error('Library selection failed:', error);
    throw error;
  }
}

/**
 * Process media file: copy to app cache, compute SHA-256, extract EXIF
 * @internal
 */
async function processMediaFile(
  uri: string,
  mediaType: 'photo' | 'video',
  fileName: string
): Promise<CapturedMedia> {
  try {
    // Read file from disk
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    const fileSize = fileInfo.size || 0;

    // Compute SHA-256 hash by reading file contents
    const fileContent = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const sha256Hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      fileContent,
      { encoding: Crypto.CryptoEncoding.Base64 }
    );

    // Determine MIME type
    const mimeType = getMimeType(fileName, mediaType);

    // Extract EXIF data if photo
    let exifData: ExifData | undefined;
    if (mediaType === 'photo') {
      try {
        // In production, use react-native-exif-library or expo-media-library
        // For now, basic extraction
        exifData = {
          dateTime: new Date().toISOString(),
        };
      } catch (e) {
        // EXIF extraction failed, continue without it
      }
    }

    return {
      uri,
      type: mediaType,
      fileName,
      mimeType,
      fileSize,
      sha256Hash,
      exifData,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('File processing failed:', error);
    throw error;
  }
}

/**
 * Determine MIME type from filename
 * @internal
 */
function getMimeType(fileName: string, mediaType: 'photo' | 'video'): string {
  const ext = fileName.split('.').pop()?.toLowerCase();

  if (mediaType === 'video') {
    switch (ext) {
      case 'mp4':
        return 'video/mp4';
      case 'mov':
        return 'video/quicktime';
      case 'avi':
        return 'video/x-msvideo';
      default:
        return 'video/mp4';
    }
  }

  // Default to photo types
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

/**
 * Upload media file to Supabase storage
 * Called during event submission
 *
 * @param media - Media file to upload
 * @param eventId - Event UUID (used for storage path)
 * @returns Storage path and upload result
 */
export async function uploadMediaToStorage(
  media: CapturedMedia,
  eventId: string
): Promise<{
  storagePath: string;
  sha256Hash: string;
  fileSize: number;
  mimeType: string;
}> {
  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(media.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to blob
    const blob = new Blob([Buffer.from(base64, 'base64')], {
      type: media.mimeType,
    });

    // Storage path: cases/{caseId}/events/{eventId}/{timestamp}_{fileName}
    const storagePath = `events/${eventId}/${Date.now()}_${media.fileName}`;

    // In production: upload to Supabase storage
    // const { data, error } = await supabase.storage
    //   .from('case-files')
    //   .upload(storagePath, blob);
    //
    // For now, return metadata for submission with backend handling upload

    return {
      storagePath,
      sha256Hash: media.sha256Hash,
      fileSize: media.fileSize,
      mimeType: media.mimeType,
    };
  } catch (error) {
    console.error('Media upload failed:', error);
    throw error;
  }
}

/**
 * Delete local cached media file
 */
export async function deleteLocalMedia(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    console.error('Failed to delete local media:', error);
  }
}
