import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/theme';

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const theme = useTheme();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.mode === 'dark' ? '#161b22' : '#ffffff',
      borderColor: theme.mode === 'dark' ? '#30363d' : '#d1d5db',
      color: theme.text
    }
  ];

  const placeholderColor = theme.mode === 'dark' ? '#6e7681' : '#9ca3af';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.text }]}>
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {mode === 'login'
            ? 'Welcome back to Market Store'
            : 'Join Market Store in seconds'}
        </Text>

        {mode === 'register' && (
          <>
            <Text style={[styles.label, { color: theme.text }]}>Full name</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. John Phiri"
              placeholderTextColor={placeholderColor}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <Text style={[styles.label, { color: theme.text }]}>Phone</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. 0971234567"
              placeholderTextColor={placeholderColor}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoCorrect={false}
            />
          </>
        )}

        <Text style={[styles.label, { color: theme.text }]}>Email</Text>
        <TextInput
          style={inputStyle}
          placeholder="you@example.com"
          placeholderTextColor={placeholderColor}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={[styles.label, { color: theme.text }]}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[inputStyle, { flex: 1, paddingRight: 48 }]}
            placeholder="At least 8 characters"
            placeholderTextColor={placeholderColor}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary, opacity: busy ? 0.6 : 1 }]}
          onPress={submit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={theme.primaryText} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.primaryText }]}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
          <Text style={[styles.switchText, { color: theme.primary }]}>
            {mode === 'login'
              ? "Don't have an account? Register"
              : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 40, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 28 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase'
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500'
  },
  passwordRow: { position: 'relative' },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 28
  },
  buttonText: { fontWeight: '800', fontSize: 16 },
  switchText: {
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
    fontSize: 14
  }
});
