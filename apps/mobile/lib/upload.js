import * as FileSystem from 'expo-file-system/legacy';

const CLOUD = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD;
const PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET;

export async function uploadImage(uri) {
  if (!CLOUD || !PRESET) {
    throw new Error('Cloudinary not configured. Check EXPO_PUBLIC_CLOUDINARY_* in .env');
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`;

  const result = await FileSystem.uploadAsync(url, uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType: 'image/jpeg',
    parameters: { upload_preset: PRESET }
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload failed (${result.status}): ${result.body.slice(0, 200)}`);
  }

  const data = JSON.parse(result.body);
  return data.secure_url;
}
