/**
 * ExportScreen
 *
 * Export case data for court or records
 * CRITICAL SECURITY: Attorney notes are NEVER included in exports
 * Attorney notes are lawyer-private and cannot be exported
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from '@lawyerbuddy/i18n';

const ExportScreen: React.FC = () => {
  const { t } = useTranslation('lawyer');
  const { t: tCommon } = useTranslation('common');
  const route = useRoute();
  const navigation = useNavigation();
  const caseId = (route.params as any)?.caseId as string;

  const [isExporting, setIsExporting] = useState(false);

  // Export options
  const [includeCheckpoints, setIncludeCheckpoints] = useState(true);
  const [includeMedia, setIncludeMedia] = useState(true);
  const [includeGPS, setIncludeGPS] = useState(true);
  const [format, setFormat] = useState<'pdf' | 'json' | 'docx'>('pdf');

  const handleExport = async () => {
    if (!caseId) {
      Alert.alert(tCommon('error'), t('no_case_selected'));
      return;
    }

    Alert.alert(
      t('export_case'),
      t('confirm_export_data'),
      [
        { text: tCommon('cancel'), style: 'cancel' },
        {
          text: tCommon('export'),
          onPress: async () => {
            try {
              setIsExporting(true);

              // In production: POST /cases/:caseId/export
              // Backend will:
              // 1. Fetch all case data
              // 2. EXCLUDE attorney_note field from response
              // 3. Generate PDF/JSON/DOCX file
              // 4. Return download URL

              await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate export

              Alert.alert(
                t('export_ready'),
                t('case_exported_successfully'),
                [{ text: tCommon('ok'), onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              Alert.alert(tCommon('error'), t('export_failed'));
            } finally {
              setIsExporting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {tCommon('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('export_case')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* CRITICAL: Attorney Notes Never Exported */}
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>🔒</Text>
          <Text style={styles.warningTitle}>{t('attorney_notes_confidential')}</Text>
          <Text style={styles.warningText}>
            {t(
              'attorney_notes_are_lawyer_private_and_cannot_be_included_in_exports'
            )}
          </Text>
          <Text style={styles.warningSubtext}>
            {t('attorney_notes_remain_in_lawyerbuddy_only')}
          </Text>
        </View>

        {/* What Gets Exported */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('what_will_be_exported')}</Text>

          <ExportItem
            icon="✓"
            title={t('case_details')}
            description={t('case_title_type_dates')}
            color="#34C759"
          />
          <ExportItem
            icon="✓"
            title={t('client_events')}
            description={t('all_logged_events_narratives_media')}
            color="#34C759"
          />
          <ExportItem
            icon="✓"
            title={t('checkslist')}
            description={t('checklist_items_completion_status')}
            color="#34C759"
          />
          <ExportItem
            icon="✓"
            title={t('location_data')}
            description={t('gps_coordinates_addresses')}
            color="#34C759"
          />
          <ExportItem
            icon="✓"
            title={t('media_files')}
            description={t('photos_videos_with_sha256_hashes')}
            color="#34C759"
          />

          <ExportItem
            icon="✕"
            title={t('attorney_notes')}
            description={t('lawyer_private_never_exported')}
            color="#FF3B30"
            excluded
          />
          <ExportItem
            icon="✕"
            title={t('internal_flags')}
            description={t('attorney_flag_field_excluded')}
            color="#FF3B30"
            excluded
          />
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('export_options')}</Text>

          {/* Format Selection */}
          <View style={styles.optionGroup}>
            <Text style={styles.optionLabel}>{t('file_format')}</Text>
            <View style={styles.formatButtons}>
              <FormatButton
                label="PDF"
                selected={format === 'pdf'}
                onPress={() => setFormat('pdf')}
              />
              <FormatButton
                label="JSON"
                selected={format === 'json'}
                onPress={() => setFormat('json')}
              />
              <FormatButton
                label="DOCX"
                selected={format === 'docx'}
                onPress={() => setFormat('docx')}
              />
            </View>
          </View>

          {/* Include Checkpoints */}
          <OptionToggle
            label={t('include_checklist_items')}
            value={includeCheckpoints}
            onToggle={setIncludeCheckpoints}
          />

          {/* Include Media */}
          <OptionToggle
            label={t('include_media_files')}
            description={t('can_make_export_large')}
            value={includeMedia}
            onToggle={setIncludeMedia}
          />

          {/* Include GPS */}
          <OptionToggle
            label={t('include_gps_coordinates')}
            value={includeGPS}
            onToggle={setIncludeGPS}
          />
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy_security')}</Text>

          <InfoBox
            icon="🔐"
            title={t('encrypted_during_transfer')}
            text={t('exported_data_encrypted_in_transit')}
          />

          <InfoBox
            icon="⚖️"
            title={t('court_admissible')}
            text={t('export_suitable_for_court_submission')}
          />

          <InfoBox
            icon="📋"
            title={t('audit_trail')}
            text={t('all_exports_logged_for_compliance')}
          />
        </View>

        {/* Advanced Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('advanced')}</Text>

          <InfoBox
            icon="🔒"
            title={t('file_integrity')}
            text={t('all_media_files_include_sha256_hashes_for_verification')}
          />

          <InfoBox
            icon="⏰"
            title={t('timezone_handling')}
            text={t('all_timestamps_converted_to_utc')}
          />
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>{t('important_disclaimer')}</Text>
          <BulletPoint
            text={t(
              'exported_data_is_confidential_and_should_be_treated_as_privileged'
            )}
          />
          <BulletPoint
            text={t('attorney_notes_remain_in_lawyerbuddy_only_on_your_device')}
          />
          <BulletPoint text={t('you_are_responsible_for_data_security_post_export')} />
          <BulletPoint
            text={t('ensure_compliance_with_data_protection_regulations')}
          />
        </View>
      </ScrollView>

      {/* Export Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
          onPress={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.exportButtonText}>📥 {t('export_now')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

interface ExportItemProps {
  icon: string;
  title: string;
  description: string;
  color: string;
  excluded?: boolean;
}

const ExportItem: React.FC<ExportItemProps> = ({
  icon,
  title,
  description,
  color,
  excluded,
}) => (
  <View
    style={[
      styles.exportItem,
      excluded && styles.exportItemExcluded,
    ]}
  >
    <View style={[styles.exportItemIcon, { color }]}>
      <Text style={{ fontSize: 18, color }}>{icon}</Text>
    </View>
    <View style={styles.exportItemContent}>
      <Text style={[styles.exportItemTitle, excluded && styles.exportItemTitleExcluded]}>
        {title}
      </Text>
      <Text style={styles.exportItemDescription}>{description}</Text>
    </View>
  </View>
);

interface FormatButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const FormatButton: React.FC<FormatButtonProps> = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.formatButton, selected && styles.formatButtonSelected]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.formatButtonText,
        selected && styles.formatButtonTextSelected,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

interface OptionToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

const OptionToggle: React.FC<OptionToggleProps> = ({ label, description, value, onToggle }) => (
  <TouchableOpacity
    style={styles.optionToggle}
    onPress={() => onToggle(!value)}
  >
    <View style={styles.optionToggleLeft}>
      <Text style={styles.optionToggleLabel}>{label}</Text>
      {description && (
        <Text style={styles.optionToggleDescription}>{description}</Text>
      )}
    </View>
    <View
      style={[
        styles.toggleSwitch,
        value && styles.toggleSwitchOn,
      ]}
    >
      <View style={[styles.toggleSlide, value && styles.toggleSlideOn]} />
    </View>
  </TouchableOpacity>
);

interface InfoBoxProps {
  icon: string;
  title: string;
  text: string;
}

const InfoBox: React.FC<InfoBoxProps> = ({ icon, title, text }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <View style={styles.infoContent}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoText}>{text}</Text>
    </View>
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
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF9500',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 6,
  },
  warningSubtext: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  exportItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  exportItemExcluded: {
    borderLeftColor: '#FF3B30',
    backgroundColor: '#FFF0F0',
  },
  exportItemIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  exportItemContent: {
    flex: 1,
  },
  exportItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  exportItemTitleExcluded: {
    color: '#FF3B30',
  },
  exportItemDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  optionGroup: {
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  formatButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  formatButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F4FF',
  },
  formatButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  formatButtonTextSelected: {
    color: '#007AFF',
  },
  optionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionToggleLeft: {
    flex: 1,
  },
  optionToggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  optionToggleDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchOn: {
    backgroundColor: '#34C759',
  },
  toggleSlide: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleSlideOn: {
    alignSelf: 'flex-end',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    lineHeight: 16,
  },
  disclaimerBox: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  bulletPoint: {
    marginBottom: 6,
  },
  bulletText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  exportButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ExportScreen;
