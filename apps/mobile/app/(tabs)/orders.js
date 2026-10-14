import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { zmw, metersLabel, timeAgo } from '../../lib/format';

const STATUS_COLORS = {
  pending: { bg: '#fef3c7', fg: '#92400e' },
  confirmed: { bg: '#dbeafe', fg: '#1e40af' },
  delivered: { bg: '#d1fae5', fg: '#065f46' },
  cancelled: { bg: '#fee2e2', fg: '#991b1b' }
};

export default function Orders() {
  const router = useRouter();
  const { user, accessToken, loading: authLoading } = useAuth();

  const [tab, setTab] = useState('mine'); // 'mine' | 'selling'
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    if (!accessToken) return;
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
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [accessToken, load]);

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

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const data = tab === 'mine' ? buyerOrders : sellerOrders;

  return (
    <View style={styles.container}>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'mine' && styles.tabActive]}
          onPress={() => setTab('mine')}
        >
          <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>
            My orders ({buyerOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'selling' && styles.tabActive]}
          onPress={() => setTab('selling')}
        >
          <Text style={[styles.tabText, tab === 'selling' && styles.tabTextActive]}>
            Selling ({sellerOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={data}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {tab === 'mine' ? 'No orders yet' : 'No incoming orders'}
            </Text>
            <Text style={styles.emptyText}>
              {tab === 'mine'
                ? 'Browse items and tap "Buy now" to place an order'
                : 'When someone buys your items, orders appear here'}
            </Text>
          </View>
        }
        renderItem={({ item: o }) => {
          const sc = STATUS_COLORS[o.status] || STATUS_COLORS.pending;
          const counterparty = tab === 'mine' ? o.seller_name : o.buyer_name;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.fg }]}>
                    {o.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.time}>{timeAgo(o.created_at)}</Text>
              </View>

              <Text style={styles.itemTitle} numberOfLines={2}>{o.item_title}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>
                  {tab === 'mine' ? 'Seller' : 'Buyer'}:
                </Text>
                <Text style={styles.metaValue}>{counterparty}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Delivery:</Text>
                <Text style={styles.metaValue}>
                  {metersLabel(o.distance_meters)} · {zmw(o.delivery_fee_zmw)}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Payment:</Text>
                <Text style={styles.metaValue}>
                  {o.payment_method === 'pod' ? 'Pay on delivery' : 'Mobile Money'}
                  {' · '}
                  {o.payment_status}
                </Text>
              </View>

              {tab === 'selling' && o.buyer_phone ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Phone:</Text>
                  <Text style={styles.metaValue}>{o.buyer_phone}</Text>
                </View>
              ) : null}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{zmw(o.total_zmw)}</Text>
              </View>

              <View style={styles.actions}>
                {tab === 'selling' && o.status === 'pending' ? (
                  <TouchableOpacity
                    style={[styles.btn, styles.btnPrimary]}
                    onPress={() => updateStatus(o.id, 'confirmed')}
                  >
                    <Text style={styles.btnPrimaryText}>Confirm</Text>
                  </TouchableOpacity>
                ) : null}
                {tab === 'selling' && o.status === 'confirmed' ? (
                  <TouchableOpacity
                    style={[styles.btn, styles.btnSuccess]}
                    onPress={() => updateStatus(o.id, 'delivered')}
                  >
                    <Text style={styles.btnPrimaryText}>Mark delivered</Text>
                  </TouchableOpacity>
                ) : null}
                {o.status === 'pending' ? (
                  <TouchableOpacity
                    style={[styles.btn, styles.btnDanger]}
                    onPress={() => updateStatus(o.id, 'cancelled')}
                  >
                    <Text style={styles.btnDangerText}>Cancel</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={[styles.btn, styles.btnGhost]}
                  onPress={() => router.push(`/chat/${o.item_id}`)}
                >
                  <Text style={styles.btnGhostText}>Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  tabs: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#059669' },
  tabText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  tabTextActive: { color: '#059669' },

  empty: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: '#888', textAlign: 'center', paddingHorizontal: 20 },

  errorBox: { backgroundColor: '#fee2e2', padding: 12, margin: 12, borderRadius: 8 },
  errorText: { color: '#991b1b', fontWeight: '600' },

  card: {
    backgroundColor: 'white', borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  time: { fontSize: 12, color: '#9ca3af' },

  itemTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },

  metaRow: { flexDirection: 'row', marginBottom: 4 },
  metaLabel: { width: 80, color: '#6b7280', fontSize: 13 },
  metaValue: { flex: 1, color: '#111827', fontSize: 13, fontWeight: '500' },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#f3f4f6'
  },
  totalLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#059669' },

  actions: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnPrimary: { backgroundColor: '#2563eb' },
  btnSuccess: { backgroundColor: '#059669' },
  btnDanger: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ef4444' },
  btnGhost: { backgroundColor: 'white', borderWidth: 1, borderColor: '#d1d5db' },
  btnPrimaryText: { color: 'white', fontWeight: '700', fontSize: 13 },
  btnDangerText: { color: '#ef4444', fontWeight: '700', fontSize: 13 },
  btnGhostText: { color: '#374151', fontWeight: '700', fontSize: 13 }
});
