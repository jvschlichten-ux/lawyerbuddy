/**
 * LogEventStep2: Details
 *
 * Collects: narrative, severity, involved parties, court orders, actions taken
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useTranslation } from '@lawyerbuddy/i18n';
import type { EventFormData } from '../LogEventScreen';

interface LogEventStep2Props {
  data: EventFormData;
  onUpdate: (updates: Partial<EventFormData>) => void;
  error?: string;
}

const SEVERITY_OPTIONS: Array<{
  value: 'low' | 'medium' | 'high' | 'emergency';
  label: string;
}> = [
  { value: 'low', label: 'severity_low' },
  { value: 'medium', label: 'severity_medium' },
  { value: 'high', label: 'severity_high' },
  { value: 'emergency', label: 'severity_emergency' },
];

const LogEventStep2: React.FC<LogEventStep2Props> = ({ data, onUpdate, error }) => {
  const { t } = useTranslation('legal');
  const { t: tCommon } = useTranslation('common');
  const [newParty, setNewParty] = React.useState('');

  const handleAddParty = () => {
    if (newParty.trim()) {
      onUpdate({
        involvedParties: [...(data.involvedParties || []), newParty.trim()],
      });
      setNewParty('');
    }
  };

  const handleRemoveParty = (index: number) => {
    onUpdate({
      involvedParties: data.involvedParties.filter((_, i) => i !== index),
    });
  };

  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Narrative */}
      <View style={styles.field}>
        <Text style={styles.label}>{tCommon('what_happened')} *</Text>
        <Text style={styles.description}>{tCommon('include_all_details')}</Text>
        <TextInput
          style={[styles.input, styles.textAreaInput]}
          placeholder={tCommon('describe_what_happened')}
          value={data.narrative}
          onChangeText={(narrative) => onUpdate({ narrative })}
          maxLength={2000}
          placeholderTextColor="#999"
          multiline
          numberOfLines={6}
        />
        <Text style={styles.characterCount}>
          {data.narrative.length}/2000
        </Text>
      </View>

      {/* Severity */}
      <View style={styles.field}>
        <Text style={styles.label}>{tCommon('severity')}</Text>
        <View style={styles.severityContainer}>
          {SEVERITY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.severityButton,
                data.severity === option.value && styles.severityButtonSelected,
              ]}
              onPress={() => onUpdate({ severity: option.value })}
            >
              <View
                style={[
                  styles.severityDot,
                  {
                    backgroundColor: getSeverityColor(option.value),
                  },
                  data.severity === option.value && styles.severityDotSelected,
                ]}
              />
              <Text
                style={[
                  styles.severityButtonText,
                  data.severity === option.value && styles.severityButtonTextSelected,
                ]}
              >
                {t(option.label)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Involved Parties */}
      <View style={styles.field}>
        <Text style={styles.label}>{tCommon('involved_parties')}</Text>
        <View style={styles.partiesInputContainer}>
          <TextInput
            style={styles.partiesInput}
            placeholder={tCommon('name_of_person_or_entity')}
            value={newParty}
            onChangeText={setNewParty}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={styles.addPartyButton}
            onPress={handleAddParty}
            disabled={!newParty.trim()}
          >
            <Text style={styles.addPartyButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Parties List */}
        {data.involvedParties.length > 0 && (
          <View style={styles.partiesList}>
            {data.involvedParties.map((party, index) => (
              <View key={index} style={styles.partyTag}>
                <Text style={styles.partyTagText}>{party}</Text>
                <TouchableOpacity onPress={() => handleRemoveParty(index)}>
                  <Text style={styles.partyTagRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Court Order Reference */}
      <View style={styles.field}>
        <Text style={styles.label}>{tCommon('court_order_reference')}</Text>
        <TextInput
          style={styles.input}
          placeholder={tCommon('e_g_case_number_or_order_date')}
          value={data.courtOrderReference || ''}
          onChangeText={(courtOrderReference) => onUpdate({ courtOrderReference })}
          placeholderTextColor="#999"
        />
      </View>

      {/* Actions Taken */}
      <View style={styles.field}>
        <Text style={styles.label}>{tCommon('actions_taken')}</Text>
        <TextInput
          style={[styles.input, styles.textAreaInput]}
          placeholder={tCommon('describe_any_actions_you_took')}
          value={data.actionsTaken || ''}
          onChangeText={(actionsTaken) => onUpdate({ actionsTaken })}
          maxLength={500}
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
        <Text style={styles.characterCount}>
          {(data.actionsTaken || '').length}/500
        </Text>
      </View>

      {/* Info box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>{tCommon('tip')}</Text>
        <Text style={styles.infoBoxText}>
          {tCommon('provide_detailed_narrative_for_lawyer_review')}
        </Text>
      </View>
    </View>
  );
};

function getSeverityColor(severity: 'low' | 'medium' | 'high' | 'emergency'): string {
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
      return '#999';
  }
}

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
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#f9f9f9',
  },
  textAreaInput: {
    minHeight: 100,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  severityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  severityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    flex: 1,
    minWidth: '48%',
  },
  severityButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F4FF',
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  severityDotSelected: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  severityButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  severityButtonTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  partiesInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  partiesInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    backgroundColor: '#f9f9f9',
  },
  addPartyButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPartyButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  partiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  partyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  partyTagText: {
    fontSize: 13,
    color: '#007AFF',
    marginRight: 6,
  },
  partyTagRemove: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 12,
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
});

export default LogEventStep2;
