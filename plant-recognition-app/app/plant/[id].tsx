import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPlant, deletePlant } from '../../lib/plants';
import { BilingualSection, BilingualFacts } from '../../components/BilingualSection';
import type { PlantEntry } from '../../lib/types';

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [plant, setPlant] = useState<PlantEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getPlant(id)
      .then(setPlant)
      .catch(() => Alert.alert('Error', 'Plant not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!plant) return;
    navigation.setOptions({
      headerTitle: plant.plantInfo.name.en,
      headerRight: () => (
        <TouchableOpacity onPress={confirmDelete} style={{ marginRight: 4 }}>
          <Ionicons name="trash-outline" size={22} color="#e63946" />
        </TouchableOpacity>
      ),
    });
  }, [plant]);

  function confirmDelete() {
    Alert.alert('Delete Plant', 'Remove this plant from your collection?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!plant) return;
          await deletePlant(plant.id, plant.imageUrl);
          router.back();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Plant not found.</Text>
      </View>
    );
  }

  const { plantInfo } = plant;
  const date = new Date(plant.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      <Image source={{ uri: plant.imageUrl }} style={styles.heroImage} />

      <View style={styles.content}>
        <View style={styles.nameBlock}>
          <Text style={styles.nameEn}>{plantInfo.name.en}</Text>
          <Text style={styles.nameZh}>{plantInfo.name.zh}</Text>
          <Text style={styles.scientific}>{plantInfo.scientificName}</Text>

          <View style={styles.metaRow}>
            <View
              style={[
                styles.badge,
                plantInfo.confidence === 'high'
                  ? styles.confHigh
                  : plantInfo.confidence === 'medium'
                  ? styles.confMed
                  : styles.confLow,
              ]}
            >
              <Text style={styles.badgeText}>
                {plantInfo.confidence === 'high'
                  ? '✓ High confidence'
                  : plantInfo.confidence === 'medium'
                  ? '~ Medium confidence'
                  : '? Low confidence'}
              </Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color="#adb5bd" />
            <Text style={styles.dateText}>{date}</Text>
          </View>

          {plant.location ? (
            <View style={styles.dateRow}>
              <Ionicons name="location-outline" size={14} color="#52b788" />
              <Text style={[styles.dateText, { color: '#52b788' }]}>{plant.location}</Text>
            </View>
          ) : null}

          {plant.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Notes · 备注</Text>
              <Text style={styles.notesText}>{plant.notes}</Text>
            </View>
          ) : null}
        </View>

        <BilingualSection
          title="Description · 描述"
          en={plantInfo.description.en}
          zh={plantInfo.description.zh}
        />
        <BilingualSection
          title="Characteristics · 特征"
          en={plantInfo.characteristics.en}
          zh={plantInfo.characteristics.zh}
        />
        <BilingualSection
          title="Habitat · 栖息地"
          en={plantInfo.habitat.en}
          zh={plantInfo.habitat.zh}
        />
        <BilingualFacts
          title="Fun Facts · 趣味知识"
          en={plantInfo.funFacts.en}
          zh={plantInfo.funFacts.zh}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faf9',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#868e96',
  },
  heroImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#e8f5e9',
  },
  content: {
    padding: 20,
  },
  nameBlock: {
    marginBottom: 24,
  },
  nameEn: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1b2b1e',
  },
  nameZh: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2d6a4f',
    marginTop: 4,
  },
  scientific: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#868e96',
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  confHigh: { backgroundColor: '#d8f3dc' },
  confMed: { backgroundColor: '#fff3cd' },
  confLow: { backgroundColor: '#f8d7da' },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#adb5bd',
  },
  notesBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#52b788',
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#52b788',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
});
