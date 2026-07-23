import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Batch } from "@/types";
import { getServices } from "@/services/container";

export function useBatches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getServices().batches.list();
      setBatches(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch every time this screen comes back into focus (e.g. after
  // returning from Add/Edit or a purchase/sale), not just on first mount.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { batches, loading, error, refresh };
}
