import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from "../constants/store-keys.constants";
import { AuthServive } from "../lib/api/auth.service";
import { IUser } from "../lib/types/user.types";
import { storeManager } from "../lib/utils/store-manager";

/**
 * Authentication context interface
 */
interface AuthContextType {
  user: IUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (tokens: {
    accessToken: string;
    refreshToken: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

/**
 * Auth context props interface
 */
interface AuthProviderProps {
  children: ReactNode;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider component
 * Manages user authentication state
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Check if user is authenticated on app start
   */
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const token = await storeManager.getItem(ACCESS_TOKEN_KEY);

      if (token) {
        // Token exists, verify it by fetching user data
        try {
          const userData = await AuthServive.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear it
          console.error("Invalid token, clearing storage:", error);
          await logout();
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login user and store tokens
   * @param accessToken - JWT access token
   * @param refreshToken - JWT refresh token
   */
  const login = async ({
    accessToken,
    refreshToken,
  }: {
    accessToken: string;
    refreshToken: string;
  }) => {
    try {
      await Promise.all([
        storeManager.setItem(ACCESS_TOKEN_KEY, accessToken),
        storeManager.setItem(REFRESH_TOKEN_KEY, refreshToken),
      ]);

      // Fetch user data
      const userData = await AuthServive.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  /**
   * Logout user and clear all stored data
   */
  const logout = async () => {
    try {
      await Promise.all([
        storeManager.deleteItem(ACCESS_TOKEN_KEY),
        storeManager.deleteItem(REFRESH_TOKEN_KEY),
      ]);

      // Reset state
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use authentication context
 * @returns AuthContextType
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
