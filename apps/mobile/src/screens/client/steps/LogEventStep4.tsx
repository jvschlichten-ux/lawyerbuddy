/**
 * LogEventStep4: GPS Location Capture
 *
 * Captures current GPS coordinates
 * Displays map preview with location
 * Stores latitude, longitude, accuracy, address
 *
 * WIRED IN: getCurrentLocation() calls expo-location for high-accuracy GPS
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { useTranslation } from '@lawyerbuddy/i18n';
import * as locationService from '../../../services/location';
import type { LocationData } from '../../../services/location';
import type { EventFormData } from '../LogEventScreen';

interface LogEventStep4Props {
  data: EventFormData;
  onUpdate: (updates: Partial<EventFormData>) => void;
  error?: string;
}

const LogEventStep4: React.FC<LogEventStep4Props> = ({ data, onUpdate, error }) => {
  const { t } = useTranslation('client');
  const { t: tCommon } = useTranslation('common');
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [useGPS, setUseGPS] = React.useState(!!data.location);

  /**
   * WIRED IN: Capture GPS coordinates
   * Calls locationService.getCurrentLocation()
   * Uses Location.Accuracy.High (~5-10 meters)
   * Includes reverse geocoding for address
   */
  const handleCaptureLocation = async () => {
    try {
      setIsCapturing(true);

      // Call location service - HIGH ACCURACY
      const location = await locationService.getCurrentLocation();

      if (location) {
        onUpdate({ location });
        setUseGPS(true);

        Alert.alert(
          tCommon('location_captured'),
          `${locationService.formatCoordinates(location.latitude, location.longitude)}\nAccuracy: ${Math.round(location.accuracy || 0)}m`
        );
      }
    } catch (error) {
      Alert.alert(
        tCommon('error'),
        error instanceof Error ? error.message : tCommon('location_capture_failed')
      );
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Remove captured location
   */
  const handleRemoveLocation = () => {
    onUpdate({ location: undefined });
    setUseGPS(false);
  };

  /**
   * Format for display
   */
  const formatCoordinates = (lat: number, lon: number): string => {
    return locationService.formatCoordinates(lat, lon);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Text style={styles.title}>{t('capture_location')}</Text>
      <Text style={styles.subtitle}>{t('gps_helps_establish_where_incident_occurred')}</Text>

      {/* Enable GPS Toggle */}
      <View style={styles.toggleContainer}>
        <View style={styles.toggleLeft}>
          <Text style={styles.toggleLabel}>{t('include_location_data')}</Text>
          <Text style={styles.toggleDescription}>{t('optional_field')}</Text>
        </View>
        <Switch
          value={useGPS}
          onValueChange={setUseGPS}
          trackColor={{ false: '#ddd', true: '#81C784' }}
          thumbColor={useGPS ? '#4CAF50' : '#f4f3f4'}
        />
      </View>

      {useGPS && (
        <>
          {/* Capture Button */}
          {!data.location ? (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCaptureLocation}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <>
                  <Text style={styles.gpsIcon}>📍</Text>
                  <Text style={styles.captureButtonText}>{t('capture_current_location')}</Text>
                  <Text style={styles.captureButtonSubtext}>
                    {t('uses_device_gps')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            /* Display Captured Location */
            <View style={styles.locationCard}>
              <View style={styles.locationCardHeader}>
                <Text style={styles.locationCardTitle}>{t('location_captured')} ✓</Text>
                <TouchableOpacity onPress={handleRemoveLocation}>
                  <Text style={styles.removeIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Map Preview (simplified - would use MapView in production) */}
              <View style={styles.mapPreview}>
                <Text style={styles.mapPlaceholder}>🗺️</Text>
                <Text style={styles.mapText}>
                  {formatCoordinates(data.location.latitude, data.location.longitude)}
                </Text>
              </View>

              {/* GPS Details */}
              <View style={styles.locationDetails}>
                <DetailRow
                  label={tCommon('latitude')}
                  value={data.location.latitude.toFixed(6)}
                />
                <DetailRow
                  label={tCommon('longitude')}
                  value={data.location.longitude.toFixed(6)}
                />

                {data.location.accuracy && (
                  <DetailRow
                    label={tCommon('accuracy')}
                    value={`±${Math.round(data.location.accuracy)} m`}
                  />
                )}

                {data.location.altitude && (
                  <DetailRow
                    label={tCommon('altitude')}
                    value={`${data.location.altitude.toFixed(1)} m`}
                  />
                )}

                {data.location.address && (
                  <DetailRow label={tCommon('address')} value={data.location.address} />
                )}

                <DetailRow
                  label={tCommon('timestamp')}
                  value={new Date(data.location.timestamp).toLocaleString()}
                />
              </View>

              {/* Recapture Button */}
              <TouchableOpacity
                style={[styles.captureButton, styles.recaptureButton]}
                onPress={handleCaptureLocation}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <ActivityIndicator color="#007AFF" />
                ) : (
                  <>
                    <Text style={styles.recaptureButttonText}>🔄 {t('capture_again')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Info Boxes */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>📱 {tCommon('gps_accuracy')}</Text>
            <Text style={styles.infoBoxText}>
              {tCommon('device_will_use_high_accuracy_gps')}
            </Text>
          </View>

          <View style={styles.privacyBox}>
            <Text style={styles.privacyBoxTitle}>🔒 {tCommon('privacy_note')}</Text>
            <Text style={styles.privacyBoxText}>
              {tCommon('location_data_sent_to_lawyer_only')}
            </Text>
          </View>
        </>
      )}

      {!useGPS && (
        <View style={styles.skippedBox}>
          <Text style={styles.skippedBoxTitle}>{tCommon('location_skipped')}</Text>
          <Text style={styles.skippedBoxText}>
            {tCommon('you_can_add_gps_data_in_next_event')}
          </Text>
        </View>
      )}

      {/* Why GPS Matters */}
      <View style={styles.whyBox}>
        <Text style={styles.whyBoxTitle}>📍 {t('why_location_matters')}</Text>
        <BulletPoint text={tCommon('gps_establishes_where_incident_occurred')} />
        <BulletPoint text={tCommon('helps_lawyer_understand_context')} />
        <BulletPoint text={tCommon('legally_significant_for_certain_cases')} />
        <BulletPoint text={tCommon('accurate_to_5_to_10_meters')} />
      </View>
    </ScrollView>
  );
};

interface DetailRowProps {
  label: string;
  value: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

interface BulletPointProps {
  text: string;
}

const BulletPoint: React.FC<BulletPointProps> = ({ text }) => (
  <View style={styles.bulletPoint}>
    <Text style={styles.bulletText}>• {text}</Text>
  </View>
);

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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 20,
  },
  toggleLeft: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  toggleDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  captureButton: {
    backgroundColor: '#34C759',
    paddingVertical: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  gpsIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  captureButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  locationCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  locationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  removeIcon: {
    fontSize: 20,
    color: '#FF3B30',
    fontWeight: '600',
  },
  mapPreview: {
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mapPlaceholder: {
    fontSize: 40,
    marginBottom: 8,
  },
  mapText: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '600',
  },
  locationDetails: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingVertical: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: '60%',
  },
  recaptureButton: {
    backgroundColor: '#E8F4FF',
    paddingVertical: 12,
  },
  recaptureButttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  infoBox: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
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
  privacyBox: {
    backgroundColor: '#F0FFF4',
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  privacyBoxTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: 4,
  },
  privacyBoxText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  skippedBox: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  skippedBoxTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 4,
  },
  skippedBoxText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  whyBox: {
    backgroundColor: '#F3E5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  whyBoxTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9C27B0',
    marginBottom: 8,
  },
  bulletPoint: {
    marginBottom: 6,
  },
  bulletText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default LogEventStep4;
