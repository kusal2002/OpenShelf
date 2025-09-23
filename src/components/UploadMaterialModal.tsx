import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import UploadMaterial from './UploadMaterial';
import { MaterialCategory } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  userId: string;
  category: MaterialCategory;
  onUploaded?: () => void;
}

const UploadMaterialModal: React.FC<Props> = ({ visible, onClose, userId, category, onUploaded }) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <UploadMaterial userId={userId} category={category} onUploaded={onUploaded} />
        </View>
      </View>
    </Modal>
  );
};

export default UploadMaterialModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '600',
  },
});