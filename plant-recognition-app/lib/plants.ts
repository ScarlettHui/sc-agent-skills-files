import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import * as FileSystem from 'expo-file-system/legacy';
import { auth, db, storage } from './firebase';
import type { PlantEntry, PlantInfo } from './types';

export async function savePlant(
  userId: string,
  imageUri: string,
  plantInfo: PlantInfo,
  notes?: string,
  location?: string,
): Promise<string> {
  console.log('[save] step 1: getting token');
  const token = await auth.currentUser?.getIdToken();
  console.log('[save] step 1 done, token exists:', !!token);
  if (!token) throw new Error('Not authenticated');

  const bucket = (storage.app.options as any).storageBucket;
  const storagePath = `plants/${userId}/${Date.now()}.jpg`;
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(storagePath)}`;
  console.log('[save] step 2: uploading image, uri:', imageUri.substring(0, 60));
  console.log('[save] FileSystemUploadType:', FileSystem.FileSystemUploadType);

  const result = await FileSystem.uploadAsync(uploadUrl, imageUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType?.BINARY_CONTENT ?? 0,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'image/jpeg',
    },
  });
  console.log('[save] step 2 done, status:', result.status, 'body:', result.body?.substring(0, 100));

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload failed (${result.status}): ${result.body}`);
  }

  console.log('[save] step 3: getting download URL');
  const storageRef = ref(storage, storagePath);
  const imageUrl = await getDownloadURL(storageRef);
  console.log('[save] step 3 done');

  console.log('[save] step 4: saving to Firestore');
  const writePromise = addDoc(collection(db, 'plants'), {
    userId,
    imageUrl,
    plantInfo,
    notes: notes ?? '',
    location: location ?? '',
    createdAt: serverTimestamp(),
  });
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Firestore write timed out after 15s')), 15000),
  );
  const docRef = await Promise.race([writePromise, timeoutPromise]);
  console.log('[save] step 4 done, id:', docRef.id);

  return docRef.id;
}

export async function getUserPlants(userId: string): Promise<PlantEntry[]> {
  const q = query(
    collection(db, 'plants'),
    where('userId', '==', userId),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId,
        imageUrl: data.imageUrl,
        createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
        notes: data.notes,
        location: data.location,
        plantInfo: data.plantInfo,
      } as PlantEntry;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getPlant(plantId: string): Promise<PlantEntry | null> {
  const snap = await getDoc(doc(db, 'plants', plantId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    userId: data.userId,
    imageUrl: data.imageUrl,
    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
    notes: data.notes,
    location: data.location,
    plantInfo: data.plantInfo,
  } as PlantEntry;
}

export async function deletePlant(plantId: string, imageUrl: string): Promise<void> {
  await deleteDoc(doc(db, 'plants', plantId));
  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch {
    // Image may already be gone
  }
}
