import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { io } from 'socket.io-client';
import { apiFetch, API_BASE } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { timeAgo } from '../../lib/format';

export default function Chat() {
  const { id: itemId } = useLocalSearchParams();
  const router = useRouter();
  const { user, accessToken, loading: authLoading } = useAuth();

  const [item, setItem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const listRef = useRef(null);

  // Require login
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Load item + messages
  useEffect(() => {
    if (!user || !itemId) return;
    (async () => {
      try {
        const itemData = await apiFetch(`/api/items/${itemId}`);
        setItem(itemData.item);
        const msgData = await apiFetch(`/api/chat/${itemId}/${itemData.item.seller_id}`, {
          token: accessToken
        });
        setMessages(msgData.messages || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, itemId, accessToken]);

  // Socket.IO
  useEffect(() => {
    if (!user || !item || !accessToken) return;

    const socket = io(API_BASE, { auth: { token: accessToken } });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('chat:join', { itemId, otherUserId: item.seller_id });
    });
    socket.on('chat:message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    });
    socket.on('connect_error', (e) => setError(`Socket: ${e.message}`));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, item, itemId, accessToken]);

  const send = useCallback(() => {
    const text = body.trim();
    if (!text || !socketRef.current || !item) return;
    socketRef.current.emit(
      'chat:send',
      { itemId, receiverId: item.seller_id, body: text },
      (res) => {
        if (res?.error) Alert.alert('Send failed', res.error);
      }
    );
    setBody('');
  }, [body, item, itemId]);

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: item ? `Chat · ${item.title}` : 'Chat' }} />

      <FlatList
        ref={listRef}
        style={styles.list}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        data={messages}
        keyExtractor={(m) => m.id}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item: m }) => {
          const mine = m.sender_id === user.id;
          return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={mine ? styles.bubbleTextMine : styles.bubbleText}>
                {m.body}
              </Text>
              <Text style={[styles.time, mine ? styles.timeMine : styles.timeTheirs]}>
                {timeAgo(m.created_at)}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No messages yet. Say hi 👋</Text>
          </View>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={body}
          onChangeText={setBody}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#b91c1c', fontWeight: '600', textAlign: 'center' },
  list: { flex: 1, backgroundColor: '#f5f5f5' },
  bubble: { maxWidth: '80%', padding: 10, borderRadius: 12 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: '#059669' },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: 'white' },
  bubbleText: { color: '#111827', fontSize: 15 },
  bubbleTextMine: { color: 'white', fontSize: 15 },
  time: { fontSize: 10, marginTop: 4 },
  timeMine: { color: '#d1fae5', textAlign: 'right' },
  timeTheirs: { color: '#9ca3af' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#888' },
  inputRow: {
    flexDirection: 'row', padding: 10, backgroundColor: 'white',
    borderTopWidth: 1, borderTopColor: '#e5e7eb', alignItems: 'center', gap: 8
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15
  },
  sendBtn: {
    backgroundColor: '#059669', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20
  },
  sendText: { color: 'white', fontWeight: '700' }
});
