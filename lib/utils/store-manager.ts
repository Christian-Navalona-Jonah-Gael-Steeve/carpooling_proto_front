import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * StoreManager provides a unified interface for secure storage across platforms
 * - Mobile: Uses SecureStore
 * - Web: Uses AsyncStorage
 */
class StoreManager {
  private isWeb: boolean;

  constructor() {
    this.isWeb = Platform.OS === 'web';
  }

  /**
   * Store a key-value pair
   * @param key
   * @param value
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isWeb) {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`[StoreManager] Error setting item "${key}":`, error);
      throw error;
    }
  }

  /**
   * Retrieve a value by key
   * @param key
   * @returns
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isWeb) {
        return await AsyncStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error(`[StoreManager] Error getting item "${key}":`, error);
      return null;
    }
  }

  /**
   * Delete a key-value pair
   * @param key
   */
  async deleteItem(key: string): Promise<void> {
    try {
      if (this.isWeb) {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`[StoreManager] Error deleting item "${key}":`, error);
      throw error;
    }
  }

  /**
   * Clear all stored items
   */
  async clear(): Promise<void> {
    try {
      if (this.isWeb) {
        await AsyncStorage.clear();
      } else {
        console.warn('[StoreManager] Clear operation on mobile requires manual key deletion');
      }
    } catch (error) {
      console.error('[StoreManager] Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Get all keys stored
   * @returns
   */
  async getAllKeys(): Promise<string[]> {
    try {
      if (this.isWeb) {
        const keys = await AsyncStorage.getAllKeys();
        return [...keys];
      } else {
        console.warn('[StoreManager] getAllKeys is only available on web platform');
        return [];
      }
    } catch (error) {
      console.error('[StoreManager] Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Get multiple items
   * @param keys
   * @returns Array of [key, value] pairs
   */
  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      if (this.isWeb) {
        const results = await AsyncStorage.multiGet(keys);
        return results.map(([key, value]) => [key, value] as [string, string | null]);
      } else {
        const results: [string, string | null][] = [];
        for (const key of keys) {
          const value = await this.getItem(key);
          results.push([key, value]);
        }
        return results;
      }
    } catch (error) {
      console.error('[StoreManager] Error in multiGet:', error);
      return [];
    }
  }

  /**
   * Set multiple items
   * @param keyValuePairs
   */
  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    try {
      if (this.isWeb) {
        await AsyncStorage.multiSet(keyValuePairs);
      } else {
        await Promise.all(
          keyValuePairs.map(([key, value]) => this.setItem(key, value))
        );
      }
    } catch (error) {
      console.error('[StoreManager] Error in multiSet:', error);
      throw error;
    }
  }

  /**
   * Remove multiple items
   * @param keys
   */
  async multiRemove(keys: string[]): Promise<void> {
    try {
      if (this.isWeb) {
        await AsyncStorage.multiRemove(keys);
      } else {
        await Promise.all(keys.map((key) => this.deleteItem(key)));
      }
    } catch (error) {
      console.error('[StoreManager] Error in multiRemove:', error);
      throw error;
    }
  }

  /**
   * Check if running on web platform
   * @returns true if web, false if mobile
   */
  isWebPlatform(): boolean {
    return this.isWeb;
  }
}

export const storeManager = new StoreManager();
