import React, { ReactNode, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/auth.context';
import { ThemedText } from '../ThemedText';
import { useRouter } from 'expo-router';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Protected route component that checks authentication status
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  /**
   * Redirect to auth screen if not authenticated
   */
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading indicator while checking authentication
  if (isLoading) {
    return fallback || (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <ThemedText style={styles.loadingText}>Checking authentication...</ThemedText>
      </View>
    );
  }

  // Show nothing while redirecting to auth
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
};


const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
});