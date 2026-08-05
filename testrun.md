# Test Run Commands

This document contains the commands required to run the backend and frontend for the Maternalink project, as well as instructions for generating a scanner.

## 1. Start Backend

The backend uses Node.js, Express, and TypeScript. To start the development server:

```bash
cd backend
npm install
npm run dev
```
*(Runs `ts-node-dev --respawn --transpile-only src/index.ts`)*

## 2. Start Frontend

The frontend uses React Native and Expo. To start the Expo development server:

```bash
cd frontend
npm install
npm start
```
*(Runs `expo start`)*

To run on a specific platform:
- **Android**: `npm run android` (or `npx expo run:android`)
- **iOS**: `npm run ios` (or `npx expo run:ios`)

## 3. Generate a QR Code Scanner

To generate a QR Code scanner component in the Expo frontend, you need to install the Expo camera package which includes barcode and QR scanning capabilities:

```bash
cd frontend
npx expo install expo-camera
```

