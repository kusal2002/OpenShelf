/**
 * Enhanced Upload Screen Component
 * Modern UI with real file picker and demo modes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';

import { supabaseService } from '../services/supabase';
import { 
  Material, 
  MainTabParamList, 
  MaterialCategory, 
  FileUpload,
  FormErrors,
  UploadProgress
} from '../types';
import {
  FileUtils,
  ValidationUtils,
  UIUtils,
  UIComponents,
  ErrorHandler,
  NetworkUtils,
  THEME_COLORS,
  UI_CONSTANTS,
  MATERIAL_CATEGORIES,
} from '../utils';

const { width: screenWidth } = Dimensions.get('window');

type Props = NativeStackScreenProps<MainTabParamList, 'Upload'>;

interface DocumentPickerResponse {
  uri: string;
  type: string;
  name: string;
  size: number;
  fileCopyUri?: string;
}

interface UploadForm {
  title: string;
  description: string;
  category: MaterialCategory;
  tags: string;
  isPublic: boolean;
}

// Enhanced Document Picker with real and demo file support
const DocumentPicker = {
  types: {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    all: '*/*',
  },
  
  pickSingle: async (options: any): Promise<DocumentPickerResponse> => {
    return new Promise((resolve, reject) => {
      Alert.alert(
        '📚 Add Study Material',
        'Choose how you want to add a document:',
        [
          { text: 'Cancel', onPress: () => reject(new Error('User canceled')) },
          {
            text: '🎯 Demo Files',
            onPress: () => showDemoFilePicker(resolve, reject),
          },
          {
            text: '📱 Real Files',
            onPress: () => showRealFilePicker(resolve, reject),
          },
        ]
      );
    });
  },
  
  isCancel: (error: any) => error.message === 'User canceled',
};

const showDemoFilePicker = (resolve: Function, reject: Function) => {
  Alert.alert(
    '📖 Demo Study Materials',
    'Select a sample document to demonstrate the upload process:',
    [
      { text: 'Cancel', onPress: () => reject(new Error('User canceled')) },
      {
        text: '📐 Advanced Calculus',
        onPress: () => resolve({
          uri: 'demo://advanced-calculus.pdf',
          type: 'application/pdf',
          name: 'Advanced Calculus - Complete Guide.pdf',
          size: 2048000,
        }),
      },
      {
        text: '⚛️ Quantum Physics',
        onPress: () => resolve({
          uri: 'demo://quantum-physics.pdf',
          type: 'application/pdf',
          name: 'Quantum Physics - Theory and Applications.pdf',
          size: 3125000,
        }),
      },
      {
        text: '📚 World Literature',
        onPress: () => resolve({
          uri: 'demo://world-literature.pdf',
          type: 'application/pdf',
          name: 'World Literature - Classical Works Analysis.pdf',
          size: 1750000,
        }),
      },
      {
        text: '🎨 Renaissance Art',
        onPress: () => resolve({
          uri: 'demo://renaissance-art.pdf',
          type: 'application/pdf',
          name: 'Renaissance Art History - Masters and Movements.pdf',
          size: 4096000,
        }),
      },
      {
        text: '🧪 Organic Chemistry',
        onPress: () => resolve({
          uri: 'demo://organic-chemistry.pdf',
          type: 'application/pdf',
          name: 'Organic Chemistry - Reactions and Mechanisms.pdf',
          size: 2756000,
        }),
      },
    ]
  );
};

const showRealFilePicker = (resolve: Function, reject: Function) => {
  // Using image picker as placeholder for document picker
  // In production, you would use a proper document picker library
  const imagePickerOptions = {
    mediaType: 'mixed' as MediaType,
    includeBase64: false,
    maxHeight: 2000,
    maxWidth: 2000,
  };

  launchImageLibrary(imagePickerOptions, (response: ImagePickerResponse) => {
    if (response.didCancel) {
      reject(new Error('User canceled'));
    } else if (response.errorMessage) {
      reject(new Error(response.errorMessage));
    } else if (response.assets && response.assets[0]) {
      const asset = response.assets[0];
      resolve({
        uri: asset.uri || '',
        type: asset.type || 'application/octet-stream',
        name: asset.fileName || 'document.pdf',
        size: asset.fileSize || 0,
      });
    } else {
      reject(new Error('No file selected'));
    }
  });
};

export const UploadScreen: React.FC<Props> = ({ navigation }) => {
  const [form, setForm] = useState<UploadForm>({
    title: '',
    description: '',
    category: 'Other',
    tags: '',
    isPublic: true,
  });

  const [selectedFile, setSelectedFile] = useState<DocumentPickerResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isOnline, setIsOnline] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    const unsubscribe = NetworkUtils.subscribeToNetworkStatus((state: boolean) => {
      setIsOnline(state);
    });

    return unsubscribe;
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!selectedFile) {
      newErrors.file = 'Please select a file to upload';
    }

    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (form.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (form.description && form.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const selectFile = async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.doc, DocumentPicker.types.docx],
        copyTo: 'cachesDirectory',
      });

      setSelectedFile(result);
      
      // Auto-fill title from filename if title is empty
      if (!form.title.trim() && result.name) {
        const titleFromFile = result.name.replace(/\.[^/.]+$/, ''); // Remove extension
        setForm(prev => ({ ...prev, title: titleFromFile }));
      }

      // Auto-fill form fields for demo files
      if (result.uri.startsWith('demo://')) {
        autoFillDemoFileData(result);
      }

    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        console.error('File selection error:', error);
        UIUtils.showAlert('Error', 'Failed to select file. Please try again.');
      }
    }
  };

  const autoFillDemoFileData = (file: DocumentPickerResponse) => {
    const fileName = file.name.toLowerCase();
    let autoCategory: MaterialCategory = 'Other';
    let autoDescription = '';
    let autoTags = '';

    if (fileName.includes('calculus')) {
      autoCategory = 'Mathematics';
      autoDescription = 'Comprehensive advanced calculus guide covering limits, derivatives, integrals, series, and multivariable calculus with detailed examples and applications.';
      autoTags = 'calculus, mathematics, derivatives, integrals, limits, advanced, multivariable';
    } else if (fileName.includes('quantum') || fileName.includes('physics')) {
      autoCategory = 'Physics';
      autoDescription = 'In-depth exploration of quantum mechanics principles, covering wave functions, quantum states, uncertainty principle, and modern physics applications.';
      autoTags = 'quantum mechanics, physics, wave functions, modern physics, uncertainty principle';
    } else if (fileName.includes('literature') || fileName.includes('world')) {
      autoCategory = 'Literature';
      autoDescription = 'Comprehensive analysis of world literature classics, exploring themes, literary techniques, cultural contexts, and historical significance across different periods.';
      autoTags = 'literature, classical works, analysis, world literature, cultural studies, themes';
    } else if (fileName.includes('art') || fileName.includes('renaissance')) {
      autoCategory = 'Literature';
      autoDescription = 'Detailed study of Renaissance art history, examining master artists, artistic movements, cultural significance, and the evolution of artistic techniques.';
      autoTags = 'renaissance, art history, masters, movements, cultural significance, techniques';
    } else if (fileName.includes('chemistry') || fileName.includes('organic')) {
      autoCategory = 'Chemistry';
      autoDescription = 'Complete guide to organic chemistry covering molecular structures, reaction mechanisms, synthesis pathways, and practical applications in modern chemistry.';
      autoTags = 'organic chemistry, reactions, mechanisms, synthesis, molecular structures';
    }

    setForm(prev => ({ 
      ...prev, 
      category: autoCategory,
      description: prev.description || autoDescription,
      tags: prev.tags || autoTags
    }));
  };

  const removeFile = () => {
    setSelectedFile(null);
    const newErrors = { ...errors };
    delete newErrors.file;
    setErrors(newErrors);
  };

  const handleUpload = async () => {
    if (!isOnline) {
      UIUtils.showAlert('No Internet Connection', 'Please connect to the internet to upload materials.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsUploading(true);
    setUploadProgress({ loaded: 0, total: 0, percentage: 0 });

    try {
      const userResponse = await supabaseService.getCurrentUser();
      if (!userResponse.success || !userResponse.data) {
        UIUtils.showAlert('Error', 'Please log in to upload materials');
        return;
      }

      const userId = userResponse.data.id;
      const fileUpload: FileUpload = {
        uri: selectedFile!.fileCopyUri || selectedFile!.uri,
        type: selectedFile!.type || 'application/octet-stream',
        name: selectedFile!.name || 'unknown',
        size: selectedFile!.size || 0,
      };

      // Simulate progress for demo files
      if (selectedFile!.uri.startsWith('demo://')) {
        await simulateUploadProgress();
      }

      const uploadResponse = await supabaseService.uploadFile(fileUpload);
      if (!uploadResponse.success || !uploadResponse.data) {
        throw new Error(uploadResponse.error || 'File upload failed');
      }

      const fileUrl = uploadResponse.data;
      const materialData: Omit<Material, 'id' | 'created_at' | 'updated_at'> = {
        title: form.title.trim(),
        file_url: fileUrl,
        file_name: selectedFile!.name || 'unknown',
        file_size: selectedFile!.size || 0,
        file_type: FileUtils.getFileExtension(selectedFile!.name || ''),
        user_id: userId,
        category: form.category,
        description: form.description.trim() || undefined,
        tags: form.tags.trim() ? form.tags.split(',').map(tag => tag.trim()) : undefined,
        is_public: form.isPublic,
        download_count: 0,
      };

      const materialResponse = await supabaseService.createMaterial(materialData);
      if (!materialResponse.success) {
        throw new Error(materialResponse.error || 'Failed to save material');
      }

      resetForm();
      UIUtils.showAlert(
        '✅ Upload Successful!',
        'Your study material has been uploaded successfully and is now available in your library.',
        () => navigation.navigate('Library')
      );

    } catch (error) {
      ErrorHandler.handle(error, 'Upload error');
      UIUtils.showAlert(
        '❌ Upload Failed',
        ErrorHandler.handleApiError(error, 'Failed to upload material. Please try again.')
      );
    } finally {
      setIsUploading(false);
      setUploadProgress({ loaded: 0, total: 0, percentage: 0 });
    }
  };

  const simulateUploadProgress = async () => {
    const steps = [25, 50, 75, 100];
    for (const step of steps) {
      setUploadProgress({
        loaded: Math.round((selectedFile!.size * step) / 100),
        total: selectedFile!.size,
        percentage: step
      });
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      category: 'Other',
      tags: '',
      isPublic: true,
    });
    setSelectedFile(null);
    setErrors({});
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>📚 Upload Study Material</Text>
      <Text style={styles.subtitle}>
        Share your notes, textbooks, and resources with the university community
      </Text>
    </View>
  );

  const renderOfflineBanner = () => (
    !isOnline && (
      <View style={styles.offlineBanner}>
        <Text style={styles.offlineBannerText}>
          ⚠️ You're offline. Connect to the internet to upload materials.
        </Text>
      </View>
    )
  );

  const renderFileSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📄 Select Document</Text>
      <Text style={styles.sectionSubtitle}>
        Choose a PDF, DOC, or DOCX file (max 50MB)
      </Text>
      
      {selectedFile ? (
        <View style={styles.selectedFileCard}>
          <View style={styles.fileIcon}>
            <Text style={styles.fileIconText}>
              {selectedFile.uri.startsWith('demo://') ? '🎯' : '📄'}
            </Text>
          </View>
          <View style={styles.fileDetails}>
            <Text style={styles.fileName}>{selectedFile.name}</Text>
            <Text style={styles.fileSize}>
              {FileUtils.formatFileSize(selectedFile.size || 0)}
              {selectedFile.uri.startsWith('demo://') ? ' • Demo File' : ''}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={removeFile}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.filePickerCard}
          onPress={selectFile}
          disabled={isUploading}
        >
          <View style={styles.filePickerContent}>
            <Text style={styles.filePickerIcon}>📁</Text>
            <Text style={styles.filePickerText}>Tap to select document</Text>
            <Text style={styles.filePickerSubtext}>PDF, DOC, DOCX supported</Text>
          </View>
        </TouchableOpacity>
      )}
      
      {errors.file && <Text style={styles.errorText}>{errors.file}</Text>}
    </View>
  );

  const renderForm = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📝 Material Details</Text>
      
      {/* Title Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Title *</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          placeholder="Enter a descriptive title"
          placeholderTextColor={THEME_COLORS.textTertiary}
          value={form.title}
          onChangeText={(title) => {
            setForm(prev => ({ ...prev, title }));
            if (errors.title) {
              const newErrors = { ...errors };
              delete newErrors.title;
              setErrors(newErrors);
            }
          }}
          editable={!isUploading}
          maxLength={100}
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      </View>

      {/* Category Selection */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Category</Text>
        <TouchableOpacity
          style={styles.categoryButton}
          onPress={() => setShowCategoryModal(true)}
          disabled={isUploading}
        >
          <Text style={styles.categoryButtonText}>{form.category}</Text>
          <Text style={styles.categoryButtonArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Description Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.textArea, errors.description && styles.inputError]}
          placeholder="Describe the content and what students will learn"
          placeholderTextColor={THEME_COLORS.textTertiary}
          value={form.description}
          onChangeText={(description) => {
            setForm(prev => ({ ...prev, description }));
            if (errors.description) {
              const newErrors = { ...errors };
              delete newErrors.description;
              setErrors(newErrors);
            }
          }}
          multiline
          numberOfLines={4}
          maxLength={1000}
          textAlignVertical="top"
          editable={!isUploading}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        <Text style={styles.characterCount}>
          {form.description.length}/1000 characters
        </Text>
      </View>

      {/* Tags Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Tags</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., calculus, derivatives, midterm"
          placeholderTextColor={THEME_COLORS.textTertiary}
          value={form.tags}
          onChangeText={(tags) => setForm(prev => ({ ...prev, tags }))}
          editable={!isUploading}
        />
        <Text style={styles.inputHint}>
          Separate tags with commas to help others find your material
        </Text>
      </View>

      {/* Public Toggle */}
      <View style={styles.toggleContainer}>
        <View style={styles.toggleContent}>
          <Text style={styles.toggleTitle}>🌍 Make Public</Text>
          <Text style={styles.toggleSubtitle}>
            Allow other students to discover and download this material
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.toggle, form.isPublic && styles.toggleActive]}
          onPress={() => setForm(prev => ({ ...prev, isPublic: !prev.isPublic }))}
          disabled={isUploading}
        >
          <View style={[styles.toggleThumb, form.isPublic && styles.toggleThumbActive]} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUploadButton = () => (
    <View style={styles.uploadSection}>
      <TouchableOpacity
        style={[
          styles.uploadButton,
          (!selectedFile || !form.title.trim() || isUploading || !isOnline) && styles.uploadButtonDisabled
        ]}
        onPress={handleUpload}
        disabled={!selectedFile || !form.title.trim() || isUploading || !isOnline}
      >
        {isUploading ? (
          <View style={styles.uploadingContent}>
            <ActivityIndicator color={THEME_COLORS.textInverse} size="small" />
            <Text style={styles.uploadButtonText}>Uploading...</Text>
          </View>
        ) : (
          <Text style={styles.uploadButtonText}>🚀 Upload Material</Text>
        )}
      </TouchableOpacity>

      {/* Progress Bar */}
      {isUploading && uploadProgress.total > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${uploadProgress.percentage}%` }]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(uploadProgress.percentage)}% uploaded
          </Text>
        </View>
      )}
    </View>
  );

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Category</Text>
          <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
            {MATERIAL_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={styles.categoryItem}
                onPress={() => {
                  setForm(prev => ({ ...prev, category }));
                  setShowCategoryModal(false);
                }}
              >
                <Text style={[
                  styles.categoryItemText,
                  form.category === category && styles.categoryItemTextSelected
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderOfflineBanner()}
        {renderFileSelection()}
        {renderForm()}
        {renderUploadButton()}
      </ScrollView>
      
      {renderCategoryModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: UI_CONSTANTS.spacing.md,
  },
  header: {
    marginBottom: UI_CONSTANTS.spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...UI_CONSTANTS.typography.h2,
    color: THEME_COLORS.text,
    marginBottom: UI_CONSTANTS.spacing.sm,
  },
  subtitle: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  offlineBanner: {
    backgroundColor: THEME_COLORS.warningLight,
    padding: UI_CONSTANTS.spacing.md,
    borderRadius: UI_CONSTANTS.borderRadius.md,
    marginBottom: UI_CONSTANTS.spacing.md,
  },
  offlineBannerText: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.text,
    textAlign: 'center',
  },
  section: {
    marginBottom: UI_CONSTANTS.spacing.xl,
  },
  sectionTitle: {
    ...UI_CONSTANTS.typography.h5,
    color: THEME_COLORS.text,
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  sectionSubtitle: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
    marginBottom: UI_CONSTANTS.spacing.md,
  },
  filePickerCard: {
    ...UIComponents.getCardStyle(2),
    borderWidth: 2,
    borderColor: THEME_COLORS.outline,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  filePickerContent: {
    alignItems: 'center',
  },
  filePickerIcon: {
    fontSize: 48,
    marginBottom: UI_CONSTANTS.spacing.sm,
  },
  filePickerText: {
    ...UI_CONSTANTS.typography.h6,
    color: THEME_COLORS.text,
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  filePickerSubtext: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textTertiary,
  },
  selectedFileCard: {
    ...UIComponents.getCardStyle(1),
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI_CONSTANTS.spacing.md,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: UI_CONSTANTS.borderRadius.md,
    backgroundColor: THEME_COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: UI_CONSTANTS.spacing.md,
  },
  fileIconText: {
    fontSize: 24,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    ...UI_CONSTANTS.typography.body1,
    fontWeight: '600',
    color: THEME_COLORS.text,
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  fileSize: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textSecondary,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME_COLORS.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: THEME_COLORS.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: UI_CONSTANTS.spacing.md,
  },
  inputLabel: {
    ...UI_CONSTANTS.typography.body2,
    fontWeight: '600',
    color: THEME_COLORS.text,
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  input: {
    ...UIComponents.getInputStyle(),
    ...UI_CONSTANTS.typography.body1,
    color: THEME_COLORS.text,
  },
  inputError: {
    borderColor: THEME_COLORS.error,
  },
  textArea: {
    ...UIComponents.getInputStyle(),
    ...UI_CONSTANTS.typography.body1,
    color: THEME_COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textTertiary,
    marginTop: UI_CONSTANTS.spacing.xs,
  },
  characterCount: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textTertiary,
    textAlign: 'right',
    marginTop: UI_CONSTANTS.spacing.xs,
  },
  errorText: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.error,
    marginTop: UI_CONSTANTS.spacing.xs,
  },
  categoryButton: {
    ...UIComponents.getInputStyle(),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryButtonText: {
    ...UI_CONSTANTS.typography.body1,
    color: THEME_COLORS.text,
  },
  categoryButtonArrow: {
    ...UI_CONSTANTS.typography.body2,
    color: THEME_COLORS.textSecondary,
  },
  toggleContainer: {
    ...UIComponents.getCardStyle(1),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: UI_CONSTANTS.spacing.md,
  },
  toggleContent: {
    flex: 1,
    marginRight: UI_CONSTANTS.spacing.md,
  },
  toggleTitle: {
    ...UI_CONSTANTS.typography.body1,
    fontWeight: '600',
    color: THEME_COLORS.text,
    marginBottom: UI_CONSTANTS.spacing.xs,
  },
  toggleSubtitle: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textSecondary,
  },
  toggle: {
    width: 56,
    height: 32,
    backgroundColor: THEME_COLORS.outline,
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: THEME_COLORS.primary,
  },
  toggleThumb: {
    width: 28,
    height: 28,
    backgroundColor: THEME_COLORS.textInverse,
    borderRadius: 14,
    alignSelf: 'flex-start',
    ...UI_CONSTANTS.elevation[1],
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  uploadSection: {
    marginTop: UI_CONSTANTS.spacing.lg,
  },
  uploadButton: {
    ...UIComponents.getButtonStyle('primary'),
    backgroundColor: THEME_COLORS.primary,
    ...UI_CONSTANTS.elevation[2],
  },
  uploadButtonDisabled: {
    backgroundColor: THEME_COLORS.outline,
  },
  uploadButtonText: {
    ...UI_CONSTANTS.typography.h6,
    color: THEME_COLORS.textInverse,
    fontWeight: 'bold',
  },
  uploadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONSTANTS.spacing.sm,
  },
  progressContainer: {
    marginTop: UI_CONSTANTS.spacing.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: THEME_COLORS.outline,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME_COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    ...UI_CONSTANTS.typography.caption,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: UI_CONSTANTS.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: THEME_COLORS.surface,
    borderRadius: UI_CONSTANTS.borderRadius.lg,
    padding: UI_CONSTANTS.spacing.lg,
    maxWidth: screenWidth * 0.85,
    width: '100%',
    maxHeight: '70%',
    ...UI_CONSTANTS.elevation[3],
  },
  modalTitle: {
    ...UI_CONSTANTS.typography.h5,
    color: THEME_COLORS.text,
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.spacing.md,
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryItem: {
    paddingVertical: UI_CONSTANTS.spacing.sm,
    paddingHorizontal: UI_CONSTANTS.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.outlineVariant,
  },
  categoryItemText: {
    ...UI_CONSTANTS.typography.body1,
    color: THEME_COLORS.text,
  },
  categoryItemTextSelected: {
    color: THEME_COLORS.primary,
    fontWeight: '600',
  },
});

export default UploadScreen;
