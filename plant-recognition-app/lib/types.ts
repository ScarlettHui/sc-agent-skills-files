export interface BilingualText {
  en: string;
  zh: string;
}

export interface PlantInfo {
  isPlant: boolean;
  confidence: 'high' | 'medium' | 'low';
  name: BilingualText;
  scientificName: string;
  description: BilingualText;
  characteristics: BilingualText;
  habitat: BilingualText;
  funFacts: {
    en: string[];
    zh: string[];
  };
}

export interface PlantEntry {
  id: string;
  userId: string;
  imageUrl: string;
  createdAt: number;
  location?: string;
  notes?: string;
  plantInfo: PlantInfo;
}
