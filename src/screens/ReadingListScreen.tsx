import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { supabaseService } from '../services/supabase';
import { Material } from '../types';
import { THEME_COLORS } from '../utils';

export default function ReadingListScreen({ navigation }: any) {
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { session } = await supabaseService.getCurrentSession();
        if (!session) return;
        const res = await supabaseService.getUserMaterials(session.user.id);
        if (res && res.success && res.data) {
          const reading = (res.data || []).filter((m: any) => !!(m.is_in_reading_list || m.reading_list));
          setItems(reading);
        }
      } catch (err) {
        console.error('Error fetching reading list', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return (
    <SafeAreaView style={styles.safe}><ActivityIndicator size="large" color={THEME_COLORS.primary} /></SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('MaterialDetails', { material: item })}>
            <View style={styles.thumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.description || ''}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (<View style={styles.empty}><Text style={styles.emptyText}>No items in your reading list yet.</Text></View>)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME_COLORS.background },
  row: { flexDirection: 'row', padding: 16, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  thumb: { width: 56, height: 72, borderRadius: 8, backgroundColor: '#F3F4F6', marginRight: 12 },
  title: { fontSize: 16, fontWeight: '600', color: THEME_COLORS.text },
  subtitle: { fontSize: 14, color: THEME_COLORS.textSecondary },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: THEME_COLORS.textSecondary }
});
