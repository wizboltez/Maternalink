/\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*  
 \* Smart Maternal Belt — Unified Firmware  
 \*  
 \* Combines:  
 \*  \- MPU6500        : motion / crash / rollover detection  
 \*  \- DS18B20        : body temperature  
 \*  \- MAX30102       : heart rate \+ SpO2  
 \*  \- Flex1 / Flex2  : contraction / breathing detection  
 \*  \- GSR            : skin conductance  
 \*  
 \* Output: single JSON string, sent over Bluetooth Classic  
 \*         (SerialBT) once per second, mirrored to USB Serial  
 \*         for debugging.  
 \*  
 \* Wiring:  
 \*   MPU6500   \-\> Wire   (SDA=21, SCL=22)  
 \*   MAX30102  \-\> Wire1  (SDA=18, SCL=19)   \<- separate bus  
 \*   DS18B20   \-\> GPIO4  (OneWire, needs 4.7k pull-up to 3V3)  
 \*   Flex1     \-\> GPIO35 (ADC1\_CH7, input only)  
 \*   Flex2     \-\> GPIO32 (ADC1\_CH4)  
 \*   GSR       \-\> GPIO34 (ADC1\_CH6, input only)  
 \*  
 \* Required libraries (Library Manager):  
 \*   \- OneWire  
 \*   \- DallasTemperature  
 \*   \- SparkFun MAX3010x Pulse and Proximity Sensor Library  
 \*   \- BluetoothSerial (bundled with ESP32 board package —  
 \*     only works on ESP32 boards with Classic Bluetooth,  
 \*     e.g. NOT ESP32-C3/S3/C6)  
 \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*/

\#include \<Wire.h\>  
\#include \<math.h\>  
\#include \<OneWire.h\>  
\#include \<DallasTemperature.h\>  
\#include \<MAX30105.h\>  
\#include "spo2\_algorithm.h"  
\#include "BluetoothSerial.h"

// \============================================================  
// Bluetooth  
// \============================================================  
BluetoothSerial SerialBT;

// \============================================================  
// MPU6500 (motion sensor) — on default Wire bus  
// \============================================================  
\#define MPU\_ADDR      0x68  
\#define ACCEL\_XOUT\_H  0x3B  
\#define PWR\_MGMT\_1    0x6B  
\#define ACCEL\_CONFIG  0x1C  
\#define GYRO\_CONFIG   0x1B

int16\_t rawAx, rawAy, rawAz, rawTemp, rawGx, rawGy, rawGz;  
float accOffsetX \= 0, accOffsetY \= 0, accOffsetZ \= 0;  
float gyroOffsetX \= 0, gyroOffsetY \= 0, gyroOffsetZ \= 0;  
float Ax, Ay, Az, Gx, Gy, Gz;  
float accMagnitude \= 0, gyroMagnitude \= 0;  
float previousAccMagnitude \= 0, jerk \= 0;  
float pitch \= 0, roll \= 0;  
float filteredAcc \= 1.0, filteredGyro \= 0.0;  
String motionState \= "IDLE";  
unsigned long mpuPrevTime \= 0;

const float IDLE\_GYRO        \= 3.0;  
const float MOVING\_ACC       \= 0.15;  
const float TURNING\_GYRO     \= 40.0;  
const float HARD\_BRAKE\_ACC   \= \-0.80;  
const float HARD\_ACCEL\_ACC   \= 0.80;  
const float JERK\_THRESHOLD   \= 8.0;  
const float CRASH\_ACC        \= 4.0;  
const float CRASH\_GYRO       \= 250.0;  
const float ROLLOVER\_ANGLE   \= 65.0;

// \============================================================  
// MAX30102 (heart rate / SpO2) — on separate I2C bus (Wire1)  
// \============================================================  
TwoWire HeartWire \= TwoWire(1);  
MAX30105 particleSensor;

\#define HR\_BUFFER\_SIZE 100  
uint32\_t irBuffer\[HR\_BUFFER\_SIZE\];  
uint32\_t redBuffer\[HR\_BUFFER\_SIZE\];  
int32\_t spo2Value \= 0;  
int8\_t  spo2Valid \= 0;  
int32\_t heartRateValue \= 0;  
int8\_t  hrValid \= 0;  
bool maxFound \= false;

// \============================================================  
// DS18B20 (temperature)  
// \============================================================  
\#define ONE\_WIRE\_BUS 4  
OneWire oneWire(ONE\_WIRE\_BUS);  
DallasTemperature tempSensors(\&oneWire);  
float tempC \= \-127.0;  
bool tempFound \= false;

// \============================================================  
// Flex sensors  
// \============================================================  
\#define FLEX1\_PIN 35  
\#define FLEX2\_PIN 32  
int flexBaseline1 \= 0, flexBaseline2 \= 0;  
int flex1 \= 0, flex2 \= 0, flexDelta1 \= 0, flexDelta2 \= 0, flexAvgDelta \= 0;  
String flexStatus \= "NORMAL";

const int BREATH\_THRESHOLD      \= 50;  
const int TIGHT\_THRESHOLD       \= 150;  
const int CONTRACTION\_THRESHOLD \= 300;

// \============================================================  
// GSR sensor  
// \============================================================  
\#define GSR\_PIN 34  
int gsrBaseline \= 0;  
int gsrValue \= 0, gsrChange \= 0;

// \============================================================  
// Timing  
// \============================================================  
unsigned long lastMpuRead   \= 0;  
unsigned long lastFlexRead  \= 0;  
unsigned long lastTempRead  \= 0;  
unsigned long lastHrRead    \= 0;  
unsigned long lastJsonSend  \= 0;

const unsigned long MPU\_INTERVAL   \= 100;   // ms  
const unsigned long FLEX\_INTERVAL  \= 300;   // ms  
const unsigned long TEMP\_INTERVAL  \= 1000;  // ms  
const unsigned long HR\_INTERVAL    \= 2000;  // ms (buffer collection takes \~1s)  
const unsigned long JSON\_INTERVAL  \= 1000;  // ms

// \============================================================  
// MPU6500 helper functions  
// \============================================================  
void writeRegister(byte reg, byte value) {  
  Wire.beginTransmission(MPU\_ADDR);  
  Wire.write(reg);  
  Wire.write(value);  
  Wire.endTransmission();  
}

void setupMPU() {  
  writeRegister(PWR\_MGMT\_1, 0x00);  
  delay(100);  
  writeRegister(ACCEL\_CONFIG, 0x00);  // ±2g  
  writeRegister(GYRO\_CONFIG, 0x00);   // ±250 deg/s  
}

void readMPU() {  
  Wire.beginTransmission(MPU\_ADDR);  
  Wire.write(ACCEL\_XOUT\_H);  
  Wire.endTransmission(false);  
  Wire.requestFrom(MPU\_ADDR, 14, true);

  rawAx \= Wire.read() \<\< 8 | Wire.read();  
  rawAy \= Wire.read() \<\< 8 | Wire.read();  
  rawAz \= Wire.read() \<\< 8 | Wire.read();  
  rawTemp \= Wire.read() \<\< 8 | Wire.read();  
  rawGx \= Wire.read() \<\< 8 | Wire.read();  
  rawGy \= Wire.read() \<\< 8 | Wire.read();  
  rawGz \= Wire.read() \<\< 8 | Wire.read();  
}

void calibrateMPU() {  
  Serial.println("Calibrating MPU6500 — keep still...");  
  delay(3000);

  long ax \= 0, ay \= 0, az \= 0, gx \= 0, gy \= 0, gz \= 0;  
  const int samples \= 1000;

  for (int i \= 0; i \< samples; i++) {  
    readMPU();  
    ax \+= rawAx;  
    ay \+= rawAy;  
    az \+= rawAz \- 16384;  
    gx \+= rawGx;  
    gy \+= rawGy;  
    gz \+= rawGz;  
    delay(2);  
  }

  accOffsetX \= (float)ax / samples;  
  accOffsetY \= (float)ay / samples;  
  accOffsetZ \= (float)az / samples;  
  gyroOffsetX \= (float)gx / samples;  
  gyroOffsetY \= (float)gy / samples;  
  gyroOffsetZ \= (float)gz / samples;

  Serial.println("MPU6500 calibration complete.");  
}

void convertMPUValues() {  
  Ax \= (rawAx \- accOffsetX) / 16384.0;  
  Ay \= (rawAy \- accOffsetY) / 16384.0;  
  Az \= (rawAz \- accOffsetZ) / 16384.0;  
  Gx \= (rawGx \- gyroOffsetX) / 131.0;  
  Gy \= (rawGy \- gyroOffsetY) / 131.0;  
  Gz \= (rawGz \- gyroOffsetZ) / 131.0;  
}

void updateMotion() {  
  readMPU();  
  convertMPUValues();

  accMagnitude \= sqrt(Ax \* Ax \+ Ay \* Ay \+ Az \* Az);  
  gyroMagnitude \= sqrt(Gx \* Gx \+ Gy \* Gy \+ Gz \* Gz);

  filteredAcc  \= 0.90 \* filteredAcc  \+ 0.10 \* accMagnitude;  
  filteredGyro \= 0.90 \* filteredGyro \+ 0.10 \* gyroMagnitude;

  unsigned long now \= millis();  
  float dt \= (now \- mpuPrevTime) / 1000.0;  
  if (dt \> 0) {  
    jerk \= fabs(filteredAcc \- previousAccMagnitude) / dt;  
    previousAccMagnitude \= filteredAcc;  
  }  
  mpuPrevTime \= now;

  pitch \= atan2(-Ax, sqrt(Ay \* Ay \+ Az \* Az)) \* 180.0 / PI;  
  roll  \= atan2(Ay, Az) \* 180.0 / PI;

  if (filteredAcc \> CRASH\_ACC || filteredGyro \> CRASH\_GYRO) {  
    motionState \= "POSSIBLE\_CRASH";  
  } else if (fabs(roll) \> ROLLOVER\_ANGLE || fabs(pitch) \> ROLLOVER\_ANGLE) {  
    motionState \= "ROLLOVER";  
  } else if (jerk \> JERK\_THRESHOLD) {  
    motionState \= "JERK\_DETECTED";  
  } else if (filteredGyro \> TURNING\_GYRO) {  
    motionState \= "TURNING";  
  } else if (Ax \< HARD\_BRAKE\_ACC) {  
    motionState \= "HARD\_BRAKING";  
  } else if (Ax \> HARD\_ACCEL\_ACC) {  
    motionState \= "HARD\_ACCELERATION";  
  } else if (fabs(filteredAcc \- 1.0) \> MOVING\_ACC) {  
    motionState \= "MOVING";  
  } else if (filteredGyro \< IDLE\_GYRO && fabs(filteredAcc \- 1.0) \< 0.05) {  
    motionState \= "IDLE";  
  } else {  
    motionState \= "NORMAL";  
  }  
}

// \============================================================  
// Flex \+ GSR  
// \============================================================  
void calibrateFlexAndGSR() {  
  Serial.println("Calibrating Flex \+ GSR sensors — wear belt, stay still...");  
  const int samples \= 200;  
  long sum1 \= 0, sum2 \= 0, sumGsr \= 0;

  for (int i \= 0; i \< samples; i++) {  
    sum1 \+= analogRead(FLEX1\_PIN);  
    sum2 \+= analogRead(FLEX2\_PIN);  
    sumGsr \+= analogRead(GSR\_PIN);  
    delay(50);  
  }

  flexBaseline1 \= sum1 / samples;  
  flexBaseline2 \= sum2 / samples;  
  gsrBaseline   \= sumGsr / samples;

  Serial.println("Flex \+ GSR calibration complete.");  
}

void updateFlexAndGSR() {  
  flex1 \= analogRead(FLEX1\_PIN);  
  flex2 \= analogRead(FLEX2\_PIN);  
  flexDelta1 \= abs(flex1 \- flexBaseline1);  
  flexDelta2 \= abs(flex2 \- flexBaseline2);  
  flexAvgDelta \= (flexDelta1 \+ flexDelta2) / 2;

  if (flexAvgDelta \>= CONTRACTION\_THRESHOLD) flexStatus \= "POSSIBLE\_CONTRACTION";  
  else if (flexAvgDelta \>= TIGHT\_THRESHOLD)   flexStatus \= "ABDOMINAL\_TIGHTENING";  
  else if (flexAvgDelta \>= BREATH\_THRESHOLD)  flexStatus \= "DEEP\_BREATHING";  
  else                                        flexStatus \= "NORMAL";

  gsrValue \= analogRead(GSR\_PIN);  
  gsrChange \= abs(gsrValue \- gsrBaseline);  
}

// \============================================================  
// Temperature  
// \============================================================  
void updateTemperature() {  
  tempSensors.requestTemperatures();  
  float t \= tempSensors.getTempCByIndex(0);  
  if (t \!= DEVICE\_DISCONNECTED\_C) {  
    tempC \= t;  
  } else {  
    Serial.println("DS18B20: not responding (check pull-up resistor / wiring / pin 4).");  
  }  
}

// \============================================================  
// Heart rate / SpO2  
// Collects one full buffer (\~1s) then runs the algorithm.  
// \============================================================  
void updateHeartRate() {  
  if (\!maxFound) return;

  for (byte i \= 0; i \< HR\_BUFFER\_SIZE; i++) {  
    while (particleSensor.available() \== false) {  
      particleSensor.check();  
    }  
    redBuffer\[i\] \= particleSensor.getRed();  
    irBuffer\[i\] \= particleSensor.getIR();  
    particleSensor.nextSample();  
  }

  maxim\_heart\_rate\_and\_oxygen\_saturation(  
    irBuffer, HR\_BUFFER\_SIZE, redBuffer,  
    \&spo2Value, \&spo2Valid, \&heartRateValue, \&hrValid  
  );  
}

// \============================================================  
// JSON build \+ send  
// \============================================================  
void sendJSON() {  
  char buf\[480\];

  snprintf(buf, sizeof(buf),  
    "{"  
    "\\"heartRate\\":%ld,\\"heartRateValid\\":%d,"  
    "\\"spo2\\":%ld,\\"spo2Valid\\":%d,"  
    "\\"tempC\\":%.2f,"  
    "\\"flex1\\":%d,\\"flex2\\":%d,\\"flexStatus\\":\\"%s\\","  
    "\\"gsr\\":%d,\\"gsrChange\\":%d,"  
    "\\"motion\\":\\"%s\\",\\"pitch\\":%.2f,\\"roll\\":%.2f,\\"jerk\\":%.2f,"  
    "\\"rawAx\\":%d,\\"rawAy\\":%d,\\"rawAz\\":%d,"  
    "\\"rawGx\\":%d,\\"rawGy\\":%d,\\"rawGz\\":%d"  
    "}",  
    (long)heartRateValue, hrValid,  
    (long)spo2Value, spo2Valid,  
    tempC,  
    flex1, flex2, flexStatus.c\_str(),  
    gsrValue, gsrChange,  
    motionState.c\_str(), pitch, roll, jerk,  
    rawAx, rawAy, rawAz,  
    rawGx, rawGy, rawGz  
  );

  Serial.println(buf);      // USB debug  
  SerialBT.println(buf);    // \-\> mobile device  
}

// \============================================================  
// Setup  
// \============================================================  
void setup() {  
  Serial.begin(115200);  
  delay(500);

  if (\!SerialBT.begin("SmartMaternalBelt")) {  
    Serial.println("Bluetooth init failed\!");  
  } else {  
    Serial.println("Bluetooth started as 'SmartMaternalBelt'");  
  }

  // MPU6500 bus  
  Wire.begin(21, 22);  
  setupMPU();  
  calibrateMPU();

  // MAX30102 bus (separate I2C)  
  HeartWire.begin(18, 19);  
  if (particleSensor.begin(HeartWire, I2C\_SPEED\_STANDARD)) {  
    maxFound \= true;  
    particleSensor.setup();  
    Serial.println("MAX30102 initialized.");  
  } else {  
    Serial.println("MAX30102 not found — heart rate/SpO2 disabled.");  
  }

  // DS18B20  
  tempSensors.begin();  
  tempFound \= tempSensors.getDeviceCount() \> 0;  
  if (\!tempFound) Serial.println("DS18B20 not found — temperature disabled.");

  // Flex \+ GSR  
  analogReadResolution(12);  
  calibrateFlexAndGSR();

  unsigned long now \= millis();  
  mpuPrevTime \= lastMpuRead \= lastFlexRead \= lastTempRead \= lastHrRead \= lastJsonSend \= now;

  Serial.println("Setup complete. Streaming JSON over Bluetooth...");  
}

// \============================================================  
// Loop  
// \============================================================  
void loop() {  
  unsigned long now \= millis();

  if (now \- lastMpuRead \>= MPU\_INTERVAL) {  
    lastMpuRead \= now;  
    updateMotion();  
  }

  if (now \- lastFlexRead \>= FLEX\_INTERVAL) {  
    lastFlexRead \= now;  
    updateFlexAndGSR();  
  }

  if (now \- lastTempRead \>= TEMP\_INTERVAL) {  
    lastTempRead \= now;  
    updateTemperature();  
  }

  if (maxFound && now \- lastHrRead \>= HR\_INTERVAL) {  
    lastHrRead \= now;  
    updateHeartRate();   // blocks \~1s while collecting samples  
  }

  now \= millis();  
  if (now \- lastJsonSend \>= JSON\_INTERVAL) {  
    lastJsonSend \= now;  
    sendJSON();  
  }  
}

