import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Switch, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { useTheme, useThemeToggle } from '../../lib/theme';

export default function Settings() {
  const theme = useTheme();
  const toggle = useThemeToggle();
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    Alert.alert('Sign out?', 'You will need to sign in again to buy or post.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        }
      }
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

        {/* Account */}
        <Text style={[styles.section, { color: theme.textMuted }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          {user ? (
            <>
              <View style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.avatarText, { color: theme.primaryText }]}>
                    {user.full_name?.[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.text }]}>{user.full_name}</Text>
                  <Text style={[styles.email, { color: theme.textMuted }]}>{user.email}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleSignOut} style={styles.signOutRow}>
                <Ionicons name="log-out-outline" size={20} color={theme.danger} />
                <Text style={[styles.signOutText, { color: theme.danger }]}>Sign out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.signInBtn, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/login')}
            >
              <Text style={[styles.signInText, { color: theme.primaryText }]}>Sign in</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Appearance */}
        <Text style={[styles.section, { color: theme.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.row}>
            <Ionicons
              name={theme.mode === 'dark' ? 'moon' : 'sunny'}
              size={20}
              color={theme.primary}
            />
            <Text style={[styles.rowLabel, { color: theme.text }]}>Dark mode</Text>
            <Switch
              value={theme.mode === 'dark'}
              onValueChange={toggle}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* About */}
        <Text style={[styles.section, { color: theme.textMuted }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.row}>
            <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
            <Text style={[styles.rowLabel, { color: theme.text }]}>Version</Text>
            <Text style={[styles.value, { color: theme.textMuted }]}>1.0.0</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.row}>
            <Ionicons name="location-outline" size={20} color={theme.primary} />
            <Text style={[styles.rowLabel, { color: theme.text }]}>Region</Text>
            <Text style={[styles.value, { color: theme.textMuted }]}>Zambia (ZMW)</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  section: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    marginTop: 18, marginBottom: 6, marginLeft: 4
  },
  card: { borderRadius: 12, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  value: { fontSize: 13 },

  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '700' },
  email: { fontSize: 12.5, marginTop: 2 },

  signOutRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#e5e7eb'
  },
  signOutText: { fontWeight: '700', fontSize: 14 },

  signInBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  signInText: { fontWeight: '800', fontSize: 15 },

  divider: { height: 1, marginVertical: 8 }
});
