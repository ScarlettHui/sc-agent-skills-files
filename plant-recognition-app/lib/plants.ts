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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import { db, storage } from './firebase';
import type { PlantEntry, PlantInfo } from './types';

export async function savePlant(
  userId: string,
  imageUri: string,
  plantInfo: PlantInfo,
  notes?: string,
  location?: string,
): Promise<string> {
  const imageBlob = await uriToBlob(imageUri);
  const storageRef = ref(storage, `plants/${userId}/${Date.now()}.jpg`);
  await uploadBytes(storageRef, imageBlob);
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

async function uriToBlob(uri: string): Promise<Blob> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const byteChars = atob(base64);
  const byteNums = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNums[i] = byteChars.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNums)], { type: 'image/jpeg' });
}
