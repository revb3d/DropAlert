import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '../store/authStore';
import { getAlerts } from '../api/alerts';
import { colors } from '../theme';
import Toast from '../components/Toast';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SearchScreen from '../screens/SearchScreen';
import AlertsScreen from '../screens/AlertsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import WatchlistScreen from '../screens/WatchlistScreen';

// ─── Route param types ────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Search: undefined;
  Alerts: undefined;
  Watchlists: undefined;
  Settings: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  ProductDetail: { productId: string; title: string };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();

// ─── Auth flow ────────────────────────────────────────────────────────────────

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Dashboard stack (so ProductDetail can be pushed) ────────────────────────

function DashboardNavigator() {
  return (
    <DashboardStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <DashboardStack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <DashboardStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={({ route }) => ({ title: route.params.title, headerBackTitle: '' })}
      />
    </DashboardStack.Navigator>
  );
}

// ─── Main tab navigator ───────────────────────────────────────────────────────

function MainNavigator() {
  const { data: alertData } = useQuery({
    queryKey: ['alerts', 'unread'],
    queryFn: () => getAlerts({ limit: 1 }),
    refetchInterval: 60_000,
  });
  const unreadCount = alertData?.unreadCount ?? 0;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, [string, string]> = {
            Dashboard:  ['home', 'home-outline'],
            Search:     ['search', 'search-outline'],
            Alerts:     ['notifications', 'notifications-outline'],
            Watchlists: ['eye', 'eye-outline'],
            Settings:   ['settings', 'settings-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
          return (
            <Ionicons
              name={(focused ? active : inactive) as any}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardNavigator} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{ tabBarBadge: unreadCount > 0 ? unreadCount : undefined }}
      />
      <Tab.Screen name="Watchlists" component={WatchlistScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// ─── Root navigator — auth gate ───────────────────────────────────────────────

export default function RootNavigator() {
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
      <Toast />
    </View>
  );
}
