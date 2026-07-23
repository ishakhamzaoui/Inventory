import type { NavigatorScreenParams } from "@react-navigation/native";

export type InventoryStackParamList = {
  InventoryList: undefined;
  BatchDetails: { batchId: string };
  AddEditBatch: { batchId?: string };
  AddPurchase: { batchId?: string };
  AddSale: { batchId?: string };
  AddAdjustment: { batchId?: string };
};

export type RootTabParamList = {
  Dashboard: undefined;
  Inventory: NavigatorScreenParams<InventoryStackParamList>;
  StockHistory: undefined;
  Reports: undefined;
  Settings: undefined;
};
