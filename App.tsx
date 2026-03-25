import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  useFonts, 
  Outfit_300Light, 
  Outfit_400Regular, 
  Outfit_600SemiBold, 
  Outfit_800ExtraBold 
} from '@expo-google-fonts/outfit';
import { 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { Target, LayoutDashboard, Settings, BarChart2, Calendar as CalendarIcon, CreditCard } from 'lucide-react-native';

import { LedgrProvider, useLedgr } from './src/lib/LedgrContext';
import { SnackbarProvider } from './src/components/Snackbar';
import TrackScreen from './src/screens/TrackScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BillsScreen from './src/screens/BillsScreen';

const Tab = createBottomTabNavigator();

const LedgrTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0A0A0A',
    card: 'rgba(20,20,20,0.95)',
    text: '#FFFFFF',
    border: 'rgba(255,255,255,0.08)',
    primary: '#00F0FF',
  },
};

function Navigation() {
  const { isBillDueSoon } = useLedgr();

  return (
    <NavigationContainer theme={LedgrTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'rgba(15,15,15,0.95)',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.05)',
            position: 'absolute',
            elevation: 0,
            height: 85,
            paddingBottom: 30,
            paddingTop: 10,
          },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#A0A0A0',
          tabBarLabelStyle: {
            fontFamily: 'Inter_500Medium',
            fontSize: 10,
            marginTop: 4
          }
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={TrackScreen} 
          options={{
            tabBarIcon: ({ color, focused }) => <Target color={focused ? '#00F0FF' : color} size={22} />
          }}
        />
        <Tab.Screen 
          name="Stats" 
          component={SummaryScreen} 
          options={{
            tabBarIcon: ({ color, focused }) => <BarChart2 color={focused ? '#F59E0B' : color} size={22} />
          }}
        />
        <Tab.Screen 
          name="Dash" 
          component={DashboardScreen} 
          options={{
            tabBarIcon: ({ color, focused }) => <LayoutDashboard color={focused ? '#8A2BE2' : color} size={22} />
          }}
        />
        <Tab.Screen 
          name="Bills" 
          component={BillsScreen} 
          options={{
            tabBarIcon: ({ color, focused }) => <CreditCard color={focused ? '#FF007F' : color} size={22} />,
            tabBarBadge: isBillDueSoon ? "" : undefined,
            tabBarBadgeStyle: { backgroundColor: '#EF4444', minWidth: 8, height: 8, borderRadius: 4, marginTop: 4 }
          }}
        />
        <Tab.Screen 
          name="Days" 
          component={CalendarScreen} 
          options={{
            tabBarIcon: ({ color, focused }) => <CalendarIcon color={focused ? '#00F0FF' : color} size={22} />
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{
            tabBarIcon: ({ color, focused }) => <Settings color={focused ? '#10B981' : color} size={22} />
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_300Light, Outfit_400Regular, Outfit_600SemiBold, Outfit_800ExtraBold,
    Inter_400Regular, Inter_500Medium, Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00F0FF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <LedgrProvider>
        <SnackbarProvider>
          <Navigation />
        </SnackbarProvider>
      </LedgrProvider>
    </SafeAreaProvider>
  );
}
