/**
 * LogEventStep5: Review & Submit
 *
 * Shows comprehensive review of all event data
 * Handles final submission to backend
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from '@lawyerbuddy/i18n';
import type { EventFormData } from '../LogEventScreen';

interface LogEventStep5Props {
  data: EventFormData;
  caseId: string;
  onSubmit: () => Promise<void>;
  error?: string;
}

const LogEventStep5: React.FC<LogEventStep5Props> = ({
  data,
  caseId,
  onSubmit,
  error,
}) => {
  const { t } = useTranslation('client');
  const { t: tCommon } = useTranslation('common');
  const { t: tLegal } = useTranslation('legal');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit();
    } catch (err) {
      Alert.alert(tCommon('error'), tCommon('submission_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t('review_event')}</Text>
      <Text style={styles.subtitle}>{t('check_all_details_before_submitting')}</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Event Basics */}
      <Section title={tCommon('event_basics')}>
        <ReviewRow label={tCommon('title')} value={data.title} />
        <ReviewRow label={tCommon('type')} value={tLegal(`event_type_${data.eventType}`)} />
        <ReviewRow label={tCommon('date_time')} value={formatDate(data.occurredAt)} />
        {data.locationDescription && (
          <ReviewRow label={tCommon('location')} value={data.locationDescription} />
        )}
      </Section>

      {/* Event Details */}
      <Section title={tCommon('event_details')}>
        <ReviewRow label={tCommon('narrative')} value={data.narrative} long />
        <ReviewRow
          label={tCommon('severity')}
          value={tLegal(`severity_${data.severity}`)}
          badge={getSeverityColor(data.severity)}
        />
        {data.involvedParties.length > 0 && (
          <ReviewRow
            label={tCommon('involved_parties')}
            value={data.involvedParties.join(', ')}
          />
        )}
        {data.courtOrderReference && (
          <ReviewRow
            label={tCommon('court_order_reference')}
            value={data.courtOrderReference}
          />
        )}
        {data.actionsTaken && (
          <ReviewRow label={tCommon('actions_taken')} value={data.actionsTaken} long />
        )}
      </Section>

      {/* Media */}
      {data.attachments.length > 0 && (
        <Section title={`${t('media')} (${data.attachments.length})`}>
          {data.attachments.map((media, index) => (
            <View key={index} style={styles.mediaItem}>
              <Text style={styles.mediaIcon}>
                {media.type === 'photo' ? '🖼️' : '🎬'}
              </Text>
              <View style={styles.mediaInfo}>
                <Text style={styles.mediaName}>{media.fileName}</Text>
                <Text style={styles.mediaSize}>
                  {formatFileSize(media.fileSize)} • {media.mimeType}
                </Text>
                <Text style={styles.mediaHash} selectable>
                  SHA-256: {media.sha256Hash.substring(0, 32)}...
                </Text>
              </View>
            </View>
          ))}
        </Section>
      )}

      {/* GPS Location */}
      {data.location && (
        <Section title={tCommon('location')}>
          <ReviewRow
            label={tCommon('coordinates')}
            value={`${data.location.latitude.toFixed(4)}°, ${data.location.longitude.toFixed(4)}°`}
          />
          {data.location.accuracy && (
            <ReviewRow
              label={tCommon('accuracy')}
              value={`±${Math.round(data.location.accuracy)} meters`}
            />
          )}
          {data.location.address && (
            <ReviewRow label={tCommon('address')} value={data.location.address} />
          )}
        </Section>
      )}

      {/* Privacy */}
      <Section title={tCommon('privacy')}>
        <ReviewRow
          label={tCommon('privacy_level')}
          value={getPrivacyLabel(data.privacyLevel, tCommon)}
          badge="#007AFF"
        />
        <Text style={styles.privacyNote}>
          {getPrivacyNote(data.privacyLevel, tCommon)}
        </Text>
      </Section>

      {/* Confirmation Checkboxes */}
      <View style={styles.confirmationBox}>
        <Text style={styles.confirmationTitle}>{tCommon('before_you_submit')}</Text>
        <CheckItem text={tCommon('information_is_accurate')} />
        <CheckItem text={tCommon('comfortable_sharing_with_lawyer')} />
        <CheckItem text={tCommon('understand_privacy_settings')} />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={styles.submitButtonText}>✓ {t('submit_event')}</Text>
            <Text style={styles.submitButtonSubtext}>
              {tCommon('send_to_lawyer')}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>📬 {tCommon('what_happens_next')}</Text>
        <BulletPoint text={tCommon('event_sent_to_your_lawyer')} />
        <BulletPoint text={tCommon('lawyer_notified_immediately')} />
        <BulletPoint text={tCommon('you_can_view_in_history')} />
        <BulletPoint text={tCommon('lawyer_may_add_notes')} />
      </View>
    </ScrollView>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

interface ReviewRowProps {
  label: string;
  value: string;
  long?: boolean;
  badge?: string;
}

const ReviewRow: React.FC<ReviewRowProps> = ({ label, value, long, badge }) => (
  <View style={[styles.reviewRow, long && styles.reviewRowLong]}>
    <Text style={styles.reviewLabel}>{label}:</Text>
    <View style={styles.reviewValueContainer}>
      <Text style={[styles.reviewValue, long && styles.reviewValueLong]}>
        {value}
      </Text>
      {badge && <View style={[styles.badge, { backgroundColor: badge }]} />}
    </View>
  </View>
);

interface CheckItemProps {
  text: string;
}

const CheckItem: React.FC<CheckItemProps> = ({ text }) => (
  <View style={styles.checkItem}>
    <Text style={styles.checkmark}>✓</Text>
    <Text style={styles.checkText}>{text}</Text>
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

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'low':
      return '#34C759';
    case 'medium':
      return '#FF9500';
    case 'high':
      return '#FF3B30';
    case 'emergency':
      return '#8B0000';
    default:
      return '#007AFF';
  }
}

function getPrivacyLabel(
  privacyLevel: string,
  t: (key: string) => string
): string {
  switch (privacyLevel) {
    case 'private':
      return t('privacy_private');
    case 'shared_with_lawyer':
      return t('privacy_shared_with_lawyer');
    case 'court_export':
      return t('privacy_court_export');
    default:
      return privacyLevel;
  }
}

function getPrivacyNote(
  privacyLevel: string,
  t: (key: string) => string
): string {
  switch (privacyLevel) {
    case 'private':
      return t('privacy_note_private');
    case 'shared_with_lawyer':
      return t('privacy_note_shared_with_lawyer');
    case 'court_export':
      return t('privacy_note_court_export');
    default:
      return '';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
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
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFE8E6',
    borderRadius: 6,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  reviewRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
  },
  reviewRowLong: {
    flexDirection: 'column',
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  reviewValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  reviewValue: {
    fontSize: 13,
    color: '#000',
    fontWeight: '500',
    textAlign: 'right',
    maxWidth: '70%',
  },
  reviewValueLong: {
    marginTop: 4,
    textAlign: 'left',
    maxWidth: '100%',
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  mediaItem: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mediaIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  mediaInfo: {
    flex: 1,
  },
  mediaName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  mediaSize: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  mediaHash: {
    fontSize: 10,
    color: '#007AFF',
    fontFamily: 'Menlo',
    marginTop: 4,
  },
  privacyNote: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 12,
    paddingTop: 8,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  confirmationBox: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  confirmationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  checkmark: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
    marginRight: 8,
    marginTop: 2,
  },
  checkText: {
    fontSize: 13,
    color: '#000',
    flex: 1,
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  submitButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#F0FFF4',
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  infoBoxTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34C759',
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

export default LogEventStep5;
