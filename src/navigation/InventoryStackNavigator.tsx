import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "@/constants/theme";
import { InventoryScreen } from "@/screens/InventoryScreen";
import { BatchDetailsScreen } from "@/screens/BatchDetailsScreen";
import { AddEditBatchScreen } from "@/screens/AddEditBatchScreen";
import { AddPurchaseScreen } from "@/screens/AddPurchaseScreen";
import { AddSaleScreen } from "@/screens/AddSaleScreen";
import type { InventoryStackParamList } from "@/navigation/types";

const Stack = createNativeStackNavigator<InventoryStackParamList>();

export function InventoryStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="InventoryList"
        component={InventoryScreen}
        options={{ title: "Inventory" }}
      />
      <Stack.Screen
        name="BatchDetails"
        component={BatchDetailsScreen}
        options={{ title: "Batch Details" }}
      />
      <Stack.Screen
        name="AddEditBatch"
        component={AddEditBatchScreen}
        options={{ title: "Add / Edit Batch" }}
      />
      <Stack.Screen
        name="AddPurchase"
        component={AddPurchaseScreen}
        options={{ title: "Add Purchase" }}
      />
      <Stack.Screen
        name="AddSale"
        component={AddSaleScreen}
        options={{ title: "Add Sale" }}
      />
    </Stack.Navigator>
  );
}
