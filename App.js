import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { flushSyncQueue } from './src/api/brainspark';

import HomeScreen from './src/screens/HomeScreen';
import AssessmentScreen from './src/screens/AssessmentScreen';
import GamesScreen from './src/screens/GamesScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import MemoryMatch from './src/screens/games/MemoryMatch';
import AttentionSpot from './src/screens/games/AttentionSpot';
import PatternPuzzle from './src/screens/games/PatternPuzzle';
import SpatialReasoning from './src/screens/games/SpatialReasoning';
import LogicSequence from './src/screens/games/LogicSequence';
import { colors } from './src/theme';

const GAME_SCREENS = {
  memory: MemoryMatch,
  attention: AttentionSpot,
  pattern: PatternPuzzle,
  spatial: SpatialReasoning,
  logic: LogicSequence,
};

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function GameScreen({ route, navigation }) {
  const { gameId } = route.params;
  const GameComponent = GAME_SCREENS[gameId];
  if (!GameComponent) return null;
  return <GameComponent navigation={navigation} />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: colors.border,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Games"
        component={GamesScreen}
        options={{
          tabBarLabel: 'Games',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🎮</Text>,
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    // Flush any queued offline actions whenever the app comes to foreground
    flushSyncQueue();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') flushSyncQueue();
    });
    return () => sub.remove();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Assessment" component={AssessmentScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
