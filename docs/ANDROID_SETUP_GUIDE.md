# Maternalink — Android Setup Guide for Teammates

This guide walks you through running the **Maternalink** mobile app on an **Android Emulator** or a **physical phone connected via USB-C**. Read it end-to-end before your first run.

---

## Important: Which folder to use

| Folder | Status | Use it? |
|--------|--------|---------|
| **`frontend/`** | Active React Native app (Android + iOS bare workflow) | **Yes — always use this** |
| **`frontend_old/`** | Deprecated legacy source; missing Android project structure | **No — do not use** |

All commands in this guide assume you are inside **`frontend/`**, not `frontend_old/`.

---

## What you need installed

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18+ | Backend & frontend tooling |
| **MongoDB** | Community Server or Atlas | Database |
| **JDK** | 17 | Android builds |
| **Android Studio** | Latest stable | SDK, emulator, platform-tools |
| **Git** | Any recent | Clone the repo |

### Windows environment variables

Set these in **System Environment Variables** (not only the current terminal):

| Variable | Example value |
|----------|---------------|
| `JAVA_HOME` | `C:\Program Files\Eclipse Adoptium\jdk-17.x.x` |
| `ANDROID_HOME` | `C:\Users\<You>\AppData\Local\Android\Sdk` |

Add to **Path**:

```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
%ANDROID_HOME%\tools
```

Restart your terminal (or PC) after changing environment variables.

Verify:

```powershell
node -v
java -version
adb version
```

---

## Project layout (quick reference)

```
Maternalink/
├── backend/          ← API server (Express + MongoDB + Socket.IO)
├── frontend/         ← React Native app (USE THIS)
├── docs/             ← Guides (this file)
└── README.md         ← Project overview
```

---

## Step 1 — Clone and install

```powershell
git clone <your-repo-url>
cd Maternalink
```

### Backend

```powershell
cd backend
npm install
copy .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/maternalink
JWT_SECRET=your_secure_secret_at_least_10_chars
NODE_ENV=development
```

### Frontend

```powershell
cd ..\frontend
npm install
```

---

## Step 2 — Start MongoDB

**Windows:** Ensure the *MongoDB Server* service is running (Services app), or run `mongod`.

**macOS/Linux:**

```bash
brew services start mongodb-community
# or
sudo systemctl start mongod
```

---

## Step 3 — Start the backend

Open **Terminal 1**:

```powershell
cd Maternalink\backend
npm run dev
```

Wait until you see:

```
✅ MongoDB connected successfully.
🔌 Socket.IO Server initialized.
🚀 Maternalink Backend running in development mode on port 5000
```

Leave this terminal open.

---

## Step 4 — Configure the frontend API address

Open **`frontend/src/core/config/api.ts`** and set `API_HOST` to match how your phone/emulator reaches your PC:

```typescript
export const API_HOST = 'http://YOUR_PC_IP:5000';
```

### How to choose the right address

| Target | Recommended `API_HOST` |
|--------|------------------------|
| **Android Emulator** (AVD) | `http://10.0.2.2:5000` (emulator alias for your PC localhost) |
| **Physical phone (USB)** | `http://YOUR_LAN_IP:5000` (e.g. `http://192.168.1.15:5000`) |
| **Physical phone (USB + adb reverse)** | `http://localhost:5000` (after running adb reverse — see below) |

Find your LAN IP on Windows:

```powershell
ipconfig
```

Look for **IPv4 Address** under your active Wi‑Fi adapter (e.g. `192.168.1.15`).

> Phone and PC must be on the **same Wi‑Fi network** when using a LAN IP (unless you use `adb reverse`).

---

## Step 5 — Metro bundler MUST run before Android

React Native needs **Metro** (the JS bundler) running **before** you install/launch the app.

### Terminal 2 — Start Metro (keep this open)

```powershell
cd Maternalink\frontend
npm start
```

Wait until Metro shows something like:

```
Welcome to Metro
info Dev server ready
```

Optional — clear cache if you hit stale bundle errors:

```powershell
npm start -- --reset-cache
```

> **Do not close this terminal** while developing. Metro serves your JavaScript to the app.

---

## Step 6A — Run on Android Emulator

### Create an emulator (one-time)

1. Open **Android Studio**
2. **Device Manager** → **Create Device**
3. Pick a phone profile (e.g. Pixel 6)
4. Select a system image (API 33 or 34 recommended)
5. Finish and **Start** the emulator

Verify the emulator is visible:

```powershell
adb devices
```

You should see something like `emulator-5554   device`.

### Terminal 3 — Build and install the app

With **Metro still running** in Terminal 2:

```powershell
cd Maternalink\frontend
npx react-native run-android
```

Or use the npm script:

```powershell
npm run android
```

First build may take several minutes. The app should open on the emulator automatically.

### Emulator API tip

For the backend, set in `api.ts`:

```typescript
export const API_HOST = 'http://10.0.2.2:5000';
```

`10.0.2.2` is the Android emulator’s special address for your host machine’s `localhost`.

---

## Step 6B — Run on a physical phone (USB-C)

### Enable Developer Options on the phone

1. **Settings → About phone**
2. Tap **Build number** 7 times → Developer options unlocked
3. **Settings → Developer options**
4. Enable **USB debugging**

### Connect via USB-C

1. Plug the phone into your PC with a USB-C cable
2. On the phone, accept **Allow USB debugging** when prompted
3. Verify connection:

```powershell
adb devices
```

Expected output:

```
List of devices attached
RZCX81ZQFBD    device
```

If status is `unauthorized`, unlock the phone and accept the debugging prompt again.

### Optional — USB port forwarding (use localhost on device)

If you prefer `localhost` instead of LAN IP in `api.ts`:

```powershell
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5000 tcp:5000
```

Then set:

```typescript
export const API_HOST = 'http://localhost:5000';
```

- Port **8081** → Metro bundler  
- Port **5000** → Backend API  

Re-run `adb reverse` after each USB reconnect.

### Build and install (Metro must be running)

**Terminal 2:** Metro running (`npm start`)  
**Terminal 3:**

```powershell
cd Maternalink\frontend
npx react-native run-android
```

The app installs and launches on your connected device.

---

## Step 7 — First launch in the app

1. **Register** a new account (or log in if one exists)
2. Use the bottom tabs:
   - **Home** — main dashboard
   - **Health** — pregnancy wellness info
   - **Monitor** — Smart Belt / contraction monitoring
   - **Profile** — account & settings
3. For belt monitoring: **Monitor → Connect Belt via Bluetooth → Calibrate → Live Tracking**

---

## Optional — Hardware simulator (no physical belt)

With a live monitoring session started in the app, copy the **session ID** from the backend logs or app, then in a new terminal:

```powershell
cd Maternalink\backend
npx ts-node src/simulator.ts <sessionId> 5
```

Option `5` streams mixed telemetry (ADC, flex %, intensity).

---

## Daily development workflow (cheat sheet)

Use **three terminals** every time:

| Terminal | Directory | Command |
|----------|-----------|---------|
| 1 | `backend/` | `npm run dev` |
| 2 | `frontend/` | `npm start` ← **start this before Android** |
| 3 | `frontend/` | `npx react-native run-android` |

You only need Terminal 3 again when you change native code or reinstall. For JS/TS changes, Metro hot-reloads automatically.

---

## Troubleshooting

### `react-native-svg` / Gradle compile errors

The project pins `react-native-svg@15.12.1` for React Native 0.74. After `git pull`:

```powershell
cd frontend
npm install
cd android
.\gradlew.bat clean
cd ..
npx react-native run-android
```

Do **not** upgrade `react-native-svg` to 15.15+ unless you upgrade React Native to 0.78+.

### Metro “Unable to load script” / red screen

1. Confirm Metro is running (`npm start` in `frontend/`)
2. Shake device → **Reload**, or press `r` in the Metro terminal
3. Try: `npm start -- --reset-cache`

### “Connection refused” / cannot reach backend

- Backend running on port 5000?
- Correct `API_HOST` in `frontend/src/core/config/api.ts`?
- Emulator: use `10.0.2.2`, not `localhost`
- Physical device: same Wi‑Fi as PC, or use `adb reverse`
- Allow port 5000 through Windows Firewall for private networks

### `adb devices` shows nothing

- Try another USB-C cable (data-capable, not charge-only)
- Re-enable USB debugging
- Install/update Google USB Driver (Android Studio → SDK Manager)
- Run `adb kill-server` then `adb start-server`

### App installs but stays on white screen

- Metro must be running **before** `run-android`
- Check Metro terminal for red errors
- Run `npm run ts:check` in `frontend/` for TypeScript issues

### MongoDB / backend won’t start

- `JWT_SECRET` in `.env` must be **at least 10 characters**
- MongoDB service must be running
- Check `MONGODB_URI` is correct

---

## Useful commands reference

```powershell
# List connected devices / emulators
adb devices

# Forward ports (physical USB device)
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5000 tcp:5000

# Clean Android build
cd frontend\android
.\gradlew.bat clean

# TypeScript check (frontend)
cd frontend
npm run ts:check

# Backend tests
cd backend
npm run test
```

---

## Getting help

1. Check this guide and [README.md](../README.md)
2. Run `npx react-native doctor` in `frontend/`
3. Share Metro terminal output + `adb devices` + backend logs when asking for help
