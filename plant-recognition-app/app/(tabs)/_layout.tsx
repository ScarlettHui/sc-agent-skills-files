import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2d6a4f',
        tabBarInactiveTintColor: '#adb5bd',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e8f5e9',
        },
        headerStyle: { backgroundColor: '#f8faf9' },
        headerTintColor: '#2d6a4f',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Plants',
          tabBarLabel: 'Gallery',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Identify Plant',
          tabBarLabel: 'Identify',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
