import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend server configuration — see docs/ANDROID_SETUP_GUIDE.md
//
// Emulator:     http://10.0.2.2:5000
// USB + Wi-Fi:  http://<your-pc-lan-ip>:5000  (run `ipconfig` on Windows)
// USB + adb reverse: http://localhost:5000   (after: adb reverse tcp:5000 tcp:5000)
export const API_HOST = 'http://10.54.248.11:5000';

export const API_BASE_URL = `${API_HOST}/api`;
export const SOCKET_URL = API_HOST;

// ────────── Offline / Online Mode Toggle ──────────
// Persisted to AsyncStorage so the user can switch at runtime.
// Defaults to ONLINE so the app uses the backend unless offline mode is explicitly enabled.
const MODE_KEY = '@maternalink_offline_mode';

let _offlineMode: boolean | null = null;

export async function getIsOfflineMode(): Promise<boolean> {
    if (_offlineMode !== null) return _offlineMode;
    try {
        const stored = await AsyncStorage.getItem(MODE_KEY);
        _offlineMode = stored === null ? false : stored === 'true';
    } catch {
        _offlineMode = false;
    }
    return _offlineMode;
}

export async function setOfflineMode(offline: boolean): Promise<void> {
    _offlineMode = offline;
    await AsyncStorage.setItem(MODE_KEY, String(offline));
}

export function getOfflineModeSync(): boolean {
    return _offlineMode ?? false;
}
