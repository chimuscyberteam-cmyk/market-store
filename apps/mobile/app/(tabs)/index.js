import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image, TextInput, ScrollView
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/theme';
import { zmw, timeAgo } from '../../lib/format';

const CATEGORIES = [
  { slug: 'all',         name: 'All' },
  { slug: 'food',        name: 'Food' },
  { slug: 'clothing',    name: 'Clothing' },
  { slug: 'electronics', name: 'Electronics' },
  { slug: 'books',       name: 'Books' },
  { slug: 'home',        name: 'Home' },
  { slug: 'beauty',      name: 'Beauty' },
  { slug: 'sports',      name: 'Sports' },
  { slug: 'services',    name: 'Services' },
  { slug: 'other',       name: 'Other' }
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const theme = useTheme();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [category, setCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 350);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchText]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (category && category !== 'all') params.set('category', category);
      if (debouncedSearch) params.set('q', debouncedSearch);
      const qs = params.toString();
      const data = await apiFetch(`/api/items${qs ? `?${qs}` : ''}`);
      setItems(data.items || []);
    } catch (e) {
      setError(e.message);
    }
  }, [category, debouncedSearch]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        await load();
        setLoading(false);
      })();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.hello, { color: theme.textMuted }]}>Market Store</Text>
          <Text style={[styles.headline, { color: theme.text }]}>What are you looking for?</Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
        <Ionicons name="search" size={18} color={theme.textDim} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search items, services…"
          placeholderTextColor={theme.textDim}
          value={searchText}
          onChangeText={setSearchText}
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={18} color={theme.textDim} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Categories — fixed height, horizontal scroll */}
      <View style={styles.catWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORIES.map((c) => {
            const active = category === c.slug;
            return (
              <TouchableOpacity
                key={c.slug}
                activeOpacity={0.7}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? theme.chipActiveBg : theme.chipBg,
                    borderColor: active ? theme.chipActiveBg : theme.chipBorder
                  }
                ]}
                onPress={() => setCategory(c.slug)}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.chipText,
                    { color: active ? theme.chipActiveText : theme.chipText }
                  ]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: theme.mode === 'dark' ? '#3b1a1a' : '#fee2e2' }]}>
          <Text style={[styles.errorText, { color: theme.danger }]}>
            Couldn't reach API: {error}
          </Text>
        </View>
      ) : null}

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.muted, { color: theme.textMuted }]}>Loading…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={44} color={theme.textDim} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Nothing here yet</Text>
              <Text style={[styles.muted, { color: theme.textMuted }]}>
                {debouncedSearch
                  ? `No results for "${debouncedSearch}"`
                  : 'Try another category or post the first item'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.card, { backgroundColor: theme.card }]}
              onPress={() => router.push(`/item/${item.id}`)}
            >
              {item.image_urls?.[0] ? (
                <Image source={{ uri: item.image_urls[0] }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, { backgroundColor: theme.mode === 'dark' ? '#21262d' : '#e5e7eb', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 44, color: theme.textDim, fontWeight: 'bold' }}>
                    {item.category_name?.[0] ?? '?'}
                  </Text>
                </View>
              )}
              <Text numberOfLines={2} style={[styles.cardTitle, { color: theme.text }]}>
                {item.title}
              </Text>
              <Text style={[styles.cardPrice, { color: theme.primary }]}>{zmw(item.price_zmw)}</Text>
              <Text numberOfLines={1} style={[styles.cardMeta, { color: theme.textDim }]}>
                {item.category_name} · {timeAgo(item.created_at)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {user ? (
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/items/new')}
        >
          <Ionicons name="add" size={22} color={theme.primaryText} />
          <Text style={[styles.fabText, { color: theme.primaryText }]}>Post</Text>
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  hello: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  headline: { fontSize: 20, fontWeight: '800', marginTop: 2 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, paddingHorizontal: 12,
    height: 46, borderRadius: 12, borderWidth: 1
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },

  catWrap: { paddingTop: 12, paddingBottom: 8 },
  chipsRow: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chipText: { fontSize: 13, fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  muted: { marginTop: 8, textAlign: 'center' },

  list: { paddingHorizontal: 12, paddingBottom: 120 },
  row: { gap: 10, marginBottom: 10 },
  card: {
    flex: 1, borderRadius: 14, padding: 8,
    shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 2
  },
  cardImage: { width: '100%', aspectRatio: 1, borderRadius: 10, marginBottom: 8 },
  cardTitle: { fontSize: 13.5, fontWeight: '600', lineHeight: 18 },
  cardPrice: { fontSize: 15.5, fontWeight: '800', marginTop: 4 },
  cardMeta: { fontSize: 11, marginTop: 4 },

  empty: { padding: 40, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 6 },

  errorBox: { marginHorizontal: 16, marginTop: 8, padding: 12, borderRadius: 10 },
  errorText: { fontWeight: '600', fontSize: 13 },

  fab: {
    position: 'absolute', bottom: 20, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 26,
    shadowColor: '#000', shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 5
  },
  fabText: { fontWeight: '800', fontSize: 14 }
});
