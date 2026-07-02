# Exercise Recommendation & AI Chat Module

**Stack:** Node.js + Express (backend) · React Native (frontend)

---

## Folder structure

```
── Backend (push to your branch root) ──────────────────
exercise-api/
├── app.js                          ← Express server entry point
├── package.json
├── .env.example                    ← copy to .env and add API key
├── routes/
│   ├── exercise.js                 ← exercise endpoints
│   └── chatbot.js                  ← chat endpoint
├── controllers/
│   ├── exerciseController.js       ← decision logic
│   └── chatbotController.js        ← AI context injection
└── data/
    └── exercises.js                ← all video data

── React Native (copy into your RN project) ────────────
src/
├── services/
│   └── exerciseService.js          ← all API calls
└── screens/
    ├── ExerciseScreen.jsx          ← exercise recommendation UI
    └── ChatScreen.jsx              ← AI chat UI
```

---

## Backend setup

```bash
cd exercise-api
npm install

# Create .env file from template
cp .env.example .env
# Edit .env and add your GROQ_API_KEY (get a key from https://console.groq.com)

npm run dev      # development — auto-reloads on save
npm start        # production
```

Server starts at: `http://localhost:3000`

---

## API endpoints

### POST /api/exercise/recommend
Receive exercise recommendations based on processed sensor data.

**Request body** (all values from your friend's hardware branch):
```json
{
  "heartRate": 82,
  "restingHR": 72,
  "spo2": 98,
  "hrv": 42,
  "temperature": 36.7,
  "gsrConductance": 6.8,
  "stressScore": 65,
  "activityIndex": 0.08,
  "sleepScore": 84,
  "posture": "Standing",
  "fallDetected": false,
  "bellyExpansion": 8.2,
  "mws": 87,
  "pregnancyWeek": 24,
  "minutesSitting": 35
}
```

**Response:**
```json
{
  "success": true,
  "emergency": false,
  "sensorSummary": { ... },
  "reasons": ["Stress score is 65/100 — high. Breathing recommended."],
  "recommendations": [
    {
      "category": "stress_relief",
      "label": "Stress Relief",
      "icon": "🧘",
      "videos": [ { "id": "sr1", "title": "...", "url": "...", "duration": "5-10 min" } ]
    }
  ],
  "totalCategories": 2,
  "totalVideos": 5
}
```

### GET /api/exercise/all
Returns every category and all videos. Use for the Browse screen.

### GET /api/exercise/health
Returns `{ success: true }`. Use to ping the server.

### POST /api/chat/message
Send a user message with sensor context, get a personalised AI reply.

**Request body:**
```json
{
  "message": "Am I doing okay right now?",
  "sensorData": { ... same object as above ... }
}
```

**Response:**
```json
{
  "success": true,
  "reply": "Your heart rate is 82 bpm and MWS is 87/100 — you are doing well today! Your stress score of 65 is a bit high though. Try the box breathing exercise for 5 minutes.",
  "sensorContext": { "heartRate": 82, "stressScore": 65, "mws": 87, "pregnancyWeek": 24 }
}
```

---

## React Native setup

1. Copy `exerciseService.js` → `src/services/exerciseService.js`
2. Copy `ExerciseScreen.jsx` → `src/screens/ExerciseScreen.jsx`
3. Copy `ChatScreen.jsx` → `src/screens/ChatScreen.jsx`

4. Update `BASE_URL` in `exerciseService.js`:

| Testing on | BASE_URL value |
|---|---|
| Android emulator | `http://10.0.2.2:3000` |
| iOS simulator | `http://localhost:3000` |
| Physical device | `http://<your-computer-IP>:3000` |

Find your IP: `ipconfig` on Windows · `ifconfig` on Mac/Linux

5. Add screens to your navigation:
```javascript
// In your Navigator file
import ExerciseScreen from "../screens/ExerciseScreen";
import ChatScreen from "../screens/ChatScreen";

<Stack.Screen name="Exercise" component={ExerciseScreen} />
<Stack.Screen name="Chat" component={ChatScreen} />
```

6. Navigate and pass sensorData:
```javascript
// From anywhere in your app — pass the full processed sensor object
navigation.navigate("Exercise", { sensorData: currentSensorState });
navigation.navigate("Chat", { sensorData: currentSensorState });

// Or if using global state / context:
// ExerciseScreen receives sensorData as a prop directly from your store
```

---

## Decision logic — when is each exercise triggered?

| Condition | Exercise category shown |
|---|---|
| fallDetected = true | Recovery & Rest only (emergency mode) |
| heartRate ≥ 110 OR temperature ≥ 37.8°C | Recovery & Rest only |
| stressScore ≥ 70 | Stress Relief first |
| stressScore ≥ 45 | Stress Relief |
| activityIndex ≤ 0.05 | Light Activity + Stretching |
| activityIndex ≤ 0.15 | Stretching + Light Activity |
| sitting ≥ 30 min OR posture not "Standing" | Posture Correction |
| sleepScore < 60 | Recovery & Rest |
| pregnancyWeek ≥ 28 | Mobility added |
| mws < 60 | Recovery & Rest |
| Every day, all trimesters | Pelvic Floor always |
| All vitals normal | Mobility + Pelvic Floor |

To tune thresholds: edit `THRESHOLDS` object in `controllers/exerciseController.js`

---

## Git — push to your branch

```bash
git checkout -b feature/exercise-recommendation

git add exercise-api/
git commit -m "feat: add exercise recommendation and AI chat backend"

# React Native files
git add src/services/exerciseService.js
git add src/screens/ExerciseScreen.jsx
git add src/screens/ChatScreen.jsx
git commit -m "feat: add exercise and chat screens to React Native"

git push origin feature/exercise-recommendation
```

---

## input data



| Field | Type | Calculated by |
|---|---|---|
| heartRate | number BPM | Peak detection on MAX30102 IR signal |
| spo2 | number % | Red/IR ratio formula on MAX30102 |
| temperature | number °C | Moving average of DS18B20 |
| hrv | number ms | RMSSD of RR intervals |
| restingHR | number BPM | HR averaged when MPU6500 detects no movement |
| gsrConductance | number µS | Converted from GSR ADC reading |
| stressScore | number 0–100 | 0.7×GSR + 0.3×(1–HRV) normalised |
| activityIndex | number 0–1 | sum\|A–1g\|/N from accelerometer |
| sleepScore | number 0–100 | 100 – (movement + stress penalty) |
| posture | string | atan2 roll/pitch from MPU6500 |
| fallDetected | boolean | Free fall < 0.5g then impact > 2.5g |
| bellyExpansion | number % | Flex sensor vs calibration baseline |
| mws | number 0–100 | Weighted formula across all vitals |


