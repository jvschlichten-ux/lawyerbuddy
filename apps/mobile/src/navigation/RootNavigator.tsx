/**
 * Root Navigator
 *
 * Top-level navigation stack that handles:
 * - Authentication state (logged out → Auth stack)
 * - Role-based routing (logged in → Client or Lawyer portal)
 * - Deep link handling (invite tokens route to InviteAcceptanceScreen)
 *
 * User flow:
 * 1. User opens app
 * 2. Check authentication state (JWT in SecureStore)
 * 3. If logged out → show Auth stack (WelcomeScreen, LoginScreen, etc.)
 * 4. If logged in, check user role:
 *    - role = 'client' → ClientPortalStack
 *    - role = 'lawyer' → LawyerPortalStack
 * 5. If user taps invite link → InviteAcceptanceScreen (no auth required)
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { linking, parseInviteToken } from './linking';

// Auth screens (to be created in Phase 9)
// import WelcomeScreen from '../screens/auth/WelcomeScreen';
// import LoginScreen from '../screens/auth/LoginScreen';
// import LawyerSignupScreen from '../screens/auth/LawyerSignupScreen';
// import InviteAcceptanceScreen from '../screens/auth/InviteAcceptanceScreen';

// Client portal screens (already exist)
import LogEventScreen from '../screens/client/LogEventScreen';

// Lawyer portal screens (already exist)
import LawyerDashboardScreen from '../screens/lawyer/LawyerDashboardScreen';
import ChecklistBuilderScreen from '../screens/lawyer/ChecklistBuilderScreen';
import ExportScreen from '../screens/lawyer/ExportScreen';

// Shared screens
import MessagesScreen from '../screens/shared/MessagesScreen';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const ClientPortalStack = createNativeStackNavigator();
const LawyerPortalStack = createNativeStackNavigator();

interface AuthState {
  isLoading: boolean;
  isSignOut: boolean;
  userToken: string | null;
  userRole: 'lawyer' | 'client' | null;
}

interface LinkingState {
  isInviteLink: boolean;
  inviteToken: string | null;
}

/**
 * AUTH STACK — Unauthenticated routes
 * Shown when user is logged out or has never logged in
 */
function AuthStackScreen() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      {/* Phase 9: Create these auth screens */}
      {/* <AuthStack.Screen
        name="WelcomeScreen"
        component={WelcomeScreen}
        options={{ animationEnabled: false }}
      />
      <AuthStack.Screen
        name="LoginScreen"
        component={LoginScreen}
      />
      <AuthStack.Screen
        name="LawyerSignupScreen"
        component={LawyerSignupScreen}
      />
      <AuthStack.Screen
        name="ForgotPasswordScreen"
        component={ForgotPasswordScreen}
      />
      <AuthStack.Screen
        name="ResetPasswordScreen"
        component={ResetPasswordScreen}
      />

      {/* Invite acceptance — NO AUTH REQUIRED */}
      {/* This screen is accessible to unauthenticated users clicking invite links */}
      {/* <AuthStack.Screen
        name="InviteAcceptanceScreen"
        component={InviteAcceptanceScreen}
        options={{
          title: 'Accept Case Invite',
          headerBackVisible: true,
        }}
      /> */}
    </AuthStack.Navigator>
  );
}

/**
 * CLIENT PORTAL STACK — Client-specific routes
 * Shown when user.role = 'client' and authenticated
 */
function ClientPortalStackScreen() {
  return (
    <ClientPortalStack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackVisible: true,
      }}
    >
      {/* Phase 5: ClientDashboardScreen (to be created) */}
      {/* <ClientPortalStack.Screen
        name="ClientDashboardScreen"
        component={ClientDashboardScreen}
        options={{ title: 'My Cases' }}
      /> */}

      {/* Phase 5: LogEventScreen (already exists) */}
      <ClientPortalStack.Screen
        name="LogEventScreen"
        component={LogEventScreen}
        options={{ title: 'Log Incident' }}
      />

      {/* Phase 5: Event details screens (to be created) */}
      {/* <ClientPortalStack.Screen
        name="CaseDetailsScreen"
        component={CaseDetailsScreen}
        options={({ route }) => ({ title: route.params?.caseTitle })}
      />
      <ClientPortalStack.Screen
        name="EventDetailsScreen"
        component={EventDetailsScreen}
      /> */}

      {/* Phase 7: Shared messaging screen */}
      <ClientPortalStack.Screen
        name="MessagesScreen"
        component={MessagesScreen}
        options={{ title: 'Encrypted Messages' }}
      />
    </ClientPortalStack.Navigator>
  );
}

/**
 * LAWYER PORTAL STACK — Lawyer-specific routes
 * Shown when user.role = 'lawyer' and authenticated
 */
function LawyerPortalStackScreen() {
  return (
    <LawyerPortalStack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackVisible: true,
      }}
    >
      {/* Phase 6: Lawyer dashboard (case management, pending events) */}
      <LawyerPortalStack.Screen
        name="LawyerDashboardScreen"
        component={LawyerDashboardScreen}
        options={{ title: 'My Cases' }}
      />

      {/* Phase 6: Case-specific screens */}
      {/* <LawyerPortalStack.Screen
        name="CaseManagementScreen"
        component={CaseManagementScreen}
        options={({ route }) => ({ title: route.params?.caseTitle })}
      />
      <LawyerPortalStack.Screen
        name="EventReviewScreen"
        component={EventReviewScreen}
        options={{ title: 'Review Event' }}
      /> */}

      {/* Phase 6: Checklist builder (permission-enforced UI) */}
      <LawyerPortalStack.Screen
        name="ChecklistBuilderScreen"
        component={ChecklistBuilderScreen}
        options={{ title: 'Case Checklist' }}
      />

      {/* Phase 6: Export screen (excludes attorney notes) */}
      <LawyerPortalStack.Screen
        name="ExportScreen"
        component={ExportScreen}
        options={{ title: 'Export Case' }}
      />

      {/* Phase 7: Shared messaging screen */}
      <LawyerPortalStack.Screen
        name="MessagesScreen"
        component={MessagesScreen}
        options={{ title: 'Encrypted Messages' }}
      />
    </LawyerPortalStack.Navigator>
  );
}

/**
 * ROOT NAVIGATOR — Main app orchestrator
 *
 * Conditional rendering based on auth state:
 * 1. isLoading → Show splash screen
 * 2. !userToken → Show auth stack
 * 3. userToken + role='client' → Show client portal
 * 4. userToken + role='lawyer' → Show lawyer portal
 */
export function RootNavigator() {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isSignOut: false,
    userToken: null,
    userRole: null,
  });

  const [linkingState, setLinkingState] = useState<LinkingState>({
    isInviteLink: false,
    inviteToken: null,
  });

  // Initialize auth state on app load
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // Check if JWT token exists in SecureStore
        const token = await SecureStore.getItemAsync('userToken');
        const role = await SecureStore.getItemAsync('userRole') as ('lawyer' | 'client' | null);

        if (token && role) {
          // User is authenticated
          setAuthState({
            isLoading: false,
            isSignOut: false,
            userToken: token,
            userRole: role,
          });
        } else {
          // User is not authenticated
          setAuthState({
            isLoading: false,
            isSignOut: true,
            userToken: null,
            userRole: null,
          });
        }
      } catch (error) {
        console.error('Error bootstrapping auth:', error);
        // If anything fails, treat user as logged out
        setAuthState({
          isLoading: false,
          isSignOut: true,
          userToken: null,
          userRole: null,
        });
      }
    };

    bootstrapAsync();
  }, []);

  // Handle deep linking for invite tokens
  const handleDeepLink = async (url: string) => {
    const token = await parseInviteToken(url);
    if (token) {
      setLinkingState({
        isInviteLink: true,
        inviteToken: token,
      });
      // Route to InviteAcceptanceScreen with token
      // (handled by navigation linking config)
    }
  };

  return (
    <NavigationContainer
      linking={linking}
      fallback={<LoadingScreen />}
      onReady={() => {
        // Handle deep link if app was launched from URL
        const url = linking.prefixes[0];
        if (url) {
          handleDeepLink(url);
        }
      }}
    >
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
        }}
      >
        {authState.isLoading ? (
          // Loading state — show splash while checking auth
          <RootStack.Screen
            name="SplashScreen"
            component={LoadingScreen}
            options={{ animationEnabled: false }}
          />
        ) : authState.userToken == null ? (
          // Not authenticated — show auth stack
          <RootStack.Group
            screenOptions={{
              headerShown: false,
              animationEnabled: true,
              presentation: 'modal',
            }}
          >
            <RootStack.Screen
              name="AuthStack"
              component={AuthStackScreen}
              options={{ animationEnabled: false }}
            />
          </RootStack.Group>
        ) : authState.userRole === 'client' ? (
          // Client authenticated — show client portal
          <RootStack.Screen
            name="ClientPortal"
            component={ClientPortalStackScreen}
            options={{
              animationEnabled: false,
            }}
          />
        ) : authState.userRole === 'lawyer' ? (
          // Lawyer authenticated — show lawyer portal
          <RootStack.Screen
            name="LawyerPortal"
            component={LawyerPortalStackScreen}
            options={{
              animationEnabled: false,
            }}
          />
        ) : null}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

/**
 * Loading Screen — shown during auth state initialization
 * Also used as splash screen
 */
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#0066CC" />
    </View>
  );
}
