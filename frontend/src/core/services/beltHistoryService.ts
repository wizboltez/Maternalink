import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@maternalink_connected_belts';

export interface SavedBelt {
  id: string;
  name: string;
  type: 'ble' | 'classic' | 'dual';
  backendDeviceId?: string;
  lastConnectedAt: string;
}

export async function getSavedBelts(): Promise<SavedBelt[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as SavedBelt[];
    return list.sort(
      (a, b) => new Date(b.lastConnectedAt).getTime() - new Date(a.lastConnectedAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function saveConnectedBelt(belt: SavedBelt): Promise<void> {
  const existing = await getSavedBelts();
  const filtered = existing.filter((b) => b.id !== belt.id);
  const updated = [{ ...belt, lastConnectedAt: new Date().toISOString() }, ...filtered];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function removeSavedBelt(id: string): Promise<void> {
  const existing = await getSavedBelts();
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(existing.filter((b) => b.id !== id))
  );
}

export async function updateBeltBackendId(id: string, backendDeviceId: string): Promise<void> {
  const existing = await getSavedBelts();
  const updated = existing.map((b) =>
    b.id === id ? { ...b, backendDeviceId, lastConnectedAt: new Date().toISOString() } : b
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
