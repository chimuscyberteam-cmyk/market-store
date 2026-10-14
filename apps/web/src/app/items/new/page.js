'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD || 'rxept7vj';
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || 'market-store-unsigned';

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

async function uploadImage(file) {
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: 'POST',
    body: form
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${text.slice(0, 150)}`);
  }
  const data = await res.json();
  return data.secure_url;
}

export default function PostItem() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [categoryId, setCategoryId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [coords, setCoords] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  function pickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function getLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Location not supported'));
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        (err) => reject(new Error(err.message || 'Location denied')),
        { enableHighAccuracy: false, timeout: 15000 }
      );
    });
  }

  async function useMyLocation() {
    try {
      setError(null);
      const loc = await getLocation();
      setCoords(loc);
    } catch (e) {
      setError(e.message);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);

    if (!categoryId) return setError('Pick a category');
    if (!title.trim()) return setError('Title is required');
    const priceNum = parseFloat(price);
    if (!priceNum || priceNum <= 0) return setError('Enter a valid price');
    if (!coords) return setError('Tap "Use my location" first');

    setBusy(true);
    try {
      let imageUrls = [];
      if (file) {
        setStatus('Uploading photo…');
        const url = await uploadImage(file);
        imageUrls = [url];
      }
      setStatus('Posting item…');
      await apiFetch('/api/items', {
        method: 'POST',
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
      router.push('/');
    } catch (err) {
      setError(err.message);
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">Post an item</h1>
      <p className="text-gray-500 mb-6">List something on Market Store.</p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-2">Category *</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${
                  categoryId === c.id
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-brand-500'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Title *</label>
          <input
            className="input"
            placeholder="e.g. Fresh tomatoes 1kg"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Description</label>
          <textarea
            className="input"
            rows={4}
            placeholder="Describe your item…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Price (ZMW) *</label>
          <input
            className="input"
            type="number"
            min="1"
            step="0.01"
            placeholder="e.g. 25"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={pickFile}
            className="block w-full text-sm"
          />
          {preview ? (
            <img
              src={preview}
              alt="preview"
              className="mt-3 w-40 h-40 object-cover rounded-xl border border-gray-200"
            />
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Location *</label>
          <button
            type="button"
            onClick={useMyLocation}
            className="btn-outline"
          >
            {coords
              ? `✓ Set: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
              : 'Use my current location'}
          </button>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        ) : null}

        {status ? (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 text-sm">
            {status}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="btn-primary w-full disabled:opacity-60"
        >
          {busy ? 'Posting…' : 'Post item'}
        </button>
      </form>
    </div>
  );
}
