/**
 * Deep Link Configuration
 *
 * Handles URL routing for deep links from emails, SMS, and direct navigation
 * Supports invite token links that route to InviteAcceptanceScreen
 */

import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

export const linking = {
  prefixes: [prefix, 'lawyerbuddy://', 'lawyerbuddy://'],
  config: {
    screens: {
      // Auth stack
      WelcomeScreen: '',
      LoginScreen: 'login',
      LawyerSignupScreen: 'lawyer-signup',
      ForgotPasswordScreen: 'forgot-password',
      ResetPasswordScreen: 'reset-password',

      // Invite flow (deep link target)
      // Deep link pattern: lawyerbuddy://invite/ABC123DEF456
      InviteAcceptanceScreen: 'invite/:token',

      // Client portal
      ClientPortalStack: {
        screens: {
          ClientDashboardScreen: 'client/dashboard',
          LogEventScreen: 'client/log-event',
          LogEventStep1: 'client/log-event/step/1',
          LogEventStep2: 'client/log-event/step/2',
          LogEventStep3: 'client/log-event/step/3',
          LogEventStep4: 'client/log-event/step/4',
          LogEventStep5: 'client/log-event/step/5',
          CaseDetailsScreen: 'client/case/:caseId',
          EventDetailsScreen: 'client/case/:caseId/event/:eventId',
          MessagesScreen: 'client/case/:caseId/messages',
        },
      },

      // Lawyer portal
      LawyerPortalStack: {
        screens: {
          LawyerDashboardScreen: 'lawyer/dashboard',
          CaseManagementScreen: 'lawyer/case/:caseId',
          EventReviewScreen: 'lawyer/case/:caseId/event/:eventId',
          ChecklistBuilderScreen: 'lawyer/case/:caseId/checklist',
          ExportScreen: 'lawyer/case/:caseId/export',
          MessagesScreen: 'lawyer/case/:caseId/messages',
        },
      },

      // Shared screens
      MessagesScreen: 'messages/:caseId',
      ProfileScreen: 'profile',
      SettingsScreen: 'settings',
    },
  },
};

/**
 * Parse invite token from URL
 * Handles both deep link formats:
 * - lawyerbuddy://invite/ABC123DEF456
 * - https://lawyerbuddy.app/invite/ABC123DEF456
 */
export async function parseInviteToken(url: string): Promise<string | null> {
  // Extract token from URL
  const match = url.match(/invite\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Generate deep link URL for invite token
 * Returns: lawyerbuddy://invite/:token
 */
export function generateInviteDeepLink(token: string): string {
  return `lawyerbuddy://invite/${token}`;
}

/**
 * Generate web-compatible invite link
 * Returns: https://lawyerbuddy.app/invite/:token
 */
export function generateInviteWebLink(token: string): string {
  const baseUrl = process.env.FRONTEND_URL || 'https://lawyerbuddy.app';
  return `${baseUrl}/invite/${token}`;
}
