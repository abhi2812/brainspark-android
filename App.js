import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, AppState, Modal, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { flushSyncQueue } from './src/api/brainspark';
import { getString } from './src/storage';

import HomeScreen from './src/screens/HomeScreen';
import AssessmentScreen from './src/screens/AssessmentScreen';
import GamesScreen from './src/screens/GamesScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import MemoryMatch from './src/screens/games/MemoryMatch';
import AttentionSpot from './src/screens/games/AttentionSpot';
import PatternPuzzle from './src/screens/games/PatternPuzzle';
import SpatialReasoning from './src/screens/games/SpatialReasoning';
import LogicSequence from './src/screens/games/LogicSequence';
import { colors, spacing, radius } from './src/theme';

const GAME_SCREENS = {
  memory: MemoryMatch,
  attention: AttentionSpot,
  pattern: PatternPuzzle,
  spatial: SpatialReasoning,
  logic: LogicSequence,
};

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function generateMathQuestion() {
  const a = Math.floor(Math.random() * 9) + 2;
  const b = Math.floor(Math.random() * 9) + 2;
  return { question: `${a} × ${b}`, answer: String(a * b) };
}

function ParentalGate({ visible, onSuccess, onCancel }) {
  const [{ question, answer }] = useState(generateMathQuestion);
  const [input, setInput] = useState('');

  const handlePress = (val) => {
    if (val === '⌫') { setInput(p => p.slice(0, -1)); return; }
    const next = input + val;
    setInput(next);
    if (next.length >= answer.length) {
      if (next === answer) { onSuccess(); }
      else { Alert.alert('Incorrect', 'Try again!'); setInput(''); }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={gate.overlay}>
        <View style={gate.card}>
          <Text style={gate.lock}>🔒</Text>
          <Text style={gate.title}>Parent Check</Text>
          <Text style={gate.subtitle}>Solve this to open the Dashboard</Text>
          <Text style={gate.question}>{question} = ?</Text>
          <View style={gate.display}>
            <Text style={gate.displayText}>{input || '—'}</Text>
          </View>
          <View style={gate.numpad}>
            {['1','2','3','4','5','6','7','8','9','⌫','0',''].map((k, i) => (
              k === '' ? <View key={i} style={gate.keyEmpty} /> :
              <TouchableOpacity key={i} style={gate.key} onPress={() => handlePress(k)} activeOpacity={0.7}>
                <Text style={gate.keyText}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={onCancel} style={gate.cancelBtn}>
            <Text style={gate.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function GameScreen({ route, navigation }) {
  const { gameId } = route.params || {};
  const GameComponent = GAME_SCREENS[gameId];
  if (!GameComponent) return null;
  return <GameComponent navigation={navigation} />;
}

function MainTabs({ initialTab }) {
  const insets = useSafeAreaInsets();
  const [gateVisible, setGateVisible] = useState(false);
  const [dashboardUnlocked, setDashboardUnlocked] = useState(false);
  const pendingNavRef = useRef(null);

  return (
    <>
      <Tab.Navigator
        initialRouteName={initialTab}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textLight,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 6,
            paddingTop: 6,
            height: 60 + insets.bottom,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>,
          }}
        />
        <Tab.Screen
          name="Games"
          component={GamesScreen}
          options={{
            tabBarLabel: 'Games',
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎮</Text>,
          }}
        />
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text>,
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              if (!dashboardUnlocked) {
                e.preventDefault();
                pendingNavRef.current = () => navigation.navigate('Dashboard');
                setGateVisible(true);
              }
            },
          })}
        />
      </Tab.Navigator>
      <ParentalGate
        visible={gateVisible}
        onSuccess={() => {
          setGateVisible(false);
          setDashboardUnlocked(true);
          pendingNavRef.current?.();
        }}
        onCancel={() => setGateVisible(false)}
      />
    </>
  );
}

export default function App() {
  const [initialTab, setInitialTab] = useState('Home');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    flushSyncQueue();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') flushSyncQueue();
    });
    // Returning user: skip Home, open on Games
    getString('bs_age_group').then(age => {
      if (age) setInitialTab('Games');
      setReady(true);
    });
    return () => sub.remove();
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main">
              {() => <MainTabs initialTab={initialTab} />}
            </Stack.Screen>
            <Stack.Screen name="Assessment" component={AssessmentScreen} />
            <Stack.Screen name="Game" component={GameScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const gate = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: radius.xxl, padding: spacing.xl, width: '85%', alignItems: 'center' },
  lock: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg, textAlign: 'center' },
  question: { fontSize: 36, fontWeight: '900', color: colors.primary, marginBottom: spacing.md },
  display: { backgroundColor: colors.border, borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 32, marginBottom: spacing.lg, minWidth: 120, alignItems: 'center' },
  displayText: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: 4 },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', width: 240, justifyContent: 'center', gap: 10 },
  key: { width: 68, height: 56, backgroundColor: colors.card, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  keyEmpty: { width: 68, height: 56 },
  keyText: { fontSize: 22, fontWeight: '700', color: colors.text },
  cancelBtn: { marginTop: spacing.md },
  cancelText: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
});
