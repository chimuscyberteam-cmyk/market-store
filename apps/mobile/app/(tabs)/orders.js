import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/theme';
import { zmw, metersLabel, timeAgo } from '../../lib/format';

export default function Orders() {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const theme = useTheme();

  const [tab, setTab] = useState('mine');
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const [mine, selling] = await Promise.all([
        apiFetch('/api/orders/mine', { token: accessToken }),
        apiFetch('/api/orders/selling', { token: accessToken })
      ]);
      setBuyerOrders(mine.orders || []);
      setSellerOrders(selling.orders || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  async function updateStatus(orderId, status) {
    try {
      await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        token: accessToken,
        body: { status }
      });
      await load();
      Alert.alert('Done', `Order marked ${status}`);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  const isDark = theme.mode === 'dark';
  const statusBg = (status) => {
    const map = {
      pending:   isDark ? '#422006' : '#fef3c7',
      confirmed: isDark ? '#0c2a4d' : '#dbeafe',
      delivered: isDark ? '#052e16' : '#d1fae5',
      cancelled: isDark ? '#450a0a' : '#fee2e2'
    };
    return map[status] || map.pending;
  };
  const statusFg = (status) => {
    const map = {
      pending:   isDark ? '#fbbf24' : '#92400e',
      confirmed: isDark ? '#60a5fa' : '#1e40af',
      delivered: isDark ? '#34d399' : '#065f46',
      cancelled: isDark ? '#f87171' : '#991b1b'
    };
    return map[status] || map.pending;
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
        <View style={styles.center}>
          <Ionicons name="person-circle-outline" size={72} color={theme.textDim} />
          <Text style={[styles.bigTitle, { color: theme.text, marginTop: 12 }]}>
            Sign in to see orders
          </Text>
          <Text style={[styles.muted, { color: theme.textMuted }]}>
            You need an account to buy or sell
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primary, marginTop: 24 }]}
            onPress={() => router.push('/login')}
          >
            <Text style={[styles.primaryBtnText, { color: theme.primaryText }]}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const data = tab === 'mine' ? buyerOrders : sellerOrders;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Orders</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'mine' && { borderBottomColor: theme.primary }]}
          onPress={() => setTab('mine')}
        >
          <Text style={[
            styles.tabText,
            { color: tab === 'mine' ? theme.primary : theme.textMuted }
          ]}>
            Buying ({buyerOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'selling' && { borderBottomColor: theme.primary }]}
          onPress={() => setTab('selling')}
        >
          <Text style={[
            styles.tabText,
            { color: tab === 'selling' ? theme.primary : theme.textMuted }
          ]}>
            Selling ({sellerOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={[styles.errorBox, {
          backgroundColor: isDark ? '#3b1a1a' : '#fee2e2'
        }]}>
          <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={data}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={64} color={theme.textDim} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {tab === 'mine' ? 'No orders yet' : 'No incoming orders'}
            </Text>
            <Text style={[styles.muted, { color: theme.textMuted, textAlign: 'center' }]}>
              {tab === 'mine'
                ? 'Browse items and tap "Buy now" to place an order'
                : 'When someone buys your items, orders appear here'}
            </Text>
          </View>
        }
        renderItem={({ item: o }) => (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.statusPill, { backgroundColor: statusBg(o.status) }]}>
                <Text style={[styles.statusText, { color: statusFg(o.status) }]}>
                  {o.status.toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.time, { color: theme.textDim }]}>{timeAgo(o.created_at)}</Text>
            </View>

            <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={2}>
              {o.item_title}
            </Text>

            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: theme.textMuted }]}>
                {tab === 'mine' ? 'Seller' : 'Buyer'}
              </Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {tab === 'mine' ? o.seller_name : o.buyer_name}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Delivery</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {metersLabel(o.distance_meters)} · {zmw(o.delivery_fee_zmw)}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.textMuted }]}>Total</Text>
              <Text style={[styles.totalValue, { color: theme.primary }]}>
                {zmw(o.total_zmw)}
              </Text>
            </View>

            <View style={styles.actions}>
              {tab === 'selling' && o.status === 'pending' ? (
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: theme.primary }]}
                  onPress={() => updateStatus(o.id, 'confirmed')}
                >
                  <Text style={[styles.btnText, { color: theme.primaryText }]}>Confirm</Text>
                </TouchableOpacity>
              ) : null}
              {tab === 'selling' && o.status === 'confirmed' ? (
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: '#059669' }]}
                  onPress={() => updateStatus(o.id, 'delivered')}
                >
                  <Text style={styles.btnText}>Mark delivered</Text>
                </TouchableOpacity>
              ) : null}
              {o.status === 'pending' ? (
                <TouchableOpacity
                  style={[styles.btnOutline, { borderColor: theme.danger }]}
                  onPress={() => updateStatus(o.id, 'cancelled')}
                >
                  <Text style={[styles.btnOutlineText, { color: theme.danger }]}>Cancel</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.btnOutline, { borderColor: theme.border }]}
                onPress={() => router.push(`/chat/${o.item_id}`)}
              >
                <Text style={[styles.btnOutlineText, { color: theme.text }]}>Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  bigTitle: { fontSize: 20, fontWeight: '700' },
  muted: { fontSize: 14, marginTop: 6 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14, fontWeight: '700' },
  empty: { padding: 40, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  errorBox: { margin: 12, padding: 12, borderRadius: 10 },
  errorText: { fontWeight: '600', fontSize: 13 },
  card: {
    borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  time: { fontSize: 12 },
  itemTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  metaRow: { flexDirection: 'row', marginBottom: 4 },
  metaLabel: { width: 80, fontSize: 13 },
  metaValue: { flex: 1, fontSize: 13, fontWeight: '500' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb'
  },
  totalLabel: { fontSize: 14, fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  btnOutline: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, backgroundColor: 'transparent'
  },
  btnOutlineText: { fontWeight: '700', fontSize: 13 },
  primaryBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  primaryBtnText: { fontSize: 15, fontWeight: '800' }
});
