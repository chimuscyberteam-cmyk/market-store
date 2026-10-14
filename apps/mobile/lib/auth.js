import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'market-store:auth';

export async function saveAuth(auth) {
  await AsyncStorage.setItem(KEY, JSON.stringify(auth));
}
export async function loadAuth() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}
export async function clearAuth() {
  await AsyncStorage.removeItem(KEY);
}
