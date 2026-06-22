/**
 * ESP32 BLE Sensor Broadcast
 * Broadcasts heart rate, SpO2, temperature and stress data via BLE
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Wire.h>

// Define the service and characteristic UUIDs
#define SERVICE_UUID "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_SENSOR_UUID "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// Sensor data structure
struct SensorData {
  uint8_t heartRate;
  uint8_t spO2;
  uint8_t tempInt;
  uint8_t tempDec;
  uint8_t stressLevel;
};

class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("Client connected");
  };

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("Client disconnected");
  }
};

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\nStarting BLE Sensor Broadcast");

  // Create BLE Device
  BLEDevice::init("MaternalHealth-Monitor");

  // Create BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create BLE Characteristic
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_SENSOR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );

  // Add descriptor for notifications
  pCharacteristic->addDescriptor(new BLE2902());

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);
  BLEDevice::startAdvertising();

  Serial.println("BLE Server started, waiting for connections...");
}

void loop() {
  // Read sensor data
  SensorData data = readSensors();

  // Prepare data for transmission
  uint8_t txData[5] = {
    data.heartRate,
    data.spO2,
    data.tempInt,
    data.tempDec,
    data.stressLevel
  };

  if (deviceConnected) {
    // Update characteristic value
    pCharacteristic->setValue(txData, 5);
    pCharacteristic->notify();
    Serial.printf("Sent: HR=%d, SpO2=%d, Temp=%d.%d, Stress=%d\n",
      data.heartRate, data.spO2, data.tempInt, data.tempDec, data.stressLevel);
  }

  // Reconnection logic
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    Serial.println("Start advertising");
    oldDeviceConnected = deviceConnected;
  }

  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }

  delay(1000); // Update every second
}

/**
 * Read sensor values
 * Replace with actual sensor reading code
 */
SensorData readSensors() {
  SensorData data;

  // TODO: Replace with actual sensor readings
  // These are dummy values for testing
  data.heartRate = 72 + random(-5, 5);
  data.spO2 = 98;
  data.tempInt = 36;
  data.tempDec = 5;
  data.stressLevel = 2; // 0=low, 1=medium, 2=high

  return data;
}
