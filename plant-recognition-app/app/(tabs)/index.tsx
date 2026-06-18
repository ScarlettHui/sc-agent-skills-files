import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { getUserPlants } from '../../lib/plants';
import { PlantCard } from '../../components/PlantCard';
import type { PlantEntry } from '../../lib/types';

export default function GalleryScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [plants, setPlants] = useState<PlantEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlants = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserPlants(user.uid);
      setPlants(data);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to load plants.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  function handleRefresh() {
    setRefreshing(true);
    loadPlants();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>My Plant Collection</Text>
          <Text style={styles.greetingZh}>我的植物收藏</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#868e96" />
        </TouchableOpacity>
      </View>

      {plants.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>No plants yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the Identify tab to photograph and recognize your first plant!
          </Text>
          <Text style={styles.emptyZh}>还没有植物，快去识别你的第一棵植物吧！</Text>
        </View>
      ) : (
        <FlatList
          data={plants}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2d6a4f" />
          }
          renderItem={({ item }) => (
            <PlantCard
              plant={item}
              onPress={() => router.push(`/plant/${item.id}`)}
            />
          )}
          ListHeaderComponent={
            <Text style={styles.count}>
              {plants.length} plant{plants.length !== 1 ? 's' : ''} · {plants.length} 种植物
            </Text>
          }
        />
      )}
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1b2b1e',
  },
  greetingZh: {
    fontSize: 14,
    color: '#52b788',
    marginTop: 2,
  },
  signOutBtn: {
    padding: 6,
  },
  grid: {
    padding: 8,
  },
  count: {
    fontSize: 13,
    color: '#868e96',
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1b2b1e',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#495057',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyZh: {
    fontSize: 13,
    color: '#52b788',
    textAlign: 'center',
    marginTop: 8,
  },
});
