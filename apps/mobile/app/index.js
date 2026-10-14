import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/AuthContext';
import { apiFetch } from '../lib/api';
import { zmw, timeAgo } from '../lib/format';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch('/api/items');
      setItems(data.items || []);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Couldn't reach API: {error}</Text>
          <Text style={styles.errorHint}>Is the API running? Is the phone on the same Wi-Fi?</Text>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.muted}>Be the first to post something</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/item/${item.id}`)}
          >
            {item.image_urls?.[0] ? (
              <Image source={{ uri: item.image_urls[0] }} style={styles.cardImage} />
            ) : (
              <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                <Text style={styles.cardImageText}>{item.category_name?.[0] ?? '?'}</Text>
              </View>
            )}
            <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardPrice}>{zmw(item.price_zmw)}</Text>
            <Text numberOfLines={1} style={styles.cardMeta}>
              {item.category_name} · {timeAgo(item.created_at)}
            </Text>
          </TouchableOpacity>
        )}
      />
      {user ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/items/new')}
        >
          <Text style={styles.fabText}>+ Post item</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  muted: { color: '#888', marginTop: 8 },
  list: { padding: 8, paddingBottom: 24 },
  row: { gap: 8, marginBottom: 8 },
  card: {
    flex: 1, backgroundColor: 'white', borderRadius: 12,
    padding: 8, shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2
  },
  cardImage: { width: '100%', aspectRatio: 1, borderRadius: 8, marginBottom: 8 },
  cardImagePlaceholder: {
    backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center'
  },
  cardImageText: { fontSize: 48, color: '#9ca3af', fontWeight: 'bold' },
  cardTitle: { fontSize: 14, fontWeight: '600' },
  cardPrice: { fontSize: 16, fontWeight: '700', color: '#059669', marginTop: 4 },
  cardMeta: { fontSize: 11, color: '#888', marginTop: 4 },
  empty: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  errorBox: {
    backgroundColor: '#fee2e2', padding: 12, margin: 8,
    borderRadius: 8, borderWidth: 1, borderColor: '#fca5a5'
  },
  errorText: { color: '#991b1b', fontWeight: '600' },
  errorHint: { color: '#991b1b', fontSize: 12, marginTop: 4 },
  fab: {
    position: 'absolute', bottom: 24, right: 16,
    backgroundColor: '#059669', paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: 28, shadowColor: '#000', shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4
  },
  fabText: { color: 'white', fontWeight: '700', fontSize: 15 }
});
