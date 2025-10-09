/**
 * Enhanced Login Screen Component
 * Modern UI for user authentication with improved UX
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { supabaseService, supabase } from '../services/supabase';
import { 
  ValidationUtils, 
  UIUtils, 
  UIComponents, 
  ErrorHandler, 
  THEME_COLORS, 
  UI_CONSTANTS 
} from '../utils';
import { RootStackParamList, LoginCredentials, FormErrors } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen = ({ navigation }: Props) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Configure Google Sign-In
  useEffect(() => {
    console.log('Configuring Google Sign-In with Client ID:', process.env.GOOGLE_WEB_CLIENT_ID);
    GoogleSignin.configure({
      webClientId: process.env.GOOGLE_WEB_CLIENT_ID || '577584943883-j546dgee2caaasks0bkiiicb2ss4p4gj.apps.googleusercontent.com',
      offlineAccess: false, // Set to false for mobile apps
      forceCodeForRefreshToken: true,
      scopes: ['profile', 'email'],
    });
  }, []);

  const validateForm = (): boolean => {
    const formErrors = ValidationUtils.validateForm(
      credentials,
      {
        email: (email: string) => {
          if (!email) {
            return [{ field: 'email', message: 'Email is required' }];
          }
          if (!ValidationUtils.isValidEmail(email)) {
            return [{ field: 'email', message: 'Please enter a valid university email' }];
          }
          return [];
        },
        password: (password: string) => {
          if (!password) {
            return [{ field: 'password', message: 'Password is required' }];
          }
          if (password.length < 6) {
            return [{ field: 'password', message: 'Password must be at least 6 characters' }];
          }
          return [];
        },
      }
    );

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      const response = await supabaseService.signIn(credentials);
      
      if (response.success) {
        // Navigate to main app
        UIUtils.showAlert(
          '✅ Welcome Back!', 
          `Hello ${response.data?.email}! You're now signed in.`
        );
        // Navigation will be handled by auth state change
      } else {
        UIUtils.showAlert(
          'Sign In Failed', 
          response.error || 'Unable to sign in. Please check your credentials.'
        );
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Login error');
      UIUtils.showAlert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);

      // Check if Google Play Services is available
      const hasPlayServices = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      if (!hasPlayServices) {
        UIUtils.showAlert('Google Play Services', 'Google Play Services is not available or needs to be updated.');
        return;
      }

      // Sign in with Google first
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In successful:', userInfo);

      // Get the ID token
      const tokens = await GoogleSignin.getTokens();
      console.log('Got tokens:', tokens);
      
      if (tokens.idToken) {
        console.log('Attempting Supabase sign-in with token...');
        // Sign in with Supabase using the Google ID token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: tokens.idToken,
        });

        if (error) {
          console.error('Supabase sign-in error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          UIUtils.showAlert('Google Sign In Failed', `Supabase error: ${error.message}`);
          return;
        }

        if (data.user) {
          UIUtils.showAlert(
            '✅ Welcome!',
            `Hello ${data.user.email}! You're now signed in with Google.`
          );
          // Navigation will be handled by auth state change
        }
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      
      // Provide specific error handling
      if (error.code === 'DEVELOPER_ERROR') {
        UIUtils.showAlert(
          'Configuration Error', 
          'Google OAuth is not properly configured. Please check the setup guide in GOOGLE_OAUTH_SETUP.md'
        );
      } else if (error.code === 'SIGN_IN_CANCELLED') {
        // User cancelled the sign-in flow
        console.log('User cancelled Google Sign-In');
      } else {
        ErrorHandler.handle(error, 'Google sign-in error');
        UIUtils.showAlert('Error', `Google sign-in failed: ${error.message || 'Please try again.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    UIUtils.showAlert(
      '🔐 Reset Password',
      'Password reset functionality will be available in a future update. Please contact support for assistance.'
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.logo}>📚</Text>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>
        Sign in to access your university library and study materials
      </Text>
    </View>
  );

  const renderForm = () => (
    <View style={styles.formContainer}>
      {/* Email Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <View style={[styles.inputContainer, errors.email && styles.inputError]}>
          <Text style={styles.inputIcon}>📧</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your university email"
            placeholderTextColor={THEME_COLORS.textTertiary}
            value={credentials.email}
            onChangeText={(text) => {
              setCredentials({ ...credentials, email: text.toLowerCase().trim() });
              if (errors.email) {
                const newErrors = { ...errors };
                delete newErrors.email;
                setErrors(newErrors);
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>
        {errors.email && (
          <Text style={styles.errorText}>{errors.email}</Text>
        )}
      </View>

      {/* Password Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={[styles.inputContainer, errors.password && styles.inputError]}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your password"
            placeholderTextColor={THEME_COLORS.textTertiary}
            value={credentials.password}
            onChangeText={(text) => {
              setCredentials({ ...credentials, password: text });
              if (errors.password) {
                const newErrors = { ...errors };
                delete newErrors.password;
                setErrors(newErrors);
              }
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.passwordToggleText}>
              {showPassword ? '🙈' : '👁️'}
            </Text>
          </TouchableOpacity>
        </View>
        {errors.password && (
          <Text style={styles.errorText}>{errors.password}</Text>
        )}
      </View>

      {/* Forgot Password Link */}
      <TouchableOpacity 
        style={styles.forgotPassword}
        onPress={handleForgotPassword}
        disabled={isLoading}
      >
        <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
      </TouchableOpacity>
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      {/* Sign In Button */}
      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={THEME_COLORS.textInverse} />
            <Text style={styles.primaryButtonText}>Signing In...</Text>
          </View>
        ) : (
          <Text style={styles.primaryButtonText}>🚀 Sign In</Text>
        )}
      </TouchableOpacity>

      {/* Google Sign In Button */}
      <TouchableOpacity
        style={[styles.googleButton, isLoading && styles.disabledButton]}
        onPress={handleGoogleSignIn}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={THEME_COLORS.text} />
            <Text style={styles.googleButtonText}>Signing In...</Text>
          </View>
        ) : (
          <View style={styles.googleButtonContent}>
            <Text style={styles.googleIcon}>🌐</Text>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Sign Up Link */}
      <View style={styles.signUpContainer}>
        <Text style={styles.signUpText}>Don't have an account? </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('SignUp')}
          disabled={isLoading}
        >
          <Text style={styles.signUpLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFeatures = () => (
    <View style={styles.featuresContainer}>
      <Text style={styles.featuresTitle}>📖 What You Can Do</Text>
      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🔍</Text>
          <Text style={styles.featureText}>Browse thousands of study materials</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📤</Text>
          <Text style={styles.featureText}>Share your own study resources</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📱</Text>
          <Text style={styles.featureText}>Access materials offline</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🤝</Text>
          <Text style={styles.featureText}>Connect with fellow students</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderHeader()}
          {renderForm()}
          {renderActions()}
          {renderFeatures()}
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Text>
            <Text style={styles.footerText}>
              OpenShelf University Library v1.0.0
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: UI_CONSTANTS.spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: UI_CONSTANTS.spacing.xxl,
    paddingBottom: UI_CONSTANTS.spacing.xl,
  },
  logo: {
    fontSize: 80,
    marginBottom: UI_CONSTANTS.spacing.lg,
  },
  title: {
    ...UI_CONSTANTS.typography.h2,
    color: THEME_COLORS.text,
    fontWeight: 'bold',
    marginBottom: UI_CONSTANTS.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...UI_CONSTANTS.typography.body1,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: UI_CONSTANTS.spacing.md,
  },
  formContainer: {
    marginBottom: UI_CONSTANTS.spacing.xl,
  },
  inputGroup: {
    marginBottom: UI_CONSTANTS.spacing.lg,
  },
  inputLabel: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.text,
    fontWeight: '600',
    marginBottom: UI_CONSTANTS.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.surface,
    borderRadius: UI_CONSTANTS.borderRadius.md,
    paddingHorizontal: UI_CONSTANTS.spacing.md,
    borderWidth: 2,
    borderColor: THEME_COLORS.outline,
    ...UI_CONSTANTS.elevation[1],
  },
  inputError: {
    borderColor: THEME_COLORS.error,
    backgroundColor: THEME_COLORS.errorLight,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: UI_CONSTANTS.spacing.sm,
  },
  textInput: {
    flex: 1,
    ...UI_CONSTANTS.typography.body1,
    color: THEME_COLORS.text,
    paddingVertical: UI_CONSTANTS.spacing.md,
  },
  passwordToggle: {
    padding: UI_CONSTANTS.spacing.xs,
  },
  passwordToggleText: {
    fontSize: 20,
  },
  errorText: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.error,
    marginTop: UI_CONSTANTS.spacing.xs,
    marginLeft: UI_CONSTANTS.spacing.sm,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginTop: UI_CONSTANTS.spacing.sm,
  },
  forgotPasswordText: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.primary,
    fontWeight: '500',
  },
  actionsContainer: {
    marginBottom: UI_CONSTANTS.spacing.xl,
  },
  primaryButton: {
    ...UIComponents.getButtonStyle('primary'),
    backgroundColor: THEME_COLORS.primary,
    marginBottom: UI_CONSTANTS.spacing.lg,
    ...UI_CONSTANTS.elevation[2],
  },
  disabledButton: {
    backgroundColor: THEME_COLORS.outline,
  },
  primaryButtonText: {
    ...UI_CONSTANTS.typography.h6,
    color: THEME_COLORS.textInverse,
    fontWeight: '600',
    textAlign: 'center',
  },
  googleButton: {
    ...UIComponents.getButtonStyle('secondary'),
    backgroundColor: THEME_COLORS.surface,
    borderWidth: 2,
    borderColor: THEME_COLORS.outline,
    marginBottom: UI_CONSTANTS.spacing.lg,
    ...UI_CONSTANTS.elevation[1],
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: UI_CONSTANTS.spacing.sm,
  },
  googleIcon: {
    fontSize: 20,
  },
  googleButtonText: {
    ...UI_CONSTANTS.typography.h6,
    color: THEME_COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: UI_CONSTANTS.spacing.sm,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
  },
  signUpLink: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.primary,
    fontWeight: '600',
  },
  featuresContainer: {
    backgroundColor: THEME_COLORS.surface,
    borderRadius: UI_CONSTANTS.borderRadius.lg,
    padding: UI_CONSTANTS.spacing.lg,
    marginBottom: UI_CONSTANTS.spacing.xl,
    ...UI_CONSTANTS.elevation[1],
  },
  featuresTitle: {
    ...UI_CONSTANTS.typography.h5,
    color: THEME_COLORS.text,
    fontWeight: '600',
    marginBottom: UI_CONSTANTS.spacing.md,
    textAlign: 'center',
  },
  featuresList: {
    gap: UI_CONSTANTS.spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.spacing.xs,
  },
  featureIcon: {
    fontSize: 18,
    marginRight: UI_CONSTANTS.spacing.md,
    width: 24,
    textAlign: 'center',
  },
  featureText: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.spacing.lg,
  },
  footerText: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.spacing.xs,
    lineHeight: 16,
  },
});

export default LoginScreen;
