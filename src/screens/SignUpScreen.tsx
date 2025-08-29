/**
 * Enhanced Sign Up Screen Component
 * Modern UI for user registration with improved UX and validation
 */

import React, { useState } from 'react';
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

import { supabaseService } from '../services/supabase';
import { 
  ValidationUtils, 
  UIUtils, 
  UIComponents, 
  ErrorHandler, 
  THEME_COLORS, 
  UI_CONSTANTS 
} from '../utils';
import { RootStackParamList, SignUpCredentials, FormErrors } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export const SignUpScreen = ({ navigation }: Props) => {
  const [credentials, setCredentials] = useState<SignUpCredentials>({
    email: '',
    password: '',
    name: '',
    university_id: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!credentials.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (credentials.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!credentials.email) {
      newErrors.email = 'Email is required';
    } else if (!ValidationUtils.isValidEmail(credentials.email)) {
      newErrors.email = 'Please enter a valid university email';
    }

    // University ID validation
    if (!credentials.university_id) {
      newErrors.university_id = 'University ID is required';
    } else if (credentials.university_id.length < 4) {
      newErrors.university_id = 'University ID must be at least 4 characters';
    }

    // Password validation
    if (!credentials.password) {
      newErrors.password = 'Password is required';
    } else if (credentials.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(credentials.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== credentials.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms agreement validation
    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the Terms of Service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      const response = await supabaseService.signUp(credentials);
      
      if (response.success) {
        UIUtils.showAlert(
          '🎉 Account Created!',
          'Welcome to OpenShelf! Please check your email to verify your account.',
          () => navigation.navigate('Login')
        );
      } else {
        UIUtils.showAlert(
          'Registration Failed', 
          response.error || 'Unable to create account. Please try again.'
        );
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Sign up error');
      UIUtils.showAlert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFieldError = (field: keyof FormErrors) => {
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      
      <Text style={styles.logo}>🎓</Text>
      <Text style={styles.title}>Join OpenShelf</Text>
      <Text style={styles.subtitle}>
        Create your account to start sharing and accessing study materials
      </Text>
    </View>
  );

  const renderForm = () => (
    <View style={styles.formContainer}>
      {/* Full Name Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <View style={[styles.inputContainer, errors.name && styles.inputError]}>
          <Text style={styles.inputIcon}>👤</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your full name"
            placeholderTextColor={THEME_COLORS.textTertiary}
            value={credentials.name}
            onChangeText={(text) => {
              setCredentials({ ...credentials, name: text });
              clearFieldError('name');
            }}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>
        {errors.name && (
          <Text style={styles.errorText}>{errors.name}</Text>
        )}
      </View>

      {/* Email Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>University Email</Text>
        <View style={[styles.inputContainer, errors.email && styles.inputError]}>
          <Text style={styles.inputIcon}>📧</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your university email"
            placeholderTextColor={THEME_COLORS.textTertiary}
            value={credentials.email}
            onChangeText={(text) => {
              setCredentials({ ...credentials, email: text.toLowerCase().trim() });
              clearFieldError('email');
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

      {/* University ID Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>University ID</Text>
        <View style={[styles.inputContainer, errors.university_id && styles.inputError]}>
          <Text style={styles.inputIcon}>🆔</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your student/staff ID"
            placeholderTextColor={THEME_COLORS.textTertiary}
            value={credentials.university_id}
            onChangeText={(text) => {
              setCredentials({ ...credentials, university_id: text.trim() });
              clearFieldError('university_id');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>
        {errors.university_id && (
          <Text style={styles.errorText}>{errors.university_id}</Text>
        )}
      </View>

      {/* Password Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={[styles.inputContainer, errors.password && styles.inputError]}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Create a strong password"
            placeholderTextColor={THEME_COLORS.textTertiary}
            value={credentials.password}
            onChangeText={(text) => {
              setCredentials({ ...credentials, password: text });
              clearFieldError('password');
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
        <Text style={styles.passwordHint}>
          At least 8 characters with uppercase, lowercase, and number
        </Text>
      </View>

      {/* Confirm Password Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
          <Text style={styles.inputIcon}>🔐</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Re-enter your password"
            placeholderTextColor={THEME_COLORS.textTertiary}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              clearFieldError('confirmPassword');
            }}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Text style={styles.passwordToggleText}>
              {showConfirmPassword ? '🙈' : '👁️'}
            </Text>
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        )}
      </View>

      {/* Terms Agreement */}
      <View style={styles.termsContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => {
            setAgreedToTerms(!agreedToTerms);
            clearFieldError('terms');
          }}
        >
          <Text style={styles.checkboxIcon}>
            {agreedToTerms ? '✅' : '⬜'}
          </Text>
        </TouchableOpacity>
        <View style={styles.termsTextContainer}>
          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text 
              style={styles.termsLink}
              onPress={() => UIUtils.showAlert('Terms of Service', 'Terms of Service will be available in a future update.')}
            >
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text 
              style={styles.termsLink}
              onPress={() => UIUtils.showAlert('Privacy Policy', 'Privacy Policy will be available in a future update.')}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>
      {errors.terms && (
        <Text style={styles.errorText}>{errors.terms}</Text>
      )}
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      {/* Sign Up Button */}
      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.disabledButton]}
        onPress={handleSignUp}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={THEME_COLORS.textInverse} />
            <Text style={styles.primaryButtonText}>Creating Account...</Text>
          </View>
        ) : (
          <Text style={styles.primaryButtonText}>🚀 Create Account</Text>
        )}
      </TouchableOpacity>

      {/* Sign In Link */}
      <View style={styles.signInContainer}>
        <Text style={styles.signInText}>Already have an account? </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          disabled={isLoading}
        >
          <Text style={styles.signInLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBenefits = () => (
    <View style={styles.benefitsContainer}>
      <Text style={styles.benefitsTitle}>🌟 Why Join OpenShelf?</Text>
      <View style={styles.benefitsList}>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>📚</Text>
          <Text style={styles.benefitText}>Access thousands of study materials</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>🤝</Text>
          <Text style={styles.benefitText}>Share knowledge with classmates</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>⭐</Text>
          <Text style={styles.benefitText}>Build your academic reputation</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>🔒</Text>
          <Text style={styles.benefitText}>Secure and private platform</Text>
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
          {renderBenefits()}
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Join thousands of students already using OpenShelf
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
    paddingTop: UI_CONSTANTS.spacing.lg,
    paddingBottom: UI_CONSTANTS.spacing.xl,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: UI_CONSTANTS.spacing.lg,
  },
  backButtonText: {
    ...UI_CONSTANTS.typography.body1,
    color: THEME_COLORS.primary,
    fontWeight: '500',
  },
  logo: {
    fontSize: 64,
    marginBottom: UI_CONSTANTS.spacing.md,
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
    paddingHorizontal: UI_CONSTANTS.spacing.sm,
  },
  formContainer: {
    marginBottom: UI_CONSTANTS.spacing.lg,
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
  passwordHint: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textTertiary,
    marginTop: UI_CONSTANTS.spacing.xs,
    marginLeft: UI_CONSTANTS.spacing.sm,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: UI_CONSTANTS.spacing.md,
  },
  checkbox: {
    marginRight: UI_CONSTANTS.spacing.sm,
    paddingTop: 2,
  },
  checkboxIcon: {
    fontSize: 20,
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: UI_CONSTANTS.spacing.sm,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
  },
  signInLink: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.primary,
    fontWeight: '600',
  },
  benefitsContainer: {
    backgroundColor: THEME_COLORS.surface,
    borderRadius: UI_CONSTANTS.borderRadius.lg,
    padding: UI_CONSTANTS.spacing.lg,
    marginBottom: UI_CONSTANTS.spacing.xl,
    ...UI_CONSTANTS.elevation[1],
  },
  benefitsTitle: {
    ...UI_CONSTANTS.typography.h5,
    color: THEME_COLORS.text,
    fontWeight: '600',
    marginBottom: UI_CONSTANTS.spacing.md,
    textAlign: 'center',
  },
  benefitsList: {
    gap: UI_CONSTANTS.spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.spacing.xs,
  },
  benefitIcon: {
    fontSize: 18,
    marginRight: UI_CONSTANTS.spacing.md,
    width: 24,
    textAlign: 'center',
  },
  benefitText: {
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
    fontStyle: 'italic',
  },
});

export default SignUpScreen;
