/**
 * LogEventStep1: Event Basics
 *
 * Collects: title, event type, occurred date/time, location description
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from '@lawyerbuddy/i18n';
import type { EventFormData } from '../LogEventScreen';

interface LogEventStep1Props {
  data: EventFormData;
  onUpdate: (updates: Partial<EventFormData>) => void;
  error?: string;
}

// Event type options from legal.json
const EVENT_TYPES = [
  'police_interaction',
  'court_appearance',
  'incident',
  'injury',
  'property_damage',
  'communication',
  'custody_issue',
  'violation',
  'arrest',
  'other',
];

const LogEventStep1: React.FC<LogEventStep1Props> = ({ data, onUpdate, error }) => {
  const { t } = useTranslation('legal');
  const { t: tCommon } = useTranslation('common');
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(data.occurredAt);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      onUpdate({ occurredAt: newDate });
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const newDate = new Date(data.occurredAt);
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
      onUpdate({ occurredAt: newDate });
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Event Title */}
      <View style={styles.field}>
        <Text style={styles.label}>{tCommon('event_title')} *</Text>
        <TextInput
          style={styles.input}
          placeholder={tCommon('enter_event_title')}
          value={data.title}
          onChangeText={(title) => onUpdate({ title })}
          maxLength={150}
          placeholderTextColor="#999"
        />
        <Text style={styles.characterCount}>
          {data.title.length}/150
        </Text>
      </View>

      {/* Event Type */}
      <View style={styles.field}>
        <Text style={styles.label}>{tCommon('event_type')} *</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeButtonsContainer}
        >
          {EVENT_TYPES.map((eventType) => (
            <TouchableOpacity
              key={eventType}
              style={[
                styles.typeButton,
                data.eventType === eventType && styles.typeButtonSelected,
              ]}
              onPress={() => onUpdate({ eventType })}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  data.eventType === eventType && styles.typeButtonTextSelected,
                ]}
              >
                {t(`event_type_${eventType}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Date & Time */}
      <View style={styles.field}>
        <Text style={styles.label}>{tCommon('when_did_it_happen')} *</Text>
        <View style={styles.dateTimeContainer}>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateTimeButtonText}>{formatDate(data.occurredAt)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.dateTimeButtonText}>{formatTime(data.occurredAt)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={data.occurredAt}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={data.occurredAt}
          mode="time"
          display="spinner"
          onChange={handleTimeChange}
        />
      )}

      {/* Location Description */}
      <View style={styles.field}>
        <Text style={styles.label}>{tCommon('where_did_it_happen')}</Text>
        <TextInput
          style={[styles.input, styles.textAreaInput]}
          placeholder={tCommon('describe_location')}
          value={data.locationDescription}
          onChangeText={(locationDescription) => onUpdate({ locationDescription })}
          maxLength={300}
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
        <Text style={styles.characterCount}>
          {data.locationDescription.length}/300
        </Text>
      </View>

      {/* Info box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>{tCommon('tip')}</Text>
        <Text style={styles.infoBoxText}>
          {tCommon('be_as_specific_as_possible_about_location_and_time')}
        </Text>
      </View>
    </View>
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
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
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
    minHeight: 80,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  typeButtonsContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  typeButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F4FF',
  },
  typeButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateTimeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  dateTimeButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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

export default LogEventStep1;
