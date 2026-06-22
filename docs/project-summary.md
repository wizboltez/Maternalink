# Maternal Health Monitoring System - Project Summary

## 📋 Overview

The **Maternal Health Monitoring System** is a comprehensive real-time health tracking platform designed to monitor pregnant women's vital signs and provide AI-driven insights for safer pregnancies. The system integrates wearable IoT devices (ESP32-based), a React Native mobile application, and a backend server to deliver continuous health monitoring and emergency alerts.

---

## 🎯 Project Goals

1. **Real-time Monitoring**: Continuous tracking of heart rate, SpO2, temperature, and stress levels
2. **AI-Powered Insights**: Trend analysis, fatigue detection, and risk prediction
3. **Emergency Response**: Immediate alert system with SOS functionality
4. **Doctor Integration**: Phase 5 - Doctor portal for remote consultation
5. **Pregnancy-Specific Care**: Tailored recommendations based on pregnancy trimester

---

## 🏗️ System Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────────┐
│        Mobile App (React Native)            │
│  - Real-time monitoring dashboard           │
│  - Health metrics visualization             │
│  - Emergency SOS button                     │
│  - Daily/Weekly summaries                   │
│  - Pregnancy insights                       │
└─────────────┬───────────────────────────────┘
              │ (REST API + BLE)
              │
┌─────────────┴───────────────────────────────┐
│        Backend Server (Express.js)          │
│  - User authentication & authorization      │
│  - Sensor data aggregation                  │
│  - Alert rule engine                        │
│  - AI insights generation                   │
│  - Doctor management                        │
└─────────────┬───────────────────────────────┘
              │ (MongoDB)
              │
┌─────────────┴───────────────────────────────┐
│        Database (MongoDB)                   │
│  - User profiles                            │
│  - Sensor readings                          │
│  - Daily/Weekly summaries                   │
│  - Alerts & notifications                   │
└─────────────────────────────────────────────┘

         ┌──────────────────────────┐
         │  ESP32 Wearable Device   │
         │  - Heart Rate Monitor    │
         │  - SpO2 Sensor           │
         │  - Temperature Sensor    │
         │  - BLE Broadcaster       │
         └──────────────────────────┘
```

---

## 📁 Project Structure

### `esp32-firmware/`
ESP32 microcontroller firmware for sensor data collection and BLE broadcasting.

**Key Files:**
- `esp32_ble_sensor_broadcast.ino` - Main firmware, handles sensor reading and BLE transmission

**Features:**
- Real-time sensor data collection (HR, SpO2, Temp)
- BLE service broadcasting at 1-second intervals
- Low-power design with adaptive sampling
- Failsafe mechanisms for sensor errors

---

### `mobile-app/` (React Native)
Cross-platform mobile application for iOS and Android.

**Structure:**
```
mobile-app/
├── App.js                      # Root component with auth logic
├── package.json                # Dependencies management
├── src/
│   ├── ble/
│   │   └── bleService.js       # BLE connection & data parsing
│   ├── health/
│   │   └── healthCalculations.js  # Health metrics analysis
│   ├── navigation/
│   │   └── AppNavigator.js     # Tab & stack navigation
│   ├── screens/
│   │   ├── LoginScreen.js      # Authentication
│   │   ├── DashboardScreen.js  # Real-time monitoring
│   │   ├── DailySummaryScreen.js
│   │   ├── WeeklyTrendsScreen.js
│   │   ├── InsightsScreen.js   # AI-driven insights
│   │   └── EmergencyScreen.js  # SOS functionality
│   ├── components/
│   │   ├── MetricCard.js       # Health metric display
│   │   ├── AlertBanner.js      # Alert notifications
│   │   ├── TrendChart.js       # Chart visualization
│   │   └── SOSButton.js        # Emergency button
│   ├── context/
│   │   └── HealthDataContext.js # Global state management
│   ├── api/
│   │   └── apiClient.js        # REST API integration
│   ├── utils/
│   │   └── alertRules.js       # Red/Yellow alert thresholds
│   └── assets/
│       └── icons, images, fonts
```

**Key Technologies:**
- React Native for cross-platform development
- React Navigation for app navigation
- react-native-ble-plx for BLE communication
- Axios for API calls
- Victory/Recharts for data visualization
- Context API for state management

**Main Features:**
- **Real-Time Dashboard**: Live metrics with color-coded severity
- **BLE Connectivity**: Auto-discovery and connection to wearable
- **Alert System**: Critical and warning alerts with notifications
- **Data Visualization**: Daily/weekly trend charts
- **Emergency SOS**: Quick access to emergency contacts
- **Offline Support**: Local data caching with AsyncStorage

---

### `backend/` (Express.js)
Node.js backend server for API management, data persistence, and AI insights.

**Structure:**
```
backend/
├── server.js                   # Express app initialization
├── .env.example                # Environment variables template
├── package.json                # Dependencies
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/
│   │   ├── User.js            # Mother & doctor accounts
│   │   ├── SensorReading.js    # Raw sensor data
│   │   ├── DailySummary.js     # Aggregated daily metrics
│   │   └── Alert.js           # Alert records
│   ├── routes/
│   │   ├── auth.routes.js      # Auth endpoints
│   │   ├── sensorData.routes.js # Sensor data CRUD
│   │   ├── summary.routes.js   # Summary aggregation
│   │   ├── alerts.routes.js    # Alert management
│   │   └── doctor.routes.js    # Doctor portal (Phase 5)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── sensorDataController.js
│   │   ├── summaryController.js
│   │   ├── alertController.js
│   │   └── doctorController.js
│   ├── services/
│   │   ├── alertService.js     # Alert rule engine
│   │   └── aiInsightsService.js # AI trend analysis
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT verification
│   │   └── errorHandler.js     # Global error handler
│   └── utils/
│       └── logger.js           # Winston logger
```

**Key Technologies:**
- Express.js for REST API
- MongoDB with Mongoose ORM
- JWT for authentication
- Winston for logging
- Nodemailer for email notifications

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/sensor-data/reading` | Submit sensor reading |
| GET | `/api/sensor-data/readings` | Get historical readings |
| GET | `/api/sensor-data/latest` | Get latest reading |
| GET | `/api/summary/daily/:date` | Daily health summary |
| GET | `/api/summary/weekly/:week` | Weekly trends |
| GET | `/api/alerts` | Get user alerts |
| POST | `/api/alerts/:id/acknowledge` | Acknowledge alert |
| POST | `/api/doctor/emergency` | Emergency assistance |

---

## 📊 Data Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "mother" | "doctor" | "admin",
  pregnancyWeek: Number (1-42),
  dueDate: Date,
  emergencyContacts: [{
    name, phone, relationship
  }],
  medicalHistory: String,
  baselineHeartRate: Number
}
```

### SensorReading Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  heartRate: Number,
  spO2: Number,
  temperature: Number,
  systolicBP: Number,
  diastolicBP: Number,
  stressLevel: "low" | "medium" | "high",
  timestamp: Date (indexed),
  deviceId: String
}
```

### Alert Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  type: "critical" | "warning",
  metricId: String,
  metricName: String,
  value: Number,
  message: String,
  acknowledged: Boolean,
  acknowledgedAt: Date,
  sentToDoctor: Boolean,
  timestamp: Date
}
```

---

## 🚨 Alert Rules Engine

### Red Alert (Critical) Thresholds
- **Heart Rate**: < 40 bpm or > 130 bpm
- **SpO2**: < 90%
- **Temperature**: < 35.5°C or > 38.5°C
- **Systolic BP**: < 80 mmHg or > 160 mmHg

### Yellow Alert (Warning) Thresholds
- **Heart Rate**: < 60 bpm or > 100 bpm
- **SpO2**: < 95%
- **Temperature**: < 36.5°C or > 37.5°C
- **Systolic BP**: < 90 mmHg or > 140 mmHg

### Trend-Based Alerts
- Consistently elevated HR (avg > 110 bpm for 5+ readings)
- Low SpO2 trend (avg < 94% for 5+ readings)
- Multiple anomalies within time window

---

## 🧠 AI Insights (Phase 4)

### Features
1. **Trend Analysis**
   - Heart rate and SpO2 trend direction
   - Velocity of change
   - Anomaly detection

2. **Fatigue Detection**
   - Heart rate variability analysis
   - Stress level correlation
   - Trimester-specific fatigue scoring

3. **Risk Assessment**
   - Multi-factor risk scoring (0-100)
   - Heart rate stability index
   - Oxygen saturation reliability
   - Temperature trend analysis

4. **Pregnancy-Specific Insights**
   - Trimester-based recommendations
   - Blood volume change expectations
   - Cardiovascular adaptation monitoring

---

## 👨‍⚕️ Doctor Portal (Phase 5)

### Planned Features
- Patient list management
- Remote health monitoring dashboard
- Alert escalation system
- Consultation scheduling
- Prescription management
- Follow-up tracking

---

## 🔐 Security Features

1. **Authentication**
   - JWT-based stateless authentication
   - Token expiry and refresh mechanism
   - Password hashing with bcryptjs

2. **Authorization**
   - Role-based access control (RBAC)
   - User isolation (can only access own data)
   - Doctor access restrictions

3. **Data Protection**
   - HTTPS/TLS encryption
   - MongoDB field-level encryption option
   - CORS configuration
   - Helmet.js for secure headers

4. **Audit Trail**
   - Alert acknowledgment logging
   - Emergency request tracking
   - User activity logging

---

## 📱 Key Screens

### DashboardScreen
- Real-time metrics display (HR, SpO2, Temp, Stress)
- BLE connection status
- Latest alert banner
- Quick emergency SOS button

### DailySummaryScreen
- Average/min/max metrics for the day
- Hourly breakdown chart
- Anomalies detected
- Wellness score

### WeeklyTrendsScreen
- 7-day trend visualization
- Day-over-day comparison
- Trend direction indicators

### InsightsScreen
- AI-generated health insights
- Pregnancy-specific recommendations
- Fatigue level indicator
- Risk assessment summary

### EmergencyScreen
- Large SOS button
- Emergency contacts list
- Automated emergency notification
- Location sharing option

---

## 🛠️ Development Setup

### Prerequisites
- Node.js v14+
- MongoDB v4.4+
- Android Studio / Xcode (for mobile)
- ESP32 development environment (Arduino IDE)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Mobile App Setup
```bash
cd mobile-app
npm install
npx react-native run-android  # or run-ios
```

### ESP32 Setup
1. Install Arduino IDE
2. Install ESP32 board manager
3. Install required libraries: BLEDevice, BLEServer, Wire
4. Upload sketch to ESP32

---

## 📈 Deployment

### Backend Deployment
- **Option 1**: Heroku, Railway, or Render
- **Option 2**: AWS EC2, DigitalOcean, Linode
- **Database**: MongoDB Atlas (cloud) or self-hosted

### Mobile App
- **Android**: Google Play Store
- **iOS**: Apple App Store
- **Build & Release**: EAS Build (Expo) or native build tools

### ESP32 OTA Updates
- Over-the-air firmware updates via AWS IoT Core or similar

---

## 📊 Performance Metrics

### Target Performance
- **API Response Time**: < 200ms
- **BLE Data Latency**: < 1000ms
- **App Load Time**: < 3 seconds
- **Database Query Time**: < 100ms

### Scalability
- Support 10,000+ concurrent users (Phase 2)
- Handle 1 million+ daily readings
- Real-time alert processing < 5 seconds

---

## 🔄 Development Phases

### Phase 1 (Current): MVP
- ✅ ESP32 firmware with BLE broadcast
- ✅ React Native mobile app (basic)
- ✅ Express backend with MongoDB
- ✅ Real-time monitoring & alerts

### Phase 2: Enhancement
- Offline data sync
- Advanced charting
- Multi-user family accounts
- Push notifications

### Phase 3: Integration
- Wearable device management
- Cloud data backup
- Export functionality
- Privacy controls

### Phase 4: AI Intelligence
- ✅ Trend analysis
- ✅ Fatigue detection
- ✅ Risk prediction
- Anomaly detection

### Phase 5: Professional
- Doctor portal
- Hospital integration
- Telemedicine features
- Regulatory compliance (HIPAA, GDPR)

---

## 🧪 Testing Strategy

### Unit Tests
- Jest for backend services
- React Native Testing Library for components

### Integration Tests
- API endpoint testing with Supertest
- BLE service simulation

### E2E Tests
- Detox for mobile app
- UI/UX flow validation

### Performance Tests
- Load testing with Apache JMeter
- Database query optimization

---

## 📋 File Checklist

- [x] ESP32 firmware
- [x] Mobile app package structure
- [x] Backend server setup
- [x] Database models
- [x] API routes & controllers
- [x] Authentication middleware
- [x] Alert service
- [x] AI insights service
- [x] Navigation structure
- [x] Health calculations
- [x] BLE service
- [x] Context API setup
- [x] API client
- [x] Alert rules engine
- [x] UI components
- [ ] Unit tests
- [ ] E2E tests
- [ ] Doctor portal
- [ ] Advanced analytics

---

## 📞 Support & Contact

For questions or contributions, please reach out to the development team.

---

## 📄 License

This project is proprietary and confidential.

---

**Last Updated**: June 2026  
**Project Version**: 1.0.0 (MVP)
