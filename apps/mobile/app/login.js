import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { email, password }
        : { email, phone, password, fullName, role: 'buyer' };
      const data = await apiFetch(path, { method: 'POST', body });
      await signIn({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      router.back();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>

        {mode === 'register' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone (e.g. 0971234567)"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color="white" /> : (
            <Text style={styles.buttonText}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
          <Text style={styles.switchText}>
            {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, gap: 12 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15
  },
  button: {
    backgroundColor: '#059669', paddingVertical: 14,
    borderRadius: 10, alignItems: 'center', marginTop: 8
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  switchText: { color: '#059669', textAlign: 'center', marginTop: 20, fontWeight: '600' }
});
