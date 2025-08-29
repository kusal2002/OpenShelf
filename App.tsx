/**
 * OpenShelf University Library App
 * Main App component with navigation and authentication
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, Alert, ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Services and utilities
import { supabaseService, onAuthStateChange } from './src/services/supabase';
import { NetworkUtils, ErrorHandler, THEME_COLORS } from './src/utils';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import UploadScreen from './src/screens/UploadScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Types
import { AuthState, AuthUser, RootStackParamList, MainTabParamList } from './src/types';

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Auth Stack Navigator
function AuthStack() {
  return (
    <Stack.Navigator 
      id="AuthStack"
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: THEME_COLORS.primary,
        },
        headerTintColor: THEME_COLORS.background,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ title: 'Login' }}
      />
      <Stack.Screen 
        name="SignUp" 
        component={SignUpScreen} 
        options={{ title: 'Create Account' }}
      />
    </Stack.Navigator>
  );
}

// Main App Tabs Navigator  
function MainTabs() {
  return (
    <Tab.Navigator
      id="MainTabs"
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: THEME_COLORS.primary,
        },
        headerTintColor: THEME_COLORS.background,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: THEME_COLORS.background,
          borderTopColor: THEME_COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: THEME_COLORS.primary,
        tabBarInactiveTintColor: THEME_COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Discover',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Upload" 
        component={UploadScreen} 
        options={{ 
          title: 'Upload',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>⬆️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          title: 'My Library',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📚</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Loading Screen Component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={THEME_COLORS.primary} />
      <Text style={styles.loadingText}>Loading OpenShelf...</Text>
    </View>
  );
}

// Error Boundary Component (simple version)
function ErrorFallback({ error }: { error: Error }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
      <Text style={styles.errorMessage}>
        {error.message || 'An unexpected error occurred'}
      </Text>
      <Text style={styles.errorSubtext}>Please restart the app</Text>
    </View>
  );
}

// Main App Component
export default function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
  });

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Monitor network connectivity
    const networkUnsubscribe = NetworkUtils.subscribeToNetworkStatus(setIsOnline);

    // Initialize auth state
    initializeAuth();

    // Listen for auth state changes
    const authListener = onAuthStateChange((event: any, session: any) => {
      console.log('Auth event:', event, session?.user?.email);
      
      setAuthState((prev: AuthState) => ({
        ...prev,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || '',
          university_id: session.user.user_metadata?.university_id || '',
          avatar_url: session.user.user_metadata?.avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } : null,
        session: session,
        loading: false,
        isAuthenticated: !!session?.user,
      }));

      // Handle specific auth events
      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in:', session?.user?.email);
          break;
        case 'SIGNED_OUT':
          console.log('User signed out');
          break;
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed');
          break;
        default:
          break;
      }
    });

    return () => {
      networkUnsubscribe();
      if ('data' in authListener) {
        authListener.data.subscription.unsubscribe();
      } else {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('Initializing auth...');
      console.log('SupabaseService available:', !!supabaseService);
      
      // Check if supabaseService has the required methods
      if (typeof supabaseService.getCurrentSession !== 'function') {
        console.error('getCurrentSession method not available');
        setAuthState((prev: AuthState) => ({
          ...prev,
          loading: false,
          isAuthenticated: false,
        }));
        return;
      }

      const { session, error } = await supabaseService.getCurrentSession();
      
      console.log('Session result:', { hasSession: !!session, error });
      
      if (error) {
        console.error('Session error:', error);
      }

      setAuthState((prev: AuthState) => ({
        ...prev,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || '',
          university_id: session.user.user_metadata?.university_id || '',
          avatar_url: session.user.user_metadata?.avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } : null,
        session: session,
        loading: false,
        isAuthenticated: !!session?.user,
      }));
    } catch (error) {
      console.error('Initialize auth error details:', error);
      ErrorHandler.handle(error, 'Initialize auth error');
      setAuthState((prev: AuthState) => ({
        ...prev,
        loading: false,
        isAuthenticated: false,
      }));
    }
  };

  // Show offline warning periodically when offline
  useEffect(() => {
    if (!isOnline) {
      const offlineAlert = setTimeout(() => {
        Alert.alert(
          'You\'re Offline',
          'Some features may be limited. Connect to the internet for the full experience.',
          [{ text: 'OK' }]
        );
      }, 3000);

      return () => clearTimeout(offlineAlert);
    }
  }, [isOnline]);

  // Show loading screen while initializing
  if (authState.loading) {
    return (
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={THEME_COLORS.background}
        />
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={THEME_COLORS.background}
      />
      <NavigationContainer>
        {authState.isAuthenticated ? (
          <Stack.Navigator id="MainStack" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={MainTabs} />
            {/* 
            TODO: Add additional screens here
            <Stack.Screen name="MaterialViewer" component={MaterialViewerScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            */}
          </Stack.Navigator>
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// Styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.background,
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: THEME_COLORS.text,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.background,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME_COLORS.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: THEME_COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
  },
});
