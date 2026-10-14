import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme';

const FAQ = [
  {
    q: 'How do I post an item?',
    a: 'Tap the green + Post button on the Home tab. Pick a category, add a title, price, and tap "Use my current location" so buyers can see how far they are.'
  },
  {
    q: 'How is delivery calculated?',
    a: 'Delivery is K5 per 800 metres, rounded up to the next 800m block. If you are 1.6 km away, delivery is K10.'
  },
  {
    q: 'How do I chat with a seller?',
    a: 'Open any item, then tap "Chat with seller". Messages arrive in real time.'
  },
  {
    q: 'When do I pay?',
    a: 'Pay on delivery (cash) is available now. Mobile Money is coming soon.'
  },
  {
    q: 'What if I have a problem with an order?',
    a: 'Open the Orders tab, tap the order, and use the Chat button to talk to the buyer or seller.'
  }
];

export default function Help() {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={[styles.title, { color: theme.text }]}>Help & Support</Text>
        <Text style={[styles.sub, { color: theme.textMuted }]}>
          Answers to common questions
        </Text>

        {FAQ.map((f, i) => (
          <View key={i} style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.qRow}>
              <Ionicons name="help-circle" size={18} color={theme.primary} />
              <Text style={[styles.q, { color: theme.text }]}>{f.q}</Text>
            </View>
            <Text style={[styles.a, { color: theme.textMuted }]}>{f.a}</Text>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.contactBtn, { backgroundColor: theme.primary }]}
          onPress={() => Linking.openURL('mailto:chimuscyberteam@gmail.com')}
        >
          <Ionicons name="mail-outline" size={18} color={theme.primaryText} />
          <Text style={[styles.contactText, { color: theme.primaryText }]}>
            Contact support
          </Text>
        </TouchableOpacity>

        <Text style={[styles.footer, { color: theme.textDim }]}>
          Market Store · Mulungushi University
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 2, marginBottom: 16 },
  card: { borderRadius: 12, padding: 14, marginBottom: 10 },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  q: { fontSize: 14.5, fontWeight: '700', flex: 1 },
  a: { fontSize: 13.5, lineHeight: 20 },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 10
  },
  contactText: { fontWeight: '800', fontSize: 14 },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 24 }
});
