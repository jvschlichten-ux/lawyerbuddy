/**
 * useChecklistRealtime Hook
 *
 * Supabase Realtime subscription for checklist items
 * Subscribes to INSERT, UPDATE, DELETE events on checklist_items table
 * Re-fetches checklist when changes occur
 *
 * Usage:
 * const { checklist, isSubscribed, error } = useChecklistRealtime(caseId);
 */

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  isComplete: boolean;
  completedAt?: string;
  completedBy?: string;
  orderIndex: number;
}

interface UseChecklistRealtimeResult {
  checklist: ChecklistItem[];
  isSubscribed: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook signature for Supabase Realtime subscription
 *
 * @param caseId - Case UUID to subscribe to checklist changes
 * @param userRole - User role ('lawyer' | 'client') for filtering updates
 * @returns Object with checklist state, subscription status, and refetch function
 */
export function useChecklistRealtime(
  caseId: string,
  userRole: 'lawyer' | 'client'
): UseChecklistRealtimeResult {
  const { i18n } = useTranslation();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch checklist items from backend
  const fetchChecklist = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/cases/${caseId}/checklist`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch checklist: ${response.statusText}`);
      }

      const data = await response.json();
      setChecklist(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error fetching checklist:', err);
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  // Subscribe to Supabase Realtime changes
  useEffect(() => {
    let subscription: any = null;

    const setupSubscription = async () => {
      try {
        // Import Supabase client
        const { supabase } = await import('../services/supabase');

        // Subscribe to checklist_items changes for this case
        subscription = supabase
          .channel(`checklist:${caseId}`)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'checklist_items',
              filter: `case_id=eq.${caseId}`,
            },
            (payload: any) => {
              console.log('Checklist update received:', payload);

              // Handle different event types
              switch (payload.eventType) {
                case 'INSERT':
                  // Item added → Add to local state
                  setChecklist((prev) => [...prev, payload.new]);
                  break;

                case 'UPDATE':
                  // Item updated → Replace in local state
                  setChecklist((prev) =>
                    prev.map((item) =>
                      item.id === payload.new.id ? payload.new : item
                    )
                  );
                  break;

                case 'DELETE':
                  // Item deleted → Remove from local state
                  setChecklist((prev) =>
                    prev.filter((item) => item.id !== payload.old.id)
                  );
                  break;
              }
            }
          )
          .subscribe((status: string) => {
            setIsSubscribed(status === 'SUBSCRIBED');
            if (status === 'SUBSCRIBED') {
              console.log(`✅ Subscribed to checklist changes for case ${caseId}`);
            }
          });

        // Initial fetch
        await fetchChecklist();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Subscription setup failed'));
        console.error('Error setting up Realtime subscription:', err);
      }
    };

    setupSubscription();

    // Cleanup: Unsubscribe when component unmounts
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [caseId, fetchChecklist]);

  return {
    checklist,
    isSubscribed,
    isLoading,
    error,
    refetch: fetchChecklist,
  };
}

/**
 * Helper function to get auth token from SecureStore
 * (Placeholder - implement based on your auth setup)
 */
async function getAuthToken(): Promise<string> {
  try {
    const SecureStore = await import('expo-secure-store');
    const token = await SecureStore.default.getItemAsync('userToken');
    return token || '';
  } catch {
    return '';
  }
}

/**
 * Alternative hook for real-time event updates
 * Subscribes to events for a case
 */
export function useEventsRealtime(caseId: string) {
  const [events, setEvents] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    let subscription: any = null;

    const setupSubscription = async () => {
      try {
        const { supabase } = await import('../services/supabase');

        subscription = supabase
          .channel(`events:${caseId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT', // Only listen for new events
              schema: 'public',
              table: 'events',
              filter: `case_id=eq.${caseId}`,
            },
            (payload: any) => {
              console.log('New event received:', payload.new);
              setEvents((prev) => [payload.new, ...prev]);
            }
          )
          .subscribe((status: string) => {
            setIsSubscribed(status === 'SUBSCRIBED');
          });
      } catch (err) {
        console.error('Error setting up events Realtime:', err);
      }
    };

    setupSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [caseId]);

  return { events, isSubscribed };
}

/**
 * Alternative hook for real-time message updates
 * Subscribes to messages for a case
 */
export function useMessagesRealtime(caseId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    let subscription: any = null;

    const setupSubscription = async () => {
      try {
        const { supabase } = await import('../services/supabase');

        subscription = supabase
          .channel(`messages:${caseId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT', // Only listen for new messages
              schema: 'public',
              table: 'messages',
              filter: `case_id=eq.${caseId}`,
            },
            (payload: any) => {
              console.log('New message received:', payload.new);
              setMessages((prev) => [payload.new, ...prev]);
            }
          )
          .subscribe((status: string) => {
            setIsSubscribed(status === 'SUBSCRIBED');
          });
      } catch (err) {
        console.error('Error setting up messages Realtime:', err);
      }
    };

    setupSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [caseId]);

  return { messages, isSubscribed };
}
