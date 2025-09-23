import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { supabaseService } from '../services/supabase';
import { MaterialCategory, FileUpload } from '../types';

interface Props {
  userId: string;
  category: MaterialCategory;
  onUploaded?: () => void;
}

const UploadMaterial: React.FC<Props> = ({ userId, category, onUploaded }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<FileUpload | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  // 📂 Pick a file
  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.doc, DocumentPicker.types.docx],
        copyTo: 'cachesDirectory',
      });

      const pickedFile: FileUpload = {
        uri: (res as any).fileCopyUri || res.uri,
        type: res.type || 'application/octet-stream',
        name: res.name || 'document',
        size: res.size || 0,
      };

      setFile(pickedFile);

      if (!title.trim() && pickedFile.name) {
        setTitle(pickedFile.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', 'Could not pick file. Please try again.');
      }
    }
  };

  // 🚀 Upload to Supabase
  const handleUpload = async () => {
    if (!file) {
      Alert.alert('Error', 'Please select a file to upload');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    setIsUploading(true);
    try {
      // upload file to Supabase storage
      const uploadResponse = await supabaseService.uploadFile(file);
      if (!uploadResponse.success || !uploadResponse.data) {
        throw new Error(uploadResponse.error || 'File upload failed');
      }

      const fileUrl = uploadResponse.data;

      const materialData = {
        title,
        description,
        category,
        user_id: userId,
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.name.split('.').pop() || 'unknown',
        is_public: isPublic,
        download_count: 0,
      };

      const response = await supabaseService.createMaterial(materialData);
      if (response.success) {
        Alert.alert('✅ Success', `${category} uploaded!`);
        setTitle('');
        setDescription('');
        setFile(null);
        onUploaded?.();
      } else {
        Alert.alert('❌ Error', response.error || 'Failed to save material');
      }
    } catch (error) {
      Alert.alert('❌ Error', error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Upload {category.charAt(0).toUpperCase() + category.slice(1)}
      </Text>

      {/* File picker */}
      <TouchableOpacity style={styles.filePicker} onPress={handlePickFile}>
        <Text style={styles.filePickerText}>
          {file ? `📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : '📁 Select a document'}
        </Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Enter title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Enter description"
        value={description}
        onChangeText={setDescription}
        multiline
      />
<View style={styles.toggleContainer}>
  <Text style={styles.toggleLabel}>
    {isPublic ? '🌍 Make Public' : '🔒 Private (Only visible to you)'}
  </Text>
  <TouchableOpacity
    style={[styles.toggle, isPublic && styles.toggleActive]}
    onPress={() => setIsPublic(!isPublic)}
  >
    <View style={[styles.toggleThumb, isPublic && styles.toggleThumbActive]} />
  </TouchableOpacity>
</View>
      <TouchableOpacity
        style={[styles.button, isUploading && styles.disabled]}
        onPress={handleUpload}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Upload</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default UploadMaterial;

const styles = StyleSheet.create({
  container: { padding: 20 },
  heading: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  filePicker: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  filePickerText: {
    fontSize: 14,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabled: { backgroundColor: '#9CA3AF' },
  buttonText: { color: '#fff', fontWeight: '600'
   },
   toggleContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
},
toggleLabel: {
  fontSize: 14,
  fontWeight: '500',
  color: '#374151',
},
toggle: {
  width: 50,
  height: 28,
  borderRadius: 14,
  backgroundColor: '#D1D5DB',
  padding: 2,
  justifyContent: 'center',
},
toggleActive: {
  backgroundColor: '#3B82F6',
},
toggleThumb: {
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: '#fff',
  alignSelf: 'flex-start',
},
toggleThumbActive: {
  alignSelf: 'flex-end',
},

});