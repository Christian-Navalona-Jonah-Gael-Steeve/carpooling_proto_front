import axios from "axios";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from "../../../constants/store-keys.constants";
import { storeManager } from "../../utils/store-manager";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// URLs that should be excluded from authentication interceptor
const EXCLUDED_URLS = ["/auth/signin", "/auth/signup", "/auth/refresh"];

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

/**
 * Request interceptor to add authentication token to requests
 * Excludes specific URLs from authentication
 */
api.interceptors.request.use(
  async (config) => {
    // Check if the request URL should be excluded from authentication
    const shouldExclude = EXCLUDED_URLS.some((excludedUrl) =>
      config.url?.includes(excludedUrl)
    );

    // Add authorization header if not excluded
    if (!shouldExclude) {
      try {
        const token = await storeManager.getItem(ACCESS_TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Error retrieving access token:", error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle token refresh on 401 errors
 * Automatically refreshes token and retries the original request
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storeManager.getItem(REFRESH_TOKEN_KEY);

        if (refreshToken) {
          // Attempt to refresh the token
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken }
          );

          const { accessToken, refreshToken: newRefreshToken } =
            refreshResponse.data;

          // Store new tokens securely (platform-specific)
          await storeManager.setItem(ACCESS_TOKEN_KEY, accessToken);
          if (newRefreshToken) {
            await storeManager.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } else {
          // No refresh token available, redirect to login
          await handleLogout();
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        console.error("Token refresh failed:", refreshError);
        await handleLogout();
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Handles user logout by clearing stored tokens
 */
const handleLogout = async () => {
  try {
    await Promise.all([
      storeManager.deleteItem(ACCESS_TOKEN_KEY),
      storeManager.deleteItem(REFRESH_TOKEN_KEY),
    ]);
  } catch (error) {
    console.error("Error during logout:", error);
  }
};
