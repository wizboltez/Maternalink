# Maternalink Frontend

Active React Native mobile app. **Use this folder** for all Android and iOS development.

> Do not use `frontend_old/` at the repo root — it is deprecated and cannot run Android builds.

## Run on Android

**Metro must be running before you build or launch the app.**

**Terminal 1:**

```powershell
npm start
```

**Terminal 2 (after Metro shows "Dev server ready"):**

```powershell
npx react-native run-android
```

Full setup (emulator, USB-C, API config, troubleshooting): **[../docs/ANDROID_SETUP_GUIDE.md](../docs/ANDROID_SETUP_GUIDE.md)**

## Configure backend URL

Edit `src/core/config/api.ts` — set `API_HOST` to your machine's address (see the guide for emulator vs physical device).

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Metro bundler |
| `npm run start:reset` | Metro with cache reset |
| `npm run android` | Build & install on device/emulator |
| `npm run ts:check` | TypeScript validation |
