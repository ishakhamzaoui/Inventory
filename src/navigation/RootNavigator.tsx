import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { InventoryStackNavigator } from "@/navigation/InventoryStackNavigator";
import { StockHistoryScreen } from "@/screens/StockHistoryScreen";
import { ReportsScreen } from "@/screens/ReportsScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import type { RootTabParamList } from "@/navigation/types";

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Dashboard: "home-outline",
  Inventory: "cube-outline",
  StockHistory: "time-outline",
  Reports: "bar-chart-outline",
  Settings: "settings-outline",
};

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={TAB_ICONS[route.name as keyof RootTabParamList]}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen
        name="Inventory"
        component={InventoryStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="StockHistory"
        component={StockHistoryScreen}
        options={{ title: "History" }}
      />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
