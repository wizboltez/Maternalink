# Maternalink - Complete Handover Guide

Welcome to the Maternalink project! This document serves as the complete technical handover guide, detailing the folder structure, setup instructions, feature logic, API integrations, and database schemas.

## 📁 Folder Structure

The project is structured as a Monorepo containing a React Native mobile application and a Node.js/Express backend.

```
Maternalink/
├── frontend/                # React Native (Expo bare workflow) Mobile App
│   ├── android/             # Native Android project files
│   ├── ios/                 # Native iOS project files
│   ├── src/
│   │   ├── core/            # Core configuration (api config, theme, navigation)
│   │   ├── features/        # Feature-based module architecture
│   │   │   ├── auth/        # Login/Registration screens
│   │   │   ├── contraction-monitoring/ # BLE connection & Contraction Tracking
│   │   │   ├── dashboard/   # Main app dashboard
│   │   │   ├── guidance/    # AI Chatbot & Exercise Guidance
│   │   │   ├── health/      # General health utilities
│   │   │   ├── maternal-health/ # Vitals monitoring (SpO2, HR, Temp)
│   │   │   └── profile/     # User profile and settings (Offline Toggle)
│   │   └── App.tsx          # Application entry point
│   ├── package.json         # Frontend dependencies
│   └── tsconfig.json        # TypeScript configuration
│
└── backend/                 # Node.js + Express Backend Server
    ├── src/
    │   ├── application/     # Services and business logic
    │   ├── domain/          # Database Models (Mongoose)
    │   ├── presentation/    # Controllers (e.g., SosController)
    │   └── server.ts        # Express server entry point
    ├── .env                 # Environment variables (API keys, DB URIs)
    └── package.json         # Backend dependencies
```

## ⚙️ Setup Instructions

### 1. Backend Setup (Node.js)
1. Navigate to the backend folder: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file (copy from `.env.example`) and configure your API keys (see below).
4. Run the development server: `npm run dev`
*(The backend will start on `http://localhost:5000`)*

### 2. Frontend Setup (React Native)
1. Navigate to the frontend folder: `cd frontend`
2. Install dependencies: `npm install`
3. Connect the frontend to your backend:
   - Open `frontend/src/core/config/api.ts`
   - Change `API_HOST` to your backend's IP address (e.g., `http://10.0.2.2:5000` for Android Emulator, or your computer's LAN IP if testing on a physical device).
4. **Run the App:**
   - For development: `npm run start` (or `expo start`)
   - To build a standalone APK: `cd android && ./gradlew assembleRelease`

## 🔑 API Key Setup (`backend/.env`)

The backend centralizes all sensitive API keys. **Never put these in the frontend code!**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Database (Use a local URI or MongoDB Atlas cloud URI)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/maternalink

# JWT Secret (Used to sign user login tokens)
JWT_SECRET=your_super_secret_jwt_string

# Twilio (For Emergency SOS SMS Feature)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1234567890
EMERGENCY_CONTACT_NUMBER=+0987654321
```

## 🧠 Feature Logic

### 1. Bluetooth Low Energy (BLE) Integration
- **Location:** `frontend/src/features/contraction-monitoring/services/bluetoothService.ts`
- **Logic:** The app scans for the ESP32 hardware using a specific `SERVICE_UUID` (`12345678-1234-1234-1234-123456789abc`) and `CHARACTERISTIC_UUID`. Once connected, it streams raw JSON data bytes, decodes them using `TextDecoder`, and passes them to the vital sign processors.

### 2. Vitals Aggregation (100-Second Mean)
- **Location:** `frontend/src/features/maternal-health/hooks/useMaternalHealth.ts`
- **Logic:** To prevent wildly fluctuating UI updates, vital signs (Heart Rate, SpO2, Temperature) are aggregated into a 100-second window array. The UI displays the *calculated mean* of these arrays. The data refreshes visibly every 2 minutes for stability.

### 3. Emergency SOS
- **Location:** `frontend/src/core/components/SosButton.tsx` & `backend/src/presentation/controllers/SosController.ts`
- **Logic:** A global red SOS button is injected into the navigation header of all screens. When pressed, it sends an HTTP POST request to the backend. The backend uses the Twilio SDK to send an SMS to the registered emergency contact.

### 4. Offline / Demo Mode
- **Location:** `frontend/src/core/config/api.ts`
- **Logic:** Users can toggle "Offline Demo Mode" in their Profile Settings. When enabled, all HTTP requests to the backend (Auth, Sync, Chatbot) are intercepted and returning mock data instantly, allowing the app to function without internet.

## 🤖 AI Guidance Chatbot

- **Location:** `frontend/src/features/guidance/screens/ChatbotScreen.tsx`
- **API File:** `frontend/src/features/guidance/api/guidanceApi.ts`
- **How it Works:** The Chatbot is a specialized AI assistant that acts as a virtual maternal health guide. 
- **Sensor Context:** Whenever the user sends a message to the Chatbot, the app silently attaches their *current live vital signs* (Heart rate, SpO2, Stress Score, Pregnancy Week). This allows the backend AI to provide hyper-personalized responses (e.g., "I notice your stress score is slightly high right now, take a deep breath...").
- **Backend Implementation:** The actual LLM (e.g., OpenAI/Gemini integration) should be implemented on the backend (`/api/chat/message`). If running in offline mode, the frontend intercepts the request and provides simulated placeholder responses.

## 🗄️ Database Schema

The backend uses MongoDB (via Mongoose) to store persistent data.

### 1. User Model
```typescript
{
  _id: ObjectId,
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['mother', 'doctor', 'admin'] },
  createdAt: Date
}
```

### 2. Profile Model
```typescript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'User' },
  name: String,
  pregnancyWeek: Number,
  expectedDeliveryDate: Date,
  bloodGroup: String,
  weight: Number,
  emergencyContactName: String,
  emergencyContactPhone: String
}
```

### 3. Telemetry Session Model
```typescript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'User' },
  startTime: Date,
  endTime: Date,
  aggregatedData: {
    meanHeartRate: Number,
    meanSpO2: Number,
    meanTemperature: Number,
    meanStressScore: Number,
    contractionCount: Number
  }
}
```
*(Note: High-frequency raw sensor data is processed on the phone to save bandwidth; only the aggregated 100-second means and significant events like contractions are synced to the cloud).*
