// src/screens/MaterialPreviewScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Local route params type to avoid mismatches with navigation param list
interface Props {
  route: { params: { materialId: string } };
}

const MaterialPreview: React.FC<Props> = ({ route }) => {
  const { materialId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>📄 Preview Material</Text>
      <Text style={styles.idText}>Material ID: {materialId}</Text>
      {/* TODO: embed PDF viewer / WebView here */}
    </View>
  );
};

export default MaterialPreview;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: '600' },
  idText: { marginTop: 10, fontSize: 14, color: '#666' },
});