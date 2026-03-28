/**
 * LogEventStep3: Media Capture
 *
 * Handles: Camera capture (DIRECT camera, NOT photo library)
 * - Opens camera directly via ImagePicker.launchCameraAsync()
 * - Captures photo/video with SHA-256 hash generation
 * - Displays preview and file info
 *
 * CRITICAL: Uses launchCameraAsync (camera only), not launchImageLibraryAsync
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from '@lawyerbuddy/i18n';
import * as mediaService from '../../../services/media';
import type { CapturedMedia, ExifData } from '../../../services/media';
import type { EventFormData } from '../LogEventScreen';

interface LogEventStep3Props {
  data: EventFormData;
  onUpdate: (updates: Partial<EventFormData>) => void;
  error?: string;
}

const LogEventStep3: React.FC<LogEventStep3Props> = ({ data, onUpdate, error }) => {
  const { t } = useTranslation('client');
  const { t: tCommon } = useTranslation('common');
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [previewMedia, setPreviewMedia] = React.useState<CapturedMedia | null>(null);

  /**
   * CRITICAL: Open camera directly
   * Uses launchCameraAsync which opens CAMERA only, not photo library
   */
  const handleCapturePhoto = async () => {
    try {
      setIsCapturing(true);

      // Open CAMERA directly (not photo library)
      // ImagePicker.launchCameraAsync = CAMERA ONLY
      // ImagePicker.launchImageLibraryAsync = PHOTO LIBRARY (NOT USED HERE)
      const capturedMedia = await mediaService.captureFromCamera('photo');

      if (capturedMedia) {
        // Preview before adding
        setPreviewMedia(capturedMedia);
      }
    } catch (error) {
      Alert.alert(
        tCommon('error'),
        error instanceof Error ? error.message : tCommon('camera_failed')
      );
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * CRITICAL: Open camera for video
   * Uses launchCameraAsync which opens CAMERA only
   */
  const handleCaptureVideo = async () => {
    try {
      setIsCapturing(true);

      // Open CAMERA directly (not photo library)
      // Using 'video' mode
      const capturedMedia = await mediaService.captureFromCamera('video');

      if (capturedMedia) {
        setPreviewMedia(capturedMedia);
      }
    } catch (error) {
      Alert.alert(
        tCommon('error'),
        error instanceof Error ? error.message : tCommon('camera_failed')
      );
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Confirm and add media to form
   * Sets SHA-256 hash in form data
   */
  const handleConfirmMedia = () => {
    if (previewMedia) {
      onUpdate({
        attachments: [...(data.attachments || []), previewMedia],
      });
      setPreviewMedia(null);
    }
  };

  /**
   * Cancel preview without adding
   */
  const handleCancelMedia = () => {
    setPreviewMedia(null);
  };

  /**
   * Remove media from list
   */
  const handleRemoveMedia = (index: number) => {
    onUpdate({
      attachments: data.attachments.filter((_, i) => i !== index),
    });
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // If previewing media
  if (previewMedia) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('review_media')}</Text>

        {/* Preview */}
        {previewMedia.type === 'photo' && (
          <Image
            source={{ uri: previewMedia.uri }}
            style={styles.preview}
            resizeMode="cover"
          />
        )}

        {previewMedia.type === 'video' && (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoIcon}>🎥</Text>
            <Text style={styles.videoText}>{t('video_captured')}</Text>
          </View>
        )}

        {/* File Info */}
        <View style={styles.fileInfo}>
          <View style={styles.fileInfoRow}>
            <Text style={styles.fileInfoLabel}>{tCommon('file_type')}:</Text>
            <Text style={styles.fileInfoValue}>{previewMedia.type.toUpperCase()}</Text>
          </View>
          <View style={styles.fileInfoRow}>
            <Text style={styles.fileInfoLabel}>{tCommon('file_size')}:</Text>
            <Text style={styles.fileInfoValue}>
              {formatFileSize(previewMedia.fileSize)}
            </Text>
          </View>
          <View style={styles.fileInfoRow}>
            <Text style={styles.fileInfoLabel}>MIME:</Text>
            <Text style={styles.fileInfoValue}>{previewMedia.mimeType}</Text>
          </View>

          {/* SHA-256 Hash */}
          <View style={styles.hashContainer}>
            <Text style={styles.hashLabel}>SHA-256 Hash:</Text>
            <Text style={styles.hashValue} selectable>
              {previewMedia.sha256Hash}
            </Text>
            <Text style={styles.hashInfo}>
              {tCommon('hash_for_integrity_verification')}
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.button, styles.buttonCancel]}
            onPress={handleCancelMedia}
          >
            <Text style={styles.buttonTextCancel}>{tCommon('cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonConfirm]}
            onPress={handleConfirmMedia}
          >
            <Text style={styles.buttonTextConfirm}>{tCommon('use_this_photo')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main view
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Text style={styles.title}>{t('add_photos_or_videos')}</Text>
      <Text style={styles.subtitle}>{t('media_helps_lawyer_understand_situation')}</Text>

      {/* Capture Buttons - CAMERA ONLY */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.captureButton, styles.photoButton]}
          onPress={handleCapturePhoto}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.cameraIcon}>📷</Text>
              <Text style={styles.captureButtonText}>{t('take_photo')}</Text>
              <Text style={styles.captureButtonSubtext}>{t('camera_only')}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, styles.videoButton]}
          onPress={handleCaptureVideo}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.cameraIcon}>🎥</Text>
              <Text style={styles.captureButtonText}>{t('record_video')}</Text>
              <Text style={styles.captureButtonSubtext}>{t('camera_only')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Info: Camera Direct */}
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>📱 {tCommon('direct_camera_access')}</Text>
        <Text style={styles.infoBoxText}>
          {tCommon('camera_opens_directly_not_photo_library')}
        </Text>
      </View>

      {/* Attached Media List */}
      {data.attachments.length > 0 && (
        <View style={styles.attachmentsContainer}>
          <Text style={styles.attachmentsTitle}>
            {t('attached_media')} ({data.attachments.length})
          </Text>

          {data.attachments.map((media, index) => (
            <View key={index} style={styles.attachmentItem}>
              <View style={styles.attachmentItemLeft}>
                <Text style={styles.attachmentIcon}>
                  {media.type === 'photo' ? '🖼️' : '🎬'}
                </Text>
                <View style={styles.attachmentItemInfo}>
                  <Text style={styles.attachmentItemName}>{media.fileName}</Text>
                  <Text style={styles.attachmentItemSize}>
                    {formatFileSize(media.fileSize)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.attachmentItemRemove}
                onPress={() => handleRemoveMedia(index)}
              >
                <Text style={styles.removeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* SHA-256 Info */}
      <View style={styles.hashInfoBox}>
        <Text style={styles.hashInfoTitle}>🔐 {tCommon('integrity_protection')}</Text>
        <Text style={styles.hashInfoText}>
          {tCommon('every_photo_video_has_sha256_hash_for_verification')}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFE8E6',
    borderRadius: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  captureButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButton: {
    backgroundColor: '#007AFF',
  },
  videoButton: {
    backgroundColor: '#FF3B30',
  },
  cameraIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  captureButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  captureButtonSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  infoBoxTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  attachmentsContainer: {
    marginBottom: 20,
  },
  attachmentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  attachmentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attachmentIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  attachmentItemInfo: {
    flex: 1,
  },
  attachmentItemName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
  },
  attachmentItemSize: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  attachmentItemRemove: {
    paddingLeft: 12,
  },
  removeIcon: {
    fontSize: 18,
    color: '#FF3B30',
    fontWeight: '600',
  },
  hashInfoBox: {
    backgroundColor: '#F0FFF4',
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  hashInfoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: 4,
  },
  hashInfoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  // Preview styles
  preview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginVertical: 16,
  },
  videoPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  videoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  videoText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  fileInfo: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  fileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  fileInfoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  fileInfoValue: {
    fontSize: 13,
    color: '#000',
    fontWeight: '600',
  },
  hashContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  hashLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  hashValue: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Menlo',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  hashInfo: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonCancel: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  buttonConfirm: {
    backgroundColor: '#34C759',
  },
  buttonTextCancel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  buttonTextConfirm: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default LogEventStep3;
