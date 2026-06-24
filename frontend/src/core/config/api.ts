// Backend server configuration — see docs/ANDROID_SETUP_GUIDE.md
//
// Emulator:     http://10.0.2.2:5000
// USB + Wi-Fi:  http://<your-pc-lan-ip>:5000  (run `ipconfig` on Windows)
// USB + adb reverse: http://localhost:5000   (after: adb reverse tcp:5000 tcp:5000)
export const API_HOST = 'http://10.81.127.11:5000';

export const API_BASE_URL = `${API_HOST}/api`;
export const SOCKET_URL = API_HOST;
