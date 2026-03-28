/**
 * LawyerDashboardScreen
 *
 * Lawyer's main portal for case management and event review
 * Displays: active cases, pending events, notifications
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from '@lawyerbuddy/i18n';

export interface Case {
  id: string;
  title: string;
  clientName: string;
  status: 'active' | 'closed' | 'archived';
  eventCount: number;
  pendingEventCount: number;
  hasUnreviewedEvents: boolean;
  createdAt: string;
}

export interface PendingEvent {
  id: string;
  caseId: string;
  clientName: string;
  eventType: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'emergency';
  createdAt: string;
  reviewed: boolean;
}

const LawyerDashboardScreen: React.FC = () => {
  const { t } = useTranslation('lawyer');
  const { t: tCommon } = useTranslation('common');
  const navigation = useNavigation();

  const [cases, setCases] = useState<Case[]>([
    {
      id: 'case_1',
      title: 'Smith v. County Sheriff',
      clientName: 'John Smith',
      status: 'active',
      eventCount: 12,
      pendingEventCount: 3,
      hasUnreviewedEvents: true,
      createdAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'case_2',
      title: 'Custody Modification',
      clientName: 'Jane Doe',
      status: 'active',
      eventCount: 5,
      pendingEventCount: 0,
      hasUnreviewedEvents: false,
      createdAt: '2026-02-10T14:30:00Z',
    },
  ]);

  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([
    {
      id: 'event_1',
      caseId: 'case_1',
      clientName: 'John Smith',
      eventType: 'police_interaction',
      title: 'Traffic Stop on Main Street',
      severity: 'high',
      createdAt: '2026-03-26T16:45:00Z',
      reviewed: false,
    },
    {
      id: 'event_2',
      caseId: 'case_1',
      clientName: 'John Smith',
      eventType: 'incident',
      title: 'Property Damage at Home',
      severity: 'medium',
      createdAt: '2026-03-25T09:20:00Z',
      reviewed: false,
    },
  ]);

  /**
   * Navigate to case details
   */
  const handleCasePress = (caseId: string) => {
    navigation.navigate('CaseDetailScreen', { caseId });
  };

  /**
   * Navigate to event review
   */
  const handleEventPress = (eventId: string, caseId: string) => {
    navigation.navigate('EventReviewScreen', { eventId, caseId });
  };

  /**
   * Navigate to create new case
   */
  const handleCreateCase = () => {
    navigation.navigate('CreateCaseScreen');
  };

  /**
   * Render a single case card
   */
  const renderCaseCard = (item: Case) => (
    <TouchableOpacity
      style={[
        styles.caseCard,
        item.hasUnreviewedEvents && styles.caseCardHighlight,
      ]}
      onPress={() => handleCasePress(item.id)}
    >
      <View style={styles.caseCardHeader}>
        <View style={styles.caseCardHeaderLeft}>
          <Text style={styles.caseTitle}>{item.title}</Text>
          <Text style={styles.clientName}>{item.clientName}</Text>
        </View>
        {item.hasUnreviewedEvents && (
          <View style={styles.unreviewed}>
            <Text style={styles.unreviewedText}>{item.pendingEventCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.caseCardStats}>
        <StatBadge
          icon="📋"
          label={tCommon('events')}
          value={item.eventCount.toString()}
        />
        <StatBadge
          icon="🔍"
          label={t('pending_review')}
          value={item.pendingEventCount.toString()}
          highlight={item.pendingEventCount > 0}
        />
        <StatBadge
          icon="📌"
          label={t('status')}
          value={item.status}
          highlight={item.status === 'active'}
        />
      </View>
    </TouchableOpacity>
  );

  /**
   * Render a single pending event
   */
  const renderPendingEvent = (item: PendingEvent) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => handleEventPress(item.id, item.caseId)}
    >
      <View style={styles.eventCardHeader}>
        <View style={styles.eventCardHeaderLeft}>
          <Text style={styles.eventCardTitle}>{item.title}</Text>
          <Text style={styles.eventCardClient}>{item.clientName}</Text>
        </View>
        <View
          style={[
            styles.severityBadge,
            {
              backgroundColor: getSeverityColor(item.severity),
            },
          ]}
        >
          <Text style={styles.severityText}>{item.severity.toUpperCase().substring(0, 1)}</Text>
        </View>
      </View>

      <View style={styles.eventCardFooter}>
        <Text style={styles.eventType}>{item.eventType}</Text>
        <Text style={styles.eventTime}>{formatTimeAgo(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  const unreviewedCount = pendingEvents.filter((e) => !e.reviewed).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>{t('dashboard')}</Text>
          {unreviewedCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreviewedCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateCase}
        >
          <Text style={styles.addButtonText}>+ {t('new_case')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Active Cases Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('active_cases')}</Text>
          {cases.length === 0 ? (
            <Text style={styles.emptyText}>{t('no_cases_yet')}</Text>
          ) : (
            cases.map((caseItem) => (
              <View key={caseItem.id}>{renderCaseCard(caseItem)}</View>
            ))
          )}
        </View>

        {/* Pending Events Section */}
        {pendingEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('pending_review')}</Text>
              <Text style={styles.sectionCount}>{pendingEvents.length}</Text>
            </View>
            {pendingEvents.map((event) => (
              <View key={event.id}>{renderPendingEvent(event)}</View>
            ))}
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>💡 {t('lawyer_tools')}</Text>
          <BulletPoint text={t('review_client_events')} />
          <BulletPoint text={t('add_attorney_notes')} />
          <BulletPoint text={t('build_checklists')} />
          <BulletPoint text={t('export_case_data')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface StatBadgeProps {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}

const StatBadge: React.FC<StatBadgeProps> = ({ icon, label, value, highlight }) => (
  <View style={[styles.statBadge, highlight && styles.statBadgeHighlight]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
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
      return '#999';
  }
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  headerBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
    backgroundColor: '#FFE8E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  caseCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  caseCardHighlight: {
    borderLeftColor: '#FF3B30',
    backgroundColor: '#FFF0F0',
  },
  caseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  caseCardHeaderLeft: {
    flex: 1,
  },
  caseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  clientName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  unreviewed: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreviewedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  caseCardStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statBadgeHighlight: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFE8E6',
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  eventCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventCardHeaderLeft: {
    flex: 1,
  },
  eventCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  eventCardClient: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  severityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  eventCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventType: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '500',
  },
  eventTime: {
    fontSize: 11,
    color: '#999',
  },
  infoBox: {
    backgroundColor: '#E8F4FF',
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
});

export default LawyerDashboardScreen;
