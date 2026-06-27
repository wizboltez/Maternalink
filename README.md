# Maternalink: Smart Maternal Health Platform

Maternalink is a maternal health platform with pregnancy tracking, a health hub, and **Smart Maternal Belt** contraction monitoring. The belt connects over **Bluetooth**, streams telemetry via **WebSockets**, supports calibration, voice guidance, and PDF/CSV session reports.

---

## Components

| Component | Path | Description |
|-----------|------|-------------|
| **Frontend** | [`frontend/`](frontend/) | React Native 0.74 app (Android & iOS) — **use this folder** |
| **Backend** | [`backend/`](backend/) | Node.js + Express + MongoDB + Socket.IO API |
| **Simulator** | [`backend/src/simulator.ts`](backend/src/simulator.ts) | Dev-only ESP32 telemetry simulator |

> **Do not use `frontend_old/`** — it is deprecated legacy code without the current Android project structure.

---

## Quick start

### Prerequisites

- Node.js 18+
- MongoDB (local or [Atlas](docs/MONGODB_ATLAS_SETUP.md))
- JDK 17 + Android Studio (for Android)
- See [docs/ANDROID_SETUP_GUIDE.md](docs/ANDROID_SETUP_GUIDE.md) for full environment setup

### 1. Backend

```powershell
cd backend
npm install
copy .env.example .env    # set JWT_SECRET (10+ chars) and MONGODB_URI
npm run dev
```

### 2. Frontend (Metro first, then Android)

```powershell
cd frontend
npm install
```

Edit API host in [`frontend/src/core/config/api.ts`](frontend/src/core/config/api.ts), then:

**Terminal A — Metro (required first):**

```powershell
cd frontend
npm start
```

**Terminal B — Android (after Metro is ready):**

```powershell
cd frontend
npx react-native run-android
```

---

## Documentation for teammates

| Guide | Audience |
|-------|----------|
| **[docs/ANDROID_SETUP_GUIDE.md](docs/ANDROID_SETUP_GUIDE.md)** | Step-by-step: emulator, USB-C device, Metro workflow, troubleshooting |
| This README | Project overview and quick reference |

---

## Configure API address

Single config file: [`frontend/src/core/config/api.ts`](frontend/src/core/config/api.ts)

| Target | `API_HOST` |
|--------|------------|
| Android Emulator | `http://10.0.2.2:5000` |
| Physical phone (Wi‑Fi) | `http://<your-pc-lan-ip>:5000` |
| Physical phone (USB + adb reverse) | `http://localhost:5000` |

---

## Hardware simulator (optional)

```powershell
cd backend
npx ts-node src/simulator.ts <sessionId> 5
```

Session ID comes from an active monitoring session in the app.

---

## Tests

```powershell
cd backend
npm run test
```

```powershell
cd frontend
npm run ts:check
```

---

## License

Private / team project — see repository settings for usage terms.
