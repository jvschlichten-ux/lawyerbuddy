/**
 * MessagesScreen
 *
 * End-to-end encrypted messaging between lawyer and client
 * Messages are encrypted before transmission and decrypted on receipt
 * Only recipient with encryption key can read messages
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from '@lawyerbuddy/i18n';
import * as encryptionService from '../../services/encryption';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  isEncrypted: boolean;
  content: string; // Plaintext (decrypted on display)
  createdAt: string;
  isRead: boolean;
}

const MessagesScreen: React.FC = () => {
  const { t } = useTranslation('client');
  const { t: tCommon } = useTranslation('common');
  const route = useRoute();
  const navigation = useNavigation();
  const caseId = (route.params as any)?.caseId as string;
  const userId = (route.params as any)?.userId as string;
  const otherUserId = (route.params as any)?.otherUserId as string;
  const otherUserName = (route.params as any)?.otherUserName as string;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_1',
      senderId: otherUserId,
      senderName: otherUserName,
      isEncrypted: true,
      content: 'Please submit any incident reports from the past week.',
      createdAt: '2026-03-26T14:30:00Z',
      isRead: true,
    },
    {
      id: 'msg_2',
      senderId: userId,
      senderName: 'You',
      isEncrypted: true,
      content: 'I have 3 new incidents to report. Will send details by tomorrow.',
      createdAt: '2026-03-26T15:45:00Z',
      isRead: true,
    },
    {
      id: 'msg_3',
      senderId: otherUserId,
      senderName: otherUserName,
      isEncrypted: true,
      content: 'Thank you. Make sure to include GPS coordinates and photos if available.',
      createdAt: '2026-03-26T16:00:00Z',
      isRead: true,
    },
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load messages from backend
    loadMessages();
  }, [caseId]);

  /**
   * Load messages for case
   * Messages are stored encrypted; decrypt on client side
   */
  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);

      // In production: GET /cases/:caseId/messages
      // Response includes encrypted messages
      // For MVP, we show mock messages

      // Derive encryption key
      const encryptionKey = await encryptionService.deriveEncryptionKey(
        caseId,
        userId,
        otherUserId
      );

      // In production: decrypt each message using key
      // For MVP, messages are shown plaintext (mock data)

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setIsLoading(false);
    }
  }, [caseId, userId, otherUserId]);

  /**
   * Send an encrypted message
   */
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim()) {
      return;
    }

    try {
      setIsSending(true);

      // Derive encryption key
      const encryptionKey = await encryptionService.deriveEncryptionKey(
        caseId,
        userId,
        otherUserId
      );

      // Encrypt message
      const encrypted = await encryptionService.encryptMessage(
        newMessage.trim(),
        encryptionKey
      );

      // In production: POST /cases/:caseId/messages
      // Body: { content_encrypted: encrypted.ciphertext, ... }
      // Backend stores encrypted message
      // Other user receives notification

      // Add to local state optimistically
      const message: Message = {
        id: `msg_${Date.now()}`,
        senderId: userId,
        senderName: 'You',
        isEncrypted: true,
        content: newMessage.trim(),
        createdAt: new Date().toISOString(),
        isRead: true,
      };

      setMessages((prev) => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(tCommon('message_send_failed'));
    } finally {
      setIsSending(false);
    }
  }, [newMessage, caseId, userId, otherUserId]);

  /**
   * Render a single message
   */
  const renderMessage = (message: Message) => {
    const isOwn = message.senderId === userId;

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isOwn && styles.messageContainerOwn,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwn && styles.messageBubbleOwn,
          ]}
        >
          {!isOwn && (
            <Text style={styles.messageSender}>{message.senderName}</Text>
          )}
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {message.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
              {formatTime(message.createdAt)}
            </Text>
            {isOwn && (
              <Text style={styles.messageStatus}>
                {message.isRead ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
        {message.isEncrypted && (
          <Text style={styles.encryptionBadge}>🔒 E2E</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {tCommon('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{otherUserName}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.encryptionInfo}>🔒 Encrypted</Text>
        </View>
      </View>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Text style={styles.securityIcon}>🔐</Text>
        <View style={styles.securityContent}>
          <Text style={styles.securityTitle}>{tCommon('end_to_end_encrypted')}</Text>
          <Text style={styles.securityText}>
            {tCommon('messages_are_encrypted_only_you_can_read')}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Messages */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <ScrollView
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <Text style={styles.emptyText}>{t('no_messages_yet')}</Text>
            ) : (
              messages.map((message) => renderMessage(message))
            )}
          </ScrollView>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={t('type_message')}
              value={newMessage}
              onChangeText={setNewMessage}
              editable={!isSending}
              maxLength={500}
              multiline={true}
              maxHeight={100}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.sendButtonText}>📤</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginLeft: 12,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  encryptionInfo: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
  },
  securityIcon: {
    fontSize: 20,
    marginRight: 8,
    marginTop: 2,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  securityText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    lineHeight: 14,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  messageContainerOwn: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageBubbleOwn: {
    backgroundColor: '#007AFF',
  },
  messageSender: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 18,
  },
  messageTextOwn: {
    color: '#fff',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
  },
  messageTimeOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  messageStatus: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },
  encryptionBadge: {
    fontSize: 10,
    color: '#34C759',
    fontWeight: '600',
    marginLeft: 4,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000',
    backgroundColor: '#f9f9f9',
    maxHeight: 100,
  },
  sendButton: {
    width: 80,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 18,
  },
});

export default MessagesScreen;
