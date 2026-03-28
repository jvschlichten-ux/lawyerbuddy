/**
 * Location Service
 *
 * Handles GPS capture and location permission management
 * Works on both iOS and Android via React Native
 */

import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: string;
  address?: string;
}

/**
 * Request location permission
 * Returns true if permission granted, false otherwise
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to request location permission:', error);
    return false;
  }
}

/**
 * Get current device location (GPS coordinates)
 * High accuracy with timeout
 *
 * @returns LocationData with GPS coordinates or error
 */
export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    // Check permission
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const granted = await requestLocationPermission();
      if (!granted) {
        throw new Error('Location permission denied');
      }
    }

    // Get current location with high accuracy
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High, // ~5-10 meters
      timeoutMs: 10000, // 10-second timeout
      mayShowUserSettingsDialog: true,
    });

    const gpsData: LocationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined,
      altitude: location.coords.altitude || undefined,
      altitudeAccuracy: location.coords.altitudeAccuracy || undefined,
      heading: location.coords.heading || undefined,
      speed: location.coords.speed || undefined,
      timestamp: new Date().toISOString(),
    };

    // Try to get address (reverse geocoding)
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        const parts = [
          address.street,
          address.city,
          address.region,
          address.country,
        ].filter(Boolean);
        gpsData.address = parts.join(', ');
      }
    } catch (e) {
      // Reverse geocoding failed, continue without address
      console.warn('Reverse geocoding failed:', e);
    }

    return gpsData;
  } catch (error) {
    console.error('Location capture failed:', error);
    throw error;
  }
}

/**
 * Start watching location changes (for real-time updates)
 * Useful for long-running processes
 *
 * @param callback - Called when location changes
 * @returns Subscription object with remove() method
 */
export async function watchLocation(
  callback: (location: LocationData) => void
): Promise<Location.LocationSubscription | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const subscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Or every 10 meters
      },
      (location) => {
        const gpsData: LocationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
          altitude: location.coords.altitude || undefined,
          timestamp: new Date().toISOString(),
        };
        callback(gpsData);
      }
    );

    return subscription;
  } catch (error) {
    console.error('Location watch failed:', error);
    return null;
  }
}

/**
 * Check if location services are enabled on device
 */
export async function isLocationServiceEnabled(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (error) {
    console.error('Failed to check location services:', error);
    return false;
  }
}

/**
 * Format coordinates for display
 * @returns String like "40.7128°N, 74.0060°W"
 */
export function formatCoordinates(
  latitude: number,
  longitude: number
): string {
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lonDir = longitude >= 0 ? 'E' : 'W';

  return `${Math.abs(latitude).toFixed(4)}°${latDir}, ${Math.abs(longitude).toFixed(4)}°${lonDir}`;
}

/**
 * Calculate distance between two coordinates (in meters)
 * Uses Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
