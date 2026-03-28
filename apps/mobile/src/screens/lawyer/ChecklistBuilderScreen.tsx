/**
 * ChecklistBuilderScreen
 *
 * Lawyer's interface for building case checklists
 * - Create new items
 * - Mark items complete/incomplete
 * - Clients see this but cannot edit (RLS enforced)
 * - Reorder items
 *
 * CRITICAL: Only lawyers can UPDATE/INSERT/DELETE checklist items
 * Clients can only SELECT (read) items
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from '@lawyerbuddy/i18n';
import DraggableFlatList from 'react-native-draggable-flat-list';

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  isComplete: boolean;
  completedAt?: string;
  completedBy?: string;
  orderIndex: number;
}

const ChecklistBuilderScreen: React.FC = () => {
  const { t } = useTranslation('lawyer');
  const { t: tCommon } = useTranslation('common');
  const route = useRoute();
  const navigation = useNavigation();
  const caseId = (route.params as any)?.caseId as string;
  const isLawyer = (route.params as any)?.isLawyer as boolean;

  const [items, setItems] = useState<ChecklistItem[]>([
    {
      id: 'item_1',
      label: 'File complaint',
      description: 'Submit initial complaint to court',
      isComplete: true,
      completedAt: '2026-03-20T10:00:00Z',
      completedBy: 'You',
      orderIndex: 0,
    },
    {
      id: 'item_2',
      label: 'Gather evidence',
      description: 'Collect all relevant documents and media',
      isComplete: true,
      completedAt: '2026-03-22T14:30:00Z',
      completedBy: 'You',
      orderIndex: 1,
    },
    {
      id: 'item_3',
      label: 'Prepare deposition questions',
      description: 'Draft questions for witness deposition',
      isComplete: false,
      orderIndex: 2,
    },
    {
      id: 'item_4',
      label: 'Review court filings',
      description: 'Check opposing counsel\'s filings',
      isComplete: false,
      orderIndex: 3,
    },
  ]);

  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Add new checklist item
   * LAWYER ONLY - POST endpoint will verify lawyer_id = auth.uid()
   */
  const handleAddItem = async () => {
    if (!newItemLabel.trim()) {
      Alert.alert(tCommon('error'), t('checklist_item_label_required'));
      return;
    }

    if (!isLawyer) {
      Alert.alert(
        tCommon('access_denied'),
        t('only_lawyers_can_edit_checklists')
      );
      return;
    }

    try {
      setIsSaving(true);

      const newItem: ChecklistItem = {
        id: `item_${Date.now()}`,
        label: newItemLabel.trim(),
        description: newItemDescription.trim() || undefined,
        isComplete: false,
        orderIndex: items.length,
      };

      setItems([...items, newItem]);
      setNewItemLabel('');
      setNewItemDescription('');

      // In production: POST /cases/:caseId/checklist
      // RLS will verify lawyer_id = auth.uid()
    } catch (error) {
      Alert.alert(tCommon('error'), t('failed_to_add_item'));
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Toggle item completion status
   * LAWYER ONLY - PATCH endpoint will verify lawyer_id = auth.uid()
   */
  const handleToggleItem = async (id: string) => {
    if (!isLawyer) {
      Alert.alert(
        tCommon('access_denied'),
        t('only_lawyers_can_edit_checklists')
      );
      return;
    }

    try {
      const updated = items.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            isComplete: !item.isComplete,
            completedAt: !item.isComplete ? new Date().toISOString() : undefined,
            completedBy: !item.isComplete ? 'You' : undefined,
          };
        }
        return item;
      });

      setItems(updated);

      // In production: PATCH /cases/:caseId/checklist/:itemId
      // RLS will verify lawyer_id = auth.uid() for case
      // Body: { isComplete, completedAt, completedBy }
    } catch (error) {
      Alert.alert(tCommon('error'), t('failed_to_update_item'));
    }
  };

  /**
   * Delete checklist item
   * LAWYER ONLY - DELETE endpoint will verify lawyer_id = auth.uid()
   */
  const handleDeleteItem = async (id: string) => {
    if (!isLawyer) {
      Alert.alert(
        tCommon('access_denied'),
        t('only_lawyers_can_edit_checklists')
      );
      return;
    }

    Alert.alert(tCommon('confirm'), t('delete_checklist_item'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: tCommon('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            setItems(items.filter((item) => item.id !== id));
            // In production: DELETE /cases/:caseId/checklist/:itemId
            // RLS will verify lawyer_id = auth.uid()
          } catch (error) {
            Alert.alert(tCommon('error'), t('failed_to_delete_item'));
          }
        },
      },
    ]);
  };

  /**
   * Handle drag-to-reorder
   * LAWYER ONLY - bulk PATCH endpoint
   */
  const handleReorder = async (data: ChecklistItem[]) => {
    if (!isLawyer) {
      return; // Prevent drag for clients
    }

    const reordered = data.map((item, index) => ({
      ...item,
      orderIndex: index,
    }));

    setItems(reordered);

    // In production: PATCH /cases/:caseId/checklist/reorder
    // Body: [{ id, orderIndex }, ...]
  };

  const completedCount = items.filter((item) => item.isComplete).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  /**
   * Render a checklist item
   */
  const renderItem = ({ item, drag, isActive }: any) => (
    <TouchableOpacity
      onLongPress={isLawyer ? drag : undefined}
      disabled={!isLawyer || isActive}
      style={[styles.itemContainer, isActive && styles.itemContainerActive]}
    >
      {/* Checkbox / Completion Toggle */}
      {isLawyer ? (
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleToggleItem(item.id)}
        >
          {item.isComplete ? (
            <Text style={styles.checkboxChecked}>✓</Text>
          ) : (
            <View style={styles.checkboxEmpty} />
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.checkbox}>
          {item.isComplete ? (
            <Text style={styles.checkboxChecked}>✓</Text>
          ) : (
            <View style={styles.checkboxEmpty} />
          )}
        </View>
      )}

      {/* Item Content */}
      <View style={styles.itemContent}>
        <Text
          style={[
            styles.itemLabel,
            item.isComplete && styles.itemLabelCompleted,
          ]}
        >
          {item.label}
        </Text>
        {item.description && (
          <Text style={styles.itemDescription}>{item.description}</Text>
        )}
        {item.isComplete && item.completedAt && (
          <Text style={styles.itemCompletedInfo}>
            ✓ Completed {formatDate(item.completedAt)}
          </Text>
        )}
      </View>

      {/* Lawyer Controls */}
      {isLawyer && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      )}

      {/* Drag Handle (lawyer only) */}
      {isLawyer && (
        <View style={styles.dragHandle}>
          <Text style={styles.dragIcon}>≡</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {tCommon('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('checklist')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>{t('progress')}</Text>
            <Text style={styles.progressText}>
              {completedCount} of {totalCount}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>
          <Text style={styles.progressPercent}>{Math.round(progressPercent)}% complete</Text>
        </View>

        {/* Permission Notice */}
        {!isLawyer && (
          <View style={styles.clientNotice}>
            <Text style={styles.clientNoticeTitle}>👁️ {tCommon('view_only')}</Text>
            <Text style={styles.clientNoticeText}>
              {t('only_lawyers_can_edit_checklist')}
            </Text>
          </View>
        )}

        {/* Lawyer: Add Item Form */}
        {isLawyer && (
          <View style={styles.addItemSection}>
            <Text style={styles.addItemTitle}>{t('add_checklist_item')}</Text>
            <TextInput
              style={styles.addItemInput}
              placeholder={t('what_needs_to_be_done')}
              value={newItemLabel}
              onChangeText={setNewItemLabel}
              editable={!isSaving}
              maxLength={150}
              placeholderTextColor="#999"
            />
            <TextInput
              style={[styles.addItemInput, styles.addItemDescription]}
              placeholder={t('optional_description')}
              value={newItemDescription}
              onChangeText={setNewItemDescription}
              editable={!isSaving}
              maxLength={300}
              multiline
              numberOfLines={2}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[styles.addButton, isSaving && styles.addButtonDisabled]}
              onPress={handleAddItem}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addButtonText}>+ {t('add_item')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Checklist Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.itemsSectionTitle}>
            {t('checklist_items')} ({items.length})
          </Text>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>{t('no_items_yet')}</Text>
          ) : (
            <DraggableFlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              onDragEnd={({ data }) => {
                if (isLawyer) {
                  handleReorder(data);
                }
              }}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Lawyer Info */}
        {isLawyer && (
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>💡 {t('checklist_tips')}</Text>
            <BulletPoint text={t('drag_to_reorder_items')} />
            <BulletPoint text={t('click_to_mark_complete')} />
            <BulletPoint text={t('swipe_to_delete_items')} />
            <BulletPoint text={t('clients_see_this_checklist')} />
          </View>
        )}

        {/* Client Info */}
        {!isLawyer && (
          <View style={styles.infoBoxClient}>
            <Text style={styles.infoBoxTitle}>📋 {t('your_lawyer_assigned_tasks')}</Text>
            <BulletPoint text={t('you_can_see_when_tasks_complete')} />
            <BulletPoint text={t('lawyer_manages_this_checklist')} />
            <BulletPoint text={t('ask_lawyer_if_questions')} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

interface BulletPointProps {
  text: string;
}

const BulletPoint: React.FC<BulletPointProps> = ({ text }) => (
  <View style={styles.bulletPoint}>
    <Text style={styles.bulletText}>• {text}</Text>
  </View>
);

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
    paddingVertical: 12,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
  },
  progressPercent: {
    fontSize: 12,
    color: '#666',
  },
  clientNotice: {
    backgroundColor: '#E8F4FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  clientNoticeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  clientNoticeText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  addItemSection: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  addItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 10,
  },
  addItemInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  addItemDescription: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  itemsSection: {
    marginBottom: 20,
  },
  itemsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
  },
  itemContainerActive: {
    backgroundColor: '#E8F4FF',
    borderLeftColor: '#007AFF',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxEmpty: {
    width: '100%',
    height: '100%',
  },
  checkboxChecked: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '700',
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  itemLabelCompleted: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  itemCompletedInfo: {
    fontSize: 11,
    color: '#34C759',
    marginTop: 4,
    fontWeight: '500',
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  deleteIcon: {
    fontSize: 18,
    color: '#FF3B30',
    fontWeight: '600',
  },
  dragHandle: {
    paddingHorizontal: 6,
  },
  dragIcon: {
    fontSize: 18,
    color: '#999',
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
  infoBoxClient: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  infoBoxTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
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

export default ChecklistBuilderScreen;
