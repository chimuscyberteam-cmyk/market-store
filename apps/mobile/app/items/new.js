import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { apiFetch } from '../../lib/api';
import { uploadImage } from '../../lib/upload';
import { useAuth } from '../../lib/AuthContext';

const CATEGORIES = [
  { id: 1, name: 'Food & Groceries' },
  { id: 2, name: 'Clothing & Fashion' },
  { id: 3, name: 'Electronics' },
  { id: 4, name: 'Books & Stationery' },
  { id: 5, name: 'Home & Furniture' },
  { id: 6, name: 'Beauty & Health' },
  { id: 7, name: 'Sports & Outdoors' },
  { id: 8, name: 'Services' },
  { id: 9, name: 'Other' }
];

export default function PostItem() {
  const router = useRouter();
  const { user, accessToken, loading: authLoading } = useAuth();

  const [categoryId, setCategoryId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const [coords, setCoords] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!authLoading && !user) {
    router.replace('/login');
    return null;
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to add an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1]
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  }

  async function useMyLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow location to set seller coords.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      Alert.alert('Location set', `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  async function submit() {
    if (!categoryId) {
      Alert.alert('Pick a category', 'Tap a category chip above to choose one.');
      return;
    }
    if (!title || !price) {
      Alert.alert('Missing fields', 'Title and price are required.');
      return;
    }
    if (!coords) {
      Alert.alert('Missing location', 'Tap "Use my current location" first.');
      return;
    }

    setBusy(true);
    try {
      const priceNum = parseFloat(price);
      if (!priceNum || priceNum <= 0) {
        Alert.alert('Invalid price', 'Enter a number greater than 0.');
        return;
      }

      let imageUrls = [];
      if (image) {
        try {
          const url = await uploadImage(image);
          imageUrls = [url];
        } catch (e) {
          Alert.alert('Image upload failed', e.message + '\n\nPosting without photo.');
        }
      }

      await apiFetch('/api/items', {
        method: 'POST',
        token: accessToken,
        body: {
          categoryId,
          title: title.trim(),
          description: description.trim(),
          priceZmw: priceNum,
          imageUrls,
          latitude: coords.lat,
          longitude: coords.lng
        }
      });
      Alert.alert('Posted!', 'Item posted successfully.');
      router.replace('/');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={styles.label}>Category *</Text>
      <View style={styles.catGrid}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.catChip, categoryId === c.id && styles.catChipActive]}
            onPress={() => setCategoryId(c.id)}
          >
            <Text style={[styles.catText, categoryId === c.id && styles.catTextActive]}>
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Fresh tomatoes 1kg"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Describe your item"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Price (ZMW)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 15"
        keyboardType="decimal-pad"
        value={price}
        onChangeText={setPrice}
      />

      <Text style={styles.label}>Photo (optional)</Text>
      <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Text style={styles.imagePlaceholder}>Tap to pick photo</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.hint}>(JPG or PNG · uploaded to Cloudinary)</Text>

      <Text style={styles.label}>Location</Text>
      <TouchableOpacity style={styles.locationBtn} onPress={useMyLocation}>
        <Text style={styles.locationBtnText}>
          {coords ? `Set: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Use my current location'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="white" /> : (
          <Text style={styles.submitText}>Post item</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 6 },
  input: {
    backgroundColor: 'white', borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15
  },
  textarea: { height: 100, textAlignVertical: 'top' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: 'white', borderRadius: 20,
    borderWidth: 1, borderColor: '#d1d5db'
  },
  catChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
  catText: { fontSize: 13, color: '#374151' },
  catTextActive: { color: 'white', fontWeight: '600' },
  imageBox: {
    height: 180, backgroundColor: 'white', borderRadius: 8,
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
  },
  imagePlaceholder: { color: '#9ca3af' },
  image: { width: '100%', height: '100%' },
  hint: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  locationBtn: {
    backgroundColor: '#e0f2fe', paddingVertical: 14,
    borderRadius: 10, alignItems: 'center'
  },
  locationBtnText: { color: '#0369a1', fontWeight: '700' },
  submitBtn: {
    backgroundColor: '#059669', paddingVertical: 16,
    borderRadius: 10, alignItems: 'center', marginTop: 24
  },
  submitText: { color: 'white', fontWeight: '800', fontSize: 16 }
});
