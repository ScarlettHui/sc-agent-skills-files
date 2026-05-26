import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import type { PlantInfo } from './types';

export async function recognizePlant(imageBase64: string, mimeType = 'image/jpeg'): Promise<PlantInfo> {
  const recognize = httpsCallable<
    { imageBase64: string; mimeType: string },
    PlantInfo
  >(functions, 'recognizePlant');

  const result = await recognize({ imageBase64, mimeType });
  return result.data;
}
