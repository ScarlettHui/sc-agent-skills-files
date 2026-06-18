import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import type { PlantEntry, PlantInfo } from './types';

export async function savePlant(
  userId: string,
  imageUri: string,
  plantInfo: PlantInfo,
  notes?: string,
  location?: string,
): Promise<string> {
  const storagePath = `plants/${userId}/${Date.now()}.jpg`;
  await uploadImageXHR(imageUri, storagePath);

  const storageRef = ref(storage, storagePath);
  const imageUrl = await getDownloadURL(storageRef);

  const docRef = await addDoc(collection(db, 'plants'), {
    userId,
    imageUrl,
    plantInfo,
    notes: notes ?? '',
    location: location ?? '',
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

// React Native's XHR sends file URIs natively without creating JS Blobs,
// bypassing Hermes's lack of ArrayBuffer → Blob support.
async function uploadImageXHR(uri: string, storagePath: string): Promise<void> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not authenticated');

  const bucket = (storage.app.options as any).storageBucket;
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(storagePath)}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Firebase ${token}`);
    xhr.setRequestHeader('Content-Type', 'image/jpeg');
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send({ uri, type: 'image/jpeg', name: 'photo.jpg' } as any);
  });
}

export async function getUserPlants(userId: string): Promise<PlantEntry[]> {
  const q = query(
    collection(db, 'plants'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
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
  });
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
