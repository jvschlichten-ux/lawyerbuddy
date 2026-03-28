/**
 * LogEventScreen
 *
 * Client's primary event logging interface with 5-step workflow:
 * 1. Event Basics (title, type, date, location description)
 * 2. Details (narrative, severity, involved parties)
 * 3. Media (camera capture, photos)
 * 4. GPS (location capture)
 * 5. Review & Submit
 *
 * Manages state across all steps and handles final submission
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from '@lawyerbuddy/i18n';
import LogEventStep1 from './steps/LogEventStep1';
import LogEventStep2 from './steps/LogEventStep2';
import LogEventStep3 from './steps/LogEventStep3';
import LogEventStep4 from './steps/LogEventStep4';
import LogEventStep5 from './steps/LogEventStep5';
import type { CapturedMedia } from '../../services/media';
import type { LocationData } from '../../services/location';

export interface EventFormData {
  // Step 1: Basics
  title: string;
  eventType: string;
  occurredAt: Date;
  locationDescription: string;

  // Step 2: Details
  narrative: string;
  severity: 'low' | 'medium' | 'high' | 'emergency';
  involvedParties: string[];
  courtOrderReference?: string;
  actionsTaken?: string;
  relatedEventIds?: string[];

  // Step 3: Media
  attachments: CapturedMedia[];

  // Step 4: GPS
  location?: LocationData;

  // Additional
  privacyLevel: 'private' | 'shared_with_lawyer' | 'court_export';
}

type StepNumber = 1 | 2 | 3 | 4 | 5;

interface StepProgress {
  isComplete: boolean;
  hasValidData: boolean;
}

const LogEventScreen: React.FC = () => {
  const { t } = useTranslation('client');
  const navigation = useNavigation();
  const route = useRoute();
  const caseId = (route.params as any)?.caseId as string;

  // Current step tracking
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);

  // Form state
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    eventType: '',
    occurredAt: new Date(),
    locationDescription: '',
    narrative: '',
    severity: 'medium',
    involvedParties: [],
    privacyLevel: 'shared_with_lawyer',
    attachments: [],
  });

  // Validation state
  const [stepErrors, setStepErrors] = useState<{ [key in StepNumber]?: string }>({});

  /**
   * Validate current step before advancing
   */
  const validateStep = useCallback((step: StepNumber): boolean => {
    switch (step) {
      case 1:
        // Step 1: Basics
        if (!formData.title.trim()) {
          setStepErrors((prev) => ({ ...prev, 1: t('error_event_title_required') }));
          return false;
        }
        if (!formData.eventType) {
          setStepErrors((prev) => ({ ...prev, 1: t('error_event_type_required') }));
          return false;
        }
        setStepErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[1];
          return newErrors;
        });
        return true;

      case 2:
        // Step 2: Details
        if (!formData.narrative.trim()) {
          setStepErrors((prev) => ({ ...prev, 2: t('error_narrative_required') }));
          return false;
        }
        setStepErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[2];
          return newErrors;
        });
        return true;

      case 3:
      case 4:
      case 5:
        // Steps 3-5 are optional or validated on submission
        setStepErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[step];
          return newErrors;
        });
        return true;

      default:
        return true;
    }
  }, [formData, t]);

  /**
   * Advance to next step
   */
  const handleNextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep((currentStep + 1) as StepNumber);
      }
    }
  }, [currentStep, validateStep]);

  /**
   * Go back to previous step
   */
  const handlePreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as StepNumber);
    }
  }, [currentStep]);

  /**
   * Update form data for current step
   */
  const handleUpdateFormData = useCallback((updates: Partial<EventFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Handle form submission (Step 5)
   */
  const handleSubmit = useCallback(async () => {
    // Validate all steps
    const allValid = [1, 2, 3, 4, 5].every((step) => validateStep(step as StepNumber));

    if (!allValid) {
      setStepErrors((prev) => ({
        ...prev,
        5: t('error_validation_failed'),
      }));
      return;
    }

    try {
      // In Phase 6+, this will submit to backend
      // For now, just navigate back
      console.log('Event submitted:', formData);
      navigation.goBack();
    } catch (error) {
      setStepErrors((prev) => ({
        ...prev,
        5: t('error_submission_failed'),
      }));
    }
  }, [formData, validateStep, t, navigation]);

  /**
   * Render the current step
   */
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <LogEventStep1
            data={formData}
            onUpdate={handleUpdateFormData}
            error={stepErrors[1]}
          />
        );
      case 2:
        return (
          <LogEventStep2
            data={formData}
            onUpdate={handleUpdateFormData}
            error={stepErrors[2]}
          />
        );
      case 3:
        return (
          <LogEventStep3
            data={formData}
            onUpdate={handleUpdateFormData}
            error={stepErrors[3]}
          />
        );
      case 4:
        return (
          <LogEventStep4
            data={formData}
            onUpdate={handleUpdateFormData}
            error={stepErrors[4]}
          />
        );
      case 5:
        return (
          <LogEventStep5
            data={formData}
            caseId={caseId}
            onSubmit={handleSubmit}
            error={stepErrors[5]}
          />
        );
      default:
        return null;
    }
  };

  /**
   * Progress indicator: step dots
   */
  const renderProgressDots = () => {
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5].map((step) => (
          <TouchableOpacity
            key={step}
            style={[
              styles.progressDot,
              step === currentStep && styles.progressDotActive,
              step < currentStep && styles.progressDotCompleted,
            ]}
            onPress={() => {
              if (step < currentStep) {
                setCurrentStep(step as StepNumber);
              }
            }}
            disabled={step > currentStep}
          >
            <Text
              style={[
                styles.progressDotText,
                (step === currentStep || step < currentStep) &&
                  styles.progressDotTextActive,
              ]}
            >
              {step}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  /**
   * Step counter and title
   */
  const getStepTitle = (step: StepNumber): string => {
    switch (step) {
      case 1:
        return t('log_event_step_1_title');
      case 2:
        return t('log_event_step_2_title');
      case 3:
        return t('log_event_step_3_title');
      case 4:
        return t('log_event_step_4_title');
      case 5:
        return t('log_event_step_5_title');
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{getStepTitle(currentStep)}</Text>
          <Text style={styles.stepCounter}>
            {t('step')} {currentStep} {t('of')} 5
          </Text>
        </View>
      </View>

      {renderProgressDots()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {renderCurrentStep()}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handlePreviousStep}
          >
            <Text style={styles.buttonTextSecondary}>← {t('previous')}</Text>
          </TouchableOpacity>
        )}

        {currentStep < 5 ? (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleNextStep}
          >
            <Text style={styles.buttonText}>{t('next')} →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, styles.buttonSubmit]}
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>{t('submit_event')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

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
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  stepCounter: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
  },
  progressDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  progressDotCompleted: {
    borderColor: '#34C759',
    backgroundColor: '#34C759',
  },
  progressDotText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  progressDotTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  buttonSubmit: {
    backgroundColor: '#34C759',
  },
});

export default LogEventScreen;
