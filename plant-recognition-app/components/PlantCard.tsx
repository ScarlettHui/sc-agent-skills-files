import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import type { PlantEntry } from '../lib/types';

interface Props {
  plant: PlantEntry;
  onPress: () => void;
}

export function PlantCard({ plant, onPress }: Props) {
  const date = new Date(plant.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: plant.imageUrl }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.nameEn} numberOfLines={1}>
          {plant.plantInfo.name.en}
        </Text>
        <Text style={styles.nameZh} numberOfLines={1}>
          {plant.plantInfo.name.zh}
        </Text>
        <Text style={styles.scientific} numberOfLines={1}>
          {plant.plantInfo.scientificName}
        </Text>
        {plant.location ? (
          <Text style={styles.location} numberOfLines={1}>
            📍 {plant.location}
          </Text>
        ) : null}
        <Text style={styles.date}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    borderRadius: 14,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#e8f5e9',
  },
  info: {
    padding: 10,
  },
  nameEn: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b2b1e',
  },
  nameZh: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2d6a4f',
    marginTop: 1,
  },
  scientific: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#868e96',
    marginTop: 2,
  },
  location: {
    fontSize: 11,
    color: '#52b788',
    marginTop: 4,
  },
  date: {
    fontSize: 11,
    color: '#adb5bd',
    marginTop: 2,
  },
});
