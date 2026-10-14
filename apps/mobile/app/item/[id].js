import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as Location from 'expo-location';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { zmw, metersLabel } from '../../lib/format';

export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, accessToken } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch(`/api/items/${id}`);
        setItem(data.item);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const calculateFee = useCallback(async () => {
    try {
      setQuoting(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow location to calculate delivery fee.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const data = await apiFetch('/api/orders/quote', {
        method: 'POST',
        body: {
          itemId: id,
          deliveryLat: loc.coords.latitude,
          deliveryLng: loc.coords.longitude
        }
      });
      setQuote(data);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setQuoting(false);
    }
  }, [id]);

  const buyNow = useCallback(async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      setQuoting(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow location so we can quote delivery.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const quoteData = await apiFetch('/api/orders/quote', {
        method: 'POST',
        body: {
          itemId: id,
          deliveryLat: loc.coords.latitude,
          deliveryLng: loc.coords.longitude
        }
      });
      Alert.alert(
        'Confirm order',
        `Item: ${zmw(quoteData.itemPriceZmw)}\nDelivery: ${zmw(quoteData.deliveryFeeZmw)}\n\nTotal: ${zmw(quoteData.totalZmw)}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Place order',
            onPress: async () => {
              try {
                await apiFetch('/api/orders', {
                  method: 'POST',
                  token: accessToken,
                  body: {
                    itemId: id,
                    deliveryLat: loc.coords.latitude,
                    deliveryLng: loc.coords.longitude,
                    paymentMethod: 'pod'
                  }
                });
                Alert.alert('Order placed', 'Check Orders tab for status.', [
                  { text: 'OK', onPress: () => router.push('/orders') }
                ]);
              } catch (e) {
                Alert.alert('Error', e.message);
              }
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setQuoting(false);
    }
  }, [id, user, accessToken, router]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading item...</Text>
      </View>
    );
  }
  if (error || !item) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Item not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Stack.Screen options={{ title: item.title }} />

      {item.image_urls?.[0] ? (
        <Image source={{ uri: item.image_urls[0] }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]}>
          <Text style={styles.heroLetter}>{item.category_name?.[0] ?? '?'}</Text>
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.price}>{zmw(item.price_zmw)}</Text>
        <Text style={styles.cat}>{item.category_name}</Text>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.desc}>{item.description || 'No description provided'}</Text>

        <Text style={styles.sectionTitle}>Seller</Text>
        <Text style={styles.desc}>{item.seller_name}</Text>
        <Text style={styles.muted}>
          Located at {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.buttonBuy]}
            onPress={buyNow}
            disabled={quoting}
          >
            <Text style={styles.buttonText}>Buy now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={calculateFee}
            disabled={quoting}
          >
            <Text style={styles.buttonText}>
              {quoting ? 'Calculating...' : 'Calculate delivery'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => router.push(`/chat/${item.id}`)}
          >
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              Chat with seller
            </Text>
          </TouchableOpacity>
        </View>

        {quote ? (
          <View style={styles.quoteBox}>
            <Text style={styles.quoteRow}>Distance: {metersLabel(quote.distanceMeters)}</Text>
            <Text style={styles.quoteRow}>Item: {zmw(quote.itemPriceZmw)}</Text>
            <Text style={styles.quoteRow}>Delivery: {zmw(quote.deliveryFeeZmw)}</Text>
            <View style={styles.quoteDivider} />
            <View style={styles.quoteTotalRow}>
              <Text style={styles.quoteTotalLabel}>Total</Text>
              <Text style={styles.quoteTotal}>{zmw(quote.totalZmw)}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  muted: { color: '#888', marginTop: 6 },
  errorText: { color: '#b91c1c', fontWeight: '600' },
  hero: { width: '100%', aspectRatio: 1.4 },
  heroPlaceholder: { backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  heroLetter: { fontSize: 96, color: '#9ca3af', fontWeight: 'bold' },
  body: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700' },
  price: { fontSize: 26, fontWeight: '800', color: '#059669', marginTop: 6 },
  cat: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 24, marginBottom: 6, color: '#374151' },
  desc: { fontSize: 15, lineHeight: 22, color: '#111827' },
  actions: { marginTop: 28, gap: 10 },
  button: { backgroundColor: '#059669', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonBuy: { backgroundColor: '#2563eb' },
  buttonSecondary: { backgroundColor: 'white', borderWidth: 2, borderColor: '#059669' },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  buttonTextSecondary: { color: '#059669' },
  quoteBox: { marginTop: 20, padding: 16, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  quoteRow: { fontSize: 14, color: '#374151', marginBottom: 6 },
  quoteDivider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 10 },
  quoteTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quoteTotalLabel: { fontSize: 16, fontWeight: '700' },
  quoteTotal: { fontSize: 20, fontWeight: '800', color: '#059669' }
});
