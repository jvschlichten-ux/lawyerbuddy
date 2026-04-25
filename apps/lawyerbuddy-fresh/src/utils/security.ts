import AsyncStorage from '@react-native-async-storage/async-storage';

// Lazy load SecureStore - falls back to AsyncStorage if not available (dev client without build)
let SecureStore: any = null;
try {
  SecureStore = require('expo-secure-store');
} catch (e) {
  console.log('⚠️ SecureStore not available, falling back to AsyncStorage');
}

// ============ SECURE STORAGE HELPERS ============

const setSecureItem = async (key: string, value: string) => {
  try {
    if (SecureStore) {
      await SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } catch (err) {
    console.error('❌ Error saving secure item:', err);
  }
};

const getSecureItem = async (key: string): Promise<string | null> => {
  try {
    if (SecureStore) {
      return await SecureStore.getItemAsync(key);
    }
    return await AsyncStorage.getItem(key);
  } catch (err) {
    console.error('❌ Error retrieving secure item:', err);
    return null;
  }
};

const deleteSecureItem = async (key: string) => {
  try {
    if (SecureStore) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (err) {
    console.error('❌ Error deleting secure item:', err);
  }
};

// ============ TOKEN MANAGEMENT ============

export const saveTokens = async (userToken: string, refreshToken?: string) => {
  await setSecureItem('userToken', userToken);
  if (refreshToken) {
    await setSecureItem('refreshToken', refreshToken);
  }
};

export const getToken = async (): Promise<string | null> => {
  return await getSecureItem('userToken');
};

export const getRefreshToken = async (): Promise<string | null> => {
  return await getSecureItem('refreshToken');
};

export const clearTokens = async () => {
  await deleteSecureItem('userToken');
  await deleteSecureItem('refreshToken');
};

// ============ TOKEN EXPIRY & REFRESH ============

export const decodeJWT = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
};

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  return Date.now() >= decoded.exp * 1000;
};

export const shouldRefreshToken = (token: string | null): boolean => {
  if (!token) return false;
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return false;
  // Refresh if expires in less than 5 minutes
  const expiresIn = decoded.exp * 1000 - Date.now();
  return expiresIn < 5 * 60 * 1000;
};

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    const response = await fetch('https://lawyerbuddy-production.up.railway.app/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();
    if (data.token) {
      await SecureStore.setItemAsync('userToken', data.token);
      return data.token;
    }
    return null;
  } catch (err) {
    console.error('❌ Error refreshing token:', err);
    return null;
  }
};

// ============ INPUT VALIDATION & SANITIZATION ============

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length < 254;
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, '') // Remove dangerous characters
    .trim();
};

export const validateInput = (input: string, maxLength: number): boolean => {
  if (!input || input.trim().length === 0) return false;
  if (input.length > maxLength) return false;
  return true;
};

export const sanitizeAndValidate = (input: string, maxLength: number): { valid: boolean; sanitized: string } => {
  const sanitized = sanitizeInput(input);
  const valid = validateInput(sanitized, maxLength);
  return { valid, sanitized };
};

// Input validation constraints
export const INPUT_LIMITS = {
  CASE_TITLE: 200,
  MESSAGE: 1000,
  CHECKLIST_ITEM: 500,
  EMAIL: 254,
  PASSWORD: 128,
};

// ============ SESSION TIMEOUT ============

export const saveLastActivityTime = async () => {
  try {
    const now = Date.now().toString();
    await AsyncStorage.setItem('lastActivityTime', now);
  } catch (err) {
    console.error('❌ Error saving activity time:', err);
  }
};

export const getLastActivityTime = async (): Promise<number | null> => {
  try {
    const lastActivity = await AsyncStorage.getItem('lastActivityTime');
    return lastActivity ? parseInt(lastActivity, 10) : null;
  } catch (err) {
    console.error('❌ Error retrieving activity time:', err);
    return null;
  }
};

export const isSessionExpired = async (inactivityMinutes: number = 30): Promise<boolean> => {
  try {
    const lastActivity = await getLastActivityTime();
    if (!lastActivity) return true;
    const elapsedMs = Date.now() - lastActivity;
    const elapsedMinutes = elapsedMs / (1000 * 60);
    return elapsedMinutes > inactivityMinutes;
  } catch (err) {
    console.error('❌ Error checking session expiry:', err);
    return true;
  }
};

export const checkTokenExpiry = async (): Promise<boolean> => {
  try {
    const token = await getToken();
    if (isTokenExpired(token)) {
      await clearTokens();
      return false;
    }
    if (shouldRefreshToken(token)) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        await clearTokens();
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error('❌ Error checking token expiry:', err);
    return false;
  }
};
